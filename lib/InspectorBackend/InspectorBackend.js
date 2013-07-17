var _ = require('underscore'),
    logger = require('../logger');


var overlayWinFunct = 
'(function(msg) {' +
    '__debugger_overlay_win__ = Ti.UI.createWindow({' +
        'backgroundColor: "#0087df",' +
        'height: 30,' +
        'opacity: 0.5,' +
        'top: 0' +
    '});' +
    'var label = Ti.UI.createLabel({' +
        'text: msg,' +
        'color: "white"' +
    '});' +
    '__debugger_overlay_win__.add(label);' +
    '__debugger_overlay_win__.open();' +
'}("#OVERLAY_MESSAGE#"));';

var injectedVariables = ['__debugger_overlay_win__'];

var InspectorObject = function() {
};

InspectorObject.prototype.toObj = function() {
    var validProperties = this.validProperties || [];
    var obj = {};
    var self = this;
    _.each(validProperties, function(prop) {
        var val = self[prop];
        if (typeof val == 'object' && typeof val.toObj == 'function') {
            val = val.toObj();
        }
        else if (val instanceof Array) {
            val = _.map(val, function(o) {
                if (o && typeof o.toObj == 'function') {
                    o = o.toObj(); 
                }
                return o;
            });
        }
        obj[prop] = val;
    });
    return obj;
};  


var RemoteObject = function(params) {
    _.extend(this, params);
};

RemoteObject.prototype = Object.create(InspectorObject.prototype, {
    validProperties: {
        value: ['className', 'description', 'objectId', 'subtype', 'type', 'value']
    }
});


var CallFrame = function(params) {
    _.extend(this, params);
};

CallFrame.prototype = Object.create(InspectorObject.prototype, {
    validProperties: {
        value: ['callFrameId', 'functionName', 'location', 'scopeChain', 'this']
    }
});


var PropertyDescriptor = function(params) {
    _.extend(this, params);
};

PropertyDescriptor.prototype = Object.create(InspectorObject.prototype, {
    validProperties: {
        value: ['configurable', 'enumerable', 'get', 'name', 'set', 'value', 'wasThrown', 'writable', 'isOwn']
    }
});



var Scope = function(params) {
    _.extend(this, params);
};

Scope.prototype = Object.create(InspectorObject.prototype, {
    validProperties: {
        value: ['object', 'type']
    }
});



var InspectorBackend = function(wsConn, dbg, appName) {
    var self = this;
    this.callFrames = {};

    this.securityOrigin = "http://" + appName;
    this.frameURL = this.securityOrigin + "/app";
    this.frameTree = {
        frame: {
            id: "9231.4",
            loaderId: "9231.5",
            url: this.frameURL,
            mimeType: "text/html",
            securityOrigin: this.securityOrigin
        },
        resources: [
            {
                url: this.frameURL,
                type: "Document",
                mimeType: "text/html"
            }
        ]
    };

    this.wsConnection = wsConn;
    this.dbg = dbg;

    this.initialized = false;
    
};


InspectorBackend.prototype.disconnect = function() {
    if (this.wsConnection) {
        this.wsConnection.close();
        this.wsConnection = null;
    }
};

InspectorBackend.prototype.Debugger_enable = function(params, callback) {
    var self = this;
    if (!this.dbg.enabled) {
        var appjsUrl = this.mapAppUriToUrl('app:/app.js');
        this.dbg.setOption("suspendOnExceptions", "false", function() {
            self.dbg.enable(callback); 
        });
        return;
    }
    this.dbg.enable(callback);
};

InspectorBackend.prototype.Debugger_getScriptSource = function(params, callback) {
    this.dbg.getSource(params.scriptId, function(data) {
        callback({
            result: {
                scriptSource: data
            }
        });
    });
};


InspectorBackend.prototype.Debugger_setPauseOnExceptions = function(params, callback) {
    if (params.state == 'all') {
        this.dbg.setOption('suspendOnExceptions', true, callback);
    }
    else if (params.state == 'none') {
        this.dbg.setOption('suspendOnExceptions', false, callback);
    }

};


