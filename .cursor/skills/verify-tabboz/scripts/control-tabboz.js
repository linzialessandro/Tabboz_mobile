#!/usr/bin/env node
/**
 * control-tabboz.js — Verification harness for Tabboz Simulator Mobile PWA.
 *
 * Subcommands:
 *   launch   [--run-id <id>] [--port <port>]
 *   doctor   [--run-id <id>]
 *   drive    [--run-id <id>] --feature <dashboard|scuola|lavoro|negozi|tipa|scooter> [--evidence-dir <dir>]
 *   cleanup  [--run-id <id>] [--evidence-dir <dir>]
 *   verify   [--run-id <id>] --feature <name> [--evidence-dir <dir>]
 */
'use strict';

const assert = require('assert');
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const http = require('http');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const NOME_KEY = 'HKEY_CURRENT_USER\\Software\\Obscured Truckware\\Tabboz Simulator 32\\Nome';
const REG_PREFIX = 'HKEY_CURRENT_USER\\Software\\Obscured Truckware\\Tabboz Simulator 32\\';

function parseArgs(argv) {
    const args = { _: [] };
    for (let i = 0; i < argv.length; i++) {
        const token = argv[i];
        if (token.startsWith('--')) {
            const eq = token.indexOf('=');
            if (eq !== -1) {
                args[token.slice(2, eq)] = token.slice(eq + 1);
            } else {
                const key = token.slice(2);
                const next = argv[i + 1];
                if (next !== undefined && !next.startsWith('--')) {
                    args[key] = next;
                    i++;
                } else {
                    args[key] = true;
                }
            }
        } else {
            args._.push(token);
        }
    }
    return args;
}

function stateDirFor(runId) {
    return path.join('/tmp', `tabboz-verify-${runId}`);
}

function instanceFileFor(runId) {
    return path.join(stateDirFor(runId), 'instance.json');
}

function defaultEvidenceDirFor(runId) {
    return path.join('/tmp', `tabboz-evidence-${runId}`);
}

function readDiskAssetVersion() {
    const versionFile = path.join(REPO_ROOT, 'mobile', 'js', 'version.js');
    const src = fs.readFileSync(versionFile, 'utf8');
    const match = src.match(/ASSET_VERSION\s*=\s*['"]([^'"]+)['"]/);
    if (!match) {
        throw new Error(`Could not parse ASSET_VERSION from ${versionFile}`);
    }
    return match[1];
}

function loadPlaywright() {
    const candidates = [
        'playwright',
        'playwright-core',
        '/workspace/tabboz-play/node_modules/playwright',
        '/node_modules/playwright-core'
    ];
    for (const mod of candidates) {
        try {
            return require(mod);
        } catch (_err) {
            // Try next candidate
        }
    }
    throw new Error('Playwright not found. Install via `npm ci` or ensure playwright-core is resolvable.');
}

function resolveBrowserLaunchOptions() {
    const options = {
        headless: true,
        args: ['--no-sandbox', '--disable-dev-shm-usage']
    };
    if (process.env.TABBOZ_BROWSER === 'playwright') {
        return options;
    }
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

function checkPortFree(port) {
    const res = spawnSync(
        'python3',
        [
            '-c',
            'import socket, sys; s = socket.socket(socket.AF_INET, socket.SOCK_STREAM); s.bind(("", int(sys.argv[1]))); s.close()',
            String(port)
        ],
        { stdio: 'ignore' }
    );
    return Promise.resolve(res.status === 0);
}

async function findFreePort(startPort = 8081, maxPort = 8199) {
    for (let port = startPort; port <= maxPort; port++) {
        if (await checkPortFree(port)) {
            return port;
        }
    }
    throw new Error(`No free TCP port found in range ${startPort}-${maxPort}`);
}

function httpGet(url, timeoutMs = 3000) {
    return new Promise((resolve, reject) => {
        const req = http.get(url, { timeout: timeoutMs }, (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: Buffer.concat(chunks)
                });
            });
        });
        req.on('timeout', () => {
            req.destroy(new Error(`Timeout fetching ${url}`));
        });
        req.on('error', reject);
    });
}

function isPidAlive(pid) {
    try {
        process.kill(pid, 0);
        return true;
    } catch (_err) {
        return false;
    }
}

function isOurServerPid(pid) {
    if (!isPidAlive(pid)) return false;
    try {
        const cmdline = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').replace(/\0/g, ' ');
        return cmdline.includes('server.py');
    } catch (_err) {
        return true;
    }
}

