/**
 * Play-tests for bugs found by driving Tabboz Mobile in a phone viewport.
 *
 *   python3 server.py
 *   node mobile/e2e/bugs.js
 *
 * Touch, 390×844 portrait and 844×390 landscape.
 * Uses Playwright's Chromium when TABBOZ_BROWSER=playwright (CI).
 * Otherwise uses CHROME, or /usr/bin/google-chrome when that file exists.
 * On failure, screenshots and error.txt land in mobile/e2e/artifacts/.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const assert = require('assert');

const BASE = process.env.TABBOZ_URL || 'http://127.0.0.1:8080/mobile/';
const NOME_KEY = 'HKEY_CURRENT_USER\\Software\\Obscured Truckware\\Tabboz Simulator 32\\Nome';
const ARTIFACTS = path.join(__dirname, 'artifacts');
const openPages = [];

function launchOptions() {
    const options = {
        headless: true,
        args: ['--no-sandbox', '--disable-dev-shm-usage']
    };
    if (process.env.TABBOZ_BROWSER === 'playwright') return options;
    if (process.env.CHROME) {
        options.executablePath = process.env.CHROME;
        return options;
    }
    const candidates = [
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium'
    ];
    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            options.executablePath = candidate;
            return options;
        }
    }
    return options;
}

function clearShots() {
    fs.mkdirSync(ARTIFACTS, { recursive: true });
    for (const name of fs.readdirSync(ARTIFACTS)) {
        if (name.endsWith('.png') || name === 'error.txt') {
            fs.unlinkSync(path.join(ARTIFACTS, name));
        }
    }
}

async function capture(err) {
    fs.mkdirSync(ARTIFACTS, { recursive: true });
    const lines = [String(err && err.stack || err), ''];
    for (const entry of openPages) {
        lines.push('--- ' + entry.label + ' pageerrors ---');
        lines.push(entry.errors.join('\n') || '(none)');
        lines.push('--- ' + entry.label + ' dialogs ---');
        lines.push(entry.dialogs.join('\n') || '(none)');
        lines.push('--- ' + entry.label + ' console errors ---');
        lines.push(entry.consoleErrors.join('\n') || '(none)');
        if (entry.page.isClosed()) continue;
        const file = path.join(ARTIFACTS, 'failure-' + entry.label + '.png');
        try {
            await entry.page.screenshot({ path: file, fullPage: true });
            lines.push('screenshot: ' + file);
        } catch (shotErr) {
            lines.push('screenshot failed: ' + shotErr.message);
        }
    }
    fs.writeFileSync(path.join(ARTIFACTS, 'error.txt'), lines.join('\n'));
}

async function boot(browser, width, height) {
    const context = await browser.newContext({
        viewport: { width, height },
        hasTouch: true,
        isMobile: true,
        deviceScaleFactor: 1
    });
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    const errors = [];
    const dialogs = [];
    const consoleErrors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('dialog', (dialog) => {
        dialogs.push(dialog.type() + ': ' + dialog.message());
        dialog.accept().catch(() => {});
    });
    const label = width + 'x' + height;
    openPages.push({ page, label, errors, dialogs, consoleErrors });

    const started = Date.now();
    let lastErr = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 20000 });
            lastErr = null;
            break;
        } catch (err) {
            lastErr = err;
            await page.waitForTimeout(400);
        }
    }
    if (lastErr) throw lastErr;

    const start = page.locator('button', { hasText: 'TOCCA PER GIOCARE' });
    await start.waitFor({ state: 'visible', timeout: 45000 });
    await start.tap();
    await page.locator('.dashboard-nav-grid button', { hasText: 'Scuola' }).waitFor({
        state: 'visible',
        timeout: 20000
    });
    await page.waitForFunction((key) => !!localStorage.getItem(key), NOME_KEY, { timeout: 20000 });
    await page.waitForFunction(() => !document.querySelector('.window.dlg-14'), undefined, { timeout: 5000 });
    console.log('boot ' + label + ' ' + (Date.now() - started) + 'ms');
    return { context, page, errors, dialogs };
}

(async () => {
    clearShots();
    let browser;
    try {
        browser = await chromium.launch(launchOptions());

        const phone = await boot(browser, 390, 844);
        const panelPromise = phone.page.waitForSelector('#save-manager-modal');
        await phone.page.locator('#save-manager-open').tap();
        await panelPromise;
        const panel = await phone.page.locator('#save-manager-modal').innerText();
        assert.ok(panel.includes('Tizio Caio'), 'save panel should show the live name');
        assert.ok(panel.includes('10000 L.'), 'save panel should show the live money');
        assert.ok(!panel.includes('Tabbozzo'), 'save panel must not invent Tabbozzo');
        assert.ok(!/Data:\s*1\/10/.test(panel), 'save panel must not invent 1/10');

        await phone.page.locator('#save-manager-modal button', { hasText: 'Salva in questo Slot' }).first().tap();
        await phone.page.waitForFunction(() => {
            const raw = localStorage.getItem('tabboz_slot_1');
            if (!raw) return false;
            const data = JSON.parse(raw);
            return data && data.registry && Object.keys(data.registry).length > 5;
        }, undefined, { timeout: 15000 });

        await phone.page.locator('#save-manager-modal [data-action="close"]').tap();
        await phone.page.waitForFunction(() => !document.getElementById('save-manager-modal'));
        // Measure while the dashboard is the visible window. Opening Scuola
        // hides dialog 1, and a hidden name has an empty box.
        const nameHit = await phone.page.evaluate(() => {
            const name = document.querySelector('.dlg-1 .control102').getBoundingClientRect();
            const save = document.getElementById('save-manager-open').getBoundingClientRect();
            const overlapsBox = (a, b) => !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
            return {
                overlap: name.width > 0 && name.height > 0 && overlapsBox(name, save),
                name: { x: name.x, y: name.y, w: name.width, h: name.height },
                save: { x: save.x, y: save.y, w: save.width, h: save.height }
            };
        });
        assert.ok(nameHit.name.w > 0 && nameHit.name.h > 0, 'dashboard name has no box');
        assert.strictEqual(nameHit.overlap, false, 'save button covers the name ' + JSON.stringify(nameHit));

        await phone.page.locator('button', { hasText: 'Scuola' }).tap();
        const studia = phone.page.locator('button', { hasText: 'Studia' });
        await studia.waitFor();
        const studiaBox = await studia.boundingBox();
        const viewport = phone.page.viewportSize();
        assert.ok(studiaBox, 'Studia has no box');
        assert.ok(
            studiaBox.y >= -1 && studiaBox.y + studiaBox.height <= viewport.height + 1,
            'Studia must be on screen'
        );

        const closeHit = await phone.page.evaluate(() => {
            const save = document.getElementById('save-manager-open').getBoundingClientRect();
            const close = document.querySelector('.dlg-10 .control61536');
            const cb = close ? close.getBoundingClientRect() : null;
            const overlapsBox = (a, b) => !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
            return {
                overlap: cb ? overlapsBox(cb, save) : true,
                close: cb ? { x: cb.x, y: cb.y, w: cb.width, h: cb.height } : null,
                save: { x: save.x, y: save.y, w: save.width, h: save.height }
            };
        });
        assert.ok(closeHit.close && closeHit.close.w > 0, 'Chiudi has no box');
        assert.strictEqual(closeHit.overlap, false, 'save button covers Chiudi ' + JSON.stringify(closeHit));
        assert.deepStrictEqual(phone.errors, []);
        assert.deepStrictEqual(phone.dialogs, []);

        await phone.page.locator('.dlg-10 .control61536').tap();
        await phone.page.waitForFunction(() => !document.querySelector('.window.dlg-10'));
        await phone.page.locator('#save-manager-open').tap();
        await phone.page.waitForSelector('#save-manager-modal');
        for (let k = 0; k < 2; k++) {
            await phone.page.locator('#save-manager-modal button', { hasText: 'Salva in questo Slot' }).first().tap();
            await phone.page.waitForTimeout(150);
        }
        await phone.page.locator('#save-manager-modal button', { hasText: 'Sovrascrivi' }).first().tap();
        await phone.page.waitForTimeout(150);
        await phone.page.locator('#save-manager-modal button', { hasText: '✕' }).nth(1).tap();
        await phone.page.waitForTimeout(150);
        await phone.page.locator('#save-manager-modal button', { hasText: 'Sovrascrivi' }).first().tap();
        await phone.page.waitForTimeout(150);
        await phone.page.locator('#save-manager-modal [data-action="close"]').tap();
        await phone.page.waitForFunction(() => !document.getElementById('save-manager-modal'));

        await phone.page.locator('.dashboard-nav-grid button', { hasText: 'Lavoro' }).tap();
        await phone.page.locator('button', { hasText: 'Licenziati' }).tap();
        const msgBox = phone.page.locator('#tm-overlays .window.messagebox');
        await msgBox.waitFor({ state: 'visible' });
        const msgId = await msgBox.getAttribute('id');
        assert.notStrictEqual(msgId, 'win0', 'messagebox must receive a valid non-zero hWnd');
        const msgFit = await phone.page.evaluate(() => {
            const m = document.querySelector('#tm-overlays .window.messagebox');
            const c = m.querySelector('.content');
            const orig = c.innerText;
            c.innerText = orig + '\n\n' + Array(30).fill('Errore irrecuperabile: Quando andrai meglio a scuola potrai avere più soldi.').join(' ');
            const r = m.getBoundingClientRect();
            const ok = m.querySelector('button.control1').getBoundingClientRect();
            const tb = m.querySelector('.title-bar').getBoundingClientRect();
            c.innerText = orig;
            return {
                y: r.y,
                bottom: r.y + r.height,
                w: r.width,
                okBottom: ok.y + ok.height,
                tbTop: tb.y,
                vh: window.innerHeight
            };
        });
        assert.ok(msgFit.w >= 300, 'messagebox should use available width: ' + JSON.stringify(msgFit));
        assert.ok(msgFit.y >= 0 && msgFit.bottom <= msgFit.vh, 'long messagebox must fit inside viewport: ' + JSON.stringify(msgFit));
        assert.ok(msgFit.tbTop >= 0 && msgFit.okBottom <= msgFit.vh, 'messagebox title bar and OK must stay visible: ' + JSON.stringify(msgFit));
        await phone.page.waitForTimeout(450);
        await msgBox.locator('button', { hasText: 'OK' }).tap();
        await phone.page.waitForFunction(() => !document.querySelector('#tm-overlays .window.messagebox'));

        await phone.page.evaluate(() => {
            const prefix = 'HKEY_CURRENT_USER\\Software\\Obscured Truckware\\Tabboz Simulator 32\\';
            localStorage.setItem(prefix + 'Giorno', '{"":"7"}');
            localStorage.setItem(prefix + 'Mese', '{"":"12"}');
        });
        await phone.page.reload({ waitUntil: 'domcontentloaded' });
        const holidayBox = phone.page.locator('#tm-overlays .window.messagebox');
        await holidayBox.waitFor({ state: 'visible' });
        await phone.page.waitForTimeout(450);
        await holidayBox.locator('button', { hasText: 'OK' }).tap();
        await phone.page.locator('button', { hasText: 'TOCCA PER GIOCARE' }).waitFor({ state: 'visible' });
        assert.deepStrictEqual(phone.errors, []);
        await phone.context.close();

        const land = await boot(browser, 844, 390);
        await land.page.locator('.dashboard-nav-grid button').nth(7).waitFor();
        const nav = await land.page.locator('.dashboard-nav-grid button').evaluateAll((buttons) => {
            return buttons.map((b) => {
                const r = b.getBoundingClientRect();
                return r.width > 0 && r.top >= -1 && r.bottom <= window.innerHeight + 2;
            });
        });
        assert.strictEqual(nav.length, 8);
        assert.ok(nav.every(Boolean), 'landscape dashboard buttons must be on screen');
        assert.deepStrictEqual(land.errors, []);
        assert.deepStrictEqual(land.dialogs, []);
        await land.context.close();

        const shortPortrait = await boot(browser, 360, 640);
        await shortPortrait.page.locator('.dashboard-nav-grid button').nth(7).waitFor();
        const shortHits = await shortPortrait.page.evaluate(() => {
            const buttons = [
                ...document.querySelectorAll('.dashboard-nav-grid button'),
                ...document.querySelectorAll('.window.dlg-1 button.control120')
            ];
            return buttons.map((b) => {
                const r = b.getBoundingClientRect();
                const cx = r.left + r.width / 2;
                const cy = r.top + r.height / 2;
                const inViewport = r.width > 0 && r.height > 0 && r.top >= -1 && r.bottom <= window.innerHeight + 1 && r.left >= -1 && r.right <= window.innerWidth + 1;
                const hit = inViewport ? document.elementFromPoint(cx, cy) : null;
                return {
                    label: (b.innerText || '').replace(/\s+/g, ' ').trim(),
                    top: Math.round(r.top),
                    bottom: Math.round(r.bottom),
                    ok: Boolean(hit && (hit === b || b.contains(hit)))
                };
            });
        });
        assert.strictEqual(shortHits.length, 9, 'expected 8 nav buttons + Info button at 360x640');
        assert.ok(shortHits.every((h) => h.ok), '360x640 dashboard buttons must pass elementFromPoint: ' + JSON.stringify(shortHits));
        assert.deepStrictEqual(shortPortrait.errors, []);
        assert.deepStrictEqual(shortPortrait.dialogs, []);
        await shortPortrait.context.close();

        console.log('e2e ok');
    } catch (err) {
        await capture(err);
        console.error(err);
        process.exitCode = 1;
    } finally {
        if (browser) await browser.close().catch(() => {});
    }
})();
