# Scuola (School & Study)

Scuola (`.window.dlg-10`) lets the player inspect grades across 9 school subjects, select a subject, study (`Studia`) to raise that subject's grade and overall `Profitto` (`Studio`), threaten/seduce (`Minaccia`/`Seduci`) the teacher, or attempt a bribe (`Corrompi`).

## Sub-features

- `scuola-open` opens `.window.dlg-10` from the Dashboard with all 9 subject cards and the action drawer (`Studia`, `Minaccia`, `Corrompi`, `Torna a Casa`) visible on screen without scrolling.
- `scuola-select-subject` selects any of the 9 subjects (`.scuola-subject-card[data-radio-id="110..118"]`), marking its card `.selected` and checking `#scuola_radio_<ID>`.
- `scuola-studia` increments the selected subject's grade (`.control120`–`.control128`) by `+1` and recalculates `Profitto` (`.control106`).
- `scuola-corrompi-guard` prompts for a bribe amount in a Yes/No messagebox and refuses with `"Errore critico"` when the player has only the starting `10000 L.`.
- `scuola-dashboard-sync` updates the Dashboard `Studio` stat (`.dlg-1 .control153`) and calendar date (`.dlg-1 .control157`) upon returning home.

## How to get to it (user POV)

- From the Dashboard (`.window.dlg-1`), tap `🎓 Scuola` (`.dashboard-nav-grid button.control136`).

## Driving it with control-tabboz

Preconditions:

- `node .cursor/skills/verify-tabboz/scripts/control-tabboz.js doctor --run-id <run-id>` reports `"status": "healthy"`.
- Fresh game booted to Dashboard (`.window.dlg-1`) on `Lunedi' 30 Settembre` with `10000 L.` and `Studio 0/100`.

- **Automated full journey.** Run `node .cursor/skills/verify-tabboz/scripts/control-tabboz.js drive --run-id <run-id> --feature scuola --evidence-dir /tmp/tabboz-evidence-<run-id>`. The command executes all steps below and writes proof artifacts to `/tmp/tabboz-evidence-<run-id>/scuola/`.
- **Open Scuola.** Tap `.dashboard-nav-grid button.control136`. `.window.dlg-10` appears with `.control104` (`10000 L.`), `.control105` (`0/100` Reputazione), `.control106` (`0/100` Profitto), 9 `.scuola-subject-card` items, and `.dlg-10 button.control103` (`Studia`) within the viewport bounds.
- **Select Fisica.** Tap `.dlg-10 .scuola-subject-card[data-radio-id="111"]`. The Fisica card gains class `selected` and `#scuola_radio_111` becomes `checked`.
- **Study Fisica.** Tap `.dlg-10 button.control103` (`Studia`) and dismiss any random daily event messagebox if one appears. `.dlg-10 .control121` (Fisica grade) changes from `0` to `1`, and `.dlg-10 .control106` (`Profitto`) changes from `0/100` to `1/100`.
- **Attempt bribe with starting money.** Tap `.dlg-10 button.control101` (`Corrompi`). `#tm-overlays .window.messagebox` appears asking `"Ma... forse per XX000 L. potrei dimenticare i tuoi ultimi compiti in classe..."`. Tap `.messagebox button.control6` (`Sì`). Because the bribe costs `30000 L.`–`88000 L.` and the player has `10000 L.`, a second messagebox appears reading `"Cosa ??? Prima cerchi di corrompermi, poi si scopre che non hai abbastanza soldi !!!"`. Tap `.messagebox button.control1` (`OK`).
- **Return to Dashboard.** Tap `.dlg-10 button.control1` (`✓ Torna a Casa`). `.window.dlg-10` closes, `.window.dlg-1` is visible, and `.dlg-1 .control153` (`Studio`) reads `1/100`.
- **Proof.** Run `node .cursor/skills/verify-tabboz/scripts/control-tabboz.js evidence --run-id <run-id> --feature scuola`. Confirm `01-scuola-opened.png`, `02-scuola-after-study-and-bribe.png`, `03-dashboard-updated.png`, their `.aria.txt` snapshots, and `proof.json` exist and `pageErrors` is `[]`.

## Gotchas

- `attachButtonHandler` in `mobile/js/ui-kit.js` locks button labels (`data-tm-label-lock="1"`), so the action buttons in `.dlg-10` keep their compact mobile labels (`Studia`, `Minaccia`, `Corrompi`) rather than expanding to `"Studia Fisica"`. Assert subject selection via `.scuola-subject-card[data-radio-id="111"].selected` and `#scuola_radio_111.checked`.
- Every school action (`Studia`, `Minaccia`, `Corrompi`) calls `Evento(hDlg)` in `scuola.c`, which advances the calendar by 1 day and can randomly open an event dialog (`.window.dlg-100`–`.dlg-107` or `#tm-overlays .window.messagebox`) or a Sunday/holiday notice (`CheckVacanza`) if multiple actions advance into a weekend or holiday. Always check for and dismiss `#tm-overlays .window.messagebox` or `.mobile-event-view button.control1` after school actions.
- `Minaccia` (`.control102`) requires `Reputazione >= 30` (or a 1-in-10 random roll) to succeed; with starting `Reputazione = 0`, it usually pops `"Cosa ??? Credi di farmi paura..."` and reduces the subject grade if the grade is `> 2`.
- Wait ~350ms before tapping `.messagebox button.control1` / `.control6` so the modal overlay is ready to receive touch events.
