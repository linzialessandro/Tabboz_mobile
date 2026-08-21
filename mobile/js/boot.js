/**
 * Tabboz Simulator Mobile - application bootstrap.
 * Wires Module (Emscripten), save-manager UI, and the service worker.
 */
((TM) => {
    'use strict';

    window.Module = {
        locateFile: function (path, prefix) {
            if (path && path.slice(-5) === '.wasm') return TM.WASM_URL;
            return prefix + path;
        },
        postRun: [function () {
            if (typeof startGame === 'function') startGame();
        }],
        print: function (text) { console.log(text); },
        printErr: function (text) { console.error(text); }
    };

    function bindSaveButton() {
        const button = document.getElementById('save-manager-open');
        if (!button || typeof SaveManager === 'undefined') return;
        button.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            SaveManager.openModal();
        });
    }

    function registerServiceWorker() {
        if (!('serviceWorker' in navigator)) return;
        const host = location.hostname;
        if (host === 'localhost' || host === '127.0.0.1') return;
        window.addEventListener('load', function () {
            navigator.serviceWorker.register('./sw.js?v=' + encodeURIComponent(TM.ASSET_VERSION))
                .catch(function (err) {
                    console.warn('[Tabboz] Service worker registration failed:', err);
                });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindSaveButton);
    } else {
        bindSaveButton();
    }

    registerServiceWorker();

    window.setTimeout(function () {
        const loadingScreen = document.getElementById('loading-screen');
        if (!loadingScreen) return;
        const text = loadingScreen.querySelector('.loading-text');
        if (text) {
            text.textContent = 'Il caricamento sta impiegando più del previsto. Attendi o ricarica la pagina.';
        }
    }, 20000);
})(window.TabbozMobile);
