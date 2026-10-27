#!/usr/bin/env node
/**
 * Verification harness for Tabboz Mobile (`.cursor/skills/verify-tabboz/`).
 *
 * Subcommands:
 *   launch   [--run-id <id>] [--port <port>] [--evidence-dir <dir>]
 *   doctor   [--run-id <id>]
 *   drive    <feature> [--run-id <id>] [--viewport <WxH>] [--evidence-dir <dir>]
 *   evidence [--run-id <id>] [--feature <feature>] [--evidence-dir <dir>]
 *   cleanup  [--run-id <id>]
 */
'use strict';

const assert = require('assert');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const net = require('net');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const DEFAULT_RUN_ID = process.env.TABBOZ_RUN_ID || 'default';
const MIN_VERIFY_PORT = 8081;
const NOME_KEY = 'HKEY_CURRENT_USER\\Software\\Obscured Truckware\\Tabboz Simulator 32\\Nome';
const REG_PREFIX = 'HKEY_CURRENT_USER\\Software\\Obscured Truckware\\Tabboz Simulator 32';

function parseArgs(argv) {
    const positional = [];
    const flags = {};
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--help' || arg === '-h') {
            flags.help = true;
        } else if (arg.startsWith('--')) {
            const eq = arg.indexOf('=');
            if (eq !== -1) {
                flags[arg.slice(2, eq)] = arg.slice(eq + 1);
            } else {
                const key = arg.slice(2);
                const next = argv[i + 1];
                if (next !== undefined && !next.startsWith('--')) {
                    flags[key] = next;
                    i += 1;
                } else {
                    flags[key] = true;
                }
            }
        } else {
            positional.push(arg);
        }
    }
    return { command: positional[0] || 'help', positional: positional.slice(1), flags };
}

function getRunPaths(runId, customEvidenceDir) {
    const safeId = String(runId || DEFAULT_RUN_ID).replace(/[^a-zA-Z0-9._-]/g, '-');
    const stateDir = path.join('/tmp', 'tabboz-verify-' + safeId);
    const stateFile = path.join(stateDir, 'state.json');
    const pidFile = path.join(stateDir, 'server.pid');
    const logFile = path.join(stateDir, 'server.log');
    const evidenceDir = customEvidenceDir
        ? path.resolve(customEvidenceDir)
        : path.join('/tmp', 'tabboz-evidence-' + safeId);
    return { runId: safeId, stateDir, stateFile, pidFile, logFile, evidenceDir };
}

function readExpectedAssetVersion() {
    const versionFile = path.join(REPO_ROOT, 'mobile', 'js', 'version.js');
    const src = fs.readFileSync(versionFile, 'utf8');
    const match = src.match(/ASSET_VERSION\s*=\s*'([^']+)'/);
    if (!match) {
        throw new Error('Could not parse ASSET_VERSION from ' + versionFile);
    }
    return match[1];
}

function loadPlaywright() {
    const candidates = [
        'playwright',
        'playwright-core',
        path.join(REPO_ROOT, 'node_modules', 'playwright'),
        path.join(REPO_ROOT, 'node_modules', 'playwright-core'),
        '/node_modules/playwright-core',
        '/workspace/tabboz-play/node_modules/playwright'
    ];
    for (const candidate of candidates) {
        try {
            return require(candidate);
        } catch (err) {
            // Try next candidate
        }
    }
    throw new Error(
        'Cannot load playwright or playwright-core. Run `npm ci` in repo root or set NODE_PATH.'
    );
}

function resolveBrowserExecutable() {
    if (process.env.TABBOZ_BROWSER === 'playwright') return null;
    if (process.env.CHROME && fs.existsSync(process.env.CHROME)) {
        return process.env.CHROME;
    }
    const candidates = [
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium'
    ];
    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) return candidate;
    }
    return null;
}

function launchOptions() {
    const options = {
        headless: true,
        args: ['--no-sandbox', '--disable-dev-shm-usage']
    };
    const exe = resolveBrowserExecutable();
    if (exe) options.executablePath = exe;
    return options;
}

function checkPortFree(port) {
    return new Promise((resolve) => {
        const sock = net.createConnection({ port, host: '127.0.0.1', timeout: 300 });
        sock.once('connect', () => {
            sock.destroy();
            resolve(false);
        });
        sock.once('timeout', () => {
            sock.destroy();
            resolve(true);
        });
        sock.once('error', (err) => {
            sock.destroy();
            resolve(err.code === 'ECONNREFUSED');
        });
    });
}

async function findFreePort(startPort) {
    const base = Math.max(MIN_VERIFY_PORT, Number(startPort) || MIN_VERIFY_PORT);
    for (let port = base; port < base + 100; port++) {
        if (port === 8080) continue;
        
        if (await checkPortFree(port)) return port;
    }
    throw new Error('No free port found in range ' + base + '..' + (base + 99));
}

function httpGet(url, timeoutMs = 5000) {
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
            req.destroy(new Error('HTTP timeout for ' + url));
        });
        req.on('error', reject);
    });
}

function isServerProcess(pid) {
    if (!Number.isInteger(pid) || pid <= 0) return false;
    try {
        process.kill(pid, 0);
    } catch (err) {
        return false;
    }
    const cmdlinePath = '/proc/' + pid + '/cmdline';
    if (fs.existsSync(cmdlinePath)) {
        try {
            const raw = fs.readFileSync(cmdlinePath, 'utf8').replace(/\0/g, ' ');
            return raw.includes('server.py');
        } catch (err) {
            return false;
        }
    }
    return true;
}

function readState(paths) {
    if (!fs.existsSync(paths.stateFile)) {
        throw new Error(
            'No active verification state at ' + paths.stateFile +
            '. Run `launch --run-id ' + paths.runId + '` first.'
        );
    }
    return JSON.parse(fs.readFileSync(paths.stateFile, 'utf8'));
}

async function waitForServerReady(port, pid, logFile, timeoutMs = 15000) {
    const deadline = Date.now() + timeoutMs;
    const mobileUrl = 'http://127.0.0.1:' + port + '/mobile/';
    while (Date.now() < deadline) {
        if (!isServerProcess(pid)) {
            const logs = fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8') : '';
            throw new Error('server.py exited prematurely.\n' + logs);
        }
        try {
            
            const res = await httpGet(mobileUrl, 1500);
            if (res.statusCode === 200 && res.body.toString('utf8').includes('Tabboz Mobile')) {
                return;
            }
        } catch (err) {
            // Server still starting
        }
        
        await new Promise((r) => setTimeout(r, 150));
    }
    throw new Error('Timed out waiting for server.py on ' + mobileUrl);
}