InspectorBackend.prototype.setOverlayMessage = function(message) {
    /*
    if (this.suspendedThread == null){
        return;
    }
    var injectFn;
    if (!message) {
        injectFn = 'if (typeof __debugger_overlay_win__ != "undefined"){__debugger_overlay_win__.close();}';
    }
    else {
        if (this.suspendedReason) {
            message += ' (' + this.suspendedReason + ')';
        }
        injectFn = overlayWinFunct.replace('#OVERLAY_MESSAGE#', message);
    }
    this.dbg.evaluate(this.suspendedThread, 'frame[0]', injectFn, function(data) {
    });
    */
};


InspectorBackend.prototype.Debugger_setScriptSource = function(params, callback) {
    this.dbg.setSource(params.scriptId, params.scriptSource, function(ok) {
        var result = {};
        if (!ok) {
            result = false;
        }
        callback({
            result: result
        });
    });
};


InspectorBackend.prototype.breakpointId = function(params) {
    return params.url + ":" + params.lineNumber + ":" + params.columnNumber;
};

InspectorBackend.prototype.breakpointLocation = function(breakpoint) {
    var script = this.dbg.scriptFromUri(breakpoint.uri);
    if (!script) {
        return null;
    }
    return {
        scriptId: script.scriptId,
        lineNumber: breakpoint.line - 1,
        columnNumber: 0
    };
};


InspectorBackend.prototype.enumerateBreakpoints = function() {
    var breakpoints = _.values(this.dbg.breakpoints);
    _.each(breakpoints, function(breakpoint) {
        this.dispatchMessage('Debugger.breakpointResolved', {
            breakpointId: breakpoint.id,
            location: this.breakpointLocation(breakpoint)
        });
    }, this);
};


InspectorBackend.prototype.breakpointResult = function(breakpoint) {
    return {
        breakpointId: breakpoint.id,
        locations: [this.breakpointLocation(breakpoint)]
    };
};


InspectorBackend.prototype.Debugger_removeBreakpoint = function(params, callback) {
    this.dbg.removeBreakpoint(params.breakpointId, function() {
        callback({result: {}});
    });
};


InspectorBackend.prototype.Debugger_setBreakpointByUrl = function(params, callback) {
    logger.debug('Debugger_setBreakpointByUrl: ' + JSON.stringify(params));
    var self = this;
    var fileUri = this.mapUrlToAppUri(params.url);
    this.dbg.createBreakpoint(fileUri, params.lineNumber + 1, params.condition, function(data) {
        var breakpoint = data.args.breakpoint;
        callback({
            result: {
                breakpointId: breakpoint.id,
                locations: [self.breakpointLocation(breakpoint)]
            }
        });
    });
};

InspectorBackend.prototype.Debugger_resume = function(params, callback) {
    this.setOverlayMessage();
    var self = this;
    setTimeout(function() {
        self.dbg.resume(self.suspendedThread, function() {
            callback({
                result: {}
            });
        });
    }, 100);
};

InspectorBackend.prototype.Debugger_stepInto = function(params, callback) {
    this.dbg.stepInto(this.suspendedThread, function() {
        callback({
            result: {}
        });
    });
};

InspectorBackend.prototype.Debugger_stepOver = function(params, callback) {
    this.dbg.stepOver(this.suspendedThread, function() {
        callback({
            result: {}
        });
    });
};

InspectorBackend.prototype.Debugger_stepOut = function(params, callback) {
    this.dbg.stepReturn(this.suspendedThread, function() {
        callback({
            result: {}
        });
    });
};



InspectorBackend.prototype.Debugger_evaluateOnCallFrame = function(params, callback) {
    var self = this;
    var frame = this.frames[params.callFrameId];
    frameName = this.frameFromFrameId(frame.callFrameId);
    var expression = params.expression;

    //The inspector sends and EvaluateOnCallFrame with expression = " "
    //when the user requests to add a watch expression, but the Ti debugger
    //doesn't like it. This hack solves the issue
    if (expression == " ") {
        expression = "true";
    }

    this.dbg.evaluate(this.suspendedThread, frameName, expression, function(data) {
        var result;
        var wasThrown = data.args.status == 'exception';
        if (!wasThrown) {
            result = self.remoteObjectFromVar(data.args.result, frame, frameName);
            result.evalId = 'eval[' + data.args.evalIdOrError + ']';
        }
        else {
            result = self.remoteObjectFromError(data.args.evalIdOrError);
        }

        callback({
            result: {
                result: result,
                wasThrown: wasThrown
            }
        });
    });
};



