(function() {
    if (typeof TiInspector == "undefined") {
        TiInspector = {};
    }


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

        $('#alert').modal({
            show: false,
            keyboard: false,
            backdrop: 'static'
        });


        var sessionId = window.location.hash.replace('#', '');

        var activeSession = null;

        function devToolsUrl(sessionId) {
            return "/inspector/devtools.html?ws=localhost:8080/devtools/page/" + sessionId;
        }

        function setDevToolsUrl(sessionId) {
            if (activeSession) {
                return; //if there's an active session we keep it
            }
            activeSession = sessionId;
            var iframe = document.getElementById("devtools-frame");
            iframe.contentWindow.location.replace(devToolsUrl(sessionId)); 
        }

        function changeWindowUrl(sessionId) {
            var newUrl = window.location.pathname + '#';
            if (sessionId) {
                newUrl += sessionId;
            }
            window.location.replace(newUrl);
        }

        setDevToolsUrl(sessionId);

        var ws = new WebSocket("ws://localhost:8080", "webapp");

        ws.onmessage = function (message) {
            var msg = JSON.parse(message.data);

            if (msg.message == 'backendSessionDidStart') {
                $('#alert').modal('hide');
                var newSession = msg.data;
                setDevToolsUrl(newSession.id);
                changeWindowUrl(newSession.id);
                return;
            }
            if (msg.message == 'backendSessionDidStop') {
                activeSession = null;
                $('#alert').modal('show');
                return;
            }
        };

        ws.onclose = function() {
            changeWindowUrl(null);
        };
    }

}())