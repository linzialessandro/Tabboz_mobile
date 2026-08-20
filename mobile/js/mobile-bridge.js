/*
 * Tabboz Simulator Mobile — Bridge Layer
 * Replaces novantotto.js for mobile rendering
 *
 * This file implements the exact same API surface as novantotto.js,
 * but renders to a mobile-friendly layout instead of Win98 windows.
 * The WASM game engine calls these functions via EM_ASM and expects
 * specific behavior — this bridge preserves that contract exactly.
 *
 * Copyright (c) 2024 — GPL v3 (same as Tabboz Simulator)
 */

((exports) => {

    // =========================================================================
    // Global State & Compatibility (matching novantotto.js)
    // =========================================================================
    window.strings = window.strings || {};
    exports.strings = window.strings;

    _resolve = null;
    _activeWindowHwnd = null;
    _isOpen = false;

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

    // =========================================================================
    // Mobile Configuration & Audio Interceptor
    // =========================================================================
    const RESOURCE_BASE = '../resources';

    // Intercept Audio to redirect relative 'resources/wavs/' paths
    const OriginalAudio = window.Audio;
    window.Audio = function(src) {
        if (src && typeof src === 'string' && src.startsWith('resources/')) {
            src = '../' + src;
        }
        return new OriginalAudio(src);
    };
    window.Audio.prototype = OriginalAudio.prototype;

    // Track window stack for back navigation
    const _windowStack = [];

    // =========================================================================
    // MobileBridge Public API
    // =========================================================================
    exports.MobileBridge = {
        RESOURCE_BASE: RESOURCE_BASE,
        startGame: () => {
            const loader = document.getElementById('loading-screen');
            if (loader) loader.style.display = 'none';
            if (typeof _WinMainStartup === 'function') {
                _WinMainStartup();
            }
        }
    };

    // =========================================================================
    // Asyncify Event System (MUST match novantotto.js exactly)
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

    // =========================================================================
    // DOM Utilities
    // =========================================================================

    function createElementFromHTML(html) {
        const template = document.createElement('template');
        template.innerHTML = html.trim();
        const result = template.content.children;
        if (result.length === 1) {
            return result[0];
        } else {
            return result;
        }
    }

    function getScreen() {
        return document.getElementById('screen');
    }

    function fixResourceUrl(url) {
        if (!url) return url;
        if (url.startsWith('resources/')) {
            return '../' + url;
        }
        return url;
    }

    // =========================================================================
    // Window Management
    // =========================================================================

    function createWindow(html, hWnd, x, y, width, height, lpCaption, dwStyle, dwExStyle, parentWindowId) {
        const screen = getScreen();
        if (!screen) return null;

        // Create wall (modal overlay)
        const wall = document.createElement('div');
        wall.id = 'wall' + hWnd;
        wall.className = 'wall';

        // Create window container
        let win;
        if (typeof html === 'string' && html.trim()) {
            const temp = document.createElement('div');
            temp.innerHTML = html.trim();
            win = temp.firstElementChild || document.createElement('div');
        } else if (html instanceof HTMLElement) {
            win = html;
        } else {
            win = document.createElement('div');
            win.className = 'window';
        }

        win.id = 'win' + hWnd;
        if (!win.classList.contains('mobile-screen')) {
            win.classList.add('mobile-screen');
        }
        win.style.display = 'none';

        // Set caption if provided
        if (lpCaption) {
            const captionText = typeof lpCaption === 'number' ? UTF8ToString(lpCaption) : lpCaption;
            const headerTitle = win.querySelector('.screen-header-title');
            if (headerTitle) {
                headerTitle.textContent = captionText;
            }
        }

        screen.appendChild(wall);
        screen.appendChild(win);

        _windowStack.push(hWnd);
        return win;
    }

    // =========================================================================
    // Dialog Box — Core dialog rendering
    // =========================================================================

    async function dialogBox(hWnd, dialog, parentWindowId, hInstance) {
        const response = await fetch(`${RESOURCE_BASE}/dialogs/includes/${dialog}.inc.html`);
        let html = await response.text();

        // Fix all relative resources/ paths in HTML
        html = html.replace(/src="resources\//g, 'src="../resources/');

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        // Extract title
        let title = '';
        const titleEl = tempDiv.querySelector('.title-bar-text');
        if (titleEl) {
            title = titleEl.textContent.trim();
        }

        // Build mobile screen layout
        const mobileHTML = buildMobileScreen(tempDiv, hWnd, title, dialog);
        createWindow(mobileHTML, hWnd, CW_USEDEFAULT, CW_USEDEFAULT, CW_SKIPRESIZE, CW_SKIPRESIZE, null, 0, 0, parentWindowId);

        setActiveWindow(hWnd);

        // Allocate controls for WASM
        const winEl = document.querySelector(`#win${hWnd}`);
        if (winEl) {
            winEl.querySelectorAll('.dlg_item').forEach(element => {
                const match = element.className.match(/control(\d+)/) || element.className.match(/\d+/);
                const hMenu = match ? Number(match[1] || match[0]) : -1;
                const dataClass = element.getAttribute('data-class');
                if (hMenu !== -1 && dataClass && typeof _AllocateControl === 'function') {
                    const lpClassName = _malloc(128);
                    stringToUTF8(dataClass, lpClassName, 128);
                    _AllocateControl(hInstance, lpClassName, hWnd, hMenu);
                    _free(lpClassName);
                }
            });
        }

        showWindow(hWnd, 1);
    }

    /**
     * Builds a mobile-friendly screen from the original dialog HTML.
     */
    function buildMobileScreen(tempDiv, hWnd, title, dialogId) {
        // Special case: Splash Logo (Dialog 12)
        if (Number(dialogId) === 12) {
            const img = tempDiv.querySelector('img');
            const imgSrc = img ? img.getAttribute('src') : '../resources/bitmaps/1202.png';
            return `
                <div class="mobile-screen splash-screen" onclick="if(typeof _PostMessage==='function'){_PostMessage(${hWnd},0x0111,202,0);stopWaiting();}">
                    <div class="splash-container">
                        <img src="${imgSrc}" class="dlg_item control202" data-class="BorBtn" alt="Tabboz Simulator" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);" />
                        <div style="color: white; margin-top: 16px; font-size: 14px; opacity: 0.85;">Tocca per iniziare</div>
                    </div>
                </div>`;
        }

        // Collect elements
        const dlgItems = Array.from(tempDiv.querySelectorAll('.dlg_item'));
        const images = [];
        const buttons = [];
        const statics = [];
        const radios = [];
        const checkboxes = [];
        const inputs = [];
        const selects = [];
        const canvases = [];
        const otherControls = [];

        dlgItems.forEach(item => {
            const dataClass = (item.getAttribute('data-class') || '').toUpperCase();
            const tag = item.tagName.toUpperCase();

            if (tag === 'IMG') {
                images.push(item);
            } else if (tag === 'BUTTON') {
                buttons.push(item);
            } else if (tag === 'CANVAS') {
                canvases.push(item);
            } else if (tag === 'SELECT') {
                selects.push(item);
            } else if (tag === 'INPUT') {
                if (item.type === 'radio') {
                    radios.push(item);
                } else if (item.type === 'checkbox') {
                    checkboxes.push(item);
                } else {
                    inputs.push(item);
                }
            } else if (dataClass === 'STATIC' || tag === 'DIV') {
                statics.push(item);
            } else {
                otherControls.push(item);
            }
        });

        // Also check for non-dlg_item images (decorative icons)
        const decoImages = Array.from(tempDiv.querySelectorAll('img:not(.dlg_item)'));

        let html = `<div class="mobile-screen">`;

        // Screen header
        html += `<div class="screen-header">`;
        if (Number(dialogId) !== 1) {
            html += `<button class="screen-back-btn" onclick="if(typeof _PostMessage==='function'){_PostMessage(${hWnd},0x100,0x1B,0);stopWaiting();}" aria-label="Indietro">←</button>`;
        }
        html += `<span class="screen-header-title">${escapeHTML(title || 'Tabboz Simulator')}</span>`;
        html += `<div class="screen-header-spacer"></div>`;
        html += `</div>`;

        // Hidden menu anchors for C-code compatibility (.menu106, .menu107, etc.)
        html += `<div style="display:none;" id="menubar"><span class="menu menu106"></span><span class="menu menu107"></span></div>`;

        // Scrollable body
        html += `<div class="screen-body">`;

        // Hero Images / Dialog art
        if (images.length > 0) {
            images.forEach(img => {
                const src = img.getAttribute('src');
                const classes = img.className;
                const dataClass = img.getAttribute('data-class') || 'BorBtn';
                html += `<div class="dialog-hero-image" style="text-align: center; margin-bottom: 12px;">`;
                html += `<img src="${src}" class="${classes}" data-class="${dataClass}" style="max-width: 100%; height: auto; border-radius: 8px;" />`;
                html += `</div>`;
            });
        }

        // Canvas elements (character portrait, partner sprite)
        canvases.forEach(canvas => {
            const classes = canvas.className;
            const width = canvas.getAttribute('width') || 136;
            const height = canvas.getAttribute('height') || 276;
            html += `<div class="canvas-container">`;
            html += `<canvas class="${classes}" width="${width}" height="${height}" data-class="${canvas.getAttribute('data-class') || 'BMPView'}"></canvas>`;
            html += `</div>`;
        });

        // Main Screen Special Layout (Dialog 1)
        if (Number(dialogId) === 1) {
            html += `<div class="dashboard-stats" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">`;
            statics.forEach(s => {
                const classes = s.className;
                const text = s.textContent.trim();
                html += `<div class="stat-card" style="background: var(--card-bg); border-radius: 10px; padding: 10px; box-shadow: var(--shadow-sm);"><div class="${classes}" data-class="STATIC">${escapeHTML(text)}</div></div>`;
            });
            html += `</div>`;

            // Action button grid with emojis
            const btnIcons = {
                '130': '🛵', // Scooter
                '131': '🛍️', // Negozi
                '132': '🕺', // Disco
                '133': '💃', // Tipa
                '134': '👥', // Compagnia
                '135': '👨‍👩‍👦', // Famiglia
                '136': '📚', // Scuola
                '137': '💼', // Lavoro
                '120': 'ℹ️', // About
            };

            html += `<div class="dashboard-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px;">`;
            buttons.forEach(btn => {
                const classes = btn.className;
                const text = btn.textContent.trim();
                const match = classes.match(/control(\d+)/);
                const cid = match ? match[1] : '';
                const icon = btnIcons[cid] || '▶';

                html += `
                    <button class="${classes} nav-grid-btn" data-class="BUTTON" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 14px 6px; background: var(--card-bg); border-radius: 12px; border: none; box-shadow: var(--shadow-sm); min-height: 72px; cursor: pointer;">
                        <span style="font-size: 24px;">${icon}</span>
                        <span style="font-size: 12px; font-weight: 600; color: var(--text-main); text-align: center;">${escapeHTML(text)}</span>
                    </button>`;
            });
            html += `</div>`;
        } else {
            // Standard Dialog Layout

            // Static text elements
            if (statics.length > 0) {
                html += `<div class="info-section">`;
                statics.forEach(s => {
                    const classes = s.className;
                    const text = s.textContent.trim();
                    html += `<div class="${classes}" data-class="${s.getAttribute('data-class') || 'STATIC'}">${escapeHTML(text)}</div>`;
                });
                html += `</div>`;
            }

            // Decorative Icons
            if (decoImages.length > 0) {
                decoImages.forEach(img => {
                    const src = img.getAttribute('src');
                    html += `<div style="text-align: center; margin: 8px 0;"><img src="${src}" style="width: 32px; height: 32px;" alt="" /></div>`;
                });
            }

            // Text inputs
            inputs.forEach(input => {
                const classes = input.className;
                const value = input.value || '';
                const disabled = input.disabled ? 'disabled' : '';
                html += `<div class="input-group">`;
                html += `<input type="text" class="${classes}" value="${escapeHTML(value)}" ${disabled} data-class="${input.getAttribute('data-class') || 'EDIT'}">`;
                html += `</div>`;
            });

            // Select dropdowns
            selects.forEach(sel => {
                const classes = sel.className;
                html += `<div class="select-group">`;
                html += `<select class="${classes}" data-class="${sel.getAttribute('data-class') || 'COMBOBOX'}">${sel.innerHTML}</select>`;
                html += `</div>`;
            });

            // Radio options
            if (radios.length > 0) {
                html += `<div class="radio-group">`;
                radios.forEach(radio => {
                    const classes = radio.className;
                    const name = radio.name || '';
                    const checked = radio.checked ? 'checked' : '';
                    const label = radio.parentNode ? radio.parentNode.querySelector('label') : null;
                    const labelText = label ? label.textContent.trim() : '';
                    const controlMatch = radio.className.match(/control(\d+)/);
                    const controlId = controlMatch ? controlMatch[1] : '';

                    html += `<label class="radio-option" for="radio_${controlId}">`;
                    html += `<input type="radio" id="radio_${controlId}" class="${classes}" name="${name}" ${checked} data-class="${radio.getAttribute('data-class') || 'BorRadio'}">`;
                    html += `<span class="radio-label">${escapeHTML(labelText)}</span>`;
                    html += `</label>`;
                });
                html += `</div>`;
            }

            // Checkbox options
            if (checkboxes.length > 0) {
                html += `<div class="checkbox-group">`;
                checkboxes.forEach(cb => {
                    const classes = cb.className;
                    const checked = cb.checked ? 'checked' : '';
                    const label = cb.parentNode ? cb.parentNode.querySelector('label') : null;
                    const labelText = label ? label.textContent.trim() : '';
                    const controlMatch = cb.className.match(/control(\d+)/);
                    const controlId = controlMatch ? controlMatch[1] : '';

                    html += `<label class="checkbox-option" for="cb_${controlId}">`;
                    html += `<input type="checkbox" id="cb_${controlId}" class="${classes}" ${checked} data-class="${cb.getAttribute('data-class') || 'BorCheck'}">`;
                    html += `<span class="checkbox-label">${escapeHTML(labelText)}</span>`;
                    html += `</label>`;
                });
                html += `</div>`;
            }

            // Action buttons
            if (buttons.length > 0) {
                html += `<div class="action-buttons">`;
                buttons.forEach(btn => {
                    const classes = btn.className;
                    const text = btn.textContent.trim();
                    const controlMatch = btn.className.match(/control(\d+)/);
                    const controlId = controlMatch ? controlMatch[1] : '';

                    let btnClass = 'action-btn';
                    if (controlId === '1' || text.toLowerCase() === 'ok') {
                        btnClass = 'action-btn primary';
                    } else if (controlId === '2' || text.toLowerCase() === 'cancel' || text.toLowerCase() === 'annulla') {
                        btnClass = 'action-btn secondary';
                    }

                    html += `<button class="${classes} ${btnClass}" data-class="${btn.getAttribute('data-class') || 'BUTTON'}">${escapeHTML(text)}</button>`;
                });
                html += `</div>`;
            }

            // Other controls
            otherControls.forEach(ctrl => {
                const classes = ctrl.className;
                html += `<div class="${classes}" data-class="${ctrl.getAttribute('data-class') || 'STATIC'}">${ctrl.innerHTML}</div>`;
            });
        }

        html += `</div>`; // screen-body
        html += `</div>`; // mobile-screen

        return html;
    }

    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // =========================================================================
    // Message Box
    // =========================================================================

    async function messageBox(hWnd, lpText, lpCaption, uType, parentWindowId) {
        const text = UTF8ToString(lpText);
        const caption = lpCaption ? UTF8ToString(lpCaption) : '';

        let iconSrc = '';
        if (uType & 0x00000020) { // MB_ICONQUESTION
            iconSrc = `${RESOURCE_BASE}/icons/novantotto/102.png`;
        } else if (uType & 0x00000010) { // MB_ICONSTOP
            iconSrc = `${RESOURCE_BASE}/icons/novantotto/103.png`;
        } else if (uType & 0x00000030) { // MB_ICONEXCLAMATION
            iconSrc = `${RESOURCE_BASE}/icons/novantotto/101.png`;
        } else if (uType & 0x00000040) { // MB_ICONINFORMATION
            iconSrc = `${RESOURCE_BASE}/icons/novantotto/104.png`;
        }

        let buttonsHTML = '';
        if (uType & 0x00000001) { // MB_OKCANCEL
            buttonsHTML = `
                <button class="dlg_item control1 msgbox-btn primary">OK</button>
                <button class="dlg_item control2 msgbox-btn secondary">Annulla</button>`;
        } else if (uType & 0x00000004) { // MB_YESNO
            buttonsHTML = `
                <button class="dlg_item control6 msgbox-btn primary">Sì</button>
                <button class="dlg_item control7 msgbox-btn secondary">No</button>`;
        } else { // MB_OK
            buttonsHTML = `
                <button class="dlg_item control1 msgbox-btn primary">OK</button>`;
        }

        const msgboxHTML = `
            <div class="msgbox-card">
                <div class="msgbox-header">${escapeHTML(caption)}</div>
                <div class="msgbox-body">
                    ${iconSrc ? `<img src="${iconSrc}" class="msgbox-icon" width="40" height="40" alt="">` : ''}
                    <p class="msgbox-text content">${escapeHTML(text)}</p>
                </div>
                <div class="msgbox-actions">
                    ${buttonsHTML}
                </div>
            </div>`;

        const screen = getScreen();
        const wall = document.createElement('div');
        wall.id = 'wall' + hWnd;
        wall.className = 'wall msgbox-wall';

        const win = document.createElement('div');
        win.id = 'win' + hWnd;
        win.className = 'msgbox-overlay';
        win.innerHTML = msgboxHTML;

        screen.appendChild(wall);
        screen.appendChild(win);

        _windowStack.push(hWnd);
        setActiveWindow(hWnd);
        showWindow(hWnd, 1);
    }

    // =========================================================================
    // Window Lifecycle
    // =========================================================================

    function destroyWindow(hWnd) {
        const screen = getScreen();
        const win = document.getElementById('win' + hWnd);
        const wall = document.getElementById('wall' + hWnd);

        if (win) {
            win.classList.add('slide-out');
            setTimeout(() => {
                if (win.parentNode) win.parentNode.removeChild(win);
            }, 280);
        }
        if (wall) {
            wall.classList.add('fade-out');
            setTimeout(() => {
                if (wall.parentNode) wall.parentNode.removeChild(wall);
            }, 280);
        }

        const idx = _windowStack.indexOf(hWnd);
        if (idx !== -1) _windowStack.splice(idx, 1);

        if (_windowStack.length > 0) {
            setActiveWindow(_windowStack[_windowStack.length - 1]);
        }
    }

    function showWindow(hWnd, show) {
        const win = document.getElementById('win' + hWnd);
        const wall = document.getElementById('wall' + hWnd);
        if (win != null) {
            if (show) {
                win.style.display = 'flex';
                win.classList.add('slide-in');
                win.classList.remove('slide-out');
            } else {
                win.style.display = 'none';
            }
            if (wall) wall.style.display = show ? 'block' : 'none';
            return true;
        }
        return false;
    }

    function showApp(show) {
        document.querySelectorAll('.mobile-screen,.wall,.msgbox-overlay').forEach(
            (item) => item.style.display = show ? '' : 'none'
        );
    }

    function setActiveWindow(hWnd) {
        _activeWindowHwnd = hWnd;
    }

    // =========================================================================
    // Control Accessors
    // =========================================================================

    function setDlgItemText(hWnd, nIDDlgItem, lpString) {
        let control = document.querySelector(`#win${hWnd} .control${nIDDlgItem}`);
        if (control == null) {
            return false;
        } else if (control.tagName === "INPUT") {
            if (control.type === "radio") {
                const label = control.parentNode.querySelector("label, .radio-label, span");
                if (label != null) {
                    label.innerText = UTF8ToString(lpString);
                }
            } else {
                control.value = UTF8ToString(lpString);
            }
        } else if (control.tagName === "BUTTON") {
            control.textContent = UTF8ToString(lpString);
        } else {
            control.innerText = UTF8ToString(lpString);
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
        } else {
            return 0;
        }
    }

    function setCheck(hWnd, nIDDlgItem, wParam) {
        const control = document.querySelector(`#win${hWnd} .control${nIDDlgItem}`);
        if (control != null) {
            control.checked = (wParam !== 0);
        }
        return 0;
    }

    function getCheck(hWnd, nIDDlgItem) {
        const control = document.querySelector(`#win${hWnd} .control${nIDDlgItem}`);
        if (control != null) {
            return control.checked ? 1 : 0;
        }
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
        if (control != null) {
            control.selectedIndex = wParam;
        }
        return 0;
    }

    // =========================================================================
    // Graphics
    // =========================================================================

    async function drawImage(hWnd, lpCanvasClass, lpBitmapName, x, y) {
        const canvasClass = UTF8ToString(lpCanvasClass);
        const imageId = UTF8ToString(lpBitmapName);
        const canvas = document.querySelector(`#win${hWnd} .${canvasClass}`);
        if (canvas) {
            const url = `${RESOURCE_BASE}/bitmaps/${imageId}.png`;
            const image = new Image();
            await new Promise(r => image.onload = r, image.src = url);
            canvas.getContext("2d").drawImage(image, x, y);
        }
    }

    function setIcon(hWnd, icon) {
        const iconName = UTF8ToString(icon);
        const header = document.querySelector(`#win${hWnd} .screen-header-title`);
        if (header && !header.querySelector('img')) {
            const img = document.createElement('img');
            img.src = `${RESOURCE_BASE}/icons/${iconName}.gif`;
            img.width = 20;
            img.height = 20;
            img.style.marginRight = '8px';
            img.style.verticalAlign = 'middle';
            header.prepend(img);
        }
    }

    function moveWindow(hWnd, X, Y, nWidth, nHeight) {
        return true;
    }

    function getSystemMetrics(nIndex) {
        const screen = getScreen();
        if (!screen) return 0;
        switch (nIndex) {
            case SM_CXSCREEN:
                return parseInt(getComputedStyle(screen).width) || 360;
            case SM_CYSCREEN:
                return parseInt(getComputedStyle(screen).height) || 640;
            default:
                return 0;
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
            case 3: return (parseInt(style.top) || 0) + (parseInt(style.height) || 640);
            default: return 0;
        }
    }

    // =========================================================================
    // Resources
    // =========================================================================

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
            console.warn('loadStringResources:', e);
        }
    }

    async function preload() {
        try {
            const response = await fetch(`${RESOURCE_BASE}/bitmaps/list.json`);
            const data = await response.json();
            const list = Array.isArray(data) ? data : (data.data || []);
            list.forEach(element => {
                (new Image()).src = `${RESOURCE_BASE}/bitmaps/${element}`;
            });
        } catch (e) {
            console.warn('Preload:', e);
        }
    }

    // =========================================================================
    // Event Handling
    // =========================================================================

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
        document.querySelector('body').addEventListener('click', eventHandler);
        document.querySelector('body').addEventListener('keydown', eventHandler);
        document.querySelector('body').addEventListener('input', eventHandler);
    }

    function eventHandler(event) {
        const match = event.target.className.match(/control(\d+)/) || event.target.className.match(/\d+/);
        switch (event.type) {
            case 'click':
                if (match) {
                    const message = WM_COMMAND;
                    const wParam = Number(match[1] || match[0]);
                    const lParam = calculateClickPosition(event);
                    _PostMessage(_activeWindowHwnd, message, wParam, lParam);
                }
                break;
            case 'input':
                if (match && !isCheckbox(event.target)) {
                    const message = WM_COMMAND;
                    const wParam = Number(match[1] || match[0]);
                    const lParam = 0;
                    _PostMessage(_activeWindowHwnd, message, wParam, lParam);
                }
                break;
            case 'keydown':
                if (event.keyCode === 27) { // ESC
                    const message = WM_KEYDOWN;
                    const wParam = VK_ESCAPE;
                    const lParam = 0;
                    _PostMessage(_activeWindowHwnd, message, wParam, lParam);
                } else if (event.target.nodeName === "BUTTON" && event.keyCode === 13 && match) {
                    const message = WM_COMMAND;
                    const wParam = Number(match[1] || match[0]);
                    const lParam = 0;
                    _PostMessage(_activeWindowHwnd, message, wParam, lParam);
                }
                break;
        }
        stopWaiting();
    }

    // =========================================================================
    // Menu System
    // =========================================================================

    function generateMenuHTML(menuStructure) {
        function generateMenuItemHTML(item) {
            const label = (item.label || '').replace('&', '');
            if (item.kind === 'separator') {
                return '<div class="mobile-menu-separator"></div>';
            }
            return `<button class="mobile-menu-item dlg_item menu menu${item.menu_id}" data-menu-id="${item.menu_id}">${label}</button>`;
        }

        let html = '';
        for (const menu of menuStructure) {
            const label = (menu.label || '').replace('&', '');
            html += `<div class="mobile-menu-section">`;
            html += `<div class="mobile-menu-section-title">${label}</div>`;
            if (menu.items && menu.items.length > 0) {
                for (const item of menu.items) {
                    html += generateMenuItemHTML(item);
                }
            }
            html += `</div>`;
        }
        return html;
    }

    async function addMenuToWindow(hWnd, lpMenuName) {
        const menuName = UTF8ToString(lpMenuName);
        const win = document.querySelector(`#win${hWnd}`);
        if (win != null) {
            try {
                const response = await fetch(`${RESOURCE_BASE}/menus/${menuName}.json`);
                const menu = await response.json();
                win.dataset.menuJson = JSON.stringify(menu);

                const header = win.querySelector('.screen-header');
                if (header && !header.querySelector('.menu-toggle-btn')) {
                    const spacer = header.querySelector('.screen-header-spacer');
                    if (spacer) {
                        const menuBtn = document.createElement('button');
                        menuBtn.className = 'menu-toggle-btn';
                        menuBtn.innerHTML = '☰';
                        menuBtn.setAttribute('aria-label', 'Menu');
                        menuBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            toggleMobileMenu(hWnd, menu);
                        });
                        spacer.replaceWith(menuBtn);
                    }
                }
            } catch (e) {
                console.warn('Could not load menu:', menuName, e);
            }
        }
    }

    function toggleMobileMenu(hWnd, menuData) {
        let existing = document.getElementById('mobile-menu-drawer');
        if (existing) {
            existing.remove();
            document.getElementById('mobile-menu-overlay')?.remove();
            return;
        }

        const overlay = document.createElement('div');
        overlay.id = 'mobile-menu-overlay';
        overlay.className = 'mobile-menu-overlay';
        overlay.addEventListener('click', () => {
            overlay.remove();
            document.getElementById('mobile-menu-drawer')?.remove();
        });

        const drawer = document.createElement('div');
        drawer.id = 'mobile-menu-drawer';
        drawer.className = 'mobile-menu-drawer slide-in-right';
        drawer.innerHTML = `
            <div class="mobile-menu-drawer-header">
                <span>Menu</span>
                <button class="mobile-menu-close" onclick="document.getElementById('mobile-menu-drawer')?.remove();document.getElementById('mobile-menu-overlay')?.remove();">✕</button>
            </div>
            <div class="mobile-menu-drawer-body">
                ${generateMenuHTML(menuData)}
            </div>`;

        document.body.appendChild(overlay);
        document.body.appendChild(drawer);
    }

    function addMainMenu(mainMenuEl) {
        if (!mainMenuEl) return;
    }

    function addDesktopIcon(name, icon, title) {
        // Auto-start on mobile
    }

    function shutdown() {
        const screen = getScreen();
        if (screen) {
            screen.innerHTML = `
                <div class="shutdown-screen">
                    <div class="shutdown-text">
                        È ora possibile chiudere<br>l'applicazione.
                    </div>
                </div>`;
        }
    }

    function makeDraggable(element) {}

    // =========================================================================
    // Exports (MUST match novantotto.js exact export list)
    // =========================================================================
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
