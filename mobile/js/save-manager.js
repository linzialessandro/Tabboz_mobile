/**
 * Tabboz Simulator Mobile - Save Manager
 * Copyright (c) 1997-2001 Andrea Bonomi, Emanuele Caccialanza
 * Distributed under the terms of the GNU General Public License v3.0.
 *
 * Manages local save slots, export/import (.tabboz JSON), and game reset.
 * Import is restricted to the Tabboz registry key prefix so a crafted file
 * cannot overwrite arbitrary localStorage keys.
 */
((TM) => {
    'use strict';

    const SAVE = (TM && TM.SAVE) || {
        REG_PREFIX: 'HKEY_CURRENT_USER\\Software\\Obscured Truckware\\Tabboz Simulator 32',
        SLOTS_KEY: 'tabboz_mobile_slots_meta',
        SLOT_PREFIX: 'tabboz_slot_',
        MAX_SLOTS: 3,
        MAX_BYTES: 256 * 1024,
        MAX_KEYS: 200,
        MAX_VALUE_LENGTH: 8192
    };

    const REG_PREFIX = SAVE.REG_PREFIX;
    const SLOTS_KEY = SAVE.SLOTS_KEY;
    const SLOT_PREFIX = SAVE.SLOT_PREFIX;
    const MAX_SLOTS = SAVE.MAX_SLOTS;
    const MAX_BYTES = SAVE.MAX_BYTES;
    const MAX_KEYS = SAVE.MAX_KEYS;
    const MAX_VALUE_LENGTH = SAVE.MAX_VALUE_LENGTH;

    const FORBIDDEN_KEYS = {
        __proto__: true,
        prototype: true,
        constructor: true
    };

    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') unsafe = String(unsafe || '');
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function isAllowedRegistryKey(key) {
        return typeof key === 'string'
            && key.indexOf(REG_PREFIX) === 0
            && key.indexOf('\0') === -1
            && !FORBIDDEN_KEYS[key]
            && key !== SLOTS_KEY
            && key.indexOf(SLOT_PREFIX) !== 0;
    }

    function jsonReviver(key, value) {
        if (FORBIDDEN_KEYS[key]) return undefined;
        return value;
    }

    function validateSaveData(data) {
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            return 'Formato di salvataggio non valido.';
        }
        if (!data.registry || typeof data.registry !== 'object' || Array.isArray(data.registry)) {
            return 'Formato di salvataggio non valido.';
        }
        const keys = Object.keys(data.registry);
        if (keys.length === 0) return 'Il file di salvataggio non contiene dati di gioco.';
        if (keys.length > MAX_KEYS) return 'Il file di salvataggio contiene troppe chiavi.';
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (!isAllowedRegistryKey(key)) {
                return 'Il file di salvataggio contiene chiavi non consentite.';
            }
            const value = data.registry[key];
            if (typeof value !== 'string') {
                return 'Il file di salvataggio contiene valori non validi.';
            }
            if (value.length > MAX_VALUE_LENGTH) {
                return 'Il file di salvataggio contiene valori troppo grandi.';
            }
        }
        return null;
    }

    function parseSaveJson(text) {
        if (typeof text !== 'string') throw new Error('Formato di salvataggio non valido.');
        if (text.length > MAX_BYTES) throw new Error('File di salvataggio troppo grande.');
        let data;
        try {
            data = JSON.parse(text, jsonReviver);
        } catch (e) {
            throw new Error('File di salvataggio non valido o corrotto.');
        }
        const error = validateSaveData(data);
        if (error) throw new Error(error);
        return data;
    }

    function safeSetItem(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (e) {
            if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                window.alert('Spazio di archiviazione esaurito! Impossibile salvare.');
            } else {
                console.error('Errore durante il salvataggio:', e);
            }
            return false;
        }
    }

    function getRegistryValue(subKey) {
        const fullKey = subKey ? `${REG_PREFIX}\\${subKey}` : REG_PREFIX;
        const item = localStorage.getItem(fullKey);
        if (!item) return null;
        try {
            const parsed = JSON.parse(item);
            return parsed[''] !== undefined ? parsed[''] : parsed.value;
        } catch (e) {
            return item;
        }
    }

    function collectRegistry() {
        const state = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (isAllowedRegistryKey(key)) {
                state[key] = localStorage.getItem(key);
            }
        }
        return state;
    }

    function clearRegistry() {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (isAllowedRegistryKey(key)) keysToRemove.push(key);
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
    }

    /**
     * Registry Soldi is in thousands of lire (10 → "10000 L."), matching MostraSoldi.
     * A missing value must not become "0000 L." / "Tabbozzo".
     */
    function formatLire(raw) {
        if (raw === null || raw === undefined || raw === '') return null;
        const n = Number(raw);
        if (!Number.isFinite(n)) return String(raw) + ' L.';
        if (n === 0) return '0 L.';
        return String(n) + '000 L.';
    }

    function getCurrentGameState() {
        const state = collectRegistry();
        const nome = getRegistryValue('Nome');
        const cognome = getRegistryValue('Cognome') || '';
        const registered = !!nome;
        const soldi = formatLire(getRegistryValue('Soldi'));
        const figosita = getRegistryValue('Fama');
        const reputazione = getRegistryValue('Reputazione');
        const giorno = getRegistryValue('Giorno');
        const mese = getRegistryValue('Mese');
        const sizze = getRegistryValue('Sigarette');
        const tipa = getRegistryValue('Nometipa');

        return {
            meta: {
                name: registered ? `${nome} ${cognome}`.trim() : 'Partita non registrata',
                soldi: soldi || '—',
                figosita: registered ? `${figosita || '0'}/100` : '—',
                reputazione: registered ? `${reputazione || '0'}/100` : '—',
                date: (giorno && mese) ? `${giorno}/${mese}` : '—',
                sizze: sizze || '0',
                tipa: tipa || 'Nessuna',
                timestamp: new Date().toISOString()
            },
            registry: state
        };
    }

    function registryHasGame() {
        return Object.keys(collectRegistry()).length > 0 && !!getRegistryValue('Nome');
    }

    /**
     * The WASM engine writes localStorage only inside SalvaTutto (events, exit,
     * configuration OK). Until then the live game is Tizio Caio / 10000 L. while
     * the save panel used to invent Tabbozzo / 0000 L. and store an empty slot.
     * Dialog 14 OK calls SalvaTutto and does not read the skill radios back.
     */
    let _flushing = null;

    function canFlushEngine() {
        if (typeof document === 'undefined' || !TM.ui || typeof TM.ui.postCommand !== 'function') return false;
        const wins = Array.from(document.querySelectorAll('.window[id^="win"]')).filter((w) => {
            return !w.classList.contains('messagebox')
                && !w.classList.contains('tm-silent')
                && w.style.display !== 'none';
        });
        return wins.length === 1 && wins[0].classList.contains('dlg-1');
    }

    function flushEngineSave() {
        if (typeof document === 'undefined') return Promise.resolve(false);
        if (_flushing) return _flushing;
        if (!canFlushEngine()) return Promise.resolve(registryHasGame());

        _flushing = new Promise((resolve) => {
            const dash = document.querySelector('.window.dlg-1');
            const hwnd = TM.ui.parseWindowHwnd(dash);
            if (hwnd === null) {
                _flushing = null;
                resolve(false);
                return;
            }
            TM._silentDialog = 14;
            let opened = false;
            const started = Date.now();
            TM.ui.postCommand(hwnd, 140);

            const timer = window.setInterval(() => {
                const dlg = document.querySelector('.window.dlg-14');
                if (dlg) opened = true;
                if (opened && !document.querySelector('.window.dlg-14')) {
                    finish(registryHasGame());
                    return;
                }
                if (Date.now() - started > 1600) {
                    if (dlg) dlg.classList.remove('tm-silent');
                    finish(registryHasGame());
                }
            }, 40);

            function finish(ok) {
                window.clearInterval(timer);
                TM._silentDialog = 0;
                _flushing = null;
                resolve(ok);
            }
        });
        return _flushing;
    }

    function restoreGameState(saveData) {
        const error = validateSaveData(saveData);
        if (error) throw new Error(error);
        clearRegistry();
        Object.keys(saveData.registry).forEach((key) => {
            if (isAllowedRegistryKey(key)) {
                safeSetItem(key, saveData.registry[key]);
            }
        });
    }

    function getSlotsMetadata() {
        try {
            const parsed = JSON.parse(localStorage.getItem(SLOTS_KEY) || '{}', jsonReviver);
            return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
        } catch (e) {
            return {};
        }
    }

    function slotKey(slotIndex) {
        return SLOT_PREFIX + slotIndex;
    }

    function assertSlot(slotIndex) {
        const index = Number(slotIndex);
        if (!Number.isInteger(index) || index < 1 || index > MAX_SLOTS) {
            throw new Error('Slot di salvataggio non valido.');
        }
        return index;
    }

    function saveToSlot(slotIndex) {
        const index = assertSlot(slotIndex);
        const state = getCurrentGameState();
        if (!registryHasGame()) {
            window.alert('La partita non è ancora registrata. Torna alla schermata principale e riprova.');
            return null;
        }
        if (!safeSetItem(slotKey(index), JSON.stringify(state))) return null;
        const meta = getSlotsMetadata();
        meta[index] = state.meta;
        safeSetItem(SLOTS_KEY, JSON.stringify(meta));
        return state.meta;
    }

    function loadFromSlot(slotIndex) {
        const index = assertSlot(slotIndex);
        const raw = localStorage.getItem(slotKey(index));
        if (!raw) throw new Error('Slot di salvataggio vuoto.');
        restoreGameState(parseSaveJson(raw));
        window.location.reload();
    }

    function deleteSlot(slotIndex) {
        const index = assertSlot(slotIndex);
        localStorage.removeItem(slotKey(index));
        const meta = getSlotsMetadata();
        delete meta[index];
        safeSetItem(SLOTS_KEY, JSON.stringify(meta));
    }

    function resetGame() {
        clearRegistry();
        window.location.reload();
    }

    function exportSaveFile() {
        if (!registryHasGame()) {
            window.alert('La partita non è ancora registrata. Torna alla schermata principale e riprova.');
            return;
        }
        const state = getCurrentGameState();
        const jsonStr = JSON.stringify(state, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const safeName = (state.meta.name || 'tabboz').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        a.href = url;
        a.download = `tabboz_${safeName}_${Date.now()}.tabboz`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function importSaveFile(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('Nessun file selezionato.'));
                return;
            }
            if (file.size > MAX_BYTES) {
                reject(new Error('File di salvataggio troppo grande.'));
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = parseSaveJson(String(e.target.result || ''));
                    restoreGameState(data);
                    resolve(data);
                    window.location.reload();
                } catch (err) {
                    reject(err instanceof Error ? err : new Error('File di salvataggio non valido o corrotto.'));
                }
            };
            reader.onerror = () => reject(new Error('Impossibile leggere il file.'));
            reader.readAsText(file);
        });
    }

    let _previousFocus = null;

    function renderModal() {
        let modal = document.getElementById('save-manager-modal');
        if (modal) modal.remove();

        const current = getCurrentGameState();
        const slotsMeta = getSlotsMetadata();

        modal = document.createElement('div');
        modal.id = 'save-manager-modal';
        modal.className = 'save-modal-backdrop';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', 'Gestione Salvataggi');

        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        let slotsHtml = '';
        for (let i = 1; i <= MAX_SLOTS; i++) {
            const sMeta = slotsMeta[i];
            if (sMeta) {
                const when = sMeta.timestamp ? new Date(sMeta.timestamp) : null;
                const timeLabel = when && !Number.isNaN(when.getTime())
                    ? `${when.toLocaleDateString()} ${when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : '';
                slotsHtml += `
                    <div class="save-slot-card">
                        <div class="slot-header">
                            <span class="slot-badge">Slot ${i}</span>
                            <span class="slot-time">${escapeHtml(timeLabel)}</span>
                        </div>
                        <div class="slot-body">
                            <strong>${escapeHtml(sMeta.name)}</strong> • ${escapeHtml(sMeta.soldi)}<br/>
                            Figosità: ${escapeHtml(sMeta.figosita)} • Data: ${escapeHtml(sMeta.date)} • Tipa: ${escapeHtml(sMeta.tipa)}
                        </div>
                        <div class="slot-actions">
                            <button type="button" class="btn-slot-load" data-action="load" data-slot="${i}">Carica</button>
                            <button type="button" class="btn-slot-save" data-action="save" data-slot="${i}">Sovrascrivi</button>
                            <button type="button" class="btn-slot-del" data-action="delete" data-slot="${i}" aria-label="Elimina slot ${i}">✕</button>
                        </div>
                    </div>
                `;
            } else {
                slotsHtml += `
                    <div class="save-slot-card empty">
                        <div class="slot-header">
                            <span class="slot-badge">Slot ${i}</span>
                            <span class="slot-empty-label">Vuoto</span>
                        </div>
                        <div class="slot-actions">
                            <button type="button" class="btn-slot-save full" data-action="save" data-slot="${i}">Salva in questo Slot</button>
                        </div>
                    </div>
                `;
            }
        }

        modal.innerHTML = `
            <div class="window save-modal-window">
                <div class="title-bar">
                    <div class="title-bar-text">💾 Gestione Salvataggi</div>
                    <div class="title-bar-controls">
                        <button type="button" class="control61536" data-action="close" aria-label="Chiudi">✕</button>
                    </div>
                </div>
                <div class="window-body save-modal-body">
                    <div class="current-state-card">
                        <div class="current-title">Partita Attuale</div>
                        <div class="current-info">
                            <strong>${escapeHtml(current.meta.name)}</strong> — ${escapeHtml(current.meta.soldi)}<br/>
                            Data: ${escapeHtml(current.meta.date)} • Figosità: ${escapeHtml(current.meta.figosita)} • Sizze: ${escapeHtml(current.meta.sizze)}
                        </div>
                    </div>

                    <div class="save-section-title">Slot di Salvataggio</div>
                    <div class="slots-container">
                        ${slotsHtml}
                    </div>

                    <div class="save-section-title">Backup &amp; Nuova Partita</div>
                    <div class="save-tools-grid">
                        <button type="button" class="btn-tool" data-action="export">
                            📥 Esporta File (.tabboz)
                        </button>
                        <label class="btn-tool file-btn">
                            📤 Importa File
                            <input type="file" accept=".tabboz,.json,application/json" style="display:none" data-action="import" />
                        </label>
                        <button type="button" class="btn-tool btn-danger" data-action="reset">
                            ⚠️ Nuova Partita (Reset)
                        </button>
                    </div>
                </div>
            </div>
        `;

        modal.addEventListener('click', (event) => {
            const button = event.target.closest('[data-action]');
            if (!button || button.tagName === 'INPUT') return;
            const action = button.getAttribute('data-action');
            const slot = button.getAttribute('data-slot');
            if (action === 'close') closeModal();
            else if (action === 'load') handleLoadSlot(slot);
            else if (action === 'save') handleSaveSlot(slot);
            else if (action === 'delete') handleDeleteSlot(slot);
            else if (action === 'export') exportSaveFile();
            else if (action === 'reset') handleResetGame();
        });

        const importInput = modal.querySelector('input[data-action="import"]');
        if (importInput) {
            importInput.addEventListener('change', () => handleImportInput(importInput));
        }

        const host = (TM.ui && typeof TM.ui.overlayRoot === 'function') ? TM.ui.overlayRoot() : document.body;
        host.appendChild(modal);
        const closeBtn = modal.querySelector('[data-action="close"]');
        if (closeBtn) closeBtn.focus();
    }

    function handleKeyDown(e) {
        if (e.key === 'Escape' || e.key === 'Esc') {
            e.preventDefault();
            closeModal();
        }
    }

    function openModal() {
        Promise.resolve(flushEngineSave()).then(() => {
            if (document.getElementById('save-manager-modal')) return;
            _previousFocus = document.activeElement;
            renderModal();
            window.addEventListener('keydown', handleKeyDown);
        });
    }

    function closeModal() {
        window.removeEventListener('keydown', handleKeyDown);
        const modal = document.getElementById('save-manager-modal');
        if (modal) modal.remove();
        if (_previousFocus && typeof _previousFocus.focus === 'function') {
            try { _previousFocus.focus(); } catch (e) { /* ignore */ }
        }
        _previousFocus = null;
    }

    function handleSaveSlot(i) {
        Promise.resolve(flushEngineSave()).then(() => {
            const meta = getSlotsMetadata();
            if (meta[i] && !window.confirm(`Vuoi sovrascrivere il salvataggio nello Slot ${i}?`)) return;
            if (!saveToSlot(i)) return;
            renderModal();
        });
    }

    function handleLoadSlot(i) {
        if (!window.confirm(`Caricare il salvataggio dello Slot ${i}? La partita attuale non salvata verrà persa.`)) return;
        try {
            loadFromSlot(i);
        } catch (err) {
            window.alert(err.message);
        }
    }

    function handleDeleteSlot(i) {
        if (window.confirm(`Vuoi davvero eliminare il salvataggio nello Slot ${i}?`)) {
            deleteSlot(i);
            renderModal();
        }
    }

    function handleResetGame() {
        if (window.confirm('Vuoi iniziare una nuova partita? Tutti i progressi non salvati negli Slot verranno azzerati.')) {
            resetGame();
        }
    }

    function handleImportInput(input) {
        if (input.files && input.files[0]) {
            if (!window.confirm('Importare questo salvataggio? La partita attuale non salvata negli slot verrà sostituita.')) {
                input.value = '';
                return;
            }
            importSaveFile(input.files[0])
                .catch((err) => window.alert(err.message))
                .finally(() => { input.value = ''; });
        } else {
            input.value = '';
        }
    }

    const api = {
        getCurrentGameState,
        restoreGameState,
        saveToSlot,
        loadFromSlot,
        deleteSlot,
        resetGame,
        exportSaveFile,
        importSaveFile,
        openModal,
        closeModal,
        flushEngineSave,
        formatLire,
        handleSaveSlot,
        handleDeleteSlot,
        handleResetGame,
        handleImportInput,
        validateSaveData,
        parseSaveJson,
        isAllowedRegistryKey
    };

    if (typeof window !== 'undefined') window.SaveManager = api;

    if (typeof document !== 'undefined') {
        let flushTries = 0;
        const initialFlush = window.setInterval(() => {
            flushTries += 1;
            if (canFlushEngine()) {
                window.clearInterval(initialFlush);
                flushEngineSave();
            } else if (flushTries > 40) {
                window.clearInterval(initialFlush);
            }
        }, 250);
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            validateSaveData,
            parseSaveJson,
            isAllowedRegistryKey,
            jsonReviver,
            formatLire,
            SAVE
        };
    }
})(typeof window !== 'undefined' ? (window.TabbozMobile = window.TabbozMobile || {}) : global.TabbozMobile = global.TabbozMobile || {});
