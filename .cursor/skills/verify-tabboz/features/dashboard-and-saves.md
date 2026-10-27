# Dashboard, Navigation & Save Slots

The Dashboard (`.window.dlg-1`) is the player's home screen after tapping through the Splash screen (`.window.dlg-12`), displaying live player identity, calendar date, stats (`Soldi`, `Figosità`, `Reputazione`, `Studio`, `Scooter`, `Tipa`), an 8-button navigation grid, the About dialog, and the multi-slot Save Manager (`#save-manager-open`).

## Sub-features

- `splash-to-dashboard` transitions from Splash (`.window.dlg-12`) to Dashboard (`.window.dlg-1`) and flushes the initial registry to `localStorage`.
- `dashboard-portrait-layout` renders player identity (`Tizio Caio`), date (`Lunedi' 30 Settembre`), stats (`10000 L.`), and 8 navigation buttons in `390×844` without overlap from `#save-manager-open`.
- `dashboard-landscape-layout` keeps all 8 `.dashboard-nav-grid button` controls visible inside the `844×390` landscape viewport.
- `save-slot-persist` opens `#save-manager-modal`, shows the live character (`Tizio Caio — 10000 L.`), saves into Slot 1 (`tabboz_slot_1`), and persists the full `HKEY_CURRENT_USER\Software\Obscured Truckware\Tabboz Simulator 32\*` registry.
- `about-dialog` opens `Info su Tabboz Simulator` (`.window.dlg-2`) and returns to the Dashboard.

## How to get to it (user POV)

- Open `/mobile/` and tap `⚡ TOCCA PER GIOCARE ⚡` (`.window.dlg-12 button.control202`) on the Splash screen to reach the Dashboard.
- Tap the `💾` button (`#save-manager-open`, `aria-label="Gestione Salvataggi"`) in the top-right title bar to open the Save Manager modal (`#save-manager-modal`).
- Tap `ℹ️ Info su Tabboz Simulator` (`.dlg-1 button.control120`) at the bottom of the Dashboard to open the About screen (`.window.dlg-2`).
- Tap the title-bar `✕` button (`.dlg-1 button.control61536`) on the Dashboard to open the Exit Session screen (`.window.dlg-16`).

## Driving it with verify-tabboz

Preconditions:

- `node .cursor/skills/verify-tabboz/helpers/verify-tabboz.js doctor --run-id verify-1` reports `ok: true`.
- Browser context is initialized at `390×844` (portrait) and `844×390` (landscape) with `hasTouch: true`, `isMobile: true`, and an empty `localStorage`.

- **Automated full journey.** Run `node .cursor/skills/verify-tabboz/helpers/verify-tabboz.js drive dashboard-and-saves --run-id verify-1`. The command executes all steps below and writes proof artifacts to `/tmp/tabboz-evidence-verify-1/dashboard-and-saves/`.
- **Boot to Dashboard.** Tap `.window.dlg-12 button.control202` (`⚡ TOCCA PER GIOCARE ⚡`) and wait for `.window.dlg-1 .dashboard-nav-grid button.control136` and `localStorage.getItem('HKEY_CURRENT_USER\\Software\\Obscured Truckware\\Tabboz Simulator 32\\Nome')`. `.dlg-1 .control102` reads `Tizio Caio`, `.dlg-1 .control157` reads `Lunedi' 30 Settembre`, and `.dlg-1 .stat-soldi .dlg_item` reads `10000 L.`.
- **Open Save Manager.** Tap `#save-manager-open`. `#save-manager-modal` appears with `.current-state-card` showing `Tizio Caio — 10000 L.` (never `Tabbozzo` or `0000 L.`).
- **Save to Slot 1.** Tap `#save-manager-modal button[data-action="save"][data-slot="1"]` (`Salva in questo Slot`). Slot 1 updates from `Vuoto` to `Tizio Caio • 10000 L.` with `Carica` and `Sovrascrivi` buttons, and `localStorage.getItem('tabboz_slot_1')` contains a JSON payload with `registry` holding the live game keys.
- **Close Save Manager.** Tap `#save-manager-modal [data-action="close"]`. `#save-manager-modal` is removed from the DOM.
- **Open and close About.** Tap `.dlg-1 button.control120` (`ℹ️ Info su Tabboz Simulator`), confirm `.window.dlg-2` (`Versione 0.92q (PWA Modern Edition)`) is visible, then tap `.dlg-2 button.control1` (`✓ Torna alla Dashboard`) to return to `.window.dlg-1`.
- **Verify landscape layout.** Boot a second context at `844×390` (`--viewport 844x390`). All 8 `.dashboard-nav-grid button` elements have `top >= -1` and `bottom <= window.innerHeight + 2`.
- **Proof.** Run `node .cursor/skills/verify-tabboz/helpers/verify-tabboz.js evidence --run-id verify-1 --feature dashboard-and-saves`. Confirm `01-dashboard-portrait.png`, `02-save-slot-1.png`, `02-save-slot-1.registry.json`, `03-about-dialog.png`, and `04-dashboard-landscape.png` exist and `pageErrors` is `[]`.

## Gotchas

- The C engine only writes `localStorage` inside `SalvaTutto`. On first boot, `save-manager.js` silently opens and closes Dialog 14 (`.window.dlg-14.tm-silent`) to trigger `SalvaTutto`. Always wait for `localStorage.getItem('...\\Nome')` to exist and `!document.querySelector('.window.dlg-14')` before tapping any Dashboard button.
- `Sovrascrivi` (overwrite slot), `Carica` (load slot), `✕` (delete slot), and `Nuova Partita (Reset)` open a browser `window.confirm(...)` dialog. Attach `page.on('dialog', d => d.accept())` before tapping those actions.
- Personal Information (command 139, dialog 11) and Configuration (command 140, dialog 14) exist only in the hidden desktop `.menubar` (`display: none`) and have no mobile layout (`AGENTS.md` Known Issues); do not expose or drive them as user paths.
