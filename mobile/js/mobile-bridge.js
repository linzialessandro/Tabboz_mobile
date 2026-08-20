/**
 * Tabboz Simulator Mobile - Mobile Bridge
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
 */

((exports) => {
    // =========================================================================
    // Global State (matching novantotto.js exact contracts)
    // =========================================================================
    window.strings = window.strings || {};
    exports.strings = window.strings;

    let _resolve = null;
    let _activeWindowHwnd = null;

    // =========================================================================
    // Win32 Constants
    // =========================================================================
    const SM_CXSCREEN = 0;
    const SM_CYSCREEN = 1;
    const VK_ESCAPE = 0x1B;
    const WM_KEYDOWN = 0x100;
    const WM_COMMAND = 0x0111;
    const CW_USEDEFAULT = 0x8000;
    const CW_SKIPRESIZE = 0x8888;

    const RESOURCE_BASE = '../resources';

    // Dialog IDs (mapped from zarrosim.h / resource.h)
    const DLG = {
        DASHBOARD: 1,
        ABOUT: 2,
        DISCO: 4,
        FAMIGLIA: 5,
        COMPAGNIA: 6,
        SCOOTER: 7,
        NEGOZI_MENU: 8,
        TIPA: 9,
        TIPA_ALT: 190,
        SCUOLA: 10,
        SCUOLA_ALT: 11,
        SPLASH: 12,
        LAVORO: 13,
        EXIT_SESSION: 16,
        SCOOTER_SHOP_MIN: 70,
        SCOOTER_SHOP_MAX: 72,
        TRUCCA_SCOOTER: 73,
        SHOWROOM_MIN: 74,
        SHOWROOM_MAX: 79,
        SHOP_MIN: 80,
        SHOP_MAX: 86,
        TABACCHI: 88,
        PALESTRA: 89,
        CERCA_TIPA: 91,
        CERCA_TIPA_ALT: 191,
        DUE_DONNE: 92,
        DUE_DONNE_ALT: 192,
        DATE_MIN: 93,
        DATE_MAX: 94,
        DUE_DI_PICCHE: 95,
        EVENT_BEATDOWN: 96,
        EVENTS_MIN: 100,
        EVENTS_MAX: 107,
        PAGELLA: 110,
        JOB_QUIZ_MIN: 200,
        JOB_QUIZ_MAX: 209,
        COMPANY_LIST: 210,
        COMPANY_INFO_MIN: 290,
        COMPANY_INFO_MAX: 297,
        JOB_OFFER_MIN: 390,
        JOB_OFFER_MAX: 397
    };

    // Intercept Audio for mobile sub-directory compatibility
    const OriginalAudio = window.Audio;
    window.Audio = function(src) {
        if (src && typeof src === 'string' && src.startsWith('resources/')) {
            src = '../' + src;
        }
        return new OriginalAudio(src);
    };
    window.Audio.prototype = OriginalAudio.prototype;

    function sanitizeItalianText(str) {
        if (!str || typeof str !== 'string') return str;
        return str
            .replace(/\\x92/g, "'")
            .replace(/\\x91/g, "'")
            .replace(/\\x93/g, '"')
            .replace(/\\x94/g, '"')
            .replace(/\\x85/g, '...')
            .replace(/\\x80/g, '€')
            .replace(/\\xF9/gi, 'ù')
            .replace(/\\xE9/gi, 'é')
            .replace(/\\xE8/gi, 'è')
            .replace(/\\xE0/gi, 'à')
            .replace(/\\xF2/gi, 'ò')
            .replace(/\\xEC/gi, 'ì')
            .replace(/\\xB0/gi, '°')
            .replace(/\\xA9/gi, '©')
            .replace(/\\xAE/gi, '®')
            .replace(/\\x([0-9A-Fa-f]{2})/g, (match, hex) => {
                try {
                    return String.fromCharCode(parseInt(hex, 16));
                } catch (e) {
                    return match;
                }
            });
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
              <img src="" class="icon" height="36" width="36" />
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

    const WALL_TMPL = `<div class="wall" id="wall"></div>`;
    const SHUTDOWN_TMPL = `<div class="shutdown"><span>È ora possibile chiudere<br/>l'applicazione.</span></div>`;

    // =========================================================================
    // Asyncify Event Loop
    // =========================================================================

    function stopWaiting() {
        if (_resolve) {
            _resolve();
            _resolve = null;
        }
    }

    function waitEvent() {
        return new Promise((resolve, reject) => {
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

    // =========================================================================
    // Menu System
    // =========================================================================

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
                if (item.classList.contains('disabled')) {
                    event.preventDefault();
                } else {
                    closeMenu();
                }
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

    let _menuClickListenerRegistered = false;
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
            const label = item.label.replace('&', '');
            let html = `<li class="${item.kind === 'separator' ? 'separator' : `menu menu${item.menu_id}`}">${label}</li>`;
            if (item.items && item.items.length > 0) {
                html += '<ul>';
                for (const subItem of item.items) {
                    html += generateMenuItemHTML(subItem);
                }
                html += '</ul>';
            }
            return html;
        }

        let html = '<ul class="main-menu">';
        for (const menu of menuStructure) {
            const label = menu.label.replace('&', '');
            html += `<li>${label}`;
            if (menu.items && menu.items.length > 0) {
                html += '<ul>';
                for (const item of menu.items) {
                    html += generateMenuItemHTML(item);
                }
                html += '</ul>';
            }
            html += '</li>';
        }
        html += '</ul>';
        return html;
    }

    async function addMenuToWindow(hWnd, lpMenuName) {
        const menuName = UTF8ToString(lpMenuName);
        const win = document.querySelector(`#win${hWnd}`);
        if (win != null) {
            try {
                const response = await fetch(`${RESOURCE_BASE}/menus/${menuName}.json`);
                const menu = await response.json();
                const menubar = win.querySelector('.menubar');
                if (menubar) {
                    menubar.innerHTML = generateMenuHTML(menu);
                    addMainMenu(win);
                }
            } catch (e) {
                console.warn("Could not load menu:", menuName, e);
            }
        }
    }

    // =========================================================================
    // Window Management
    // =========================================================================

    let _highestZIndex = 50;

    function setActiveWindow(hWnd) {
        console.log('[setActiveWindow] setting active window:', hWnd);
        _activeWindowHwnd = hWnd;
        _highestZIndex += 10;
        const activeWin = document.querySelector(`#win${hWnd}`);
        const isMsgBox = activeWin && activeWin.classList.contains("messagebox");

        // Find the topmost non-messagebox window
        const nonMsgWindows = Array.from(document.querySelectorAll(".window:not(.messagebox)"));
        const topRegularWin = nonMsgWindows.length > 0 ? nonMsgWindows[nonMsgWindows.length - 1] : null;

        document.querySelectorAll(".window").forEach(w => {
            if (w === activeWin) {
                w.classList.add("active-window");
                w.style.zIndex = _highestZIndex;
                w.style.display = isMsgBox ? 'block' : 'flex';
                const tb = w.querySelector(".title-bar");
                if (tb) tb.classList.remove("inactive");
            } else if (isMsgBox && w === topRegularWin) {
                // Keep parent dialog visible underneath modal alert
                w.style.display = 'flex';
                const tb = w.querySelector(".title-bar");
                if (tb) tb.classList.add("inactive");
            } else if (!w.classList.contains("messagebox")) {
                w.classList.remove("active-window");
                w.style.display = 'none';
            }
        });
    }
    function showWindow(hWnd, show) {
        const win = document.querySelector('#win' + hWnd);
        const wall = document.querySelector('#wall' + hWnd);
        if (win != null) {
            win.style.display = show ? 'block' : 'none';
            if (wall != null) wall.style.display = show ? 'block' : 'none';

            return true;
        }
        return false;
    }

    function showApp(show) {
        document.querySelectorAll('.window, .wall').forEach((item) => {
            item.style.display = show ? 'block' : 'none';
        });
    }

    function setIcon(hWnd, icon) {
        const element = document.querySelector(`#win${hWnd} .title-bar-text`);
        if (element != null) {
            const iconName = UTF8ToString(icon);
            const src = `${RESOURCE_BASE}/icons/${iconName}.gif`;
            const isDashboard = element.closest('.dlg-1') !== null;
            const text = isDashboard ? 'Tabboz Mobile' : element.innerText;
            element.innerHTML = `<img src="${src}" height="18" style="vertical-align:middle; margin-right:6px;" />` + text;
        }
    }

    function moveWindow(hWnd, X, Y, nWidth, nHeight) {
        const win = document.querySelector(`#win${hWnd}`);
        if (win == null) return false;
        win.style.left = X + 'px';
        win.style.top = Y + 'px';
        win.style.width = nWidth + 'px';
        win.style.height = nHeight + 'px';
        return true;
    }

    async function drawImage(hWnd, lpCanvasClass, lpBitmapName, x, y) {
        const canvasClass = UTF8ToString(lpCanvasClass);
        const imageId = UTF8ToString(lpBitmapName);
        const canvas = document.querySelector(`#win${hWnd} .${canvasClass}`);
        if (canvas) {
            const url = `${RESOURCE_BASE}/bitmaps/${imageId}.png`;
            const image = new Image();
            await new Promise(r => { image.onload = r; image.onerror = r; image.src = url; });
            canvas.getContext("2d").drawImage(image, x, y);
        }
    }

    function getWindowRectDimension(hWnd, dimension) {
        const win = document.querySelector(`#win${hWnd}`);
        if (win == null) return 0;
        const style = getComputedStyle(win);
        switch (dimension) {
            case 0: return parseInt(style.left) || 0;
            case 1: return parseInt(style.top) || 0;
            case 2: return (parseInt(style.left) || 0) + (parseInt(style.width) || 360);
            case 3: return (parseInt(style.top) || 0) + (parseInt(style.height) || 400);
            default: return 0;
        }
    }

    function setDlgItemText(hWnd, nIDDlgItem, lpString) {
        let control = document.querySelector(`#win${hWnd} .control${nIDDlgItem}`);
        if (control == null) return false;
        const text = sanitizeItalianText(UTF8ToString(lpString));
        if (control.tagName === "INPUT") {
            if (control.type === "radio") {
                const label = control.parentNode.querySelector("label");
                if (label != null) label.innerText = text;
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
        if (control != null) {
            stringToUTF8(control.value, lpString, nMaxCount);
            return control.value.length;
        }
        control = document.querySelector(`#win${hWnd} .control${nIDDlgItem}`);
        if (control != null) {
            stringToUTF8(control.innerText, lpString, nMaxCount);
            return control.innerText.length;
        }
        return 0;
    }

    function setCheck(hWnd, nIDDlgItem, wParam) {
        const control = document.querySelector(`#win${hWnd} .control${nIDDlgItem}`);
        if (control != null) control.checked = (wParam !== 0);
        return 0;
    }

    function getCheck(hWnd, nIDDlgItem) {
        const control = document.querySelector(`#win${hWnd} .control${nIDDlgItem}`);
        if (control != null) return control.checked ? 1 : 0;
        return 0;
    }

    function comboBoxAddString(hWnd, nIDDlgItem, lpString) {
        const control = document.querySelector(`#win${hWnd} select.control${nIDDlgItem}`);
        if (control != null) {
            const option = document.createElement('option');
            option.text = UTF8ToString(lpString);
            control.add(option, 0);
        }
        return 0;
    }

    function comboBoxSelect(hWnd, nIDDlgItem, wParam) {
        const control = document.querySelector(`#win${hWnd} select.control${nIDDlgItem}`);
        if (control != null) control.selectedIndex = wParam;
        return 0;
    }

    function getSystemMetrics(nIndex) {
        const screen = document.getElementById('screen');
        if (!screen) return 0;
        switch (nIndex) {
            case SM_CXSCREEN: return parseInt(getComputedStyle(screen).width) || 360;
            case SM_CYSCREEN: return parseInt(getComputedStyle(screen).height) || 640;
            default: return 0;
        }
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

    function setIcon(hWnd, icon) {}
    function moveWindow(hWnd, X, Y, nWidth, nHeight) {}
    function getSystemMetrics(nIndex) {
        const screen = document.getElementById("screen");
        if (nIndex === SM_CXSCREEN) return screen ? screen.clientWidth : window.innerWidth;
        if (nIndex === SM_CYSCREEN) return screen ? screen.clientHeight : window.innerHeight;
        return 0;
    }
    function getWindowRectDimension(hWnd, dimension) {
        const win = document.querySelector("#win" + hWnd);
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
    function setWindowInitialPosition(win, x, y, width, height, parentWindowId) {
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
        return win;
    }

    async function messageBox(hWnd, lpText, lpCaption, uType, parentWindowId) {
        console.log('[messageBox] opening messageBox hWnd:', hWnd, 'caption:', lpCaption);
        const c = createWindow(MESSAGE_BOX_TMPL, hWnd, 0, 0, CW_SKIPRESIZE, CW_SKIPRESIZE, lpCaption, 0, 0, parentWindowId);
        c.classList.add('messagebox');

        if (uType & 0x00000020) c.querySelector('img').src = `${RESOURCE_BASE}/icons/novantotto/102.png`;
        else if (uType & 0x00000010) c.querySelector('img').src = `${RESOURCE_BASE}/icons/novantotto/103.png`;
        else if (uType & 0x00000030) c.querySelector('img').src = `${RESOURCE_BASE}/icons/novantotto/101.png`;
        else if (uType & 0x00000040) c.querySelector('img').src = `${RESOURCE_BASE}/icons/novantotto/104.png`;

        const btn1 = c.querySelector('.control1');
        const btn2 = c.querySelector('.control2');
        const btn6 = c.querySelector('.control6');
        const btn7 = c.querySelector('.control7');

        if (uType & 0x00000001) { // MB_OKCANCEL
            if (btn1) { btn1.style.display = 'inline-block'; attachButtonHandler(btn1, 1, hWnd); }
            if (btn2) { btn2.style.display = 'inline-block'; attachButtonHandler(btn2, 2, hWnd); }
            if (btn6) btn6.style.display = 'none';
            if (btn7) btn7.style.display = 'none';
        } else if (uType & 0x00000004) { // MB_YESNO
            if (btn1) btn1.style.display = 'none';
            if (btn2) btn2.style.display = 'none';
            if (btn6) { btn6.style.display = 'inline-block'; attachButtonHandler(btn6, 6, hWnd); }
            if (btn7) { btn7.style.display = 'inline-block'; attachButtonHandler(btn7, 7, hWnd); }
        } else { // MB_OK
            if (btn1) { btn1.innerText = 'OK'; btn1.style.display = 'inline-block'; attachButtonHandler(btn1, 1, hWnd); }
            if (btn2) btn2.style.display = 'none';
            if (btn6) btn6.style.display = 'none';
            if (btn7) btn7.style.display = 'none';
        }

        const rawText = typeof lpText === 'number' ? UTF8ToString(lpText) : lpText;
        c.querySelector('.content').innerText = sanitizeItalianText(rawText);
        setActiveWindow(hWnd);
        showWindow(hWnd, 1);
        centerWindow(c);
    }

    function resetElement(el) {
        if (!el) return;
        el.style.position = 'static';
        el.style.left = 'auto';
        el.style.top = 'auto';
        el.style.width = 'auto';
        el.style.height = 'auto';
        el.style.margin = '0';
    }

    function getButtonOk(body) {
        if (!body) return null;
        return body.querySelector('button.control1') || body.querySelector('button.button_ok') || body.querySelector('button[class*="control1"]') || body.querySelector('.button_ok') || body.querySelector('.control1');
    }

    function getButtonCancel(body) {
        if (!body) return null;
        return body.querySelector('button.control2') || body.querySelector('button.button_cancel') || body.querySelector('button[class*="control2"]') || body.querySelector('.button_cancel') || body.querySelector('.control2');
    }

    function attachButtonHandler(button, controlId, winHwnd) {
        if (!button) return;
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const targetHwnd = (winHwnd !== undefined && winHwnd !== null) ? winHwnd : _activeWindowHwnd;
            if (typeof _PostMessage === 'function' && targetHwnd !== null && targetHwnd !== undefined) {
                _PostMessage(targetHwnd, WM_COMMAND, controlId, 0);
            }
            stopWaiting();
        });
    }

    function transformDashboard(win, hWnd) {
        const body = win.querySelector('.window-body') || win.querySelector('[class*="window-body"]');
        if (!body) return;

        const nameEl = body.querySelector('.control102');
        const dateEl = body.querySelector('.control157');
        const canvas = body.querySelector('canvas') || body.querySelector('.bmpview') || body.querySelector('.BMPView');
        const soldiEl = body.querySelector('.control105') || body.querySelector('.control150');
        const figositaEl = body.querySelector('.control151');
        const reputazioneEl = body.querySelector('.control152');
        const studioEl = body.querySelector('.control153');
        const tipaRapportoEl = body.querySelector('.control154');
        const tipaNomeEl = body.querySelector('.control155');
        const scooterEl = body.querySelector('.control156');

        const btnScooter = body.querySelector('.control130');
        const btnNegozi = body.querySelector('.control131');
        const btnDisco = body.querySelector('.control132');
        const btnScuola = body.querySelector('.control136');
        const btnLavoro = body.querySelector('.control137');
        const btnTipa = body.querySelector('.control133');
        const btnCompagnia = body.querySelector('.control134');
        const btnFamiglia = body.querySelector('.control135');
        const btnAbout = body.querySelector('.control120');

        const container = document.createElement('div');
        container.className = 'mobile-dashboard-container';

        // Set top header title specifically to "Tabboz Mobile"
        const titleText = win.querySelector('.title-bar-text');
        if (titleText) {
            const hasIcon = titleText.querySelector('img');
            titleText.innerHTML = (hasIcon ? hasIcon.outerHTML : '<img src="../resources/icons/1.gif" height="18" style="vertical-align:middle; margin-right:6px;" />') + 'Tabboz Mobile';
        }

        const headerCard = document.createElement('div');
        headerCard.className = 'dashboard-header-card';
        if (nameEl) { resetElement(nameEl); headerCard.appendChild(nameEl); }
        if (dateEl) { resetElement(dateEl); headerCard.appendChild(dateEl); }
        container.appendChild(headerCard);

        const heroRow = document.createElement('div');
        heroRow.className = 'dashboard-hero-row';
        if (canvas) { resetElement(canvas); heroRow.appendChild(canvas); }

        const statsCol = document.createElement('div');
        statsCol.className = 'dashboard-stats-col';
        if (soldiEl) {
            resetElement(soldiEl);
            const row = document.createElement('div'); row.className = 'stat-card stat-soldi';
            row.innerHTML = '<span class="stat-label">💰 Soldi:</span>';
            row.appendChild(soldiEl);
            statsCol.appendChild(row);
        }
        if (figositaEl) {
            resetElement(figositaEl);
            const row = document.createElement('div'); row.className = 'stat-card';
            row.innerHTML = '<span class="stat-label">⭐ Figosità:</span>';
            row.appendChild(figositaEl);
            statsCol.appendChild(row);
        }
        if (reputazioneEl) {
            resetElement(reputazioneEl);
            const row = document.createElement('div'); row.className = 'stat-card';
            row.innerHTML = '<span class="stat-label">👑 Reputazione:</span>';
            row.appendChild(reputazioneEl);
            statsCol.appendChild(row);
        }
        if (studioEl) {
            resetElement(studioEl);
            const row = document.createElement('div'); row.className = 'stat-card';
            row.innerHTML = '<span class="stat-label">🎓 Studio:</span>';
            row.appendChild(studioEl);
            statsCol.appendChild(row);
        }
        if (scooterEl) {
            resetElement(scooterEl);
            const row = document.createElement('div'); row.className = 'stat-card';
            row.innerHTML = '<span class="stat-label">🛵 Scooter:</span>';
            row.appendChild(scooterEl);
            statsCol.appendChild(row);
        }
        if (tipaRapportoEl) {
            resetElement(tipaRapportoEl);
            const row = document.createElement('div'); row.className = 'stat-card';
            row.innerHTML = '<span class="stat-label">💋 Tipa:</span>';
            row.appendChild(tipaRapportoEl);
            statsCol.appendChild(row);
        }
        heroRow.appendChild(statsCol);
        container.appendChild(heroRow);

        const navGrid = document.createElement('div');
        navGrid.className = 'dashboard-nav-grid';
        if (btnScooter) { resetElement(btnScooter); btnScooter.innerHTML = '<span>🛵</span> <span>Scooter</span>'; attachButtonHandler(btnScooter, 130, hWnd); navGrid.appendChild(btnScooter); }
        if (btnNegozi) { resetElement(btnNegozi); btnNegozi.innerHTML = '<span>🏬</span> <span>Negozi</span>'; attachButtonHandler(btnNegozi, 131, hWnd); navGrid.appendChild(btnNegozi); }
        if (btnDisco) { resetElement(btnDisco); btnDisco.innerHTML = '<span>🪩</span> <span>Disco</span>'; attachButtonHandler(btnDisco, 132, hWnd); navGrid.appendChild(btnDisco); }
        if (btnScuola) { resetElement(btnScuola); btnScuola.innerHTML = '<span>🎓</span> <span>Scuola</span>'; attachButtonHandler(btnScuola, 136, hWnd); navGrid.appendChild(btnScuola); }
        if (btnLavoro) { resetElement(btnLavoro); btnLavoro.innerHTML = '<span>💼</span> <span>Lavoro</span>'; attachButtonHandler(btnLavoro, 137, hWnd); navGrid.appendChild(btnLavoro); }
        if (btnTipa) { resetElement(btnTipa); btnTipa.innerHTML = '<span>💋</span> <span>Tipa</span>'; attachButtonHandler(btnTipa, 133, hWnd); navGrid.appendChild(btnTipa); }
        if (btnCompagnia) { resetElement(btnCompagnia); btnCompagnia.innerHTML = '<span>👥</span> <span>Compagnia</span>'; attachButtonHandler(btnCompagnia, 134, hWnd); navGrid.appendChild(btnCompagnia); }
        if (btnFamiglia) { resetElement(btnFamiglia); btnFamiglia.innerHTML = '<span>🏠</span> <span>Famiglia</span>'; attachButtonHandler(btnFamiglia, 135, hWnd); navGrid.appendChild(btnFamiglia); }
        container.appendChild(navGrid);

        if (btnAbout) {
            resetElement(btnAbout);
            btnAbout.innerHTML = 'ℹ️ Info su Tabboz Simulator';
            attachButtonHandler(btnAbout, 120, hWnd);
            container.appendChild(btnAbout);
        }

        body.innerHTML = '';
        body.appendChild(container);
    }

    function transformAbout(win, hWnd) {
        const body = win.querySelector('.window-body') || win.querySelector('[class*="window-body"]');
        if (!body) return;

        const banner = body.querySelector('img.control257') || body.querySelector('img');
        const btnNorme = body.querySelector('.control113');
        const btnOk = getButtonOk(body) || body.querySelector('button');

        const container = document.createElement('div');
        container.className = 'mobile-screen-container mobile-about-view';

        if (banner) {
            resetElement(banner);
            const card = document.createElement('div');
            card.className = 'about-hero-card';
            card.appendChild(banner);
            container.appendChild(card);
        }

        const infoCard = document.createElement('div');
        infoCard.className = 'about-info-card';
        infoCard.innerHTML = `
            <div class="about-title">Tabboz Mobile</div>
            <div class="about-version">Versione 0.92q (PWA Modern Edition)</div>
            <div class="about-section">
                <div class="about-heading">Versione Mobile creata da:</div>
                <div class="about-text">Alessandro Linzi</div>
            </div>
            <div class="about-section">
                <div class="about-heading">Autori originali del Tabboz Simulator:</div>
                <div class="about-text">Andrea Bonomi & Emanuele Caccialanza</div>
            </div>
            <div class="about-section">
                <div class="about-heading">Beta testers originali:</div>
                <div class="about-text">Daniele Gazzarri, Dino Lucci, Giulio Lucci</div>
            </div>
            <div class="about-warning">
                ⚠️ Questo programma contiene un linguaggio talvolta offensivo; ogni riferimento a persone e cose è puramente casuale.
            </div>
        `;
        container.appendChild(infoCard);

        if (btnNorme) {
            resetElement(btnNorme);
            btnNorme.className = 'dlg_item control113 mobile-btn secondary';
            btnNorme.innerHTML = '📜 Norme di utilizzo';
            attachButtonHandler(btnNorme, 113, hWnd);
            container.appendChild(btnNorme);
        }

        if (btnOk) {
            resetElement(btnOk);
            btnOk.className = 'dlg_item control1 button_ok mobile-btn primary';
            btnOk.innerHTML = '✓ Torna alla Dashboard';
            attachButtonHandler(btnOk, 1, hWnd);
            const bar = document.createElement('div');
            bar.className = 'mobile-bottom-bar';
            bar.appendChild(btnOk);
            container.appendChild(bar);
        }

        body.innerHTML = '';
        body.appendChild(container);
    }

    function transformScuola(win, hWnd) {
        const body = win.querySelector('.window-body') || win.querySelector('[class*="window-body"]');
        if (!body) return;

        const canvas = body.querySelector('canvas') || body.querySelector('.bmpview') || body.querySelector('.BMPView') || body.querySelector('img.control249');
        const soldiEl = body.querySelector('.control104');
        const reputazioneEl = body.querySelector('.control105');
        const studioEl = body.querySelector('.control106');

        const btnStudia = body.querySelector('.control103');
        const btnMinaccia = body.querySelector('.control102');
        const btnCorrompi = body.querySelector('.control101');
        const btnOk = getButtonOk(body) || body.querySelector('.control1');

        const container = document.createElement('div');
        container.className = 'mobile-screen-container mobile-scuola-view';

        // Top School Image & Stats Banner
        if (canvas) {
            resetElement(canvas);
            const imgCard = document.createElement('div');
            imgCard.className = 'scuola-hero-card';
            imgCard.appendChild(canvas);
            container.appendChild(imgCard);
        }

        const statsBar = document.createElement('div');
        statsBar.className = 'mobile-stats-bar';
        if (soldiEl) { resetElement(soldiEl); const c = document.createElement('div'); c.className = 'mini-stat stat-soldi'; c.innerHTML = '<small>💰 Soldi</small>'; c.appendChild(soldiEl); statsBar.appendChild(c); }
        if (reputazioneEl) { resetElement(reputazioneEl); const c = document.createElement('div'); c.className = 'mini-stat'; c.innerHTML = '<small>👑 Reputazione</small>'; c.appendChild(reputazioneEl); statsBar.appendChild(c); }
        if (studioEl) { resetElement(studioEl); const c = document.createElement('div'); c.className = 'mini-stat'; c.innerHTML = '<small>🎓 Profitto</small>'; c.appendChild(studioEl); statsBar.appendChild(c); }
        container.appendChild(statsBar);

        // Subject list
        const subjectList = document.createElement('div');
        subjectList.className = 'scuola-subject-list';

        const subjectNames = [
            'Agraria', 'Fisica', 'Attività culturali', 'Attività matematiche',
            'Scienze industriali', 'Elettrochimica', 'Petrolchimica', 'Filosofia aziendale', 'Metallurgia'
        ];

        for (let i = 1; i <= 9; i++) {
            const radioId = 109 + i; // 110..118
            const gradeId = 119 + i; // 120..128
            const radio = body.querySelector(`.control${radioId}`);
            const grade = body.querySelector(`.control${gradeId}`);

            const card = document.createElement('div');
            card.className = 'scuola-subject-card';
            card.setAttribute('data-radio-id', radioId);

            if (radio) {
                resetElement(radio);
                radio.id = `scuola_radio_${radioId}`;
                radio.name = 'bor_radio10';
                if (i === 1) radio.checked = true;
                card.appendChild(radio);
            }

            const label = document.createElement('label');
            label.htmlFor = `scuola_radio_${radioId}`;
            label.className = 'subject-name';
            label.innerText = subjectNames[i - 1];
            card.appendChild(label);

            if (grade) {
                resetElement(grade);
                const gradeBadge = document.createElement('span');
                gradeBadge.className = 'subject-grade-badge';
                gradeBadge.innerHTML = 'Voto: ';
                gradeBadge.appendChild(grade);
                card.appendChild(gradeBadge);
            }

            card.onclick = () => {
                if (radio) {
                    radio.checked = true;
                    const targetHwnd = (hWnd !== undefined && hWnd !== null) ? hWnd : _activeWindowHwnd;
                    if (typeof _PostMessage === 'function' && targetHwnd !== null && targetHwnd !== undefined) {
                        _PostMessage(targetHwnd, WM_COMMAND, radioId, 0);
                        stopWaiting();
                    }
                    subjectList.querySelectorAll('.scuola-subject-card').forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');
                }
            };

            if (i === 1) card.classList.add('selected');
            subjectList.appendChild(card);
        }
        container.appendChild(subjectList);

        // Action Buttons Drawer
        const actionsDrawer = document.createElement('div');
        actionsDrawer.className = 'mobile-actions-drawer';
        if (btnStudia) {
            resetElement(btnStudia);
            btnStudia.className = 'dlg_item control103 mobile-btn primary btn-scuola-action btn-studia';
            attachButtonHandler(btnStudia, 103, hWnd);
            actionsDrawer.appendChild(btnStudia);
        }
        if (btnMinaccia) {
            resetElement(btnMinaccia);
            btnMinaccia.className = 'dlg_item control102 mobile-btn primary btn-scuola-action btn-minaccia';
            attachButtonHandler(btnMinaccia, 102, hWnd);
            actionsDrawer.appendChild(btnMinaccia);
        }
        if (btnCorrompi) {
            resetElement(btnCorrompi);
            btnCorrompi.className = 'dlg_item control101 mobile-btn primary btn-scuola-action btn-corrompi';
            attachButtonHandler(btnCorrompi, 101, hWnd);
            actionsDrawer.appendChild(btnCorrompi);
        }
        if (btnOk) {
            resetElement(btnOk);
            btnOk.className = 'dlg_item control1 button_ok mobile-btn primary';
            btnOk.innerHTML = '✓ Torna a Casa';
            attachButtonHandler(btnOk, 1, hWnd);
            actionsDrawer.appendChild(btnOk);
        }
        container.appendChild(actionsDrawer);

        body.innerHTML = '';
        body.appendChild(container);
    }

    function transformTabacchi(win, hWnd) {
        const body = win.querySelector('.window-body') || win.querySelector('[class*="window-body"]');
        if (!body) return;

        const soldiEl = body.querySelector('.control104') || body.querySelector('.control150');
        const sizzeEl = body.querySelector('.control105');
        const msgEl = body.querySelector('.control106');
        const btnOk = getButtonOk(body) || body.querySelector('.control1');
        const btnCancel = getButtonCancel(body) || body.querySelector('.control2');

        const container = document.createElement('div');
        container.className = 'mobile-screen-container mobile-tabacchi-view';

        // Sticky Wallet & Cigarette Counter
        const statsBar = document.createElement('div');
        statsBar.className = 'mobile-stats-bar';
        if (soldiEl) { resetElement(soldiEl); const c = document.createElement('div'); c.className = 'mini-stat stat-soldi'; c.innerHTML = '<small>💰 Soldi</small>'; c.appendChild(soldiEl); statsBar.appendChild(c); }
        if (sizzeEl) { resetElement(sizzeEl); const c = document.createElement('div'); c.className = 'mini-stat'; c.innerHTML = '<small>🚬 Sizze</small>'; c.appendChild(sizzeEl); statsBar.appendChild(c); }
        container.appendChild(statsBar);

        if (msgEl) {
            resetElement(msgEl);
            msgEl.className += ' tabacchi-msg-banner';
            container.appendChild(msgEl);
        }

        // Cigarette Packs Grid (4 columns)
        const packsGrid = document.createElement('div');
        packsGrid.className = 'tabacchi-packs-grid';
        const packs = body.querySelectorAll('img.dlg_item');
        packs.forEach(pack => {
            resetElement(pack);
            const m = pack.className.match(/control(\d+)/) || pack.className.match(/\d+/);
            const controlId = m ? Number(m[1] || m[0]) : null;
            const packCard = document.createElement('div');
            packCard.className = 'pack-card';
            packCard.appendChild(pack);
            if (controlId !== null) {
                packCard.onclick = () => {
                    packsGrid.querySelectorAll('.pack-card').forEach(c => c.classList.remove('selected'));
                    packCard.classList.add('selected');
                    const targetHwnd = (hWnd !== undefined && hWnd !== null) ? hWnd : _activeWindowHwnd;
                    if (typeof _PostMessage === 'function' && targetHwnd !== null && targetHwnd !== undefined) {
                        _PostMessage(targetHwnd, WM_COMMAND, controlId, 0);
                        stopWaiting();
                    }
                };
            }
            packsGrid.appendChild(packCard);
        });
        container.appendChild(packsGrid);

        // Sticky Bottom Actions
        const actionsBar = document.createElement('div');
        actionsBar.className = 'mobile-bottom-bar';
        if (btnCancel) {
            resetElement(btnCancel);
            btnCancel.className = 'dlg_item control2 button_cancel mobile-btn secondary';
            btnCancel.innerHTML = '✕ Esci';
            attachButtonHandler(btnCancel, 2, hWnd);
            actionsBar.appendChild(btnCancel);
        }
        if (btnOk) {
            resetElement(btnOk);
            btnOk.className = 'dlg_item control1 button_ok mobile-btn primary';
            btnOk.innerHTML = '✓ Compra';
            attachButtonHandler(btnOk, 1, hWnd);
            actionsBar.appendChild(btnOk);
        }
        container.appendChild(actionsBar);

        body.innerHTML = '';
        body.appendChild(container);
    }

    function transformNegoziMenu(win, hWnd) {
        const body = win.querySelector('.window-body') || win.querySelector('[class*="window-body"]');
        if (!body) return;

        const soldiEl = body.querySelector('.control120') || body.querySelector('.control104') || body.querySelector('.control150');
        const btnOk = getButtonOk(body) || body.querySelector('.control1');

        const buttons = Array.from(body.querySelectorAll('button.dlg_item')).filter(b => !b.classList.contains('control1'));

        const container = document.createElement('div');
        container.className = 'mobile-screen-container mobile-negozi-menu';

        if (soldiEl) {
            resetElement(soldiEl);
            const bar = document.createElement('div'); bar.className = 'mobile-stats-bar';
            const c = document.createElement('div'); c.className = 'mini-stat stat-soldi';
            c.innerHTML = '<small>💰 Soldi Disponibili</small>';
            c.appendChild(soldiEl);
            bar.appendChild(c);
            container.appendChild(bar);
        }

        const list = document.createElement('div');
        list.className = 'negozi-buttons-list';

        const icons = {
            'Bau House': '🧥',
            'Blue Rider': '👕',
            'Zoccolaro': '👞',
            'Footsmocker': '👟',
            'Footsmocker II': '👟',
            'Bar Tabacchi': '🚬',
            'Palestra': '💪',
            'Telefonino': '📱'
        };

        buttons.forEach(btn => {
            resetElement(btn);
            const m = btn.className.match(/control(\d+)/) || btn.className.match(/\d+/);
            const controlId = m ? Number(m[1] || m[0]) : null;
            const text = btn.innerText.trim();
            const icon = icons[text] || '🛍️';
            btn.innerHTML = `<span class="btn-icon">${icon}</span> <span class="btn-text">${text}</span> <span class="btn-chevron">›</span>`;
            if (controlId !== null) {
                attachButtonHandler(btn, controlId, hWnd);
            }
            list.appendChild(btn);
        });
        container.appendChild(list);

        if (btnOk) {
            resetElement(btnOk);
            btnOk.className = 'dlg_item control1 button_ok mobile-btn primary';
            btnOk.innerHTML = '✓ Torna alla Dashboard';
            attachButtonHandler(btnOk, 1, hWnd);
            const bar = document.createElement('div');
            bar.className = 'mobile-bottom-bar';
            bar.appendChild(btnOk);
            container.appendChild(bar);
        }

        body.innerHTML = '';
        body.appendChild(container);
    }

    function transformScooter(win, hWnd) {
        const body = win.querySelector('.window-body') || win.querySelector('[class*="window-body"]');
        if (!body) return;

        const soldiEl = body.querySelector('.control104') || body.querySelector('.control150');
        const velocitaEl = body.querySelector('.control110') || body.querySelector('.control105');
        const cilindrataEl = body.querySelector('.control113') || body.querySelector('.control106');
        const efficienzaEl = body.querySelector('.control115') || body.querySelector('.control107');
        const benzinaEl = body.querySelector('.control107') || body.querySelector('.control108');
        const nomeScooterEl = body.querySelector('.control116');

        const btnConcess = body.querySelector('.control101');
        const btnTrucca = body.querySelector('.control102');
        const btnRipara = body.querySelector('.control103');
        const btnParcheggia = body.querySelector('.control105') || body.querySelector('.control109');
        const btnBenza = body.querySelector('.control106') || body.querySelector('.control110');
        const btnOk = getButtonOk(body) || body.querySelector('.control1');

        const container = document.createElement('div');
        container.className = 'mobile-screen-container mobile-scooter-view';

        // Gauges & Stats Grid
        const statsGrid = document.createElement('div');
        statsGrid.className = 'scooter-stats-grid';
        if (nomeScooterEl) { resetElement(nomeScooterEl); const c = document.createElement('div'); c.className = 'stat-card'; c.style.gridColumn = 'span 2'; c.innerHTML = '<span class="stat-label">🛵 Modello:</span>'; c.appendChild(nomeScooterEl); statsGrid.appendChild(c); }
        if (soldiEl) { resetElement(soldiEl); const c = document.createElement('div'); c.className = 'stat-card stat-soldi'; c.innerHTML = '<span class="stat-label">💰 Soldi:</span>'; c.appendChild(soldiEl); statsGrid.appendChild(c); }
        if (velocitaEl) { resetElement(velocitaEl); const c = document.createElement('div'); c.className = 'stat-card'; c.innerHTML = '<span class="stat-label">⚡ Velocità:</span>'; c.appendChild(velocitaEl); statsGrid.appendChild(c); }
        if (cilindrataEl) { resetElement(cilindrataEl); const c = document.createElement('div'); c.className = 'stat-card'; c.innerHTML = '<span class="stat-label">🚀 Cilindrata:</span>'; c.appendChild(cilindrataEl); statsGrid.appendChild(c); }
        if (efficienzaEl) { resetElement(efficienzaEl); const c = document.createElement('div'); c.className = 'stat-card'; c.innerHTML = '<span class="stat-label">🔧 Efficienza:</span>'; c.appendChild(efficienzaEl); statsGrid.appendChild(c); }
        if (benzinaEl) { resetElement(benzinaEl); const c = document.createElement('div'); c.className = 'stat-card'; c.innerHTML = '<span class="stat-label">⛽ Benzina:</span>'; c.appendChild(benzinaEl); statsGrid.appendChild(c); }
        container.appendChild(statsGrid);

        // Actions List
        const actionsList = document.createElement('div');
        actionsList.className = 'scooter-actions-list';
        if (btnConcess) { resetElement(btnConcess); btnConcess.className = 'dlg_item control101 mobile-btn primary'; btnConcess.innerHTML = '🏬 Concessionario'; attachButtonHandler(btnConcess, 101, hWnd); actionsList.appendChild(btnConcess); }
        if (btnTrucca) { resetElement(btnTrucca); btnTrucca.className = 'dlg_item control102 mobile-btn primary'; btnTrucca.innerHTML = '⚡ Trucca Scooter'; attachButtonHandler(btnTrucca, 102, hWnd); actionsList.appendChild(btnTrucca); }
        if (btnRipara) { resetElement(btnRipara); btnRipara.className = 'dlg_item control103 mobile-btn primary'; btnRipara.innerHTML = '🔧 Ripara Scooter'; attachButtonHandler(btnRipara, 103, hWnd); actionsList.appendChild(btnRipara); }
        if (btnBenza) { resetElement(btnBenza); btnBenza.className = 'dlg_item control106 mobile-btn primary'; btnBenza.innerHTML = '⛽ Fai Benza'; attachButtonHandler(btnBenza, 106, hWnd); actionsList.appendChild(btnBenza); }
        if (btnParcheggia) { resetElement(btnParcheggia); btnParcheggia.className = 'dlg_item control105 mobile-btn primary'; btnParcheggia.innerHTML = '🅿️ Parcheggia/Usa Scooter'; attachButtonHandler(btnParcheggia, 105, hWnd); actionsList.appendChild(btnParcheggia); }
        container.appendChild(actionsList);

        if (btnOk) {
            resetElement(btnOk);
            btnOk.className = 'dlg_item control1 button_ok mobile-btn primary';
            btnOk.innerHTML = '✓ Torna alla Dashboard';
            attachButtonHandler(btnOk, 1, hWnd);
            const bar = document.createElement('div');
            bar.className = 'mobile-bottom-bar';
            bar.appendChild(btnOk);
            container.appendChild(bar);
        }

        body.innerHTML = '';
        body.appendChild(container);
    }

    function transformShop(win, hWnd) {
        const body = win.querySelector('.window-body') || win.querySelector('[class*="window-body"]');
        if (!body) return;

        const soldiEl = body.querySelector('.control120') || body.querySelector('.control104');
        const figoEl = body.querySelector('.control121') || body.querySelector('.control105');
        const btnOk = getButtonOk(body) || body.querySelector('.control1');
        const btnCancel = getButtonCancel(body) || body.querySelector('.control2');

        const container = document.createElement('div');
        container.className = 'mobile-screen-container mobile-shop-view';

        // Stats Header
        const statsBar = document.createElement('div');
        statsBar.className = 'mobile-stats-bar';
        if (soldiEl) { resetElement(soldiEl); const c = document.createElement('div'); c.className = 'mini-stat stat-soldi'; c.innerHTML = '<small>💰 Soldi</small>'; c.appendChild(soldiEl); statsBar.appendChild(c); }
        if (figoEl) { resetElement(figoEl); const c = document.createElement('div'); c.className = 'mini-stat'; c.innerHTML = '<small>⭐ Figosità</small>'; c.appendChild(figoEl); statsBar.appendChild(c); }
        container.appendChild(statsBar);

        // Find all radio inputs in this shop dialog
        const radios = Array.from(body.querySelectorAll('input[type="radio"], input.bwcc, input[data-class="BorRadio"]'))
            .map(r => {
                const match = r.className.match(/control(\d+)/) || r.className.match(/\d+/);
                const id = match ? parseInt(match[1] || match[0], 10) : 0;
                return { el: r, id };
            })
            .sort((a, b) => a.id - b.id);

        // Find all shop item images in this shop dialog
        const imgs = Array.from(body.querySelectorAll('img.dlg_item, img[data-class="BorBtn"], img.ws_border'))
            .filter(img => !img.src.includes('SCOOTER.gif') && !img.src.includes('ZARROSIM.gif'))
            .map(img => {
                const match = img.className.match(/control(\d+)/) || img.className.match(/\d+/);
                const id = match ? parseInt(match[1] || match[0], 10) : 0;
                return { el: img, id };
            })
            .sort((a, b) => a.id - b.id);

        // Find all description statics (excluding stats labels)
        const statics = Array.from(body.querySelectorAll('.control[data-class="STATIC"], .control[data-class="BorStatic"], .dlg_item[data-class="STATIC"], div.ss_center'))
            .filter(el => !el.classList.contains('control120') && !el.classList.contains('control121') && !el.classList.contains('control104') && !el.classList.contains('control105') && !el.innerText.includes('Figosita') && !el.innerText.includes('Soldi'))
            .map(st => {
                const top = parseInt(st.style.top) || 0;
                const left = parseInt(st.style.left) || 0;
                return { el: st, order: top * 1000 + left };
            })
            .sort((a, b) => a.order - b.order);

        const productsList = document.createElement('div');
        productsList.className = 'shop-products-list';

        const itemCount = radios.length;
        for (let i = 0; i < itemCount; i++) {
            const radioObj = radios[i];
            const radio = radioObj.el;
            const radioId = radioObj.id;
            const img = imgs[i] ? imgs[i].el : null;
            const desc = statics[i] ? statics[i].el : null;

            const card = document.createElement('div');
            card.className = 'shop-product-card';

            if (img) {
                resetElement(img);
                card.appendChild(img);
            }

            const info = document.createElement('div');
            info.className = 'product-info';

            resetElement(radio);
            radio.id = `shop_radio_${radioId}`;
            radio.name = 'bor_radio_shop';
            const row = document.createElement('div');
            row.className = 'product-radio-row';
            row.appendChild(radio);

            const label = document.createElement('label');
            label.htmlFor = `shop_radio_${radioId}`;
            label.className = 'product-price-label';
            // Price is set by C in WM_INITDIALOG via SetDlgItemText
            label.innerText = radio.parentElement?.querySelector('label')?.innerText || '';
            row.appendChild(label);
            info.appendChild(row);

            if (desc) {
                resetElement(desc);
                desc.className = 'product-desc';
                info.appendChild(desc);
            }

            card.appendChild(info);

            card.onclick = () => {
                radio.checked = true;
                const targetHwnd = (hWnd !== undefined && hWnd !== null) ? hWnd : _activeWindowHwnd;
                if (typeof _PostMessage === 'function' && targetHwnd !== null && targetHwnd !== undefined) {
                    _PostMessage(targetHwnd, WM_COMMAND, radioId, 0);
                    stopWaiting();
                }
                productsList.querySelectorAll('.shop-product-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
            };

            if (i === 0) {
                radio.checked = true;
                card.classList.add('selected');
            }
            productsList.appendChild(card);
        }
        container.appendChild(productsList);

        // Sticky Bottom Actions Bar
        const actionsBar = document.createElement('div');
        actionsBar.className = 'mobile-bottom-bar';
        if (btnCancel) {
            resetElement(btnCancel);
            btnCancel.className = 'dlg_item control2 button_cancel mobile-btn secondary';
            btnCancel.innerHTML = '✕ Annulla';
            attachButtonHandler(btnCancel, 2, hWnd);
            actionsBar.appendChild(btnCancel);
        }
        if (btnOk) {
            resetElement(btnOk);
            btnOk.className = 'dlg_item control1 button_ok mobile-btn primary';
            btnOk.innerHTML = '✓ Compra';
            attachButtonHandler(btnOk, 1, hWnd);
            actionsBar.appendChild(btnOk);
        }
        container.appendChild(actionsBar);

        body.innerHTML = '';
        body.appendChild(container);
    }

    function transformDisco(win, hWnd) {
        const body = win.querySelector('.window-body') || win.querySelector('[class*="window-body"]');
        if (!body) return;

        const soldiEl = body.querySelector('.control110') || body.querySelector('.control104');
        const descEl = body.querySelector('.control120');
        const btnOk = getButtonOk(body) || body.querySelector('.control1');
        const btnCancel = getButtonCancel(body) || body.querySelector('.control2');

        const container = document.createElement('div');
        container.className = 'mobile-screen-container mobile-disco-view';

        if (soldiEl) {
            resetElement(soldiEl);
            const bar = document.createElement('div'); bar.className = 'mobile-stats-bar';
            const c = document.createElement('div'); c.className = 'mini-stat stat-soldi';
            c.innerHTML = '<small>💰 Soldi Disponibili</small>';
            c.appendChild(soldiEl);
            bar.appendChild(c);
            container.appendChild(bar);
        }

        const discosList = document.createElement('div');
        discosList.className = 'disco-list';

        const discoNames = [
            'La Gare', 'Karma', 'Shocking', 'Aquafan',
            'Number One', 'Dylan', 'Hollywood', 'StudioZ'
        ];

        for (let i = 1; i <= 8; i++) {
            const radioId = 100 + i;
            const radio = body.querySelector(`.control${radioId}`);

            const card = document.createElement('div');
            card.className = 'disco-card';

            if (radio) {
                resetElement(radio);
                radio.id = `disco_radio_${radioId}`;
                radio.name = 'bor_radio_disco';
                if (i === 1) radio.checked = true;
                card.appendChild(radio);
            }

            const label = document.createElement('label');
            label.htmlFor = `disco_radio_${radioId}`;
            label.innerText = discoNames[i - 1] || `Discoteca ${i}`;
            card.appendChild(label);

            card.onclick = () => {
                if (radio) {
                    radio.checked = true;
                    const targetHwnd = (hWnd !== undefined && hWnd !== null) ? hWnd : _activeWindowHwnd;
                    if (typeof _PostMessage === 'function' && targetHwnd !== null && targetHwnd !== undefined) {
                        _PostMessage(targetHwnd, WM_COMMAND, radioId, 0);
                        stopWaiting();
                    }
                    discosList.querySelectorAll('.disco-card').forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');
                }
            };

            if (i === 1) card.classList.add('selected');
            discosList.appendChild(card);
        }
        container.appendChild(discosList);

        if (descEl) {
            resetElement(descEl);
            descEl.classList.add('disco-desc-card');
            container.appendChild(descEl);
        }

        const actionsBar = document.createElement('div');
        actionsBar.className = 'mobile-bottom-bar';
        if (btnCancel) {
            resetElement(btnCancel);
            btnCancel.className = 'dlg_item control2 button_cancel mobile-btn secondary';
            btnCancel.innerHTML = '✕ Torna a Casa';
            attachButtonHandler(btnCancel, 2, hWnd);
            actionsBar.appendChild(btnCancel);
        }
        if (btnOk) {
            resetElement(btnOk);
            btnOk.className = 'dlg_item control1 button_ok mobile-btn primary';
            btnOk.innerHTML = '🪩 Entra in Disco';
            attachButtonHandler(btnOk, 1, hWnd);
            actionsBar.appendChild(btnOk);
        }
        container.appendChild(actionsBar);

        body.innerHTML = '';
        body.appendChild(container);
    }

    function transformFamiglia(win, hWnd) {
        const body = win.querySelector('.window-body') || win.querySelector('[class*="window-body"]');
        if (!body) return;

        const soldiEl = body.querySelector('.control104');
        const paghettaEl = body.querySelector('.control105');
        const btnOk = getButtonOk(body) || body.querySelector('.control1');

        const btn1 = body.querySelector('.control101');
        const btn2 = body.querySelector('.control102');
        const btn3 = body.querySelector('.control103');

        const container = document.createElement('div');
        container.className = 'mobile-screen-container mobile-famiglia-view';

        const statsBar = document.createElement('div');
        statsBar.className = 'mobile-stats-bar';
        if (soldiEl) { resetElement(soldiEl); const c = document.createElement('div'); c.className = 'mini-stat stat-soldi'; c.innerHTML = '<small>💰 Soldi</small>'; c.appendChild(soldiEl); statsBar.appendChild(c); }
        if (paghettaEl) { resetElement(paghettaEl); const c = document.createElement('div'); c.className = 'mini-stat'; c.innerHTML = '<small>💵 Paghetta</small>'; c.appendChild(paghettaEl); statsBar.appendChild(c); }
        container.appendChild(statsBar);

        const actionsList = document.createElement('div');
        actionsList.className = 'famiglia-actions-list';
        if (btn1) { resetElement(btn1); btn1.className = 'dlg_item control101 mobile-btn primary'; btn1.innerHTML = '📈 Chiedi aumento paghetta'; attachButtonHandler(btn1, 101, hWnd); actionsList.appendChild(btn1); }
        if (btn2) { resetElement(btn2); btn2.className = 'dlg_item control102 mobile-btn primary'; btn2.innerHTML = '💸 Chiedi soldi extra'; attachButtonHandler(btn2, 102, hWnd); actionsList.appendChild(btn2); }
        if (btn3) { resetElement(btn3); btn3.className = 'dlg_item control103 mobile-btn primary'; btn3.innerHTML = '🤑 Papà, mi dai 100.000 lire?'; attachButtonHandler(btn3, 103, hWnd); actionsList.appendChild(btn3); }
        container.appendChild(actionsList);

        if (btnOk) {
            resetElement(btnOk);
            btnOk.className = 'dlg_item control1 button_ok mobile-btn primary';
            btnOk.innerHTML = '✓ Torna alla Dashboard';
            attachButtonHandler(btnOk, 1, hWnd);
            const bar = document.createElement('div');
            bar.className = 'mobile-bottom-bar';
            bar.appendChild(btnOk);
            container.appendChild(bar);
        }

        body.innerHTML = '';
        body.appendChild(container);
    }

    function transformCompagnia(win, hWnd) {
        const body = win.querySelector('.window-body') || win.querySelector('[class*="window-body"]');
        if (!body) return;

        const img = body.querySelector('img.control259') || body.querySelector('canvas') || body.querySelector('img');
        const repEl = body.querySelector('.control104');
        const btnOk = getButtonOk(body) || body.querySelector('.control1');

        const btn1 = body.querySelector('.control101');
        const btn2 = body.querySelector('.control102');
        const btn3 = body.querySelector('.control103');

        const container = document.createElement('div');
        container.className = 'mobile-screen-container mobile-compagnia-view';

        if (img) {
            resetElement(img);
            const imgCard = document.createElement('div');
            imgCard.className = 'compagnia-hero-card';
            imgCard.appendChild(img);
            container.appendChild(imgCard);
        }

        if (repEl) {
            resetElement(repEl);
            const bar = document.createElement('div'); bar.className = 'mobile-stats-bar';
            const c = document.createElement('div'); c.className = 'mini-stat';
            c.innerHTML = '<small>👑 Reputazione Compagnia</small>';
            c.appendChild(repEl);
            bar.appendChild(c);
            container.appendChild(bar);
        }

        const actionsList = document.createElement('div');
        actionsList.className = 'compagnia-actions-list';
        if (btn1) { resetElement(btn1); btn1.className = 'dlg_item control101 mobile-btn primary'; btn1.innerHTML = '🛵 Gareggia con lo scooter'; attachButtonHandler(btn1, 101, hWnd); actionsList.appendChild(btn1); }
        if (btn2) { resetElement(btn2); btn2.className = 'dlg_item control102 mobile-btn primary'; btn2.innerHTML = '🍻 Esci con la compagnia'; attachButtonHandler(btn2, 102, hWnd); actionsList.appendChild(btn2); }
        if (btn3) { resetElement(btn3); btn3.className = 'dlg_item control103 mobile-btn primary'; btn3.innerHTML = '📱 Chiama la compagnia'; attachButtonHandler(btn3, 103, hWnd); actionsList.appendChild(btn3); }
        container.appendChild(actionsList);

        if (btnOk) {
            resetElement(btnOk);
            btnOk.className = 'dlg_item control1 button_ok mobile-btn primary';
            btnOk.innerHTML = '✓ Torna alla Dashboard';
            attachButtonHandler(btnOk, 1, hWnd);
            const bar = document.createElement('div');
            bar.className = 'mobile-bottom-bar';
            bar.appendChild(btnOk);
            container.appendChild(bar);
        }

        body.innerHTML = '';
        body.appendChild(container);
    }

    function transformTipa(win, hWnd) {
        const body = win.querySelector('.window-body') || win.querySelector('[class*="window-body"]');
        if (!body) return;

        const canvas = body.querySelector('canvas') || body.querySelector('.bmptipa');
        const nomeEl = body.querySelector('.control105');
        const figoEl = body.querySelector('.control106');
        const affinitaEl = body.querySelector('.control107');
        const myFigoEl = body.querySelector('.control104');
        const btnOk = getButtonOk(body) || body.querySelector('.control1');

        const btnCerca = body.querySelector('.control110');
        const btnLascia = body.querySelector('.control111');
        const btnChiama = body.querySelector('.control112');
        const btnEsci = body.querySelector('.control113');

        const container = document.createElement('div');
        container.className = 'mobile-screen-container mobile-tipa-view';

        if (canvas) {
            resetElement(canvas);
            const card = document.createElement('div');
            card.className = 'tipa-hero-card';
            card.appendChild(canvas);
            container.appendChild(card);
        }

        const statsBar = document.createElement('div');
        statsBar.className = 'mobile-stats-bar';
        if (nomeEl) { resetElement(nomeEl); const c = document.createElement('div'); c.className = 'mini-stat'; c.innerHTML = '<small>💋 Nome Tipa</small>'; c.appendChild(nomeEl); statsBar.appendChild(c); }
        if (affinitaEl) { resetElement(affinitaEl); const c = document.createElement('div'); c.className = 'mini-stat'; c.innerHTML = '<small>❤️ Affinità</small>'; c.appendChild(affinitaEl); statsBar.appendChild(c); }
        if (figoEl) { resetElement(figoEl); const c = document.createElement('div'); c.className = 'mini-stat'; c.innerHTML = '<small>⭐ Figosità Tipa</small>'; c.appendChild(figoEl); statsBar.appendChild(c); }
        container.appendChild(statsBar);

        const actionsList = document.createElement('div');
        actionsList.className = 'tipa-actions-list';
        if (btnEsci) { resetElement(btnEsci); btnEsci.className = 'dlg_item control113 mobile-btn primary'; btnEsci.innerHTML = '🥂 Esci con la tipa'; attachButtonHandler(btnEsci, 113, hWnd); actionsList.appendChild(btnEsci); }
        if (btnChiama) { resetElement(btnChiama); btnChiama.className = 'dlg_item control112 mobile-btn primary'; btnChiama.innerHTML = '📞 Telefona alla tipa'; attachButtonHandler(btnChiama, 112, hWnd); actionsList.appendChild(btnChiama); }
        if (btnCerca) { resetElement(btnCerca); btnCerca.className = 'dlg_item control110 mobile-btn primary'; btnCerca.innerHTML = '🔍 Cerca nuova tipa'; attachButtonHandler(btnCerca, 110, hWnd); actionsList.appendChild(btnCerca); }
        if (btnLascia) { resetElement(btnLascia); btnLascia.className = 'dlg_item control111 mobile-btn danger'; btnLascia.innerHTML = '💔 Lascia tipa'; attachButtonHandler(btnLascia, 111, hWnd); actionsList.appendChild(btnLascia); }
        container.appendChild(actionsList);

        if (btnOk) {
            resetElement(btnOk);
            btnOk.className = 'dlg_item control1 button_ok mobile-btn primary';
            btnOk.innerHTML = '✓ Torna alla Dashboard';
            attachButtonHandler(btnOk, 1, hWnd);
            const bar = document.createElement('div');
            bar.className = 'mobile-bottom-bar';
            bar.appendChild(btnOk);
            container.appendChild(bar);
        }

        body.innerHTML = '';
        body.appendChild(container);
    }

    function transformLavoro(win, hWnd) {
        const body = win.querySelector('.window-body') || win.querySelector('[class*="window-body"]');
        if (!body) return;

        const img = body.querySelector('img.control254') || body.querySelector('canvas');
        const dittaEl = body.querySelector('.control105');
        const soldiEl = body.querySelector('.control104');
        const stipendioEl = body.querySelector('.control106');
        const impegnoEl = body.querySelector('.control107');
        const btnOk = getButtonOk(body) || body.querySelector('.control1');

        const btnCercaLavoro = body.querySelector('.control110');
        const btnLicenziati = body.querySelector('.control111');
        const btnAumento = body.querySelector('.control112');
        const btnLeccaculo = body.querySelector('.control113');
        const btnInfo = body.querySelector('.control114');
        const btnSciopera = body.querySelector('.control115');
        const btnLavora = body.querySelector('.control116');

        const container = document.createElement('div');
        container.className = 'mobile-screen-container mobile-lavoro-view';

        // Workplace Image
        if (img) {
            resetElement(img);
            const imgCard = document.createElement('div');
            imgCard.className = 'lavoro-hero-card';
            imgCard.appendChild(img);
            container.appendChild(imgCard);
        }

        // Company & Stats
        const statsBar = document.createElement('div');
        statsBar.className = 'mobile-stats-bar';
        if (dittaEl) { resetElement(dittaEl); const c = document.createElement('div'); c.className = 'mini-stat'; c.style.flex = '2'; c.innerHTML = '<small>🏢 Ditta</small>'; c.appendChild(dittaEl); statsBar.appendChild(c); }
        if (soldiEl) { resetElement(soldiEl); const c = document.createElement('div'); c.className = 'mini-stat stat-soldi'; c.innerHTML = '<small>💰 Soldi</small>'; c.appendChild(soldiEl); statsBar.appendChild(c); }
        container.appendChild(statsBar);

        const statsBar2 = document.createElement('div');
        statsBar2.className = 'mobile-stats-bar';
        if (stipendioEl) { resetElement(stipendioEl); const c = document.createElement('div'); c.className = 'mini-stat'; c.innerHTML = '<small>💵 Stipendio</small>'; c.appendChild(stipendioEl); statsBar2.appendChild(c); }
        if (impegnoEl) { resetElement(impegnoEl); const c = document.createElement('div'); c.className = 'mini-stat'; c.innerHTML = '<small>📊 Impegno</small>'; c.appendChild(impegnoEl); statsBar2.appendChild(c); }
        container.appendChild(statsBar2);

        // Action Buttons
        const actionsList = document.createElement('div');
        actionsList.className = 'lavoro-actions-list';
        if (btnCercaLavoro) { resetElement(btnCercaLavoro); btnCercaLavoro.className = 'dlg_item control110 mobile-btn primary'; btnCercaLavoro.innerHTML = '🔍 Cerca lavoro'; attachButtonHandler(btnCercaLavoro, 110, hWnd); actionsList.appendChild(btnCercaLavoro); }
        if (btnLavora) { resetElement(btnLavora); btnLavora.className = 'dlg_item control116 mobile-btn primary'; btnLavora.innerHTML = '💼 Lavora'; attachButtonHandler(btnLavora, 116, hWnd); actionsList.appendChild(btnLavora); }
        if (btnLeccaculo) { resetElement(btnLeccaculo); btnLeccaculo.className = 'dlg_item control113 mobile-btn primary'; btnLeccaculo.innerHTML = '😏 Fai il leccaculo'; attachButtonHandler(btnLeccaculo, 113, hWnd); actionsList.appendChild(btnLeccaculo); }
        if (btnAumento) { resetElement(btnAumento); btnAumento.className = 'dlg_item control112 mobile-btn primary'; btnAumento.innerHTML = '📈 Chiedi aumento salario'; attachButtonHandler(btnAumento, 112, hWnd); actionsList.appendChild(btnAumento); }
        if (btnSciopera) { resetElement(btnSciopera); btnSciopera.className = 'dlg_item control115 mobile-btn primary'; btnSciopera.innerHTML = '✊ Sciopera'; attachButtonHandler(btnSciopera, 115, hWnd); actionsList.appendChild(btnSciopera); }
        if (btnInfo) { resetElement(btnInfo); btnInfo.className = 'dlg_item control114 mobile-btn primary'; btnInfo.innerHTML = 'ℹ️ Informazioni'; attachButtonHandler(btnInfo, 114, hWnd); actionsList.appendChild(btnInfo); }
        if (btnLicenziati) { resetElement(btnLicenziati); btnLicenziati.className = 'dlg_item control111 mobile-btn danger'; btnLicenziati.innerHTML = '🚪 Licenziati'; attachButtonHandler(btnLicenziati, 111, hWnd); actionsList.appendChild(btnLicenziati); }
        container.appendChild(actionsList);

        if (btnOk) {
            resetElement(btnOk);
            btnOk.className = 'dlg_item control1 button_ok mobile-btn primary';
            btnOk.innerHTML = '✓ Torna alla Dashboard';
            attachButtonHandler(btnOk, 1, hWnd);
            const bar = document.createElement('div');
            bar.className = 'mobile-bottom-bar';
            bar.appendChild(btnOk);
            container.appendChild(bar);
        }

        body.innerHTML = '';
        body.appendChild(container);
    }

    function transformPalestra(win, hWnd) {
        const body = win.querySelector('.window-body') || win.querySelector('[class*="window-body"]');
        if (!body) return;

        const imgHero = body.querySelector('img.control240') || body.querySelector('img');
        const soldiEl = body.querySelector('.control104');
        const figositaEl = body.querySelector('.control105');
        const abbonamentoEl = body.querySelector('.control106');
        const abbronzaturaEl = body.querySelector('.control107');

        const btnWorkout = body.querySelector('button.control110');
        const btnMese = body.querySelector('button.control115');
        const btnSeiMesi = body.querySelector('button.control116');
        const btnAnno = body.querySelector('button.control117');
        const btnLampada = body.querySelector('button.control111');
        const btnOk = getButtonOk(body) || body.querySelector('button.control1') || body.querySelector('button');

        const priceMese = body.querySelector('.control120');
        const priceSeiMesi = body.querySelector('.control121');
        const priceAnno = body.querySelector('.control122');
        const priceLampada = body.querySelector('.control123');

        const container = document.createElement('div');
        container.className = 'mobile-screen-container mobile-palestra-view';

        // 1. Live Stats Grid (Soldi, Figosità, Abbonamento, Abbronzatura)
        const statsBar = document.createElement('div');
        statsBar.className = 'palestra-stats-grid';

        if (soldiEl) {
            resetElement(soldiEl);
            const c = document.createElement('div'); c.className = 'palestra-stat-card stat-soldi';
            c.innerHTML = '<span class="stat-icon">💰</span><div><small>Soldi</small></div>';
            c.querySelector('div').appendChild(soldiEl);
            statsBar.appendChild(c);
        }
        if (figositaEl) {
            resetElement(figositaEl);
            const c = document.createElement('div'); c.className = 'palestra-stat-card stat-figosita';
            c.innerHTML = '<span class="stat-icon">⭐</span><div><small>Figosità</small></div>';
            c.querySelector('div').appendChild(figositaEl);
            statsBar.appendChild(c);
        }
        if (abbonamentoEl) {
            resetElement(abbonamentoEl);
            const c = document.createElement('div'); c.className = 'palestra-stat-card stat-abbonamento';
            c.innerHTML = '<span class="stat-icon">🎫</span><div><small>Abbonamento</small></div>';
            c.querySelector('div').appendChild(abbonamentoEl);
            statsBar.appendChild(c);
        }
        if (abbronzaturaEl) {
            resetElement(abbronzaturaEl);
            const c = document.createElement('div'); c.className = 'palestra-stat-card stat-abbronzatura';
            c.innerHTML = '<span class="stat-icon">☀️</span><div><small>Abbronzatura</small></div>';
            c.querySelector('div').appendChild(abbronzaturaEl);
            statsBar.appendChild(c);
        }
        container.appendChild(statsBar);

        // 2. Gym Hero Graphic
        if (imgHero) {
            resetElement(imgHero);
            const heroCard = document.createElement('div');
            heroCard.className = 'palestra-hero-card';
            heroCard.appendChild(imgHero);
            container.appendChild(heroCard);
        }

        // 3. Primary Workout Action Card (Vai in Palestra)
        if (btnWorkout) {
            resetElement(btnWorkout);
            const workoutSection = document.createElement('div');
            workoutSection.className = 'palestra-section';

            const workoutCard = document.createElement('div');
            workoutCard.className = 'palestra-workout-card';

            btnWorkout.className = 'dlg_item control110 mobile-btn primary palestra-workout-btn';
            btnWorkout.innerHTML = '🏋️‍♂️ VAI IN PALESTRA (Allenati)';
            attachButtonHandler(btnWorkout, 110, hWnd);

            workoutCard.appendChild(btnWorkout);
            const subtitle = document.createElement('div');
            subtitle.className = 'palestra-card-hint';
            subtitle.innerText = 'Richiede un abbonamento attivo. Aumenta la tua Figosità!';
            workoutCard.appendChild(subtitle);

            workoutSection.appendChild(workoutCard);
            container.appendChild(workoutSection);
        }

        // 4. Abbonamenti Subscriptions Section
        const abbSection = document.createElement('div');
        abbSection.className = 'palestra-section';
        const abbTitle = document.createElement('div');
        abbTitle.className = 'palestra-section-title';
        abbTitle.innerHTML = '📋 Scegli Abbonamento Palestra';
        abbSection.appendChild(abbTitle);

        const abbGrid = document.createElement('div');
        abbGrid.className = 'palestra-sub-grid';

        // 1 Mese
        if (btnMese) {
            resetElement(btnMese);
            const card = document.createElement('div');
            card.className = 'palestra-sub-card';
            card.innerHTML = `
                <div class="sub-duration">1 Mese</div>
                <div class="sub-icon">🥉</div>
            `;
            if (priceMese) {
                resetElement(priceMese);
                priceMese.className = 'dlg_item control120 sub-price';
                card.appendChild(priceMese);
            } else {
                const p = document.createElement('div'); p.className = 'sub-price'; p.innerText = '50.000 L.'; card.appendChild(p);
            }
            btnMese.className = 'dlg_item control115 mobile-btn secondary sub-btn';
            btnMese.innerHTML = 'Abbonati';
            attachButtonHandler(btnMese, 115, hWnd);
            card.appendChild(btnMese);
            abbGrid.appendChild(card);
        }

        // 6 Mesi
        if (btnSeiMesi) {
            resetElement(btnSeiMesi);
            const card = document.createElement('div');
            card.className = 'palestra-sub-card featured';
            card.innerHTML = `
                <div class="sub-badge">CONSIGLIATO</div>
                <div class="sub-duration">6 Mesi</div>
                <div class="sub-icon">🥈</div>
            `;
            if (priceSeiMesi) {
                resetElement(priceSeiMesi);
                priceSeiMesi.className = 'dlg_item control121 sub-price';
                card.appendChild(priceSeiMesi);
            } else {
                const p = document.createElement('div'); p.className = 'sub-price'; p.innerText = '270.000 L.'; card.appendChild(p);
            }
            btnSeiMesi.className = 'dlg_item control116 mobile-btn primary sub-btn';
            btnSeiMesi.innerHTML = 'Abbonati';
            attachButtonHandler(btnSeiMesi, 116, hWnd);
            card.appendChild(btnSeiMesi);
            abbGrid.appendChild(card);
        }

        // 1 Anno
        if (btnAnno) {
            resetElement(btnAnno);
            const card = document.createElement('div');
            card.className = 'palestra-sub-card';
            card.innerHTML = `
                <div class="sub-duration">1 Anno</div>
                <div class="sub-icon">🥇</div>
            `;
            if (priceAnno) {
                resetElement(priceAnno);
                priceAnno.className = 'dlg_item control122 sub-price';
                card.appendChild(priceAnno);
            } else {
                const p = document.createElement('div'); p.className = 'sub-price'; p.innerText = '500.000 L.'; card.appendChild(p);
            }
            btnAnno.className = 'dlg_item control117 mobile-btn secondary sub-btn';
            btnAnno.innerHTML = 'Abbonati';
            attachButtonHandler(btnAnno, 117, hWnd);
            card.appendChild(btnAnno);
            abbGrid.appendChild(card);
        }

        abbSection.appendChild(abbGrid);
        container.appendChild(abbSection);

        // 5. Lampada UVA Section
        if (btnLampada) {
            resetElement(btnLampada);
            const lampSection = document.createElement('div');
            lampSection.className = 'palestra-section';

            const lampTitle = document.createElement('div');
            lampTitle.className = 'palestra-section-title';
            lampTitle.innerHTML = '☀️ Solarium & Lampade UVA';
            lampSection.appendChild(lampTitle);

            const lampCard = document.createElement('div');
            lampCard.className = 'palestra-lampada-card';

            const lampInfo = document.createElement('div');
            lampInfo.className = 'lampada-info';
            lampInfo.innerHTML = `
                <div class="lampada-title">🛋️ Seduta Lampada Solare</div>
                <div class="lampada-desc">Aumenta l'abbronzatura e il livello di Figosità immediato.</div>
            `;

            if (priceLampada) {
                resetElement(priceLampada);
                priceLampada.className = 'dlg_item control123 lampada-price';
                lampInfo.appendChild(priceLampada);
            } else {
                const p = document.createElement('div'); p.className = 'lampada-price'; p.innerText = '14.000 L.'; lampInfo.appendChild(p);
            }
            lampCard.appendChild(lampInfo);

            btnLampada.className = 'dlg_item control111 mobile-btn secondary lampada-btn';
            btnLampada.innerHTML = '☀️ Fai una Lampada';
            attachButtonHandler(btnLampada, 111, hWnd);
            lampCard.appendChild(btnLampada);

            lampSection.appendChild(lampCard);
            container.appendChild(lampSection);
        }

        // 6. Bottom Navigation Bar
        if (btnOk) {
            resetElement(btnOk);
            btnOk.className = 'dlg_item control1 button_ok mobile-btn primary';
            btnOk.innerHTML = '✓ Torna ai Negozi';
            attachButtonHandler(btnOk, 1, hWnd);
            const bar = document.createElement('div');
            bar.className = 'mobile-bottom-bar';
            bar.appendChild(btnOk);
            container.appendChild(bar);
        }

        body.innerHTML = '';
        body.appendChild(container);
    }

    function transformSplash(win, hWnd) {
        const body = win.querySelector('.window-body') || win.querySelector('[class*="window-body"]');
        if (!body) return;

        const titleBar = win.querySelector('.title-bar');
        if (titleBar) titleBar.style.display = 'none';

        const img = body.querySelector('img.control202') || body.querySelector('img');
        const container = document.createElement('div');
        container.className = 'mobile-screen-container mobile-splash-view';
        container.style.cssText = 'display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; min-height: 80vh; gap: 24px; cursor: pointer; text-align: center;';

        if (img) {
            resetElement(img);
            img.style.cssText = 'max-width: 90%; max-height: 55vh; object-fit: contain; border-radius: 16px; box-shadow: 0 12px 36px rgba(0, 0, 0, 0.4); background: #ffffff; cursor: pointer;';
            container.appendChild(img);
        }

        const startBtn = document.createElement('button');
        startBtn.className = 'dlg_item control202 mobile-btn primary';
        startBtn.setAttribute('data-class', 'BorBtn');
        startBtn.style.cssText = 'font-size: 18px; font-weight: 800; padding: 16px 32px; border-radius: 14px; box-shadow: 0 6px 24px rgba(0, 0, 0, 0.3); width: 85%; max-width: 320px; cursor: pointer;';
        startBtn.innerHTML = '⚡ TOCCA PER GIOCARE ⚡';

        attachButtonHandler(startBtn, 202, hWnd);
        container.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const targetHwnd = (hWnd !== undefined && hWnd !== null) ? hWnd : _activeWindowHwnd;
            if (typeof _PostMessage === 'function' && targetHwnd !== null && targetHwnd !== undefined) {
                _PostMessage(targetHwnd, WM_COMMAND, 202, 0);
            }
            stopWaiting();
        });
        container.appendChild(startBtn);

        body.innerHTML = '';
        body.appendChild(container);
    }

    function transformJobOffer(win, hWnd) {
        const body = win.querySelector('.window-body') || win.querySelector('[class*="window-body"]');
        if (!body) return;

        const img = body.querySelector('img.dlg_item') || body.querySelector('img');
        const btnPresento = body.querySelector('.control1');
        const btnLascio = body.querySelector('.control2');
        const statics = Array.from(body.querySelectorAll('.control[data-class="STATIC"], div.ss_center, div[data-class="STATIC"]'));

        const container = document.createElement('div');
        container.className = 'mobile-screen-container mobile-job-offer-view';

        if (img) {
            resetElement(img);
            const card = document.createElement('div');
            card.className = 'job-hero-card';
            card.appendChild(img);
            container.appendChild(card);
        }

        const descCard = document.createElement('div');
        descCard.className = 'job-offer-desc-card';
        statics.forEach(st => {
            resetElement(st);
            descCard.appendChild(st);
        });
        container.appendChild(descCard);

        const actionsBar = document.createElement('div');
        actionsBar.className = 'mobile-bottom-bar';
        if (btnLascio) {
            resetElement(btnLascio);
            btnLascio.className = 'dlg_item control2 mobile-btn secondary';
            attachButtonHandler(btnLascio, 2, hWnd);
            actionsBar.appendChild(btnLascio);
        }
        if (btnPresento) {
            resetElement(btnPresento);
            btnPresento.className = 'dlg_item control1 button_ok mobile-btn primary';
            attachButtonHandler(btnPresento, 1, hWnd);
            actionsBar.appendChild(btnPresento);
        }
        container.appendChild(actionsBar);

        body.innerHTML = '';
        body.appendChild(container);
    }

    function transformJobQuiz(win, hWnd) {
        const body = win.querySelector('.window-body') || win.querySelector('[class*="window-body"]');
        if (!body) return;

        const btnSubmit = getButtonOk(body) || body.querySelector('button.control1') || body.querySelector('button');

        // Extract and sort all statics by vertical coordinate
        const statics = Array.from(body.querySelectorAll('.control[data-class="BorStatic"], .control[data-class="STATIC"], div[data-class="STATIC"], div[data-class="BorStatic"], .dlg_item[data-class="BorStatic"], .borstatic'))
            .map(st => {
                const top = parseInt(st.style.top) || 0;
                const text = st.innerText.trim();
                return { el: st, top, text };
            })
            .filter(st => st.text.length > 0)
            .sort((a, b) => a.top - b.top);

        // Group question texts by vertical bands
        const introTexts = statics.filter(s => s.top < 115).map(s => sanitizeItalianText(s.text));
        const qATexts = statics.filter(s => s.top >= 115 && s.top < 210).map(s => sanitizeItalianText(s.text));
        const qBTexts = statics.filter(s => s.top >= 210 && s.top < 330).map(s => sanitizeItalianText(s.text));
        const qCTexts = statics.filter(s => s.top >= 330 && s.top < 430).map(s => sanitizeItalianText(s.text));

        const qATitle = sanitizeItalianText(qATexts.join(' '));
        const qBTitle = sanitizeItalianText(qBTexts.join(' '));
        const qCTitle = sanitizeItalianText(qCTexts.join(' '));

        // Extract checkboxes and their labels
        const checkInputs = Array.from(body.querySelectorAll('input[type="checkbox"], input.bwcc, input[data-class="BorCheck"]'));
        const optionMap = {};

        checkInputs.forEach(input => {
            const match = input.className.match(/control(\d+)/) || input.className.match(/\d+/);
            if (!match) return;
            const controlId = parseInt(match[1] || match[0], 10);
            
            // Find paired label
            let label = null;
            if (input.id) {
                label = body.querySelector(`label[for="${input.id}"]`);
            }
            if (!label && input.parentElement) {
                label = input.parentElement.querySelector('label');
            }
            const text = sanitizeItalianText(label ? label.innerText.trim() : `Opzione ${controlId}`);
            optionMap[controlId] = { input, label, text, controlId };
        });

        const container = document.createElement('div');
        container.className = 'mobile-screen-container mobile-quiz-view';

        // 1. Intro Card
        if (introTexts.length > 0) {
            const introCard = document.createElement('div');
            introCard.className = 'quiz-intro-card';
            introCard.innerHTML = `
                <div class="quiz-header-badge">📋 TEST ATTITUDINALE</div>
                <div class="quiz-intro-text">${introTexts.join('<br>')}</div>
            `;
            container.appendChild(introCard);
        }

        // Helper to render a question block
        function renderQuestionBlock(badgeText, questionTitle, controlIds) {
            const card = document.createElement('div');
            card.className = 'quiz-question-card';

            const header = document.createElement('div');
            header.className = 'quiz-question-header';
            header.innerHTML = `<span class="quiz-question-badge">${badgeText}</span>`;
            
            // Clean title: remove "A.", "B.", "C." prefix if already in badge
            let cleanTitle = questionTitle.replace(/^[A-C]\.\s*/i, '').trim();
            if (!cleanTitle) cleanTitle = questionTitle;

            const titleEl = document.createElement('div');
            titleEl.className = 'quiz-question-title';
            titleEl.innerText = cleanTitle;
            header.appendChild(titleEl);
            card.appendChild(header);

            const optionsList = document.createElement('div');
            optionsList.className = 'quiz-options-list';

            controlIds.forEach(id => {
                const opt = optionMap[id];
                if (!opt) return;

                resetElement(opt.input);
                const optCard = document.createElement('div');
                optCard.className = 'quiz-option-card' + (opt.input.checked ? ' selected' : '');

                // Custom Checkbox Indicator
                const checkIndicator = document.createElement('span');
                checkIndicator.className = 'quiz-check-indicator';
                optCard.appendChild(checkIndicator);

                const lbl = document.createElement('span');
                lbl.className = 'quiz-option-text';
                lbl.innerText = sanitizeItalianText(opt.text);
                optCard.appendChild(lbl);

                // Hidden actual input kept for WASM control allocation
                optCard.appendChild(opt.input);

                // Option touch handler: clicking anywhere toggles the checkbox
                optCard.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    opt.input.checked = !opt.input.checked;
                    optCard.classList.toggle('selected', opt.input.checked);
                    const targetHwnd = (hWnd !== undefined && hWnd !== null) ? hWnd : _activeWindowHwnd;
                    if (typeof _PostMessage === 'function' && targetHwnd !== null && targetHwnd !== undefined) {
                        _PostMessage(targetHwnd, WM_COMMAND, opt.controlId, 0);
                        stopWaiting();
                    }
                });

                optionsList.appendChild(optCard);
            });

            card.appendChild(optionsList);
            container.appendChild(card);
        }

        // 2. Question A (Controls 101, 102, 103)
        renderQuestionBlock('Domanda A', qATitle || 'Domanda A', [101, 102, 103]);

        // 3. Question B (Controls 104, 105, 106)
        renderQuestionBlock('Domanda B', qBTitle || 'Domanda B', [104, 105, 106]);

        // 4. Question C (Controls 107, 108, 109)
        renderQuestionBlock('Domanda C', qCTitle || 'Domanda C', [107, 108, 109]);

        // 5. Sticky Bottom Action Bar
        if (btnSubmit) {
            resetElement(btnSubmit);
            btnSubmit.className = 'dlg_item control1 button_ok mobile-btn primary quiz-submit-btn';
            btnSubmit.innerHTML = '✓ Clicca qui quando hai finito il test !';
            attachButtonHandler(btnSubmit, 1, hWnd);
            const bar = document.createElement('div');
            bar.className = 'mobile-bottom-bar';
            bar.appendChild(btnSubmit);
            container.appendChild(bar);
        }

        body.innerHTML = '';
        body.appendChild(container);
    }

    function transformCompanyList(win, hWnd) {
        const body = win.querySelector('.window-body') || win.querySelector('[class*="window-body"]');
        if (!body) return;

        const img = body.querySelector('img.control289') || body.querySelector('img');
        const btnOk = body.querySelector('.control1') || body.querySelector('button');
        const buttons = Array.from(body.querySelectorAll('button.dlg_item')).filter(b => !b.classList.contains('control1'));

        const container = document.createElement('div');
        container.className = 'mobile-screen-container mobile-company-list-view';

        if (img) {
            resetElement(img);
            const card = document.createElement('div');
            card.className = 'company-hero-card';
            card.appendChild(img);
            container.appendChild(card);
        }

        const list = document.createElement('div');
        list.className = 'company-buttons-list';
        buttons.forEach(btn => {
            resetElement(btn);
            const m = btn.className.match(/control(\d+)/) || btn.className.match(/\d+/);
            const controlId = m ? Number(m[1] || m[0]) : null;
            const text = btn.innerText.trim();
            btn.innerHTML = `<span class="btn-icon">🏢</span> <span class="btn-text">${text}</span> <span class="btn-chevron">›</span>`;
            if (controlId !== null) {
                attachButtonHandler(btn, controlId, hWnd);
            }
            list.appendChild(btn);
        });
        container.appendChild(list);

        if (btnOk) {
            resetElement(btnOk);
            btnOk.className = 'dlg_item control1 button_ok mobile-btn primary';
            btnOk.innerHTML = '✓ Torna Indietro';
            attachButtonHandler(btnOk, 1, hWnd);
            const bar = document.createElement('div');
            bar.className = 'mobile-bottom-bar';
            bar.appendChild(btnOk);
            container.appendChild(bar);
        }

        body.innerHTML = '';
        body.appendChild(container);
    }

    function transformCompanyInfo(win, hWnd) {
        const body = win.querySelector('.window-body') || win.querySelector('[class*="window-body"]');
        if (!body) return;

        const img = body.querySelector('img.dlg_item') || body.querySelector('img');
        const btnOk = body.querySelector('.control1') || body.querySelector('button');
        const statics = Array.from(body.querySelectorAll('.control[data-class="STATIC"], .control[data-class="BorStatic"], div.ss_center'));

        const container = document.createElement('div');
        container.className = 'mobile-screen-container mobile-company-info-view';

        if (img) {
            resetElement(img);
            const card = document.createElement('div');
            card.className = 'company-hero-card';
            card.appendChild(img);
            container.appendChild(card);
        }

        const infoCard = document.createElement('div');
        infoCard.className = 'company-info-card';
        statics.forEach(st => {
            resetElement(st);
            infoCard.appendChild(st);
        });
        container.appendChild(infoCard);

        if (btnOk) {
            resetElement(btnOk);
            btnOk.className = 'dlg_item control1 button_ok mobile-btn primary';
            btnOk.innerHTML = '✓ Chiudi Informazioni';
            attachButtonHandler(btnOk, 1, hWnd);
            const bar = document.createElement('div');
            bar.className = 'mobile-bottom-bar';
            bar.appendChild(btnOk);
            container.appendChild(bar);
        }

        body.innerHTML = '';
        body.appendChild(container);
    }

    function transformEventBeatdown(win, hWnd) {
        const body = win.querySelector('.window-body') || win.querySelector('[class*="window-body"]');
        if (!body) return;

        const img = body.querySelector('img.dlg_item') || body.querySelector('canvas') || body.querySelector('img');
        const btnOk = getButtonOk(body) || body.querySelector('.control1') || body.querySelector('.control2') || body.querySelector('button');

        // Extract and sort all statics by vertical position
        const statics = Array.from(body.querySelectorAll('.control[data-class="BorStatic"], .control[data-class="STATIC"], .dlg_item[data-class="BorStatic"], .dlg_item[data-class="STATIC"], div[data-class="BorStatic"], div[data-class="STATIC"], .borstatic'))
            .map(st => {
                const top = parseInt(st.style.top) || 0;
                return { el: st, top };
            })
            .sort((a, b) => a.top - b.top);

        const container = document.createElement('div');
        container.className = 'mobile-screen-container mobile-event-view';

        if (img) {
            resetElement(img);
            img.style.setProperty('width', 'auto', 'important');
            img.style.setProperty('height', 'auto', 'important');
            img.style.setProperty('max-width', '100%', 'important');
            img.style.setProperty('max-height', '260px', 'important');
            img.style.setProperty('object-fit', 'contain', 'important');
            img.style.setProperty('display', 'block', 'important');
            img.style.setProperty('margin', '0 auto', 'important');
            const card = document.createElement('div');
            card.className = 'event-hero-card';
            card.appendChild(img);
            container.appendChild(card);
        }

        if (statics.length > 0) {
            const card = document.createElement('div');
            card.className = 'event-desc-card';
            statics.forEach(item => {
                resetElement(item.el);
                item.el.style.margin = '4px 0';
                item.el.style.textAlign = 'center';
                if (item.el.classList.contains('control111')) {
                    item.el.className += ' event-location-badge';
                }
                card.appendChild(item.el);
            });
            container.appendChild(card);
        }

        if (btnOk) {
            resetElement(btnOk);
            btnOk.className = 'dlg_item control1 button_ok mobile-btn primary';
            btnOk.innerHTML = '✓ Continua';
            attachButtonHandler(btnOk, 1, hWnd);
            const bar = document.createElement('div');
            bar.className = 'mobile-bottom-bar';
            bar.appendChild(btnOk);
            container.appendChild(bar);
        }

        body.innerHTML = '';
        body.appendChild(container);
    }

    function transformPagella(win, hWnd) {
        const body = win.querySelector('.window-body') || win.querySelector('[class*="window-body"]');
        if (!body) return;

        const risultatoEl = body.querySelector('.control119');
        const btnOk = getButtonOk(body) || body.querySelector('button');

        const subjects = [
            { name: 'Agraria', id: 120 },
            { name: 'Fisica', id: 121 },
            { name: "Attività culturali", id: 122 },
            { name: "Attività matematiche", id: 123 },
            { name: 'Scienze industriali', id: 124 },
            { name: 'Elettrochimica', id: 125 },
            { name: 'Petrolchimica', id: 126 },
            { name: 'Filosofia aziendale', id: 127 },
            { name: 'Metallurgia', id: 128 },
            { name: 'Condotta', id: 129 },
        ];

        const container = document.createElement('div');
        container.className = 'mobile-screen-container mobile-pagella-view';

        // Header / Result Card
        if (risultatoEl) {
            resetElement(risultatoEl);
            const resCard = document.createElement('div');
            resCard.className = 'pagella-result-card';
            resCard.innerHTML = `<div class="pagella-result-label">📜 Giudizio Complessivo:</div>`;
            risultatoEl.className += ' pagella-result-text';
            resCard.appendChild(risultatoEl);
            container.appendChild(resCard);
        }

        // Grades Card
        const gradesCard = document.createElement('div');
        gradesCard.className = 'pagella-grades-card';

        subjects.forEach(sub => {
            const gradeEl = body.querySelector(`.control${sub.id}`);
            const row = document.createElement('div');
            row.className = 'pagella-grade-row';
            row.innerHTML = `<span class="pagella-subject-name">${sub.name}</span>`;
            if (gradeEl) {
                resetElement(gradeEl);
                gradeEl.className += ' pagella-grade-val';
                row.appendChild(gradeEl);
            }
            gradesCard.appendChild(row);
        });
        container.appendChild(gradesCard);

        if (btnOk) {
            resetElement(btnOk);
            btnOk.className = 'dlg_item control1 button_ok mobile-btn primary';
            btnOk.innerHTML = '✓ Torna a Scuola';
            attachButtonHandler(btnOk, 1, hWnd);
            const bar = document.createElement('div');
            bar.className = 'mobile-bottom-bar';
            bar.appendChild(btnOk);
            container.appendChild(bar);
        }

        body.innerHTML = '';
        body.appendChild(container);
    }

    function transformDate(win, hWnd) {
        const body = win.querySelector('.window-body') || win.querySelector('[class*="window-body"]');
        if (!body) return;

        const img = body.querySelector('img.dlg_item') || body.querySelector('canvas') || body.querySelector('img');
        const btnOk = getButtonOk(body) || body.querySelector('.control1');
        const btnCancel = getButtonCancel(body) || body.querySelector('.control2');
        const buttons = Array.from(body.querySelectorAll('button.dlg_item')).filter(b => !b.classList.contains('control1') && !b.classList.contains('control2'));
        const statics = Array.from(body.querySelectorAll('.control[data-class="STATIC"], .control[data-class="BorStatic"], .dlg_item[data-class="STATIC"]'));

        const container = document.createElement('div');
        container.className = 'mobile-screen-container mobile-date-view';

        if (img) {
            resetElement(img);
            const card = document.createElement('div');
            card.className = 'date-hero-card';
            card.appendChild(img);
            container.appendChild(card);
        }

        if (statics.length > 0) {
            const infoCard = document.createElement('div');
            infoCard.className = 'date-info-card';
            statics.forEach(st => {
                resetElement(st);
                infoCard.appendChild(st);
            });
            container.appendChild(infoCard);
        }

        if (buttons.length > 0) {
            const list = document.createElement('div');
            list.className = 'date-actions-list';
            buttons.forEach(btn => {
                resetElement(btn);
                const m = btn.className.match(/control(\d+)/) || btn.className.match(/\d+/);
                const controlId = m ? Number(m[1] || m[0]) : null;
                if (controlId !== null) {
                    attachButtonHandler(btn, controlId, hWnd);
                }
                list.appendChild(btn);
            });
            container.appendChild(list);
        }

        const actionsBar = document.createElement('div');
        actionsBar.className = 'mobile-bottom-bar';
        if (btnCancel) {
            resetElement(btnCancel);
            btnCancel.className = 'dlg_item control2 button_cancel mobile-btn secondary';
            btnCancel.innerHTML = '✕ Annulla';
            attachButtonHandler(btnCancel, 2, hWnd);
            actionsBar.appendChild(btnCancel);
        }
        if (btnOk) {
            resetElement(btnOk);
            btnOk.className = 'dlg_item control1 button_ok mobile-btn primary';
            btnOk.innerHTML = '✓ OK';
            attachButtonHandler(btnOk, 1, hWnd);
            actionsBar.appendChild(btnOk);
        }
        if (btnCancel || btnOk) container.appendChild(actionsBar);

        body.innerHTML = '';
        body.appendChild(container);
    }

    function transformCercaTipa(win, hWnd) {
        const body = win.querySelector('.window-body') || win.querySelector('[class*="window-body"]');
        if (!body) return;

        const img = body.querySelector('img.control210') || body.querySelector('img.dlg_item') || body.querySelector('canvas') || body.querySelector('img');
        const nomeEl = body.querySelector('.control105');
        const figoEl = body.querySelector('.control106');
        const giudizioEl = body.querySelector('.control107');

        const btnCiProvo = body.querySelector('.control101');
        const btnRitorno = getButtonCancel(body) || body.querySelector('.control2') || getButtonOk(body);

        const container = document.createElement('div');
        container.className = 'mobile-screen-container mobile-cerca-tipa-view';

        if (img) {
            resetElement(img);
            const card = document.createElement('div');
            card.className = 'cerca-tipa-hero-card';
            card.appendChild(img);
            container.appendChild(card);
        }

        const statsCard = document.createElement('div');
        statsCard.className = 'cerca-tipa-stats-card';
        if (nomeEl) { resetElement(nomeEl); const r = document.createElement('div'); r.className = 'tipa-stat-row'; r.innerHTML = '<span>💋 Nome:</span>'; r.appendChild(nomeEl); statsCard.appendChild(r); }
        if (figoEl) { resetElement(figoEl); const r = document.createElement('div'); r.className = 'tipa-stat-row'; r.innerHTML = '<span>⭐ Figosità:</span>'; r.appendChild(figoEl); statsCard.appendChild(r); }
        if (giudizioEl) { resetElement(giudizioEl); const r = document.createElement('div'); r.className = 'tipa-stat-row'; r.innerHTML = '<span>📊 Giudizio:</span>'; r.appendChild(giudizioEl); statsCard.appendChild(r); }
        container.appendChild(statsCard);

        const actionsBar = document.createElement('div');
        actionsBar.className = 'mobile-bottom-bar';
        if (btnRitorno) {
            resetElement(btnRitorno);
            btnRitorno.className = 'dlg_item control2 button_cancel mobile-btn secondary';
            btnRitorno.innerHTML = '✕ Ritorno a casa...';
            attachButtonHandler(btnRitorno, 2, hWnd);
            actionsBar.appendChild(btnRitorno);
        }
        if (btnCiProvo) {
            resetElement(btnCiProvo);
            btnCiProvo.className = 'dlg_item control101 button_ok mobile-btn primary';
            btnCiProvo.innerHTML = '💘 Ci provo !';
            attachButtonHandler(btnCiProvo, 101, hWnd);
            actionsBar.appendChild(btnCiProvo);
        }
        container.appendChild(actionsBar);

        body.innerHTML = '';
        body.appendChild(container);
    }

    function transformDueDonne(win, hWnd) {
        const body = win.querySelector('.window-body') || win.querySelector('[class*="window-body"]');
        if (!body) return;

        const statics = Array.from(body.querySelectorAll('.control[data-class="STATIC"], div.ss_center'));
        const buttons = Array.from(body.querySelectorAll('button.dlg_item'));

        const container = document.createElement('div');
        container.className = 'mobile-screen-container mobile-due-donne-view';

        if (statics.length > 0) {
            const descCard = document.createElement('div');
            descCard.className = 'due-donne-desc-card';
            statics.forEach(st => {
                resetElement(st);
                descCard.appendChild(st);
            });
            container.appendChild(descCard);
        }

        if (buttons.length > 0) {
            const list = document.createElement('div');
            list.className = 'due-donne-actions-list';
            buttons.forEach(btn => {
                resetElement(btn);
                const m = btn.className.match(/control(\d+)/) || btn.className.match(/\d+/);
                const controlId = m ? Number(m[1] || m[0]) : null;
                if (controlId !== null) {
                    attachButtonHandler(btn, controlId, hWnd);
                }
                list.appendChild(btn);
            });
            container.appendChild(list);
        }

        body.innerHTML = '';
        body.appendChild(container);
    }

    function transformDueDiPicche(win, hWnd) {
        const body = win.querySelector('.window-body') || win.querySelector('[class*="window-body"]');
        if (!body) return;

        const img = body.querySelector('img.dlg_item') || body.querySelector('img');
        let descEl = body.querySelector('.control105') || body.querySelector('.control[data-class="STATIC"]');
        const btnOk = getButtonOk(body) || body.querySelector('button.control1') || body.querySelector('button');

        const container = document.createElement('div');
        container.className = 'mobile-screen-container mobile-picche-view';

        // Rejection Badge Header
        const badgeHeader = document.createElement('div');
        badgeHeader.className = 'picche-header-badge';
        badgeHeader.innerHTML = '<span>💔</span> <span>DUE DI PICCHE !</span>';
        container.appendChild(badgeHeader);

        // 2 of Spades Hero Card
        if (img) {
            resetElement(img);
            const card = document.createElement('div');
            card.className = 'picche-hero-card';
            card.appendChild(img);
            container.appendChild(card);
        }

        // Girl rejection dialogue quote card
        const quoteCard = document.createElement('div');
        quoteCard.className = 'picche-desc-card';
        const quoteLabel = document.createElement('div');
        quoteLabel.className = 'picche-quote-label';
        quoteLabel.innerHTML = '💬 La ragazza ti dice:';
        quoteCard.appendChild(quoteLabel);

        if (!descEl) {
            descEl = document.createElement('div');
            descEl.className = 'dlg_item control105 picche-quote-text';
            descEl.setAttribute('data-class', 'STATIC');
            descEl.innerText = 'Non ti caga nemmeno di striscio...';
        } else {
            resetElement(descEl);
            descEl.className = 'dlg_item control105 picche-quote-text';
            if (!descEl.innerText.trim()) {
                descEl.innerText = 'Non ti caga nemmeno di striscio...';
            }
        }
        quoteCard.appendChild(descEl);
        container.appendChild(quoteCard);

        // Bottom Action Button
        if (btnOk) {
            resetElement(btnOk);
            btnOk.className = 'dlg_item control1 button_ok mobile-btn danger picche-action-btn';
            btnOk.innerHTML = '💔 Ci rinuncio...';
            attachButtonHandler(btnOk, 1, hWnd);
            const bar = document.createElement('div');
            bar.className = 'mobile-bottom-bar';
            bar.appendChild(btnOk);
            container.appendChild(bar);
        }

        body.innerHTML = '';
        body.appendChild(container);
    }

    function transformScooterShop(win, hWnd) {
        const body = win.querySelector('.window-body') || win.querySelector('[class*="window-body"]');
        if (!body) return;

        const img = body.querySelector('img.dlg_item') || body.querySelector('canvas') || body.querySelector('img');
        const soldiEl = body.querySelector('.control104') || body.querySelector('.control150');
        const btnOk = getButtonOk(body) || body.querySelector('.control1');
        const btnCancel = getButtonCancel(body) || body.querySelector('.control2');
        const buttons = Array.from(body.querySelectorAll('button.dlg_item')).filter(b => !b.classList.contains('control1') && !b.classList.contains('control2'));
        const statics = Array.from(body.querySelectorAll('.control[data-class="STATIC"], .control[data-class="BorStatic"], .dlg_item[data-class="STATIC"]')).filter(s => s !== soldiEl);

        const container = document.createElement('div');
        container.className = 'mobile-screen-container mobile-scooter-shop-view';

        if (soldiEl) {
            resetElement(soldiEl);
            const bar = document.createElement('div'); bar.className = 'mobile-stats-bar';
            const c = document.createElement('div'); c.className = 'mini-stat stat-soldi';
            c.innerHTML = '<small>💰 Soldi</small>';
            c.appendChild(soldiEl);
            bar.appendChild(c);
            container.appendChild(bar);
        }

        if (img) {
            resetElement(img);
            const card = document.createElement('div');
            card.className = 'scooter-hero-card';
            card.appendChild(img);
            container.appendChild(card);
        }

        if (statics.length > 0) {
            const descCard = document.createElement('div');
            descCard.className = 'scooter-desc-card';
            statics.forEach(st => {
                resetElement(st);
                descCard.appendChild(st);
            });
            container.appendChild(descCard);
        }

        if (buttons.length > 0) {
            const list = document.createElement('div');
            list.className = 'scooter-shop-actions-list';
            buttons.forEach(btn => {
                resetElement(btn);
                const m = btn.className.match(/control(\d+)/) || btn.className.match(/\d+/);
                const controlId = m ? Number(m[1] || m[0]) : null;
                if (controlId !== null) {
                    attachButtonHandler(btn, controlId, hWnd);
                }
                list.appendChild(btn);
            });
            container.appendChild(list);
        }

        const actionsBar = document.createElement('div');
        actionsBar.className = 'mobile-bottom-bar';
        if (btnCancel) {
            resetElement(btnCancel);
            btnCancel.className = 'dlg_item control2 button_cancel mobile-btn secondary';
            btnCancel.innerHTML = '✕ Esci';
            attachButtonHandler(btnCancel, 2, hWnd);
            actionsBar.appendChild(btnCancel);
        }
        if (btnOk) {
            resetElement(btnOk);
            btnOk.className = 'dlg_item control1 button_ok mobile-btn primary';
            btnOk.innerHTML = '✓ Conferma';
            attachButtonHandler(btnOk, 1, hWnd);
            actionsBar.appendChild(btnOk);
        }
        if (btnCancel || btnOk) container.appendChild(actionsBar);

        body.innerHTML = '';
        body.appendChild(container);
    }

    function transformCellulare(win, hWnd) {
        const body = win.querySelector('.window-body') || win.querySelector('[class*="window-body"]');
        if (!body) return;

        const img = body.querySelector('img.dlg_item') || body.querySelector('canvas') || body.querySelector('img');
        const soldiEl = body.querySelector('.control104');
        const creditoEl = body.querySelector('.control105');
        const btnOk = getButtonOk(body) || body.querySelector('.control1');
        const btnCancel = getButtonCancel(body) || body.querySelector('.control2');
        const buttons = Array.from(body.querySelectorAll('button.dlg_item')).filter(b => !b.classList.contains('control1') && !b.classList.contains('control2'));
        const statics = Array.from(body.querySelectorAll('.control[data-class="STATIC"], .control[data-class="BorStatic"], .dlg_item[data-class="STATIC"]')).filter(s => s !== soldiEl && s !== creditoEl);

        const container = document.createElement('div');
        container.className = 'mobile-screen-container mobile-phone-view';

        const statsBar = document.createElement('div');
        statsBar.className = 'mobile-stats-bar';
        if (soldiEl) { resetElement(soldiEl); const c = document.createElement('div'); c.className = 'mini-stat stat-soldi'; c.innerHTML = '<small>💰 Soldi</small>'; c.appendChild(soldiEl); statsBar.appendChild(c); }
        if (creditoEl) { resetElement(creditoEl); const c = document.createElement('div'); c.className = 'mini-stat'; c.innerHTML = '<small>📱 Credito</small>'; c.appendChild(creditoEl); statsBar.appendChild(c); }
        if (soldiEl || creditoEl) container.appendChild(statsBar);

        if (img) {
            resetElement(img);
            const card = document.createElement('div');
            card.className = 'phone-hero-card';
            card.appendChild(img);
            container.appendChild(card);
        }

        if (statics.length > 0) {
            const descCard = document.createElement('div');
            descCard.className = 'phone-desc-card';
            statics.forEach(st => {
                resetElement(st);
                descCard.appendChild(st);
            });
            container.appendChild(descCard);
        }

        if (buttons.length > 0) {
            const list = document.createElement('div');
            list.className = 'phone-actions-list';
            buttons.forEach(btn => {
                resetElement(btn);
                const m = btn.className.match(/control(\d+)/) || btn.className.match(/\d+/);
                const controlId = m ? Number(m[1] || m[0]) : null;
                if (controlId !== null) {
                    attachButtonHandler(btn, controlId, hWnd);
                }
                list.appendChild(btn);
            });
            container.appendChild(list);
        }

        const actionsBar = document.createElement('div');
        actionsBar.className = 'mobile-bottom-bar';
        if (btnCancel) {
            resetElement(btnCancel);
            btnCancel.className = 'dlg_item control2 button_cancel mobile-btn secondary';
            btnCancel.innerHTML = '✕ Indietro';
            attachButtonHandler(btnCancel, 2, hWnd);
            actionsBar.appendChild(btnCancel);
        }
        if (btnOk) {
            resetElement(btnOk);
            btnOk.className = 'dlg_item control1 button_ok mobile-btn primary';
            btnOk.innerHTML = '✓ Torna alla Dashboard';
            attachButtonHandler(btnOk, 1, hWnd);
            actionsBar.appendChild(btnOk);
        }
        if (btnCancel || btnOk) container.appendChild(actionsBar);

        body.innerHTML = '';
        body.appendChild(container);
    }

    function transformScooterShowroom(win, hWnd) {
        const body = win.querySelector('.window-body') || win.querySelector('[class*="window-body"]');
        if (!body) return;

        const soldiEl = body.querySelector('.control104');
        const btnOk = getButtonOk(body) || body.querySelector('.control1');
        const btnCancel = getButtonCancel(body) || body.querySelector('.control2');

        const radios = Array.from(body.querySelectorAll('input[type="radio"], input.bwcc'));
        const images = Array.from(body.querySelectorAll('img.dlg_item, img.ws_border')).filter(img => !img.src.includes('SCOOTER.gif'));

        const speedEl = body.querySelector('.control110');
        const marmittaEl = body.querySelector('.control111');
        const carburatoreEl = body.querySelector('.control112');
        const cilindrataEl = body.querySelector('.control113');
        const filtroEl = body.querySelector('.control114');
        const costoEl = body.querySelector('.control117');

        const container = document.createElement('div');
        container.className = 'mobile-screen-container mobile-scooter-showroom-view';

        if (soldiEl) {
            resetElement(soldiEl);
            const bar = document.createElement('div'); bar.className = 'mobile-stats-bar';
            const c = document.createElement('div'); c.className = 'mini-stat stat-soldi';
            c.innerHTML = '<small>💰 Soldi</small>';
            c.appendChild(soldiEl);
            bar.appendChild(c);
            container.appendChild(bar);
        }

        // Models Selection List
        const modelsGrid = document.createElement('div');
        modelsGrid.className = 'scooter-models-grid';

        radios.forEach((radio, idx) => {
            resetElement(radio);
            const parentDiv = radio.closest('div');
            const label = parentDiv?.querySelector('label');
            const img = images[idx];

            const card = document.createElement('div');
            card.className = 'scooter-model-card' + (radio.checked ? ' selected' : '');
            if (img) {
                resetElement(img);
                card.appendChild(img);
            }
            const info = document.createElement('div');
            info.className = 'scooter-model-info';
            info.appendChild(radio);
            if (label) {
                resetElement(label);
                info.appendChild(label);
            }
            card.appendChild(info);

            card.onclick = () => {
                radio.checked = true;
                modelsGrid.querySelectorAll('.scooter-model-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                const match = radio.className.match(/\d+/);
                const targetHwnd = (hWnd !== undefined && hWnd !== null) ? hWnd : _activeWindowHwnd;
                if (match && typeof _PostMessage === 'function' && targetHwnd !== null && targetHwnd !== undefined) {
                    _PostMessage(targetHwnd, WM_COMMAND, Number(match[0]), 0);
                    stopWaiting();
                }
            };
            modelsGrid.appendChild(card);
        });
        container.appendChild(modelsGrid);

        // Specs Grid
        const specsCard = document.createElement('div');
        specsCard.className = 'scooter-specs-card';
        specsCard.innerHTML = '<h3 class="specs-title">Specifiche Modello</h3>';

        const specsGrid = document.createElement('div');
        specsGrid.className = 'specs-grid';

        if (speedEl) { resetElement(speedEl); const r = document.createElement('div'); r.className = 'spec-row'; r.innerHTML = '<span>⚡ Velocità:</span>'; r.appendChild(speedEl); specsGrid.appendChild(r); }
        if (cilindrataEl) { resetElement(cilindrataEl); const r = document.createElement('div'); r.className = 'spec-row'; r.innerHTML = '<span>🚀 Cilindrata:</span>'; r.appendChild(cilindrataEl); specsGrid.appendChild(r); }
        if (marmittaEl) { resetElement(marmittaEl); const r = document.createElement('div'); r.className = 'spec-row'; r.innerHTML = '<span>💨 Marmitta:</span>'; r.appendChild(marmittaEl); specsGrid.appendChild(r); }
        if (carburatoreEl) { resetElement(carburatoreEl); const r = document.createElement('div'); r.className = 'spec-row'; r.innerHTML = '<span>⚙️ Carburatore:</span>'; r.appendChild(carburatoreEl); specsGrid.appendChild(r); }
        if (filtroEl) { resetElement(filtroEl); const r = document.createElement('div'); r.className = 'spec-row'; r.innerHTML = '<span>🌬️ Filtro aria:</span>'; r.appendChild(filtroEl); specsGrid.appendChild(r); }
        if (costoEl) { resetElement(costoEl); const r = document.createElement('div'); r.className = 'spec-row spec-costo'; r.innerHTML = '<span>🏷️ Prezzo:</span>'; r.appendChild(costoEl); specsGrid.appendChild(r); }

        specsCard.appendChild(specsGrid);
        container.appendChild(specsCard);

        const actionsBar = document.createElement('div');
        actionsBar.className = 'mobile-bottom-bar';
        if (btnCancel) {
            resetElement(btnCancel);
            btnCancel.className = 'dlg_item control2 button_cancel mobile-btn secondary';
            btnCancel.innerHTML = '✕ Annulla';
            attachButtonHandler(btnCancel, 2, hWnd);
            actionsBar.appendChild(btnCancel);
        }
        if (btnOk) {
            resetElement(btnOk);
            btnOk.className = 'dlg_item control1 button_ok mobile-btn primary';
            btnOk.innerHTML = '✓ Compra';
            attachButtonHandler(btnOk, 1, hWnd);
            actionsBar.appendChild(btnOk);
        }
        container.appendChild(actionsBar);

        body.innerHTML = '';
        body.appendChild(container);
    }

    function transformTruccaScooter(win, hWnd) {
        const body = win.querySelector('.window-body') || win.querySelector('[class*="window-body"]');
        if (!body) return;

        const soldiEl = body.querySelector('.control104');
        const nameEl = body.querySelector('.control116');
        const speedEl = body.querySelector('.control110');
        const marmittaEl = body.querySelector('.control111');
        const carburatoreEl = body.querySelector('.control112');
        const cilindrataEl = body.querySelector('.control113');
        const filtroEl = body.querySelector('.control114');
        const effEl = body.querySelector('.control115');

        const btnCarb = body.querySelector('.control121');
        const btnMarm = body.querySelector('.control122');
        const btnPist = body.querySelector('.control123');
        const btnFilt = body.querySelector('.control124');
        const btnOk = getButtonOk(body) || body.querySelector('.control1');

        const container = document.createElement('div');
        container.className = 'mobile-screen-container mobile-trucca-scooter-view';

        if (soldiEl) {
            resetElement(soldiEl);
            const bar = document.createElement('div'); bar.className = 'mobile-stats-bar';
            const c = document.createElement('div'); c.className = 'mini-stat stat-soldi';
            c.innerHTML = '<small>💰 Soldi</small>';
            c.appendChild(soldiEl);
            bar.appendChild(c);
            container.appendChild(bar);
        }

        const specsCard = document.createElement('div');
        specsCard.className = 'scooter-specs-card';
        if (nameEl) { resetElement(nameEl); specsCard.innerHTML = `<h3 class="specs-title">🛵 ${nameEl.innerText || 'Scooter'}</h3>`; }

        const specsGrid = document.createElement('div');
        specsGrid.className = 'specs-grid';
        if (speedEl) { resetElement(speedEl); const r = document.createElement('div'); r.className = 'spec-row'; r.innerHTML = '<span>⚡ Velocità:</span>'; r.appendChild(speedEl); specsGrid.appendChild(r); }
        if (cilindrataEl) { resetElement(cilindrataEl); const r = document.createElement('div'); r.className = 'spec-row'; r.innerHTML = '<span>🚀 Cilindrata:</span>'; r.appendChild(cilindrataEl); specsGrid.appendChild(r); }
        if (effEl) { resetElement(effEl); const r = document.createElement('div'); r.className = 'spec-row'; r.innerHTML = '<span>🔧 Efficienza:</span>'; r.appendChild(effEl); specsGrid.appendChild(r); }
        if (marmittaEl) { resetElement(marmittaEl); const r = document.createElement('div'); r.className = 'spec-row'; r.innerHTML = '<span>💨 Marmitta:</span>'; r.appendChild(marmittaEl); specsGrid.appendChild(r); }
        if (carburatoreEl) { resetElement(carburatoreEl); const r = document.createElement('div'); r.className = 'spec-row'; r.innerHTML = '<span>⚙️ Carburatore:</span>'; r.appendChild(carburatoreEl); specsGrid.appendChild(r); }
        if (filtroEl) { resetElement(filtroEl); const r = document.createElement('div'); r.className = 'spec-row'; r.innerHTML = '<span>🌬️ Filtro aria:</span>'; r.appendChild(filtroEl); specsGrid.appendChild(r); }
        specsCard.appendChild(specsGrid);
        container.appendChild(specsCard);

        // Tuning buttons
        const actionsList = document.createElement('div');
        actionsList.className = 'scooter-tuning-actions-list';
        if (btnCarb) { resetElement(btnCarb); btnCarb.className = 'dlg_item control121 mobile-btn secondary'; btnCarb.innerHTML = '<span>⚙️ Carburatore</span> <span>›</span>'; attachButtonHandler(btnCarb, 121, hWnd); actionsList.appendChild(btnCarb); }
        if (btnMarm) { resetElement(btnMarm); btnMarm.className = 'dlg_item control122 mobile-btn secondary'; btnMarm.innerHTML = '<span>💨 Marmitta</span> <span>›</span>'; attachButtonHandler(btnMarm, 122, hWnd); actionsList.appendChild(btnMarm); }
        if (btnPist) { resetElement(btnPist); btnPist.className = 'dlg_item control123 mobile-btn secondary'; btnPist.innerHTML = '<span>🚀 Pistone/Cilindro</span> <span>›</span>'; attachButtonHandler(btnPist, 123, hWnd); actionsList.appendChild(btnPist); }
        if (btnFilt) { resetElement(btnFilt); btnFilt.className = 'dlg_item control124 mobile-btn secondary'; btnFilt.innerHTML = '<span>🌬️ Filtro dell\'aria</span> <span>›</span>'; attachButtonHandler(btnFilt, 124, hWnd); actionsList.appendChild(btnFilt); }
        container.appendChild(actionsList);

        if (btnOk) {
            resetElement(btnOk);
            btnOk.className = 'dlg_item control1 button_ok mobile-btn primary';
            btnOk.innerHTML = '✓ Fatto';
            attachButtonHandler(btnOk, 1, hWnd);
            const bar = document.createElement('div'); bar.className = 'mobile-bottom-bar';
            bar.appendChild(btnOk);
            container.appendChild(bar);
        }

        body.innerHTML = '';
        body.appendChild(container);
    }

    function transformExitSession(win, hWnd) {
        const body = win.querySelector('.window-body') || win.querySelector('[class*="window-body"]');
        if (!body) return;

        const icon = body.querySelector('img[src*="ZSPEGNIMI"]') || body.querySelector('img');
        const radioClose = body.querySelector('input.control101') || body.querySelector('input[type="radio"]');
        const radioShutdown = body.querySelector('input.control102');
        const btnHelp = body.querySelector('button.control110') || body.querySelector('.control110');
        const btnCancel = getButtonCancel(body) || body.querySelector('button.control2') || body.querySelector('.control2');
        const btnOk = getButtonOk(body) || body.querySelector('button.control1') || body.querySelector('.control1');

        const container = document.createElement('div');
        container.className = 'mobile-screen-container mobile-exit-view';

        // Header Card
        const headerCard = document.createElement('div');
        headerCard.className = 'exit-header-card';
        if (icon) {
            resetElement(icon);
            icon.className = 'exit-icon';
            headerCard.appendChild(icon);
        }
        const promptEl = document.createElement('div');
        promptEl.className = 'exit-prompt-text';
        promptEl.innerText = 'Scegli cosa vuoi fare:';
        headerCard.appendChild(promptEl);
        container.appendChild(headerCard);

        // Options List Card
        const optionsCard = document.createElement('div');
        optionsCard.className = 'exit-options-card';

        // Option 1: Chiudi il Tabboz Simulator
        const opt1 = document.createElement('div');
        opt1.className = 'exit-option-card active';
        opt1.dataset.controlId = '101';
        const radio1 = radioClose || document.createElement('input');
        resetElement(radio1);
        radio1.type = 'radio';
        radio1.name = 'bor_radio16';
        radio1.checked = true;
        radio1.className = 'dlg_item control101 exit-radio-input';
        
        opt1.innerHTML = `
            <div class="exit-radio-indicator checked"></div>
            <div class="exit-option-content">
                <div class="exit-option-title">🚪 Chiudi il Tabboz Simulator</div>
                <div class="exit-option-desc">Salva i progressi della partita ed esci dal simulatore.</div>
            </div>
        `;
        opt1.prepend(radio1);
        optionsCard.appendChild(opt1);

        // Option 2: Spegni il computer ed esci di casa
        const opt2 = document.createElement('div');
        opt2.className = 'exit-option-card';
        opt2.dataset.controlId = '102';
        const radio2 = radioShutdown || document.createElement('input');
        resetElement(radio2);
        radio2.type = 'radio';
        radio2.name = 'bor_radio16';
        radio2.checked = false;
        radio2.className = 'dlg_item control102 exit-radio-input';

        opt2.innerHTML = `
            <div class="exit-radio-indicator"></div>
            <div class="exit-option-content">
                <div class="exit-option-title">⚡ Spegni il computer ed esci di casa</div>
                <div class="exit-option-desc">Pubblicità Progresso per il recupero dei giovani disadattati.</div>
            </div>
        `;
        opt2.prepend(radio2);
        optionsCard.appendChild(opt2);

        container.appendChild(optionsCard);

        // Interactive Selection Logic
        function selectOption(controlId) {
            const isOpt1 = controlId === 101;
            radio1.checked = isOpt1;
            radio2.checked = !isOpt1;
            opt1.classList.toggle('active', isOpt1);
            opt2.classList.toggle('active', !isOpt1);
            opt1.querySelector('.exit-radio-indicator').classList.toggle('checked', isOpt1);
            opt2.querySelector('.exit-radio-indicator').classList.toggle('checked', !isOpt1);

            const targetHwnd = (hWnd !== undefined && hWnd !== null) ? hWnd : _activeWindowHwnd;
            if (typeof _PostMessage === 'function' && targetHwnd !== null && targetHwnd !== undefined) {
                _PostMessage(targetHwnd, WM_COMMAND, controlId, 0);
            }
            stopWaiting();
        }

        opt1.addEventListener('click', () => selectOption(101));
        opt2.addEventListener('click', () => selectOption(102));

        // Help button
        if (btnHelp) {
            resetElement(btnHelp);
            btnHelp.className = 'dlg_item control110 exit-help-btn';
            btnHelp.innerHTML = 'ℹ️ Info: Spegni il computer ed esci di casa';
            attachButtonHandler(btnHelp, 110, hWnd);
            container.appendChild(btnHelp);
        }

        // Action Buttons Bar
        const bar = document.createElement('div');
        bar.className = 'mobile-bottom-bar';
        if (btnCancel) {
            resetElement(btnCancel);
            btnCancel.className = 'dlg_item control2 button_cancel mobile-btn secondary';
            btnCancel.innerHTML = 'Annulla';
            attachButtonHandler(btnCancel, 2, hWnd);
            bar.appendChild(btnCancel);
        }
        if (btnOk) {
            resetElement(btnOk);
            btnOk.className = 'dlg_item control1 button_ok mobile-btn primary';
            btnOk.innerHTML = '✓ Conferma';
            attachButtonHandler(btnOk, 1, hWnd);
            bar.appendChild(btnOk);
        }
        container.appendChild(bar);

        body.innerHTML = '';
        body.appendChild(container);
    }

    function transformGeneric(win) {
        const body = win.querySelector('.window-body') || win.querySelector('[class*="window-body"]');
        if (!body) return;

        // Hide legacy decorative shades
        body.querySelectorAll('.BorShade, .ws_border, .horizontal_bump, .vertical_bump, .horizontal_bump_alt, .vertical_bump_alt').forEach(el => {
            if (!el.classList.contains('dlg_item')) el.style.display = 'none';
        });

        // Ensure all interactive controls have reset position and are touchable
        body.querySelectorAll('.dlg_item, button, input, select, textarea, img, canvas').forEach(el => {
            resetElement(el);
        });

        // Reset non-dlg statics and labels
        body.querySelectorAll('.control, label').forEach(el => {
            el.style.position = 'static';
            el.style.left = 'auto';
            el.style.top = 'auto';
            el.style.width = 'auto';
            el.style.height = 'auto';
        });
    }

    async function dialogBox(hWnd, dialog, parentWindowId, hInstance) {
        let html;
        try {
            const response = await fetch(`${RESOURCE_BASE}/dialogs/includes/${dialog}.inc.html`);
            if (!response.ok) throw new Error(`Dialog ${dialog} fetch failed: ${response.status}`);
            html = await response.text();
        } catch (err) {
            console.error('[dialogBox] Failed to load dialog template:', dialog, err);
            return;
        }

        // Decode character escape sequences and CP1252 artifacts
        html = sanitizeItalianText(html);

        // Fix relative image paths in templates
        html = html.replace(/src="resources\//g, 'src="../resources/');
        html = html.replace(/class="window-body[^"]*"/g, 'class="window-body"');

        const win = createWindow(html, hWnd, CW_USEDEFAULT, CW_USEDEFAULT, CW_SKIPRESIZE, CW_SKIPRESIZE, null, 0, 0, parentWindowId);
        const dialogNum = parseInt(dialog, 10);
        console.log('[dialogBox] hWnd:', hWnd, 'dialog:', dialog, 'dialogNum:', dialogNum);
        win.classList.add('dlg-' + dialogNum);

        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            loadingScreen.style.transition = 'opacity 0.3s ease';
            setTimeout(() => { if (loadingScreen.parentNode) loadingScreen.remove(); }, 300);
        }

        setActiveWindow(hWnd);
        addMainMenu(win);

        try {
            if (dialogNum === 1) {
                console.log('[dialogBox] transforming Dashboard for hWnd', hWnd);
                transformDashboard(win, hWnd);
            } else if (dialogNum === 2) {
                transformAbout(win, hWnd);
            } else if (dialogNum === 10 || dialogNum === 11) {
                transformScuola(win, hWnd);
            } else if (dialogNum === 88) {
                transformTabacchi(win, hWnd);
            } else if (dialogNum === 8) {
                transformNegoziMenu(win, hWnd);
            } else if (dialogNum >= 80 && dialogNum <= 86) {
                transformShop(win, hWnd);
            } else if (dialogNum === 7) {
                transformScooter(win, hWnd);
            } else if (dialogNum === 73) {
                transformTruccaScooter(win, hWnd);
            } else if (dialogNum >= 74 && dialogNum <= 79) {
                transformScooterShowroom(win, hWnd);
            } else if (dialogNum >= 70 && dialogNum <= 72) {
                transformScooterShop(win, hWnd);
            } else if (dialogNum === 4) {
                transformDisco(win, hWnd);
            } else if (dialogNum === 13) {
                transformLavoro(win, hWnd);
            } else if (dialogNum >= 390 && dialogNum <= 397) {
                transformJobOffer(win, hWnd);
            } else if (dialogNum >= 200 && dialogNum <= 209) {
                transformJobQuiz(win, hWnd);
            } else if (dialogNum === 210) {
                transformCompanyList(win, hWnd);
            } else if (dialogNum >= 290 && dialogNum <= 297) {
                transformCompanyInfo(win, hWnd);
            } else if (dialogNum === 5) {
                transformFamiglia(win, hWnd);
            } else if (dialogNum === 6) {
                transformCompagnia(win, hWnd);
            } else if (dialogNum === 9 || dialogNum === 190) {
                transformTipa(win, hWnd);
            } else if (dialogNum === 91 || dialogNum === 191) {
                transformCercaTipa(win, hWnd);
            } else if (dialogNum === 92 || dialogNum === 192) {
                transformDueDonne(win, hWnd);
            } else if (dialogNum === 95) {
                transformDueDiPicche(win, hWnd);
            } else if (dialogNum >= 93 && dialogNum <= 94) {
                transformDate(win, hWnd);
            } else if (dialogNum === 89) {
                transformPalestra(win, hWnd);
            } else if (dialogNum === 110) {
                transformPagella(win, hWnd);
            } else if ((dialogNum >= 100 && dialogNum <= 107) || dialogNum === 96) {
                transformEventBeatdown(win, hWnd);
            } else if (dialogNum === 16) {
                transformExitSession(win, hWnd);
            } else if (dialogNum === 12) {
                transformSplash(win, hWnd);
            } else {
                transformGeneric(win, hWnd);
            }
        } catch (err) {
            console.error('[dialogBox] Error transforming dialog ' + dialogNum + ':', err);
        }

        win.querySelectorAll('.dlg_item').forEach(element => {
            const hMenu = Number(element.className.match(/\d+/));
            const dataClass = element.getAttribute('data-class');
            if (hMenu !== -1 && dataClass && typeof _AllocateControl === 'function') {
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
        console.log('[destroyWindow] destroying window:', hWnd);
        const wall = document.getElementById('wall' + hWnd);
        const win = document.getElementById('win' + hWnd);
        if (wall) wall.remove();
        if (win) win.remove();

        if (_activeWindowHwnd === hWnd) {
            const remainingWindows = Array.from(document.querySelectorAll('.window:not(.messagebox)'));
            if (remainingWindows.length > 0) {
                const topWin = remainingWindows[remainingWindows.length - 1];
                const m = topWin.id.match(/\d+/);
                if (m) {
                    setActiveWindow(Number(m[0]));
                }
            } else {
                _activeWindowHwnd = null;
            }
        }
    }

    function loadString(uID, lpBuffer, cchBufferMax) {
        const value = (window.strings && window.strings[uID]) || "";
        stringToUTF8(value, lpBuffer, cchBufferMax);
        return value.length;
    }

    async function loadStringResources() {
        try {
            const response = await fetch(`${RESOURCE_BASE}/strings/strings.json`);
            window.strings = await response.json();
            exports.strings = window.strings;
        } catch (e) {
            console.warn("loadStringResources failed:", e);
        }
    }

    async function preload() {
        try {
            const response = await fetch(`${RESOURCE_BASE}/bitmaps/list.json`);
            const json = await response.json();
            const list = Array.isArray(json) ? json : (json.data || []);
            list.forEach(element => {
                const img = new Image();
                img.src = `${RESOURCE_BASE}/bitmaps/${element}`;
            });
        } catch (e) {
            console.warn("preload failed:", e);
        }
    }

    function calculateClickPosition(event) {
        const rect = event.target.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        return ((y & 0xffff) << 16) + (x & 0xffff);
    }

    function isCheckbox(element) {
        return element.nodeName === "INPUT" && element.type === "checkbox";
    }

    function eventListenerSetup() {
        document.body.addEventListener('click', eventHandler);
        document.body.addEventListener('keydown', eventHandler);
        document.body.addEventListener('input', eventHandler);
    }

    function eventHandler(event) {
        let target = event.target;
        // If clicking a label, find the associated input
        if (target.tagName === 'LABEL' && target.htmlFor) {
            const input = document.getElementById(target.htmlFor);
            if (input) target = input;
        } else if (target.closest('.dlg_item')) {
            target = target.closest('.dlg_item');
        }

        const match = target.className && typeof target.className === 'string' ? target.className.match(/\d+/) : null;

        // Determine target window handle: prioritize the window containing the clicked element
        let targetHwnd = _activeWindowHwnd;
        const clickedWin = target.closest('.window');
        if (clickedWin && clickedWin.id) {
            const m = clickedWin.id.match(/\d+/);
            if (m) {
                targetHwnd = Number(m[0]);
                if (targetHwnd !== _activeWindowHwnd) {
                    setActiveWindow(targetHwnd);
                }
            }
        }

        switch (event.type) {
            case 'click':
                if (match && targetHwnd !== null && targetHwnd !== undefined) {
                    const message = WM_COMMAND;
                    const wParam = Number(match[0]);
                    const lParam = calculateClickPosition(event);
                    if (typeof _PostMessage === 'function') {
                        _PostMessage(targetHwnd, message, wParam, lParam);
                    }
                }
                break;
            case 'input':
                if (match && !isCheckbox(target) && targetHwnd !== null && targetHwnd !== undefined) {
                    const message = WM_COMMAND;
                    const wParam = Number(match[0]);
                    const lParam = 0;
                    if (typeof _PostMessage === 'function') {
                        _PostMessage(targetHwnd, message, wParam, lParam);
                    }
                }
                break;
            case 'keydown':
                if (targetHwnd !== null && targetHwnd !== undefined) {
                    if (event.keyCode === 27) { // ESC
                        const message = WM_KEYDOWN;
                        const wParam = VK_ESCAPE;
                        const lParam = 0;
                        if (typeof _PostMessage === 'function') {
                            _PostMessage(targetHwnd, message, wParam, lParam);
                        }
                    } else if (target.nodeName === "BUTTON" && event.keyCode === 13 && match) {
                        const message = WM_COMMAND;
                        const wParam = Number(match[0]);
                        const lParam = 0;
                        if (typeof _PostMessage === 'function') {
                            _PostMessage(targetHwnd, message, wParam, lParam);
                        }
                    }
                }
                break;
        }
        stopWaiting();
    }

    function shutdown() {
        const element = createElementFromHTML(SHUTDOWN_TMPL);
        element.style.display = 'flex';
        document.getElementById('screen').appendChild(element);
    }

    let _gameStarted = false;
    let _desktopIconAdded = false;

    function startGame() {
        if (_gameStarted) return;
        _gameStarted = true;
        console.log('[Tabboz] Starting game engine...');

        function tryLaunch(attemptsLeft) {
            const startupFn = (typeof _WinMainStartup === 'function') 
                ? _WinMainStartup 
                : (typeof Module !== 'undefined' && typeof Module._WinMainStartup === 'function' ? Module._WinMainStartup : null);

            if (startupFn) {
                try {
                    console.log('[Tabboz] Executing _WinMainStartup()');
                    startupFn();
                    return;
                } catch (e) {
                    console.warn('[Tabboz] WinMainStartup execution deferred:', e);
                }
            }

            if (attemptsLeft > 0) {
                setTimeout(() => tryLaunch(attemptsLeft - 1), 100);
            } else {
                console.error('[Tabboz] Fatal: Could not launch WinMainStartup after retries.');
                const loadingScreen = document.getElementById('loading-screen');
                if (loadingScreen) loadingScreen.remove();
            }
        }

        setTimeout(() => tryLaunch(50), 50);
    }

    function addDesktopIcon(name, icon, title) {
        console.log('[Tabboz] addDesktopIcon called by C runtime. Scheduling game start.');
        _desktopIconAdded = true;
        setTimeout(() => {
            startGame();
        }, 10);
    }
    function makeDraggable(element) {}

    // =========================================================================
    // Exports
    // =========================================================================
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