async function cmdLaunch(args) {
    const runId = String(args['run-id'] || 'default');
    const stateDir = stateDirFor(runId);
    const instanceFile = instanceFileFor(runId);

    if (fs.existsSync(instanceFile)) {
        const existing = JSON.parse(fs.readFileSync(instanceFile, 'utf8'));
        if (isOurServerPid(existing.pid)) {
            throw new Error(
                `Instance for run-id "${runId}" is already running (PID ${existing.pid} on port ${existing.port}). Run cleanup first.`
            );
        }
        fs.rmSync(stateDir, { recursive: true, force: true });
    }

    let port;
    if (args.port) {
        port = Number(args.port);
        if (port === 8080 && !args['allow-8080']) {
            throw new Error('Port 8080 is reserved for interactive development. Pick a port >= 8081.');
        }
        if (!(await checkPortFree(port))) {
            throw new Error(`Requested port ${port} is already in use.`);
        }
    } else {
        port = await findFreePort(8081, 8199);
    }

    fs.mkdirSync(stateDir, { recursive: true });
    const logFile = path.join(stateDir, 'server.log');
    const logFd = fs.openSync(logFile, 'a');

    const child = spawn('python3', [path.join(REPO_ROOT, 'server.py')], {
        cwd: REPO_ROOT,
        env: { ...process.env, PORT: String(port) },
        detached: true,
        stdio: ['ignore', logFd, logFd]
    });
    child.unref();
    fs.closeSync(logFd);

    const baseUrl = `http://127.0.0.1:${port}/mobile/`;
    const rootUrl = `http://127.0.0.1:${port}`;
    const assetVersion = readDiskAssetVersion();

    const deadline = Date.now() + 10000;
    let ready = false;
    let lastError = null;
    while (Date.now() < deadline) {
        if (!isPidAlive(child.pid)) {
            const logText = fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8') : '';
            fs.rmSync(stateDir, { recursive: true, force: true });
            throw new Error(`server.py exited prematurely.\n${logText}`);
        }
        try {
            const [mobileRes, wasmRes] = await Promise.all([
                httpGet(baseUrl, 1500),
                httpGet(`${rootUrl}/zarrosim.wasm`, 1500)
            ]);
            if (mobileRes.statusCode === 200 && wasmRes.statusCode === 200) {
                ready = true;
                break;
            }
        } catch (err) {
            lastError = err;
        }
        await new Promise((r) => setTimeout(r, 150));
    }

    if (!ready) {
        try {
            process.kill(child.pid, 'SIGTERM');
        } catch (_err) {
            // ignore
        }
        throw new Error(`Server failed readiness check on ${baseUrl}: ${lastError ? lastError.message : 'timeout'}`);
    }

    const instance = {
        runId,
        pid: child.pid,
        port,
        rootUrl,
        baseUrl,
        repoRoot: REPO_ROOT,
        assetVersion,
        logFile,
        startedAt: new Date().toISOString()
    };
    fs.writeFileSync(instanceFile, JSON.stringify(instance, null, 2));
    console.log(JSON.stringify({ status: 'launched', ...instance }, null, 2));
    return instance;
}

async function cmdDoctor(args) {
    const runId = String(args['run-id'] || 'default');
    const instanceFile = instanceFileFor(runId);
    if (!fs.existsSync(instanceFile)) {
        throw new Error(`No instance.json found at ${instanceFile}. Run launch first.`);
    }
    const instance = JSON.parse(fs.readFileSync(instanceFile, 'utf8'));
    const checks = {};

    checks.pidAlive = isPidAlive(instance.pid);
    checks.pidMatchesServer = isOurServerPid(instance.pid);
    if (!checks.pidAlive || !checks.pidMatchesServer) {
        throw new Error(`Server PID ${instance.pid} is not a live server.py process.`);
    }

    if (fs.existsSync(`/proc/${instance.pid}/cwd`)) {
        const procCwd = fs.realpathSync(`/proc/${instance.pid}/cwd`);
        checks.cwdMatchesRepo = procCwd === fs.realpathSync(REPO_ROOT);
        if (!checks.cwdMatchesRepo) {
            throw new Error(`Server CWD (${procCwd}) does not match repo root (${REPO_ROOT}).`);
        }
    }

    const mobileRes = await httpGet(instance.baseUrl);
    const mobileHtml = mobileRes.body.toString('utf8');
    checks.mobileHttp200 = mobileRes.statusCode === 200;
    checks.mobileTitle = mobileHtml.includes('<title>Tabboz Mobile</title>');
    checks.noStoreHeader = String(mobileRes.headers['cache-control'] || '').includes('no-store');

    const versionRes = await httpGet(`${instance.baseUrl}js/version.js`);
    const versionText = versionRes.body.toString('utf8');
    const servedMatch = versionText.match(/ASSET_VERSION\s*=\s*['"]([^'"]+)['"]/);
    const servedVersion = servedMatch ? servedMatch[1] : null;
    const diskVersion = readDiskAssetVersion();
    checks.assetVersionMatches = servedVersion === diskVersion;

    const wasmRes = await httpGet(`${instance.rootUrl}/zarrosim.wasm`);
    checks.wasmHttp200 = wasmRes.statusCode === 200;
    checks.wasmMimeType = String(wasmRes.headers['content-type'] || '').includes('application/wasm');
    checks.wasmBytes = wasmRes.body.length;

    const launchOpts = resolveBrowserLaunchOptions();
    checks.browserExecutable = launchOpts.executablePath || 'playwright-bundled';
    if (launchOpts.executablePath && !fs.existsSync(launchOpts.executablePath)) {
        throw new Error(`Browser executable missing: ${launchOpts.executablePath}`);
    }
    loadPlaywright();
    checks.playwrightResolved = true;

    const allOk =
        checks.mobileHttp200 &&
        checks.mobileTitle &&
        checks.noStoreHeader &&
        checks.assetVersionMatches &&
        checks.wasmHttp200 &&
        checks.wasmMimeType &&
        checks.wasmBytes > 100000;

    if (!allOk) {
        throw new Error(`Doctor checks failed: ${JSON.stringify(checks, null, 2)}`);
    }

    const report = {
        status: 'healthy',
        runId,
        pid: instance.pid,
        port: instance.port,
        baseUrl: instance.baseUrl,
        assetVersion: diskVersion,
        checks
    };
    console.log(JSON.stringify(report, null, 2));
    return report;
}

