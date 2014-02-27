(function(TiInspector) {
    /* jshint boss:true */
    'use strict';


    TiInspector.loadInspector = function loadInspector() {

        function loadCssInIframe(url) {
            if (!url) {
                return;
            }
            var iframe = document.getElementById("devtools-frame");
            $(iframe.contentDocument.head).append('<link rel="stylesheet" type="text/css" href="' + url +'">');
        };


        $('#devtools-frame').load(function() {
            if (TiInspector.preferences) {
                loadCssInIframe(TiInspector.preferences.devtools_theme);
            }
            loadCssInIframe('/css/inspector-overrides.css');
        });

        var sessionId = window.location.hash.replace('#', '');

        var activeSession = null;

        function devToolsUrl(sessionId) {
            return "/inspector/devtools.html?ws=" + window.location.host + "/devtools/page/" + sessionId;
        }

        function setDevToolsUrl(sessionId) {
            if (activeSession) {
                return; //if there's an active session we keep it
            }
            activeSession = sessionId;
            var iframe = document.getElementById("devtools-frame");
            var url = devToolsUrl(sessionId);
            iframe.contentWindow.location.replace(url);
        }

        function changeWindowUrl(sessionId) {
            var newUrl = window.location.pathname + '#';
            if (sessionId) {
                newUrl += sessionId;
            }
            window.location.replace(newUrl);
        }

        setDevToolsUrl(sessionId);

        var ws = new WebSocket("ws://" +  window.location.host);

        ws.onmessage = function (message) {
            var msg = JSON.parse(message.data);

            if (msg.message == 'backendSessionDidStart') {
                var newSession = msg.data;
                setDevToolsUrl(newSession.id);
                changeWindowUrl(newSession.id);
                return;
            }
            if (msg.message == 'backendSessionDidStop') {
                activeSession = null;
                return;
            }
        };

        ws.onclose = function() {
            changeWindowUrl(null);
        };
    };

})(TiInspector || (TiInspector = {}));
/* vim:set ts=4 sw=4 et fdm=marker: */
