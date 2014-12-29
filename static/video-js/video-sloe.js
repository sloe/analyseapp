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
            var next_marker = marker.sloe_markers.getNext(marker);
            var speed_factor = marker.sloedata.speed_factor;
            if (next_marker) {

                var interval = (next_marker.time - marker.time) * speed_factor;
                var frame_interval = next_marker.sloe_frame - marker.sloe_frame;
                return '' + interval.toFixed(2) + 's<br/>' + (60 / interval).toFixed(2) + ' per min<br/>' + frame_interval + 'f';
            } else {
                return '-';
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

        markButtonEl: function(marked) {
            var content = marked ? 'UNMARK' : 'MARK';
            return '<div class="vjs-control-content" style="font-size: 11px; line-height: 28px;"><span class="vjs-sloe-mark">' + content + '</span></div>';
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
            this.on('click', this.onClick);
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
            this.on('click', this.onClick);
        },
    });

    videojs.SloeMarkButton.prototype.onClick = function() {
        this.el().innerHTML = videojs.sloelib.markButtonEl(true);
        current_frame = videojs.sloelib.getFrame(player, player.sloedata.fps);
        player.markers.add([{
            sloedata: player.sloedata,
            sloe_frame: current_frame,
            sloe_markers: player.markers,
            time: player.currentTime()
        }]);
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

        player.controlBar.addChild(
            new videojs.SloeMarkButton(player, {
                el: videojs.Component.prototype.createEl(null, {
                    className: 'vjs-res-button vjs-control',
                    innerHTML: videojs.sloelib.markButtonEl(false),
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
    });
};
videojs.plugin('sloe', sloe);
