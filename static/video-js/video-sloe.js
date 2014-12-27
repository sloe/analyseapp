// videojs-sloe-plugin

videojs.sloelib = (function() {
    var sloelib = {
        syncToFrame: function(player, fps) {
            var current_time = player.currentTime();
            var nearest_frame = Math.round((current_time * fps) - 0.5);
            var synced_time = nearest_frame / fps;
            player.currentTime(synced_time);
            return synced_time;
        }
    };
    
    return sloelib;
}());


function sloe(options) {
    var player = this;

    videojs.SloeSeekBar = videojs.SeekBar.extend({
        /** @constructor */
        init: function(player, options) {
            videojs.SeekBar.call(this, player, options);
            videojs.log("init");
        }
    });
        
    videojs.SloeSeekBar.prototype.onMouseUp = function(event) {
    videojs.log('onmouseup');
        videojs.SeekBar.prototype.onMouseUp.call(this, event);
        videojs.sloelib.syncToFrame(player, 29.97);
    };

    controlBar = player.getChild('controlBar');
    progressControl = controlBar.getChild('progressControl');

    progressControl.removeChild('seekBar')
    progressControl.addChild('sloeSeekBar')
    

    videojs.SloeTestButton = videojs.Button.extend({
        init: function(player, options) {
            videojs.Button.call(this, player, options);
            this.fps = options.fps;
            this.seeking = false;
            this.on('click', this.onClick);
            this.on(player, 'timeupdate', this.onTimeUpdate);
            this.on(player, 'pause', this.onPause);
        },
    });

    videojs.SloeTestButton.prototype.onClick = function() {
        var time = player.currentTime();
        this.el().innerHTML = time*30;
    }

    videojs.SloeTestButton.prototype.onTimeUpdate = function() {
        var time = player.currentTime();
        this.el().innerHTML = time * this.fps;
    }

    videojs.SloeTestButton.prototype.onPause = function() {
        videojs.sloelib.syncToFrame(player, this.fps);
    }

    player.ready(function() {
        player.pause();
        player.controlBar.addChild(
            new videojs.SloeTestButton(player, {
                el: videojs.Component.prototype.createEl(null, {
                    className: 'vjs-res-button vjs-control',
                    innerHTML: '<div class="vjs-control-content" style="font-size: 11px; line-height: 28px;"><span class="vjs-fbf">' + 'sloe' + '</span></div>',
                    value: 'Murgh',
                    role: 'button'
                    }),
                fps: options.fps
            })
        );
    });
};
videojs.plugin('sloe', sloe);
