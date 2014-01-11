var http = require('http');
var timers = require('timers');

var injectors = [];

/*
 * Register an injector for changing the proxied data.
 */
exports.inject = function(injector) {
	injectors.push(injector);
};

/**
 * Create a proxy handler. You can pass this to server.route method.
 */
exports.create = function(host, port, retries, delay) {
	function proxy(request, response) {
		// Because servers can take a while to restart, we want to retry in
		// case of error for a few seconds
		var retries_left = retries;
		if (retries_left === undefined) {
			// Default maximum retries
			retries_left = 10;
		}
		if (delay === undefined) {
			// Default delay between retries
			delay = 300;
		}

		// We need to cache the data for retries
		var request_body = '', request_body_done = false;
		request.on('data', function(chunk) {
			request_body += chunk;
		});

		request.on('end', function() {
			request_body_done = true;
		});

		function make_proxy_request() {
			var proxy_request = http.request({
				host: host,
				port: port,
				path: request.url,
				method: request.method,
				headers: request.headers
			}, function(proxy_response) {
				// Check if any of the injectors want to handle this proxy response
				for (var i = 0; i < injectors.length; i++) {
					if (injectors[i](request, response, proxy_response)) {
						return;
					}
				}

				proxy_response.on('data', function(chunk) {
					response.write(chunk, 'binary');
				});

				proxy_response.on('end', function() {
					response.end();
				});

				response.writeHead(proxy_response.statusCode, proxy_response.headers);
			});

			// Handle proxy errors
			proxy_request.on('error', function(e) {
				if (retries_left > 0) {
					console.log('Proxy error but we have %d retries left.', retries_left);
					retries_left--;
					timers.setTimeout(make_proxy_request, delay);
				} else {
					console.log('Proxy error!');
					response.writeHead(502);
					response.write('Proxy error\n\n' + e);
					response.end();
				}
			});

			// Send cached data
			proxy_request.write(request_body, 'binary');
			if (request_body_done) {
				proxy_request.end();
			}

			// Listen for new data
			request.on('data', function(chunk) {
				proxy_request.write(chunk, 'binary');
			});

			request.on('end', function() {
				proxy_request.end();
			});
		}
		make_proxy_request();
	};

	return proxy;
};
