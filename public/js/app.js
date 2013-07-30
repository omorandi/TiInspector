(function() {

	$(document).ready(function() {
		var path = window.location.pathname;
		if (path == "/") {
			TiInspector.loadDashboard();
		}
		else if (path == "/inspector") {
			TiInspector.loadInspector();
		}

	});
}());