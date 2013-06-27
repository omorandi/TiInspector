var util = require('util'),
	EventEmitter = require('events').EventEmitter,
	logger = require('../logger'),
	_ = require('underscore');

var DebugSession = function(backend) {
	this.backend = backend;
	EventEmitter.call(this);
};

util.inherits(DebugSession, EventEmitter);

_.extend(DebugSession.prototype, {
	pending: {},

	_nowTStamp: function() {
		return new Date().getTime();
	},

	createId: function() {
		if (!this.lastId) {
			this.lastId = this._nowTStamp();
		}
		else {
			this.lastId++;
		}
		return this.lastId;
	},

	setPending: function(id, command, callback) {
		this.pending[id] = {
			command: command,
			callback: callback
		};
	},

	checkPending: function(id) {
		var command = this.pending[id];
		delete this.pending[id];
		return command;
	},

	emitEvent: function(evt, data) {
		this.emit(evt, data);
	},


	gotReply: function(reply) {
		var commandInfo = this.checkPending(reply.id);
		if (commandInfo.callback) {
			commandInfo.callback.call(commandInfo.command, reply.args);
		}

	},

	gotMessage: function(message) {
		this.emitEvent('message', message);
	},

	sendRequest: function(command, callback) {
		var id = this.createId();
		command.id = id;
		this.setPending(id, command, callback);
		this.backend.packAndSendCommand(command);
	}
});


module.exports = DebugSession;

