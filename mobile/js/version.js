/**
 * Single cache-busting version for the mobile PWA.
 * Loaded first in the page and via importScripts() from sw.js.
 * Bump ONLY this value when shipping JS/CSS.
 */
(function (root) {
    'use strict';
    root.TabbozMobile = root.TabbozMobile || {};
    root.TabbozMobile.ASSET_VERSION = '33';

    var inBrowser = typeof document !== 'undefined' && document.currentScript;
    if (!inBrowser) return;

    var v = encodeURIComponent(root.TabbozMobile.ASSET_VERSION);
    function withVersion(url) {
        return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'v=' + v;
    }

    var styles = [
        'css/base.css',
        'css/home.css',
        'css/life.css',
        'css/shops.css',
        'css/jobs.css',
        'css/phone.css'
    ];
    styles.forEach(function (href) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = withVersion(href);
        document.head.appendChild(link);
    });

    var scripts = [
        'js/config.js',
        'js/ui-kit.js',
        'js/screens/register.js',
        'js/screens/home.js',
        'js/screens/life.js',
        'js/screens/shops.js',
        'js/screens/jobs.js',
        'js/screens/phone.js',
        'js/screens/events.js',
        'js/win32-bridge.js',
        'js/save-manager.js',
        'js/boot.js',
        '../zarrosim.js'
    ];
    var i = 0;
    function next() {
        if (i >= scripts.length) return;
        var el = document.createElement('script');
        el.src = withVersion(scripts[i++]);
        el.onload = next;
        el.onerror = function () {
            console.error('[Tabboz] failed to load', el.src);
            var loading = document.getElementById('loading-screen');
            var text = loading && loading.querySelector('.loading-text');
            if (text) text.textContent = 'Errore di caricamento. Ricarica la pagina.';
        };
        document.body.appendChild(el);
    }
    next();
})(typeof window !== 'undefined' ? window : self);
