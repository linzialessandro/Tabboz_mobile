---
name: verify-tabboz
description: "Project-local verification skill for Tabboz_mobile (the mobile PWA port of Tabboz Simulator). Use when verifying mobile UI, Win32 bridge dialogs, screen transformers, save slots, or gameplay flows in Tabboz_mobile. Launches an isolated server.py instance on a free port (>=8081), checks health via doctor, drives the touch-first PWA in Playwright + /usr/bin/google-chrome across portrait (390x844) and landscape (844x390) phone viewports, captures screenshots + DOM/registry proofs, and tears down only the started server while preserving evidence."
---

# Verify Tabboz Mobile (`mobile/`)

Tabboz_mobile is a touch-first mobile Progressive Web App (`mobile/`) wrapping the original C/WebAssembly **Tabboz Simulator** engine (`zarrosim.js` + `zarrosim.wasm` at the repo root) through a custom Win32/Novantotto bridge (`mobile/js/win32-bridge.js`) and screen transformers (`mobile/js/screens/*.js`). A legacy desktop shell also lives at `/desktop.html`, while **`/mobile/` is the primary user surface**.

Read the feature map in [`features/README.md`](features/README.md) before driving the app, and use `.cursor/skills/verify-tabboz/helpers/verify-tabboz.js` to run the verification lifecycle.

---

## Launch

Start an isolated static server from the repository root on a free port (`>= 8081`, never `8080` which is reserved for interactive development):

```bash
node .cursor/skills/verify-tabboz/helpers/verify-tabboz.js launch --run-id verify-1
```

### What `launch` does and how readiness is defined

1. **Port & process isolation:** Probes TCP ports starting at `8081`, spawns `PORT=<port> python3 server.py` from `/workspace/Tabboz_mobile-verify`, and writes state to `/tmp/tabboz-verify-<run-id>/`:
   - `server.pid` — exact child PID
   - `server.log` — HTTP access and error logs
   - `state.json` — `{ runId, pid, port, baseUrl, assetVersion, evidenceDir, startedAt }`
2. **HTTP + WASM readiness:** Waits until `http://127.0.0.1:<port>/mobile/` returns `200` with `Cache-Control: no-store` and `http://127.0.0.1:<port>/zarrosim.wasm` returns `200` with `Content-Type: application/wasm`.
3. **WASM & Splash readiness (not just HTTP 200):** Opens headless Chrome (`/usr/bin/google-chrome`) at `390×844` (`hasTouch: true`, `isMobile: true`) and waits until the C/WASM engine finishes `WinMain` startup and renders the Splash dialog (`.window.dlg-12`) with the `⚡ TOCCA PER GIOCARE ⚡` button (`button.control202`) visible.
4. **Dashboard & initial registry readiness:** When entering the game from the Splash screen, tapping `.window.dlg-12 button.control202` opens the Dashboard (`.window.dlg-1`). Immediately on first boot, `SaveManager` (`mobile/js/save-manager.js`) silently opens and closes Dialog 14 (`.window.dlg-14.tm-silent`) to trigger the C engine's `SalvaTutto()`, populating `localStorage['HKEY_CURRENT_USER\\Software\\Obscured Truckware\\Tabboz Simulator 32\\Nome']` (`"Tizio"`). Never interact with the Dashboard until `.window.dlg-1 .dashboard-nav-grid button` is visible, `Nome` exists in `localStorage`, and `.window.dlg-14` is detached.

---

## Doctor

Run the read-only health check before driving or whenever behavior looks wrong:

```bash
node .cursor/skills/verify-tabboz/helpers/verify-tabboz.js doctor --run-id verify-1
```

`doctor` verifies all of the following and exits non-zero if any check fails:
- `state.json` and `server.pid` exist for `--run-id`, the PID is alive (`kill(pid, 0)`), and `/proc/<pid>/cmdline` contains `server.py` (re-binding automatically if an ephemeral subshell reaped the background daemon).
- `GET http://127.0.0.1:<port>/mobile/` returns `200`, contains `<title>Tabboz Mobile</title>`, and sends `Cache-Control: no-store, no-cache, must-revalidate, max-age=0`.
- `GET http://127.0.0.1:<port>/mobile/js/version.js` returns `200` and its `ASSET_VERSION` matches `mobile/js/version.js` on disk (single cache-busting source of truth).
- `GET http://127.0.0.1:<port>/zarrosim.wasm` returns `200` with `Content-Type: application/wasm` and `> 100 KB` body size.
- `/usr/bin/google-chrome` (or `$CHROME` / `TABBOZ_BROWSER=playwright`) and Playwright (`playwright-core` / `playwright`) are resolvable.

