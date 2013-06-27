#!/usr/bin/env node

var DTServer = require('../lib/devtools_server').DTServer,
    fs = require('fs'),
    path = require('path'),
    TiProject = require('../lib/TiProject'),
    options = {
      webPort: 8080,
      debuggerPort: 8999
    };

    //if no argument is passed, we assume to be in a Ti Project directory
    projectDir = './';


function usage() {
  console.log('Usage: node-inspector [options] [tiprojectdir]');
  console.log('Options:');
  console.log('--web-host=[host]      host for the inspector server (default localhost)');
  console.log('--web-port=[port]      port for the inspector server (default 8080)');
  console.log('--debugger-port=[port] port for the Titanium debug server (default 8999)');
  process.exit();
}


function startServer(tiProject) {
  var dtServer = new DTServer();
  dtServer.start(options, tiProject);
}

process.argv.splice(0, 2);

process.argv.forEach(function (arg) {
  var parts;
  if (arg.indexOf('--') > -1) {
    parts = arg.split('=');
    if (parts.length > 1) {
      switch (parts[0]) {
      case '--web-port':
        options.webPort = parseInt(parts[1], 10);
        break;
      case '--web-host':
        options.webHost = (parts[1] && parts[1] !== 'null') ? parts[1] : null;
        break;
      case '--debugger-port':
        options.debuggerPort = parseInt(parts[1], 10);
        break;
      default:
        console.log('unknown option: ' + parts[0]);
        break;
      }
    }
    else if (parts[0] === '--logpackets') {
      options.logPackets = true;
    }
    else if (parts[0] === '--logmessages') {
      options.logMessages = true;
    }
    else if (parts[0] === '--help') {
      usage();
    }
  }
  else {
    projectDir = arg;
  }
});


projectDir = path.resolve(projectDir);

if (!projectDir) {
  usage();
}


var tiProject = new TiProject(projectDir);
tiProject.attachToTiProject(function(err, results) {
  if (err) {
      console.log('Error: ' + projectDir + ' does not contain a valid Titanium Mobile project');
      process.exit();
  }
  startServer(tiProject);
});