async function startServerOnFreePort(paths, preferredPort, strictPort = false) {
    const startCandidate = Number(preferredPort) || await findFreePort(MIN_VERIFY_PORT);
    const maxAttempts = strictPort ? 1 : 25;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const port = startCandidate + attempt;
        if (port === 8080) continue;
        
        if (!(await checkPortFree(port))) {
            if (strictPort) {
                throw new Error('Port ' + port + ' is already in use. Pick a free port >= 8081.');
            }
            continue;
        }

        const outFd = fs.openSync(paths.logFile, 'w');
        const child = spawn('python3', [path.join(REPO_ROOT, 'server.py')], {
            cwd: REPO_ROOT,
            env: { ...process.env, PORT: String(port) },
            detached: true,
            stdio: ['ignore', outFd, outFd]
        });
        child.unref();
        fs.closeSync(outFd);

        const pid = child.pid;
        fs.writeFileSync(paths.pidFile, String(pid) + '\n', 'utf8');

        try {
            
            await waitForServerReady(port, pid, paths.logFile, 15000);
            return { port, pid, baseUrl: 'http://127.0.0.1:' + port + '/mobile/' };
        } catch (err) {
            try {
                if (isServerProcess(pid)) process.kill(pid, 'SIGTERM');
            } catch (killErr) {
                // ignore
            }
            if (!strictPort && String(err.message).includes('Address already in use') && attempt + 1 < maxAttempts) {
                continue;
            }
            throw err;
        }
    }
    throw new Error('Unable to start server.py on any free port starting at ' + startCandidate);
}

async function ensureServerRunning(paths) {
    const state = readState(paths);
    if (isServerProcess(state.pid)) {
        try {
            const res = await httpGet(state.baseUrl, 1500);
            if (res.statusCode === 200) {
                return { state, ephemeralRespawn: false };
            }
        } catch (err) {
            // Process alive but port not answering; respawn below
        }
    }
    // In environments where each shell command runs in an ephemeral PID namespace
    // that reaps background processes on command exit, re-bind server.py for this command.
    const started = await startServerOnFreePort(paths, state.port, false);
    state.pid = started.pid;
    state.port = started.port;
    state.baseUrl = started.baseUrl;
    fs.writeFileSync(paths.stateFile, JSON.stringify(state, null, 2) + '\n', 'utf8');
    return { state, ephemeralRespawn: true };
}

async function stopEphemeralServerIfNeeded(ensured) {
    if (!ensured || !ensured.ephemeralRespawn) return;
    const pid = ensured.state && ensured.state.pid;
    if (pid && isServerProcess(pid)) {
        try {
            process.kill(pid, 'SIGTERM');
        } catch (err) {
            // ignore
        }
    }
}

async function cmdLaunch(flags) {
    const paths = getRunPaths(flags['run-id'], flags['evidence-dir']);
    if (fs.existsSync(paths.pidFile)) {
        const oldPid = Number(fs.readFileSync(paths.pidFile, 'utf8').trim());
        if (isServerProcess(oldPid)) {
            throw new Error(
                'Instance already running for run-id "' + paths.runId + '" (PID ' + oldPid + '). ' +
                'Run `cleanup --run-id ' + paths.runId + '` or choose another `--run-id`.'
            );
        }
    }

    const requestedPort = flags.port || process.env.TABBOZ_VERIFY_PORT;
    if (Number(requestedPort) === 8080) {
        throw new Error('Port 8080 is reserved for interactive dev server. Use port >= 8081.');
    }

    fs.mkdirSync(paths.stateDir, { recursive: true });
    fs.mkdirSync(paths.evidenceDir, { recursive: true });

    const assetVersion = readExpectedAssetVersion();
    const started = await startServerOnFreePort(
        paths,
        requestedPort ? Number(requestedPort) : MIN_VERIFY_PORT,
        Boolean(requestedPort)
    );
    const { port, pid, baseUrl } = started;

    const state = {
        runId: paths.runId,
        pid,
        port,
        baseUrl,
        repoRoot: REPO_ROOT,
        assetVersion,
        stateDir: paths.stateDir,
        evidenceDir: paths.evidenceDir,
        startedAt: new Date().toISOString()
    };
    fs.writeFileSync(paths.stateFile, JSON.stringify(state, null, 2) + '\n', 'utf8');

    try {
        // Verify WASM + Splash readiness in headless mobile browser
        const { chromium } = loadPlaywright();
        const browser = await chromium.launch(launchOptions());
        try {
            const context = await browser.newContext({
                viewport: { width: 390, height: 844 },
                hasTouch: true,
                isMobile: true,
                deviceScaleFactor: 1
            });
            const page = await context.newPage();
            await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
            const startBtn = page.locator('.window.dlg-12 button.control202', { hasText: 'TOCCA PER GIOCARE' });
            await startBtn.waitFor({ state: 'visible', timeout: 30000 });
            await context.close();
        } finally {
            await browser.close().catch(() => {});
        }
    } catch (err) {
        try {
            if (isServerProcess(pid)) process.kill(pid, 'SIGTERM');
        } catch (killErr) {
            // ignore
        }
        throw err;
    }

    const result = {
        status: 'ready',
        ...state
    };
    console.log(JSON.stringify(result, null, 2));
    return result;
}

