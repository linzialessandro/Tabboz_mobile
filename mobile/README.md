# Tabboz Mobile

Mobile-first PWA shell around the original Tabboz Simulator WebAssembly engine.

The C/WASM game is unchanged. This directory is only presentation, persistence,
and the Win32 ABI that Novantotto expects (`dialogBox`, `waitEvent`,
`setDlgItemText`, …).

## Layout

| File | Responsibility |
| --- | --- |
| `js/config.js` | Asset version, resource paths, dialog IDs, save limits |
| `js/ui-kit.js` | Shared DOM helpers (control IDs, command posting, layout primitives) |
| `js/screens.js` | Per-dialog transformers + registry (`TM.resolveTransformer`) |
| `js/win32-bridge.js` | Novantotto/Win32 ABI used by `zarrosim.js` |
| `js/save-manager.js` | Multi-slot saves, export/import, reset (validated) |
| `js/boot.js` | Emscripten `Module`, save button, service worker |
| `sw.js` | Offline cache: network-first for code, cache-first for media |
| `css/mobile.css` | Mobile layout |

Scripts load as classic files (no bundler) so GitHub Pages and the local
`server.py` work without a build step. Bump `ASSET_VERSION` in `config.js`
and the `?v=` query strings in `index.html` / `sw.js` together.

## Engine contract

`zarrosim.js` + `zarrosim.wasm` live in the repository root (same artifacts as
the original desktop web port). `boot.js` points `Module.locateFile` at
`../zarrosim.wasm`. Do not keep a second copy of the WASM file under `mobile/`.

Dialog HTML still comes from `resources/dialogs/includes/*.inc.html`.
Transformers **must keep** the original `.controlN` / `.dlg_item` nodes so the
C engine can read and write them.

To add a screen: write a `transformX(win, hWnd)` in `screens.js` and register
it in `exact` or `ranges`. Do not add another `if (dialogNum === …)` in the
bridge.

## Upstream PR

This fork currently redirects `/` to `mobile/` for GitHub Pages. The original
desktop emulator is preserved as `/desktop.html`. An upstream PR should keep
the original root `index.html` and add `mobile/` as an additional experience.

## Tests

```bash
node mobile/js/save-manager.test.js
```
