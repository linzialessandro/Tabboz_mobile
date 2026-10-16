# Agents

Tabboz_mobile is a mobile PWA port of **Tabboz Simulator**, the classic Italian freeware game. The playable shell lives in [`mobile/`](mobile/) and is served by `python3 server.py` (port 8080). The C/WebAssembly engine and the original Italian text stay as they are. The mobile layer is presentation, save slots, and the Win32 bridge the engine already expects.

Player-facing overview: [`README.md`](README.md) and [`mobile/README.md`](mobile/README.md). Bugs found by playing the PWA: [`BUG_REPORT.md`](BUG_REPORT.md).

## Run

```bash
python3 server.py
# Mobile PWA: http://127.0.0.1:8080/mobile/
# Desktop:    http://127.0.0.1:8080/desktop.html
```

## Tests

Every change must keep these green before it is ready for review. GitHub Actions (`.github/workflows/ci.yml`) runs them on every pull request and on every push to `main`.

```bash
npm ci
npm run check
# syntax (node --check on the mobile shell + server.py AST)
# eslint (mobile/js, mobile/e2e, mobile/sw.js only)
# node mobile/js/test.js
```

End-to-end, in a second terminal after the server is up:

```bash
npx playwright install chromium
TABBOZ_URL=http://127.0.0.1:8080/mobile/ TABBOZ_BROWSER=playwright npm run test:e2e
```

`npm run test:e2e` is `node mobile/e2e/bugs.js`. It uses touch and two phone sizes: **390×844** portrait and **844×390** landscape. CI installs Playwright's Chromium and sets `TABBOZ_BROWSER=playwright`. On a machine that already has Google Chrome, omit `TABBOZ_BROWSER` and the suite uses `/usr/bin/google-chrome` (or `CHROME=/path/to/chrome`).

A failing e2e run writes screenshots and `error.txt` to `mobile/e2e/artifacts/`. CI uploads that directory.

## When you change the game

- Add a Playwright repro in `mobile/e2e/bugs.js` for each bug you fix, and drive it the way a phone does (touch, portrait and landscape).
- Keep the original game's content, spirit, and Italian text intact. Do not rewrite dialogue, rename the cast, or "clean up" the engine to satisfy a tool.
- Keep fixes focused.
- Lint and syntax checks cover the mobile shell only. Do not churn `zarrosim.js`, `zarrosim.wasm`, `resources/`, or `mobile/resources/` to satisfy the linter.
- When you ship JS or CSS, bump `ASSET_VERSION` in [`mobile/js/version.js`](mobile/js/version.js) and nowhere else. That file is the only cache-busting source (`sw.js` reads it).

## Known issues

**Personal Information** (command 139) and **Configuration** (command 140) exist only in the hidden Windows 95 menu (`display: none`). The generic mobile layout scrambles both dialogs (mixed labels, English skill text, an easy-to-miss OK). Leave that menu hidden until each screen has a real mobile layout. The normal play path never opens them.
