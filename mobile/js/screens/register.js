/**
 * Dialog transformer registry.
 * Domain files call registerTransformers / registerRanges; the Win32 bridge
 * only calls TM.transformDialog.
 */
((TM) => {
    'use strict';

    TM._exact = TM._exact || Object.create(null);
    TM._ranges = TM._ranges || [];
    TM._generic = TM._generic || function transformUnregistered() {};

    TM.registerTransformers = function registerTransformers(map) {
        Object.keys(map).forEach((key) => {
            TM._exact[Number(key)] = map[key];
        });
    };

    TM.registerRanges = function registerRanges(ranges) {
        for (let i = 0; i < ranges.length; i++) {
            TM._ranges.push(ranges[i]);
        }
    };

    TM.setGenericTransformer = function setGenericTransformer(fn) {
        TM._generic = fn;
    };

    TM.resolveTransformer = function resolveTransformer(dialogNum) {
        const exact = TM._exact[dialogNum];
        if (exact) return exact;
        for (let i = 0; i < TM._ranges.length; i++) {
            const range = TM._ranges[i];
            if (dialogNum >= range.min && dialogNum <= range.max) return range.fn;
        }
        return TM._generic;
    };

    TM.transformDialog = function transformDialog(win, hWnd, dialogNum) {
        TM.resolveTransformer(dialogNum)(win, hWnd);
    };

    TM.registeredDialogIds = function registeredDialogIds() {
        const ids = Object.keys(TM._exact).map(Number);
        TM._ranges.forEach((range) => {
            for (let id = range.min; id <= range.max; id++) ids.push(id);
        });
        return ids.sort((a, b) => a - b).filter((id, index, all) => all.indexOf(id) === index);
    };
})(window.TabbozMobile = window.TabbozMobile || {});
