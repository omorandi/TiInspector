var util = require('util'),
    EventEmitter = require('events').EventEmitter,
    logger = require('../logger'),
    _ = require('underscore');

var Debugger = function(debuggerBackend, tiProject) {
    this.backend = debuggerBackend;
    this.threads = {};
    this.scripts = {};
    this.scriptUriToIdMap = {};
    this.breakpoints = {};
    this.logMessages = [];
    this.options = {};
    this.tiProject = tiProject;
    var self = this;
    debuggerBackend.on('message', function(msg) {
        //self.notifyBackendMessage(message);
        //logger.debug("notifyBackendMessage: " + JSON.stringify(msg));
        var method = 'dbg_' + msg.message;
        if (self[method]) {
            self[method].call(self, msg.args);
        }
    });

    this.enumerateScripts();
};


util.inherits(Debugger, EventEmitter);


Debugger.prototype.newScriptId = function() {
    if (!this.lastScriptId) {
        this.lastScriptId = 0;
    }
    this.lastScriptId++;
    return this.lastScriptId;
};

Debugger.prototype.enumerateScripts = function() {
    var self = this;
    this.tiProject.findResourceFilesOfType('.js', function(err, fileName) {
        var scriptId = self.newScriptId();
        self.addScript({
            scriptId: scriptId,
            uri: fileName.replace(self.tiProject.projectFile('Resources'), 'app:'),
            "function": '',
            line: 0,
            linecount: 0
        });
    });
};

Debugger.prototype.dispatchMessage = function(message, data) {
    var msg = {
        message: message,
        data: data
    };
    this.emit('message', msg);
};


Debugger.prototype.dispatchCommand = function(command, args, callback) {
    if (!this.backend) {
        callback();
        return;
    }

    this.backend.sendCommand({
        command: command,
        args: args
    }, callback);
};


Debugger.prototype.newThread = function(thread) {
    this.threads[thread.threadId] = thread;
    this.dispatchMessage('threadAdded', thread);
};

Debugger.prototype.removeThread = function(thread) {
    thread = this.threads[thread.threadId];
    delete this.threads[thread.threadId];
    this.dispatchMessage('threadRemoved', thread);
};

Debugger.prototype.scriptFromUri = function(uri) {
    var platformUris = _.map(['/iphone', ''], function(platformDir) {
        return uri.replace('app:', 'app:' + platformDir);
    });
    var which =  _.find(platformUris, function(platformSpecificUri) {
        return this.scriptUriToIdMap[platformSpecificUri] != null;
    }, this);

    var scriptId = this.scriptUriToIdMap[which];
    if (!scriptId) {
        return null;
    }
    return this.scripts[scriptId];
};

Debugger.prototype.addScript = function(script) {
    var scriptId = '' + script.scriptId;
    this.scripts[scriptId] = script;
    this.scriptUriToIdMap[script.uri] = scriptId;
    this.dispatchMessage('scriptAdded', script);
};


Debugger.prototype.newScript = function(script) {
    var s = this.scriptFromUri(script.uri);
    if (!s) {
        script.scriptId += '';
        this.addScript(script);
    }
};

Debugger.prototype.removeScript = function(script) {
    script = this.scripts[script.scriptId];
    delete this.scripts[script.scriptId];
    delete this.scriptUriToIdMap[script.uri];
    this.dispatchMessage('scriptRemoved', script);
};

Debugger.prototype.dbg_threads = function(data) {
    if (data.action == 'created') {
        this.newThread({
            threadId: data.threadId,
            name: data.name
        });
    }
    else if (data.action == 'destroyed') {
        this.removeThread(data.id);
    }
};


Debugger.prototype.dbg_scripts = function(data) {
    var self = this;
    if (data.action == 'created') {
        _.each(data.scripts, function(script) {
            self.newScript(script);
        });
    }
    else if (data.action == 'resolved') {
        _.each(data.scripts, function(script) {
            self.newScript(script);
        });
    }
    else if (data.action == 'destroyed') {
        _.each(data.scripts, function(script) {
            self.removeScript(script);
        });
    }

};


Debugger.prototype.dbg_log = function(log) {
    log.message = new Date() + log.message;
    this.logMessages.push(log);
    this.dispatchMessage('logAdded', log);
};

Debugger.prototype.dbg_suspended = function(data) {
    this.suspendedData = data;
    this.dispatchMessage('suspended', data);
};

Debugger.prototype.dbg_resumed = function(data) {
    this.suspendedData = null;
    this.dispatchMessage('resumed', data);
};



Debugger.prototype.enable = function(callback) {
    this.enabled = true;
    this.dispatchCommand('enable', null, callback);
};


Debugger.prototype.setOption = function(name, value, callback) {
    this.options[name] = value;
    this.dispatchCommand('option', {name: name, value: value}, callback);
};

