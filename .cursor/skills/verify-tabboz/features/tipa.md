# Tipa (Relationships & Dating)

Tipa (`.window.dlg-9`) manages the player's romantic life: it displays current partner stats (`Nome`, `Affinità`, `Figosità`, `Fama`), guards partner actions (`Lascia tipa/o`, `Telefona`, `Esci insieme`) when single, and opens `Cerca nuova tipa/o` (`.window.dlg-91`) where `💘 Ci provo !` (`button.control101`) either starts a relationship or opens the `Due di Picche` rejection screen (`.window.dlg-95`).

## Sub-features

- `tipa-single-guards` opens `.window.dlg-9` and displays the `"che ragazza avresti intenzione di lasciare ???"` `MessageBox` when tapping `💔 Lascia tipa/o` (`button.control111`) while single (`Rapporti <= 0`).
- `tipa-cerca-and-picche` opens `Cerca nuova tipa/o` (`.window.dlg-91`) from `button.control110`, displays candidate `Nome` (`.control105`), `Figosità` (`.control106`), and `Giudizio` (`.control107`), and handles both acceptance and `Due di Picche` (`.window.dlg-95`) when tapping `💘 Ci provo !` (`button.control101`).

## How to get to it (user POV)

- From the Dashboard (`.window.dlg-1`), tap `💋 Tipa` (`.dashboard-nav-grid button.control133`) to open `.window.dlg-9`.
- Inside `.window.dlg-9`, tap `🔍 Cerca nuova tipa/o` (`button.control110`) to open `.window.dlg-91`.

## Driving it with verify-tabboz

Preconditions:

- `node .cursor/skills/verify-tabboz/helpers/verify-tabboz.js doctor --run-id verify-1` reports `ok: true`.
- Fresh game booted to Dashboard (`.window.dlg-1`) with `Rapporti == 0` (single) and `Fama == 0`.

- **Automated full journey.** Run `node .cursor/skills/verify-tabboz/helpers/verify-tabboz.js drive tipa --run-id verify-1`. The command executes all steps below and writes proof artifacts to `/tmp/tabboz-evidence-verify-1/tipa/`.
- **Verify single guard in Tipa.** Tap `.dashboard-nav-grid button.control133` to open `.window.dlg-9`, then tap `button.control111` (`💔 Lascia tipa/o`). Dismiss `#tm-overlays .window.messagebox` (`"Scusa, che ragazza avresti intenzione di lasciare ???"`) via `button.control1`.
- **Search and pitch to a prospective partner.** Tap `.dlg-9 button.control110` (`🔍 Cerca nuova tipa/o`) to open `.window.dlg-91`. Read `.control105` (`Nome`), `.control106` (`Figosità`), and `.control107` (`Giudizio`), then tap `.dlg-91 button.control101` (`💘 Ci provo !`). If `.window.dlg-95` (`Due di Picche`) opens, read `.dlg-95 .control105` and tap `.dlg-95 button.control1` (`💔 Ci rinuncio...`); otherwise verify `.window.dlg-9 .control105` shows the new partner's name.
- **Return to Dashboard.** Tap `.dlg-9 button.control1` (`✓ Torna alla Dashboard`).
- **Proof.** Run `node .cursor/skills/verify-tabboz/helpers/verify-tabboz.js evidence --run-id verify-1 --feature tipa`. Confirm `01-tipa-initial.png` through `04-tipa-*.png` exist and `pageErrors` is `[]`.

## Gotchas

- In `tipa.c`, `💘 Ci provo !` (`button.control101` in `.window.dlg-91`) compares the candidate's `Figosità` against the player's `Fama`. With starting `Fama = 0`, higher-`Figosità` candidates open `.window.dlg-95` (`Due di Picche`), whereas low-`Figosità` candidates accept immediately and close `.window.dlg-91`. Handle both branches cleanly.
- If the player's gender (`sesso`) is set to `'F'` (Tabbozza mode), `Tipa()` adds `spostamento = 100` to dialog IDs, opening `.window.dlg-190` (`TIPA_ALT`), `.window.dlg-191` (`CERCA_TIPA_ALT`), and `.window.dlg-192` (`DUE_DONNE_ALT`).
- Tapping the partner portrait canvas inside `.window.dlg-9` (`.tipa-hero-card canvas`) posts command `130` in `transformTipa`. Tap action buttons explicitly rather than the hero image unless testing portrait interaction.