InspectorBackend.prototype.Page_canShowFPSCounter = function() {
    return {show: false};
};

InspectorBackend.prototype.Page_canContinuouslyPaint = function() {
    return {value: false};
};

InspectorBackend.prototype.Worker_canInspectWorkers = function() {
    return {result: false};
};


InspectorBackend.prototype.sendStateToFrontend = function() {
    logger.debug('sendStateToFrontend');
    this.enumerateLogs();
    this.enumerateScripts();
    this.enumerateBreakpoints();
    if (this.dbg.suspendedData) {
        this.suspended(this.dbg.suspendedData);
    }
};

InspectorBackend.prototype.Page_getResourceTree = function() {
    if (!this.initialized) {
        this.initialized = true;
        process.nextTick(this.sendStateToFrontend.bind(this));
    }
    return {result: {
        frameTree: this.frameTree
    }};
};


InspectorBackend.prototype.Page_getResourceContent = function() {
    return {content: "", base64Encoded: false};
};


InspectorBackend.prototype.Debugger_canSetScriptSource = function() {
    return {result: true};
};



InspectorBackend.prototype.invokeMethod = function(message) {
    if (this.messageLoggingEnabled) {
        logger.info('Got message: ' + JSON.stringify(message));
    } 
    var self = this;
    var method = message.method;
    var params = message.params;
    var id = message.id;

    var methodInvocation = method.replace(".", "_");
    if (!this[methodInvocation]) {
        this.dispatchResult({result: {}}, id);
        return;
    }

    var res = this[methodInvocation].call(this, params, function(r) {
        //logger.debug("got result: " + JSON.stringify(r));
        if (!res) {
            self.dispatchResult(r, id);
        }
    });
    if (res) {
        self.dispatchResult(res, id);
    }
};


InspectorBackend.prototype.dispatchResult = function(obj, id) {
    obj.id = id;
    if (!obj) {
        obj = {result: {}};
    }
    if (this.messageLoggingEnabled) {
        logger.info('Dispatching result: ' + JSON.stringify(obj));
    } 
    this.wsConnection.sendUTF(JSON.stringify(obj));
};


InspectorBackend.prototype.dispatchMessage = function(method, params) {
    var msg = {
        method: method,
        params: params
    };

    logger.debug("dispatching message: " + JSON.stringify(msg));
    this.wsConnection.sendUTF(JSON.stringify(msg));
};


InspectorBackend.prototype.mapAppUriToUrl = function(uri) {
    return uri.replace('app:', this.securityOrigin);
};

InspectorBackend.prototype.mapUrlToAppUri = function(url) {
    return url.replace(this.securityOrigin, 'app:');
};

InspectorBackend.prototype.translateScriptInfo = function(script) {
    return {
        scriptId: '' + script.scriptId,
        url: this.mapAppUriToUrl(script.uri),
        startLine: 0,
        startColumn: 0,
        endLine: script.linecount,
        endColumn: 0,
        isContentScript: false
    };
};

InspectorBackend.prototype.translateThreadInfo = function(thread) {
    return {
        id: thread.threadId,
        name: thread.name,
        isPageContext: true,
        frameId: this.frameTree.frame.id
    };
};


InspectorBackend.prototype.enumerateLogs = function() {
    var logMessages = this.dbg.logMessages;
    _.each(logMessages, function(log) {
        this.logAdded(log);
    }, this);
};

InspectorBackend.prototype.logAdded = function(log) {
    var level = 'log';
    if (/\[DEBUG\]/gi.test(log.message)) {
        level = 'debug';
    }
    else if (/\[ERROR\]/gi.test(log.message)) {
        level = 'error';
    }
    else if (/\[WARN\]/gi.test(log.message)) {
        level = 'warning';
    }

    this.dispatchMessage("Console.messageAdded", {
        message: {
            source: "console-api",
            level: level,
            text: log.message,
            type: "log"
        }
    });

    
};