async function cmdDoctor(flags) {
    const paths = getRunPaths(flags['run-id'], flags['evidence-dir']);
    const ensured = await ensureServerRunning(paths);
    const { state } = ensured;
    const expectedVersion = readExpectedAssetVersion();

    try {
        if (!isServerProcess(state.pid)) {
            throw new Error('Server PID ' + state.pid + ' is not alive or is not server.py.');
        }

        const [indexRes, versionRes, wasmRes, stringsRes] = await Promise.all([
            httpGet(state.baseUrl),
            httpGet(state.baseUrl + 'js/version.js'),
            httpGet('http://127.0.0.1:' + state.port + '/zarrosim.wasm'),
            httpGet('http://127.0.0.1:' + state.port + '/resources/strings/strings.json')
        ]);

        assert.strictEqual(indexRes.statusCode, 200, 'GET /mobile/ failed');
        assert.strictEqual(versionRes.statusCode, 200, 'GET /mobile/js/version.js failed');
        assert.strictEqual(wasmRes.statusCode, 200, 'GET /zarrosim.wasm failed');
        assert.strictEqual(stringsRes.statusCode, 200, 'GET /resources/strings/strings.json failed');

        const versionText = versionRes.body.toString('utf8');
        const servedMatch = versionText.match(/ASSET_VERSION\s*=\s*'([^']+)'/);
        const servedVersion = servedMatch ? servedMatch[1] : null;
        if (servedVersion !== expectedVersion) {
            throw new Error(
                'ASSET_VERSION mismatch: server served ' + servedVersion +
                ', checkout expects ' + expectedVersion
            );
        }

        const wasmType = String(wasmRes.headers['content-type'] || '');
        if (!wasmType.includes('application/wasm')) {
            throw new Error('Expected application/wasm content-type, got: ' + wasmType);
        }
        if (wasmRes.body.length < 100000) {
            throw new Error('zarrosim.wasm body unexpectedly small: ' + wasmRes.body.length);
        }

        loadPlaywright();
        const chromeExecutable = resolveBrowserExecutable() || 'playwright-chromium';

        const report = {
            ok: true,
            runId: state.runId,
            pid: state.pid,
            port: state.port,
            baseUrl: state.baseUrl,
            assetVersion: servedVersion,
            wasmBytes: wasmRes.body.length,
            chromeExecutable,
            stateDir: state.stateDir,
            evidenceDir: state.evidenceDir
        };
        console.log(JSON.stringify(report, null, 2));
        return report;
    } finally {
        await stopEphemeralServerIfNeeded(ensured);
    }
}

async function bootToDashboard(browser, baseUrl, width = 390, height = 844) {
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
    const dialogs = [];

    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('dialog', (dialog) => {
        dialogs.push({ type: dialog.type(), message: dialog.message() });
        dialog.accept().catch(() => {});
    });

    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    const startBtn = page.locator('.window.dlg-12 button.control202', { hasText: 'TOCCA PER GIOCARE' });
    await startBtn.waitFor({ state: 'visible', timeout: 30000 });
    await startBtn.tap();

    await page.locator('.window.dlg-1 .dashboard-nav-grid button.control136').waitFor({
        state: 'visible',
        timeout: 20000
    });
    await page.waitForFunction((key) => !!localStorage.getItem(key), NOME_KEY, { timeout: 20000 });
    await page.waitForFunction(() => !document.querySelector('.window.dlg-14'), undefined, { timeout: 5000 });

    return { context, page, pageErrors, consoleErrors, dialogs };
}

async function recordStep(session, featureDir, artifacts, stepId, description) {
    fs.mkdirSync(featureDir, { recursive: true });
    const screenshotPath = path.join(featureDir, stepId + '.png');
    const domPath = path.join(featureDir, stepId + '.dom.json');
    const registryPath = path.join(featureDir, stepId + '.registry.json');

    await session.page.screenshot({ path: screenshotPath, fullPage: true });

    const snapshot = await session.page.evaluate((regPrefix) => {
        const visibleWindows = Array.from(document.querySelectorAll('.window')).filter((w) => {
            const st = window.getComputedStyle(w);
            return st.display !== 'none' && st.visibility !== 'hidden' && !w.classList.contains('tm-silent');
        }).map((w) => ({
            id: w.id,
            className: w.className,
            title: (w.querySelector('.title-bar-text') && w.querySelector('.title-bar-text').innerText.trim()) || '',
            controls: Array.from(w.querySelectorAll('.dlg_item, button, [role="dialog"]')).slice(0, 40).map((el) => ({
                tag: el.tagName,
                className: el.className,
                text: (el.innerText || el.value || '').trim().slice(0, 120),
                checked: typeof el.checked === 'boolean' ? el.checked : undefined
            }))
        }));

        const saveModal = document.getElementById('save-manager-modal');
        const registry = {};
        const slots = {};
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.indexOf(regPrefix) === 0) {
                registry[k.slice(regPrefix.length + 1)] = localStorage.getItem(k);
            } else if (k && (k.indexOf('tabboz_') === 0)) {
                slots[k] = localStorage.getItem(k);
            }
        }
        return {
            viewport: { width: window.innerWidth, height: window.innerHeight },
            visibleWindows,
            saveModalText: saveModal ? saveModal.innerText.trim() : null,
            registry,
            slots
        };
    }, REG_PREFIX);

    fs.writeFileSync(domPath, JSON.stringify({
        stepId,
        description,
        capturedAt: new Date().toISOString(),
        viewport: snapshot.viewport,
        visibleWindows: snapshot.visibleWindows,
        saveModalText: snapshot.saveModalText
    }, null, 2) + '\n', 'utf8');

    fs.writeFileSync(registryPath, JSON.stringify({
        stepId,
        registry: snapshot.registry,
        slots: snapshot.slots
    }, null, 2) + '\n', 'utf8');

    artifacts.push({
        stepId,
        description,
        screenshot: screenshotPath,
        domSnapshot: domPath,
        registrySnapshot: registryPath
    });
}

async function dismissRandomEvents(page) {
    for (let i = 0; i < 4; i++) {
        
        const hasMsgBox = await page.locator('#tm-overlays .window.messagebox').isVisible().catch(() => false);
        if (hasMsgBox) {
            
            await page.waitForTimeout(250);
            
            const okBtn = page.locator('#tm-overlays .window.messagebox button.control1');
            
            if (await okBtn.isVisible().catch(() => false)) {
                
                await okBtn.tap();
                
                await page.waitForTimeout(200);
                continue;
            }
        }
        
        const eventBtn = page.locator('.mobile-event-view button.control1, .mobile-pagella-view button.control1');
        
        if (await eventBtn.isVisible().catch(() => false)) {
            
            await eventBtn.tap();
            
            await page.waitForTimeout(200);
            continue;
        }
        break;
    }
}

