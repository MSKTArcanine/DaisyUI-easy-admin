import { initCrud } from './crud';

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initCrud());
} else {
    initCrud();
}
