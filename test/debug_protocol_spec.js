var Protocol = require('../lib/tidebugger/protocol').Protocol,
	ArgsDef = require('../lib/tidebugger/protocol').ArgumentsDefinition,
	_ = require('underscore');


//console.log(JSON.stringify(Protocol.commandDefs, null, '\t'));

describe('Message argument definitions', function() {
	it ('should have a command named version with no arguments', function() {
		expect(Protocol.getCommandDefinition('version')).toEqual(new ArgsDef());
	});

	it ('should have a command named option with two arguments', function() {
		var argDef = new ArgsDef();
		_.extend(argDef, {
			"args": [
				{
					"name": "name",
					"type": "string",
					"index": 0
				},
				{
					"name": "value",
					"type": "any",
					"index": 1
				}
			],
			"map": {
				"name": {
					"name": "name",
					"type": "string",
					"index": 0
				},
				"value": {
					"name": "value",
					"type": "any",
					"index": 1
				}
			}
		});
		expect(Protocol.getCommandDefinition('option')).toEqual(argDef);
	});

	//more required...

});



describe('Message conversions', function() {

	it ('should convert the version command', function() {

		expect(Protocol.dehidrateCommand({
			command: 'version'
		})).toEqual({
			command: 'version',
			args: []
		});
	});


	it ('should convert the update command', function() {

		expect(Protocol.dehidrateCommand({
			command: 'update'
		})).toEqual({
			command: 'update',
			args: []
		});
	});

	it ('should convert the enable command', function() {

		expect(Protocol.dehidrateCommand({
			command: 'enable'
		})).toEqual({
			command: 'enable',
			args: []
		});
	});

	it ('should convert the breakpoint command with all the arguments defined', function() {

		var breakpointArgs = {
			uri: 'fake-uri',
			action: 'create',
			conditionmeaning: '0',
			condition: 'a == b',
			hitcount: 0,
			state: 1,
			line: '200'
		};

		expect(Protocol.dehidrateCommand({
			command: 'breakpoint',
			args: breakpointArgs
		})).toEqual({
			command: 'breakpoint',
			args: [
				'create',
				'fake-uri',
				200,
				1,
				0,
				'a == b',
				0
			]
		});
	});


	it ('should convert the breakpoint command with some undefined arguments + default values', function() {

		var breakpointArgs = {
			uri: 'fake-uri',
			action: 'create',
			state: 1,
			line: '200'
		};

		expect(Protocol.dehidrateCommand({
			command: 'breakpoint',
			args: breakpointArgs
		})).toEqual({
			command: 'breakpoint',
			args: [
				'create',
				'fake-uri',
				200,
				1, //default state value
				0, //default hitcount value
				'', //default condition value
				1 //default value
			]
		});
	});

	it ('should convert the detailFormatters command with varargs and sub-arguments', function() {

		var dfArgs = {
			detailFormatters: [
				{
					type: 'a',
					expression: 'b'
				},
				{
					type: 'c',
					expression: 'd'
				}
			]
		};

		expect(Protocol.dehidrateCommand({
			command: 'detailFormatters',
			args: dfArgs
		})).toEqual({
			command: 'detailFormatters',
			args: [
				['a', 'b'],
				['c', 'd']
			]
		});
	});



	it ('should convert the variables reply', function() {

		var array = [['rect', 'Shape', 'ow', '[object Object]'], ['square', 'Shape', 'ow', '[object Object]'], ['oval', 'Shape', 'ow', '[object Object]']];
		expect(Protocol.hidrateReply('variables', array)).toEqual({
			reply: 'variables',
			args: {
				variables: [
					{
						name: 'rect',
						type: 'Shape',
						flags: 'ow',
						value: '[object Object]'
					},
					{
						name: 'square',
						type: 'Shape',
						flags: 'ow',
						value: '[object Object]'
					},
					{
						name: 'oval',
						type: 'Shape',
						flags: 'ow',
						value: '[object Object]'
					}
				]
			}
		});
	});


	it ('should convert the eval reply', function() {

		var array = ['result', '0', ['Shape', 'ow', '[object Object]']];
		expect(Protocol.hidrateReply('eval', array)).toEqual({
			reply: 'eval',
			args: {
				status: 'result',
				evalIdOrError: '0',
				result: {
					type: 'Shape',
					flags: 'ow',
					value: '[object Object]'
				}
			}
		});
	});


	it ('should convert the threads message ', function() {

		var array = ['created', 0, 'main'];
		expect(Protocol.hidrateMessage('threads', array)).toEqual({
			message: 'threads',
			args: {
				action: 'created',
				threadId: 0,
				name: 'main'
			}
		});
	});


	it ('should convert a scripts created message ', function() {

		var array = ['created', [0, 'uri_a', 'function_1', 0, 10], [1, 'uri_b', 'function_2', 0, 20]];
		expect(Protocol.hidrateMessage('scripts', array)).toEqual({
			message: 'scripts',
			args: {
				action: 'created',
				scripts: [
					{
						scriptId: 0,
						uri: 'uri_a',
						"function": 'function_1',
						line: 0,
						linecount: 10
					},
					{
						scriptId: 1,
						uri: 'uri_b',
						"function": 'function_2',
						line: 0,
						linecount: 20
					}
				]
			}
		});
	});


	it ('should convert a scripts resolved message ', function() {
		var array = ['resolved', [0, 'function_1'], [1, 'function_2']];
		expect(Protocol.hidrateMessage('scripts', array)).toEqual({
			message: 'scripts',
			args: {
				action: 'resolved',
				scripts: [
					{
						scriptId: 0,
						"function": 'function_1'
					},
					{
						scriptId: 1,
						"function": 'function_2'
					}
				]
			}
		});
	});


	it ('should convert a scripts destroyed message ', function() {
		var array = ['destroyed', 0, 1];
		expect(Protocol.hidrateMessage('scripts', array)).toEqual({
			message: 'scripts',
			args: {
				action: 'destroyed',
				scripts: [
					{
						scriptId: 0
					},
					{
						scriptId: 1
					}
				]
			}
		});
	});


});