---

## Drive

Drive a mapped user journey using `verify-tabboz.js`:

```bash
node .cursor/skills/verify-tabboz/helpers/verify-tabboz.js drive <feature> --run-id verify-1 [--viewport 390x844|844x390]
```

Supported `<feature>` targets:
- `dashboard-and-saves` (alias: `dashboard`) — Splash -> Dashboard (portrait `390×844` & landscape `844×390`), Save Manager (`#save-manager-open`), Slot 1 save persistence (`tabboz_slot_1`), and About dialog (`.window.dlg-2`).
- `scuola` — Dashboard -> Scuola (`.window.dlg-10`), subject selection (`.scuola-subject-card[data-radio-id="111"]` Fisica), `Studia` (`button.control103`) grade + `Profitto` increase, `Corrompi` (`button.control101`) insufficient-funds guard, and Dashboard `Studio` stat sync.
- `lavoro` — Dashboard -> Lavoro (`.window.dlg-13`), unemployed action guard (`button.control111`), Company List (`.window.dlg-210`) & Company Info (`.window.dlg-290`–`.dlg-297`), Job Offer (`.window.dlg-390`–`.dlg-397`), and 3-question Attitudinal Quiz (`.window.dlg-200`–`.dlg-209`).
- `negozi` — Dashboard -> Negozi (`.window.dlg-8`), Bar Tabacchi (`.window.dlg-88`) cigarette selection & purchase (`Soldi` `10000 L.` -> `4000 L.`, `Sizze` `0` -> `19..20`), Palestra (`.window.dlg-89`), and Telefonino (`.window.dlg-120`).
- `scooter` — Dashboard -> Scooter (`.window.dlg-7`), no-scooter tuning guard (`button.control102`), Concessionario (`.window.dlg-70`) -> Malagutty Showroom (`.window.dlg-78`), model selection (`.scooter-model-card`), and purchase insufficient-funds guard (`button.control1`).
- `tipa` — Dashboard -> Tipa (`.window.dlg-9`), single guard on `Lascia tipa` (`button.control111`), `Cerca nuova tipa` (`.window.dlg-91`), and `Ci provo !` (`button.control101` -> `.window.dlg-95` `Due di Picche` or match).

### Harness conventions & real handles

- **Browser & viewports:** Headless `/usr/bin/google-chrome` launched via Playwright with `hasTouch: true`, `isMobile: true`, `deviceScaleFactor: 1`. Standard phone viewports are **`390×844` (portrait)** and **`844×390` (landscape)**.
- **Touch-first interaction:** Always use `await locator.tap()` (never `.click()`) to match real mobile touch dispatch.
- **Stable DOM & Win32 selectors:**
  - Every Win32 dialog created by `dialogBox()` in `mobile/js/win32-bridge.js` has class `.window.dlg-<ID>` (see `TM.DLG` in `mobile/js/config.js`).
  - Every Win32 control inside a dialog has class `.control<ID>` matching the C resource ID (`button.control1` = `IDOK`, `button.control2` = `IDCANCEL`, `button.control6` = `IDYES`, `button.control7` = `IDNO`, `button.control61536` = titlebar close `✕`).
  - Save Manager uses `#save-manager-open`, `#save-manager-modal`, and `[data-action="save"|"load"|"delete"|"reset"|"close"][data-slot="1..3"]`.
