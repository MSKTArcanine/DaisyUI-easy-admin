require('../css/app.css');

import * as bootstrap from 'bootstrap/js/index.esm.js';
import EventHandler from 'bootstrap/js/src/dom/event-handler.js';
import { initCrud } from './crud';

// temporary compatibility for downstream Bootstrap integrations until the final cutover
window.bootstrap = { ...bootstrap };

// temporary bridge: keep Bootstrap menu keys away from migrated native menus
const legacyMenuKeys = bootstrap.Dropdown.dataApiKeydownHandler;
EventHandler.off(document, 'keydown.bs.dropdown.data-api', '.dropdown-menu', legacyMenuKeys);
EventHandler.on(document, 'keydown.bs.dropdown.data-api', '.dropdown-menu', function (event) {
    if (!event.target.closest('[data-ea-menu]')) {
        legacyMenuKeys.call(this, event);
    }
});

document.addEventListener('DOMContentLoaded', () => initCrud());
