# WebDevWatcher

With minimal amount of configuration, you can make your CSS/JavaScript (Less, CoffeScript, etc.) files automatically compile on changes, your development server automatically restart, and your **browser automatically reload**. This means you're going to see your changes in the browser as soon as you save the file (with a slight delay of course), no matter what kind of toolchain you're using.

## Getting started

Install using npm (add sudo and -g if you want to install it globally).

	npm install webdevwatcher

Create your configuration file, which is also the main entry point to the code.

It should look something like this (examples/simple.js):

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
	// Start websocket server on 50002 for borwser commands
	wdw.browser.start(50002);

Now just run your code with the following command:

	node myfile.js

That's it. Navigate your browser to localhost:8000 and it should proxy you to localhost:50001 (you can change that in the code). In addition to that, it will automatically reload your borwser for .py, .html and .js changes and reload css for css changes. But this is just the start.

## How does it work?

It injects a simple script into every html file (with a body tag) that goes through the proxy. The script connects to a (locally hosted) websocket server, which tells the browser when to reload. The script can also just reload the css files (loop over every link element and set the href to the same value as it was). You can see the script in the assets folder.

## More goodies

### Process management

Process submodule can help you with your process management, such as restarting you dev server on source file change.

	var django = wdw.process.create('./manage.py', ['runserver', '--noreload', 'localhost:50001'], true, true);

This creates a process description. Now you can call django.start(), django.stop() or django.restart() to start, stop or restart the process. For example, you might want to restart the django development server when there is a change in one of the .py files.

	wdw.watch.throttled(/\.py$/, function(done) {
		// Restart django dev server
		django.restart();
		// Reload the browser (optional)
		wdw.browser.command('reload');
		// Keep it running for at least one second
		// (optional, but you must call done)
		timers.setTimeout(done, 1000);
	});

You can also call external scripts using node's child_process module. For example:

	cp.exec('./compile_my_css', function() {
		// Reload only css in the browser
		wdw.browser.command('reload_css');
	});

See examples/django.js for a complete example.

### Static files

In addition to proxying, you can also serve static files.

	wdw.server.route(/^\/static\//, wdw.static.serve(__dirname));

This will add a rule to serve everything under static as a static file. Make sure to place this before a wildcard rule. Routes are handled in the same order as they are registered.

See examples/django.js for a complete example.

## License

Copyright 2014 Ziga Ham

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
