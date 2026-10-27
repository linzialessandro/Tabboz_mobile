# Lavoro (Jobs, Company List & Attitudinal Quiz)

Lavoro (`.window.dlg-13`) lets the player check employment status (`Ditta`, `Soldi`, `Stipendio`, `Impegno`), browse the directory of 8 companies (`.window.dlg-210`) and their detail cards (`.window.dlg-290`–`.dlg-297`), apply for a job via a company Job Offer (`.window.dlg-390`–`.dlg-397`) and a 3-question Attitudinal Quiz (`.window.dlg-200`–`.dlg-209`), and perform workplace actions (`Lavora`, `Fai il leccaculo`, `Chiedi aumento salario`, `Sciopera`, `Licenziati`).

## Sub-features

- `lavoro-unemployed-guards` shows the `"sei disokkupato"` `MessageBox` with a non-zero `hWnd` and viewport-fitting layout when tapping workplace actions (`Licenziati`, `Lavora`, `Sciopera`) while unemployed.
- `lavoro-company-directory` opens Elenco Ditte (`.window.dlg-210`) from `ℹ️ Informazioni` (`button.control114`) when unemployed and opens a Company Info dialog (`.window.dlg-290`–`.dlg-297`).
- `lavoro-offer-and-quiz` opens a random company Job Offer (`.window.dlg-390`–`.dlg-397`) from `🔍 Cerca lavoro` (`button.control110`), proceeds via `button.control1` to an Attitudinal Quiz (`.window.dlg-200`–`.dlg-209`), checks one option in each of Questions A, B, and C, and submits via `button.quiz-submit-btn`.

## How to get to it (user POV)

- From the Dashboard (`.window.dlg-1`), tap `💼 Lavoro` (`.dashboard-nav-grid button.control137`).
- Inside `.window.dlg-13`, tap `ℹ️ Informazioni` (`button.control114`) while unemployed to browse the Company List (`.window.dlg-210`).
- Inside `.window.dlg-13`, tap `🔍 Cerca lavoro` (`button.control110`) while unemployed to receive a Job Offer (`.window.dlg-390`–`.dlg-397`), then tap `Mi presento` (`button.control1`) to enter the Attitudinal Quiz (`.window.dlg-200`–`.dlg-209`).

## Driving it with verify-tabboz

Preconditions:

- `node .cursor/skills/verify-tabboz/helpers/verify-tabboz.js doctor --run-id verify-1` reports `ok: true`.
- Fresh game booted to Dashboard (`.window.dlg-1`) on a non-holiday weekday (`numeroditta == 0` unemployed, `x_vacanza != 2`).

- **Automated full journey.** Run `node .cursor/skills/verify-tabboz/helpers/verify-tabboz.js drive lavoro --run-id verify-1`. The command executes all steps below and writes proof artifacts to `/tmp/tabboz-evidence-verify-1/lavoro/`.
- **Open Lavoro & verify unemployed guard.** Tap `.dashboard-nav-grid button.control137` to open `.window.dlg-13`. Tap `.dlg-13 button.control111` (`🚪 Licenziati`). `#tm-overlays .window.messagebox` appears with `"Forse non ti ricordi che sei disokkupato..."`; wait ~350ms and tap `button.control1` (`OK`).
- **Browse Company List & Company Info.** Tap `.dlg-13 button.control114` (`ℹ️ Informazioni`). `.window.dlg-210` opens with 8 company buttons in `.company-buttons-list button.dlg_item`. Tap `.dlg-210 button.control100` (`Acciaierie Mandingo`); `.window.dlg-290` opens with `.company-info-card`. Tap `.dlg-290 button.control1` (`✓ Chiudi Informazioni`) to return to `.window.dlg-210`, then tap `.dlg-210 button.control1` (`✓ Torna Indietro`) to return to `.window.dlg-13`.
- **Open Job Offer & complete Attitudinal Quiz.** Tap `.dlg-13 button.control110` (`🔍 Cerca lavoro`). A Job Offer dialog (`[class*="dlg-39"]`) opens; tap `button.control1` (`Mi presento`). An Attitudinal Quiz dialog (`[class*="dlg-20"]`) opens with three `.quiz-question-card` blocks (`Domanda A`, `Domanda B`, `Domanda C`). Tap `.quiz-option-card` first option in each of the 3 question cards so each has `.selected`, then tap `button.quiz-submit-btn` (`✓ Clicca qui quando hai finito il test !`).
- **Dismiss Quiz outcome & return to Dashboard.** Dismiss the resulting `#tm-overlays .window.messagebox` (either `"SEI STATO ASSUNTO !"` or `"non sei riuscito a superare il test..."`) via `button.control1`, drain any `Evento(hDlg)` overlays, and tap `.dlg-13 button.control1` (`✓ Torna alla Dashboard`).
- **Proof.** Run `node .cursor/skills/verify-tabboz/helpers/verify-tabboz.js evidence --run-id verify-1 --feature lavoro`. Confirm `01-lavoro-unemployed.png` through `08-dashboard-after-lavoro.png` exist and `pageErrors` is `[]`.

## Gotchas

- `🔍 Cerca lavoro` (`button.control110` in `.window.dlg-13`) does **not** open `.window.dlg-210` (Elenco Ditte); it directly opens a random company's Job Offer (`.window.dlg-390`–`.dlg-397`). To open `.window.dlg-210`, tap `ℹ️ Informazioni` (`button.control114`) while unemployed (`numeroditta == 0`).
- In `lavoro.c` (`Rcheck != 111`), the Attitudinal Quiz requires **exactly one** checked option in Question A (`control101..103`), **one** in Question B (`control104..106`), and **one** in Question C (`control107..109`). Checking zero or multiple boxes in any question block triggers the `"Sei un po' stupido..."` refusal `MessageBox` without evaluating the application.
- Even with valid quiz answers (`Rcheck == 111`), hiring is probabilistic (`(Reputazione + Fortuna + random(80)) > random(200)`). Both the hired (`"SEI STATO ASSUNTO !"`) and rejected (`"non sei riuscito a superare il test"`) `MessageBox` outcomes prove the quiz submission path executed through the C engine.
