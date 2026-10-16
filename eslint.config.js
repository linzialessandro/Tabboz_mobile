/**
 * Bug-finding checks for the mobile shell only.
 * The original engine (zarrosim.js / wasm) and vendored Novantotto
 * under mobile/resources are out of scope — do not lint them into a rewrite.
 */
'use strict';

const js = require('@eslint/js');
const globals = require('globals');

const emscripten = {
    Module: 'readonly',
    UTF8ToString: 'readonly',
    stringToUTF8: 'readonly',
    _malloc: 'readonly',
    _free: 'readonly',
    _AllocateControl: 'readonly',
    _PostMessage: 'readonly',
    _WinMainStartup: 'readonly',
    startGame: 'readonly',
    SaveManager: 'writable',
    TabbozMobile: 'writable'
};

module.exports = [
    {
        ignores: [
            'zarrosim.js',
            'mobile/resources/**',
            'resources/**',
            'node_modules/**'
        ]
    },
    {
        files: ['mobile/js/**/*.js', 'mobile/e2e/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'script',
            globals: {
                ...globals.browser,
                ...globals.node,
                ...emscripten
            }
        },
        rules: {
            ...js.configs.recommended.rules,
            // ABI stubs and event handlers often ignore a parameter on purpose.
            'no-unused-vars': ['error', {
                args: 'none',
                caughtErrors: 'none',
                varsIgnorePattern: '^_'
            }],
            'no-empty': ['error', { allowEmptyCatch: true }]
        }
    },
    {
        // Each screen file starts from the same helper header. Unused locals
        // there are the kit the next dialog may need, not a bug to rewrite for.
        files: ['mobile/js/screens/**/*.js'],
        rules: {
            'no-unused-vars': 'off'
        }
    },
    {
        files: ['mobile/sw.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'script',
            globals: {
                ...globals.serviceworker
            }
        },
        rules: {
            ...js.configs.recommended.rules,
            'no-unused-vars': ['error', {
                args: 'none',
                caughtErrors: 'none',
                varsIgnorePattern: '^_'
            }],
            'no-empty': ['error', { allowEmptyCatch: true }]
        }
    }
];
