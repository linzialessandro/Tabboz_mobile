/**
 * Tabboz Simulator Mobile - Mobile Bridge
 * Faithful Win32 Emulation Bridge for Emscripten / WebAssembly
 * Based directly on novantotto.js with mobile touch ergonomics.
 */

((exports) => {
    // =========================================================================
    // Global State (matching novantotto.js exact contracts)
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

    const RESOURCE_BASE = '../resources';

    // Intercept Audio for mobile sub-directory compatibility
    const OriginalAudio = window.Audio;
    window.Audio = function(src) {
        if (src && typeof src === 'string' && src.startsWith('resources/')) {
            src = '../' + src;
        }
        return new OriginalAudio(src);
    };
    window.Audio.prototype = OriginalAudio.prototype;

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

        document.addEventListener('click', (event) => {
            if (!event.target.classList.contains('active-menu') && !event.target.closest('.active-menu')) {
                closeMenu();
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

    function setActiveWindow(hWnd) {
        console.log('[setActiveWindow] setting active window:', hWnd);
        _activeWindowHwnd = hWnd;
        document.querySelectorAll(".window").forEach(w => {
            w.style.zIndex = '20';
            const tb = w.querySelector(".title-bar");
            if (tb) tb.classList.add("inactive");
        });
        const activeWin = document.querySelector(`#win${hWnd}`);
        if (activeWin) {
            activeWin.style.zIndex = '50';
            const tb = activeWin.querySelector(".title-bar");
            if (tb) tb.classList.remove("inactive");
            try {
                activeWin.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } catch(e) {}
        }
    }

    function fitWindowToScreen(win) {
        if (!win) return;
        const screenWidth = window.innerWidth - 12;
        const winWidth = parseInt(win.style.width) || win.offsetWidth || 410;
        if (winWidth > screenWidth && screenWidth > 200) {
            const scale = Math.min(1, screenWidth / winWidth);
            win.style.transform = `scale(${scale})`;
            win.style.transformOrigin = 'top center';
            win.style.marginBottom = `${(1 - scale) * -win.offsetHeight}px`;
        } else {
            win.style.transform = '';
            win.style.marginBottom = '';
        }
    }

    window.addEventListener('resize', () => {
        document.querySelectorAll('.window').forEach(win => fitWindowToScreen(win));
    });

    function showWindow(hWnd, show) {
        const win = document.querySelector('#win' + hWnd);
        const wall = document.querySelector('#wall' + hWnd);
        if (win != null) {
            win.style.display = show ? 'block' : 'none';
            if (wall != null) wall.style.display = show ? 'block' : 'none';
            if (show) {
                fitWindowToScreen(win);
            }
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
            element.innerHTML = `<img src="${src}" height="18" style="vertical-align:middle; margin-right:6px;" />` + element.innerText;
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
        const text = UTF8ToString(lpString);
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
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;

        // Determine true unscaled design dimensions
        let winW = parseInt(win.style.width) || win.offsetWidth || 360;
        let winH = parseInt(win.style.height) || win.offsetHeight || 360;
        if (win.scrollWidth > winW) winW = win.scrollWidth;
        if (win.scrollHeight > winH) winH = win.scrollHeight;

        // Calculate available viewport size (leaving small safe margins)
        const availW = Math.max(280, screenW - 12);
        const availH = Math.max(320, screenH - 24);

        const scaleX = availW / winW;
        const scaleY = availH / winH;

        // Scale to maximize screen usage without cutting off any edge
        let scale = Math.min(scaleX, scaleY);
        scale = Math.min(1.6, Math.max(0.6, scale));

        win.style.transform = `translate(-50%, -50%) scale(${scale.toFixed(3)})`;
        win.style.transformOrigin = 'center center';
        win.style.left = '50%';
        win.style.top = '50%';
    }

    function setWindowInitialPosition(win, x, y, width, height, parentWindowId) {
        if (width !== CW_SKIPRESIZE && width !== CW_USEDEFAULT) {
            win.style.width = width + 'px';
        }
        if (height !== CW_SKIPRESIZE && height !== CW_USEDEFAULT) {
            win.style.height = height + 'px';
        }
        centerWindow(win);
    }

    function createWindow(html, hWnd, x, y, width, height, lpCaption, dwStyle, dwExStyle, parentWindowId) {
        const wall = createElementFromHTML(WALL_TMPL);
        const win = createElementFromHTML(html || WINDOW_TMPL);
        win.style.display = 'none';
        wall.id = 'wall' + hWnd;
        win.id = 'win' + hWnd;

        const destination = document.getElementById('screen');
        destination.appendChild(wall);
        destination.appendChild(win);

        setWindowInitialPosition(win, x, y, width, height, parentWindowId);

        if (lpCaption) {
            const titleEl = win.querySelector('.title-bar-text');
            if (titleEl) titleEl.innerText = typeof lpCaption === 'number' ? UTF8ToString(lpCaption) : lpCaption;
        }
        return win;
    }

    function messageBox(hWnd, lpText, lpCaption, uType, parentWindowId) {
        return new Promise((resolve) => {
            const c = createWindow(MESSAGE_BOX_TMPL, hWnd, 0, 0, CW_SKIPRESIZE, CW_SKIPRESIZE, lpCaption, 0, 0, parentWindowId);

            if (uType & 0x00000020) c.querySelector('img').src = `${RESOURCE_BASE}/icons/novantotto/102.png`;
            else if (uType & 0x00000010) c.querySelector('img').src = `${RESOURCE_BASE}/icons/novantotto/103.png`;
            else if (uType & 0x00000030) c.querySelector('img').src = `${RESOURCE_BASE}/icons/novantotto/101.png`;
            else if (uType & 0x00000040) c.querySelector('img').src = `${RESOURCE_BASE}/icons/novantotto/104.png`;

            if (uType & 0x00000001) { // MB_OKCANCEL
                c.querySelector('.control1').style.display = 'inline-block';
                c.querySelector('.control2').style.display = 'inline-block';
                c.querySelector('.control6').style.display = 'none';
                c.querySelector('.control7').style.display = 'none';
            } else if (uType & 0x00000004) { // MB_YESNO
                c.querySelector('.control1').style.display = 'none';
                c.querySelector('.control2').style.display = 'none';
                c.querySelector('.control6').style.display = 'inline-block';
                c.querySelector('.control7').style.display = 'inline-block';
            } else { // MB_OK
                c.querySelector('.control1').style.display = 'inline-block';
                c.querySelector('.control2').style.display = 'none';
                c.querySelector('.control6').style.display = 'none';
                c.querySelector('.control7').style.display = 'none';
            }

            c.querySelector('.content').innerText = UTF8ToString(lpText);
            setActiveWindow(hWnd);
            showWindow(hWnd, 1);
            centerWindow(c);

            function handleChoice(resVal) {
                destroyWindow(hWnd);
                resolve(resVal);
            }

            c.querySelector('.control1').onclick = (e) => { e.stopPropagation(); handleChoice(1); };
            c.querySelector('.control2').onclick = (e) => { e.stopPropagation(); handleChoice(2); };
            c.querySelector('.control6').onclick = (e) => { e.stopPropagation(); handleChoice(6); };
            c.querySelector('.control7').onclick = (e) => { e.stopPropagation(); handleChoice(7); };
            const closeBtn = c.querySelector('.title-bar-controls button');
            if (closeBtn) closeBtn.onclick = (e) => { e.stopPropagation(); handleChoice(uType & 0x00000004 ? 7 : (uType & 0x00000001 ? 2 : 1)); };
        });
    }

    async function dialogBox(hWnd, dialog, parentWindowId, hInstance) {
        const response = await fetch(`${RESOURCE_BASE}/dialogs/includes/${dialog}.inc.html`);
        let html = await response.text();

        // Fix relative image paths in templates
        html = html.replace(/src="resources\//g, 'src="../resources/');

        const win = createWindow(html, hWnd, CW_USEDEFAULT, CW_USEDEFAULT, CW_SKIPRESIZE, CW_SKIPRESIZE, null, 0, 0, parentWindowId);
        win.classList.add('dlg-' + dialog);
        setActiveWindow(hWnd);
        addMainMenu(win);

        win.querySelectorAll('.dlg_item').forEach(element => {
            const hMenu = Number(element.className.match(/\d+/));
            const dataClass = element.getAttribute('data-class');
            if (hMenu !== -1 && dataClass && typeof _AllocateControl === 'function') {
                const lpClassName = _malloc(128);
                stringToUTF8(dataClass, lpClassName, 128);
                _AllocateControl(hInstance, lpClassName, hWnd, hMenu);
                _free(lpClassName);
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

        // Always activate the top visible remaining window
        const remainingWindows = Array.from(document.querySelectorAll('#screen .window')).filter(w => w.style.display !== 'none');
        console.log('[destroyWindow] remaining windows count:', remainingWindows.length, remainingWindows.map(w => w.id));
        if (remainingWindows.length > 0) {
            const topWin = remainingWindows[remainingWindows.length - 1];
            const match = topWin.id.match(/\d+/);
            if (match) {
                setActiveWindow(Number(match[0]));
            }
        } else {
            _activeWindowHwnd = null;
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
        } else if (!target.className.match(/\d+/) && target.closest('.dlg_item')) {
            target = target.closest('.dlg_item');
        }

        const match = target.className ? target.className.match(/\d+/) : null;

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

    function addDesktopIcon(name, icon, title) {}
    function makeDraggable(element) {}

    // =========================================================================
    // Exports
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
