// videojs-sloe-plugin

videojs.sloelib = (function() {
    var sloelib = {
        fromFraction: function(frac_str) {
            var elems = String(frac_str).split('/');
            if (elems.length === 1) {
                return elems[0];
            } else {
                return elems[0] / elems[1];
            }
        },

        getFrame: function(player, fps) {
            var current_time = player.currentTime();
            var nearest_frame = Math.round(current_time * fps);
            return nearest_frame;
        },

        goToFrame: function(player, fps, frame) {
            var new_time = Math.round(frame) / fps;
            player.currentTime(new_time);
        },

        frameStep: function(player, fps, step) {
            var current_frame = videojs.sloelib.getFrame(player, fps);
            var new_frame = Math.round(current_frame + step);

            videojs.sloelib.goToFrame(player, fps, new_frame);
        },

        markerTip: function(marker) {
            var speed_factor = marker.sloedata.speed_factor;
            var header = 'Time to next: ';
            var divisor = 1;
            var next_marker = marker.sloe_markers.getNext(marker, marker.type);
            var is_last_marker = !next_marker;
            var other_type = (marker.type === 'CATCH' ? 'EXTR.' : 'CATCH');
            var next_other_marker = marker.sloe_markers.getNext(marker, other_type);

            if (next_marker && next_other_marker && next_other_marker.time > next_marker.time) {
                // The 'other' marker should appear before the next mark of same type, so if it isn't, ignore it
                next_other_marker = false;
            }
            if (is_last_marker) {
                // Last marker so show averages
                next_marker = marker;
                var marker = marker.sloe_markers.getFirst(marker.type);
                divisor = marker.sloe_markers.getNumberOf(marker.type) - 1;
                header = 'Average of ' + divisor + '<br/>';
            }
            if (divisor > 0) {
                var interval = (next_marker.time - marker.time) * speed_factor / divisor;
                var frame_interval = (next_marker.sloe_frame - marker.sloe_frame) / divisor;
                content = header + interval.toFixed(2) + 's<br/>=> Rate ' + (60 / interval).toFixed(2) + '<br/>'
                if (!is_last_marker && next_other_marker && divisor === 1) {
                    var to_other_interval = (next_other_marker.time - marker.time) * speed_factor;
                    var other_to_next_interval = (next_marker.time - next_other_marker.time) * speed_factor;
                    if (marker.type === 'CATCH') {
                        drive_interval = to_other_interval;
                        recovery_interval = other_to_next_interval;
                    } else {
                        drive_interval = other_to_next_interval;
                        recovery_interval = to_other_interval;
                    }
                    if (drive_interval > 0) {
                        content += 'Drive: ' + drive_interval.toFixed(2) + 's<br/>';
                    }
                    if (recovery_interval > 0) {
                        content += 'Recovery: ' + recovery_interval.toFixed(2) + 's<br/>';
                        if (drive_interval > 0) {
                            var ratio = recovery_interval / drive_interval;
                            content += 'Ratio: 1:' + ratio.toFixed(2) + '<br/>';
                        }
                    }
                }

                content += frame_interval.toFixed(2) + 'f';
                return content;
            } else {
                return 'Place another<br/>marker for<br/>timing info';
            }
        },

        syncToFrame: function(player, fps) {
            var current_time = player.currentTime();
            // Adjustment gives lowest frame-steps-again artefacts upon pause
            var nearest_frame = Math.round((current_time * fps) - 0.40);
            var synced_time = nearest_frame / fps;
            player.currentTime(synced_time);
            return synced_time;
        },

        frameNudgeButtonEl: function(text) {
            return '<div class="vjs-control-content" style="font-size: 11px; line-height: 28px; cursor:pointer;"><span class="vjs-sloe-frame-nudge">' + text + '</span></div>';
        },

        frameNumberButtonEl: function(frame) {
            var rounded_frame = frame.toFixed(1);
            return '<div class="vjs-control-content" style="font-size: 11px; line-height: 28px;"><span class="vjs-sloe-frame-number">f=' + rounded_frame + '</span></div>';
        },

        markButtonEl: function(is_mark, type) {
            var content = (is_mark ? 'MARK<br/>' : 'UNMARK<br/>') + type;
            return '<div class="vjs-control-content" style="font-size: 11px; line-height: 14px; cursor:pointer;"><span class="vjs-sloe-mark">' + content + '</span></div>';
        },

        unescapeHtml: function(escaped) {
            var el = document.createElement('div');
            el.innerHTML = escaped;
            return el.childNodes.length === 0 ? "" : el.childNodes[0].nodeValue;
        },

        updateInfo: function() {
            var player = videojs('sloe-video-main');
            var current_time = player.currentTime();
            var markers = player.markers;

            var collect = videojs.sloelib.marker_collection;
            if (!collect) {
                return; // Not initialsied yet
            }
            collect.reset();

            var length = markers.getNumberOf();
            for (i = 0; i < length; i++) {
                var marker = markers.get(i);
                var time_diff = marker.time - current_time;
                collect.add({
                    id: i+1,
                    type: marker.type,
                    time: marker.time * marker.sloedata.speed_factor,
                    dcurrent: time_diff * marker.sloedata.speed_factor
                });
            }

            $('#sloe-marker-table').append(videojs.sloelib.marker_grid.render().el);
        },

        encodeMarkers: function(markers) {
            var nodes = [];
            var counts = {};
            var length = markers.getNumberOf();
            for (i = 0; i < length; i++) {
                var marker = markers.get(i);
                var tag = marker.type[0];
                counts[tag] = (counts[tag] || 0) + 1;

                nodes.push(tag + counts[tag] + '=' + (marker.time * marker.sloedata.speed_factor).toFixed(3));
            }

            return nodes;
        },

        updateLink: function() {
            var root_url = videojs.options.sloestatic.url;
            var content = root_url;
            var params = [];
            var player = videojs('sloe-video-main');
            if ($('#sloe-link-markers').prop("checked")) {
                params = params.concat(videojs.sloelib.encodeMarkers(player.markers));
            }
            if ($('#sloe-link-size').prop("checked")) {
                params.push('size=' + videojs.options.sloestatic.size);
            }
            if ($('#sloe-link-current').prop("checked")) {
                params.push('current=' + (player.currentTime() * player.sloedata.speed_factor).toFixed(3));
            }

            if (params.length > 0) {
                content += '?';
            }
            content += params.join('&');
            $('#sloe-link-url').val(content);
        },

        sloeUpdateHandler: function() {
            videojs.sloelib.updateLink();
            videojs.sloelib.updateInfo();
        },

        attachHandlers: function() {
            $('#sloe-video-info').on('sloeUpdate', videojs.sloelib.sloeUpdateHandler);

            $('#sloe-link-reset-button').click(function() {
                $('#sloe-link-url').val(videojs.options.sloestatic.url);
                $('#sloe-video-info').trigger('sloeUpdate');
            });
            ['markers', 'size', 'current'].forEach(function(name) {
                $('#sloe-link-' + name).click(function() {
                    $('#sloe-video-info').trigger('sloeUpdate');
                });
            });

            $('#sloe-link-test-button').click(function() {
                var url = $('#sloe-link-url').val();
                window.open(url, '_blank');
            });
            $('#sloe-link-url').on("focus", function() {
                this.select();
            });
        },

        newTime: function() {
            if ($('#sloe-link-current').prop("checked")) {
                videojs.sloelib.updateLink();
            }

            videojs.sloelib.updateInfo();
        },

        initModels: function() {
            videojs.sloelib.Marker = Backbone.Model.extend({});

            videojs.sloelib.Markers = Backbone.Collection.extend({
                model: videojs.sloelib.Marker,
                url: "test.json"
            });

            videojs.sloelib.marker_collection = new videojs.sloelib.Markers();
        },

        initGrids: function() {
            var columns = [{
                name: "id",
                label: "ID",
                editable: false,
                cell: "string"
            }, {
                name: "type",
                label: "Type",
                editable: true,
                cell: "string"
            }, {
                name: "time",
                label: "Time",
                editable: true,
                cell: Backgrid.NumberCell.extend({
                    decimals: 3
                })
            }, {
                name: "dcurrent",
                label: "Delta to current",
                editable: false,
                cell: Backgrid.NumberCell.extend({
                    decimals: 3
                })
            }];

            videojs.sloelib.marker_grid = new Backgrid.Grid({
                columns: columns,
                collection: videojs.sloelib.marker_collection
            });
        }
    };

    return sloelib;
}());


