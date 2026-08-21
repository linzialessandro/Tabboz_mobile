/**
 * Tabboz Mobile screen transformers — random events / beatdown
 *
 * Keep original .controlN / .dlg_item nodes. Register IDs at the bottom;
 * do not add routing in win32-bridge.js.
 */
((TM) => {
    'use strict';

    const ui = TM.ui;
    const resetElement = ui.resetElement;
    const attachButtonHandler = ui.attachButtonHandler;
    const getButtonOk = ui.getButtonOk;
    const getButtonCancel = ui.getButtonCancel;
    const RESOURCE_BASE = TM.RESOURCE_BASE;
    const WM_COMMAND = TM.WM.COMMAND;
    const stopWaiting = () => ui.stopWaiting();
    const postCommand = ui.postCommand;
    const markBound = ui.markBound;
    const bindSelect = ui.bindSelect;
    const sanitizeItalianText = ui.sanitizeItalianText;

    function transformEventBeatdown(win, hWnd) {
        const body = win.querySelector('.window-body') || win.querySelector('[class*="window-body"]');
        if (!body) return;

        const img = body.querySelector('img.dlg_item') || body.querySelector('canvas') || body.querySelector('img');
        const btnOk = getButtonOk(body) || body.querySelector('button.control1') || body.querySelector('button');

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

    TM.registerTransformers({
        96: transformEventBeatdown,
    });

    TM.registerRanges([
        { min: 100, max: 107, fn: transformEventBeatdown },
    ]);

})(window.TabbozMobile);
