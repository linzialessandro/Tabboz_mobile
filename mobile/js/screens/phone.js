/**
 * Tabboz Mobile screen transformers — phone store (dialogs 120, 121, 123)
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

    TM.registerTransformers({
        120: transformCellulare,
        121: transformCompraCellulare,
        123: transformRicaricaCellulare,
    });

})(window.TabbozMobile);
