var utils = {

	check: function(arg, message) {
		if (arg == null) {
			throw new Error(message);
		}
		return {
			isNum: function() {
				if (utils.isNum(arg)) {
					return true;
				}
				throw new Error(message);
			},

			isInt: function() {
				if (utils.isInt(arg)) {
					return true;
				}
				throw new Error(message);
			},

			isPositiveInt: function() {
				if (utils.isPositiveInt(arg)) {
					return true;
				}

				throw new Error(message);
			},

			isArray: function() {
				if (utils.isArray(arg)) {
					return true;
				}
				throw new Error(message);
			}
		};
	},
	isNum: function(arg) {
		return !isNaN(parseFloat(arg)) && isFinite(arg);
	},

	isInt: function(arg) {
		return parseInt(arg, 10) == arg;
	},

	isPositiveInt: function(arg) {
		return this.isInt(arg) && (arg * 1) >= 0;
	},

	isArray: function(arg) {
		return typeof arg == 'object' && arg instanceof Array;
	}
};

module.exports = utils;


