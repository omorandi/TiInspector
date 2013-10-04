
(function() {

    var patchWebInspector = function() {
        var _toggleConsoleButtonClicked = WebInspector._toggleConsoleButtonClicked;

        WebInspector._toggleConsoleButtonClicked = function() {
            _toggleConsoleButtonClicked.call(this);
            window.localStorage["toggleConsoleButton.toggled"] = this._toggleConsoleButton.toggled;

        };
    };


    //this should actually be replaced by a proper WebInspector event listener
    setTimeout(function() {
        var toggled = window.localStorage["toggleConsoleButton.toggled"];
        console.log(toggled);
        if (toggled === 'true') {
            WebInspector.showConsole();
        }
    }, 1000);

    patchWebInspector();

}());