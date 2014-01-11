var WebSocketServer = require('ws').Server;
var fs = require('fs');
var path = require('path');
var proxy = require('./proxy');

var connections = {}, next_id = 1, inject_code;

/**
 * Send a command to all connected browsers.
 */
exports.command = function(cmd) {
	for (var id in connections) {
		connections[id].send(cmd);
	}
};

/**
 * Handle new websocket connection.
 */
function onConnection(ws) {
	console.log('New browser connection');

	var id = next_id++;
	connections[id] = ws;

	ws.on('close', function() {
		console.log('Lost browser connection');

		delete connections[id];
	});
}

/**
 * Inject websocket code to any text/html document with a </body> tag.
 */
function proxyInjector(request, response, proxy_response) {
	if (proxy_response.headers['content-type'] &&
			proxy_response.headers['content-type'].substring(0, 9) == 'text/html') {
		var html = '';

		proxy_response.on('data', function(chunk) {
			html += chunk;
		});

		proxy_response.on('end', function() {
			var body = html.indexOf('</body>');
			if (body != -1) {
				html = html.substring(0, body) + inject_code + html.substring(body);
			}
			response.write(html);
			response.end();
		});

		response.writeHead(proxy_response.statusCode, proxy_response.headers);

		return true;
	}
}

/**
 * Start websocket server.
 */
exports.start = function(port) {
	var wss = new WebSocketServer({port: port});
	wss.on('connection', onConnection);
	
	// Read code for injecting from file
	fs.readFile(path.join(__dirname, '../assets/browser_connect.html'), 'utf8', function(err, data) {
		if (err) {
			console.log('Can\'t read browser_connect.html file: ' + err);
		} else {
			inject_code = data.replace('%(port)', port);
			// Register the injector.
			proxy.inject(proxyInjector);
		}
	});
};
