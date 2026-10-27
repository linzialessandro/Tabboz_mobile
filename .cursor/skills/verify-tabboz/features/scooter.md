# Scooter & Concessionario

Scooter (`.window.dlg-7`) displays the player's current scooter stats (`Modello`, `Soldi`, `Velocità`, `Cilindrata`, `Efficienza`, `Benzina`) and provides entry points to the dealership (`Concessionario` -> `.window.dlg-70` and showrooms `.window.dlg-78`–`.dlg-79`), tuning shop (`Trucca Scooter` -> `.window.dlg-73` and part shops `.window.dlg-74`–`.dlg-77`), repairs (`Ripara Scooter`), fueling (`Fai Benza`), and parking (`Parcheggia/Usa Scooter`).

## Sub-features

- `scooter-open` opens `.window.dlg-7` showing `.scooter-stats-grid` (`10000 L.`) and 5 action buttons.
- `scooter-no-owner-guard` blocks tuning (`Trucca Scooter`, `.control102`) and repairs (`Ripara Scooter`, `.control103`) when the player does not own a scooter (`ScooterData.stato == -1`).
- `scooter-concessionario` opens the dealership menu (`.window.dlg-70`) and enters the Scooter Showroom (`.window.dlg-78` for Malagutty or `.window.dlg-79` for other brands).
- `scooter-showroom-select` selects scooter models (`.scooter-model-card`) in `.window.dlg-78` and updates the live specification grid (`Velocità`, `Cilindrata`, `Marmitta`, `Carburatore`, `Filtro aria`, `Prezzo`).
- `scooter-buy-nomoney-guard` blocks purchasing a scooter when `Soldi` (`10000 L.`) is less than the scooter price (`1450000 L.`–`6498000 L.`).

## How to get to it (user POV)

- From the Dashboard (`.window.dlg-1`), tap `🛵 Scooter` (`.dashboard-nav-grid button.control130`).
- Inside `.window.dlg-7`, tap `🏬 Concessionario` (`button.control101`), then tap `Scooter Malagutty` (`.dlg-70 button.control101`) to open the Malagutty Showroom (`.window.dlg-78`) or `Scooter di altre marche` (`.dlg-70 button.control102`) to open `.window.dlg-79`.
- Inside `.window.dlg-7`, tap `⚡ Trucca Scooter` (`button.control102`) to open tuning (`.window.dlg-73`, or the no-scooter guard when unowned).

## Driving it with verify-tabboz

Preconditions:

- `node .cursor/skills/verify-tabboz/helpers/verify-tabboz.js doctor --run-id verify-1` reports `ok: true`.
- Fresh game booted to Dashboard (`.window.dlg-1`) on a non-holiday weekday (`Lunedi' 30 Settembre`) with no scooter owned (`ScooterData.stato == -1`) and `10000 L.`.

- **Automated full journey.** Run `node .cursor/skills/verify-tabboz/helpers/verify-tabboz.js drive scooter --run-id verify-1`. The command executes all steps below and writes proof artifacts to `/tmp/tabboz-evidence-verify-1/scooter/`.
- **Open Scooter screen.** Tap `.dashboard-nav-grid button.control130`. `.window.dlg-7` appears with `.control104` reading `10000 L.` and `.control116` (`Modello`) reading `Nessuno scooter`.
- **Verify no-scooter tuning guard.** Tap `.dlg-7 button.control102` (`⚡ Trucca Scooter`). `#tm-overlays .window.messagebox` appears with `"Scusa, ma quale scooter avresti intenzione di truccare visto che non ne hai neanche uno ???"`. Tap `.messagebox button.control1` (`OK`).
- **Open Concessionario and Showroom.** Tap `.dlg-7 button.control101` (`🏬 Concessionario`) to open `.window.dlg-70`, then tap `.dlg-70 button.control101` (`Scooter Malagutty`) to open `.window.dlg-78` (`.mobile-scooter-showroom-view`).
- **Select model in Showroom.** Tap the second `.scooter-model-card` (`Fireball`) inside `.window.dlg-78`. The card gains class `selected`, its radio input becomes `checked`, and `.dlg-78 .control117` (`Prezzo`) and `.control110` (`Velocità`) update to match the selected model.
- **Verify insufficient funds guard on purchase.** Tap `.dlg-78 button.control1` (`✓ Compra`). `#tm-overlays .window.messagebox` appears stating `"Non hai abbastanza soldi"`. Tap `.messagebox button.control1` (`OK`), close `.dlg-78` if still open via `button.control2`, exit `.dlg-70` via `button.control1` (`✓ Conferma`), and tap `.dlg-7 button.control1` (`✓ Torna alla Dashboard`).
- **Proof.** Run `node .cursor/skills/verify-tabboz/helpers/verify-tabboz.js evidence --run-id verify-1 --feature scooter`. Confirm `01-scooter-garage.png` through `06-dashboard-after-scooter.png` exist and `pageErrors` is `[]`.

## Gotchas

- In `scooter.c`, `Concessionario` (`.window.dlg-70`) opens `.window.dlg-78` (`wParam = 101`, Malagutty) and `.window.dlg-79` (`wParam = 102`, altre marche), whereas dialogs `74`–`77` are `CompraUnPezzo` part shops opened from `Trucca Scooter` (`.window.dlg-73`).
- Scooters in `scooter.c` cost between `1.450.000 L.` and `6.498.000 L.`, so a fresh game (`10.000 L.`) cannot complete a purchase without seeded money; the expected observable outcome from the baseline state is the `"Non hai abbastanza soldi"` messagebox followed by returning to `.window.dlg-70`.
- Exiting `Concessionario` (`.window.dlg-70`) or tapping `Trucca Scooter` calls `Evento(hDlg)` in `scooter.c`, which advances the day and can pop a random event dialog. Always call `dismissRandomEvents` after closing `.dlg-70` or `.messagebox`.
- On Sundays/holidays (`x_vacanza == 2`), tapping `Concessionario` (`.control101`) or `Trucca Scooter` (`.control102`) shows `"Oh, tipo... oggi il concessionario/meccanico e' chiuso..."` instead of opening `.dlg-70` or `.dlg-73`.
