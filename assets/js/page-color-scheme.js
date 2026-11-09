const colorSchemeKey = Symbol.for('easyadmin.color-scheme');
const colorSchemeStorageKey = 'ea/colorScheme';
const colorSchemeMedia = matchMedia('(prefers-color-scheme: dark)');
const selectedColorScheme = () => {
    if (document.body.getAttribute('data-ea-dark-scheme-is-enabled') === 'false') {
        return 'light';
    }
    const preference =
        localStorage.getItem(colorSchemeStorageKey) ||
        document.body.getAttribute('data-ea-default-color-scheme') ||
        'auto';
    return ['light', 'dark', 'auto'].includes(preference) ? preference : 'auto';
};
const applyColorScheme = () => {
    const selected = selectedColorScheme();
    const resolved = selected === 'auto' ? (colorSchemeMedia.matches ? 'dark' : 'light') : selected;
    document.body.classList.toggle('ea-light-scheme', resolved === 'light');
    document.body.classList.toggle('ea-dark-scheme', resolved === 'dark');
    document.body.style.colorScheme = resolved;
    document.body.setAttribute('data-theme', `easyadmin-${resolved}`);
    document.body.setAttribute('data-bs-theme', resolved);
    for (const option of document.querySelectorAll('[data-ea-color-scheme]')) {
        const checked = option.getAttribute('data-ea-color-scheme') === selected;
        option.setAttribute('aria-checked', String(checked));
        option.classList.toggle('active', checked);
    }
};

applyColorScheme();
if (!document[colorSchemeKey]) {
    document[colorSchemeKey] = true;
    colorSchemeMedia.addEventListener('change', applyColorScheme);
    document.addEventListener('DOMContentLoaded', applyColorScheme);
    document.addEventListener('click', (event) => {
        const option = event.target.closest('[data-ea-color-scheme]');
        if (!option) {
            return;
        }
        event.preventDefault();
        const selected = option.getAttribute('data-ea-color-scheme');
        if (!['light', 'dark', 'auto'].includes(selected)) {
            return;
        }
        localStorage.setItem(
            colorSchemeStorageKey,
            document.body.getAttribute('data-ea-dark-scheme-is-enabled') === 'false' ? 'light' : selected
        );
        applyColorScheme();
    });
    window.addEventListener('storage', (event) => {
        if (event.key === colorSchemeStorageKey || event.key === null) {
            applyColorScheme();
        }
    });
}
