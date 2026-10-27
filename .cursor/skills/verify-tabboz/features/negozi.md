# Negozi (Bar Tabacchi, Boutiques, Palestra, Telefonino)

Negozi (`.window.dlg-8`) is the shopping hub connecting clothing boutiques (`Bau House`, `Blue Rider`, `Zoccolaro`, `Footsmocker`, `Footsmocker II`, dialogs `80`–`84`), `Bar Tabacchi` (`.window.dlg-88`), `Palestra` (`.window.dlg-89`), and `Telefonino` (`.window.dlg-120`).

## Sub-features

- `negozi-menu` opens `.window.dlg-8` showing `Soldi Disponibili` (`.control120`) and 8 store entry buttons.
- `tabacchi-select-and-buy` selects a cigarette pack in `Bar Tabacchi` (`.window.dlg-88`), displays its brand and tar/nicotine line (`.control106`), deducts `5000 L.`–`6000 L.` on `Compra` (`.control1`), and increments `Sizze` (`+20`).
- `palestra-view` opens `Palestra` (`.window.dlg-89`) showing `Soldi`, `Figosità`, `Abbonamento`, `Abbronzatura`, workout card (`control110`), subscription tiers (`control115`–`117`), and `Lampada` (`control111`).
- `telefonino-view` opens `Negozio Telefonia` (`.window.dlg-120`) showing handset, SIM, and remaining credit, with sub-dialogs for buying handsets (`.dlg-121`) and SIM/top-ups (`.dlg-123`).
- `boutique-view` opens clothing boutiques (`.window.dlg-80`–`.dlg-84`) displaying item cards, prices, and insufficient-funds protection when `Soldi` is below item price.

## How to get to it (user POV)

- From the Dashboard (`.window.dlg-1`), tap `🏬 Negozi` (`.dashboard-nav-grid button.control131`).
- Inside `.window.dlg-8`:
  - Tap `🚬 Bar Tabacchi` (`button.control110`) to open `.window.dlg-88`.
  - Tap `💪 Palestra` (`button.control111`) to open `.window.dlg-89`.
  - Tap `📱 Telefonino` (`button.control112`) to open `.window.dlg-120`.
  - Tap `🧥 Bau House` (`button.control101`), `👕 Blue Rider` (`button.control102`), `👞 Zoccolaro` (`button.control103`), `👟 Footsmocker` (`button.control104`), or `👟 Footsmocker II` (`button.control105`) to open `.window.dlg-80`–`.dlg-84`.

## Driving it with control-tabboz

Preconditions:

- `node .cursor/skills/verify-tabboz/scripts/control-tabboz.js doctor --run-id <run-id>` reports `"status": "healthy"`.
- Fresh game booted to Dashboard (`.window.dlg-1`) with starting `Soldi = 10000 L.` and `Sizze = 0`.

- **Automated full journey.** Run `node .cursor/skills/verify-tabboz/scripts/control-tabboz.js drive --run-id <run-id> --feature negozi --evidence-dir /tmp/tabboz-evidence-<run-id>`. The command executes all steps below and writes proof artifacts to `/tmp/tabboz-evidence-<run-id>/negozi/`.
- **Open Negozi hub.** Tap `.dashboard-nav-grid button.control131`. `.window.dlg-8` appears with `.dlg-8 .control120` reading `10000 L.` and 8 store buttons in `.negozi-buttons-list`.
- **Select cigarettes in Bar Tabacchi.** Tap `.dlg-8 button.control110` (`Bar Tabacchi`). `.window.dlg-88` appears with 24 `.pack-card` items and `.control105` (`Sizze`) reading `0`. Tap the `.pack-card` containing `.control421` (`Philip Morris Super Light`) or the first `.pack-card`. The card gains class `selected` and `.dlg-88 .control106` updates to show the selected brand and `Condensato` / `Nicotina`.
- **Buy cigarettes and confirm persistence.** Tap `.dlg-88 button.control1` (`✓ Compra`). `#tm-overlays .window.messagebox` appears with title `ART. 46 L. 29/12/1990 n. 428` (statutory health warning). Tap `.messagebox button.control1` (`OK`). `.window.dlg-88` closes back to `.window.dlg-8`, where `.dlg-8 .control120` (`Soldi Disponibili`) now reads `5000 L.` or `4000 L.`. Tap `.dlg-8 button.control110` (`Bar Tabacchi`) a second time to confirm `.dlg-88 .control105` (`Sizze`) is now `19` or `20`, then tap `.dlg-88 button.control2` (`✕ Esci`).
- **Inspect Palestra and Telefonino.** Tap `.dlg-8 button.control111` (`Palestra`), verify `.window.dlg-89` renders `.palestra-stats-grid` and `.palestra-sub-grid`, and tap `.dlg-89 button.control1` (`✓ Torna ai Negozi`). Then tap `.dlg-8 button.control112` (`Telefonino`), verify `.window.dlg-120` renders `.phone-status-card`, and tap `.dlg-120 button.control1` (`✓ Torna alla Dashboard`).
- **Return to Dashboard.** Tap `.dlg-8 button.control1` (`✓ Torna alla Dashboard`) to close `.window.dlg-8`.
- **Proof.** Run `node .cursor/skills/verify-tabboz/scripts/control-tabboz.js evidence --run-id <run-id> --feature negozi`. Confirm `01-negozi-menu.png`, `02-tabacchi-pack-selected.png`, `03-phone-catalog.png`, their `.aria.txt` snapshots, and `proof.json` exist and `pageErrors` is `[]`.

## Gotchas

- **Starting money vs. shop prices:** A fresh game starts with `10000 L.`. Cigarette packs in `Bar Tabacchi` cost `5000 L.`–`6000 L.`, making `Bar Tabacchi` the only shop where a purchase succeeds from the default starting wallet without extra money. Clothing items (`58000 L.`–`418000 L.`), Palestra subscriptions (`50000 L.`–`500000 L.`), Lamps (`14000 L.`), and Cellphones/SIMs (`50000 L.+`) exceed `10000 L.` and will trigger the `nomoney` messagebox unless the player has earned or loaded more money.
- Buying a cigarette pack calls `Evento(hDlg)` in `vestiti.c`, which advances the day and may consume 1 cigarette (`sizze` becomes `19` instead of `20`) or trigger a random daily event messagebox.
- On closed shop days (`x_vacanza == 2`, such as Sundays/holidays), entering boutiques or Palestra pops a closure messagebox instead of completing a purchase.