async function dismissMessageBox(page, expectedSubstring, preferButtonSelector = 'button:visible') {
    const msgBox = page.locator('#tm-overlays .window.messagebox').first();
    await msgBox.waitFor({ state: 'visible', timeout: 10000 });
    const msgId = await msgBox.getAttribute('id');
    const text = (await msgBox.locator('.content').innerText()).trim();
    const title = (await msgBox.locator('.title-bar-text').innerText()).trim();
    if (expectedSubstring) {
        assert.ok(
            text.toLowerCase().includes(expectedSubstring.toLowerCase()) ||
            title.toLowerCase().includes(expectedSubstring.toLowerCase()),
            `Expected MessageBox containing "${expectedSubstring}", got title="${title}" text="${text}"`
        );
    }
    // Wait until win32-bridge.js clears the 400ms pointer-events: none guard on this specific window.
    await page.waitForFunction(
        (id) => {
            const el = document.getElementById(id);
            return el && el.style.pointerEvents !== 'none';
        },
        msgId,
        { timeout: 5000 }
    );
    const btn = msgBox.locator(preferButtonSelector).first();
    await btn.tap();
    await page.waitForFunction(
        ({ id, prevText }) => {
            const el = document.getElementById(id);
            if (!el) return true;
            const c = el.querySelector('.content');
            return !c || c.innerText.trim() !== prevText;
        },
        { id: msgId, prevText: text },
        { timeout: 10000 }
    );
    return { id: msgId, title, text };
}

async function drainRandomEventsAndAlerts(page) {
    const drained = [];
    for (let round = 0; round < 8; round++) {
        await page.waitForTimeout(250);
        const hasMsgBox = await page.locator('#tm-overlays .window.messagebox').isVisible().catch(() => false);
        if (hasMsgBox) {
            const info = await dismissMessageBox(page);
            drained.push({ type: 'messagebox', ...info });
            continue;
        }
        const eventWin = page.locator(
            '.window.dlg-96, .window.dlg-100, .window.dlg-101, .window.dlg-102, .window.dlg-103, .window.dlg-104, .window.dlg-105, .window.dlg-106, .window.dlg-107, .window.dlg-110'
        ).first();
        const hasEvent = await eventWin.isVisible().catch(() => false);
        if (hasEvent) {
            const eventId = await eventWin.getAttribute('id');
            const cls = await eventWin.getAttribute('class');
            const btn = eventWin.locator('button.control1, button.control2, button.mobile-btn').first();
            await btn.tap();
            if (eventId) {
                await page.waitForFunction((id) => !document.getElementById(id), eventId, { timeout: 10000 });
            }
            drained.push({ type: 'event-dialog', id: eventId, className: cls });
            continue;
        }
        break;
    }
    return drained;
}

async function captureStateArtifacts(page, outDir, prefix) {
    fs.mkdirSync(outDir, { recursive: true });
    const screenshotPath = path.join(outDir, `${prefix}.png`);
    const ariaPath = path.join(outDir, `${prefix}.aria.txt`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    let ariaText = '';
    try {
        ariaText = await page.locator('body').ariaSnapshot();
    } catch (_err) {
        ariaText = await page.evaluate(() => document.body.innerText);
    }
    fs.writeFileSync(ariaPath, ariaText + '\n');
    const registry = await page.evaluate((regPrefix) => {
        const out = {};
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && (k.startsWith(regPrefix) || k.startsWith('tabboz_'))) {
                out[k.replace(regPrefix, '')] = localStorage.getItem(k);
            }
        }
        return out;
    }, REG_PREFIX);
    return {
        screenshot: screenshotPath,
        ariaSnapshot: ariaPath,
        registry
    };
}

async function bootMobileSession(browser, baseUrl, width = 390, height = 844) {
    const context = await browser.newContext({
        viewport: { width, height },
        hasTouch: true,
        isMobile: true,
        deviceScaleFactor: 1
    });
    const page = await context.newPage();
    page.setDefaultTimeout(20000);

    const pageErrors = [];
    const consoleErrors = [];
    const nativeDialogs = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('dialog', (dialog) => {
        nativeDialogs.push(`${dialog.type()}: ${dialog.message()}`);
        dialog.accept().catch(() => {});
    });

    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    const startBtn = page.locator('.window.dlg-12 button.control202', { hasText: 'TOCCA PER GIOCARE' });
    await startBtn.waitFor({ state: 'visible', timeout: 45000 });
    await startBtn.tap();

    await page.locator('.window.dlg-1 .dashboard-nav-grid button', { hasText: 'Scuola' }).waitFor({
        state: 'visible',
        timeout: 20000
    });
    await page.waitForFunction((key) => !!localStorage.getItem(key), NOME_KEY, { timeout: 20000 });
    await page.waitForFunction(() => !document.querySelector('.window.dlg-14'), undefined, { timeout: 5000 });

    return { context, page, pageErrors, consoleErrors, nativeDialogs };
}

