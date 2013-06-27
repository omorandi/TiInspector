#Ti Inspector

Ti Inspector allows debugging Appcelerator Titanium applications in the Chrome DevTools web interface.

The tool acts as a gateway by translating commands and messages between the [Chrome DevTools Debugging Protocol](https://developers.google.com/chrome-developer-tools/docs/protocol/1.0/) and the [Titanium Debugger Protocol](http://docs.appcelerator.com/titanium/latest/#!/guide/Debugger_Protocol) (and vice-versa).

Currently only the iOS target platform is supported. Android support will be added as soon as possible.


##Install

For running Ti Inspector a working [node.js](http://nodejs.org/) setup is required.

The Ti Inspector module can be installed through npm with

~~~
	$ sudo npm install -g ti-inspector
~~~

##Using Ti Inspector

The ti-inspector script can be invoked from the command line with the following arguments:

~~~
	ti-inspector [Options] [TiProjectDir]
	
	options:
       --web-host=[host]      host for the inspector server (default localhost)
       --web-port=[port]      port for the inspector server (default 8080)
       --debugger-port=[port] port for the Titanium debug server (default 8999)
		
	TiProjectDir: 
       Directory containing a Titanium app project. 
       If not specified, the current directory is used.
~~~

Supposing you have a terminal open on a directory containing the Titanium project you want to debug you can simply issue:

~~~
	$ ti-inspector
~~~

which runs the script with the default argument values, then point the browser to http://localhost:8080 where a web page for the current project is shown, telling that no active debugging session is present.

![](./screenshots/web-no-sessions.png)

In order to start the Titanium application for debugging it, you have to use the Titanium CLI `build` command, using the `--debug-host` hidden option. For example:

~~~
	$ titanium build -p iphone --debug-host localhost:8999
~~~

The `--debug-host` argument represents the `host:port` pair where the debug server is listening. This is normally provided by Titanium Studio when the project is started in debug mode, however in our case Ti Inspector will act as a debug server (listening by default on tcp port 8999) for the running app. 

Once the app is running in the iOS Simulator, only the splash screen will be visible, while in the page previously opened in the browser will list the current debug session:

![](./screenshots/web-active-session.png)

By clicking on it, the DevTools page will be open, showing the `app.js` file source code, stopped on the first executable line:

![](./screenshots/debug-session.png)

From there on, you can debug your application by setting breakpoints, stepping through code, watching variables, or evaluating expressions in the console panel, etc.

**Note**: 
At first only the `app.js` file will be visible in the *Sources* panel. The other files of your Titanium project will become visible only when actually `require()`d during the execution of the app. 

