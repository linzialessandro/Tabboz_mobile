'use strict';

/**
 * Headless tests for the mobile layer (no browser, no WASM).
 * Run: node mobile/js/test.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = __dirname;

global.window = global;
global.self = global;
global.document = undefined;

function load(rel) {
    const file = path.join(ROOT, rel);
    vm.runInThisContext(fs.readFileSync(file, 'utf8'), { filename: file });
}

load('version.js');
load('config.js');
load('ui-kit.js');
load('screens/register.js');
load('screens/home.js');
load('screens/life.js');
load('screens/shops.js');
load('screens/jobs.js');
load('screens/phone.js');
load('screens/events.js');
load('save-manager.js');

const TM = global.TabbozMobile;
const {
    validateSaveData,
    parseSaveJson,
    isAllowedRegistryKey,
    SAVE
} = require('./save-manager.js');

let passed = 0;
function test(name, fn) {
    fn();
    passed += 1;
    console.log('ok', name);
}

const PREFIX = SAVE.REG_PREFIX;

function validSave(extraKeys) {
    const registry = {};
    registry[PREFIX + '\\Nome'] = '{"value":"Piero"}';
    Object.assign(registry, extraKeys || {});
    return { meta: { name: 'Piero' }, registry };
}

test('version.js is the single ASSET_VERSION source', () => {
    assert.strictEqual(typeof TM.ASSET_VERSION, 'string');
    assert.ok(/^\d+$/.test(TM.ASSET_VERSION));
    const versionSrc = fs.readFileSync(path.join(ROOT, 'version.js'), 'utf8');
    const configSrc = fs.readFileSync(path.join(ROOT, 'config.js'), 'utf8');
    const swSrc = fs.readFileSync(path.join(ROOT, '..', 'sw.js'), 'utf8');
    assert.ok(versionSrc.indexOf("ASSET_VERSION = '" + TM.ASSET_VERSION + "'") !== -1);
    assert.ok(configSrc.indexOf('ASSET_VERSION') === -1);
    assert.ok(swSrc.indexOf('importScripts') !== -1);
    assert.ok(swSrc.indexOf("ASSET_VERSION = '") === -1);
});

test('accepts a well-formed registry save', () => {
    assert.strictEqual(validateSaveData(validSave()), null);
    const parsed = parseSaveJson(JSON.stringify(validSave()));
    assert.strictEqual(parsed.registry[PREFIX + '\\Nome'], '{"value":"Piero"}');
});

test('rejects missing registry', () => {
    assert.ok(validateSaveData({ meta: {} }));
    assert.ok(validateSaveData(null));
    assert.ok(validateSaveData([]));
});

test('rejects keys outside the Tabboz registry prefix', () => {
    assert.ok(validateSaveData(validSave({ HACKED: '1' })));
    assert.strictEqual(isAllowedRegistryKey('HACKED'), false);
    assert.strictEqual(isAllowedRegistryKey(PREFIX + '\\Soldi'), true);
});

test('rejects slot metadata keys and prototype pollution', () => {
    assert.strictEqual(isAllowedRegistryKey(SAVE.SLOTS_KEY), false);
    assert.strictEqual(isAllowedRegistryKey(SAVE.SLOT_PREFIX + '1'), false);
    assert.throws(
        () => parseSaveJson('{"registry":{"__proto__":{"x":1}}}'),
        /non valido|non consentite|non contiene dati/i
    );
});

test('rejects oversized payloads and non-string values', () => {
    assert.throws(() => parseSaveJson('x'.repeat(SAVE.MAX_BYTES + 1)), /troppo grande/);
    const tooBig = validSave();
    tooBig.registry[PREFIX + '\\Nome'] = 'y'.repeat(SAVE.MAX_VALUE_LENGTH + 1);
    assert.ok(validateSaveData(tooBig));
    const nested = validSave();
    nested.registry[PREFIX + '\\Nome'] = { nested: true };
    assert.ok(validateSaveData(nested));
});

test('sanitizeItalianText decodes CP1252 escapes', () => {
    assert.strictEqual(TM.ui.sanitizeItalianText('perch\\xE9'), 'perché');
    assert.strictEqual(TM.ui.sanitizeItalianText('l\\x27isola'), "l'isola");
});

test('parseWindowHwnd only accepts winN ids', () => {
    assert.strictEqual(TM.ui.parseWindowHwnd({ id: 'win12' }), 12);
    assert.strictEqual(TM.ui.parseWindowHwnd({ id: 'win' }), null);
    assert.strictEqual(TM.ui.parseWindowHwnd({ id: 'save-manager-modal' }), null);
    assert.strictEqual(TM.ui.parseWindowHwnd({ id: 'wall3' }), null);
});

test('isCommandSource ignores static dlg_items', () => {
    const btn = { tagName: 'BUTTON', getAttribute: () => 'BorBtn' };
    const stat = { tagName: 'DIV', classList: { contains: () => true }, getAttribute: () => 'STATIC' };
    assert.strictEqual(TM.ui.isCommandSource(btn), true);
    assert.strictEqual(TM.ui.isCommandSource(stat), false);
});

test('extractControlId reads only .controlN', () => {
    const id = TM.ui.extractControlId;
    assert.strictEqual(id('dlg_item control101 mobile-btn'), 101);
    assert.strictEqual(id('button_ok dlg_item control1'), 1);
    assert.strictEqual(id('control61536 close-btn'), 61536);
    assert.strictEqual(id('window dlg-1'), null);
    assert.strictEqual(id('menu106'), null);
    assert.strictEqual(id('control'), null);
    assert.strictEqual(id(null), null);
    assert.strictEqual(id({}), null);
});

test('escapeHtml encodes markup', () => {
    assert.strictEqual(TM.ui.escapeHtml('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
    assert.strictEqual(TM.ui.escapeHtml('a&b'), 'a&amp;b');
});

test('home dialogs resolve to named transformers', () => {
    assert.strictEqual(TM.resolveTransformer(1).name, 'transformDashboard');
    assert.strictEqual(TM.resolveTransformer(2).name, 'transformAbout');
    assert.strictEqual(TM.resolveTransformer(12).name, 'transformSplash');
    assert.strictEqual(TM.resolveTransformer(16).name, 'transformExitSession');
});

test('shop / scooter ranges resolve', () => {
    assert.strictEqual(TM.resolveTransformer(8).name, 'transformNegoziMenu');
    assert.strictEqual(TM.resolveTransformer(80).name, 'transformShop');
    assert.strictEqual(TM.resolveTransformer(86).name, 'transformShop');
    assert.strictEqual(TM.resolveTransformer(7).name, 'transformScooter');
    assert.strictEqual(TM.resolveTransformer(71).name, 'transformScooterShop');
    assert.strictEqual(TM.resolveTransformer(75).name, 'transformScooterShowroom');
    assert.strictEqual(TM.resolveTransformer(89).name, 'transformPalestra');
});

test('life / jobs / phone / events resolve', () => {
    assert.strictEqual(TM.resolveTransformer(10).name, 'transformScuola');
    assert.strictEqual(TM.resolveTransformer(190).name, 'transformTipa');
    assert.strictEqual(TM.resolveTransformer(200).name, 'transformJobQuiz');
    assert.strictEqual(TM.resolveTransformer(210).name, 'transformCompanyList');
    assert.strictEqual(TM.resolveTransformer(390).name, 'transformJobOffer');
    assert.strictEqual(TM.resolveTransformer(120).name, 'transformCellulare');
    assert.strictEqual(TM.resolveTransformer(121).name, 'transformCompraCellulare');
    assert.strictEqual(TM.resolveTransformer(123).name, 'transformRicaricaCellulare');
    assert.strictEqual(TM.resolveTransformer(104).name, 'transformEventBeatdown');
});

test('unknown dialogs use the generic transformer', () => {
    assert.strictEqual(TM.resolveTransformer(14).name, 'transformGeneric');
    assert.strictEqual(TM.resolveTransformer(15).name, 'transformGeneric');
    assert.strictEqual(TM.resolveTransformer(17).name, 'transformGeneric');
    assert.strictEqual(TM.resolveTransformer(9999).name, 'transformGeneric');
});

test('personal info is not transformed as scuola', () => {
    assert.strictEqual(TM.resolveTransformer(10).name, 'transformScuola');
    assert.notStrictEqual(TM.resolveTransformer(11).name, 'transformScuola');
});

test('metallaro events use beatdown; dialog 96 does not', () => {
    assert.strictEqual(TM.resolveTransformer(100).name, 'transformEventBeatdown');
    assert.strictEqual(TM.resolveTransformer(107).name, 'transformEventBeatdown');
    assert.notStrictEqual(TM.resolveTransformer(96).name, 'transformEventBeatdown');
});

test('dismiss helpers exist on the UI kit', () => {
    assert.strictEqual(typeof TM.ui.installCloseButton, 'function');
    assert.strictEqual(typeof TM.ui.ensureDismissable, 'function');
    assert.strictEqual(typeof TM.ui.hideBrokenCoordinates, 'function');
});

test('every known dialog ID has a function transformer', () => {
    const ids = TM.KNOWN_DIALOGS;
    assert.ok(ids.length > 40);
    ids.forEach((id) => {
        const fn = TM.resolveTransformer(id);
        assert.strictEqual(typeof fn, 'function', 'missing transformer for dialog ' + id);
    });
    const registered = TM.registeredDialogIds();
    [1, 4, 7, 80, 89, 110, 120, 200, 390].forEach((id) => {
        assert.ok(registered.indexOf(id) !== -1, 'not registered: ' + id);
    });
});

test('version.js lists every screen and css file that exists', () => {
    const versionSrc = fs.readFileSync(path.join(ROOT, 'version.js'), 'utf8');
    const screens = fs.readdirSync(path.join(ROOT, 'screens')).filter((f) => f.endsWith('.js'));
    screens.forEach((file) => {
        assert.ok(versionSrc.indexOf('screens/' + file) !== -1, 'version.js missing ' + file);
    });
    const css = fs.readdirSync(path.join(ROOT, '..', 'css')).filter((f) => f.endsWith('.css') && f !== 'mobile.css');
    css.forEach((file) => {
        assert.ok(versionSrc.indexOf('css/' + file) !== -1, 'version.js missing css ' + file);
    });
});

console.log('\n' + passed + ' tests passed');
