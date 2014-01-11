var chokidar = require('chokidar');

var watch_path = null, handlers = [];

/**
 * Register a file change handler.
 * Event (add, change, unline) and path are passed to the callback.
 */
exports.on = function(regex, cb) {	
	if (!cb) {
		cb = regex;
		regex = null;
	}
	handlers.push({regex: regex, cb: cb});
};

/**
 * Register a throttled file change handler.
 * This means that the handler won't get called again until it calls the done
 * callback, which is passed as the only argument to the handler.
 * e.g. Use with css compilers (you don't want to run two compilers at once).
 */
exports.throttled = function(regex, cb) {
	var processing = false, queue = false;

	function processing_done() {
		if (queue) {
			queue = false;
			cb(processing_done);
		} else {
			processing = false;
		}
	}

	exports.on(regex, function() {
		if (processing) {
			queue = true;
		} else {
			processing = true;
			cb(processing_done);
		}
	});
};

/**
 * Handle file event (add, change, unline).
 */
function file_event(ev) {
	return function(path) {
		// Get relative path
		path = path.substring(watch_path.length);
		if (path.length > 0 && path[0] == '/') {
			path = path.substring(1);
		}
		// Call handlers
		for (var i = 0; i < handlers.length; i++) {
			if (handlers[i].regex == null || path.match(handlers[i].regex) != null) {
				handlers[i].cb(ev, path);
			}
		}
	};
}

/**
 * Start watching for file events.
 */
exports.start = function(path) {
	watch_path = path;
	var watcher = chokidar.watch(path, {ignored: /\/\./});
	watcher
		.on('add', file_event('add'))
		.on('change', file_event('change'))
		.on('unlink', file_event('unlink'))
		.on('error', function(error) {
			console.error('Filesystem watching error', error);
		});
};
