(function() {
    if (typeof TiInspector == "undefined") {
        TiInspector = {};
    }

    TiInspector.loadDashboard = function loadDashboard() {
        var Session = Backbone.Model.extend({
            id: null,
            remoteEndpoint: null,
            sdkVersion: null
        });

        var Sessions = Backbone.Collection.extend({
            initialize: function (models, options) {
                this.bind("add", options.view.addSessionLi);
                this.bind("remove", options.view.removeSessionLi);
            }
        });

        window.AppView = Backbone.View.extend({
            el: $("body"),
            initialize: function () {
                this.sessions = new Sessions( null, { view: this });
                this.updateSessionHeader();
            },

            updateSessionHeader: function() {
                var header = $("#sessions-header");
                if (this.sessions.length === 0) {
                    header.text("No debugger sessions attached");
                }
                else {
                    header.text("Debugger sessions:");
                }
            },

            addSession: function (data) {
                var sessionModel = new Session(data);
                this.sessions.add(sessionModel);
                this.updateSessionHeader();
            },
            addSessionLi: function (model) {
                var sessionId = model.get('id');
                $("#sessions-list").append('<tr id="' + sessionId + '"><td><a href="/inspector#' + sessionId + '">' + sessionId + '</a></td><td>from ' + model.get("remoteEndpoint").join(":") + '</td><td>SDK: ' + model.get("sdkVersion") + '</td><td><i class="icon-chevron-right"></i></td></tr>');
            },

            removeSession: function (data) {
                var sessionModel = this.sessions.findWhere({id: data.id});
                this.sessions.remove(sessionModel);
                this.updateSessionHeader();
            },
            removeSessionLi: function (model) {
                var sessionId = model.get('id');
                console.log('removing row: ' + sessionId);
                $("#" + sessionId).remove();
            }
        });

        var appview = new AppView();




        var ws = new WebSocket("ws://" +  window.location.host);

        var backendSessions = [];

        ws.onmessage = function (message) {
            console.log("Received: '" + message.data + "'");
            var msg = JSON.parse(message.data);
            if (msg.message == 'backendSessions') {
                backendSessions = msg.data;
                _.each(backendSessions, function(data) {
                    appview.addSession(data);
                });
                return;
            }
            if (msg.message == 'backendSessionDidStart') {
                appview.addSession(msg.data);
                return;
            }
            if (msg.message == 'backendSessionDidStop') {
                appview.removeSession(msg.data);
                return;
            }
        };
    }


}())