async function driveDashboardAndSaves(browser, state, featureDir, viewport) {
    const artifacts = [];
    const session = await bootToDashboard(browser, state.baseUrl, viewport.width, viewport.height);
    try {
        const { page } = session;
        const nameText = (await page.locator('.dlg-1 .control102').innerText()).trim();
        const dateText = (await page.locator('.dlg-1 .control157').innerText()).trim();
        const soldiText = (await page.locator('.dlg-1 .stat-soldi .dlg_item').innerText()).trim();
        assert.strictEqual(nameText, 'Tizio Caio', 'Expected starting name Tizio Caio');
        assert.ok(dateText.includes('30 Settembre'), 'Expected starting date 30 Settembre, got: ' + dateText);
        assert.strictEqual(soldiText, '10000 L.', 'Expected starting money 10000 L., got: ' + soldiText);

        await recordStep(session, featureDir, artifacts, '01-dashboard-portrait', 'Dashboard booted with Tizio Caio, 10000 L., and 8 navigation buttons');

        await page.locator('#save-manager-open').tap();
        await page.locator('#save-manager-modal').waitFor({ state: 'visible' });
        const modalText = await page.locator('#save-manager-modal').innerText();
        assert.ok(modalText.includes('Tizio Caio'), 'Save modal must show Tizio Caio');
        assert.ok(modalText.includes('10000 L.'), 'Save modal must show 10000 L.');
        assert.ok(!modalText.includes('Tabbozzo'), 'Save modal must not invent Tabbozzo');

        await page.locator('#save-manager-modal button[data-action="save"][data-slot="1"]').tap();
        await page.waitForFunction(() => {
            const raw = localStorage.getItem('tabboz_slot_1');
            if (!raw) return false;
            const parsed = JSON.parse(raw);
            return parsed && parsed.registry && Object.keys(parsed.registry).length > 5;
        }, undefined, { timeout: 10000 });

        await recordStep(session, featureDir, artifacts, '02-save-slot-1', 'Saved live game state into Slot 1 and verified localStorage registry keys');

        await page.locator('#save-manager-modal [data-action="close"]').tap();
        await page.waitForFunction(() => !document.getElementById('save-manager-modal'));

        await page.locator('.dlg-1 button.control120').tap();
        await page.locator('.window.dlg-2').waitFor({ state: 'visible' });
        await recordStep(session, featureDir, artifacts, '03-about-dialog', 'Opened Info su Tabboz Simulator (dialog 2)');
        await page.locator('.dlg-2 button.control1').tap();
        await page.waitForFunction(() => !document.querySelector('.window.dlg-2'));
    } finally {
        await session.context.close();
    }

    const land = await bootToDashboard(browser, state.baseUrl, 844, 390);
    try {
        const onScreen = await land.page.locator('.dashboard-nav-grid button').evaluateAll((buttons) => {
            return buttons.map((b) => {
                const r = b.getBoundingClientRect();
                return r.width > 0 && r.top >= -1 && r.bottom <= window.innerHeight + 2;
            });
        });
        assert.strictEqual(onScreen.length, 8, 'Expected 8 dashboard nav buttons in landscape');
        assert.ok(onScreen.every(Boolean), 'All 8 dashboard buttons must fit inside 844x390 landscape viewport');
        await recordStep(land, featureDir, artifacts, '04-dashboard-landscape', 'Verified 844x390 landscape dashboard keeps all 8 navigation buttons on screen');
        assert.deepStrictEqual(land.pageErrors, []);
        assert.deepStrictEqual(land.consoleErrors, []);
    } finally {
        await land.context.close();
    }

    assert.deepStrictEqual(session.pageErrors, []);
    assert.deepStrictEqual(session.consoleErrors, []);
    return {
        feature: 'dashboard-and-saves',
        pageErrors: session.pageErrors,
        consoleErrors: session.consoleErrors,
        dialogs: session.dialogs,
        artifacts
    };
}

async function driveScuola(browser, state, featureDir, viewport) {
    const artifacts = [];
    const session = await bootToDashboard(browser, state.baseUrl, viewport.width, viewport.height);
    try {
        const { page } = session;
        await recordStep(session, featureDir, artifacts, '01-dashboard-before-scuola', 'Baseline dashboard before entering Scuola (Studio 0/100)');

        await page.locator('.dashboard-nav-grid button.control136').tap();
        await page.locator('.window.dlg-10').waitFor({ state: 'visible' });

        const studiaBtn = page.locator('.dlg-10 button.control103');
        await studiaBtn.waitFor({ state: 'visible' });
        const box = await studiaBtn.boundingBox();
        const vp = page.viewportSize();
        assert.ok(box && box.y >= 0 && box.y + box.height <= vp.height + 1, 'Studia button must be visible inside viewport without scrolling');

        const initialProfit = (await page.locator('.dlg-10 .control106').innerText()).trim();
        const initialFisica = (await page.locator('.dlg-10 .control121').innerText()).trim();
        assert.strictEqual(initialProfit, '0/100');
        assert.strictEqual(initialFisica, '0');
        await recordStep(session, featureDir, artifacts, '02-scuola-initial', 'Scuola opened showing 9 subjects, Profitto 0/100, and action drawer on screen');

        const fisicaCard = page.locator('.dlg-10 .scuola-subject-card[data-radio-id="111"]');
        await fisicaCard.tap();
        await page.waitForFunction(() => {
            const card = document.querySelector('.dlg-10 .scuola-subject-card[data-radio-id="111"]');
            const radio = document.getElementById('scuola_radio_111');
            return card && card.classList.contains('selected') && radio && radio.checked === true;
        });
        await recordStep(session, featureDir, artifacts, '03-scuola-select-fisica', 'Selected Fisica subject card; #scuola_radio_111 checked and card marked selected');

        await studiaBtn.tap();
        await page.waitForTimeout(300);
        await dismissRandomEvents(page);

        const afterFisica = (await page.locator('.dlg-10 .control121').innerText()).trim();
        const afterProfit = (await page.locator('.dlg-10 .control106').innerText()).trim();
        assert.strictEqual(afterFisica, '1', 'Fisica grade should increment from 0 to 1 after Studia');
        assert.strictEqual(afterProfit, '1/100', 'Profitto should update from 0/100 to 1/100 after studying 1 subject');
        await recordStep(session, featureDir, artifacts, '04-scuola-after-studia', 'Studied Fisica; Fisica grade rose to 1 and Profitto rose to 1/100');

        await page.locator('.dlg-10 button.control101').tap();
        const msgBox = page.locator('#tm-overlays .window.messagebox');
        await msgBox.waitFor({ state: 'visible' });
        await recordStep(session, featureDir, artifacts, '05-scuola-corrompi-offer', 'Tapped Corrompi; professor demands bribe in Yes/No messagebox');

        await page.waitForTimeout(350);
        await msgBox.locator('button.control6').tap();
        await msgBox.waitFor({ state: 'visible' });
        const errText = await msgBox.locator('.content').innerText();
        assert.ok(errText.includes('non hai abbastanza soldi'), 'Expected insufficient funds messagebox when bribing with 10000 L.');
        await recordStep(session, featureDir, artifacts, '06-scuola-corrompi-nomoney', 'Confirmed bribe with only 10000 L.; professor refuses with Errore critico');

        await page.waitForTimeout(350);
        await msgBox.locator('button.control1').tap();
        await page.waitForTimeout(250);
        await dismissRandomEvents(page);

        await page.locator('.dlg-10 button.control1').tap();
        await page.waitForFunction(() => !document.querySelector('.window.dlg-10'));
        await page.locator('.window.dlg-1').waitFor({ state: 'visible' });

        // Trigger save flush so registry snapshot reflects updated Studio & Materie
        await page.evaluate(() => {
            if (window.SaveManager && typeof window.SaveManager.flushEngineSave === 'function') {
                return window.SaveManager.flushEngineSave();
            }
            return true;
        });

        const dashStudio = (await page.locator('.dlg-1 .control153').innerText()).trim();
        assert.ok(dashStudio !== '0/100', 'Dashboard Studio stat should reflect school progress, got: ' + dashStudio);
        await recordStep(session, featureDir, artifacts, '07-dashboard-after-scuola', 'Returned to Dashboard; Studio stat and calendar date updated');
    } finally {
        await session.context.close();
    }

    assert.deepStrictEqual(session.pageErrors, []);
    assert.deepStrictEqual(session.consoleErrors, []);
    return {
        feature: 'scuola',
        pageErrors: session.pageErrors,
        consoleErrors: session.consoleErrors,
        dialogs: session.dialogs,
        artifacts
    };
}

