// videojs-sloe-plugin

videojs.sloelib = (function() {
    var sloelib = {
        syncToFrame: function(player, fps) {
            var current_time = player.currentTime();
            var nearest_frame = Math.round((current_time * fps) - 0.5);
            var synced_time = nearest_frame / fps;
            player.currentTime(synced_time);
            return synced_time;
        },

        frameEl: function(frame) {
            var rounded_frame = frame.toFixed(3);
            return '<div class="vjs-control-content" style="font-size: 11px; line-height: 28px;"><span class="vjs-sloe-frame">' + rounded_frame + '</span></div>';
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
            this.seeking = false;
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
        this.el().innerHTML = videojs.sloelib.frameEl(time * player.sloedata.fps);
    }

    videojs.SloeFrameButton.prototype.onPause = function() {
        videojs.sloelib.syncToFrame(player, player.sloedata.fps);
    }

    player.ready(function() {
        player.pause();
        player.sloedata = {
            fps: options.fps
        };
        player.controlBar.addChild(
            new videojs.SloeFrameButton(player, {
                el: videojs.Component.prototype.createEl(null, {
                    className: 'vjs-res-button vjs-control',
                    innerHTML: videojs.sloelib.frameEl(0),
                    value: '',
                    role: 'button'
                    })
            })
        );
    });
};
videojs.plugin('sloe', sloe);
