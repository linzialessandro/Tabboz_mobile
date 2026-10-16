/**
 * Parse the mobile shell and the static server. No style rules.
 * Run: npm run check:syntax
 */
'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function walk(dir, out) {
    for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) walk(full, out);
        else if (name.endsWith('.js')) out.push(full);
    }
}

const files = [
    path.join(ROOT, 'eslint.config.js'),
    path.join(ROOT, 'scripts', 'syntax-check.js'),
    path.join(ROOT, 'mobile', 'sw.js')
];
walk(path.join(ROOT, 'mobile', 'js'), files);
walk(path.join(ROOT, 'mobile', 'e2e'), files);

let failed = 0;
const seen = new Set();
for (const file of files) {
    if (seen.has(file)) continue;
    seen.add(file);
    const res = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (res.status !== 0) {
        failed += 1;
        process.stderr.write(res.stderr || res.stdout || '');
        console.error('syntax error:', path.relative(ROOT, file));
    }
}

const server = path.join(ROOT, 'server.py');
const py = spawnSync('python3', ['-c',
    'import ast, pathlib, sys; ast.parse(pathlib.Path(sys.argv[1]).read_text(encoding="utf-8"))',
    server
], { encoding: 'utf8' });
if (py.status !== 0) {
    failed += 1;
    process.stderr.write(py.stderr || py.stdout || '');
    console.error('syntax error: server.py');
}

if (failed) {
    console.error(failed + ' syntax check(s) failed');
    process.exit(1);
}

console.log('syntax ok (' + seen.size + ' js files + server.py)');
