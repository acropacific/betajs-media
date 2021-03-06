Scoped.define("module:WebRTC.Support", [
    "base:Promise",
    "base:Objs",
    "browser:Info",
    "base:Time"
], function(Promise, Objs, Info, Time) {
    return {

        canvasSupportsImageFormat: function(imageFormat) {
            try {
                var data = document.createElement('canvas').toDataURL(imageFormat);
                var headerIdx = data.indexOf(";");
                return data.substring(0, data.indexOf(";")).indexOf(imageFormat) != -1;
            } catch (e) {
                return false;
            }
        },

        getGlobals: function() {
            var getUserMedia = null;
            var getUserMediaCtx = null;

            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && Info.isFirefox()) {
                getUserMedia = navigator.mediaDevices.getUserMedia;
                getUserMediaCtx = navigator.mediaDevices;
            } else {
                getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
                getUserMediaCtx = navigator;
            }

            var URL = window.URL || window.webkitURL;
            var MediaRecorder = window.MediaRecorder;
            var AudioContext = window.AudioContext || window.webkitAudioContext;
            var audioContextScriptProcessor = null;
            var createAnalyser = null;
            if (AudioContext) {
                var audioContext = new AudioContext();
                audioContextScriptProcessor = audioContext.createJavaScriptNode || audioContext.createScriptProcessor;
                createAnalyser = audioContext.createAnalyser;
            }
            var RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
            var RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
            var RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;
            var WebSocket = window.WebSocket;
            return {
                getUserMedia: getUserMedia,
                getUserMediaCtx: getUserMediaCtx,
                URL: URL,
                MediaRecorder: MediaRecorder,
                AudioContext: AudioContext,
                createAnalyser: createAnalyser,
                audioContextScriptProcessor: audioContextScriptProcessor,
                webpSupport: this.canvasSupportsImageFormat("image/webp"),
                RTCPeerConnection: RTCPeerConnection,
                RTCIceCandidate: RTCIceCandidate,
                RTCSessionDescription: RTCSessionDescription,
                WebSocket: WebSocket,
                supportedConstraints: navigator.mediaDevices && navigator.mediaDevices.getSupportedConstraints ? navigator.mediaDevices.getSupportedConstraints() : {}
            };
        },

        globals: function() {
            if (!this.__globals)
                this.__globals = this.getGlobals();
            return this.__globals;
        },

        userMediaSupported: function() {
            return !!this.globals().getUserMedia;
        },

        enumerateMediaSources: function() {
            var promise = Promise.create();
            var promiseCallback = function(sources) {
                var result = {
                    audio: {},
                    audioCount: 0,
                    video: {},
                    videoCount: 0
                };
                Objs.iter(sources, function(source) {
                    if (source.kind.indexOf("video") === 0) {
                        result.videoCount++;
                        result.video[source.id || source.deviceId] = {
                            id: source.id || source.deviceId,
                            label: source.label
                        };
                    }
                    if (source.kind.indexOf("audio") === 0) {
                        result.audioCount++;
                        result.audio[source.id || source.deviceId] = {
                            id: source.id || source.deviceId,
                            label: source.label
                        };
                    }
                });
                promise.asyncSuccess(result);
            };
            try {
                if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices)
                    navigator.mediaDevices.enumerateDevices().then(promiseCallback);
                else if (MediaStreamTrack && MediaStreamTrack.getSources)
                    MediaStreamTrack.getSources(promiseCallback);
                else
                    promise.asyncError("Unsupported");
            } catch (e) {
                promise.asyncError(e);
            }
            return promise;
        },

        streamQueryResolution: function(stream) {
            var promise = Promise.create();
            var video = this.bindStreamToVideo(stream);
            video.addEventListener("playing", function() {
                setTimeout(function() {
                    promise.asyncSuccess({
                        stream: stream,
                        width: video.videoWidth,
                        height: video.videoHeight
                    });
                    video.remove();
                }, 500);
            });
            return promise;
        },

        chromeExtensionMessage: function(extensionId, data) {
            var promise = Promise.create();
            chrome.runtime.sendMessage(extensionId, data, promise.asyncSuccessFunc());
            return promise;
        },

        chromeExtensionExtract: function(meta) {
            var result = {};
            if (Info.isChrome()) {
                result.extensionId = meta.chromeExtensionId;
                result.extensionInstallLink = meta.chromeExtensionInstallLink;
            } else if (Info.isOpera()) {
                result.extensionId = meta.operaExtensionId;
                result.extensionInstallLink = meta.operaExtensionInstallLink;
            }
            return result;
        },

        userMedia: function(options) {
            var promise = Promise.create();
            var result = this.globals().getUserMedia.call(this.globals().getUserMediaCtx, options, function(stream) {
                promise.asyncSuccess(stream);
            }, function(e) {
                promise.asyncError(e);
            });
            try {
                if (result.then) {
                    result.then(function(stream) {
                        promise.asyncSuccess(stream);
                    });
                }
                if (result["catch"]) {
                    result["catch"](function(e) {
                        promise.asyncError(e);
                    });
                }
            } catch (e) {}
            return promise;
        },

        /*
         * audio: {} | undefined
         * video: {} | undefined
         * 	  width, height, aspectRatio
         * screen: true | {chromeExtensionId, operaExtensionId} | false
         */
        userMedia2: function(options) {
            var opts = {};
            if (options.audio)
                opts.audio = options.audio;
            if (options.screen && !options.video)
                options.video = {};
            if (!options.video)
                return this.userMedia(opts);
            if (options.screen) {
                options.video.width = options.video.width || window.innerWidth || document.body.clientWidth;
                options.video.height = options.video.height || window.innerHeight || document.body.clientHeight;
            }
            if (Info.isFirefox()) {
                opts.video = {};
                if (options.screen) {
                    opts.video.mediaSource = "screen";
                    if (!navigator.mediaDevices || !navigator.mediaDevices.getSupportedConstraints || !navigator.mediaDevices.getSupportedConstraints().mediaSource)
                        return Promise.error("This browser does not support screen recording.");
                }
                if (options.video.aspectRatio && !(options.video.width && options.video.height)) {
                    if (options.video.width)
                        options.video.height = Math.round(options.video.width / options.video.aspectRatio);
                    else if (options.video.height)
                        options.video.width = Math.round(options.video.height * options.video.aspectRatio);
                }
                if (options.video.width) {
                    opts.video.width = {
                        ideal: options.video.width
                    };
                }
                if (options.video.height) {
                    opts.video.height = {
                        ideal: options.video.height
                    };
                }
                /* This is supposed to work according to docs, but it is not:
                 * https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#Frame_rate
                 */
                /*
                if (options.video.frameRate) {
                	opts.video.frameRate = {
                		ideal: options.video.frameRate
                	};
                }
                */
                if (options.video.sourceId)
                    opts.video.sourceId = options.video.sourceId;
                return this.userMedia(opts);
            } else {
                opts.video = {
                    mandatory: {}
                };
                if (options.video.width) {
                    opts.video.mandatory.minWidth = options.video.width;
                    opts.video.mandatory.maxWidth = options.video.width;
                }
                if (!options.video.width && options.video.height) {
                    opts.video.mandatory.minHeight = options.video.height;
                    opts.video.mandatory.maxHeight = options.video.height;
                }
                var as = options.video.aspectRatio ? options.video.aspectRatio : (options.video.width && options.video.height ? options.video.width / options.video.height : null);
                if (as) {
                    opts.video.mandatory.minAspectRatio = as;
                    opts.video.mandatory.maxAspectRatio = as;
                }
                if (options.video.sourceId)
                    opts.video.mandatory.sourceId = options.video.sourceId;

                var probe = function(count) {
                    var mandatory = opts.video.mandatory;
                    return this.userMedia(opts).mapError(function(e) {
                        count--;
                        if (e.name !== "ConstraintNotSatisfiedError")
                            return e;
                        var c = e.constraintName.toLowerCase();
                        Objs.iter(mandatory, function(value, key) {
                            var lkey = key.toLowerCase();
                            if (lkey.indexOf(c) >= 0) {
                                var flt = lkey.indexOf("aspect") > 0;
                                var d = lkey.indexOf("min") === 0 ? -1 : 1;
                                var u = Math.max(0, mandatory[key] * (1.0 + d / 10));
                                mandatory[key] = flt ? u : Math.round(u);
                                if (count < 0) {
                                    delete mandatory[key];
                                    count = 100;
                                }
                            }
                        }, this);
                        return probe.call(this, count);
                    }, this);
                };
                if (options.screen) {
                    var extensionId = this.chromeExtensionExtract(options.screen).extensionId;
                    if (!extensionId)
                        return Promise.error("This browser does not support screen recording.");
                    var pingTest = Time.now();
                    return this.chromeExtensionMessage(extensionId, {
                        type: "ping",
                        data: pingTest
                    }).mapSuccess(function(pingResponse) {
                        var promise = Promise.create();
                        if (!pingResponse || pingResponse.type !== "success" || pingResponse.data !== pingTest)
                            return Promise.error("This browser does not support screen recording.");
                        else
                            promise.asyncSuccess(true);
                        return promise.mapSuccess(function() {
                            return this.chromeExtensionMessage(extensionId, {
                                type: "acquire",
                                sources: ['window', 'screen', 'tab']
                            }).mapSuccess(function(acquireResponse) {
                                if (!acquireResponse || acquireResponse.type !== 'success')
                                    return Promise.error("Could not acquire permission to access screen.");
                                opts.video.mandatory.chromeMediaSource = 'desktop';
                                opts.video.mandatory.chromeMediaSourceId = acquireResponse.streamId;
                                delete opts.audio;
                                return probe.call(this, 100).mapSuccess(function(videoStream) {
                                    return !options.audio ? videoStream : this.userMedia({
                                        audio: true
                                    }).mapError(function() {
                                        return Promise.value(videoStream);
                                    }).mapSuccess(function(audioStream) {
                                        try {
                                            return new MediaStream([videoStream.getVideoTracks()[0], audioStream.getAudioTracks()[0]]);
                                        } catch (e) {
                                            return videoStream;
                                        }
                                    });
                                }, this);
                            }, this);
                        }, this);
                    }, this);
                }
                return probe.call(this, 100);
            }
        },

        stopUserMediaStream: function(stream) {
            var stopped = false;
            try {
                if (stream.getTracks) {
                    stream.getTracks().forEach(function(track) {
                        track.stop();
                        stopped = true;
                    });
                }
            } catch (e) {}
            try {
                if (!stopped && stream.stop)
                    stream.stop();
            } catch (e) {}
        },

        bindStreamToVideo: function(stream, video, flip) {
            if (!video)
                video = document.createElement("video");
            video.volume = 0;
            video.muted = true;
            if (video.mozSrcObject !== undefined)
                video.mozSrcObject = stream;
            else if (Info.isSafari())
                video.srcObject = stream;
            else
                video.src = this.globals().URL.createObjectURL(stream);
            if (flip) {
                video.style["-moz-transform"] = "scale(-1, 1)";
                video.style["-webkit-transform"] = "scale(-1, 1)";
                video.style["-o-transform"] = "scale(-1, 1)";
                video.style.transform = "scale(-1, 1)";
                video.style.filter = "FlipH";
            } else {
                delete video.style["-moz-transform"];
                delete video.style["-webkit-transform"];
                delete video.style["-o-transform"];
                delete video.style.transform;
                delete video.style.filter;
            }
            video.autoplay = true;
            video.play();
            return video;
        },

        dataURItoBlob: function(dataURI) {
            // convert base64 to raw binary data held in a string
            var byteString = atob(dataURI.split(',')[1]);

            // separate out the mime component
            var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

            // write the bytes of the string to an ArrayBuffer
            var arrayBuffer = new ArrayBuffer(byteString.length);
            var _ia = new Uint8Array(arrayBuffer);
            for (var i = 0; i < byteString.length; i++)
                _ia[i] = byteString.charCodeAt(i);
            var dataView = new DataView(arrayBuffer);
            var blob = new Blob([dataView], {
                type: mimeString
            });
            return blob;
        }

    };
});