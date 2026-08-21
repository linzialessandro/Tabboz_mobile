/**
 * Tabboz Mobile screen transformers — shops (negozi, boutiques, tabacchi, palestra, scooter)
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

    TM.registerTransformers({
        7: transformScooter,
        8: transformNegoziMenu,
        73: transformTruccaScooter,
        88: transformTabacchi,
        89: transformPalestra,
    });

    TM.registerRanges([
        { min: 70, max: 72, fn: transformScooterShop },
        { min: 74, max: 79, fn: transformScooterShowroom },
        { min: 80, max: 86, fn: transformShop },
    ]);

})(window.TabbozMobile);
