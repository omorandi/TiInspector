(function(TiInspector) {
    /* jshint boss:true */
    'use strict';

    var style_id_prefix     = 'ti-inspector-style-';
    var style_storage_id    = style_id_prefix + 'perfs';
    var style_overrides_id  = style_id_prefix + 'override';
    var style_overrides_url = '/css/inspector-overrides.css';
    var styles_config_instance;

    // StylesConfig Class {{{1
    // Constructor {{{2
    // Will add devtools_theme as the default if it exists and localStorage is
    // empty.
    function StylesConfig() {
        this.styles = getSavedStyles();
        if (TiInspector.preferences && this.styles.length === 0) {
            this.add(TiInspector.preferences.devtools_theme);
        }
    }

    // Private Methods {{{2
    // getSavedStyles {{{3
    var getSavedStyles = function() {
        var urls = (JSON.parse(
            localStorage.getItem(style_storage_id)
        ) || []);
        return urls.map(function(url) {
            return {url: url};
        });
    };

    // setSavedStyles {{{3
    var setSavedStyles = function(styles) {
        styles = styles.map(function(style) {
            return style.url;
        });
        localStorage.setItem(
            style_storage_id,
            JSON.stringify(styles)
        );
    };

    // idFromIndex {{{3
    var idFromIndex = function(index) {
        return style_id_prefix + index;
    };

    // getFrameDoc {{{3
    var getFrameDoc = function() {
        var iframe = document.getElementById('devtools-frame');
        return iframe.contentDocument;
    };

    // getStylesConfigLink {{{3
    var getStylesConfigLink = function(index) {
        return getFrameDoc().getElementById(idFromIndex(index));
    };

    // makeLinkTag {{{3
    var makeLinkTag = function(id, url) {
        var link = document.createElement('link');
        link.setAttribute('id',   id);
        link.setAttribute('rel',  'stylesheet');
        link.setAttribute('type', 'text/css');
        link.setAttribute('href', url);
        return link;
    };

    // insertOverrideStyle {{{3
    var insertOverrideStyle = function() {
        var iframe = getFrameDoc();
        var overrideLink = makeLinkTag(
            style_overrides_id,
            style_overrides_url
        );
        iframe.head.appendChild(overrideLink);
        return overrideLink;
    };

    // appendStyleLink {{{3
    var appendStyleLink = function(url, index) {
        var id     = idFromIndex(index);
        var iframe = getFrameDoc();
        var link   = makeLinkTag(id, url);
        var overrideLink = (
            iframe.getElementById(style_overrides_id) ||
            insertOverrideStyle()
        );
        iframe.head.insertBefore(link, overrideLink);
        link = iframe = overrideLink = null;
        return id;
    };

    // savePendingStyles_ {{{3
    // Meant to be used as a private instance method (set context with bind)
    var savePendingStyles_ = function() {
        this.pending = null;
        this.styles.forEach(function(style, index) {
            if (!style.saved) {
                appendStyleLink(style.url, index);
                style.saved = true;
            }
        });
    };

    // removeStyleLink {{{3
    var removeStyleLink = function(index) {
        var link = getStylesConfigLink(index);
        if (link && link.parentNode) {
            link.parentNode.removeChild(link);
        }
        return link;
    };

    // Instance methods {{{2
    // StylesConfig::link {{{3
    // Will push new styles into the #devtools-frame head. It will only add
    // links for styles marked as not saved (to prevent duplicates and avoid
    // needless DOM queries. It uses a nextTick to defer DOM manipulations.
    StylesConfig.prototype.link = function() {
        if (!this.pending) {
            this.pending = setTimeout(savePendingStyles_.bind(this), 0);
        }
        return this;
    };

    // StylesConfig::add {{{3
    StylesConfig.prototype.add = function(url) {
        if (!url) { return; }
        this.styles.push({url: url});
        setSavedStyles(this.styles);
        return this.link();
    };

    // StylesConfig::remove {{{3
    StylesConfig.prototype.remove = function(url) {
        var index = this.styles
          .map(function(style) { return style.url; })
          .indexOf(url);
        if (index >= 0) {
            this.styles.splice(index, 1);
            removeStyleLink(index);
        }
        setSavedStyles(this.styles);
        return this;
    };

    // StylesConfig::unlinkAll {{{3
    StylesConfig.prototype.unlinkAll = function() {
        this.styles.forEach(function(style, index) {
            removeStyleLink(index);
            style.saved = false;
        });
        return this;
    };

    // StylesConfig::clear {{{3
    StylesConfig.prototype.clear = function() {
        this.unlinkAll();
        this.styles = [];
        setSavedStyles(this.styles);
        return this;
    };

    // StylesConfig:toString {{{3
    StylesConfig.prototype.toString = function() {
        var styleUrls = this.styles.map(function(style) {
            return '' + style.url + (style.saved ? '' : ' (*)');
        }).join(', ');
        return 'StylesConfig: [' + (styleUrls || 'No styles configured') + ']';
    };

    // Class Methods {{{2
    // StylesConfig.getInstance {{{3
    StylesConfig.getInstance = function() {
        if (!styles_config_instance) {
            styles_config_instance = new StylesConfig();
        }
        return styles_config_instance;
    };
    // }}}1

    TiInspector.loadInspector = function loadInspector() {

        if (TiInspector.preferences) {
            TiInspector.preferences.styles = StylesConfig.getInstance();
        }

        $('#devtools-frame').load(function() {
            TiInspector.preferences.styles.save();
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
