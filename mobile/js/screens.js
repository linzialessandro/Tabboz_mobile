/**
 * Tabboz Simulator Mobile - dialog transformers.
 *
 * Each function keeps the original Win32 controls alive (same class names /
 * control IDs) and rearranges them into a mobile layout. The C engine still
 * owns game state; these functions only change presentation.
 *
 * Register new dialogs in `TM.resolveTransformer` rather than adding
 * another if/else in the Win32 bridge.
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

            card.onclick = (event) => {


                if (event) { event.preventDefault(); event.stopPropagation(); }
                if (radio) {
                    radio.checked = true;
                    const targetHwnd = (hWnd !== undefined && hWnd !== null) ? hWnd : TM.getActiveHwnd();
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
                packCard.onclick = (event) => {

                    if (event) { event.preventDefault(); event.stopPropagation(); }
                    packsGrid.querySelectorAll('.pack-card').forEach(c => c.classList.remove('selected'));
                    packCard.classList.add('selected');
                    const targetHwnd = (hWnd !== undefined && hWnd !== null) ? hWnd : TM.getActiveHwnd();
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
            btn.textContent = '';
            const iconSpan = document.createElement('span');
            iconSpan.className = 'btn-icon';
            iconSpan.textContent = icon;
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
        const velocitaEl = body.querySelector('.control110');
        const cilindrataEl = body.querySelector('.control113');
        const efficienzaEl = body.querySelector('.control115');
        const benzinaEl = body.querySelector('.control107');
        const nomeScooterEl = body.querySelector('.control116');

        const btnConcess = body.querySelector('.control101');
        const btnTrucca = body.querySelector('.control102');
        const btnRipara = body.querySelector('.control103');
        const btnParcheggia = body.querySelector('.control105');
        const btnBenza = body.querySelector('.control106');
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

            card.onclick = (event) => {


                if (event) { event.preventDefault(); event.stopPropagation(); }
                radio.checked = true;
                const targetHwnd = (hWnd !== undefined && hWnd !== null) ? hWnd : TM.getActiveHwnd();
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

            card.onclick = (event) => {


                if (event) { event.preventDefault(); event.stopPropagation(); }
                if (radio) {
                    radio.checked = true;
                    const targetHwnd = (hWnd !== undefined && hWnd !== null) ? hWnd : TM.getActiveHwnd();
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

        const canvas = body.querySelector('canvas') || body.querySelector('.bmptipa') || body.querySelector('img.control251') || body.querySelector('img.dlg_item') || body.querySelector('img');
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
            attachButtonHandler(canvas, 130, hWnd);
            container.appendChild(card);
        }

        const statsBar = document.createElement('div');
        statsBar.className = 'mobile-stats-bar';
        if (nomeEl) { resetElement(nomeEl); const c = document.createElement('div'); c.className = 'mini-stat'; c.innerHTML = '<small>💋 Nome</small>'; c.appendChild(nomeEl); statsBar.appendChild(c); }
        if (affinitaEl) { resetElement(affinitaEl); const c = document.createElement('div'); c.className = 'mini-stat'; c.innerHTML = '<small>❤️ Affinità</small>'; c.appendChild(affinitaEl); statsBar.appendChild(c); }
        if (figoEl) { resetElement(figoEl); const c = document.createElement('div'); c.className = 'mini-stat'; c.innerHTML = '<small>⭐ Figosità</small>'; c.appendChild(figoEl); statsBar.appendChild(c); }
        if (myFigoEl) { resetElement(myFigoEl); const c = document.createElement('div'); c.className = 'mini-stat'; c.innerHTML = '<small>👑 Fama</small>'; c.appendChild(myFigoEl); statsBar.appendChild(c); }
        container.appendChild(statsBar);

        const actionsList = document.createElement('div');
        actionsList.className = 'tipa-actions-list';
        if (btnEsci) { resetElement(btnEsci); btnEsci.className = 'dlg_item control113 mobile-btn primary'; btnEsci.innerHTML = '🥂 Esci insieme'; attachButtonHandler(btnEsci, 113, hWnd); actionsList.appendChild(btnEsci); }
        if (btnChiama) { resetElement(btnChiama); btnChiama.className = 'dlg_item control112 mobile-btn primary'; btnChiama.innerHTML = '📞 Telefona'; attachButtonHandler(btnChiama, 112, hWnd); actionsList.appendChild(btnChiama); }
        if (btnCerca) { resetElement(btnCerca); btnCerca.className = 'dlg_item control110 mobile-btn primary'; btnCerca.innerHTML = '🔍 Cerca nuova tipa/o'; attachButtonHandler(btnCerca, 110, hWnd); actionsList.appendChild(btnCerca); }
        if (btnLascia) { resetElement(btnLascia); btnLascia.className = 'dlg_item control111 mobile-btn danger'; btnLascia.innerHTML = '💔 Lascia tipa/o'; attachButtonHandler(btnLascia, 111, hWnd); actionsList.appendChild(btnLascia); }
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

            workoutCard.style.cursor = 'pointer';
            workoutCard.addEventListener('click', (e) => {
                if (e.target !== btnWorkout) {
                    btnWorkout.click();
                }
            });

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

        // 1 Mese (Control 115)
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

            card.addEventListener('click', (e) => {
                if (e.target !== btnMese) {
                    btnMese.click();
                }
            });

            abbGrid.appendChild(card);
        }

        // 6 Mesi (Control 116)
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

            card.addEventListener('click', (e) => {
                if (e.target !== btnSeiMesi) {
                    btnSeiMesi.click();
                }
            });

            abbGrid.appendChild(card);
        }

        // 1 Anno (Control 117)
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

            card.addEventListener('click', (e) => {
                if (e.target !== btnAnno) {
                    btnAnno.click();
                }
            });

            abbGrid.appendChild(card);
        }

        abbSection.appendChild(abbGrid);
        container.appendChild(abbSection);

        // 5. Lampada UVA Section (Control 111)
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
            lampCard.style.cursor = 'pointer';

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

            lampCard.addEventListener('click', (e) => {
                if (e.target !== btnLampada) {
                    btnLampada.click();
                }
            });

            lampSection.appendChild(lampCard);
            container.appendChild(lampSection);
        }

        // 6. Bottom Navigation Bar (Control 1)
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
                    const targetHwnd = (hWnd !== undefined && hWnd !== null) ? hWnd : TM.getActiveHwnd();
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

        const img = body.querySelector('img.control210') || body.querySelector('img.control211') || body.querySelector('img.dlg_item') || body.querySelector('canvas') || body.querySelector('img');
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
        const buttons = Array.from(body.querySelectorAll('button.dlg_item, button'));

        const container = document.createElement('div');
        container.className = 'mobile-screen-container mobile-due-donne-view';

        const headerCard = document.createElement('div');
        headerCard.className = 'due-donne-header-card';
        headerCard.innerHTML = `<div class="due-donne-badge">⚡ DILEMMA AMOROSO</div>`;
        container.appendChild(headerCard);

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
                btn.className = 'dlg_item mobile-btn';
                if (controlId === 101) {
                    btn.className += ' control101 danger';
                    btn.innerHTML = '🔥 Le voglio tutte e due !';
                } else if (controlId === 102) {
                    btn.className += ' control102 primary';
                } else if (controlId === 2) {
                    btn.className += ' control2 secondary';
                } else {
                    btn.className += ' primary';
                }
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

        const img = body.querySelector('img.control201') || body.querySelector('img.dlg_item') || body.querySelector('img');
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
            attachButtonHandler(img, 201, hWnd);
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

        const soldiEl = body.querySelector('.control104');
        const telEl = body.querySelector('.control120');
        const abbEl = body.querySelector('.control121');
        const creditoEl = body.querySelector('.control122');

        const btnCompra = body.querySelector('.control110');
        const btnVendi = body.querySelector('.control111');
        const btnRicarica = body.querySelector('.control112');
        const btnOk = getButtonOk(body) || body.querySelector('.control1');

        const container = document.createElement('div');
        container.className = 'mobile-screen-container mobile-phone-view';

        // Stats Bar (Soldi)
        if (soldiEl) {
            resetElement(soldiEl);
            const statsBar = document.createElement('div');
            statsBar.className = 'mobile-stats-bar';
            const c = document.createElement('div');
            c.className = 'mini-stat stat-soldi';
            c.innerHTML = '<small>💰 Soldi a disposizione</small>';
            c.appendChild(soldiEl);
            statsBar.appendChild(c);
            container.appendChild(statsBar);
        }

        // Phone Status Card
        const statusCard = document.createElement('div');
        statusCard.className = 'phone-status-card';

        const headerDiv = document.createElement('div');
        headerDiv.className = 'phone-status-header';
        headerDiv.innerHTML = `
            <img src="${RESOURCE_BASE}/icons/ZTELEFONO.gif" class="phone-status-icon" width="36" height="36" />
            <div class="phone-status-title-group">
                <div class="phone-status-title">NEGOZIO TELEFONIA</div>
                <div class="phone-status-subtitle">Stato del tuo cellulare e abbonamento</div>
            </div>
        `;
        statusCard.appendChild(headerDiv);

        const rowsGroup = document.createElement('div');
        rowsGroup.className = 'phone-status-rows';

        // Row 1: Modello Telefono
        const row1 = document.createElement('div');
        row1.className = 'phone-status-row';
        row1.innerHTML = `<span class="phone-status-label">📱 Telefono:</span>`;
        if (telEl) {
            resetElement(telEl);
            telEl.className = 'dlg_item control120 phone-status-val';
            row1.appendChild(telEl);
        } else {
            const fallback = document.createElement('span');
            fallback.className = 'phone-status-val empty';
            fallback.innerText = 'Nessuno';
            row1.appendChild(fallback);
        }
        rowsGroup.appendChild(row1);

        // Row 2: Abbonamento / Operatore
        const row2 = document.createElement('div');
        row2.className = 'phone-status-row';
        row2.innerHTML = `<span class="phone-status-label">📶 Operatore / SIM:</span>`;
        if (abbEl) {
            resetElement(abbEl);
            abbEl.className = 'dlg_item control121 phone-status-val';
            row2.appendChild(abbEl);
        } else {
            const fallback = document.createElement('span');
            fallback.className = 'phone-status-val empty';
            fallback.innerText = 'Nessuna SIM';
            row2.appendChild(fallback);
        }
        rowsGroup.appendChild(row2);

        // Row 3: Credito Residuo
        const row3 = document.createElement('div');
        row3.className = 'phone-status-row';
        row3.innerHTML = `<span class="phone-status-label">💳 Credito Residuo:</span>`;
        if (creditoEl) {
            resetElement(creditoEl);
            creditoEl.className = 'dlg_item control122 phone-status-val';
            row3.appendChild(creditoEl);
        } else {
            const fallback = document.createElement('span');
            fallback.className = 'phone-status-val empty';
            fallback.innerText = '0 L.';
            row3.appendChild(fallback);
        }
        rowsGroup.appendChild(row3);

        statusCard.appendChild(rowsGroup);
        container.appendChild(statusCard);

        // Action Buttons List
        const actionsList = document.createElement('div');
        actionsList.className = 'phone-actions-list';

        if (btnCompra) {
            resetElement(btnCompra);
            btnCompra.className = 'dlg_item control110 mobile-btn primary phone-action-btn';
            btnCompra.innerHTML = '🛒 Compra nuovo telefonino';
            attachButtonHandler(btnCompra, 110, hWnd);
            actionsList.appendChild(btnCompra);
        }

        if (btnRicarica) {
            resetElement(btnRicarica);
            btnRicarica.className = 'dlg_item control112 mobile-btn primary phone-action-btn';
            btnRicarica.innerHTML = '💳 Ricariche & Nuove SIM';
            attachButtonHandler(btnRicarica, 112, hWnd);
            actionsList.appendChild(btnRicarica);
        }

        if (btnVendi) {
            resetElement(btnVendi);
            btnVendi.className = 'dlg_item control111 mobile-btn secondary phone-action-btn';
            btnVendi.innerHTML = '💰 Vendi telefonino usato';
            attachButtonHandler(btnVendi, 111, hWnd);
            actionsList.appendChild(btnVendi);
        }

        container.appendChild(actionsList);

        // Bottom Bar
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

    function transformCompraCellulare(win, hWnd) {
        const body = win.querySelector('.window-body') || win.querySelector('[class*="window-body"]');
        if (!body) return;

        const soldiEl = body.querySelector('.control104');
        const btnOk = getButtonOk(body) || body.querySelector('.control1');
        const btnCancel = getButtonCancel(body) || body.querySelector('.control2');

        const container = document.createElement('div');
        container.className = 'mobile-screen-container mobile-compra-cell-view';

        // Stats Bar (Soldi)
        if (soldiEl) {
            resetElement(soldiEl);
            const statsBar = document.createElement('div');
            statsBar.className = 'mobile-stats-bar';
            const c = document.createElement('div');
            c.className = 'mini-stat stat-soldi';
            c.innerHTML = '<small>💰 Soldi a disposizione</small>';
            c.appendChild(soldiEl);
            statsBar.appendChild(c);
            container.appendChild(statsBar);
        }

        const headerCard = document.createElement('div');
        headerCard.className = 'phone-shop-header-card';
        headerCard.innerHTML = `
            <div class="phone-shop-title">📱 CATALOGO TELEFONI CELLULARI</div>
            <div class="phone-shop-subtitle">Scegli il tuo modello preferito e premi Acquista</div>
        `;
        container.appendChild(headerCard);

        const phoneProducts = [
            {
                id: 0,
                cmd: 110,
                name: 'Motorolo d170',
                fama: '+2 Fama',
                imgSrc: `${RESOURCE_BASE}/bitmaps/1452.png`,
                priceCtrlId: 120,
                desc: 'Libertà, versatilità e sicurezza di comunicazione a prezzo giusto. Il cellulare GSM per iniziare alla grande.'
            },
            {
                id: 1,
                cmd: 111,
                name: 'Motorolo 8700',
                fama: '+7 Fama',
                imgSrc: `${RESOURCE_BASE}/bitmaps/1451.png`,
                priceCtrlId: 121,
                desc: 'Stile classico e inconfondibile con prestazioni di altissimo livello. Autonomia sorprendente e tempo di standby eccezionale.'
            },
            {
                id: 2,
                cmd: 112,
                name: 'Macro TAC 8900',
                fama: '+10 Fama',
                imgSrc: `${RESOURCE_BASE}/bitmaps/1450.png`,
                priceCtrlId: 122,
                desc: 'DUAL BAND 900/1800 - Il primo cellulare in commercio in grado di passare automaticamente tra bande di frequenza GSM.'
            }
        ];

        const productsList = document.createElement('div');
        productsList.className = 'phone-products-list';

        phoneProducts.forEach((item, index) => {
            const radio = body.querySelector(`.control${item.cmd}`) || document.createElement('input');
            const priceEl = body.querySelector(`.control${item.priceCtrlId}`);

            resetElement(radio);
            radio.type = 'radio';
            radio.name = 'bor_radio121';
            radio.className = `dlg_item control${item.cmd}`;
            if (index === 0) radio.checked = true;

            const card = document.createElement('div');
            card.className = `phone-product-card ${index === 0 ? 'selected' : ''}`;

            const topRow = document.createElement('div');
            topRow.className = 'phone-product-top-row';

            const radioLabel = document.createElement('label');
            radioLabel.className = 'phone-product-radio-label';
            radioLabel.appendChild(radio);

            const nameSpan = document.createElement('span');
            nameSpan.className = 'phone-product-name';
            nameSpan.innerText = item.name;
            radioLabel.appendChild(nameSpan);

            topRow.appendChild(radioLabel);

            const famaBadge = document.createElement('span');
            famaBadge.className = 'phone-fama-badge';
            famaBadge.innerText = item.fama;
            topRow.appendChild(famaBadge);

            card.appendChild(topRow);

            const middleRow = document.createElement('div');
            middleRow.className = 'phone-product-middle-row';

            const img = document.createElement('img');
            img.className = 'phone-product-img';
            img.src = item.imgSrc;
            img.alt = item.name;
            middleRow.appendChild(img);

            const infoCol = document.createElement('div');
            infoCol.className = 'phone-product-info-col';

            const priceBox = document.createElement('div');
            priceBox.className = 'phone-product-price-box';
            priceBox.innerHTML = '<span class="price-label">Prezzo:</span>';
            if (priceEl) {
                resetElement(priceEl);
                priceEl.className = `dlg_item control${item.priceCtrlId} phone-product-price-val`;
                priceBox.appendChild(priceEl);
            }
            infoCol.appendChild(priceBox);

            const descP = document.createElement('p');
            descP.className = 'phone-product-desc';
            descP.innerText = item.desc;
            infoCol.appendChild(descP);

            middleRow.appendChild(infoCol);
            card.appendChild(middleRow);

            // Whole card selection interaction
            card.onclick = (event) => {

                if (event) { event.preventDefault(); event.stopPropagation(); }
                productsList.querySelectorAll('.phone-product-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                radio.checked = true;
                if (typeof _PostMessage === 'function') {
                    _PostMessage(hWnd, WM_COMMAND, item.cmd, 0);
                }
                stopWaiting();
            };

            radio.onchange = () => {
                productsList.querySelectorAll('.phone-product-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                if (typeof _PostMessage === 'function') {
                    _PostMessage(hWnd, WM_COMMAND, item.cmd, 0);
                }
                stopWaiting();
            };

            productsList.appendChild(card);
        });

        container.appendChild(productsList);

        // Actions Bottom Bar
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
            btnOk.innerHTML = '🛒 Acquista Telefono';
            attachButtonHandler(btnOk, 1, hWnd);
            actionsBar.appendChild(btnOk);
        }
        container.appendChild(actionsBar);

        body.innerHTML = '';
        body.appendChild(container);
    }

    function transformRicaricaCellulare(win, hWnd) {
        const body = win.querySelector('.window-body') || win.querySelector('[class*="window-body"]');
        if (!body) return;

        const soldiEl = body.querySelector('.control104');
        const simAttivaEl = body.querySelector('.control105');
        const btnOk = getButtonOk(body) || body.querySelector('.control1');
        const btnCancel = getButtonCancel(body) || body.querySelector('.control2');

        const container = document.createElement('div');
        container.className = 'mobile-screen-container mobile-ricarica-cell-view';

        // Stats Bar (Soldi & SIM Attiva)
        const statsBar = document.createElement('div');
        statsBar.className = 'mobile-stats-bar';
        if (soldiEl) {
            resetElement(soldiEl);
            const c = document.createElement('div');
            c.className = 'mini-stat stat-soldi';
            c.innerHTML = '<small>💰 Soldi</small>';
            c.appendChild(soldiEl);
            statsBar.appendChild(c);
        }
        if (simAttivaEl) {
            resetElement(simAttivaEl);
            const c = document.createElement('div');
            c.className = 'mini-stat';
            c.innerHTML = '<small>📶 SIM Attiva</small>';
            c.appendChild(simAttivaEl);
            statsBar.appendChild(c);
        }
        container.appendChild(statsBar);

        const headerCard = document.createElement('div');
        headerCard.className = 'phone-shop-header-card';
        headerCard.innerHTML = `
            <div class="phone-shop-title">💳 ATTIVAZIONI SIM & RICARICHE</div>
            <div class="phone-shop-subtitle">Seleziona un'opzione e premi Conferma</div>
        `;
        container.appendChild(headerCard);

        const operators = [
            {
                key: 'onmitel',
                name: 'Onmitel Pronto Italia',
                logo: `${RESOURCE_BASE}/bitmaps/1470.png`,
                color: '#e11d48',
                bgColor: '#fff1f2',
                sim: {
                    cmd: 110,
                    title: 'Attivazione Nuova SIM',
                    price: '50.000 L.',
                    bonus: '100.000 L. credito iniziale'
                },
                recharges: [
                    { cmd: 113, title: 'Ricarica 50.000 L.', bonus: '+60.000 L. Credito' },
                    { cmd: 114, title: 'Ricarica 100.000 L.', bonus: '+110.000 L. Credito' }
                ]
            },
            {
                key: 'dim',
                name: 'Delecom Italia Mobile (DIM)',
                logo: `${RESOURCE_BASE}/bitmaps/1471.png`,
                color: '#0284c7',
                bgColor: '#f0f9ff',
                sim: {
                    cmd: 111,
                    title: 'Attivazione Nuova SIM',
                    price: '50.000 L.',
                    bonus: '100.000 L. credito iniziale'
                },
                recharges: [
                    { cmd: 115, title: 'Ricarica 50.000 L.', bonus: '+60.000 L. Credito' },
                    { cmd: 116, title: 'Ricarica 100.000 L.', bonus: '+110.000 L. Credito' }
                ]
            },
            {
                key: 'vind',
                name: 'Vind Mobile',
                logo: `${RESOURCE_BASE}/bitmaps/1472.png`,
                color: '#ea580c',
                bgColor: '#fff7ed',
                sim: {
                    cmd: 112,
                    title: 'Attivazione Nuova SIM',
                    price: '100.000 L.',
                    bonus: '100.000 L. credito iniziale'
                },
                recharges: [
                    { cmd: 117, title: 'Ricarica 50.000 L.', bonus: '+50.000 L. Credito' },
                    { cmd: 118, title: 'Ricarica 100.000 L.', bonus: '+100.000 L. Credito' }
                ]
            }
        ];

        const operatorsContainer = document.createElement('div');
        operatorsContainer.className = 'operators-container';

        function deselectAllOptions() {
            operatorsContainer.querySelectorAll('.operator-option-row').forEach(r => r.classList.remove('selected'));
        }

        operators.forEach((op, opIndex) => {
            const card = document.createElement('div');
            card.className = 'operator-card';
            card.style.borderLeft = `5px solid ${op.color}`;

            const opHeader = document.createElement('div');
            opHeader.className = 'operator-header';
            opHeader.innerHTML = `
                <img src="${op.logo}" class="operator-logo" alt="${op.name}" />
                <span class="operator-name" style="color: ${op.color}">${op.name}</span>
            `;
            card.appendChild(opHeader);

            const optionsGroup = document.createElement('div');
            optionsGroup.className = 'operator-options-group';

            // Option: SIM
            const simRadio = body.querySelector(`.control${op.sim.cmd}`) || document.createElement('input');
            resetElement(simRadio);
            simRadio.type = 'radio';
            simRadio.name = 'bor_radio123';
            simRadio.className = `dlg_item control${op.sim.cmd}`;
            if (opIndex === 0) simRadio.checked = true;

            const simRow = document.createElement('div');
            simRow.className = `operator-option-row sim-row ${opIndex === 0 ? 'selected' : ''}`;
            simRow.innerHTML = `
                <div class="option-left">
                    <div class="option-title">⭐ ${op.sim.title}</div>
                    <div class="option-bonus">${op.sim.bonus}</div>
                </div>
                <div class="option-price">${op.sim.price}</div>
            `;
            simRow.prepend(simRadio);

            simRow.onclick = (event) => {


                if (event) { event.preventDefault(); event.stopPropagation(); }
                deselectAllOptions();
                simRow.classList.add('selected');
                simRadio.checked = true;
                if (typeof _PostMessage === 'function') {
                    _PostMessage(hWnd, WM_COMMAND, op.sim.cmd, 0);
                }
                stopWaiting();
            };
            optionsGroup.appendChild(simRow);

            // Options: Recharges
            op.recharges.forEach(rec => {
                const recRadio = body.querySelector(`.control${rec.cmd}`) || document.createElement('input');
                resetElement(recRadio);
                recRadio.type = 'radio';
                recRadio.name = 'bor_radio123';
                recRadio.className = `dlg_item control${rec.cmd}`;

                const recRow = document.createElement('div');
                recRow.className = 'operator-option-row recharge-row';
                recRow.innerHTML = `
                    <div class="option-left">
                        <div class="option-title">⚡ ${rec.title}</div>
                        <div class="option-bonus">${rec.bonus}</div>
                    </div>
                `;
                recRow.prepend(recRadio);

                recRow.onclick = (event) => {


                    if (event) { event.preventDefault(); event.stopPropagation(); }
                    deselectAllOptions();
                    recRow.classList.add('selected');
                    recRadio.checked = true;
                    if (typeof _PostMessage === 'function') {
                        _PostMessage(hWnd, WM_COMMAND, rec.cmd, 0);
                    }
                    stopWaiting();
                };
                optionsGroup.appendChild(recRow);
            });

            card.appendChild(optionsGroup);
            operatorsContainer.appendChild(card);
        });

        container.appendChild(operatorsContainer);

        // Bottom Action Bar
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
            btnOk.innerHTML = '✓ Conferma Acquisto';
            attachButtonHandler(btnOk, 1, hWnd);
            actionsBar.appendChild(btnOk);
        }
        container.appendChild(actionsBar);

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

            card.onclick = (event) => {


                if (event) { event.preventDefault(); event.stopPropagation(); }
                radio.checked = true;
                modelsGrid.querySelectorAll('.scooter-model-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                const match = radio.className.match(/\d+/);
                const targetHwnd = (hWnd !== undefined && hWnd !== null) ? hWnd : TM.getActiveHwnd();
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


    const exact = {
        1: transformDashboard,
        2: transformAbout,
        4: transformDisco,
        5: transformFamiglia,
        6: transformCompagnia,
        7: transformScooter,
        8: transformNegoziMenu,
        9: transformTipa,
        10: transformScuola,
        11: transformScuola,
        12: transformSplash,
        13: transformLavoro,
        16: transformExitSession,
        73: transformTruccaScooter,
        88: transformTabacchi,
        89: transformPalestra,
        91: transformCercaTipa,
        92: transformDueDonne,
        95: transformDueDiPicche,
        96: transformEventBeatdown,
        110: transformPagella,
        120: transformCellulare,
        121: transformCompraCellulare,
        123: transformRicaricaCellulare,
        190: transformTipa,
        191: transformCercaTipa,
        192: transformDueDonne,
        210: transformCompanyList
    };

    const ranges = [
        { min: 70, max: 72, fn: transformScooterShop },
        { min: 74, max: 79, fn: transformScooterShowroom },
        { min: 80, max: 86, fn: transformShop },
        { min: 93, max: 94, fn: transformDate },
        { min: 100, max: 107, fn: transformEventBeatdown },
        { min: 200, max: 209, fn: transformJobQuiz },
        { min: 290, max: 297, fn: transformCompanyInfo },
        { min: 390, max: 397, fn: transformJobOffer }
    ];

    TM.resolveTransformer = function resolveTransformer(dialogNum) {
        const exactFn = exact[dialogNum];
        if (exactFn) return exactFn;
        for (let i = 0; i < ranges.length; i++) {
            const range = ranges[i];
            if (dialogNum >= range.min && dialogNum <= range.max) return range.fn;
        }
        return transformGeneric;
    };

    TM.transformDialog = function transformDialog(win, hWnd, dialogNum) {
        const fn = TM.resolveTransformer(dialogNum);
        fn(win, hWnd);
    };
})(window.TabbozMobile);