async function driveDashboard(browser, baseUrl, featureDir) {
    const steps = [];
    const session = await bootMobileSession(browser, baseUrl, 390, 844);
    try {
        const before = await captureStateArtifacts(session.page, featureDir, '01-dashboard-portrait');

        const dashboardState = await session.page.evaluate(() => {
            const nameEl = document.querySelector('.window.dlg-1 .control102');
            const dateEl = document.querySelector('.window.dlg-1 .control157');
            const soldiEl = document.querySelector('.window.dlg-1 .control105, .window.dlg-1 .control150');
            const saveBtn = document.getElementById('save-manager-open');
            const nr = nameEl.getBoundingClientRect();
            const sr = saveBtn.getBoundingClientRect();
            const overlaps = !(nr.right < sr.left || nr.left > sr.right || nr.bottom < sr.top || nr.top > sr.bottom);
            const navButtons = Array.from(document.querySelectorAll('.window.dlg-1 .dashboard-nav-grid button')).map(
                (b) => b.innerText.replace(/\s+/g, ' ').trim()
            );
            return {
                name: nameEl.innerText.trim(),
                date: dateEl.innerText.trim(),
                soldi: soldiEl.innerText.trim(),
                saveOverlapsName: overlaps,
                navButtons
            };
        });
        assert.strictEqual(dashboardState.name, 'Tizio Caio');
        assert.strictEqual(dashboardState.soldi, '10000 L.');
        assert.strictEqual(dashboardState.saveOverlapsName, false);
        assert.strictEqual(dashboardState.navButtons.length, 8);
        steps.push({ step: 'dashboard-initial', ...dashboardState });

        await session.page.locator('#save-manager-open').tap();
        await session.page.locator('#save-manager-modal').waitFor({ state: 'visible' });
        await session.page.locator('#save-manager-modal [data-action="save"][data-slot="1"]').tap();
        await session.page.waitForFunction(() => !!localStorage.getItem('tabboz_slot_1'), undefined, { timeout: 10000 });

        const saveModalProof = await captureStateArtifacts(session.page, featureDir, '02-save-slot-saved');
        const slot1Text = await session.page.locator('#save-manager-modal .save-slot-card').first().innerText();
        assert.ok(slot1Text.includes('Tizio Caio'), 'Slot 1 must display saved player name');
        assert.ok(slot1Text.includes('10000 L.'), 'Slot 1 must display saved money');
        steps.push({ step: 'save-slot-1', slot1Summary: slot1Text.replace(/\s+/g, ' ').trim() });

        await session.page.locator('#save-manager-modal [data-action="close"]').tap();
        await session.page.waitForFunction(() => !document.getElementById('save-manager-modal'));

        // Also check landscape viewport
        await session.page.setViewportSize({ width: 844, height: 390 });
        await session.page.waitForTimeout(200);
        const landscapeFit = await session.page.locator('.window.dlg-1 .dashboard-nav-grid button').evaluateAll((btns) =>
            btns.map((b) => {
                const r = b.getBoundingClientRect();
                return r.width > 0 && r.top >= -1 && r.bottom <= window.innerHeight + 2;
            })
        );
        assert.strictEqual(landscapeFit.length, 8);
        assert.ok(landscapeFit.every(Boolean), 'All 8 dashboard buttons must fit in 844x390 landscape');
        const after = await captureStateArtifacts(session.page, featureDir, '03-dashboard-landscape');
        steps.push({ step: 'landscape-fit', allEightVisible: true });

        assert.deepStrictEqual(session.pageErrors, []);
        assert.deepStrictEqual(session.consoleErrors, []);
        return {
            feature: 'dashboard',
            entryPoint: 'Splash (.dlg-12) -> Dashboard (.dlg-1) -> Save Manager (#save-manager-open)',
            steps,
            artifacts: [before, saveModalProof, after],
            pageErrors: session.pageErrors,
            consoleErrors: session.consoleErrors
        };
    } finally {
        await session.context.close();
    }
}

async function driveScuola(browser, baseUrl, featureDir) {
    const steps = [];
    const session = await bootMobileSession(browser, baseUrl, 390, 844);
    try {
        await session.page.locator('.window.dlg-1 .dashboard-nav-grid button.control136').tap();
        await session.page.locator('.window.dlg-10').waitFor({ state: 'visible' });

        const before = await captureStateArtifacts(session.page, featureDir, '01-scuola-opened');
        const initialScuola = await session.page.evaluate(() => {
            const studia = document.querySelector('.window.dlg-10 button.control103').getBoundingClientRect();
            const close = document.querySelector('.window.dlg-10 .control61536').getBoundingClientRect();
            const save = document.getElementById('save-manager-open').getBoundingClientRect();
            const overlaps = !(close.right < save.left || close.left > save.right || close.bottom < save.top || close.top > save.bottom);
            return {
                fisicaGrade: document.querySelector('.window.dlg-10 .control121').innerText.trim(),
                profitto: document.querySelector('.window.dlg-10 .control106').innerText.trim(),
                reputazione: document.querySelector('.window.dlg-10 .control105').innerText.trim(),
                studiaOnScreen: studia.top >= 0 && studia.bottom <= window.innerHeight,
                saveOverlapsClose: overlaps
            };
        });
        assert.strictEqual(initialScuola.studiaOnScreen, true, 'Studia button must be visible without scrolling');
        assert.strictEqual(initialScuola.saveOverlapsClose, false, 'Save button must not overlap Chiudi');
        steps.push({ step: 'scuola-opened', ...initialScuola });

        // Select Fisica (radio control111) and tap Studia (control103)
        await session.page.locator('.window.dlg-10 .scuola-subject-card[data-radio-id="111"]').tap();
        await session.page.locator('.window.dlg-10 button.control103').tap();
        const drainedStudy = await drainRandomEventsAndAlerts(session.page);

        const afterStudy = await session.page.evaluate(() => ({
            fisicaGrade: document.querySelector('.window.dlg-10 .control121').innerText.trim(),
            profitto: document.querySelector('.window.dlg-10 .control106').innerText.trim(),
            reputazione: document.querySelector('.window.dlg-10 .control105').innerText.trim()
        }));
        assert.ok(
            Number(afterStudy.fisicaGrade) > Number(initialScuola.fisicaGrade),
            `Expected Fisica grade to increase from ${initialScuola.fisicaGrade}, got ${afterStudy.fisicaGrade}`
        );
        steps.push({ step: 'studied-fisica', ...afterStudy, drainedEvents: drainedStudy });

        // Test Corrompi (control101): prompts Sì/No, then refuses because 10.000 L. is not enough
        await session.page.locator('.window.dlg-10 button.control101').tap();
        const bribePrompt = await dismissMessageBox(session.page, 'dimenticare', 'button.control6');
        const bribeRefusal = await dismissMessageBox(session.page, 'non hai abbastanza soldi', 'button.control1');
        const drainedBribe = await drainRandomEventsAndAlerts(session.page);
        steps.push({
            step: 'bribe-attempt-refused',
            bribeQuestion: bribePrompt.text,
            refusalText: bribeRefusal.text,
            drainedEvents: drainedBribe
        });

        const mid = await captureStateArtifacts(session.page, featureDir, '02-scuola-after-study-and-bribe');

        // Return to Dashboard via Torna a Casa (control1)
        await session.page.locator('.window.dlg-10 button.control1').tap();
        await session.page.waitForFunction(() => !document.querySelector('.window.dlg-10'));
        await session.page.locator('.window.dlg-1').waitFor({ state: 'visible' });

        const dashboardStudio = await session.page.locator('.window.dlg-1 .control153').innerText();
        const after = await captureStateArtifacts(session.page, featureDir, '03-dashboard-updated');
        steps.push({ step: 'returned-to-dashboard', dashboardStudio: dashboardStudio.trim() });

        assert.deepStrictEqual(session.pageErrors, []);
        assert.deepStrictEqual(session.consoleErrors, []);
        return {
            feature: 'scuola',
            entryPoint: 'Dashboard (.dlg-1) -> Scuola (button.control136 -> .dlg-10)',
            steps,
            artifacts: [before, mid, after],
            pageErrors: session.pageErrors,
            consoleErrors: session.consoleErrors
        };
    } finally {
        await session.context.close();
    }
}

