Scoped.define("module:WebRTC.MediaRecorder", [
    "base:Class",
    "base:Events.EventsMixin",
    "base:Functions",
    "base:Promise",
    "browser:Info",
    "module:WebRTC.Support"
], function(Class, EventsMixin, Functions, Promise, Info, Support, scoped) {
    return Class.extend({
        scoped: scoped
    }, [EventsMixin, function(inherited) {
        return {

            constructor: function(stream, options) {
                options = options || {};
                inherited.constructor.call(this);
                this._stream = stream;
                this._started = false;
                var MediaRecorder = Support.globals().MediaRecorder;
                /*
                 * This is supposed to work according to the docs, but it is not:
                 * 
                 * https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/MediaRecorder#Example
                 */
                var mediaRecorderOptions = {};
                //mediaRecorderOptions.mimeType = "video/mp4";
                try {
                    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
                        mediaRecorderOptions = {
                            mimeType: 'video/webm;codecs=vp9'
                        };
                    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
                        mediaRecorderOptions = {
                            mimeType: 'video/webm;codecs=vp8'
                        };
                    } else if (MediaRecorder.isTypeSupported('video/webm')) {
                        mediaRecorderOptions = {
                            mimeType: 'video/webm'
                        };
                    }
                } catch (e) {
                    mediaRecorderOptions = {};
                }
                if (options.videoBitrate)
                    mediaRecorderOptions.videoBitsPerSecond = options.videoBitrate * 1000;
                if (options.audioBitrate)
                    mediaRecorderOptions.audioBitsPerSecond = options.audioBitrate * 1000;
                this._mediaRecorder = new MediaRecorder(stream, mediaRecorderOptions);
                this._mediaRecorder.ondataavailable = Functions.as_method(this._dataAvailable, this);
                this._mediaRecorder.onstop = Functions.as_method(this._dataStop, this);
            },

            destroy: function() {
                this.stop();
                inherited.destroy.call(this);
            },

            start: function() {
                if (this._started)
                    return Promise.value(true);
                this._started = true;
                this._chunks = [];
                this._mediaRecorder.start(10);
                this.trigger("started");
                return Promise.value(true);
            },

            stop: function() {
                if (!this._started)
                    return;
                this._started = false;
                this._mediaRecorder.stop();
                this.trigger("stopped");
            },

            _dataAvailable: function(e) {
                if (e.data && e.data.size > 0)
                    this._chunks.push(e.data);
            },

            _dataStop: function(e) {
                this._data = new Blob(this._chunks, {
                    type: "video/webm"
                });
                this._chunks = [];
                if (Info.isFirefox()) {
                    var self = this;
                    var fileReader = new FileReader();
                    fileReader.onload = function() {
                        self._data = new Blob([this.result], {
                            type: self._data.type
                        });
                        self.trigger("data", self._data);
                    };
                    fileReader.readAsArrayBuffer(this._data);
                } else
                    this.trigger("data", this._data);
            }

        };
    }], {

        supported: function() {
            if (!Support.globals().MediaRecorder)
                return false;
            if (document.location.href.indexOf("https://") !== 0 && document.location.hostname !== "localhost") {
                if (Info.isOpera() || Info.isChrome())
                    return false;
            }
            if (Info.isOpera() && Info.operaVersion() < 44)
                return false;
            if (Info.isChrome() && Info.chromeVersion() < 57)
                return false;
            return true;
        }

    });
});