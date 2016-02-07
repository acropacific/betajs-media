var testasset = function (s) {
	return (window.BrowserStack ? "http://files.betajs.com/" : (BetaJS.Strings.splitLast(document.location.href, "/").head + "/tests/")) + s;
};

if (!BetaJS.Browser.Info.isMobile()) {
	test("test flash playback mp4", function() {
		stop();
		$("#visible-fixture").html('<video src="' + testasset("movie.mp4") + '"></video>');
		BetaJS.Media.Player.FlashPlayer.polyfill($("video").get(0), "videopoly", true, true);
		setTimeout(function () {
			QUnit.equal(Math.max($("object").length, $("embed").length), 1);
			start();
		}, 0);
	});
}


if (!BetaJS.Browser.Info.isInternetExplorer() || BetaJS.Browser.Info.internetExplorerVersion() > 8) {
	test("wrapper native video and poster", function () {
		stop();
		$("#visible-fixture").html('<video></video>');
		BetaJS.Media.Player.VideoPlayerWrapper.create({
	    	element: $("video").get(0),
	    	poster: testasset("movie.png"),
	    	source: testasset("movie.mp4"),
	    	noflash: true
	    }).success(function (instance) {
	    	instance.on("postererror", function () {
	    		ok(false);
	    		start();
	    	});
	    	instance.on("playing", function () {
	    		ok(true);
	    		start();
	    	});
	        instance.on("error", function (error) {
	        	console.log(error);
	        	ok(false);
	        	start();
	        });
	        QUnit.launcher(instance.play, instance);
	        if (instance.error()) {
	        	ok(false);
	        	start();
	        }        	
	    }).error(function () {
	    	ok(false);
	    	start();
	    });
	});
}

if (!BetaJS.Browser.Info.isMobile()) {
	test("wrapper flash video and poster", function () {
		stop();
		$("#visible-fixture").html('<video></video>');
		BetaJS.Media.Player.VideoPlayerWrapper.create({
	    	element: $("video").get(0),
	    	poster: testasset("movie.png"),
	    	source: testasset("movie.mp4"),
	    	forceflash: true
	    }).success(function (instance) {
	    	instance.on("postererror", function () {
	    		ok(false);
	    		start();
	    	});
	    	instance.on("playing", function () {
	    		ok(true);
	    		start();
	    	});
	        instance.on("error", function (error) {
	        	ok(false);
	        	start();
	        });
	    	instance.play();
	        if (instance.error()) {
	        	ok(false);
	        	start();
	        }        	
	    }).error(function () {
	    	ok(false);
	    	start();
	    });
	});
}

if (!BetaJS.Browser.Info.isInternetExplorer() || BetaJS.Browser.Info.internetExplorerVersion() > 8) {
	test("wrapper native no video but poster", function () {
		stop();
		$("#visible-fixture").html('<video></video>');
		BetaJS.Media.Player.VideoPlayerWrapper.create({
	    	element: $("video").get(0),
	    	poster: testasset("movie.png"),
	    	source: testasset("movie.flv"),
	    	noflash: true
	    }).success(function (instance) {
	    	instance.on("postererror", function () {
	    		ok(false);
	    		start();
	    	});
	    	instance.on("playing", function () {
	    		ok(false);
	    		start();
	    	});
	        instance.on("error", function (error) {
	        	ok(true);
	        	start();
	        });
	        QUnit.launcher(instance.play, instance);
	        if (instance.error()) {
	        	ok(true);
	        	start();
	        }        	
	    }).error(function () {
	    	ok(true);
	    	start();
	    });
	});
}

test("wrapper native, keep native no video but poster", function () {
	stop();
	$("#visible-fixture").html('<video></video>');
	BetaJS.Media.Player.VideoPlayerWrapper.create({
    	element: $("video").get(0),
    	poster: testasset("movie.png"),
    	source: testasset("error.mp4")
    }).success(function (instance) {
    	instance.on("postererror", function () {
    		ok(false);
    		start();
    	});
        instance.on("error", function (error) {
        	ok(true);
        	start();
        });
        QUnit.launcher(instance.play, instance);
        if (instance.error()) {
        	ok(true);
        	start();
        }        	
    }).error(function () {
    	ok(true);
    	start();
    });
});


if (!BetaJS.Browser.Info.isMobile()) {
	test("wrapper flash no video but poster", function () {
		stop();
		$("#visible-fixture").html('<video></video>');
		BetaJS.Media.Player.VideoPlayerWrapper.create({
	    	element: $("video").get(0),
	    	poster: testasset("movie.png"),
	    	source: testasset("error.flv")
	    }).success(function (instance) {
	    	instance.on("postererror", function () {
	    		ok(false);
	    		start();
	    	});
	        instance.on("error", function (error) {
	        	ok(true);
	        	start();
	        });
	    	instance.play();
	        if (instance.error()) {
	        	ok(true);
	        	start();
	        }        	
	    }).error(function () {
	    	ok(true);
	    	start();
	    });
	});
}


if (!BetaJS.Browser.Info.isMobile()) {
	test("wrapper fallback video and poster", function () {
		stop();
		$("#visible-fixture").html('<video></video>');
		BetaJS.Media.Player.VideoPlayerWrapper.create({
	    	element: $("video").get(0),
	    	poster: testasset("movie.png"),
	    	source: testasset("movie.flv")
	    }).success(function (instance) {
	    	instance.on("postererror", function () {
	    		ok(false);
	    		start();
	    	});
	    	instance.on("playing", function () {
	    		instance.destroy();
	    		ok(true);
	    		start();
	    	});
	        instance.on("error", function (error) {
	        	ok(false);
	        	start();
	        });
	    	instance.play();
	        if (instance.error()) {
	        	ok(false);
	        	start();
	        }        	
	    }).error(function () {
	    	ok(false);
	    	start();
	    });
	});
}


if (!BetaJS.Browser.Info.isInternetExplorer() || BetaJS.Browser.Info.internetExplorerVersion() > 8) {
	test("wrapper native video but no poster", function () {
		stop();
		$("#visible-fixture").html('<video></video>');
		BetaJS.Media.Player.VideoPlayerWrapper.create({
	    	element: $("video").get(0),
	    	poster: testasset("error.png"),
	    	source: testasset("movie.mp4"),
	    	noflash: true
	    }).success(function (instance) {
	    	instance.on("postererror", function () {
	    		ok(true);
	    		start();
	    	});
	        instance.on("error", function (error) {
	        	ok(false);
	        	start();
	        });
	        if (instance.error()) {
	        	ok(false);
	        	start();
	        }        	
	    }).error(function () {
	    	ok(false);
	    	start();
	    });
	});
}


if (!BetaJS.Browser.Info.isMobile()) {
	test("wrapper flash video but no poster", function () {
		stop();
		$("#visible-fixture").html('<video></video>');
		BetaJS.Media.Player.VideoPlayerWrapper.create({
	    	element: $("video").get(0),
	    	poster: testasset("error.png"),
	    	source: testasset("movie.mp4"),
	    	forceflash: true
	    }).success(function (instance) {
	    	instance.on("postererror", function () {
	    		ok(true);
	    		start();
	    	});
	        instance.on("error", function (error) {
	        	ok(false);
	        	start();
	        });
	        if (instance.error()) {
	        	ok(false);
	        	start();
	        }        	
	    }).error(function () {
	    	ok(false);
	    	start();
	    });
	});
}
