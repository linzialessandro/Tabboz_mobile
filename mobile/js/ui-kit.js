/**
 * Tabboz Simulator Mobile - DOM / event helpers shared by every screen.
 *
 * Screen transformers should go through this kit instead of repeating
 * innerHTML surgery, Win32 command posting, or style resets.
 */
((TM) => {
    'use strict';

    const WM_COMMAND = TM.WM.COMMAND;

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
            || body.querySelector('button.button_ok')
            || body.querySelector('.button_ok')
            || body.querySelector('.control1');
    }

    function getButtonCancel(body) {
        if (!body) return null;
        return body.querySelector('button.control2')
            || body.querySelector('button.button_cancel')
            || body.querySelector('.button_cancel')
            || body.querySelector('.control2');
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
        button.onclick = (event) => {
            swallow(event);
            postCommand(winHwnd, controlId);
        };
        return button;
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
        stopWaiting,
        getActiveHwnd,
        postCommand,
        swallow,
        attachButtonHandler,
        setButton,
        el,
        miniStat,
        statsBar,
        bottomBar,
        replaceBody,
        bindSelectCard
    };
})(window.TabbozMobile = window.TabbozMobile || {});
