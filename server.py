import http.server
import os

PORT = 8080
DIRECTORY = "/Users/alessandro/antigravity/Tabboz_mobile"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def guess_type(self, path):
        if path.endswith('.wasm'):
            return 'application/wasm'
        if path.endswith('.js'):
            return 'application/javascript'
        if path.endswith('.wav'):
            return 'audio/wav'
        if path.endswith('.ico'):
            return 'image/x-icon'
        if path.endswith('.gif'):
            return 'image/gif'
        if path.endswith('.png'):
            return 'image/png'
        return super().guess_type(path)

if __name__ == '__main__':
    httpd = http.server.ThreadingHTTPServer(("", PORT), Handler)
    print(f"Threading server running at http://localhost:{PORT}/")
    httpd.serve_forever()
