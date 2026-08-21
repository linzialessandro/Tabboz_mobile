/**
 * Tabboz Mobile screen transformers — jobs (lavoro, quiz, companies, offers)
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

    function transformLavoro(win, hWnd) {
        const body = win.querySelector('.window-body') || win.querySelector('[class*="window-body"]');
        if (!body) return;

        const img = body.querySelector('img.control254') || body.querySelector('canvas');
        const dittaEl = body.querySelector('.control105');
        const soldiEl = body.querySelector('.control104');
        const stipendioEl = body.querySelector('.control106');
        const impegnoEl = body.querySelector('.control107');
        const btnOk = getButtonOk(body) || body.querySelector('button.control1');

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
                bindSelect(optCard, opt.controlId, hWnd, () => {
                    opt.input.checked = !opt.input.checked;
                    optCard.classList.toggle('selected', opt.input.checked);
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
            btn.textContent = '';
            const iconSpan = document.createElement('span');
            iconSpan.className = 'btn-icon';
            iconSpan.textContent = '🏢';
            const textSpan = document.createElement('span');
            textSpan.className = 'btn-text';
            textSpan.textContent = text;
            const chevron = document.createElement('span');
            chevron.className = 'btn-chevron';
            chevron.textContent = '›';
            btn.appendChild(iconSpan);
            btn.appendChild(textSpan);
            btn.appendChild(chevron);
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

    TM.registerTransformers({
        13: transformLavoro,
        210: transformCompanyList,
    });

    TM.registerRanges([
        { min: 200, max: 209, fn: transformJobQuiz },
        { min: 290, max: 297, fn: transformCompanyInfo },
        { min: 390, max: 397, fn: transformJobOffer },
    ]);

})(window.TabbozMobile);