function sloe(options) {
    var player = this;

    videojs.SloeSeekBar = videojs.SeekBar.extend({
        init: function(player, options) {
            videojs.SeekBar.call(this, player, options);
        }
    });

    videojs.SloeSeekBar.prototype.onMouseUp = function(event) {
        videojs.SeekBar.prototype.onMouseUp.call(this, event);
        videojs.sloelib.syncToFrame(player, player.sloedata.fps);
    };

    controlBar = player.getChild('controlBar');
    progressControl = controlBar.getChild('progressControl');

    progressControl.removeChild('seekBar');
    progressControl.addChild('sloeSeekBar');

    videojs.SloeFrameNumberButton = videojs.Button.extend({
        init: function(player, options) {
            videojs.Button.call(this, player, options);
            this.width(60, true);
            this.on(player, 'timeupdate', this.onTimeUpdate);
            this.on(player, 'pause', this.onPause);
            this.on(player, 'seeked', this.onSeeked);
        },
    });

    videojs.SloeFrameNumberButton.prototype.onClick = function() {
        var time = player.currentTime();
        this.el().innerHTML = time*30;
    }

    videojs.SloeFrameNumberButton.prototype.onTimeUpdate = function() {
        var time = player.currentTime();
        this.el().innerHTML = videojs.sloelib.frameNumberButtonEl(time * player.sloedata.fps);
    }

    videojs.SloeFrameNumberButton.prototype.onPause = function() {
        videojs.sloelib.syncToFrame(player, player.sloedata.fps);
        videojs.sloelib.newTime();
    }

    videojs.SloeFrameNumberButton.prototype.onSeeked = function() {
        videojs.sloelib.newTime();
    }

    videojs.SloeMarkButton = videojs.Button.extend({
        init: function(player, options) {
            videojs.Button.call(this, player, options);
            this.width(48, true);
            this.markers = options.markers;
            this.mark_type = options.mark_type;
            this.setMark(true);
            this.on(player, 'pause', this.onPause);
            this.on(player, 'play', this.onPlay);
            this.on(player, 'seeked', this.onPause);
        },
    });

    videojs.SloeMarkButton.prototype.onClick = function() {
        if (this.is_mark) {
            var current_frame = videojs.sloelib.getFrame(player, player.sloedata.fps);
            var colour = (this.mark_type === 'CATCH') ? 'red' : 'lightgreen';
            this.markers.setMarkerStyle({
                'width':'7px',
                'border-radius': '0%',
                'background-color': colour
            });
            this.markers.add([{
                sloedata: player.sloedata,
                sloe_frame: current_frame,
                sloe_markers: this.markers,
                time: player.currentTime(),
                type: this.mark_type
            }]);
        } else {
            if (this.markers.getNumberOf(this.mark_type) > 0) {
                this.markers.remove([this.markers.getNearest(player.currentTime(), this.mark_type)]);
            }
        }

        if (player.paused()) {
            this.deriveMarkState();
        } else {
            this.setMark(true);
        }
        $('#sloe-video-info').trigger('sloeUpdate');
    }

    videojs.SloeMarkButton.prototype.setMark = function(is_mark) {
        this.is_mark = is_mark;
        this.el().innerHTML = videojs.sloelib.markButtonEl(is_mark, this.mark_type);
    }

    videojs.SloeMarkButton.prototype.deriveMarkState = function() {
        var nearest_marker = this.markers.get(this.markers.getNearest(player.currentTime(), this.mark_type));
        var is_mark = true;
        if (nearest_marker) {
            distance = Math.abs(player.currentTime() - nearest_marker.time);
            if (distance < 1) {
                is_mark = false;
            }
        }
        this.setMark(is_mark);
    }

    videojs.SloeMarkButton.prototype.onPause = function() {
        this.deriveMarkState();
    }

    videojs.SloeMarkButton.prototype.onPlay = function() {
        this.setMark(true);
    }

    player.ready(function() {
        player.pause();
        player.sloedata = {
            fps: videojs.sloelib.fromFraction(options.fps),
            speed_factor: videojs.sloelib.fromFraction(options.speed_factor)
        };

        player.controlBar.addChild(
            new videojs.SloeFrameNumberButton(player, {
                el: videojs.Component.prototype.createEl(null, {
                    className: 'vjs-res-button vjs-control',
                    innerHTML: videojs.sloelib.frameNumberButtonEl(0),
                    value: '',
                    role: 'button'
                    })
            })
        );

        player.markers({
            breakOverlay:{
               display: false
            },
            markerTip: {
                display: true,
                text: videojs.sloelib.markerTip
            },
            markers: [
            ]
        });

        player.controlBar.addChild(
            new videojs.SloeMarkButton(player, {
                el: videojs.Component.prototype.createEl(null, {
                    className: 'vjs-res-button vjs-control',
                    value: '',
                    role: 'button'
                    }),
                mark_type: 'CATCH',
                markers: player.markers
            })
        );

        player.controlBar.addChild(
            new videojs.SloeMarkButton(player, {
                el: videojs.Component.prototype.createEl(null, {
                    className: 'vjs-res-button vjs-control',
                    value: '',
                    role: 'button'
                    }),
                mark_type: 'EXTR.',
                markers: player.markers
            })
        );

    });
};
videojs.plugin('sloe', sloe);

