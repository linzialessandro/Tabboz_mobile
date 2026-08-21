/**
 * Tabboz Mobile screen transformers — life (scuola, disco, famiglia, compagnia, tipa)
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

    TM.registerTransformers({
        4: transformDisco,
        5: transformFamiglia,
        6: transformCompagnia,
        9: transformTipa,
        10: transformScuola,
        11: transformScuola,
        91: transformCercaTipa,
        92: transformDueDonne,
        95: transformDueDiPicche,
        110: transformPagella,
        190: transformTipa,
        191: transformCercaTipa,
        192: transformDueDonne,
    });

    TM.registerRanges([
        { min: 93, max: 94, fn: transformDate },
    ]);

})(window.TabbozMobile);
