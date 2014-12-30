// videojs-sloe-plugin

videojs.sloelib = (function() {
    var sloelib = {
        fromFraction: function(frac_str) {
            var elems = String(frac_str).split('/');
            if (elems.length == 1) {
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

        markerTip: function(marker) {
            var speed_factor = marker.sloedata.speed_factor;
            var header = 'Time to next: ';
            var divisor = 1;
            var next_marker = marker.sloe_markers.getNext(marker, marker.type);
            var other_type = (marker.type == 'CATCH' ? 'EXTR.' : 'CATCH');
            var next_other_marker = marker.sloe_markers.getNext(marker, other_type);

            if (next_marker && next_other_marker && next_other_marker.time > next_marker.time) {
                // The 'other' marker should appear before the next mark of some time, so if it isn't, ignore it
                next_other_marker = false;
            }
            if (!next_marker) {
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
                if (next_other_marker && divisor == 1) {
                    var to_other_interval = (next_other_marker.time - marker.time) * speed_factor;
                    var other_to_next_interval = (next_marker.time - next_other_marker.time) * speed_factor;
                    if (marker.type == 'CATCH') {
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
                            if (ratio < 1) {
                                content += 'Ratio: <span style="color:#ff6060">1:' + ratio.toFixed(2) + '</span><br/>';
                            } else {
                                content += 'Ratio: 1:' + ratio.toFixed(2) + '<br/>';
                            }
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
            var nearest_frame = Math.round((current_time * fps) - 0.5);
            var synced_time = nearest_frame / fps;
            player.currentTime(synced_time);
            return synced_time;
        },

        frameButtonEl: function(frame) {
            var rounded_frame = frame.toFixed(3);
            return '<div class="vjs-control-content" style="font-size: 11px; line-height: 28px;"><span class="vjs-sloe-frame">' + rounded_frame + '</span></div>';
        },

        markButtonEl: function(is_mark, type) {
            var content = (is_mark ? 'MARK<br/>' : 'UNMARK<br/>') + type;
            return '<div class="vjs-control-content" style="font-size: 11px; line-height: 14px;"><span class="vjs-sloe-mark">' + content + '</span></div>';
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

    videojs.SloeFrameButton = videojs.Button.extend({
        init: function(player, options) {
            videojs.Button.call(this, player, options);
            this.on(player, 'timeupdate', this.onTimeUpdate);
            this.on(player, 'pause', this.onPause);
        },
    });

    videojs.SloeFrameButton.prototype.onClick = function() {
        var time = player.currentTime();
        this.el().innerHTML = time*30;
    }

    videojs.SloeFrameButton.prototype.onTimeUpdate = function() {
        var time = player.currentTime();
        this.el().innerHTML = videojs.sloelib.frameButtonEl(time * player.sloedata.fps);
    }

    videojs.SloeFrameButton.prototype.onPause = function() {
        videojs.sloelib.syncToFrame(player, player.sloedata.fps);
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
            var colour = (this.mark_type == 'CATCH') ? 'red' : 'lightgreen';
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
            new videojs.SloeFrameButton(player, {
                el: videojs.Component.prototype.createEl(null, {
                    className: 'vjs-res-button vjs-control',
                    innerHTML: videojs.sloelib.frameButtonEl(0),
                    value: '',
                    role: 'button'
                    })
            })
        );

        player.markers({
            breakOverlay:{
               display: false
            },
            /*   onMarkerReached: function(marker){
                $('.dynamic-demo-events').append('<li class="list-group-item">Marker reached: '+marker.time+'</li>');
            }, */
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