async function driveLavoro(browser, baseUrl, featureDir) {
    const steps = [];
    const session = await bootMobileSession(browser, baseUrl, 390, 844);
    try {
        await session.page.locator('.window.dlg-1 .dashboard-nav-grid button.control137').tap();
        await session.page.locator('.window.dlg-13').waitFor({ state: 'visible' });
        const before = await captureStateArtifacts(session.page, featureDir, '01-lavoro-hub');

        // 1. Tap Licenziati while unemployed -> disokkupato MessageBox
        await session.page.locator('.window.dlg-13 button.control111').tap();
        const unemployedMsg = await dismissMessageBox(session.page, 'disokkupat');
        steps.push({ step: 'unemployed-licenziati-guard', message: unemployedMsg.text });

        // 2. Tap Informazioni (control114) while unemployed -> Elenco Ditte (.dlg-210)
        await session.page.locator('.window.dlg-13 button.control114').tap();
        await session.page.locator('.window.dlg-210').waitFor({ state: 'visible' });
        const companyCount = await session.page.locator('.window.dlg-210 .company-buttons-list button.dlg_item').count();
        assert.ok(companyCount >= 6, `Expected company buttons in .dlg-210, found ${companyCount}`);
        await session.page.locator('.window.dlg-210 .company-buttons-list button.dlg_item').first().tap();
        const infoWin = session.page.locator('[class*="dlg-29"]').first();
        await infoWin.waitFor({ state: 'visible' });
        const infoText = (await infoWin.locator('.company-info-card').innerText()).replace(/\s+/g, ' ').trim();
        await infoWin.locator('button.control1').tap();
        await session.page.waitForFunction(() => !document.querySelector('[class*="dlg-29"]'));
        await session.page.locator('.window.dlg-210 button.control1').tap();
        await session.page.waitForFunction(() => !document.querySelector('.window.dlg-210'));
        steps.push({ step: 'company-list-and-info', companyCount, firstCompanyInfoSample: infoText.slice(0, 120) });

        // 3. Tap Cerca lavoro (control110) -> Job Offer (.dlg-390..397) -> Mi presento (control1) -> Job Quiz (.dlg-200..209)
        await session.page.locator('.window.dlg-13 button.control110').tap();
        const offerWin = session.page.locator('[class*="dlg-39"]').first();
        await offerWin.waitFor({ state: 'visible' });
        const offerDesc = (await offerWin.locator('.job-offer-desc-card').innerText()).replace(/\s+/g, ' ').trim();
        await offerWin.locator('button.control1').tap();

        const quizWin = session.page.locator('[class*="dlg-20"]').first();
        await quizWin.waitFor({ state: 'visible' });
        // Select exactly one option in Question A (101), Question B (104), and Question C (107)
        await quizWin.locator('.quiz-question-card').nth(0).locator('.quiz-option-card').first().tap();
        await quizWin.locator('.quiz-question-card').nth(1).locator('.quiz-option-card').first().tap();
        await quizWin.locator('.quiz-question-card').nth(2).locator('.quiz-option-card').first().tap();
        const quizShot = await captureStateArtifacts(session.page, featureDir, '02-lavoro-quiz-filled');

        await quizWin.locator('button.quiz-submit-btn').tap();
        const quizOutcome = await dismissMessageBox(session.page);
        const drainedQuiz = await drainRandomEventsAndAlerts(session.page);
        const after = await captureStateArtifacts(session.page, featureDir, '03-lavoro-after-quiz');
        steps.push({
            step: 'job-offer-and-quiz',
            offerDescSample: offerDesc.slice(0, 120),
            quizOutcome,
            drainedEvents: drainedQuiz
        });

        await session.page.locator('.window.dlg-13 button.control1').tap();
        await session.page.waitForFunction(() => !document.querySelector('.window.dlg-13'));

        assert.deepStrictEqual(session.pageErrors, []);
        assert.deepStrictEqual(session.consoleErrors, []);
        return {
            feature: 'lavoro',
            entryPoint: 'Dashboard (.dlg-1) -> Lavoro (button.control137 -> .dlg-13)',
            steps,
            artifacts: [before, quizShot, after],
            pageErrors: session.pageErrors,
            consoleErrors: session.consoleErrors
        };
    } finally {
        await session.context.close();
    }
}

