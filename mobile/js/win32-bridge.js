/**
 * Tabboz Simulator Mobile - Win32 / Novantotto bridge
 *
 * Based on Novantotto:
 * Copyright (c) 2024 Andrea Bonomi
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Tabboz Simulator:
 * Copyright (c) 1997-2001 Andrea Bonomi, Emanuele Caccialanza
 * Distributed under the terms of the GNU General Public License v3.0.
 *
 * This file is the ABI the WASM engine talks to (`dialogBox`, `waitEvent`,
 * `setDlgItemText`, ...). Presentation lives in `js/screens/`.
 */
((exports) => {
    'use strict';

    const TM = window.TabbozMobile;
    const ui = TM.ui;

    window.strings = window.strings || {};
    exports.strings = window.strings;

    let _resolve = null;
    let _activeWindowHwnd = null;
    let _highestZIndex = 50;
    let _gameStarted = false;
    let _menuClickListenerRegistered = false;
    let _eventListenerRegistered = false;

    const SM_CXSCREEN = TM.SM.CXSCREEN;
    const SM_CYSCREEN = TM.SM.CYSCREEN;
    const VK_ESCAPE = TM.VK.ESCAPE;
    const WM_KEYDOWN = TM.WM.KEYDOWN;
    const WM_COMMAND = TM.WM.COMMAND;
    const CW_USEDEFAULT = TM.CW.USEDEFAULT;
    const CW_SKIPRESIZE = TM.CW.SKIPRESIZE;
    const RESOURCE_BASE = TM.RESOURCE_BASE;

    const _dialogTemplateCache = new Map();
    let _stringsCache = null;
    let _bitmapsListCache = null;

    TM.getActiveHwnd = () => _activeWindowHwnd;
    TM.stopWaiting = stopWaiting;

    const OriginalAudio = window.Audio;
    window.Audio = function TabbozAudio(src) {
        if (src && typeof src === 'string' && src.indexOf('resources/') === 0) {
            src = '../' + src;
        }
        const audio = new OriginalAudio(src);
        const origPlay = audio.play;
        if (origPlay) {
            audio.play = function () {
                try {
                    const pending = origPlay.apply(this, arguments);
                    if (pending && typeof pending.catch === 'function') pending.catch(() => {});
                    return pending;
                } catch (e) {
                    return Promise.resolve();
                }
            };
        }
        return audio;
    };
    window.Audio.prototype = OriginalAudio.prototype;
    window.Audio.original = OriginalAudio;

    const sanitizeItalianText = ui.sanitizeItalianText;

    function safeResourceName(name) {
        return String(name || '').replace(/[^a-zA-Z0-9._-]/g, '');
    }

    const WINDOW_TMPL = `
        <div class="window">
          <div class="title-bar">
            <div class="title-bar-text">Tabboz Simulator</div>
            <div class="title-bar-controls">
              <button class="control61536 close-btn" aria-label="Close">✕</button>
            </div>
          </div>
          <div class="menubar"><ul class="main-menu"></ul></div>
          <div class="window-body">
          </div>
        </div>`;

    const MESSAGE_BOX_TMPL = `
        <div class="window messagebox">
          <div class="title-bar">
            <div class="title-bar-text">Tabboz Simulator</div>
            <div class="title-bar-controls">
              <button class="control61536 close-btn" aria-label="Close">✕</button>
            </div>
          </div>
          <div class="window-body">
            <div class="container">
              <img src="" class="icon" height="36" width="36" alt="" />
              <p class="content">content</p>
            </div>
            <section class="field-row">
              <button class="ok default control1 mobile-btn primary">OK</button>
              <button class="cancel default control2 mobile-btn secondary">Annulla</button>
              <button class="default control6 mobile-btn primary">Sì</button>
              <button class="default control7 mobile-btn secondary">No</button>
            </section>
          </div>
        </div>`;

    const WALL_TMPL = '<div class="wall" id="wall"></div>';
    const SHUTDOWN_TMPL = '<div class="shutdown"><span>È ora possibile chiudere<br/>l\'applicazione.</span></div>';

    function eagerPreloadAllResources() {
        fetch(`${RESOURCE_BASE}/strings/strings.json`)
            .then((res) => (res.ok ? res.json() : {}))
            .then((data) => {
                _stringsCache = data;
                window.strings = data;
                exports.strings = data;
            })
            .catch((err) => console.warn('[Tabboz] strings.json preload failed:', err));

        fetch(`${RESOURCE_BASE}/bitmaps/list.json`)
            .then((res) => (res.ok ? res.json() : []))
            .then((json) => {
                _bitmapsListCache = Array.isArray(json) ? json : (json.data || []);
                _bitmapsListCache.forEach((element) => {
                    const name = String(element || '');
                    if (!name || name.indexOf('..') !== -1) return;
                    const img = new Image();
                    img.src = `${RESOURCE_BASE}/bitmaps/${name}`;
                });
            })
            .catch((err) => console.warn('[Tabboz] bitmaps preload failed:', err));

        TM.KNOWN_DIALOGS.forEach((dialogId) => {
            fetch(`${RESOURCE_BASE}/dialogs/includes/${dialogId}.inc.html`)
                .then((res) => (res.ok ? res.text() : null))
                .then((html) => {
                    if (html) _dialogTemplateCache.set(Number(dialogId), html);
                })
                .catch(() => {});
        });
    }

    try {
        eagerPreloadAllResources();
    } catch (e) {
        console.warn('[Tabboz] resource preload failed:', e);
    }

    function stopWaiting() {
        if (_resolve) {
            _resolve();
            _resolve = null;
        }
    }

    function waitEvent() {
        return new Promise((resolve) => {
            stopWaiting();
            _resolve = resolve;
        });
    }

    function createElementFromHTML(html) {
        const template = document.createElement('template');
        template.innerHTML = html.trim();
        const result = template.content.children;
        return result.length === 1 ? result[0] : result;
    }

    function addMainMenu(mainMenuEl) {
        if (!mainMenuEl) return;
        mainMenuEl.querySelectorAll('li').forEach((item) => {
            item.addEventListener('click', (event) => {
                const classList = event.target.classList;
                if (!classList.contains('disabled') && !classList.contains('menu') && !classList.contains('hotkey')) {
                    mainMenuClick(item);
                }
            });
        });

        mainMenuEl.querySelectorAll('li > ul li').forEach((item) =>
            item.addEventListener('click', (event) => {
                if (item.classList.contains('disabled')) event.preventDefault();
                else closeMenu();
            })
        );

        function mainMenuClick(el) {
            const submenu = el.querySelector('ul');
            if (!submenu) return;
            const isShown = submenu.style.display === 'block';
            closeMenu();
            if (!isShown) {
                el.classList.add('active-menu');
                submenu.style.display = 'block';
            }
        }

        function closeMenu() {
            mainMenuEl.querySelectorAll('.active-menu').forEach((item) => {
                item.classList.remove('active-menu');
                const ul = item.querySelector('ul');
                if (ul) ul.style.display = 'none';
            });
        }

        registerMenuClickListener();
    }

    function registerMenuClickListener() {
        if (_menuClickListenerRegistered) return;
        _menuClickListenerRegistered = true;
        document.addEventListener('click', (event) => {
            if (!event.target.classList.contains('active-menu') && !event.target.closest('.active-menu')) {
                document.querySelectorAll('.active-menu').forEach((item) => {
                    item.classList.remove('active-menu');
                    const ul = item.querySelector('ul');
                    if (ul) ul.style.display = 'none';
                });
            }
        });
    }

    function generateMenuHTML(menuStructure) {
        function generateMenuItemHTML(item) {
            const label = ui.escapeHtml((item.label || '').replace('&', ''));
            const kindClass = item.kind === 'separator' ? 'separator' : `menu menu${Number(item.menu_id) || 0}`;
            let html = `<li class="${kindClass}">${label}</li>`;
            if (item.items && item.items.length > 0) {
                html += '<ul>';
                for (let i = 0; i < item.items.length; i++) html += generateMenuItemHTML(item.items[i]);
                html += '</ul>';
            }
            return html;
        }

        let html = '<ul class="main-menu">';
        (menuStructure || []).forEach((menu) => {
            const label = ui.escapeHtml((menu.label || '').replace('&', ''));
            html += `<li>${label}`;
            if (menu.items && menu.items.length > 0) {
                html += '<ul>';
                for (let i = 0; i < menu.items.length; i++) html += generateMenuItemHTML(menu.items[i]);
                html += '</ul>';
            }
            html += '</li>';
        });
        html += '</ul>';
        return html;
    }

    async function addMenuToWindow(hWnd, lpMenuName) {
        const menuName = safeResourceName(UTF8ToString(lpMenuName));
        const win = document.querySelector(`#win${hWnd}`);
        if (!win) return;
        try {
            const response = await fetch(`${RESOURCE_BASE}/menus/${menuName}.json`);
            if (!response.ok) return;
            const menu = await response.json();
            const menubar = win.querySelector('.menubar');
            if (menubar) {
                menubar.innerHTML = generateMenuHTML(menu);
                addMainMenu(win);
            }
        } catch (e) {
            console.warn('[Tabboz] Could not load menu:', menuName, e);
        }
    }

    function gameWindows() {
        return Array.from(document.querySelectorAll('#screen .window[id^="win"]'));
    }

    function setActiveWindow(hWnd) {
        _activeWindowHwnd = hWnd;
        _highestZIndex += 10;
        const activeWin = document.getElementById('win' + hWnd);
        if (!activeWin) return;

        const isMsgBox = activeWin.classList.contains('messagebox');
        const regular = gameWindows().filter((w) => !w.classList.contains('messagebox'));
        const topRegularWin = regular.length > 0 ? regular[regular.length - 1] : null;

        gameWindows().forEach((w) => {
            if (w === activeWin) {
                w.classList.add('active-window');
                w.style.zIndex = String(_highestZIndex);
                w.style.display = isMsgBox ? 'block' : 'flex';
                const tb = w.querySelector('.title-bar');
                if (tb) tb.classList.remove('inactive');
            } else if (isMsgBox && w === topRegularWin) {
                w.style.display = 'flex';
                const tb = w.querySelector('.title-bar');
                if (tb) tb.classList.add('inactive');
            } else if (!w.classList.contains('messagebox')) {
                w.classList.remove('active-window');
                w.style.display = 'none';
            }
        });
    }

    function showWindow(hWnd, show) {
        const win = document.querySelector('#win' + hWnd);
        const wall = document.querySelector('#wall' + hWnd);
        if (!win) return false;
        const isMsgBox = win.classList.contains('messagebox');
        win.style.display = show ? (isMsgBox ? 'block' : 'flex') : 'none';
        if (wall) wall.style.display = show ? 'block' : 'none';
        return true;
    }

    function showApp(show) {
        document.querySelectorAll('.window, .wall').forEach((item) => {
            item.style.display = show ? 'block' : 'none';
        });
    }

    function setIcon(hWnd, icon) {
        const element = document.querySelector(`#win${hWnd} .title-bar-text`);
        if (!element) return;
        const iconName = safeResourceName(UTF8ToString(icon));
        const src = `${RESOURCE_BASE}/icons/${iconName}.gif`;
        const isDashboard = element.closest('.dlg-1') !== null;
        const text = isDashboard ? 'Tabboz Mobile' : element.innerText;
        const img = document.createElement('img');
        img.src = src;
        img.height = 18;
        img.alt = '';
        img.style.verticalAlign = 'middle';
        img.style.marginRight = '6px';
        element.textContent = '';
        element.appendChild(img);
        element.appendChild(document.createTextNode(text));
    }

    function moveWindow() {
        // Mobile windows are fullscreen via CSS; ignore Win32 coordinates.
        return true;
    }

    async function drawImage(hWnd, lpCanvasClass, lpBitmapName, x, y) {
        const canvasClass = UTF8ToString(lpCanvasClass);
        const imageId = safeResourceName(UTF8ToString(lpBitmapName));
        const canvas = document.querySelector(`#win${hWnd} .${canvasClass}`);
        if (!canvas) return;
        const url = `${RESOURCE_BASE}/bitmaps/${imageId}.png`;
        const image = new Image();
        await new Promise((resolve) => {
            image.onload = resolve;
            image.onerror = resolve;
            image.src = url;
        });
        try {
            canvas.getContext('2d').drawImage(image, x, y);
        } catch (e) {
            console.warn('[Tabboz] drawImage failed:', e);
        }
    }

    function getWindowRectDimension(hWnd, dimension) {
        const win = document.querySelector('#win' + hWnd);
        if (!win) return 0;
        const rect = win.getBoundingClientRect();
        switch (dimension) {
            case 0: return Math.round(rect.left);
            case 1: return Math.round(rect.top);
            case 2: return Math.round(rect.right);
            case 3: return Math.round(rect.bottom);
            default: return 0;
        }
    }

    function setDlgItemText(hWnd, nIDDlgItem, lpString) {
        const control = document.querySelector(`#win${hWnd} .control${nIDDlgItem}`);
        if (!control) return false;
        const text = sanitizeItalianText(UTF8ToString(lpString));
        if (ui.isLabelLocked(control)) return true;
        if (control.tagName === 'INPUT') {
            if (control.type === 'radio') {
                const label = control.parentNode && control.parentNode.querySelector('label');
                if (label) label.innerText = text;
            } else {
                control.value = text;
            }
        } else {
            control.innerText = text;
        }
        return true;
    }

    function getDlgItemText(hWnd, nIDDlgItem, lpString, nMaxCount) {
        let control = document.querySelector(`#win${hWnd} input.control${nIDDlgItem}`);
        if (control) {
            stringToUTF8(control.value, lpString, nMaxCount);
            return control.value.length;
        }
        control = document.querySelector(`#win${hWnd} .control${nIDDlgItem}`);
        if (control) {
            stringToUTF8(control.innerText, lpString, nMaxCount);
            return control.innerText.length;
        }
        return 0;
    }

    function setCheck(hWnd, nIDDlgItem, wParam) {
        const control = document.querySelector(`#win${hWnd} .control${nIDDlgItem}`);
        if (control) control.checked = (wParam !== 0);
        return 0;
    }

    function getCheck(hWnd, nIDDlgItem) {
        const control = document.querySelector(`#win${hWnd} .control${nIDDlgItem}`);
        if (control) return control.checked ? 1 : 0;
        return 0;
    }

    function comboBoxAddString(hWnd, nIDDlgItem, lpString) {
        const control = document.querySelector(`#win${hWnd} select.control${nIDDlgItem}`);
        if (control) {
            const option = document.createElement('option');
            option.text = UTF8ToString(lpString);
            control.add(option, 0);
        }
        return 0;
    }

    function comboBoxSelect(hWnd, nIDDlgItem, wParam) {
        const control = document.querySelector(`#win${hWnd} select.control${nIDDlgItem}`);
        if (control) control.selectedIndex = wParam;
        return 0;
    }

    function getSystemMetrics(nIndex) {
        const screen = document.getElementById('screen');
        if (nIndex === SM_CXSCREEN) return screen ? screen.clientWidth : window.innerWidth;
        if (nIndex === SM_CYSCREEN) return screen ? screen.clientHeight : window.innerHeight;
        return 0;
    }

    function centerWindow(win) {
        if (!win) return;
        if (win.classList.contains('messagebox')) {
            win.style.position = 'fixed';
            win.style.left = '50%';
            win.style.top = '50%';
            win.style.transform = 'translate(-50%, -50%)';
            return;
        }
        win.style.position = 'absolute';
        win.style.left = '0px';
        win.style.top = '0px';
        win.style.margin = '0px';
        win.style.width = '100%';
        win.style.height = '100%';
        win.style.transform = 'none';
    }

    function setWindowInitialPosition(win) {
        centerWindow(win);
    }

    function createWindow(html, hWnd, x, y, width, height, lpCaption, dwStyle, dwExStyle, parentWindowId) {
        const wall = createElementFromHTML(WALL_TMPL);
        const win = createElementFromHTML(html || WINDOW_TMPL);
        win.style.display = 'none';
        win.style.margin = '0px';
        wall.id = 'wall' + hWnd;
        win.id = 'win' + hWnd;

        const destination = document.getElementById('screen');
        destination.appendChild(wall);
        destination.appendChild(win);

        setWindowInitialPosition(win, x, y, width, height, parentWindowId);

        if (lpCaption != null) {
            const rawCap = typeof lpCaption === 'number' ? UTF8ToString(lpCaption) : lpCaption;
            const titleEl = win.querySelector('.title-bar-text');
            if (titleEl) titleEl.innerText = sanitizeItalianText(rawCap);
        }

        const closeBtn = win.querySelector('.control61536, .close-btn');
        if (closeBtn) {
            ui.markBound(closeBtn);
            closeBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (typeof _PostMessage === 'function') _PostMessage(hWnd, WM_COMMAND, 2, 0);
                stopWaiting();
            };
        }

        return win;
    }

    async function messageBox(hWnd, lpText, lpCaption, uType, parentWindowId) {
        const c = createWindow(MESSAGE_BOX_TMPL, hWnd, 0, 0, CW_SKIPRESIZE, CW_SKIPRESIZE, lpCaption, 0, 0, parentWindowId);
        c.classList.add('messagebox');

        const icon = c.querySelector('img');
        const iconType = uType & 0xF0;
        if (iconType === 0x30) icon.src = `${RESOURCE_BASE}/icons/novantotto/101.png`;
        else if (iconType === 0x20) icon.src = `${RESOURCE_BASE}/icons/novantotto/102.png`;
        else if (iconType === 0x10) icon.src = `${RESOURCE_BASE}/icons/novantotto/103.png`;
        else icon.src = `${RESOURCE_BASE}/icons/novantotto/104.png`;

        const btn1 = c.querySelector('.control1');
        const btn2 = c.querySelector('.control2');
        const btn6 = c.querySelector('.control6');
        const btn7 = c.querySelector('.control7');
        const btnType = uType & 0xF;

        if (btnType === 0x00000001) {
            if (btn1) { btn1.style.display = 'inline-block'; ui.attachButtonHandler(btn1, 1, hWnd); }
            if (btn2) { btn2.style.display = 'inline-block'; ui.attachButtonHandler(btn2, 2, hWnd); }
            if (btn6) btn6.style.display = 'none';
            if (btn7) btn7.style.display = 'none';
        } else if (btnType === 0x00000004) {
            if (btn1) btn1.style.display = 'none';
            if (btn2) btn2.style.display = 'none';
            if (btn6) { btn6.style.display = 'inline-block'; ui.attachButtonHandler(btn6, 6, hWnd); }
            if (btn7) { btn7.style.display = 'inline-block'; ui.attachButtonHandler(btn7, 7, hWnd); }
        } else {
            if (btn1) { btn1.innerText = 'OK'; btn1.style.display = 'inline-block'; ui.attachButtonHandler(btn1, 1, hWnd); }
            if (btn2) btn2.style.display = 'none';
            if (btn6) btn6.style.display = 'none';
            if (btn7) btn7.style.display = 'none';
        }

        const closeBtn = c.querySelector('.close-btn, .control61536');
        if (closeBtn) {
            closeBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const dismissCmd = (btnType === 0x00000004) ? 7 : ((btnType === 0x00000001) ? 2 : 1);
                if (typeof _PostMessage === 'function') _PostMessage(hWnd, WM_COMMAND, dismissCmd, 0);
                stopWaiting();
            };
        }

        const rawText = typeof lpText === 'number' ? UTF8ToString(lpText) : lpText;
        c.querySelector('.content').innerText = sanitizeItalianText(rawText);
        setActiveWindow(hWnd);
        showWindow(hWnd, 1);
        centerWindow(c);
    }

    function dismissLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (!loadingScreen) return;
        loadingScreen.style.opacity = '0';
        loadingScreen.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            if (loadingScreen.parentNode) loadingScreen.remove();
        }, 300);
    }

    async function dialogBox(hWnd, dialog, parentWindowId, hInstance) {
        const dialogNum = parseInt(dialog, 10);
        let html = _dialogTemplateCache.get(dialogNum);
        if (!html) {
            try {
                const response = await fetch(`${RESOURCE_BASE}/dialogs/includes/${dialog}.inc.html`);
                if (response.ok) {
                    html = await response.text();
                    _dialogTemplateCache.set(dialogNum, html);
                }
            } catch (err) {
                console.warn('[Tabboz] Failed to load dialog template:', dialog, err);
            }
        }

        const usedFallback = !html;
        if (!html) {
            html = `<div class="window" style="position: absolute; margin: 32px; width: 320px; height: 200px">
                <div class="title-bar"><div class="title-bar-text">Finestra ${dialogNum}</div>
                  <div class="title-bar-controls"><button class="control61536 close-btn" aria-label="Close">✕</button></div>
                </div>
                <div class="window-body">
                    <div style="padding: 16px; text-align: center;">Operazione completata.</div>
                    <button class="dlg_item control2 button_cancel mobile-btn primary" data-class="BorBtn" style="margin: 16px auto; width: 80%;">✓ Continua</button>
                </div>
            </div>`;
        }

        html = sanitizeItalianText(html);
        html = html.replace(/src="resources\//g, 'src="../resources/');
        html = html.replace(/class="window-body[^"]*"/g, 'class="window-body"');

        const win = createWindow(html, hWnd, CW_USEDEFAULT, CW_USEDEFAULT, CW_SKIPRESIZE, CW_SKIPRESIZE, null, 0, 0, parentWindowId);
        win.classList.add('dlg-' + dialogNum);
        dismissLoadingScreen();
        ui.hideBrokenCoordinates(win);
        ui.installCloseButton(win, hWnd);
        setActiveWindow(hWnd);
        addMainMenu(win);

        try {
            if (!usedFallback && typeof TM.transformDialog === 'function') {
                TM.transformDialog(win, hWnd, dialogNum);
            } else if (usedFallback && typeof TM.resolveTransformer === 'function') {
                TM.resolveTransformer(-1)(win, hWnd);
            }
        } catch (err) {
            console.error('[Tabboz] Error transforming dialog ' + dialogNum + ':', err);
            try {
                if (typeof TM.resolveTransformer === 'function') {
                    TM.resolveTransformer(-1)(win, hWnd);
                }
            } catch (err2) {
                console.error('[Tabboz] Generic transform also failed:', err2);
            }
        }

        ui.ensureDismissable(win, hWnd);

        win.querySelectorAll('.dlg_item').forEach((element) => {
            const hMenu = ui.extractControlId(element.className);
            const dataClass = element.getAttribute('data-class');
            if (hMenu !== null && dataClass && typeof _AllocateControl === 'function') {
                const lpClassName = _malloc(128);
                try {
                    stringToUTF8(dataClass, lpClassName, 128);
                    _AllocateControl(hInstance, lpClassName, hWnd, hMenu);
                } finally {
                    _free(lpClassName);
                }
            }
        });

        showWindow(hWnd, 1);
        centerWindow(win);
    }

    function destroyWindow(hWnd) {
        const wall = document.getElementById('wall' + hWnd);
        const win = document.getElementById('win' + hWnd);
        if (wall) wall.remove();
        if (win) win.remove();

        const remainingWindows = gameWindows();
        if (remainingWindows.length > 0) {
            const topWin = remainingWindows[remainingWindows.length - 1];
            const hwnd = ui.parseWindowHwnd(topWin);
            if (hwnd !== null) setActiveWindow(hwnd);
        } else {
            _activeWindowHwnd = null;
        }
        stopWaiting();
    }

    function loadString(uID, lpBuffer, cchBufferMax) {
        const value = (window.strings && window.strings[uID]) || '';
        stringToUTF8(value, lpBuffer, cchBufferMax);
        return value.length;
    }

    async function loadStringResources() {
        if (_stringsCache && Object.keys(_stringsCache).length > 0) {
            window.strings = _stringsCache;
            exports.strings = _stringsCache;
            return;
        }
        try {
            const response = await fetch(`${RESOURCE_BASE}/strings/strings.json`);
            window.strings = await response.json();
            _stringsCache = window.strings;
            exports.strings = window.strings;
        } catch (e) {
            console.warn('[Tabboz] loadStringResources failed:', e);
            window.strings = window.strings || {};
        }
    }

    async function preload() {
        if (_bitmapsListCache) return;
        try {
            const response = await fetch(`${RESOURCE_BASE}/bitmaps/list.json`);
            const json = await response.json();
            _bitmapsListCache = Array.isArray(json) ? json : (json.data || []);
            _bitmapsListCache.forEach((element) => {
                const img = new Image();
                img.src = `${RESOURCE_BASE}/bitmaps/${element}`;
            });
        } catch (e) {
            console.warn('[Tabboz] preload failed:', e);
        }
    }

    function calculateClickPosition(event) {
        const rect = event.target.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        return ((y & 0xffff) << 16) + (x & 0xffff);
    }

    function isCheckbox(element) {
        return element.nodeName === 'INPUT' && element.type === 'checkbox';
    }

    function isSaveUi(target) {
        return !!(target && target.closest && target.closest('#save-manager-modal, .save-manager-floating-btn'));
    }

    function eventListenerSetup() {
        if (_eventListenerRegistered) return;
        _eventListenerRegistered = true;
        document.body.addEventListener('click', eventHandler);
        document.body.addEventListener('keydown', eventHandler);
        document.body.addEventListener('input', eventHandler);
    }

    function eventHandler(event) {
        if (isSaveUi(event.target)) return;
        if (event.defaultPrevented) return;
        if (ui.isBound(event.target)) return;

        let target = event.target;
        if (target.tagName === 'LABEL' && target.htmlFor) {
            const input = document.getElementById(target.htmlFor);
            if (input) target = input;
        } else if (target.closest && target.closest('.dlg_item')) {
            target = target.closest('.dlg_item');
        }

        if (event.type === 'click' && !ui.isCommandSource(target)) return;

        const controlId = ui.extractControlId(target.className);

        let targetHwnd = _activeWindowHwnd;
        const clickedWin = target.closest ? target.closest('#screen .window[id^="win"]') : null;
        const parsed = ui.parseWindowHwnd(clickedWin);
        if (parsed !== null) {
            targetHwnd = parsed;
            if (targetHwnd !== _activeWindowHwnd) setActiveWindow(targetHwnd);
        }

        switch (event.type) {
            case 'click':
                if (controlId !== null && targetHwnd != null && typeof _PostMessage === 'function') {
                    _PostMessage(targetHwnd, WM_COMMAND, controlId, calculateClickPosition(event));
                    stopWaiting();
                }
                break;
            case 'input':
                if (controlId !== null && !isCheckbox(target) && targetHwnd != null && typeof _PostMessage === 'function') {
                    _PostMessage(targetHwnd, WM_COMMAND, controlId, 0);
                    stopWaiting();
                }
                break;
            case 'keydown':
                if (targetHwnd == null || typeof _PostMessage !== 'function') break;
                if (event.keyCode === 27) {
                    _PostMessage(targetHwnd, WM_KEYDOWN, VK_ESCAPE, 0);
                    stopWaiting();
                } else if (target.nodeName === 'BUTTON' && event.keyCode === 13 && controlId !== null) {
                    _PostMessage(targetHwnd, WM_COMMAND, controlId, 0);
                    stopWaiting();
                }
                break;
        }
    }

    function shutdown() {
        const element = createElementFromHTML(SHUTDOWN_TMPL);
        element.style.display = 'flex';
        document.getElementById('screen').appendChild(element);
    }

    function startGame() {
        if (_gameStarted) return;

        function tryLaunch(attemptsLeft) {
            const startupFn = (typeof _WinMainStartup === 'function')
                ? _WinMainStartup
                : (typeof Module !== 'undefined' && typeof Module._WinMainStartup === 'function' ? Module._WinMainStartup : null);

            if (startupFn) {
                try {
                    _gameStarted = true;
                    startupFn();
                    return;
                } catch (e) {
                    console.warn('[Tabboz] WinMainStartup deferred:', e);
                    _gameStarted = false;
                }
            }

            if (attemptsLeft > 0) {
                setTimeout(() => tryLaunch(attemptsLeft - 1), 60);
            } else {
                console.error('[Tabboz] Could not launch WinMainStartup.');
                const loadingScreen = document.getElementById('loading-screen');
                if (loadingScreen) {
                    const text = loadingScreen.querySelector('.loading-text');
                    if (text) text.textContent = 'Impossibile avviare il simulatore. Ricarica la pagina.';
                }
            }
        }

        setTimeout(() => tryLaunch(80), 30);
    }

    function addDesktopIcon() {
        setTimeout(() => startGame(), 20);
    }

    function makeDraggable() {}

    exports.startGame = startGame;
    exports.addDesktopIcon = addDesktopIcon;
    exports.addMainMenu = addMainMenu;
    exports.addMenuToWindow = addMenuToWindow;
    exports.makeDraggable = makeDraggable;
    exports.waitEvent = waitEvent;
    exports.stopWaiting = stopWaiting;
    exports.createElementFromHTML = createElementFromHTML;
    exports.setActiveWindow = setActiveWindow;
    exports.showWindow = showWindow;
    exports.showApp = showApp;
    exports.setIcon = setIcon;
    exports.moveWindow = moveWindow;
    exports.getWindowRectDimension = getWindowRectDimension;
    exports.drawImage = drawImage;
    exports.setDlgItemText = setDlgItemText;
    exports.getDlgItemText = getDlgItemText;
    exports.setCheck = setCheck;
    exports.getCheck = getCheck;
    exports.comboBoxAddString = comboBoxAddString;
    exports.comboBoxSelect = comboBoxSelect;
    exports.getSystemMetrics = getSystemMetrics;
    exports.loadString = loadString;
    exports.loadStringResources = loadStringResources;
    exports.messageBox = messageBox;
    exports.dialogBox = dialogBox;
    exports.createWindow = createWindow;
    exports.destroyWindow = destroyWindow;
    exports.preload = preload;
    exports.eventListenerSetup = eventListenerSetup;
    exports.shutdown = shutdown;
    exports.generateMenuHTML = generateMenuHTML;
})(window);