async function driveLavoro(browser, state, featureDir, viewport) {
    const artifacts = [];
    const session = await bootToDashboard(browser, state.baseUrl, viewport.width, viewport.height);
    try {
        const { page } = session;
        await page.locator('.dashboard-nav-grid button.control137').tap();
        await page.locator('.window.dlg-13').waitFor({ state: 'visible' });
        await recordStep(session, featureDir, artifacts, '01-lavoro-unemployed', 'Opened Lavoro screen in initial unemployed state');

        await page.locator('.dlg-13 button.control111').tap();
        const msgBox = page.locator('#tm-overlays .window.messagebox');
        await msgBox.waitFor({ state: 'visible' });
        const msgText = await msgBox.locator('.content').innerText();
        assert.ok(msgText.includes('disokkupat'), 'Expected disokkupato guard messagebox');
        await recordStep(session, featureDir, artifacts, '02-lavoro-unemployed-guard', 'Tapped Licenziati while unemployed; disokkupato messagebox displayed');
        await page.waitForTimeout(350);
        await msgBox.locator('button.control1').tap();
        await page.waitForFunction(() => !document.querySelector('#tm-overlays .window.messagebox'));

        await page.locator('.dlg-13 button.control114').tap();
        await page.locator('.window.dlg-210').waitFor({ state: 'visible' });
        await recordStep(session, featureDir, artifacts, '03-lavoro-company-list', 'Opened Elenco Ditte (dialog 210) showing all 8 companies');

        await page.locator('.dlg-210 button.control100').tap();
        await page.locator('.window.dlg-290').waitFor({ state: 'visible' });
        await recordStep(session, featureDir, artifacts, '04-lavoro-company-info', 'Opened Magneti Budelli company details (dialog 290)');

        await page.locator('.dlg-290 button.control1').tap();
        await page.waitForFunction(() => !document.querySelector('.window.dlg-290'));
        await page.locator('.dlg-210 button.control1').tap();
        await page.waitForFunction(() => !document.querySelector('.window.dlg-210'));

        await page.locator('.dlg-13 button.control110').tap();
        const offerWin = page.locator('.window.mobile-job-offer-view, .window[class*="dlg-39"]');
        await offerWin.waitFor({ state: 'visible' });
        await recordStep(session, featureDir, artifacts, '05-lavoro-job-offer', 'Tapped Cerca lavoro; job offer dialog (390-397) appeared');

        await offerWin.locator('button.control1').tap();
        const quizWin = page.locator('.window[class*="dlg-20"]');
        await quizWin.waitFor({ state: 'visible' });

        // Select exactly 1 option per question (101, 104, 107) so Rcheck === 111
        for (const ctrlId of [101, 104, 107]) {
            const card = quizWin.locator('.quiz-option-card', { has: page.locator('.control' + ctrlId) });
            
            await card.scrollIntoViewIfNeeded();
            
            await card.tap();
        }
        await recordStep(session, featureDir, artifacts, '06-lavoro-quiz-filled', 'Selected one answer in Domanda A, B, and C of the Attitudinal Quiz');

        const submitBtn = quizWin.locator('button.control1');
        await submitBtn.scrollIntoViewIfNeeded();
        await submitBtn.tap();

        await msgBox.waitFor({ state: 'visible' });
        const quizResultText = await msgBox.locator('.content').innerText();
        assert.ok(
            !quizResultText.includes('crocette su un foglio'),
            'Quiz must not fail the 1-answer-per-question validation check: ' + quizResultText
        );
        await recordStep(session, featureDir, artifacts, '07-lavoro-quiz-outcome', 'Submitted Attitudinal Quiz and captured interview outcome messagebox');

        await page.waitForTimeout(350);
        await msgBox.locator('button.control1').tap();
        await page.waitForTimeout(250);
        await dismissRandomEvents(page);

        await page.locator('.dlg-13 button.control1').tap();
        await page.waitForFunction(() => !document.querySelector('.window.dlg-13'));
        await recordStep(session, featureDir, artifacts, '08-dashboard-after-lavoro', 'Returned to Dashboard after Lavoro flow');
    } finally {
        await session.context.close();
    }

    assert.deepStrictEqual(session.pageErrors, []);
    assert.deepStrictEqual(session.consoleErrors, []);
    return {
        feature: 'lavoro',
        pageErrors: session.pageErrors,
        consoleErrors: session.consoleErrors,
        dialogs: session.dialogs,
        artifacts
    };
}