Debugger.prototype.getVersion = function(callback) {
    this.dispatchCommand('version', null, callback);
};

Debugger.prototype.getSource = function(scriptId, callback) {
    //logger.debug('Debugger.getSource scriptId: ' + scriptId);
    var script = this.scripts[scriptId];
    if (!script) {
        callback(null);
        return;
    }
    var uri = '' + script.uri;

    uri = uri.replace('app:', 'Resources');
    //logger.debug('uri: ' + uri);
    this.tiProject.readSourceFile(uri, function(err, data) {
        //logger.debug("read project file")
        if (err) {
            logger.debug("error: " + JSON.stringify(err));
            data = null;
        }
        callback(data);
    });

};


Debugger.prototype.setSource = function(scriptId, scriptSource, callback) {
    logger.debug('Debugger.setSource scriptId: ' + scriptId);
    var script = this.scripts[scriptId];
    if (!script) {
        callback(null);
        return;
    }
    var uri = '' + script.uri;

    uri = uri.replace('app:', 'Resources');
    logger.debug('uri: ' + uri);
    this.tiProject.writeSourceFile(uri, scriptSource, function(err, data) {
        //logger.debug("read project file")
        if (err) {
            logger.debug("error: " + JSON.stringify(err));
            data = false;
        }
        callback(true);
    });

};


Debugger.prototype.resume = function(threadId, callback) {
    this.dispatchCommand('resume', {threadId: threadId}, callback);
};

Debugger.prototype.suspend = function(threadId, callback) {
    this.dispatchCommand('suspend', {threadId: threadId}, callback);
};


Debugger.prototype.evaluate = function(threadId, context, expression, callback) {
    this.dispatchCommand('eval', {
        threadId: threadId,
        context: context,
        expression: expression
    }, callback);
};


Debugger.prototype.breakpointId = function(breakpoint) {
    return breakpoint.uri + ':' + breakpoint.line;
};


Debugger.prototype.breakpoint = function(uri, line, condition) {
    return {
        uri: uri,
        line: line,
        state: 1, //enabled
        condition: condition
    };
};

Debugger.prototype.addBreakpoint = function(breakpoint) {
    var breakpointId = this.breakpointId(breakpoint);
    breakpoint.id = breakpointId;

    this.breakpoints[breakpoint.id] = breakpoint;

    return breakpoint;
};

Debugger.prototype.clearBreakpoint = function(breakpointId) {
    delete this.breakpoints[breakpointId];
};


Debugger.prototype.removeBreakpoint = function(breakpointId, callback) {
    var self = this;
    var breakpoint = this.breakpoints[breakpointId];
    if (!breakpoint) {
        return;
    }
    var data = {
        action: 'remove',
        uri: breakpoint.uri,
        line: breakpoint.line
    };

    this.dispatchCommand('breakpoint', data, function(result) {
        self.clearBreakpoint(breakpointId);
        logger.debug('removeBreakpoint callback' + JSON.stringify(result));
        callback(result);
    });
};



Debugger.prototype.createBreakpoint = function(uri, line, condition, callback) {
    var self = this;
    var breakpoint = this.breakpoint(uri, line, condition);
    logger.debug('createBreakpoint: ' + JSON.stringify(breakpoint));
    var data = {
        action: 'create'
    };
    _.extend(data, breakpoint);
    delete data.id; //

    this.dispatchCommand('breakpoint', data, function(result) {
        result.args.breakpoint = self.addBreakpoint(breakpoint);
        logger.debug('createBreakpoint callback' + JSON.stringify(result));
        callback(result);
    });
};

Debugger.prototype.getFrames = function(threadId, callback) {
    this.dispatchCommand('frames', {
        threadId: threadId
    }, callback);
};

Debugger.prototype.getFrameVariables = function(threadId, frame, callback) {
    this.dispatchCommand('variables', {
        threadId: threadId,
        frameId: frame
    }, callback);
};


Debugger.prototype.getVariableDetails = function(threadId, variable, callback) {
    this.dispatchCommand('details', {
        threadId: threadId,
        variableName: variable
    }, callback);
};


Debugger.prototype.stepInto = function(threadId, callback) {
    this.dispatchCommand('stepInto', {
        threadId: threadId
    }, callback);
};


Debugger.prototype.stepOver = function(threadId, callback) {
    this.dispatchCommand('stepOver', {
        threadId: threadId
    }, callback);
};


Debugger.prototype.stepReturn = function(threadId, callback) {
    this.dispatchCommand('stepReturn', {
        threadId: threadId
    }, callback);
};


Debugger.prototype.notifyBackendMessage = function(msg) {
    logger.debug("notifyBackendMessage: " + JSON.stringify(msg));
    if (this[msg.message]) {
        logger.debug(this[msg.message]);
        this[msg.message].call(this, msg.args);
    }

};


module.exports = Debugger;
