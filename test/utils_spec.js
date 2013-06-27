var utils = require('../lib/tidebugger/utils');


describe('utils tests', function() {
	it ('should return true because the argument is an integer value', function() {
		expect(utils.isInt('12345')).toBeTruthy();
	});

	it ('should return true because the argument is an integer value', function() {
		expect(utils.isInt('-12345')).toBeTruthy();
	});

	it ('should return false because the argument is a non-integer value', function() {
		expect(utils.isInt('1.23')).toBeFalsy();
	});

	it ('should return false because the argument is a non-integer value', function() {
		expect(utils.isInt('1123ad')).toBeFalsy();
	});

	it ('should return true because the argument is a natural number', function() {
		expect(utils.isPositiveInt('1234')).toBeTruthy();
	});

	it ('should return false because the argument is NOT a natural number', function() {
		expect(utils.isPositiveInt('-1234')).toBeFalsy();
	});
});