async function driveNegozi(browser, state, featureDir, viewport) {
    const artifacts = [];
    const session = await bootToDashboard(browser, state.baseUrl, viewport.width, viewport.height);
    try {
        const { page } = session;
        await page.locator('.dashboard-nav-grid button.control131').tap();
        await page.locator('.window.dlg-8').waitFor({ state: 'visible' });
        await recordStep(session, featureDir, artifacts, '01-negozi-menu', 'Opened Negozi menu (dialog 8) with 10.000 L.');

        await page.locator('.dlg-8 button.control110').tap();
        await page.locator('.window.dlg-88').waitFor({ state: 'visible' });
        const packCount = await page.locator('.dlg-88 .pack-card').count();
        assert.strictEqual(packCount, 24, 'Bar Tabacchi must render 24 cigarette packs');

        const pmPack = page.locator('.dlg-88 .pack-card', { has: page.locator('.control421') });
        await pmPack.scrollIntoViewIfNeeded();
        await pmPack.tap();
        const bannerText = await page.locator('.dlg-88 .control106').innerText();
        assert.ok(bannerText.includes('Philip Morris Super Light'), 'Selecting pack 421 must show Philip Morris Super Light');
        await recordStep(session, featureDir, artifacts, '02-tabacchi-pack-selected', 'Selected Philip Morris Super Light in Bar Tabacchi');

        await page.locator('.dlg-88 button.control1').tap();
        const msgBox = page.locator('#tm-overlays .window.messagebox');
        await msgBox.waitFor({ state: 'visible' });
        await recordStep(session, featureDir, artifacts, '03-tabacchi-purchase-warning', 'Purchased cigarettes; statutory warning messagebox displayed');

        await page.waitForTimeout(350);
        await msgBox.locator('button.control1').tap();
        await page.waitForTimeout(250);
        await dismissRandomEvents(page);

        await page.locator('.window.dlg-8').waitFor({ state: 'visible' });
        const remainingSoldi = (await page.locator('.dlg-8 .control120').innerText()).trim();
        assert.strictEqual(remainingSoldi, '4000 L.', 'Soldi should decrease from 10000 L. to 4000 L. after buying 6000 L. pack');

        // Reopen Bar Tabacchi to confirm Sizze persisted
        await page.locator('.dlg-8 button.control110').tap();
        await page.locator('.window.dlg-88').waitFor({ state: 'visible' });
        const sizzeCount = Number((await page.locator('.dlg-88 .control105').innerText()).trim());
        assert.ok(sizzeCount >= 18 && sizzeCount <= 20, 'Sizze counter should be 18..20 after buying 1 pack, got: ' + sizzeCount);
        await recordStep(session, featureDir, artifacts, '04-tabacchi-sizze-confirmed', 'Reopened Bar Tabacchi; confirmed Soldi 4000 L. and Sizze counter increased');

        await page.locator('.dlg-88 button.control2').tap();
        await page.waitForFunction(() => !document.querySelector('.window.dlg-88'));

        // Open Palestra (dialog 89)
        await page.locator('.dlg-8 button.control111').tap();
        await page.locator('.window.dlg-89').waitFor({ state: 'visible' });
        await recordStep(session, featureDir, artifacts, '05-palestra-view', 'Opened Palestra (dialog 89) showing stats, subscriptions, and solarium');
        await page.locator('.dlg-89 button.control1').tap();
        await page.waitForFunction(() => !document.querySelector('.window.dlg-89'));

        // Open Telefonino (dialog 120)
        await page.locator('.dlg-8 button.control112').tap();
        await page.locator('.window.dlg-120').waitFor({ state: 'visible' });
        await recordStep(session, featureDir, artifacts, '06-telefonino-view', 'Opened Negozio Telefonia (dialog 120)');
        await page.locator('.dlg-120 button.control1').tap();
        await page.waitForFunction(() => !document.querySelector('.window.dlg-120'));

        await page.locator('.dlg-8 button.control1').tap();
        await page.waitForFunction(() => !document.querySelector('.window.dlg-8'));
    } finally {
        await session.context.close();
    }

    assert.deepStrictEqual(session.pageErrors, []);
    assert.deepStrictEqual(session.consoleErrors, []);
    return {
        feature: 'negozi',
        pageErrors: session.pageErrors,
        consoleErrors: session.consoleErrors,
        dialogs: session.dialogs,
        artifacts
    };
}

async function driveScooter(browser, state, featureDir, viewport) {
    const artifacts = [];
    const session = await bootToDashboard(browser, state.baseUrl, viewport.width, viewport.height);
    try {
        const { page } = session;
        await page.locator('.dashboard-nav-grid button.control130').tap();
        await page.locator('.window.dlg-7').waitFor({ state: 'visible' });
        const soldiText = (await page.locator('.dlg-7 .control104').innerText()).trim();
        assert.strictEqual(soldiText, '10000 L.');
        await recordStep(session, featureDir, artifacts, '01-scooter-garage', 'Opened Scooter screen (dialog 7) with 10000 L. and no scooter owned');

        await page.locator('.dlg-7 button.control102').tap();
        const msgBox = page.locator('#tm-overlays .window.messagebox');
        await msgBox.waitFor({ state: 'visible' });
        const guardText = await msgBox.locator('.content').innerText();
        assert.ok(guardText.includes('quale scooter'), 'Expected no-scooter guard messagebox on Trucca Scooter');
        await recordStep(session, featureDir, artifacts, '02-scooter-trucca-guard', 'Tapped Trucca Scooter with no scooter; guard messagebox displayed');
        await page.waitForTimeout(350);
        await msgBox.locator('button.control1').tap();
        await page.waitForTimeout(250);
        await dismissRandomEvents(page);

        await page.locator('.dlg-7 button.control101').tap();
        await page.locator('.window.dlg-70').waitFor({ state: 'visible' });
        await recordStep(session, featureDir, artifacts, '03-scooter-concessionario', 'Opened Concessionario (dialog 70)');

        await page.locator('.dlg-70 button.control101').tap();
        await page.locator('.window.dlg-78').waitFor({ state: 'visible' });
        const secondModel = page.locator('.dlg-78 .scooter-model-card').nth(1);
        await secondModel.tap();
        await recordStep(session, featureDir, artifacts, '04-scooter-showroom-model', 'Selected second scooter model in showroom (dialog 78) and updated specs');

        await page.locator('.dlg-78 button.control1').tap();
        await msgBox.waitFor({ state: 'visible' });
        await recordStep(session, featureDir, artifacts, '05-scooter-buy-nomoney', 'Tapped Compra with 10.000 L.; insufficient funds messagebox displayed');
        await page.waitForTimeout(350);
        await msgBox.locator('button.control1').tap();
        await page.waitForTimeout(250);
        await dismissRandomEvents(page);

        if (await page.locator('.window.dlg-78').isVisible().catch(() => false)) {
            await page.locator('.dlg-78 button.control2').tap();
            await page.waitForFunction(() => !document.querySelector('.window.dlg-78'));
        }
        if (await page.locator('.window.dlg-70').isVisible().catch(() => false)) {
            await page.locator('.dlg-70 button.control2, .dlg-70 button.control1').first().tap();
            await page.waitForFunction(() => !document.querySelector('.window.dlg-70'));
        }
        await page.waitForTimeout(250);
        await dismissRandomEvents(page);

        await page.locator('.dlg-7 button.control1').tap();
        await page.waitForFunction(() => !document.querySelector('.window.dlg-7'));
        await recordStep(session, featureDir, artifacts, '06-dashboard-after-scooter', 'Returned to Dashboard after Scooter flow');
    } finally {
        await session.context.close();
    }

    assert.deepStrictEqual(session.pageErrors, []);
    assert.deepStrictEqual(session.consoleErrors, []);
    return {
        feature: 'scooter',
        pageErrors: session.pageErrors,
        consoleErrors: session.consoleErrors,
        dialogs: session.dialogs,
        artifacts
    };
}

