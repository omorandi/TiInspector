var _ = require('underscore'),
	logger = require('../logger'),
	check = require('./utils').check;


var ArgumentsDefinition = function(args) {
	this.args = args;
	if (!args) {
		return;
	}
	this.map = {};
	_.each(args, function(arg, index) {
		this.map[arg.name] = arg;
		arg.index = index;
		if (arg.subargs) {
			arg.subargs = new ArgumentsDefinition(arg.subargs);
		}
		else if (arg.match) {
			var match = {};
			_.each(arg.match, function(value, key) {
				if (key == 'arg') {
					match.arg = value;
					return;
				}
				match[key] = new ArgumentsDefinition(value.subargs);
			});
			arg.match = match;
		}
	}, this);
};

ArgumentsDefinition.prototype.count = function() {
	return this.args.length;
};

ArgumentsDefinition.prototype.argNamed = function(name) {
	if (!this.map || !this.map[name]) {
		throw new Error('invalid argument name: ' + name);
	}

	return this.map[name];
};

ArgumentsDefinition.prototype.argIndex = function(name) {
	return this.argNamed(name).index;
};


exports.ArgumentsDefinition = ArgumentsDefinition;



exports.Protocol = {

	init: function() {
		require('./definitions').register(this);
	},


	registerCommand: function(definition) {
		if (!this.commandDefs) {
			this.commandDefs = {};
		}
		var argDef = new ArgumentsDefinition(definition.args);
		this.commandDefs[definition.command] = argDef;
	},

	registerReply: function(definition) {
		if (!this.replyDefs) {
			this.replyDefs = {};
		}
		var argDef = new ArgumentsDefinition(definition.args);
		this.replyDefs[definition.command] = argDef;
	},

	registerMessage: function(definition) {
		if (!this.messageDefs) {
			this.messageDefs = {};
		}
		var argDef = new ArgumentsDefinition(definition.args);
		this.messageDefs[definition.message] = argDef;
	},


	getCommandDefinition: function(command) {
		return this.commandDefs[command];
	},

	getReplyDefinition: function(command) {
		return this.replyDefs[command];
	},

	getMessageDefinition: function(command) {
		return this.messageDefs[command];
	},

	mapArgsToArray: function(args, argsDef) {
		var self = this;
		var outArgs = [];

		_.each(args, function (value, name) {
			var argDef = argsDef.argNamed(name);
			var argIndex = argDef.index;

			function mapValueToIndex(val, index) {

				if (argDef.subargs) {
					outArgs[index] = self.mapArgsToArray(val, argDef.subargs);
					return;
				}

				if (argDef.type == 'number') {
					check(val, 'expected ' + name + ' to be an integer value').isInt();
					val = Number(val);
				}
				else if (argDef.type == 'string') {
					if (typeof val != 'string') {

						throw new Error('expected ' + name + ' to be a string value');
					}
				}

				outArgs[index] = val;
			}


			if (argDef.varargs) {
				check(value, 'expected ' + name + ' to be an array').isArray();
				_.each(value, function(val, index) {
					mapValueToIndex(val, argIndex + index);
				}, this);
			}
			else {
				mapValueToIndex(value, argIndex);
			}

		}, this);

		//let's map default values (or null, for expanding the array to its expected length)
		_.each(argsDef.args,  function(argDef, index) {
			if (typeof outArgs[index] === 'undefined') {
				outArgs[index] = typeof argDef.defaultValue  == 'undefined' ? null : argDef.defaultValue;
			}
		});

		return outArgs;
	},

	mapArrayToArgs: function(array, argsDef) {
		var self = this;
		var args = {};
		var varargsDef;

		function setValueForArg(name, val) {
			if (args[name] instanceof Array) {
				args[name].push(val);
			}
			else {
				args[name] = val;
			}
		}

		_.each(array, function(val, index) {
			var argDef = varargsDef || argsDef.args[index];
			var name = argDef.name;
			if (argDef.varargs && !varargsDef) {
				varargsDef = argDef;
				args[name] = [];
			}

			if (argDef.subargs) {
				setValueForArg(name, self.mapArrayToArgs(val, argDef.subargs));
				return;
			}
			else if (argDef.match) {
				check(argDef.match.arg, 'expected arg property in match definition for argument: ' + name);
				var demuxVal = array[argDef.match.arg];
				if (demuxVal  == null) {
					throw new Error('cannot proceed parsing packet: demultiplexing field is undefined');
				}
				var subargsDef = argDef.match[demuxVal];
				if (!subargsDef) {
					throw new Error('expected subargs definition for argument: ' + name + ' for match clause: ' + demuxVal);
				}
				if (subargsDef.count() == 1) {
					val = [val];
				}

				setValueForArg(name, self.mapArrayToArgs(val, subargsDef));
				return;
			}

			if (argDef.type == 'number') {
				check(val, 'expected argument at index ' + index + ' to be an integer value for argument: ' + name).isInt();
				val = Number(val);
			}
			else if (argDef.type == 'string') {
				if (typeof val != 'string') {
					throw new Error('expected argument at index ' + index + ' to be a string value for argument: ' + name);
				}
			}
			setValueForArg(name, val);
		});

		return args;
	},

	dehidrateCommand: function(cmd) {
		var command = cmd.command;
		var id = cmd.id;
		var args = cmd.args;
		var argsDef = this.getCommandDefinition(command);
		if (!argsDef) {
			throw new Error('invalid command: ' + command);
		}
		return {
			id: id,
			command: command,
			args: this.mapArgsToArray(args, argsDef)
		};
	},

	hidrateReply: function(command, argsArray) {
		var argsDef = this.getReplyDefinition(command);
		if (!argsDef) {
			throw new Error('invalid command reply: ' + command);
		}
		return {
			reply: command,
			args: this.mapArrayToArgs(argsArray, argsDef)
		};
	},

	hidrateMessage: function(message, argsArray) {
		var argsDef = this.getMessageDefinition(message);
		if (!argsDef) {
			throw new Error('invalid message: ' + message);
		}
		return {
			message: message,
			args: this.mapArrayToArgs(argsArray, argsDef)
		};
	}

};

exports.Protocol.init();




