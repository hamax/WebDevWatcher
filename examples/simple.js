var wdw = require('webdevwatcher');

// Proxy everything to the main server
wdw.server.route(wdw.proxy.create('localhost', 50001));

// Any css file
wdw.watch.throttled(/.css$/, function(done) {
	// You can do some processing on css files here (like less)... or not
	// Reload only css in the browser
	wdw.browser.command('reload_css');
	// Throttled won't call the callback again until we call done
	done();
});

// Any .py or .html file
wdw.watch.throttled(/(\.py|\.html|\.js)$/, function(done) {
	// You can restart you server here, or something like that
	// Reload the browser
	wdw.browser.command('reload');
	done();
});

// Start server on port 8000
wdw.server.start(8000);
// Start watching the filesystem
wdw.watch.start(__dirname);
// Start websocket server on 50002 for browser commands
wdw.browser.start(50002);
