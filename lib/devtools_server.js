var Http = require('http'),
    EventEmitter = require('events').EventEmitter,
    express = require('express'),
    WebSocketServer = require('websocket').server,
    inherits = require('util').inherits,
    config = {},
    path = require('path'),
    routes = require('../routes/routes'),
    logger = require('./logger'),
    DebugServer = require('./tidebugger/server'),
    DevtoolsGateway = require('./devtools_gateway').DevtoolsGateway,
    AppConnection = require('./devtools_gateway').AppConnection;

var DTServer = function() {

};

inherits(DTServer, EventEmitter);

DTServer.prototype.start = function(config, tiProject) {
    var self = this;

    var app = express();

    app.configure(function(){
      app.set('port', config.webPort);
      app.set('host', config.webHost);
      app.set('views', path.join(__dirname, '../views'));
      app.set('view engine', 'jade');
      app.use(express.favicon());
      //app.use(express.logger('dev'));
      app.use(express.bodyParser());
      app.use(express.methodOverride());
      app.use(app.router);
      app.use(express["static"](path.join(__dirname, '../public')));
    });

    app.configure('development', function(){
      app.use(express.errorHandler());
    });

    routes.tiProject = tiProject;
    routes.currentSessionId = null;

    app.get('/', routes.index);
    app.get('/inspector', routes.inspector);
    app.get('/appicon', routes.appicon);

    app.get('/tiapp', function(req, res){
        tiProject.loadTiAppXml(function(err, tiapp) {
            var body = JSON.stringify(tiapp);
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Length', body.length);
            res.end(body);
        });
    });

    app.get('/manifest', function(req, res){
        tiProject.loadManifest(function(err, data) {
            var body;
            if (err) {
                body = err.message;
            }
            else {
                body = JSON.stringify(data);
                res.setHeader('Content-Type', 'application/json');
            }
            res.setHeader('Content-Length', body.length);
            res.end(body);
        });
    });


    this.dtGateway = new DevtoolsGateway(tiProject);

    this.dtGateway.logMessages = config.logMessages;

    this.debugServer = new DebugServer(config.debuggerPort);

    this.debugServer.packetLoggingEnabled = config.logPackets;

    this.debugServer.on('listening', function(s) {
        logger.info('Debug server listening on port: ' + s.port);
    });

    this.debugServer.on('connected', function(debuggerBackend) {
        var session = self.dtGateway.newDebuggerSession(debuggerBackend);
        routes.currentSessionId = session.id;
        logger.info('Debugger connected with session id: ' + session.id);
    });

    this.debugServer.on('disconnected', function(debuggerBackend) {
        var session = self.dtGateway.debuggerSessionClosed(debuggerBackend);
        logger.info('Debugger session ' + session.id + ' disconnected');
        routes.currentSessionId = null;
    });

    this.debugServer.listen();


    var httpServer = Http.createServer(app);

    var wsServer = new WebSocketServer({
        httpServer: httpServer,
        // You should not use autoAcceptConnections for production
        // applications, as it defeats all standard cross-origin protection
        // facilities built into the protocol and the browser.  You should
        // *always* verify the connection's origin and decide whether or not
        // to accept it.
        autoAcceptConnections: false
    });

    this.wsServer = wsServer;

    function originIsAllowed(origin) {
      //FIXME: do a check on the origin
      return true;
    }

    wsServer.on('request', function(request) {
        if (!originIsAllowed(request.origin)) {
            // Make sure we only accept requests from an allowed origin
            request.reject();
            logger.error('Connection from origin ' + request.origin + ' rejected.');
            return;
        }

        var connection = request.accept(null, request.origin);
        logger.info('WebSocket connection accepted from resource: ' + request.resource);

        if (request.resource == '/') {
            var appConnection = new AppConnection(connection);
            self.dtGateway.newAppConnection(appConnection);

            connection.on('close', function(reasonCode, description) {
                logger.info('App socket disconnected.');
                self.dtGateway.appConnectionClosed(appConnection);
            });

            return;
        }
        

        if (request.resource.indexOf('/devtools/page/') !== 0) {
            return;
        }

        var sessionId = request.resource.replace('/devtools/page/', '');
        var inspectorInfo = self.dtGateway.frontendAttached(sessionId, connection);

        connection.on('close', function(reasonCode, description) {
            logger.info('Devtools Frontend socket disconnected.');
            if (inspectorInfo) {
                self.dtGateway.frontendDetached(sessionId, inspectorInfo);
            }
        });

        

        
    });


    httpServer.on('listening', function() {
        logger.info('Devtools server listening on port: ' + app.get('port'));
    });

    httpServer.listen(app.get('port'), app.get('host'));

};

DTServer.prototype.close = function() {
    if (this.wsServer) {
        this.wsServer.close();
        this.emit('close');
    }
};


exports.DTServer = DTServer;
