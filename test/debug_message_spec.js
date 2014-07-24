var DbgMessage = require('../lib/tidebugger/message');

var msgBuilder = DbgMessage.builder;
var msgParser = DbgMessage.parser;

describe('DebugMessage Builder tests', function() {
	it ('should build a request message with no arguments', function() {
		var msg = msgBuilder.buildRequest(123456, 'version');
		expect(msg).toEqual({
			id: 123456,
			command: 'version',
			args: []
		});
	});

	it ('should build a request message with three arguments (no sub-arguments)', function() {
		var msg = msgBuilder.buildRequest(123456, 'eval', 2, 'frame[0]', 'vRect');
		expect(msg).toEqual({
			id: 123456,
			command: 'eval',
			args: [
				2,
				'frame[0]',
				'vRect'
			]
		});
	});

	it('should build a request message with one argument containing two sub-arguments', function() {
		var msg = msgBuilder.buildRequest(123456, 'detailFormatters', ['Date', 'this.toGMTString()']);
		expect(msg).toEqual({
			id: 123456,
			command: 'detailFormatters',
			args: [
				['Date', 'this.toGMTString()']
			]
		});
	});

	it('should build a reply message with one numeric argument', function() {
		var msg = msgBuilder.buildReply(123456, [2.0]);
		expect(msg).toEqual({
			id: 123456,
			args: [2.0]
		});
	});


	it('should build a reply message with three arguments, the last having 3 sub-arguments', function() {
		var msg = msgBuilder.buildReply(123456, ['result', 0, ['Shape', 'ow', '[object Object]']]);
		expect(msg).toEqual({
			id: 123456,
			args: [
				'result',
				0,
				['Shape', 'ow', '[object Object]']
			]
		});
	});


	it('should build an unsolicited message with three arguments', function() {
		var msg = msgBuilder.buildMessage('threads', ['created', 1, 'main']);
		expect(msg).toEqual({
			message: 'threads',
			args: [
				'created',
				1,
				'main'
			]
		});
	});

});



describe('DebugMessage Parser tests', function() {

	it ('should unescape the special characters contained in the argument string', function() {
		expect(msgParser.unescapeSpecialChars('abc#0def#1ghi#2')).toEqual('abc#def|ghi*');
	});

	it ('should parse an arguments array containing sub-arguments', function() {
		var args = ['a', 'b', 'c|3|e', 'f'];
		expect(msgParser.parseArgs(args)).toEqual(['a', 'b', ['c', '3', 'e'], 'f']);
	});

	it ('should parse an arguments array unescaping special characters', function() {
		var args = ['a#1', 'b#0', 'c#2|d|e', 'f'];
		expect(msgParser.parseArgs(args)).toEqual(['a|', 'b#', ['c*', 'd', 'e'], 'f']);
	});


	it ('should parse a reply packet', function() {
		expect(msgParser.parseMessage('1354193331082*2*2.1.3.GA')).toEqual({
			id: '1354193331082',
			args: ['2', '2.1.3.GA']
		});
	});

	it ('should parse a message packet', function() {
		expect(msgParser.parseMessage('log*out*[DEBUG] Analytics is enabled = YES')).toEqual({
			message: 'log',
			args: ['out', '[DEBUG] Analytics is enabled = YES']
		});
	});

	it ('should parse an unsolicited message', function() {
		expect(msgParser.parseMessage('scripts*created*317581408|app:/app.js||1|71')).toEqual({
			message: 'scripts',
			args: ['created', ['317581408', 'app:/app.js', '', '1', '71']]
		});
	});

	it ('should parse and re-serialize a reply packet', function() {
		var packet = '24*1354193331082*2*2.1.3.GA';
		expect(msgBuilder.serialize(msgParser.parseMessage(packet))).toEqual(packet);
	});

	it ('should parse and re-serialize a message packet', function() {
		var packet = 'log*out*[DEBUG] Analytics is enabled = YES';
		expect(msgBuilder.serialize(msgParser.parseMessage(packet))).toEqual(packet);
	});

});
