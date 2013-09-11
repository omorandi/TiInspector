var net = require('net'),
	util = require('util'),
	EventEmitter = require('events').EventEmitter,
	_ = require('underscore'),
	logger = require('../logger'),
	DebuggerBackend = require('./backend'),
	repl = require('repl');


var DataStream = function() {};

util.inherits(DataStream, EventEmitter);

_.extend(DataStream.prototype, {
	receivedPacket: function(data) {
		logger.debug('got data: ' + data + ' len: ' + data.length);
		while (data.length > 0) {
			if (!this.toRead) {
				var len = data.split('*')[0];
				this.toRead = parseInt(len, 10);
				this.buffer = '';
				data = data.substring(len.length + 1);
			}

			var readData = data.substring(0, this.toRead);
			this.buffer += readData;
			this.toRead -= readData.length;
			if (this.toRead === 0) {
				this.emit('data', this.buffer);
			}
			data = data.substring(readData.length);
			logger.debug('remaining data: ' + data);
		}
	}
});


var ConnectionEndpoint = function(conn) {
	var self = this;
	this.conn = conn;


	var dataStream = new DataStream();

	dataStream.on('data', function(data) {
		self.emit('message:received', {
			data: data
		});
	});

	conn.on('data', function(data) {
		dataStream.receivedPacket(data);
	});

	conn.on('end', function() {
		self.emit('connection:ended');
	});

	this.on('message:sent', function(data) {
		if (self.logEnabled) {
			self.logSentPacket(data.data);
		}
	});

	this.on('message:received', function(data) {
		if (self.logEnabled) {
			self.logReceivedPacket(data.data);
		}
	});


	var remoteEndPoint = [this.conn.remoteAddress, this.conn.remotePort];
	logger.debug('Connection from: ' + remoteEndPoint.join(':'));
};

util.inherits(ConnectionEndpoint, EventEmitter);

_.extend(ConnectionEndpoint.prototype, {
	send: function(data) {
		var len = data.length;
		data = len + '*' + data;
		this.conn.write(data);
		this.emit('message:sent', {
			data: data
		});
	},

	logSentPacket: function(data) {
		logger.info(this.connectionInfo('out') + ': ' + data);
	},

	logReceivedPacket: function(data) {
		logger.info(this.connectionInfo('in') + ': ' + data);
	},

	localEndpoint: function() {
		return [this.conn.localAddress, this.conn.localPort];
	},

	remoteEndpoint: function() {
		return [this.conn.remoteAddress, this.conn.remotePort];
	},

	connectionInfo: function(direction) {
		var remoteEndPoint = this.remoteEndpoint();
		var arrow = 'From: ';
		if (direction == 'out') {
			arrow = 'To: ';
		}
		return arrow + remoteEndPoint.join(':');
	},

	connectionId: function() {
		return this.localEndpoint().join(':') + '-' + this.remoteEndpoint().join(':');
	}
});


var DebugServer = function(port) {
	this.port = port || 8999;
	logger.debug('Debug Server port: ' + this.port);
};

util.inherits(DebugServer, EventEmitter);

_.extend(DebugServer.prototype, {

	listen: function() {
		var self = this;

		this.server = net.createServer(function(c) {
			c.setEncoding('utf8');
			var connEndpoint = new ConnectionEndpoint(c);

			connEndpoint.logEnabled = self.packetLoggingEnabled;

			var debuggerBackend = new DebuggerBackend(connEndpoint);

			self.emit('connected', debuggerBackend);

			c.on('end', function() {
				self.emit('disconnected', debuggerBackend);
			});
		});


		this.server.listen(this.port, function() {
			self.emit('listening', self);
		});
	}

});

module.exports = DebugServer;

