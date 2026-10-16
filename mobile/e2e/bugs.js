/**
 * Play-tests for bugs found by driving Tabboz Mobile in a phone viewport.
 *
 *   python3 server.py
 *   node mobile/e2e/bugs.js
 *
 * Requires Playwright and Chrome (google-chrome on PATH, or CHROME=...).
 */
'use strict';

const { chromium } = require('playwright');
const assert = require('assert');

const BASE = process.env.TABBOZ_URL || 'http://localhost:8080/mobile/';
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';
const NOME_KEY = 'HKEY_CURRENT_USER\\Software\\Obscured Truckware\\Tabboz Simulator 32\\Nome';

async function boot(browser, width, height) {
    const context = await browser.newContext({
        viewport: { width, height },
        hasTouch: true,
        isMobile: true,
        deviceScaleFactor: 1
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.locator('button', { hasText: 'TOCCA PER GIOCARE' }).tap();
    await page.waitForFunction((key) => !!localStorage.getItem(key), NOME_KEY, { timeout: 8000 });
    return { context, page, errors };
}

(async () => {
    const browser = await chromium.launch({
        executablePath: CHROME,
        headless: true,
        args: ['--no-sandbox', '--disable-dev-shm-usage']
    });

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
    });

    await phone.page.locator('#save-manager-modal [data-action="close"]').tap();
    await phone.page.locator('button', { hasText: 'Scuola' }).tap();
    await phone.page.locator('button', { hasText: 'Studia' }).waitFor();
    const studiaBox = await phone.page.locator('button', { hasText: 'Studia' }).boundingBox();
    assert.ok(studiaBox.y >= 0 && studiaBox.y + studiaBox.height <= 844, 'Studia must be on screen');

    const hit = await phone.page.evaluate(() => {
        const name = document.querySelector('.dlg-1 .control102').getBoundingClientRect();
        const save = document.getElementById('save-manager-open').getBoundingClientRect();
        const close = document.querySelector('.dlg-10 .control61536');
        const cb = close ? close.getBoundingClientRect() : null;
        return {
            nameSave: !(name.right < save.left || name.left > save.right || name.bottom < save.top || name.top > save.bottom),
            closeSave: cb ? !(cb.right < save.left || cb.left > save.right || cb.bottom < save.top || cb.top > save.bottom) : false
        };
    });
    assert.strictEqual(hit.nameSave, false, 'save button covers the name');
    assert.strictEqual(hit.closeSave, false, 'save button covers Chiudi');
    assert.deepStrictEqual(phone.errors, []);
    await phone.context.close();

    const land = await boot(browser, 844, 390);
    const nav = await land.page.locator('.dashboard-nav-grid button').evaluateAll((buttons) => {
        return buttons.map((b) => {
            const r = b.getBoundingClientRect();
            return r.top >= 0 && r.bottom <= window.innerHeight + 1;
        });
    });
    assert.strictEqual(nav.length, 8);
    assert.ok(nav.every(Boolean), 'landscape dashboard buttons must be on screen');
    assert.deepStrictEqual(land.errors, []);
    await land.context.close();

    await browser.close();
    console.log('e2e ok');
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