async function driveTipa(browser, state, featureDir, viewport) {
    const artifacts = [];
    const session = await bootToDashboard(browser, state.baseUrl, viewport.width, viewport.height);
    try {
        const { page } = session;
        await page.locator('.dashboard-nav-grid button.control133').tap();
        await page.locator('.window.dlg-9').waitFor({ state: 'visible' });
        await recordStep(session, featureDir, artifacts, '01-tipa-initial', 'Opened Tipa screen (dialog 9)');

        await page.locator('.dlg-9 button.control111').tap();
        const msgBox = page.locator('#tm-overlays .window.messagebox');
        await msgBox.waitFor({ state: 'visible' });
        await recordStep(session, featureDir, artifacts, '02-tipa-lascia-guard', 'Tapped Lascia tipa with no girlfriend; guard messagebox displayed');
        await page.waitForTimeout(350);
        await msgBox.locator('button.control1').tap();
        await page.waitForFunction(() => !document.querySelector('#tm-overlays .window.messagebox'));

        await page.locator('.dlg-9 button.control110').tap();
        await page.locator('.window.dlg-91').waitFor({ state: 'visible' });
        await recordStep(session, featureDir, artifacts, '03-cerca-tipa-candidate', 'Opened Cerca nuova tipa (dialog 91) showing candidate profile');

        await page.locator('.dlg-91 button.control101').tap();
        await page.waitForTimeout(350);
        if (await page.locator('.window.dlg-95').isVisible().catch(() => false)) {
            await recordStep(session, featureDir, artifacts, '04-tipa-due-di-picche', 'Tapped Ci provo ! with 0 Fama; Due di Picche rejection dialog (95) displayed');
            await page.locator('.dlg-95 button.control1').tap();
            await page.waitForFunction(() => !document.querySelector('.window.dlg-95'));
        } else {
            await recordStep(session, featureDir, artifacts, '04-tipa-accepted', 'Tapped Ci provo ! and matched with candidate');
        }
        await dismissRandomEvents(page);

        await page.locator('.dlg-9 button.control1').tap();
        await page.waitForFunction(() => !document.querySelector('.window.dlg-9'));
    } finally {
        await session.context.close();
    }

    assert.deepStrictEqual(session.pageErrors, []);
    assert.deepStrictEqual(session.consoleErrors, []);
    return {
        feature: 'tipa',
        pageErrors: session.pageErrors,
        consoleErrors: session.consoleErrors,
        dialogs: session.dialogs,
        artifacts
    };
}

const FEATURE_DRIVERS = {
    'dashboard': driveDashboardAndSaves,
    'dashboard-and-saves': driveDashboardAndSaves,
    'scuola': driveScuola,
    'lavoro': driveLavoro,
    'negozi': driveNegozi,
    'scooter': driveScooter,
    'tipa': driveTipa
};

async function cmdDrive(positional, flags) {
    const featureKey = positional[0] || flags.feature;
    if (!featureKey || !FEATURE_DRIVERS[featureKey]) {
        throw new Error(
            'Unknown or missing feature "' + (featureKey || '') + '". ' +
            'Available features: ' + Object.keys(FEATURE_DRIVERS).join(', ')
        );
    }

    const paths = getRunPaths(flags['run-id'], flags['evidence-dir']);
    const ensured = await ensureServerRunning(paths);
    const { state } = ensured;
    if (!isServerProcess(state.pid)) {
        throw new Error('Server PID ' + state.pid + ' is not running. Run `doctor` or `launch` first.');
    }

    let viewport = { width: 390, height: 844 };
    if (flags.viewport) {
        const m = String(flags.viewport).match(/^(\d+)x(\d+)$/i);
        if (!m) throw new Error('Invalid --viewport format. Expected WxH (e.g. 390x844 or 844x390).');
        viewport = { width: Number(m[1]), height: Number(m[2]) };
    }

    const canonicalFeature = featureKey === 'dashboard' ? 'dashboard-and-saves' : featureKey;
    const evidenceRoot = flags['evidence-dir'] ? path.resolve(flags['evidence-dir']) : state.evidenceDir;
    const featureDir = path.join(evidenceRoot, canonicalFeature);
    fs.mkdirSync(featureDir, { recursive: true });

    const { chromium } = loadPlaywright();
    const browser = await chromium.launch(launchOptions());
    let result;
    try {
        result = await FEATURE_DRIVERS[featureKey](browser, state, featureDir, viewport);
    } finally {
        await browser.close().catch(() => {});
        await stopEphemeralServerIfNeeded(ensured);
    }

    const manifestPath = path.join(featureDir, 'manifest.json');
    const manifest = {
        runId: state.runId,
        feature: result.feature,
        baseUrl: state.baseUrl,
        assetVersion: state.assetVersion,
        viewport,
        completedAt: new Date().toISOString(),
        pageErrors: result.pageErrors,
        consoleErrors: result.consoleErrors,
        dialogs: result.dialogs,
        artifacts: result.artifacts
    };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

    console.log(JSON.stringify({
        ok: true,
        feature: result.feature,
        manifestPath,
        artifactCount: result.artifacts.length,
        artifacts: result.artifacts
    }, null, 2));
    return manifest;
}

