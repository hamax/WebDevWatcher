var url = require('url');
var path = require('path');
var fs = require('fs');
var mime = require("mime");

/**
 * Create a static file handler. You can pass this to server.route method.
 */
exports.serve = function(root) {
	return function(request, response) {
		var filepath = path.join(root, url.parse(request.url).pathname);

		fs.exists(filepath, function(exists) {
			// 404 if file doesn't exist or if it is a directory
			if (!exists || fs.statSync(filepath).isDirectory()) {
				response.writeHead(404, {'Content-Type': 'text/plain'});
				response.write('404 Not Found');
				response.end();
				return;
			}

			// Read the file (don't cache it)
			fs.readFile(filepath, 'binary', function(err, file) {
				if (err) {
					// File access failed
					response.writeHead(500, {'Content-Type': 'text/plain'});
					response.write(err);
					response.end();
					return;
				}

				// Send file content with the correct mime type
				response.writeHead(200, {"Content-Type": mime.lookup(filepath)});
				response.write(file, 'binary');
				response.end();
			});
		});
	}
};