async function driveNegozi(browser, baseUrl, featureDir) {
    const steps = [];
    const session = await bootMobileSession(browser, baseUrl, 390, 844);
    try {
        await session.page.locator('.window.dlg-1 .dashboard-nav-grid button.control131').tap();
        await session.page.locator('.window.dlg-8').waitFor({ state: 'visible' });
        const before = await captureStateArtifacts(session.page, featureDir, '01-negozi-menu');

        // 1. Bar Tabacchi (.dlg-88): select a pack and buy it (5.000 or 6.000 L., affordable with starting 10.000 L.)
        await session.page.locator('.window.dlg-8 .negozi-buttons-list button', { hasText: 'Bar Tabacchi' }).tap();
        await session.page.locator('.window.dlg-88').waitFor({ state: 'visible' });
        const packCount = await session.page.locator('.window.dlg-88 .pack-card').count();
        assert.strictEqual(packCount, 24, 'Bar Tabacchi must render 24 cigarette packs');
        await session.page.locator('.window.dlg-88 .pack-card').first().tap();
        const tabacchiShot = await captureStateArtifacts(session.page, featureDir, '02-tabacchi-pack-selected');
        await session.page.locator('.window.dlg-88 button.control1').tap();
        const healthWarning = await dismissMessageBox(session.page, '428');
        await drainRandomEventsAndAlerts(session.page);
        await session.page.waitForFunction(() => !document.querySelector('.window.dlg-88'));

        const soldiAfterTabacchi = (await session.page.locator('.window.dlg-8 .control120').innerText()).trim();
        assert.notStrictEqual(soldiAfterTabacchi, '10000 L.', 'Buying cigarettes must deduct money');
        steps.push({
            step: 'tabacchi-purchase',
            packCount,
            healthWarning: healthWarning.text,
            soldiAfterTabacchi
        });

        // 2. Palestra (.dlg-89): inspect subscriptions and lampada price
        await session.page.locator('.window.dlg-8 .negozi-buttons-list button', { hasText: 'Palestra' }).tap();
        await session.page.locator('.window.dlg-89').waitFor({ state: 'visible' });
        const palestraState = await session.page.evaluate(() => ({
            soldi: document.querySelector('.window.dlg-89 .control104')?.innerText.trim(),
            abbonamento: document.querySelector('.window.dlg-89 .control106')?.innerText.trim(),
            abbronzatura: document.querySelector('.window.dlg-89 .control107')?.innerText.trim(),
            price1Mese: document.querySelector('.window.dlg-89 .control120')?.innerText.trim()
        }));
        steps.push({ step: 'palestra-inspected', ...palestraState });
        await session.page.locator('.window.dlg-89 button.control1').tap();
        await session.page.waitForFunction(() => !document.querySelector('.window.dlg-89'));

        // 3. Telefonino (.dlg-120 -> .dlg-121 catalog)
        await session.page.locator('.window.dlg-8 .negozi-buttons-list button', { hasText: 'Telefonino' }).tap();
        await session.page.locator('.window.dlg-120').waitFor({ state: 'visible' });
        await session.page.locator('.window.dlg-120 button.control110').tap();
        await session.page.locator('.window.dlg-121').waitFor({ state: 'visible' });
        const phoneModels = await session.page.locator('.window.dlg-121 .phone-product-name').allInnerTexts();
        assert.strictEqual(phoneModels.length, 3);
        const after = await captureStateArtifacts(session.page, featureDir, '03-phone-catalog');
        await session.page.locator('.window.dlg-121 button.control2').tap();
        await session.page.waitForFunction(() => !document.querySelector('.window.dlg-121'));
        await session.page.locator('.window.dlg-120 button.control1').tap();
        await session.page.waitForFunction(() => !document.querySelector('.window.dlg-120'));
        await session.page.locator('.window.dlg-8 button.control1').tap();
        await session.page.waitForFunction(() => !document.querySelector('.window.dlg-8'));
        steps.push({ step: 'phone-catalog-inspected', phoneModels });

        assert.deepStrictEqual(session.pageErrors, []);
        assert.deepStrictEqual(session.consoleErrors, []);
        return {
            feature: 'negozi',
            entryPoint: 'Dashboard (.dlg-1) -> Negozi (button.control131 -> .dlg-8)',
            steps,
            artifacts: [before, tabacchiShot, after],
            pageErrors: session.pageErrors,
            consoleErrors: session.consoleErrors
        };
    } finally {
        await session.context.close();
    }
}