InspectorBackend.prototype.Runtime_getProperties = function(params, callback) {
    var self = this;
    if (!this.frames) {
        callback({
            result: false
        });
        return;
    }


    var object = this.objects[params.objectId];
    if (!object) {
        callback({
            result: false
        });
        return;
    }

    logger.debug(object);

    if (object.variables) {

        callback({
            result: {
                result: _.map(object.variables, function(v) {
                    return v.toObj();
                })
            }
        });
        return;
    }

    var varName = object.evalId ? object.evalId : object.fullName;

    self.dbg.getFrameVariables(this.suspendedThread, varName, function(result) {
        
        callback({
            result: {
                result: self.mapVarDetails(result.args.variables, object.frame, varName)
            }
        });
    });

};



InspectorBackend.prototype.mapVarDetails = function(details, frame, parentName) {
    details = _.reject(details, function(v) {
        return _.contains(injectedVariables, v.name);
    });
    return _.map(details, function(v) {
        return this.propertyDescriptorFromVar(v, frame, parentName);
    }, this);
};

InspectorBackend.prototype.addObject = function(obj) {
    if (obj.objectId) {
        if (!this.objects) {
            this.objects = {};
        }
        this.objects[obj.objectId] = obj;
    }
};

InspectorBackend.prototype.varIsObject = function(v) {
    if (v.flags.indexOf('o') != -1) {
        return true;
    }
    return false;
};
  

InspectorBackend.prototype.remoteObjectFromVar = function(v, frame, parentName) {
    var self = this;
    var remoteObj = new RemoteObject();

    if (this.varIsObject(v)) {
        _.extend(remoteObj, {
            fullName: [parentName, v.name].join('.'),
            objectId: this.newObjectId(frame),
            type: 'object',
            className: v.type,
            description: v.value,
            frame: frame
        });
        this.addObject(remoteObj);
    }
    else {
        var value = v.value;
        if (v.type == 'string') {
            value = value.substring(1, value.length-1); //trim ""
        }
        _.extend(remoteObj, {
            type: v.type,
            value: value
        });
    }
    return remoteObj;
};


InspectorBackend.prototype.remoteObjectFromError = function(message) {
    return new RemoteObject({
        type: 'string',
        description: message,
        className: 'Error',
        value: message
    });
};


InspectorBackend.prototype.parseVarFlags = function(v) {
    var flagsMapping = {
        configurable: true
    };
    var flags = v.flags;
    if (flags) {
        for (var i = 0; i < v.flags.length; i++) {
            var c = flags.charAt(i);
            if (c == 'w') {
                flagsMapping.writable = true;
            }
            else if (c == 'n') {
                flagsMapping.enumerable = true;
            }
            else if (c == 'p') {
                flagsMapping.configurable = false;
            }
        }
    }
    return flagsMapping;
};

InspectorBackend.prototype.propertyDescriptorFromVar = function(v, frame, parentName) {

    var pd = new PropertyDescriptor({
        name: v.name,
        value: this.remoteObjectFromVar(v, frame, parentName),
        isOwn: true
    });

    _.extend(pd, this.parseVarFlags(v));
    return pd;
};


InspectorBackend.prototype.newObjectId = function(frame) {
    if (!frame) {
        if (!this.freeObjectId) {
            this.freeObjectId = 1;
        }
        return JSON.stringify({
            objectId: this.freeObjectId++
        });
    }
    return JSON.stringify({
        frameId: frame.callFrameId,
        objectId: frame.maxObjectId++
    });
};



InspectorBackend.prototype.mapVariables = function(variables, frame, parentName) {
    var self = this;
    var scopes = {};
    var thisObj;

    var frameName = this.frameFromFrameId(frame.callFrameId);

    var createScopeIfNeeded = function(type) {
        if (!scopes[type]) {
            var scope = new RemoteObject({
                type: 'object',
                objectId: self.newObjectId(frame),
                className: 'Object',
                description: 'Object',
                variables: []
            });
            scopes[type] = scope;
            self.addObject(scope);
        }
        return scopes[type];
    };

    logger.debug('variables:');
    _.each(variables, function(v) {
        if (_.contains(injectedVariables, v.name)) {
            return;
        }

        var scope;
        logger.debug('>>> ' + JSON.stringify(v));
        if (v.flags.indexOf('v') != -1) {
            scope = createScopeIfNeeded('global');
            scope.variables.push(self.propertyDescriptorFromVar(v, frame, parentName));
        }
        else if (v.flags.indexOf('l') != -1) {
            scope = createScopeIfNeeded('local');
            scope.variables.push(self.propertyDescriptorFromVar(v, frame, parentName));
        }   
        else if (v.name == 'this') {
            thisObj = new RemoteObject({
                fullName: [frameName, 'this'].join('.'),
                name: 'this',
                type: v.type,
                objectId: self.newObjectId(frame),
                className: v.value,
                description: v.value
            });
            self.addObject(thisObj);
        }
    });

    _.extend(frame, {
        "scopeChain": _.map(scopes, function(obj, type) {
            return {
                object: obj.toObj(),
                type: type
            };
        }),
        "this": thisObj
    });
};


