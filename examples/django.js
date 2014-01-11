var wdw = require('webdevwatcher');
var cp = require('child_process');
var timers = require('timers');

// Django dev server
var django = wdw.process.create('./manage.py', ['runserver', '--noreload', 'localhost:50001'], true, true);
// Django serverpush
var serverpush = wdw.process.create('./manage.py', ['runserverpush'], true, true);

// Serve static files (optional, django server can handle static files)
wdw.server.route(/^\/static\//, wdw.static.serve(__dirname));

// Proxy everything else to django
wdw.server.route(wdw.proxy.create('localhost', 50001));

// Any css in static subfolders
wdw.watch.throttled(/^media\/.*\/.*\.css$/, function(done) {
	// Custom CSS compiling script, you can do anything here
	cp.exec('./manage.py compile none', function() {
		console.log('CSS updated');
		// Reload only css in the browser
		wdw.browser.command('reload_css');
		// Throttled won't call the callback again until we call done
		done();
	});
});

// Any .py or .html file
wdw.watch.throttled(/(\.py|\.html)$/, function(done) {
	console.log('Change in code');
	// Restart django dev server and serverpush
	django.restart();
	serverpush.restart();
	// Reload the browser
	wdw.browser.command('reload');
	// Keep it running for at least one second
	timers.setTimeout(done, 1000);
});

// Start server on port 8000
wdw.server.start(8000);
// Start watching the filesystem
wdw.watch.start(__dirname);
// Start websocket server on 50002 for borwser commands
wdw.browser.start(50002);
