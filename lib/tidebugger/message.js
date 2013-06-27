var _ = require('underscore'),
	logger = require('../logger'),
	utils = require('./utils');


exports.fieldSep = '*';
exports.argSep = '|';

exports.builder = {
/* these are here mostly for testing purposes */
	buildRequest: function() {
		var args = Array.prototype.slice.call(arguments);
		var firstArgs = args.splice(0, 2);
		var message = {
			id: firstArgs[0],
			command: firstArgs[1],
			args: args
		};
		return message;
	},

	buildReply: function(id, args) {
		return {
			id: id,
			args: args
		};
	},

	buildMessage: function(message, args) {
		return {
			message: message,
			args: args
		};
	},
/*------------------------------------------------*/

	escapeSpecialChars: function(str) {
		str = '' + str;
		return str.replace('#', '#0')
			.replace('|', '#1')
			.replace('*', '#2');
	},
	serializeArgs: function(args) {
		if (!args || args.length === 0) {
			return undefined;
		}

		return _.map(args, function(item) {
			if (item instanceof Array) {
				return _.map(item, this.escapeSpecialChars).join(exports.argSep);
			}
			return this.escapeSpecialChars(item);
		}, this);
	},

	serialize: function(data) {
		var stream = [];

		if (data.id) {
			stream.push(data.id);
		}
		else if (data.message) {
			stream.push(data.message);
		}

		if (data.command) {
			stream.push(data.command);
		}

		if (data.args && data.args.length > 0) {
			_.each(this.serializeArgs(data.args), function(arg) {
				stream.push(arg);
			});
		}

		var packet = stream.join(exports.fieldSep);
		return packet;
	}
};


exports.parser = {
	error: {
		malformedMessage: 'malformed message'
	},


	unescapeSpecialChars: function(str) {
		return str.replace('#0', '#')
			.replace('#1', '|')
			.replace('#2', '*');
	},

	parseArgs: function(args) {
		return _.map(args, function(arg) {
			var subArgs = arg.split(exports.argSep);

			subArgs = _.map(subArgs, function(item) {
				return this.unescapeSpecialChars(item);
			}, this);

			if (subArgs.length > 1) {
				return subArgs;
			}
			return subArgs[0];

		}, this);
	},

	parseMessage: function(str) {
		var parts = str.split(exports.fieldSep);
		console.assert(parts.length >= 1, this.error.malformedMessage);

		var firstField = this.unescapeSpecialChars(parts[0]);

		//let's remove the first field (either an id, or a message string)
		parts.splice(0, 1);

		if (utils.isPositiveInt(firstField)) {
			return exports.builder.buildReply(firstField, this.parseArgs(parts));
		}

		return exports.builder.buildMessage(firstField, this.parseArgs(parts));
	}
};
