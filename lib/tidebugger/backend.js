var util = require('util'),
	EventEmitter = require('events').EventEmitter,
	_ = require('underscore'),
	DebugSession = require('./session'),
	logger = require('../logger'),
	Protocol = require('./protocol').Protocol,
	messageBuilder = require('./message').builder,
	messageParser = require('./message').parser;



var DebuggerBackend = function(endpoint) {
	var self = this;
	this.endpoint = endpoint;
	this.session = new DebugSession(this);


	this.endpoint.on('message:received', function(data) {
		var messageData = messageParser.parseMessage(data.data);
		logger.debug('parsed message: ' + JSON.stringify(messageData));
		if (messageData.id) {
			self.session.gotReply(messageData);
		}
		else if (messageData.message) {
			self.gotMessage(messageData);
		}
		else {
			throw new Error('should not be here');
		}
	});

};

util.inherits(DebuggerBackend, EventEmitter);

DebuggerBackend.prototype.sendCommand = function(cmd, callback) {
	this.session.sendRequest(cmd, function(args) {
		if (callback) {
			callback.call(null, Protocol.hidrateReply(this.command, args));
		}
	});
};

DebuggerBackend.prototype.gotMessage = function(message) {
	this.emit('message', Protocol.hidrateMessage(message.message, message.args));
};

DebuggerBackend.prototype.packAndSendCommand = function(cmd) {
	var commandData = Protocol.dehidrateCommand(cmd);
	var packet = messageBuilder.serialize(commandData);
	this.endpoint.send(packet);
};

module.exports = DebuggerBackend;