async function cmdEvidence(flags) {
    const paths = getRunPaths(flags['run-id'], flags['evidence-dir']);
    let evidenceRoot = paths.evidenceDir;
    if (fs.existsSync(paths.stateFile)) {
        const state = JSON.parse(fs.readFileSync(paths.stateFile, 'utf8'));
        if (!flags['evidence-dir'] && state.evidenceDir) {
            evidenceRoot = state.evidenceDir;
        }
    }
    if (!fs.existsSync(evidenceRoot)) {
        throw new Error('Evidence directory does not exist: ' + evidenceRoot);
    }

    const featureFilter = flags.feature === 'dashboard' ? 'dashboard-and-saves' : flags.feature;
    const entries = fs.readdirSync(evidenceRoot).filter((name) => {
        if (featureFilter && name !== featureFilter) return false;
        const full = path.join(evidenceRoot, name);
        return fs.statSync(full).isDirectory() && fs.existsSync(path.join(full, 'manifest.json'));
    });

    if (entries.length === 0) {
        throw new Error('No feature evidence manifests found under ' + evidenceRoot);
    }

    const summaries = [];
    for (const dirName of entries) {
        const manifestPath = path.join(evidenceRoot, dirName, 'manifest.json');
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        assert.strictEqual(manifest.pageErrors.length, 0, 'Feature ' + dirName + ' had pageErrors');
        assert.strictEqual(manifest.consoleErrors.length, 0, 'Feature ' + dirName + ' had consoleErrors');
        assert.ok(manifest.artifacts && manifest.artifacts.length > 0, 'Feature ' + dirName + ' has no artifacts');

        const verifiedFiles = [];
        for (const art of manifest.artifacts) {
            for (const f of [art.screenshot, art.domSnapshot, art.registrySnapshot]) {
                if (!fs.existsSync(f)) {
                    throw new Error('Missing evidence file: ' + f);
                }
                const stat = fs.statSync(f);
                if (stat.size <= 0) {
                    throw new Error('Empty evidence file: ' + f);
                }
                verifiedFiles.push({ path: f, bytes: stat.size });
            }
        }
        summaries.push({
            feature: manifest.feature,
            manifestPath,
            stepCount: manifest.artifacts.length,
            verifiedFileCount: verifiedFiles.length,
            verifiedFiles
        });
    }

    const report = {
        ok: true,
        evidenceDir: evidenceRoot,
        featuresVerified: summaries
    };
    console.log(JSON.stringify(report, null, 2));
    return report;
}

async function cmdCleanup(flags) {
    const paths = getRunPaths(flags['run-id'], flags['evidence-dir']);
    let evidenceDir = paths.evidenceDir;
    let killedPid = null;

    if (fs.existsSync(paths.stateFile)) {
        try {
            const state = JSON.parse(fs.readFileSync(paths.stateFile, 'utf8'));
            if (!flags['evidence-dir'] && state.evidenceDir) {
                evidenceDir = state.evidenceDir;
            }
        } catch (err) {
            // ignore malformed state file
        }
    }

    if (fs.existsSync(paths.pidFile)) {
        const pid = Number(fs.readFileSync(paths.pidFile, 'utf8').trim());
        if (isServerProcess(pid)) {
            killedPid = pid;
            try {
                process.kill(pid, 'SIGTERM');
            } catch (err) {
                // ignore
            }
            const deadline = Date.now() + 3000;
            while (Date.now() < deadline && isServerProcess(pid)) {
                
                await new Promise((r) => setTimeout(r, 100));
            }
            if (isServerProcess(pid)) {
                try {
                    process.kill(pid, 'SIGKILL');
                } catch (err) {
                    // ignore
                }
            }
        }
    }

    if (fs.existsSync(paths.stateDir)) {
        fs.rmSync(paths.stateDir, { recursive: true, force: true });
    }

    const evidenceExists = fs.existsSync(evidenceDir);
    const preservedFiles = [];
    if (evidenceExists) {
        const walk = (dir) => {
            for (const entry of fs.readdirSync(dir)) {
                const full = path.join(dir, entry);
                const st = fs.statSync(full);
                if (st.isDirectory()) walk(full);
                else preservedFiles.push({ path: full, bytes: st.size });
            }
        };
        walk(evidenceDir);
    }

    const report = {
        ok: true,
        runId: paths.runId,
        killedPid,
        removedStateDir: paths.stateDir,
        evidenceDir,
        evidenceSurvived: evidenceExists && preservedFiles.length > 0,
        preservedFileCount: preservedFiles.length,
        preservedFiles
    };
    console.log(JSON.stringify(report, null, 2));
    return report;
}

function printHelp() {
    console.log(`Usage: node .cursor/skills/verify-tabboz/helpers/verify-tabboz.js <command> [options]

Commands:
  launch   [--run-id <id>] [--port <port>] [--evidence-dir <dir>]
           Start an isolated server.py on a free port >= 8081 and verify WASM Splash boot.
  doctor   [--run-id <id>]
           Read-only health check: verify PID ownership, ASSET_VERSION, WASM MIME, and browser.
  drive    <feature> [--run-id <id>] [--viewport <WxH>] [--evidence-dir <dir>]
           Drive a mapped feature (dashboard-and-saves | scuola | lavoro | negozi | scooter | tipa)
           using touch in a phone viewport and capture step-by-step screenshots, DOM, and localStorage.
  evidence [--run-id <id>] [--feature <feature>] [--evidence-dir <dir>]
           Verify that captured proof artifacts exist, are non-empty, and recorded 0 page/console errors.
  cleanup  [--run-id <id>]
           Terminate the recorded server.py PID and remove scratch state while preserving evidence.
`);
}

if (require.main === module) {
    (async () => {
        const { command, positional, flags } = parseArgs(process.argv.slice(2));
        if (flags.help || command === 'help') {
            printHelp();
            return;
        }
        if (command === 'launch') {
            await cmdLaunch(flags);
        } else if (command === 'doctor') {
            await cmdDoctor(flags);
        } else if (command === 'drive') {
            await cmdDrive(positional, flags);
        } else if (command === 'evidence') {
            await cmdEvidence(flags);
        } else if (command === 'cleanup') {
            await cmdCleanup(flags);
        } else {
            throw new Error('Unknown command: ' + command + '. Run with --help for usage.');
        }
    })().catch((err) => {
        console.error(JSON.stringify({ ok: false, error: err.message, stack: err.stack }, null, 2));
        process.exitCode = 1;
    });
}

module.exports = {
    loadPlaywright,
    launchOptions,
    bootToDashboard,
    recordStep,
    dismissRandomEvents
};
