# Tabboz Mobile

Mobile-first PWA shell around the original Tabboz Simulator WebAssembly engine.

The C/WASM game is unchanged. This directory is only presentation, persistence,
and the Win32 ABI that Novantotto expects (`dialogBox`, `waitEvent`,
`setDlgItemText`, …).

## Layout

| File | Responsibility |
| --- | --- |
| `js/version.js` | **Only** place to bump the cache-busting version (also loads CSS/JS) |
| `js/config.js` | Resource paths, dialog IDs, save limits |
| `js/ui-kit.js` | Shared DOM helpers (control IDs, command posting) |
| `js/screens/register.js` | Transformer registry (`TM.transformDialog`) |
| `js/screens/home.js` | Dashboard, about, splash, exit, generic fallback |
| `js/screens/life.js` | Scuola, disco, famiglia, compagnia, tipa |
| `js/screens/shops.js` | Negozi, boutiques, tabacchi, palestra, scooter |
| `js/screens/jobs.js` | Lavoro, quiz, companies, job offers |
| `js/screens/phone.js` | Cellulare store (dialogs 120–123) |
| `js/screens/events.js` | Random events / “metallaro” beatdown |
| `js/win32-bridge.js` | Novantotto/Win32 ABI used by `zarrosim.js` |
| `js/save-manager.js` | Multi-slot saves, export/import, reset (validated) |
| `js/boot.js` | Emscripten `Module`, save button, service worker |
| `js/test.js` | Node tests for saves, control IDs, and the registry |
| `sw.js` | Offline cache: network-first for code, cache-first for media |
| `css/*.css` | Layout, split on the same domain lines as `js/screens/` |

Scripts load as classic files (no bundler) so GitHub Pages and `server.py`
work without a build step. Bump `ASSET_VERSION` in `js/version.js` only.

## Engine contract

`zarrosim.js` + `zarrosim.wasm` live in the repository root (same artifacts as
the original desktop web port). `boot.js` points `Module.locateFile` at
`../zarrosim.wasm`.

Dialog HTML still comes from `resources/dialogs/includes/*.inc.html`.
Transformers **must keep** the original `.controlN` / `.dlg_item` nodes so the
C engine can read and write them.

To add a screen: write `transformX(win, hWnd)` in the matching `js/screens/*.js`
file and call `TM.registerTransformers` / `TM.registerRanges`. Do not add
routing in the Win32 bridge.

## Upstream PR

The original desktop emulator stays at the site root (`index.html`). This
directory is an additional experience at `/mobile/`.

## Tests

```bash
node mobile/js/test.js
```