- **Critical timing & event traps:**
  - **MessageBox 400ms pointer-events guard:** `messageBox()` in `mobile/js/win32-bridge.js` sets `pointer-events: none` on `#tm-overlays .window.messagebox` for `400ms` after opening so the tap that triggered the alert cannot accidentally dismiss it. Always wait `~350–450ms` after `#tm-overlays .window.messagebox` becomes visible before tapping `button.control1` (`OK`), `button.control6` (`Sì`), or `button.control7` (`No`).
  - **Random events after day-advancing actions:** Studying, bribing, taking a job quiz, or buying items calls `Evento(hDlg)` in C, which advances the calendar day (`Giorno()`) and may open a random event dialog (`.window.dlg-96`, `.window.dlg-100`–`107`, or `.window.dlg-110` Pagella) or a `MessageBox`. Always call `dismissRandomEvents(page)` after day-advancing actions.
  - **Known broken dialogs (do not open in normal flows):** Dialog 11 (`Personal Information`, command `139`) and Dialog 14 (`Configuration`, command `140`) live only in the hidden Win95 `.menubar` (`display: none`). Leave that menu hidden; `SaveManager` only invokes Dialog 14 silently (`.tm-silent`) to trigger `SalvaTutto()`.

---

## Evidence

Inspect and validate captured proof artifacts for a run:

```bash
node .cursor/skills/verify-tabboz/helpers/verify-tabboz.js evidence --run-id verify-1 [--feature <feature>]
```

### Proof standards

1. **Real user path:** Drive features exclusively via touch taps (`locator.tap()`) starting from the Splash screen (`.window.dlg-12`) and Dashboard (`.window.dlg-1`). Never call `_PostMessage` directly from verification scripts to bypass UI controls.
2. **Action + resulting state:** Every recorded step writes three artifacts under `/tmp/tabboz-evidence-<run-id>/<feature>/`:
   - `<stepId>.png` — full-page PNG screenshot of the phone viewport
   - `<stepId>.dom.json` — structured snapshot of visible `.window` dialogs, titlebars, controls, and `#save-manager-modal`
   - `<stepId>.registry.json` — live Win32 registry keys under `HKEY_CURRENT_USER\Software\Obscured Truckware\Tabboz Simulator 32\*` plus `tabboz_slot_1..3`
3. **Zero runtime errors:** `manifest.json` records `pageErrors` and `consoleErrors`, and `evidence` asserts both arrays are empty (`[]`) and every referenced file exists with `bytes > 0`.

---

## Cleanup

Tear down the verification server instance when finished (or after any failed run):

```bash
node .cursor/skills/verify-tabboz/helpers/verify-tabboz.js cleanup --run-id verify-1
```

- **Targeted process termination:** Reads `server.pid` from `/tmp/tabboz-verify-<run-id>/`, verifies `/proc/<pid>/cmdline` matches `server.py`, and sends `SIGTERM` (escalating to `SIGKILL` after 3s if needed). Never runs `pkill` or `killall`.
- **Scratch vs. Evidence separation:** Removes `/tmp/tabboz-verify-<run-id>/` (PID file, state file, and server log) while leaving `/tmp/tabboz-evidence-<run-id>/` untouched, and confirms `"evidenceSurvived": true` with the full list of preserved files.

---

## Helpers

The primary CLI helper is `.cursor/skills/verify-tabboz/helpers/verify-tabboz.js` (with `.cursor/skills/verify-tabboz/scripts/control-tabboz.js` also available):

```bash
# 1. Start isolated server on a free port >= 8081 and verify WASM Splash boot
node .cursor/skills/verify-tabboz/helpers/verify-tabboz.js launch --run-id verify-1

# 2. Check server PID, HTTP headers, ASSET_VERSION, WASM MIME, and Chrome/Playwright
node .cursor/skills/verify-tabboz/helpers/verify-tabboz.js doctor --run-id verify-1

# 3. Drive a mapped feature and write proof to /tmp/tabboz-evidence-verify-1/<feature>/
node .cursor/skills/verify-tabboz/helpers/verify-tabboz.js drive scuola --run-id verify-1

# 4. Verify all proof files exist, are non-empty, and had 0 page/console errors
node .cursor/skills/verify-tabboz/helpers/verify-tabboz.js evidence --run-id verify-1

# 5. Tear down server and confirm evidence still exists after cleanup
node .cursor/skills/verify-tabboz/helpers/verify-tabboz.js cleanup --run-id verify-1
```

You can also run the repo's unit/lint checks and regression suite against the isolated server:
```bash
npm run check
TABBOZ_URL=http://127.0.0.1:<port>/mobile/ node mobile/e2e/bugs.js
```
