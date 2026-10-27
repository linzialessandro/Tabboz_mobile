# Tabboz Mobile verification map

This directory is the maintained source for verifying the user-facing behavior of the Tabboz Simulator Mobile PWA (`mobile/`). Read this index before driving the app, then use the matching feature file as the verification recipe.

## Baseline preconditions

- Launch Tabboz Mobile via `node .cursor/skills/verify-tabboz/helpers/verify-tabboz.js launch --run-id verify-1` on an isolated free port (`>= 8081`, never `8080`).
- Run `node .cursor/skills/verify-tabboz/helpers/verify-tabboz.js doctor --run-id verify-1` and require `ok: true`, matching `ASSET_VERSION`, `Cache-Control: no-store`, and `Content-Type: application/wasm`.
- Start every browser run in a fresh Playwright mobile touch context (`hasTouch: true`, `isMobile: true`, `deviceScaleFactor: 1`, `390×844` portrait or `844×390` landscape) with empty `localStorage`.
- Boot through the splash screen (`.window.dlg-12`) by tapping `⚡ TOCCA PER GIOCARE ⚡` (`button.control202`), wait for the Dashboard (`.window.dlg-1`), and wait for `SaveManager`'s initial silent `SalvaTutto()` flush (`.window.dlg-14`) to complete so `localStorage['HKEY_CURRENT_USER\\Software\\Obscured Truckware\\Tabboz Simulator 32\\Nome']` is populated (`"Tizio"`).
- Never drive a server instance that was not started by the current verification run.

## Driving conventions

- Start every recipe from the baseline Dashboard state (`Tizio Caio`, `10000 L.`, `Lunedi' 30 Settembre`) unless its preconditions state otherwise.
- Use `locator.tap()` for all user interactions; never bypass UI controls by calling `_PostMessage` directly.
- Prefer stable Win32 dialog classes (`.window.dlg-<ID>`), Win32 control classes (`.control<N>`), and `data-*` attributes over coordinates or DOM index order.
- Respect the `400ms` `pointer-events: none` guard on `#tm-overlays .window.messagebox` (`mobile/js/win32-bridge.js`): wait `~350–450ms` before tapping `button.control1` (`OK`), `button.control6` (`Sì`), or `button.control7` (`No`).
- Drain random events (`.window.dlg-96`, `.window.dlg-100`..`107`, `.window.dlg-110`) and `MessageBox` alerts triggered by `Evento(hDlg)` after day-advancing actions.
- Tear down the server with `node .cursor/skills/verify-tabboz/helpers/verify-tabboz.js cleanup --run-id verify-1` after every run. Never delete proof artifacts during cleanup.

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen.
- UI proof includes full-page PNG screenshots (`01-*.png`, `02-*.png`, ...) and structured DOM snapshots (`*.dom.json`) with the active dialog and player stats visible.
- Mutation proof includes a read of the live Win32 registry in `localStorage` (`HKEY_CURRENT_USER\Software\Obscured Truckware\Tabboz Simulator 32\*` and `tabboz_slot_1..3`) recorded in `*.registry.json` and `manifest.json`.
- Assert `pageErrors: []` and `consoleErrors: []` on every run via `node .cursor/skills/verify-tabboz/helpers/verify-tabboz.js evidence --run-id verify-1`.
- Report any unreachable path with the attempted selector/command and unmet precondition. Do not report a skipped entry point as verified through a different path.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behavior. It then uses four H2 sections in this exact order:

1. `Sub-features` lists short IDs with one line for each behavior.
2. `How to get to it (user POV)` lists every user entry point.
3. `Driving it with verify-tabboz` starts with `Preconditions:` and uses labeled bullets that pair each user action with an exact command or selector and observable result.
4. `Gotchas` lists traps that can waste or invalidate a verification run.

## Features

- [Dashboard, Navigation & Save Slots](./dashboard-and-saves.md) covers splash boot, portrait and landscape dashboard layout, non-overlapping header controls, About dialog, and multi-slot save/load/delete persistence.
- [Scuola (School & Study)](./scuola.md) covers subject selection, studying to raise grades and `Profitto`, threatening/bribing professors, action drawer viewport fit, and dashboard stat updates.
- [Lavoro (Jobs, Company List & Attitudinal Quiz)](./lavoro.md) covers unemployed guards, browsing the company directory and info cards, job offers, and completing the 3-part attitudinal quiz.
- [Negozi (Bar Tabacchi, Boutiques, Palestra, Telefonino)](./negozi.md) covers the shops hub, buying cigarette packs at Bar Tabacchi, gym subscriptions/tanning at Palestra, and the mobile phone catalog.
- [Scooter & Concessionario](./scooter.md) covers the scooter garage, no-scooter tuning guard, dealership menu, scooter showroom model selection, and insufficient-funds purchase guard.
- [Tipa (Relationships & Dating)](./tipa.md) covers relationship status guards, approaching a prospective partner (`Cerca nuova tipa/o` and `Due di Picche`), and partner interactions.
