var cp = require('child_process');

/**
 * Create new process.
 */
exports.create = function(command, args, show_stdout, show_stderr) {
	return new process(command, args, show_stdout, show_stderr);
};

/**
 * Helper function for printing to the console.
 */
function print(data) {
	console.log('' + data);
}

/**
 * Process class.
 */
function process(command, args, show_stdout, show_stderr) {
	this.command = command;
	this.args = args;
	this.stdout_handler = show_stdout ? print : function() {};
	this.stderr_handler = show_stderr ? print : function() {};
}

/**
 * Start the process.
 */
process.prototype.start = function() {
	if (!this.p) {
		this.p = cp.spawn(this.command, this.args);
		this.p.stdout.on('data', this.stdout_handler);
		this.p.stderr.on('data', this.stderr_handler);
	}
};

/*
 * Stop/kill the process.
 */
process.prototype.stop = function() {
	if (this.p) {
		this.p.kill();
		this.p = null;
	}
};

/*
 * Restart (kill and start) the process.
 */
process.prototype.restart = function() {
	this.stop();
	this.start();
};
