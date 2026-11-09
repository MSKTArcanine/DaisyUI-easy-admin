const root = document.querySelector('[data-ea-ui]');
const toggle = document.querySelector('[data-testid="preview-theme-toggle"]');

toggle.addEventListener('click', () => {
    const dark = root.dataset.theme !== 'easyadmin-dark';
    root.dataset.theme = dark ? 'easyadmin-dark' : 'easyadmin-light';
    toggle.setAttribute('aria-pressed', String(dark));
});

window.previewFixtureReady = true;
