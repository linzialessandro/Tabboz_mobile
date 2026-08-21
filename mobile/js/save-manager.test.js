'use strict';

const assert = require('assert');
const {
    validateSaveData,
    parseSaveJson,
    isAllowedRegistryKey,
    SAVE
} = require('./save-manager.js');

const PREFIX = SAVE.REG_PREFIX;

function validSave(extraKeys) {
    const registry = {};
    registry[PREFIX + '\\Nome'] = '{"value":"Piero"}';
    Object.assign(registry, extraKeys || {});
    return { meta: { name: 'Piero' }, registry };
}

let passed = 0;
function test(name, fn) {
    fn();
    passed += 1;
    console.log('ok', name);
}

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
    const poisoned = validSave({ 'HACKED': '1' });
    assert.ok(validateSaveData(poisoned));
    assert.strictEqual(isAllowedRegistryKey('HACKED'), false);
    assert.strictEqual(isAllowedRegistryKey(PREFIX + '\\Soldi'), true);
});

test('rejects slot metadata keys and prototype pollution', () => {
    assert.strictEqual(isAllowedRegistryKey(SAVE.SLOTS_KEY), false);
    assert.strictEqual(isAllowedRegistryKey(SAVE.SLOT_PREFIX + '1'), false);
    const proto = JSON.parse('{"registry": {"__proto__": {"polluted": true}, "' + PREFIX.replace(/\\/g, '\\\\') + '\\\\Nome": "x"}}');
    // JSON.parse without reviver may pollute; our parser must not accept it.
    assert.throws(
        () => parseSaveJson('{"registry":{"__proto__":{"x":1}}}'),
        /non valido|non consentite|non contiene dati/i
    );
});

test('rejects oversized payloads', () => {
    const huge = 'x'.repeat(SAVE.MAX_BYTES + 1);
    assert.throws(() => parseSaveJson(huge), /troppo grande/);
    const tooBigValue = validSave();
    tooBigValue.registry[PREFIX + '\\Nome'] = 'y'.repeat(SAVE.MAX_VALUE_LENGTH + 1);
    assert.ok(validateSaveData(tooBigValue));
});

test('rejects non-string registry values', () => {
    const save = validSave();
    save.registry[PREFIX + '\\Nome'] = { nested: true };
    assert.ok(validateSaveData(save));
});

console.log('\n' + passed + ' tests passed');
