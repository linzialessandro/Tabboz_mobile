#!/usr/bin/env python3
"""Local static server for Tabboz Mobile (and the original desktop emulator)."""

import http.server
import os
from pathlib import Path

PORT = int(os.environ.get("PORT", "8080"))
DIRECTORY = Path(__file__).resolve().parent


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIRECTORY), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def translate_path(self, path):
        if path.startswith("/mobile/resources/"):
            path = path[len("/mobile"):]
        return super().translate_path(path)

    def guess_type(self, path):
        if path.endswith(".wasm"):
            return "application/wasm"
        if path.endswith(".js"):
            return "application/javascript"
        if path.endswith(".json"):
            return "application/json"
        if path.endswith(".wav"):
            return "audio/wav"
        if path.endswith(".ico"):
            return "image/x-icon"
        if path.endswith(".gif"):
            return "image/gif"
        if path.endswith(".png"):
            return "image/png"
        if path.endswith(".webmanifest") or path.endswith("manifest.json"):
            return "application/manifest+json"
        return super().guess_type(path)


if __name__ == "__main__":
    httpd = http.server.ThreadingHTTPServer(("", PORT), Handler)
    print(f"Serving {DIRECTORY} at http://localhost:{PORT}/", flush=True)
    print(f"Mobile:  http://localhost:{PORT}/mobile/", flush=True)
    print(f"Desktop: http://localhost:{PORT}/desktop.html", flush=True)
    httpd.serve_forever()