InspectorBackend.prototype.frameId = function(item) {

    return JSON.stringify({
        script: item.file,
        line: item.line,
        frame: 'frame[' + item.frameId + ']'
    });
};

InspectorBackend.prototype.frameFromFrameId = function(frameId) {
    logger.debug('frameFromFrameId - ' + frameId);
    data = JSON.parse(frameId);
    logger.debug(data);
    if (!data.frame) {
        return null;
    }
    return data.frame;
};



InspectorBackend.prototype.resumed = function(data) {
    this.frames = null;
    this.objects = null;
    this.suspendedThread = null;
    this.suspendedReason = null;
    this.dispatchMessage('Debugger.resumed');
};


InspectorBackend.prototype.sendDebuggerPaused = function() {
    logger.debug("sendDebuggerPaused");
    var message = {
        callFrames: _.map(_.values(this.frames), function(frame) { 
                return frame.toObj();
        }),
        reason: this.suspendedReason == 'exception' ? 'exception': 'other'
    };

    if (message.reason == 'exception') {
        message.data = this.remoteObjectFromError('Exception');
    }

    this.dispatchMessage('Debugger.paused', message);
};

InspectorBackend.prototype.suspended = function(data) {
    logger.debug('suspended');
    var self = this;
    var threadId = data.threadId;

    this.suspendedThread = threadId;

    self.frames = {};
    self.suspendedReason = data.reason;

    this.setOverlayMessage('Paused in debugger');

    var processFrames = function(frameArray, callback) {
        var item = frameArray.shift();
        if (!item) {
            callback();
            return;
        }

        var frameId = self.frameId(item);
        logger.debug('FRAME: ' + item.frameId);
        var script = self.dbg.scriptFromUri(item.file);
        var frame = new CallFrame({
            callFrameId: frameId,
            functionName: item["function"],
            location: {
                columnNumber: 0,
                lineNumber: item.line - 1,
                scriptId: script.scriptId
            },
            maxObjectId: 1
        });

        self.frames[frameId] = frame;

        self.dbg.getFrameVariables(threadId, self.frameFromFrameId(frameId), function(result) {
            self.mapVariables(result.args.variables, frame, 'frame[' + item.frameId + ']');
            processFrames(frameArray, callback);
        });

    }; 


    this.dbg.getFrames(threadId, function(result) {
        logger.debug(JSON.stringify(result));
        processFrames(result.args.frames, function() {
            logger.debug('frames: ' + JSON.stringify(self.frames));
            self.sendDebuggerPaused();
        });
    });
    
};

InspectorBackend.prototype.scriptAdded = function(script) {
    logger.debug('SCRIPT_ADDED: ' + script.uri);
    var scriptInfo = this.translateScriptInfo(script);
    this.dispatchMessage("Debugger.scriptParsed", scriptInfo);
};


InspectorBackend.prototype.enumerateScripts = function(script) {
    var scripts = _.values(this.dbg.scripts);
    _.each(scripts, function(script) {
        var scriptInfo = this.translateScriptInfo(script);
        this.dispatchMessage("Debugger.scriptParsed", scriptInfo);
    }, this);
};

InspectorBackend.prototype.threadAdded = function(thread) {
    var threadInfo = {
        context: this.translateThreadInfo(thread)
    };
    this.dispatchMessage("Runtime.executionContextCreated", threadInfo);
};



InspectorBackend.prototype.scriptRemoved = function(script) {

};



module.exports = InspectorBackend;