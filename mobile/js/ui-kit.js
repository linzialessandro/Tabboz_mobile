/**
 * Tabboz Simulator Mobile - DOM / event helpers shared by every screen.
 *
 * Screen transformers should go through this kit instead of repeating
 * innerHTML surgery, Win32 command posting, or style resets.
 */
((TM) => {
    'use strict';

    const WM_COMMAND = TM.WM.COMMAND;
    const BOUND_ATTR = 'data-tm-bound';
    const LABEL_LOCK_ATTR = 'data-tm-label-lock';

    function escapeHtml(value) {
        if (typeof value !== 'string') value = String(value == null ? '' : value);
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function extractControlId(className) {
        if (!className || typeof className !== 'string') return null;
        const named = className.match(/(?:^|\s)control(\d+)(?:\s|$)/);
        if (named) return Number(named[1]);
        return null;
    }

    function queryControl(root, id) {
        if (!root) return null;
        return root.querySelector('.control' + id);
    }

    function getBody(win) {
        if (!win) return null;
        return win.querySelector('.window-body') || win.querySelector('[class*="window-body"]');
    }

    function resetElement(el) {
        if (!el) return el;
        el.style.position = 'static';
        el.style.left = 'auto';
        el.style.top = 'auto';
        el.style.width = 'auto';
        el.style.height = 'auto';
        el.style.margin = '0';
        return el;
    }

    function getButtonOk(body) {
        if (!body) return null;
        return body.querySelector('button.control1')
            || body.querySelector('button.button_ok');
    }

    function getButtonCancel(body) {
        if (!body) return null;
        return body.querySelector('button.control2')
            || body.querySelector('button.button_cancel');
    }

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
                const code = parseInt(hex, 16);
                return Number.isNaN(code) ? match : String.fromCharCode(code);
            });
    }

    function markBound(el) {
        if (el && el.setAttribute) el.setAttribute(BOUND_ATTR, '1');
        return el;
    }

    function isBound(el) {
        return !!(el && el.closest && el.closest('[' + BOUND_ATTR + ']'));
    }

    function lockLabel(el) {
        if (el && el.setAttribute) el.setAttribute(LABEL_LOCK_ATTR, '1');
        return el;
    }

    function isLabelLocked(el) {
        return !!(el && el.getAttribute && el.getAttribute(LABEL_LOCK_ATTR));
    }

    function parseWindowHwnd(el) {
        if (!el || !el.id) return null;
        const match = String(el.id).match(/^win(\d+)$/);
        return match ? Number(match[1]) : null;
    }

    function existingLabelText(control) {
        if (!control) return '';
        const parent = control.parentElement;
        const label = parent && parent.querySelector && parent.querySelector('label');
        const text = label ? label.innerText : '';
        return (text || '').replace(/:$/, '').trim();
    }

    function stopWaiting() {
        if (typeof TM.stopWaiting === 'function') TM.stopWaiting();
    }

    function getActiveHwnd() {
        return typeof TM.getActiveHwnd === 'function' ? TM.getActiveHwnd() : null;
    }

    function postCommand(hWnd, controlId) {
        const targetHwnd = (hWnd !== undefined && hWnd !== null) ? hWnd : getActiveHwnd();
        if (typeof _PostMessage === 'function' && targetHwnd !== null && targetHwnd !== undefined) {
            _PostMessage(targetHwnd, WM_COMMAND, controlId, 0);
        }
        stopWaiting();
    }

    function swallow(event) {
        if (!event) return;
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === 'function') {
            event.stopImmediatePropagation();
        }
    }

    function attachButtonHandler(button, controlId, winHwnd) {
        if (!button) return button;
        markBound(button);
        lockLabel(button);
        button.onclick = (event) => {
            swallow(event);
            postCommand(winHwnd, controlId);
        };
        return button;
    }

    function bindSelect(card, controlId, winHwnd, after) {
        if (!card || controlId === null || controlId === undefined) return card;
        markBound(card);
        card.addEventListener('click', (event) => {
            swallow(event);
            if (typeof after === 'function') after(event);
            postCommand(winHwnd, controlId);
        });
        return card;
    }

    function hideBrokenCoordinates(root) {
        if (!root || !root.querySelectorAll) return;
        root.querySelectorAll('[style]').forEach((el) => {
            const top = parseInt(el.style.top, 10);
            const left = parseInt(el.style.left, 10);
            if ((Number.isFinite(top) && Math.abs(top) > 4000) || (Number.isFinite(left) && Math.abs(left) > 4000)) {
                el.style.display = 'none';
            }
        });
    }

    function installCloseButton(win, hWnd) {
        if (!win) return null;
        let bar = win.querySelector('.title-bar');
        if (!bar) {
            bar = document.createElement('div');
            bar.className = 'title-bar';
            const text = document.createElement('div');
            text.className = 'title-bar-text';
            text.textContent = 'Tabboz Simulator';
            bar.appendChild(text);
            win.insertBefore(bar, win.firstChild);
        }
        let controls = bar.querySelector('.title-bar-controls');
        if (!controls) {
            controls = document.createElement('div');
            controls.className = 'title-bar-controls';
            bar.appendChild(controls);
        }
        let close = controls.querySelector('.control61536, .close-btn');
        if (!close) {
            close = document.createElement('button');
            close.type = 'button';
            close.className = 'control61536 close-btn';
            close.setAttribute('aria-label', 'Close');
            close.textContent = '✕';
            controls.appendChild(close);
        }
        markBound(close);
        close.onclick = (event) => {
            swallow(event);
            postCommand(hWnd, 2);
        };
        return close;
    }

    function isWindowDismissable(win) {
        const body = getBody(win);
        if (!body) return false;
        return !!(body.querySelector('[data-tm-bound]')
            || body.querySelector('button.control1, button.control2, button.button_ok, button.button_cancel'));
    }

    function ensureDismissable(win, hWnd) {
        installCloseButton(win, hWnd);
        if (isWindowDismissable(win)) return;
        const body = getBody(win);
        if (!body) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'dlg_item control2 button_cancel mobile-btn primary';
        btn.setAttribute('data-class', 'BorBtn');
        btn.textContent = '✓ Continua';
        attachButtonHandler(btn, 2, hWnd);
        const bar = document.createElement('div');
        bar.className = 'mobile-bottom-bar';
        bar.appendChild(btn);
        body.appendChild(bar);
    }

    function isCommandSource(el) {
        if (!el || !el.tagName) return false;
        const tag = el.tagName;
        if (tag === 'BUTTON' || tag === 'SELECT') return true;
        if (tag === 'INPUT') return true;
        if (tag === 'IMG' && el.classList && el.classList.contains('dlg_item')) return true;
        const dataClass = el.getAttribute && el.getAttribute('data-class');
        return dataClass === 'BUTTON' || dataClass === 'BorBtn';
    }

    function setButton(button, { id, hWnd, label, className }) {
        if (!button) return null;
        resetElement(button);
        if (className) button.className = className;
        if (label != null) button.textContent = label;
        attachButtonHandler(button, id, hWnd);
        return button;
    }

    function el(tag, attrs, children) {
        const node = document.createElement(tag);
        if (attrs) {
            Object.keys(attrs).forEach((key) => {
                const value = attrs[key];
                if (value == null || value === false) return;
                if (key === 'className') node.className = value;
                else if (key === 'dataset') Object.assign(node.dataset, value);
                else if (key === 'text') node.textContent = value;
                else if (key === 'html') node.innerHTML = value;
                else if (key === 'style' && typeof value === 'object') Object.assign(node.style, value);
                else if (key.slice(0, 2) === 'on' && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
                else node.setAttribute(key, value === true ? '' : String(value));
            });
        }
        (children || []).forEach((child) => {
            if (child == null) return;
            node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
        });
        return node;
    }

    function miniStat(controlEl, { icon, label, className }) {
        if (!controlEl) return null;
        resetElement(controlEl);
        const wrap = el('div', { className: className || 'mini-stat' });
        const caption = el('small');
        caption.textContent = (icon ? icon + ' ' : '') + label;
        wrap.appendChild(caption);
        wrap.appendChild(controlEl);
        return wrap;
    }

    function statsBar(items, className) {
        const bar = el('div', { className: className || 'mobile-stats-bar' });
        (items || []).forEach((item) => {
            if (item) bar.appendChild(item);
        });
        return bar;
    }

    function bottomBar(buttons) {
        const bar = el('div', { className: 'mobile-bottom-bar' });
        (buttons || []).forEach((btn) => {
            if (btn) bar.appendChild(btn);
        });
        return bar;
    }

    function replaceBody(body, container) {
        body.innerHTML = '';
        body.appendChild(container);
        return container;
    }

    function bindSelectCard(card, { listSelector, selectedClass, onSelect }) {
        card.addEventListener('click', (event) => {
            swallow(event);
            const list = card.parentElement;
            if (list && listSelector) {
                list.querySelectorAll(listSelector).forEach((other) => other.classList.remove(selectedClass || 'selected'));
            }
            card.classList.add(selectedClass || 'selected');
            if (typeof onSelect === 'function') onSelect(event);
        });
        return card;
    }

    TM.ui = {
        escapeHtml,
        extractControlId,
        queryControl,
        getBody,
        resetElement,
        getButtonOk,
        getButtonCancel,
        sanitizeItalianText,
        markBound,
        isBound,
        lockLabel,
        isLabelLocked,
        parseWindowHwnd,
        existingLabelText,
        stopWaiting,
        getActiveHwnd,
        postCommand,
        swallow,
        attachButtonHandler,
        bindSelect,
        isCommandSource,
        hideBrokenCoordinates,
        installCloseButton,
        isWindowDismissable,
        ensureDismissable,
        setButton,
        el,
        miniStat,
        statsBar,
        bottomBar,
        replaceBody,
        bindSelectCard
    };
})(window.TabbozMobile = window.TabbozMobile || {});
