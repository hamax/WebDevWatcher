var http = require('http');
var url = require('url');

var handlers = [];

/**
 * Register an URL handler using regex.
 * Request and response objects are passed to the callback.
 */
exports.route = function(regex, cb) {
	if (!cb) {
		cb = regex;
		regex = null;
	}
	handlers.push({regex: regex, cb: cb});
};

/**
 * Start the server.
 */
exports.start = function(port) {
	http.createServer(function(request, response) {
		var path = url.parse(request.url).pathname;
		for (var i = 0; i < handlers.length; i++) {
			if (handlers[i].regex == null || path.match(handlers[i].regex) != null) {
				handlers[i].cb(request, response);
				return;
			}
		}
	}).listen(port);
};
