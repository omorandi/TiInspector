exports.register = function(protocol) {
	protocol.registerCommand({
		command: 'version',
		desc: 'Get debugger extension version'
	});

	protocol.registerReply({
		command: 'version',
		args: [
			{
				name: 'protocolVersion',
				type: 'string'
			},
			{
				name: 'extensionVersion',
				type: 'string'
			}
		]
	});

	protocol.registerCommand({
		command: 'update',
		desc: 'Force debugger extension update'
	});

	protocol.registerReply({
		command: 'update',
		args: [
			{
				name: 'extensionVersion',
				type: 'string',
				optional: true
			}
		]
	});

	protocol.registerCommand({
		command: 'option',
		args: [
			{
				name: 'name',
				type: 'string'
			},
			{
				name: 'value',
				type: 'any'
			}
		],
		desc: 'Set debugger options'
	});

	protocol.registerReply({
		command: 'option',
		args: []
	});

	protocol.registerCommand({
		command: 'enable',
		desc: 'Turn on debug mode'
	});

	protocol.registerReply({
		command: 'enable',
		args: []
	});

	protocol.registerCommand({
		command: 'disable',
		desc: 'Turn off debug mode'
	});

	protocol.registerReply({
		command: 'disable',
		args: []
	});

	protocol.registerCommand({
		command: 'terminate',
		desc: 'Terminate session'
	});

	protocol.registerReply({
		command: 'terminate',
		args: []
	});

	protocol.registerCommand({
		command: 'breakpoint',
		args: [
			{
				name: 'action',
				type: 'string',
				values: ['create', 'change', 'remove']
			},
			{
				name: 'uri',
				type: 'string'
			},
			{
				name: 'line',
				type: 'number'
			},
			{
				name: 'state',
				type: 'number',
				values: [0, 1],
				defaultValue: 1
			},
			{
				name: 'hitcount',
				type: 'number',
				defaultValue: 0
			},
			{
				name: 'condition',
				type: 'string',
				defaultValue: ''
			},
			{
				name: 'conditionmeaning',
				type: 'number',
				values: [0, 1],
				defaultValue: 1
			}
		],
		desc: 'Create/modify/remove breakpoint'
	});

	protocol.registerReply({
		command: 'breakpoint',
		args: [
			{
				name: 'result',
				type: 'string',
				values: ['created', 'changed', 'removed']
			}
		]
	});


	protocol.registerCommand({
		command: 'exception',
		args: [
			{
				name: 'action',
				type: 'string',
				values: ['create', 'change', 'remove']
			},
			{
				name: 'type',
				type: 'string'
			}
		],
		desc: 'Create/modify/remove exception breakpoints'
	});

	protocol.registerReply({
		command: 'exception',
		args: [
			{
				name: 'result',
				type: 'string',
				values: ['created', 'changed', 'removed']
			}
		]
	});


	protocol.registerCommand({
		command: 'detailFormatters',
		args: [
			{
				varargs: true,
				name: 'detailFormatters',
				subargs: [
					{
						name: 'type',
						type: 'string'
					},
					{
						name: 'expression',
						type: 'string'
					}
				]
			}
		],
		desc: 'Set detail formatters'
	});


	protocol.registerReply({
		command: 'detailFormatters',
		args: []
	});

	protocol.registerCommand({
		command: 'openURL',
		args: [
			{
				name: 'uri',
				type: 'string'
			}
		],
		desc: 'Open page URL'
	});

	protocol.registerReply({
		command: 'openURL',
		args: []
	});


	protocol.registerCommand({
		command: 'getSource',
		args: [
			{
				name: 'uri',
				type: 'string'
			}
		],
		desc: 'Get file sources'
	});


	protocol.registerReply({
		command: 'getSource',
		args: [
			{
				name: 'status',
				type: 'string',
				values: ['success', 'failure']
			},
			{
				name: 'contents',
				type: 'string'
			}
		]
	});


	protocol.registerCommand({
		command: 'suspend',
		args: [
			{
				name: 'threadId',
				type: 'number'
			}
		],
		desc: 'Suspend script execution'
	});

	protocol.registerReply({
		command: 'suspend',
		args: []
	});


	protocol.registerCommand({
		command: 'resume',
		args: [
			{
				name: 'threadId',
				type: 'number'
			}
		],
		desc: 'Resume script execution'
	});

	protocol.registerReply({
		command: 'resume',
		args: []
	});


	protocol.registerCommand({
		command: 'stepInto',
		args: [
			{
				name: 'threadId',
				type: 'number'
			}
		],
		desc: 'Step Into'
	});


	protocol.registerReply({
		command: 'stepInto',
		args: []
	});


	protocol.registerCommand({
		command: 'stepOver',
		args: [
			{
				name: 'threadId',
				type: 'number'
			}
		],
		desc: 'Step Over'
	});

	protocol.registerReply({
		command: 'stepOver',
		args: []
	});


	protocol.registerCommand({
		command: 'stepReturn',
		args: [
			{
				name: 'threadId',
				type: 'number'
			}
		],
		desc: 'Step Return'
	});

	protocol.registerReply({
		command: 'stepReturn',
		args: []
	});


	protocol.registerCommand({
		command: 'stepToFrame',
		args: [
			{
				name: 'threadId',
				type: 'number'
			},
			{
				name: 'frameId',
				type: 'number'
			}
		],
		desc: 'Step to frame'
	});

	protocol.registerReply({
		command: 'stepToFrame',
		args: []
	});


	protocol.registerCommand({
		command: 'frames',
		args: [
			{
				name: 'threadId',
				type: 'number'
			}
		],
		desc: 'Get stack frames'
	});

	protocol.registerReply({
		command: 'frames',
		args: [
			{
				name: 'frames',
				varargs: true,
				subargs: [
					{
						name: 'frameId',
						type: 'number'
					},
					{
						name: 'function',
						type: 'string'
					},
					{
						name: 'arguments',
						type: 'string'
					},
					{
						name: 'file',
						type: 'string'
					},
					{
						name: 'line',
						type: 'number'
					},
					{
						name: 'nativeFlag',
						type: 'string'
					},
					{
						name: 'internalPC',
						type: 'number'
					},
					{
						name: 'scriptId',
						type: 'number'
					}
				]

			}
		]
	});



	protocol.registerCommand({
		command: 'variables',
		args: [
			{
				name: 'threadId',
				type: 'number'
			},
			{
				name: 'frameId',
				type: 'string'
			}
		],
		desc: 'Get variables'
	});


	protocol.registerReply({
		command: 'variables',
		args: [
			{
				name: 'variables',
				varargs: true,
				subargs: [
					{
						name: 'name',
						type: 'string'
					},
					{
						name: 'type',
						type: 'string'
					},
					{
						name: 'flags',
						type: 'string'
					},
					{
						name: 'value',
						type: 'string'
					}
				]

			}
		]
	});

	protocol.registerCommand({
		command: 'details',
		args: [
			{
				name: 'threadId',
				type: 'number'
			},
			{
				name: 'variableName',
				type: 'string'
			}
		],
		desc: 'Get variable details'
	});

	protocol.registerReply({
		command: 'details',
		args: [
			{
				name: 'details',
				varargs: true,
				subargs: [
					{
						name: 'name',
						type: 'string'
					},
					{
						name: 'type',
						type: 'string'
					},
					{
						name: 'flags',
						type: 'string'
					},
					{
						name: 'value',
						type: 'string'
					}
				]

			}
		]
	});


	protocol.registerCommand({
		command: 'eval',
		args: [
			{
				name: 'threadId',
				type: 'number'
			},
			{
				name: 'context',
				type: 'string'
			},
			{
				name: 'expression',
				type: 'string'
			}
		],
		desc: 'Evaluate expression'
	});

	protocol.registerReply({
		command: 'eval',
		args: [
			{
				name: 'status',
				type: 'string',
				values: ['result', 'exception']
			},
			{
				name: 'evalIdOrError',
				type: 'string'
			},
			{
				name: 'result',
				subargs: [
					{
						name: 'type',
						type: 'string'
					},
					{
						name: 'flags',
						type: 'string'
					},
					{
						name: 'value',
						type: 'string'
					}
				]
			}
		]
	});


	protocol.registerCommand({
		command: 'setValue',
		args: [
			{
				name: 'threadId',
				type: 'number'
			},
			{
				name: 'variable',
				type: 'string'
			},
			{
				name: 'value',
				type: 'string'
			}
		],
		desc: 'Change variable value'
	});


	protocol.registerReply({
		command: 'setValue',
		args: [
			{
				name: 'status',
				type: 'string',
				values: ['result', 'exception']
			},
			{
				name: 'value',
				subargs: [
					{
						name: 'type',
						type: 'string'
					},
					{
						name: 'flags',
						type: 'string'
					},
					{
						name: 'value',
						type: 'string'
					}
				]
			}
		]
	});


	protocol.registerMessage({
		message: 'suspended',
		args: [
			{
				name: 'threadId',
				type: 'number'
			},
			{
				name:  'reason',
				type: 'string'
			},
			{
				name: 'uri',
				type: 'string'
			},
			{
				name: 'line',
				type: 'number'
			}
		]
	});


	protocol.registerMessage({
		message: 'resumed',
		args: [
			{
				name: 'threadId',
				type: 'number'
			},
			{
				name:  'reason',
				type: 'string'
			}
		]
	});

	protocol.registerMessage({
		message: 'client',
		args: [
			{
				name: 'action',
				type: 'string'
			},
			{
				name:  'argument',
				type: 'string'
			}
		]
	});


	protocol.registerMessage({
		message: 'log',
		args: [
			{
				name: 'type',
				type: 'string'
			},
			{
				name:  'message',
				type: 'string'
			}
		]
	});


	protocol.registerMessage({
		message: 'scripts',
		args: [
			{
				name: 'action',
				type: 'string'
			},
			{
				name:  'scripts',
				varargs: true,
				match: {
					arg: 0,
					'created': {
						subargs: [
							{
								name: 'scriptId',
								type: 'number'
							},
							{
								name: 'uri',
								type: 'string'
							},
							{
								name: 'function',
								type: 'string'
							},
							{
								name: 'line',
								type: 'number'
							},
							{
								name: 'linecount',
								type: 'number'
							}
						]
					},
					'resolved': {
						subargs: [
							{
								name: 'scriptId',
								type: 'number'
							},
							{
								name: 'function',
								type: 'string'
							}
						]
					},
					'destroyed': {
						subargs: [
							{
								name: 'scriptId',
								type: 'number'
							}
						]
					}
				}

			}
		]
	});

	protocol.registerMessage({
		message: 'threads',
		args: [
			{
				name: 'action',
				type: 'string'
			},
			{
				name: 'threadId',
				type: 'number'
			},
			{
				name: 'name',
				type: 'string'
			}
		]
	});

};
