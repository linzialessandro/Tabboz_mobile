# Dashboard, Navigation & Save Manager

The Dashboard (`.window.dlg-1`) is the central hub of Tabboz Mobile: it displays the player's identity (`Tizio Caio`), calendar date, character portrait, live stats (`Soldi`, `Figosità`, `Reputazione`, `Studio`, `Scooter`, `Tipa`), the 8-button navigation grid across portrait (`390×844`) and landscape (`844×390`) viewports, and the floating `💾` Save Manager (`#save-manager-open`) for saving, overwriting, loading, exporting, and resetting up to 3 local save slots.

## Sub-features

- `dash-boot` boots from the Splash screen (`.window.dlg-12`) to the Dashboard (`.window.dlg-1`) and flushes the initial Win32 registry to `localStorage`.
- `dash-layout-portrait` renders player stats, portrait canvas, and all 8 navigation buttons in `390×844` without `#save-manager-open` overlapping `.control102` (player name).
- `dash-layout-landscape` fits all 8 navigation buttons inside the `844×390` landscape viewport without vertical clipping.
- `save-slot-persist` opens `#save-manager-modal`, shows live player data (`Tizio Caio`, `10000 L.`), and writes a full Win32 registry snapshot to `localStorage['tabboz_slot_1']`.

## How to get to it (user POV)

- Open `/mobile/` in a mobile browser and tap `⚡ TOCCA PER GIOCARE ⚡` on the splash screen to reach the Dashboard.
- Tap the `💾` icon (`#save-manager-open`) in the top-right title bar area to open `Gestione Salvataggi` (`#save-manager-modal`).
- Tap `✓ Torna alla Dashboard`, `✓ Torna a Casa`, or the title-bar `✕` (`button.control61536`) from any child screen to return to the Dashboard.

## Driving it with control-tabboz

Preconditions:

- Tabboz Mobile is running and `node .cursor/skills/verify-tabboz/scripts/control-tabboz.js doctor --run-id <run-id>` reports `"status": "healthy"`.
- The browser context starts with empty `localStorage` at `390×844` (`hasTouch: true, isMobile: true`).

- **Automated full recipe.** Run `node .cursor/skills/verify-tabboz/scripts/control-tabboz.js drive --run-id <run-id> --feature dashboard --evidence-dir /tmp/tabboz-evidence-<run-id>`. Exit code `0` and `/tmp/tabboz-evidence-<run-id>/dashboard/proof.json` confirm all steps below.
- **Boot from Splash.** Navigate to `baseUrl` and tap `.window.dlg-12 button.control202` (`⚡ TOCCA PER GIOCARE ⚡`). `.window.dlg-1` becomes visible and `localStorage['HKEY_CURRENT_USER\\Software\\Obscured Truckware\\Tabboz Simulator 32\\Nome']` equals `'{"":"Tizio"}'`.
- **Verify portrait header & stats.** Read `.window.dlg-1 .control102` (`Tizio Caio`), `.control157` (`Lunedì 30 Settembre`), and `.control105` (`10000 L.`). Measure bounding boxes of `.dlg-1 .control102` and `#save-manager-open`: `saveOverlapsName` is `false`.
- **Open Save Manager & save Slot 1.** Tap `#save-manager-open`, wait for `#save-manager-modal`, and tap `#save-manager-modal [data-action="save"][data-slot="1"]` (`Salva in questo Slot`). `localStorage['tabboz_slot_1']` contains a JSON payload with `meta.name === "Tizio Caio"`, `meta.soldi === "10000 L."`, and `> 5` keys in `registry`.
- **Close Save Manager.** Tap `#save-manager-modal [data-action="close"]`. `#save-manager-modal` is removed from the DOM.
- **Verify landscape navigation fit.** Resize viewport to `844×390` and measure all 8 `.window.dlg-1 .dashboard-nav-grid button` bounding boxes (`Scooter`, `Negozi`, `Disco`, `Scuola`, `Lavoro`, `Tipa`, `Compagnia`, `Famiglia`). Every button has `top >= -1` and `bottom <= 392`.
- **Proof.** Inspect `/tmp/tabboz-evidence-<run-id>/dashboard/01-dashboard-portrait.png`, `02-save-slot-saved.png`, `03-dashboard-landscape.png`, their `.aria.txt` snapshots, and `proof.json`.

## Gotchas

- The C engine only writes `localStorage` inside `SalvaTutto()`. On first boot, `SaveManager` triggers `SalvaTutto()` by opening Configuration (`.window.dlg-14`, class `.tm-silent`) and posting `IDOK`. Always wait until `localStorage.getItem('...\\Nome')` is truthy and `.window.dlg-14` is gone before opening `#save-manager-open` or asserting on `.dlg-1`.
- Opening a child dialog (such as `.window.dlg-10` Scuola) hides `.window.dlg-1` (`display: none`), giving `.dlg-1 .control102` a `0×0` bounding box. Measure Dashboard bounding boxes only while `.window.dlg-1` is the active window.
- Overwriting or deleting an existing slot in `#save-manager-modal` triggers a native `window.confirm()` dialog. Register `page.on('dialog', d => d.accept())` before tapping `Sovrascrivi` or `✕`.