function sloenudge(options) {
    var player = this;

    videojs.SloeNudgeButton = videojs.Button.extend({
        init: function(player, options) {
            videojs.Button.call(this, player, options);
            this.width(6 + 5 * options.step.length, true);
            this.el().innerHTML = videojs.sloelib.frameNudgeButtonEl(options.step)
            if (/f$/.test(options.step)) {
                this.frame_step = parseFloat(options.step);
            } else {
                this.time_step =  parseFloat(options.step);
            }
            this.on('mousedown', this.onMouseDown);
            this.on('mouseup', this.onMouseUp);
            this.on(player, 'seeked', this.onSeeked);
        },
    });

    videojs.SloeNudgeButton.prototype.executeStep = function() {
        if (this.frame_step) {
            videojs.sloelib.frameStep(player, player.sloenudgedata.fps, this.frame_step)
        }
        if (this.time_step) {
            videojs.sloelib.frameStep(player, player.sloenudgedata.fps, this.time_step * player.sloenudgedata.fps / player.sloenudgedata.speed_factor)
        }
        this.last_step_time = Date.now();
        videojs.sloelib.newTime(player);
    }

    videojs.SloeNudgeButton.prototype.onMouseDown = function() {
        player.pause();
        this.executeStep();
        this.mouse_down = true;
    }

    videojs.SloeNudgeButton.prototype.onMouseUp = function() {
        this.mouse_down = false;
        if (this.repeat_timer) {
            window.clearTimeout(this.repeat_timer);
            this.repeat_timer = false;
        }
    }

    videojs.SloeNudgeButton.prototype.onSeeked = function() {
        if (this.mouse_down) {
            var time_to_next = this.last_step_time - Date.now() + 1000;
            if (time_to_next <= 0) {
                this.executeStep();
            } else {
                var this_button = this;
                var timer_fn = function() {
                    this_button.executeStep();
                }
                this.repeat_timer = window.setTimeout(timer_fn, time_to_next);
            }
        }
    }

    player.ready(function() {
        player.sloenudgedata = {
            fps: videojs.sloelib.fromFraction(options.fps),
            speed_factor: videojs.sloelib.fromFraction(options.speed_factor)
        };
        options.steps.forEach(function(step) {
            player.controlBar.addChild(
                new videojs.SloeNudgeButton(player, {
                    el: videojs.Component.prototype.createEl(null, {
                        className: 'vjs-res-button vjs-control',
                        value: '',
                        role: 'button'
                    }),
                    step: step
                })
            );
        });
    });

};

videojs.plugin('sloenudge', sloenudge);

$('document').ready(function() {
    videojs.sloelib.initModels();
    videojs.sloelib.initGrids();
    videojs.sloelib.attachHandlers();

    // $('#sloe-video-info').trigger('sloeUpdate');
})