async function driveTipa(browser, baseUrl, featureDir) {
    const steps = [];
    const session = await bootMobileSession(browser, baseUrl, 390, 844);
    try {
        await session.page.locator('.window.dlg-1 .dashboard-nav-grid button.control133').tap();
        await session.page.locator('.window.dlg-9').waitFor({ state: 'visible' });
        const before = await captureStateArtifacts(session.page, featureDir, '01-tipa-hub');

        // 1. Tap Lascia tipa/o (control111) when single -> MessageBox guard
        await session.page.locator('.window.dlg-9 button.control111').tap();
        const singleMsg = await dismissMessageBox(session.page, 'lasciare');
        steps.push({ step: 'lascia-tipa-when-single', message: singleMsg.text });

        // 2. Tap Cerca nuova tipa/o (control110) -> .dlg-91
        await session.page.locator('.window.dlg-9 button.control110').tap();
        await session.page.locator('.window.dlg-91').waitFor({ state: 'visible' });
        const candidate = await session.page.evaluate(() => ({
            nome: document.querySelector('.window.dlg-91 .control105')?.innerText.trim(),
            figosita: document.querySelector('.window.dlg-91 .control106')?.innerText.trim(),
            giudizio: document.querySelector('.window.dlg-91 .control107')?.innerText.trim()
        }));
        const cercaShot = await captureStateArtifacts(session.page, featureDir, '02-cerca-tipa');

        // Tap "Ci provo !" (control101) -> either Due di Picche (.dlg-95) or success return to .dlg-9
        await session.page.locator('.window.dlg-91 button.control101').tap();
        await session.page.waitForTimeout(400);
        const piccheVisible = await session.page.locator('.window.dlg-95').isVisible().catch(() => false);
        let outcome = 'accepted';
        if (piccheVisible) {
            const quote = (await session.page.locator('.window.dlg-95 .control105').innerText()).trim();
            outcome = `rejected (Due di Picche: ${quote})`;
            await session.page.locator('.window.dlg-95 button.control1').tap();
            await session.page.waitForFunction(() => !document.querySelector('.window.dlg-95'));
        }
        await drainRandomEventsAndAlerts(session.page);
        const after = await captureStateArtifacts(session.page, featureDir, '03-tipa-after-attempt');
        steps.push({ step: 'cerca-tipa-attempt', candidate, outcome });

        await session.page.locator('.window.dlg-9 button.control1').tap();
        await session.page.waitForFunction(() => !document.querySelector('.window.dlg-9'));

        assert.deepStrictEqual(session.pageErrors, []);
        assert.deepStrictEqual(session.consoleErrors, []);
        return {
            feature: 'tipa',
            entryPoint: 'Dashboard (.dlg-1) -> Tipa (button.control133 -> .dlg-9)',
            steps,
            artifacts: [before, cercaShot, after],
            pageErrors: session.pageErrors,
            consoleErrors: session.consoleErrors
        };
    } finally {
        await session.context.close();
    }
}

async function driveScooter(browser, baseUrl, featureDir) {
    const steps = [];
    const session = await bootMobileSession(browser, baseUrl, 390, 844);
    try {
        await session.page.locator('.window.dlg-1 .dashboard-nav-grid button.control130').tap();
        await session.page.locator('.window.dlg-7').waitFor({ state: 'visible' });
        const before = await captureStateArtifacts(session.page, featureDir, '01-scooter-hub');

        const initialScooter = await session.page.evaluate(() => ({
            modello: document.querySelector('.window.dlg-7 .control116')?.innerText.trim(),
            soldi: document.querySelector('.window.dlg-7 .control104')?.innerText.trim()
        }));
        steps.push({ step: 'scooter-hub-opened', ...initialScooter });

        // Open Concessionario (control101) -> .dlg-70 -> Compra uno scooter (control101) -> .dlg-74
        await session.page.locator('.window.dlg-7 button.control101').tap();
        const concessMenu = session.page.locator('.window.dlg-70');
        await concessMenu.waitFor({ state: 'visible' });
        await concessMenu.locator('button.control101').tap();

        const showroomWin = session.page.locator('.window.dlg-74, .window.dlg-75, .window.dlg-76, .window.dlg-77, .window.dlg-78, .window.dlg-79').first();
        await showroomWin.waitFor({ state: 'visible' });
        const mid = await captureStateArtifacts(session.page, featureDir, '02-scooter-concessionario');
        await showroomWin.locator('button.control2, button.control1, .control61536').first().tap();
        await concessMenu.waitFor({ state: 'visible' });
        await concessMenu.locator('button.control2, button.control1, .control61536').first().tap();
        await drainRandomEventsAndAlerts(session.page);
        await session.page.locator('.window.dlg-7').waitFor({ state: 'visible' });

        await session.page.locator('.window.dlg-7 button.control1').tap();
        await session.page.waitForFunction(() => !document.querySelector('.window.dlg-7'));
        const after = await captureStateArtifacts(session.page, featureDir, '03-returned-dashboard');

        assert.deepStrictEqual(session.pageErrors, []);
        assert.deepStrictEqual(session.consoleErrors, []);
        return {
            feature: 'scooter',
            entryPoint: 'Dashboard (.dlg-1) -> Scooter (button.control130 -> .dlg-7)',
            steps,
            artifacts: [before, mid, after],
            pageErrors: session.pageErrors,
            consoleErrors: session.consoleErrors
        };
    } finally {
        await session.context.close();
    }
}

async function cmdDrive(args) {
    const runId = String(args['run-id'] || 'default');
    const rawFeature = String(args.feature || args._[1] || 'scuola').toLowerCase();
    const feature = rawFeature === 'dashboard-and-saves' ? 'dashboard' : rawFeature;
    const instanceFile = instanceFileFor(runId);
    if (!fs.existsSync(instanceFile)) {
        throw new Error(`No instance.json found at ${instanceFile}. Run launch first.`);
    }
    const instance = JSON.parse(fs.readFileSync(instanceFile, 'utf8'));
    const evidenceRoot = path.resolve(String(args['evidence-dir'] || defaultEvidenceDirFor(runId)));
    const featureDir = path.join(evidenceRoot, feature);
    fs.mkdirSync(featureDir, { recursive: true });

    const { chromium } = loadPlaywright();
    const browser = await chromium.launch(resolveBrowserLaunchOptions());
    try {
        let result;
        if (feature === 'dashboard') {
            result = await driveDashboard(browser, instance.baseUrl, featureDir);
        } else if (feature === 'scuola') {
            result = await driveScuola(browser, instance.baseUrl, featureDir);
        } else if (feature === 'lavoro') {
            result = await driveLavoro(browser, instance.baseUrl, featureDir);
        } else if (feature === 'negozi') {
            result = await driveNegozi(browser, instance.baseUrl, featureDir);
        } else if (feature === 'tipa') {
            result = await driveTipa(browser, instance.baseUrl, featureDir);
        } else if (feature === 'scooter') {
            result = await driveScooter(browser, instance.baseUrl, featureDir);
        } else {
            throw new Error(`Unknown feature "${feature}". Valid features: dashboard, scuola, lavoro, negozi, tipa, scooter`);
        }

        const proofFile = path.join(featureDir, 'proof.json');
        const proofPayload = {
            runId,
            port: instance.port,
            baseUrl: instance.baseUrl,
            assetVersion: instance.assetVersion,
            verifiedAt: new Date().toISOString(),
            evidenceDir: featureDir,
            ...result
        };
        fs.writeFileSync(proofFile, JSON.stringify(proofPayload, null, 2));
        console.log(JSON.stringify({ status: 'verified', proofFile, ...proofPayload }, null, 2));
        return proofPayload;
    } finally {
        await browser.close().catch(() => {});
    }
}

