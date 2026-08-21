/**
 * Tabboz Simulator Mobile - shared configuration.
 *
 * Based on Novantotto (MPL-2.0) and Tabboz Simulator (GPL-3.0).
 * Keep this file free of DOM / WASM side effects so it can load first.
 */
((TM) => {
    'use strict';

    TM.ASSET_VERSION = '31';
    TM.RESOURCE_BASE = '../resources';
    TM.WASM_URL = '../zarrosim.wasm';
    TM.WASM_JS_URL = '../zarrosim.js';

    TM.WM = {
        KEYDOWN: 0x100,
        COMMAND: 0x0111
    };

    TM.VK = {
        ESCAPE: 0x1B
    };

    TM.SM = {
        CXSCREEN: 0,
        CYSCREEN: 1
    };

    TM.CW = {
        USEDEFAULT: 0x8000,
        SKIPRESIZE: 0x8888
    };

    /**
     * Dialog resource IDs from zarrosim.h / resource.h.
     * Used by the screen registry; the C engine remains the source of truth.
     */
    TM.DLG = {
        DASHBOARD: 1,
        ABOUT: 2,
        DISCO: 4,
        FAMIGLIA: 5,
        COMPAGNIA: 6,
        SCOOTER: 7,
        NEGOZI_MENU: 8,
        TIPA: 9,
        SCUOLA: 10,
        SCUOLA_ALT: 11,
        SPLASH: 12,
        LAVORO: 13,
        EXIT_SESSION: 16,
        SCOOTER_SHOP_MIN: 70,
        SCOOTER_SHOP_MAX: 72,
        TRUCCA_SCOOTER: 73,
        SHOWROOM_MIN: 74,
        SHOWROOM_MAX: 79,
        SHOP_MIN: 80,
        SHOP_MAX: 86,
        TABACCHI: 88,
        PALESTRA: 89,
        CERCA_TIPA: 91,
        DUE_DONNE: 92,
        DATE_MIN: 93,
        DATE_MAX: 94,
        DUE_DI_PICCHE: 95,
        EVENT_BEATDOWN: 96,
        EVENTS_MIN: 100,
        EVENTS_MAX: 107,
        PAGELLA: 110,
        CELLULARE: 120,
        COMPRA_CELLULARE: 121,
        RICARICA_CELLULARE: 123,
        TIPA_ALT: 190,
        CERCA_TIPA_ALT: 191,
        DUE_DONNE_ALT: 192,
        JOB_QUIZ_MIN: 200,
        JOB_QUIZ_MAX: 209,
        COMPANY_LIST: 210,
        COMPANY_INFO_MIN: 290,
        COMPANY_INFO_MAX: 297,
        JOB_OFFER_MIN: 390,
        JOB_OFFER_MAX: 397
    };

    TM.KNOWN_DIALOGS = [
        1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
        70, 71, 72, 73, 74, 75, 76, 77, 78, 79,
        80, 81, 82, 83, 84, 85, 86, 88, 89,
        91, 92, 95, 96,
        100, 101, 102, 103, 104, 105, 106, 107, 110,
        120, 121, 123, 190, 191, 192,
        200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210,
        290, 291, 292, 293, 294, 295, 296, 297,
        390, 391, 392, 393, 394, 395, 396, 397
    ];

    TM.SAVE = {
        REG_PREFIX: 'HKEY_CURRENT_USER\\Software\\Obscured Truckware\\Tabboz Simulator 32',
        SLOTS_KEY: 'tabboz_mobile_slots_meta',
        SLOT_PREFIX: 'tabboz_slot_',
        MAX_SLOTS: 3,
        MAX_BYTES: 256 * 1024,
        MAX_KEYS: 200,
        MAX_VALUE_LENGTH: 8192
    };
})(window.TabbozMobile = window.TabbozMobile || {});
