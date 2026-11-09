const root = document.querySelector('[data-ea-ui]');
const toggle = document.querySelector('[data-testid="preview-theme-toggle"]');

toggle.addEventListener('click', () => {
    const dark = root.dataset.theme !== 'easyadmin-dark';
    root.dataset.theme = dark ? 'easyadmin-dark' : 'easyadmin-light';
    root.classList.toggle('ea-dark-scheme', dark);
    root.classList.toggle('ea-light-scheme', !dark);
    toggle.setAttribute('aria-pressed', String(dark));
});

window.previewFixtureReady = true;
