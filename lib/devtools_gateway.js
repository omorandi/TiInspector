var util = require('util'),
    EventEmitter = require('events').EventEmitter,
    _ = require('underscore'),
    crypto = require('crypto'),
    logger = require('./logger'),
    Debugger = require('./tidebugger/debugger'),
    InspectorBackend = require('./InspectorBackend/InspectorBackend');



var AppConnection = function(wsConn) {
    this.wsConnection = wsConn;
};

AppConnection.prototype.sendMessage = function(message, data) {
    logger.debug('send app message: ' + message + ' ' + JSON.stringify(data));
    var msg = {
        message: message,
        data: data
    };
    this.wsConnection.sendUTF(JSON.stringify(msg));
};




var DevtoolsGateway = function(tiProject) {
    this.backendSessions = [];
    this.appConnections = [];
    this.tiProject = tiProject;
};


util.inherits(DevtoolsGateway, EventEmitter);


DevtoolsGateway.prototype.genSessionId = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
};


DevtoolsGateway.prototype.addSession = function(debuggerBackend) {
    var sessionId = this.genSessionId();
    var dbg = new Debugger(debuggerBackend, this.tiProject);
    var session = {
        id: sessionId,
        backend: debuggerBackend,
        dbg: dbg
    };
    this.backendSessions.push(session);
    return session;
};


DevtoolsGateway.prototype.findSession = function(sessionId) {
    return _.find(this.backendSessions, function(s) {
        return s.id == sessionId;
    });
};


DevtoolsGateway.prototype.removeSession = function(debuggerBackend) {
    var session = null;
    this.backendSessions = _.reject(this.backendSessions, function(s) {
        if (s.backend == debuggerBackend) {
            session = s;
            return true;
        }
        return false;
    });

    return session;
};

DevtoolsGateway.prototype.createSessionInfo = function(session) {
    return {
        id: session.id,
        remoteEndpoint: session.backend.endpoint.remoteEndpoint(),
        sdkVersion: session.sdkVersion
    };
};

DevtoolsGateway.prototype.newDebuggerSession = function(debuggerBackend) {
    var self = this;

    var session = this.addSession(debuggerBackend);

    session.dbg.getVersion(function(data) {
        session.sdkVersion = data.args.extensionVersion;
        var sessionInfo = self.createSessionInfo(session);
        self.dispatchMessageToApp('backendSessionDidStart', sessionInfo);
    });

    return session;
};


DevtoolsGateway.prototype.debuggerSessionClosed = function(debuggerBackend) {
    var session = this.removeSession(debuggerBackend);
    var sessionInfo = this.createSessionInfo(session);

    if (session.frontend) {
        session.frontend.disconnect();
    }
    this.dispatchMessageToApp('backendSessionDidStop', sessionInfo);
    return sessionInfo;
};


DevtoolsGateway.prototype.enumerateDebuggerSessions = function() {
    var sessions = [];
    var self = this;
    _.each(this.backendSessions, function(s) {
        var sessionInfo = self.createSessionInfo(s);
        sessions.push(sessionInfo);
    });
    return sessions;
};


DevtoolsGateway.prototype.frontendAttached = function(sessionId, conn) {
    var session = this.findSession(sessionId);
    var self = this;
    if (!session) {
        logger.error('Devtools frontend trying to attach to a stale session');
        return;
    }
    logger.debug('Devtools frontend attached for session: ' + session.id);

    var inspector = new InspectorBackend(conn, session.dbg, this.tiProject.appName);
    inspector.messageLoggingEnabled = this.logMessages;
    
    conn.on('message', function(message) {
        try 
        {
            if (message.type === 'utf8') {
                logger.debug('Received Message: ' + message.utf8Data);
                var msg = JSON.parse(message.utf8Data);

                inspector.invokeMethod(msg);
            }
        }
        catch (e) {
            logger.error('An exception occurred while processing a message');
            logger.error('Message: ' + JSON.stringify(message));
            logger.error('Exception: ' + e.message);
            if (e.stack) {
                logger.error('Backtrace:');
                e.stack.split('\n').forEach(function(e){logger.error(e);});
            }
        }
    });

    var messageHandler = function(msg) {
        var method = msg.message;
        var params = msg.data;

        if (inspector[method]) {
            inspector[method].call(inspector, params);
        }
    };

    session.dbg.on('message', messageHandler);

    session.frontend = inspector;
    return {
        inspector: inspector,
        dbgMessageHandler: messageHandler
    };
};

DevtoolsGateway.prototype.frontendDetached = function(sessionId, inspectorInfo) {
    var session = this.findSession(sessionId);
    if (!session) {
        return;
    }
    session.dbg.removeListener('message', inspectorInfo.dbgMessageHandler);
};

DevtoolsGateway.prototype.dispatchMessageToInspector = function(inspector, message, data) {
    if (inspector[message]) {
        inspector[message].call(inspector, data);
    }
};


DevtoolsGateway.prototype.newAppConnection = function(appConnection) {
    this.appConnections.push(appConnection);
    var sessions = this.enumerateDebuggerSessions();
    this.dispatchMessageToApp('backendSessions', sessions);
};

DevtoolsGateway.prototype.appConnectionClosed = function(appConnection) {
    var index = _.indexOf(this.appConnections, appConnection);
    if (index != -1) {
        this.appConnections.splice(index, 1);
    }
};

DevtoolsGateway.prototype.dispatchMessageToApp = function(message, data) {
    _.each(this.appConnections, function(appConnection) {
        appConnection.sendMessage(message, data);
    });
};


module.exports = {
    DevtoolsGateway: DevtoolsGateway,
    AppConnection: AppConnection
};
