<div align="center">
  <a href="https://andreax79.github.io/tabboz/" target="_blank"><img alt="Tabboz Simulator" src="https://github.com/andreax79/tabboz/assets/1288154/64269165-8958-4f3a-945a-82c3ffffd4de"/></a>
</div>
<br/>

Simply tap the icon to launch the Tabboz Simulator directly in your browser.

## 📱 Mobile PWA

A touch-first Progressive Web App lives in [`mobile/`](mobile/). It keeps the
original C/WebAssembly engine and Novantotto Win32 ABI; only the presentation
layer is new (save slots, installable PWA, vertical layout).

- Play: open [`mobile/`](mobile/) (this fork’s Pages preview: [Tabboz Mobile](https://linzialessandro.github.io/Tabboz_mobile/mobile/))
- Architecture: [`mobile/README.md`](mobile/README.md)

```shell
python3 server.py
# Desktop emulator: http://localhost:8080/
# Mobile PWA:       http://localhost:8080/mobile/
node mobile/js/test.js
```

## 🖥️ Web development

<div align="center">
  <a href="https://andreax79.github.io/tabboz/" target="_blank"><img alt="Tabboz Simulator Screenshot" src="https://github.com/andreax79/tabboz/assets/1288154/0999ef77-3e7a-45a0-9a0b-1206a6f5bddd"/></a>
</div>
<br/>

### 📖 Prerequisites

In order to compile the project we need the following software installed on our development machine:
- Python >= 3.8
- [Emscripten](https://emscripten.org/)

### 📦 Builds

Build the project.

```shell
make build
```

We also have a script for updating dialogs used in the project, you only need to run this if you modify the `.rc` files:

```shell
make rc
```

### 🎨 Code linting

To fix the linting errors, use the following command:

```shell
make format
```

### 🚀 Links

- [Novantotto, A tool for porting Windows programs to WebAssembly](https://github.com/andreax79/novantotto)
- [Emscripten, A complete compiler toolchain to WebAssembly](https://emscripten.org/)
- [98.css, A design system for building faithful recreations of old UIs](https://github.com/jdan/98.css)

## ⚖️ LICENSE

[![GPL 3](https://www.gnu.org/graphics/gplv3-or-later.png)](https://www.gnu.org/licenses/gpl-3.0.en.html)

This project is distributed under GPL-3.0, as supplied in [`LICENSE`](LICENSE).
The mobile Win32 bridge adapts Novantotto, available under MPL-2.0; that notice
is retained in [`mobile/js/win32-bridge.js`](mobile/js/win32-bridge.js).
Original authorship: Andrea Bonomi and Emanuele Caccialanza.
