/**
 * Tabboz Mobile screen transformers — home (dashboard, about, splash, exit)
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
            const targetHwnd = (hWnd !== undefined && hWnd !== null) ? hWnd : TM.getActiveHwnd();
            if (typeof _PostMessage === 'function' && targetHwnd !== null && targetHwnd !== undefined) {
                _PostMessage(targetHwnd, WM_COMMAND, 202, 0);
            }
            stopWaiting();
        });
        container.appendChild(startBtn);

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

            const targetHwnd = (hWnd !== undefined && hWnd !== null) ? hWnd : TM.getActiveHwnd();
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

    function transformGeneric(win, hWnd) {
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

        // Automatically wire all buttons with attachButtonHandler
        body.querySelectorAll('button, .button_ok, .button_cancel, .dlg_item[data-class="BUTTON"], .dlg_item[data-class="BorBtn"]').forEach(btn => {
            const m = btn.className.match(/control(\d+)/) || btn.className.match(/\d+/);
            const controlId = m ? Number(m[1] || m[0]) : null;
            if (controlId !== null) {
                if (!btn.classList.contains('mobile-btn')) {
                    btn.classList.add('mobile-btn');
                    if (controlId === 1 || btn.classList.contains('button_ok')) {
                        btn.classList.add('primary');
                    } else if (controlId === 2 || btn.classList.contains('button_cancel')) {
                        btn.classList.add('secondary');
                    } else {
                        btn.classList.add('primary');
                    }
                }
                attachButtonHandler(btn, controlId, hWnd);
            }
        });
    }

    TM.registerTransformers({
        1: transformDashboard,
        2: transformAbout,
        12: transformSplash,
        16: transformExitSession,
    });

    TM.setGenericTransformer(transformGeneric);

})(window.TabbozMobile);
