/**
 * Tabboz Simulator Mobile - Save Manager
 * Copyright (c) 1997-2001 Andrea Bonomi, Emanuele Caccialanza
 * Distributed under the terms of the GNU General Public License v3.0.
 *
 * Manages local save slots, export/import (.tabboz JSON), and game reset.
 */

const SaveManager = (() => {
    const REG_PREFIX = "HKEY_CURRENT_USER\\Software\\Obscured Truckware\\Tabboz Simulator 32";
    const SLOTS_KEY = "tabboz_mobile_slots_meta";
    
    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') unsafe = String(unsafe || '');
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function safeSetItem(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                alert("Spazio di archiviazione esaurito! Impossibile salvare.");
            } else {
                console.error("Errore durante il salvataggio:", e);
            }
        }
    }

    function getRegistryValue(subKey) {
        const fullKey = subKey ? `${REG_PREFIX}\\${subKey}` : REG_PREFIX;
        const item = localStorage.getItem(fullKey);
        if (!item) return null;
        try {
            const parsed = JSON.parse(item);
            return parsed[""] !== undefined ? parsed[""] : parsed.value;
        } catch (e) {
            return item;
        }
    }

    function getCurrentGameState() {
        const state = {};
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(REG_PREFIX)) {
                state[k] = localStorage.getItem(k);
            }
        }

        const nome = getRegistryValue("Nome") || "Tabbozzo";
        const cognome = getRegistryValue("Cognome") || "";
        const soldi = getRegistryValue("Soldi") || "0";
        const figosita = getRegistryValue("Fama") || "0";
        const reputazione = getRegistryValue("Reputazione") || "0";
        const giorno = getRegistryValue("Giorno") || "1";
        const mese = getRegistryValue("Mese") || "10";
        const sizze = getRegistryValue("Sigarette") || "0";
        const tipa = getRegistryValue("Nometipa") || "Nessuna";

        return {
            meta: {
                name: `${nome} ${cognome}`.trim(),
                soldi: `${soldi}000 L.`,
                figosita: `${figosita}/100`,
                reputazione: `${reputazione}/100`,
                date: `${giorno}/${mese}`,
                sizze: sizze,
                tipa: tipa || "Nessuna",
                timestamp: new Date().toISOString()
            },
            registry: state
        };
    }

    function restoreGameState(saveData) {
        if (!saveData || !saveData.registry) {
            throw new Error("Formato di salvataggio non valido.");
        }
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(REG_PREFIX)) {
                keysToRemove.push(k);
            }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));

        for (const [k, v] of Object.entries(saveData.registry)) {
            safeSetItem(k, v);
        }
    }

    function getSlotsMetadata() {
        try {
            return JSON.parse(localStorage.getItem(SLOTS_KEY) || "{}");
        } catch (e) {
            return {};
        }
    }

    function saveToSlot(slotIndex) {
        const state = getCurrentGameState();
        safeSetItem(`tabboz_slot_${slotIndex}`, JSON.stringify(state));
        const meta = getSlotsMetadata();
        meta[slotIndex] = state.meta;
        safeSetItem(SLOTS_KEY, JSON.stringify(meta));
        return state.meta;
    }

    function loadFromSlot(slotIndex) {
        const raw = localStorage.getItem(`tabboz_slot_${slotIndex}`);
        if (!raw) throw new Error("Slot di salvataggio vuoto.");
        const data = JSON.parse(raw);
        restoreGameState(data);
        window.location.reload();
    }

    function deleteSlot(slotIndex) {
        localStorage.removeItem(`tabboz_slot_${slotIndex}`);
        const meta = getSlotsMetadata();
        delete meta[slotIndex];
        safeSetItem(SLOTS_KEY, JSON.stringify(meta));
    }

    function resetGame() {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(REG_PREFIX)) {
                keysToRemove.push(k);
            }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
        window.location.reload();
    }

    function exportSaveFile() {
        const state = getCurrentGameState();
        const jsonStr = JSON.stringify(state, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const safeName = (state.meta.name || "tabboz").replace(/[^a-z0-9]/gi, '_').toLowerCase();
        a.href = url;
        a.download = `tabboz_${safeName}_${Date.now()}.tabboz`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function importSaveFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    restoreGameState(data);
                    resolve(data);
                    window.location.reload();
                } catch (err) {
                    reject(new Error("File di salvataggio non valido o corrotto."));
                }
            };
            reader.onerror = () => reject(new Error("Impossibile leggere il file."));
            reader.readAsText(file);
        });
    }

    function renderModal() {
        let modal = document.getElementById("save-manager-modal");
        if (modal) modal.remove();

        const current = getCurrentGameState();
        const slotsMeta = getSlotsMetadata();

        modal = document.createElement("div");
        modal.id = "save-manager-modal";
        modal.className = "save-modal-backdrop";
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");
        modal.setAttribute("aria-label", "Gestione Salvataggi");

        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        let slotsHtml = "";
        for (let i = 1; i <= 3; i++) {
            const sMeta = slotsMeta[i];
            if (sMeta) {
                slotsHtml += `
                    <div class="save-slot-card">
                        <div class="slot-header">
                            <span class="slot-badge">Slot ${i}</span>
                            <span class="slot-time">${new Date(sMeta.timestamp).toLocaleDateString()} ${new Date(sMeta.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div class="slot-body">
                            <strong>${escapeHtml(sMeta.name)}</strong> • ${escapeHtml(sMeta.soldi)}<br/>
                            Figosità: ${escapeHtml(sMeta.figosita)} • Data: ${escapeHtml(sMeta.date)} • Tipa: ${escapeHtml(sMeta.tipa)}
                        </div>
                        <div class="slot-actions">
                            <button class="btn-slot-load" onclick="SaveManager.loadFromSlot(${i})">Carica</button>
                            <button class="btn-slot-save" onclick="SaveManager.handleSaveSlot(${i})">Sovrascrivi</button>
                            <button class="btn-slot-del" onclick="SaveManager.handleDeleteSlot(${i})">✕</button>
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
                            <button class="btn-slot-save full" onclick="SaveManager.handleSaveSlot(${i})">Salva in questo Slot</button>
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
                        <button class="control61536" onclick="SaveManager.closeModal()">✕</button>
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

                    <div class="save-section-title">Backup & Nuova Partita</div>
                    <div class="save-tools-grid">
                        <button class="btn-tool" onclick="SaveManager.exportSaveFile()">
                            📥 Esporta File (.tabboz)
                        </button>
                        <label class="btn-tool file-btn">
                            📤 Importa File
                            <input type="file" accept=".tabboz,.json" style="display:none" onchange="SaveManager.handleImportInput(this)" />
                        </label>
                        <button class="btn-tool btn-danger" onclick="SaveManager.handleResetGame()">
                            ⚠️ Nuova Partita (Reset)
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    function handleKeyDown(e) {
        if (e.key === "Escape" || e.key === "Esc") {
            closeModal();
        }
    }

    function openModal() {
        renderModal();
        window.addEventListener("keydown", handleKeyDown);
    }

    function closeModal() {
        window.removeEventListener("keydown", handleKeyDown);
        const modal = document.getElementById("save-manager-modal");
        if (modal) modal.remove();
    }

    function handleSaveSlot(i) {
        saveToSlot(i);
        renderModal();
    }

    function handleDeleteSlot(i) {
        if (confirm(`Vuoi davvero eliminare il salvataggio nello Slot ${i}?`)) {
            deleteSlot(i);
            renderModal();
        }
    }

    function handleResetGame() {
        if (confirm("Vuoi iniziare una nuova partita? Tutti i progressi non salvati negli Slot verranno azzerati.")) {
            resetGame();
        }
    }

    function handleImportInput(input) {
        if (input.files && input.files[0]) {
            importSaveFile(input.files[0])
                .catch(err => alert(err.message))
                .finally(() => { input.value = ''; });
        } else {
            input.value = '';
        }
    }

    return {
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
        handleSaveSlot,
        handleDeleteSlot,
        handleResetGame,
        handleImportInput
    };
})();

window.SaveManager = SaveManager;