async function cmdEvidence(args) {
    const runId = String(args['run-id'] || 'default');
    const evidenceRoot = path.resolve(String(args['evidence-dir'] || defaultEvidenceDirFor(runId)));
    if (!fs.existsSync(evidenceRoot)) {
        throw new Error(`Evidence directory does not exist: ${evidenceRoot}`);
    }
    const requestedFeature = args.feature || args._[1] || null;
    const dirs = requestedFeature
        ? [String(requestedFeature === 'dashboard-and-saves' ? 'dashboard' : requestedFeature)]
        : fs.readdirSync(evidenceRoot).filter((d) => fs.statSync(path.join(evidenceRoot, d)).isDirectory());

    assert(dirs.length > 0, `No feature evidence directories found under ${evidenceRoot}`);
    const features = {};
    for (const dirName of dirs) {
        const dirPath = path.join(evidenceRoot, dirName);
        assert(fs.existsSync(dirPath), `Missing feature evidence directory: ${dirPath}`);
        const files = fs.readdirSync(dirPath).sort();
        const pngs = files.filter((f) => f.endsWith('.png'));
        const arias = files.filter((f) => f.endsWith('.aria.txt'));
        const proofPath = path.join(dirPath, 'proof.json');
        assert(fs.existsSync(proofPath), `Missing proof.json in ${dirPath}`);
        assert(pngs.length >= 2, `Expected >= 2 PNG screenshots in ${dirPath}, found ${pngs.length}`);
        assert(arias.length >= 2, `Expected >= 2 ARIA snapshots in ${dirPath}, found ${arias.length}`);
        const proof = JSON.parse(fs.readFileSync(proofPath, 'utf8'));
        assert.strictEqual((proof.pageErrors || []).length, 0, `Unexpected pageErrors in ${proofPath}`);
        assert.strictEqual((proof.consoleErrors || []).length, 0, `Unexpected consoleErrors in ${proofPath}`);
        features[dirName] = {
            proofFile: proofPath,
            screenshots: pngs.map((f) => path.join(dirPath, f)),
            ariaSnapshots: arias.map((f) => path.join(dirPath, f)),
            checks: proof.checks || proof.assertions || {}
        };
    }
    const report = {
        status: 'evidence-ok',
        runId,
        evidenceRoot,
        features
    };
    console.log(JSON.stringify(report, null, 2));
    return report;
}

async function cmdCleanup(args) {
    const runId = String(args['run-id'] || 'default');
    const stateDir = stateDirFor(runId);
    const instanceFile = instanceFileFor(runId);
    const evidenceRoot = path.resolve(String(args['evidence-dir'] || defaultEvidenceDirFor(runId)));

    let killedPid = null;
    if (fs.existsSync(instanceFile)) {
        const instance = JSON.parse(fs.readFileSync(instanceFile, 'utf8'));
        killedPid = instance.pid;
        if (isOurServerPid(instance.pid)) {
            try {
                process.kill(instance.pid, 'SIGTERM');
            } catch (_err) {
                // ignore
            }
            const deadline = Date.now() + 2000;
            while (Date.now() < deadline && isPidAlive(instance.pid)) {
                await new Promise((r) => setTimeout(r, 100));
            }
            if (isPidAlive(instance.pid)) {
                try {
                    process.kill(instance.pid, 'SIGKILL');
                } catch (_err) {
                    // ignore
                }
            }
        }
    }
    if (fs.existsSync(stateDir)) {
        fs.rmSync(stateDir, { recursive: true, force: true });
    }

    const evidenceSurvives = fs.existsSync(evidenceRoot);
    const report = {
        status: 'cleaned',
        runId,
        killedPid,
        stateDirRemoved: !fs.existsSync(stateDir),
        evidenceRoot,
        evidenceSurvives
    };
    console.log(JSON.stringify(report, null, 2));
    return report;
}

async function cmdVerify(args) {
    try {
        await cmdLaunch(args);
        await cmdDoctor(args);
        await cmdDrive(args);
    } finally {
        await cmdCleanup(args);
    }
}

(async () => {
    const args = parseArgs(process.argv.slice(2));
    const subcmd = args._[0];
    try {
        if (subcmd === 'launch') {
            await cmdLaunch(args);
        } else if (subcmd === 'doctor') {
            await cmdDoctor(args);
        } else if (subcmd === 'drive') {
            await cmdDrive(args);
        } else if (subcmd === 'evidence') {
            await cmdEvidence(args);
        } else if (subcmd === 'cleanup') {
            await cmdCleanup(args);
        } else if (subcmd === 'verify') {
            await cmdVerify(args);
        } else {
            console.error(
                'Usage: control-tabboz.js <launch|doctor|drive|evidence|cleanup|verify> [--run-id <id>] [--port <port>] [--feature <name>] [--evidence-dir <dir>]'
            );
            process.exitCode = 1;
        }
    } catch (err) {
        console.error(err && err.stack ? err.stack : String(err));
        process.exitCode = 1;
    }
})();
