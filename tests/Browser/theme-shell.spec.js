const { expect, test } = require('@playwright/test');
const { fixture, login } = require('./helpers');

test.beforeEach(async ({ page }) => {
    fixture('seed');
    await login(page);
});

test('public Theme configuration styles actual controls and fonts in both appearances', async ({ page }) => {
    await page.goto('/theme-admin?ui=tailwind&default=light');
    await expect(page.getByTestId('theme-dashboard-content')).toHaveText(
        'Public Theme configuration remains effective'
    );
    await expect(page.locator('body')).toHaveAttribute('data-theme', 'easyadmin-light');
    await expect(page.locator('body')).toHaveCSS('font-weight', '437');
    await expect(page.locator('body')).toHaveCSS('font-family', /IBM Plex Sans Variable/);
    await expect(page.locator('#theme-monospace')).toHaveCSS('font-family', /JetBrains Mono Variable/);
    const features = await page.locator('body').evaluate((body) => getComputedStyle(body).fontFeatureSettings);
    expect(features).toContain('tnum');
    expect(features).toContain('ss01');
    const rootSize = await page.locator('html').evaluate((html) => Number.parseFloat(getComputedStyle(html).fontSize));
    await expect(page.locator('#theme-primary')).toHaveCSS('border-top-left-radius', `${rootSize * 0.75}px`);
    await expect(page.locator('#theme-primary')).toHaveCSS('height', '32px');
    await expect(page.locator('#theme-spacing')).toHaveCSS('padding-inline-start', '24px');
    await expect(page.locator('#theme-primary')).toHaveCSS('background-color', await color(page, '#15803d'));
    await expect(page.locator('#theme-primary')).toHaveCSS('color', await color(page, '#fff'));
    const light = await themeValues(page);
    expect(light.gray).toBe(light.zinc);
    expect(light.primary).toBe('#15803d');
    await expect(page.locator('#theme-surface')).toHaveCSS('background-color', await color(page, light.gray));
    await expect(page.locator('body')).toHaveCSS('color', await color(page, light.lightText));

    await chooseScheme(page, 'dark');
    await expect(page.locator('body')).toHaveAttribute('data-theme', 'easyadmin-dark');
    await expect(page.locator('#theme-primary')).toHaveCSS('background-color', await color(page, '#a3e635'));
    await expect(page.locator('#theme-primary')).toHaveCSS('color', await color(page, '#000'));
    const dark = await themeValues(page);
    expect(dark.gray).toBe(dark.stone);
    expect(dark.primary).toBe('#a3e635');
    expect(dark.background).not.toBe(light.background);
    await expect(page.locator('#theme-surface')).toHaveCSS('background-color', await color(page, dark.darkSurface));
    await expect(page.locator('body')).toHaveCSS('color', await color(page, dark.darkText));
    await expect(page.locator('body')).toHaveCSS('font-weight', '437');
    await expect(page.locator('#theme-primary')).toHaveCSS('border-top-left-radius', `${rootSize * 0.75}px`);
    await expect(page.locator('#theme-primary')).toHaveCSS('height', '32px');
    await expect(page.locator('#theme-spacing')).toHaveCSS('padding-inline-start', '24px');

    const fonts = await page.evaluate(async () => {
        await document.fonts.ready;
        return [...document.fonts].filter((face) => face.status === 'loaded').map((face) => face.family);
    });
    expect(fonts.some((family) => family.includes('IBM Plex Sans Variable'))).toBe(true);
    expect(fonts.some((family) => family.includes('JetBrains Mono Variable'))).toBe(true);
});

test('child layout blocks, application assets and CSP nonces survive the shell preview', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const response = await page.goto('/theme-admin?ui=tailwind&csp=1');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-security-policy']).toMatch(/script-src 'self' 'nonce-[^']+'/);
    await expect(page.getByTestId('theme-logo-override')).toHaveText('Theme logo extension');
    await expect(page.locator('.ea-sidebar-header .logo-custom')).toHaveText('Configured theme dashboard');
    await expect(page.getByTestId('theme-sidebar-footer')).toHaveAttribute('href', '/theme-admin');
    await expect(page.getByTestId('theme-content-footer')).toHaveText('Theme content footer');
    await expect(page.getByTestId('configured-body-content')).toHaveText('Configured body content');
    await expect(page.locator('meta[name="theme-fixture"]')).toHaveAttribute('content', 'configured head');
    await expect(page.locator('#theme-user-override')).toHaveCSS('background-color', 'rgb(12, 34, 56)');
    await expect
        .poll(() => page.evaluate(() => window.easyAdminThemeFixture))
        .toEqual({
            readyState: 'interactive',
            scriptAttribute: 'script',
        });
    await expect(page.locator('script[data-theme-asset="script"]')).toHaveAttribute('defer', '');

    const assets = await page.evaluate(() => ({
        styles: [...document.querySelectorAll('link[rel="stylesheet"]')].map((link) => link.href),
        scripts: [...document.querySelectorAll('script[src]')].map((script) => script.src),
        nonces: [...document.querySelectorAll('style,script,link[rel="stylesheet"]')].map((element) => element.nonce),
        head: document.head.innerHTML,
    }));
    expect(assets.styles.some((url) => /\/app\.[^/]+\.css/.test(url))).toBe(false);
    expect(assets.scripts.some((url) => /\/app\.[^/]+\.js/.test(url))).toBe(false);
    expect(await page.evaluate(() => typeof window.bootstrap)).toBe('undefined');
    expect(assets.nonces.length).toBeGreaterThan(2);
    expect(assets.nonces.every((nonce) => typeof nonce === 'string' && nonce.length > 0)).toBe(true);
    expect(response.headers()['content-security-policy']).toContain(`'nonce-${assets.nonces[0]}'`);
    const bundleCss = assets.head.indexOf('ui-preview');
    const themeOverrides = assets.head.indexOf('--ea-primary: #15803d;');
    const applicationCss = assets.head.indexOf('/browser/theme_fixture.css');
    expect(bundleCss).toBeGreaterThanOrEqual(0);
    expect(themeOverrides).toBeGreaterThan(bundleCss);
    expect(applicationCss).toBeGreaterThan(themeOverrides);
    expect(errors).toEqual([]);
});

for (const configured of ['compact', 'normal']) {
    test(`explicit ${configured} dashboard widths take priority over remembered preferences`, async ({ page }) => {
        const compact = configured === 'compact';
        await page.evaluate((isCompact) => {
            localStorage.setItem('ea/sidebar/width', isCompact ? 'normal' : 'compact');
            localStorage.setItem('ea/content/width', isCompact ? 'normal' : 'full');
        }, compact);
        await page.goto(`/theme-admin?ui=tailwind&configured=${configured}`);
        const body = page.locator('body');
        await expect(body).toHaveAttribute('data-ea-sidebar-width-configured', 'true');
        await expect(body).toHaveAttribute('data-ea-content-width-configured', 'true');
        await expect(body).toHaveClass(new RegExp(`ea-sidebar-width-${compact ? 'compact' : 'normal'}`));
        await expect(body).toHaveClass(new RegExp(`ea-content-width-${compact ? 'full' : 'normal'}`));
        await expect(page.locator('.ea-layout-toggle-sidebar')).toHaveAttribute('aria-expanded', String(!compact));
        await expect(page.locator('.ea-layout-toggle-content')).toHaveAttribute('aria-expanded', String(compact));
        await page.reload();
        await expect(body).toHaveClass(new RegExp(`ea-sidebar-width-${compact ? 'compact' : 'normal'}`));
        await expect(body).toHaveClass(new RegExp(`ea-content-width-${compact ? 'full' : 'normal'}`));
    });
}

test('remembered widths apply only when no dashboard width is explicitly configured', async ({ page }) => {
    await page.evaluate(() => {
        localStorage.setItem('ea/sidebar/width', 'compact');
        localStorage.setItem('ea/content/width', 'full');
    });
    await page.goto('/theme-admin?ui=tailwind');
    await expect(page.locator('body')).toHaveAttribute('data-ea-sidebar-width-configured', 'false');
    await expect(page.locator('body')).toHaveAttribute('data-ea-content-width-configured', 'false');
    await expect(page.locator('body')).toHaveClass(/ea-sidebar-width-compact/);
    await expect(page.locator('body')).toHaveClass(/ea-content-width-full/);
    await expect(page.locator('.ea-layout-toggle-sidebar')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('.ea-layout-toggle-content')).toHaveAttribute('aria-expanded', 'true');
});

test('disabled dark appearance overrides stored preference, configured default and system changes', async ({
    page,
}) => {
    await page.evaluate(() => localStorage.setItem('ea/colorScheme', 'dark'));
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/theme-admin?ui=tailwind&dark=disabled&default=dark');
    await expect(page.locator('body')).toHaveAttribute('data-ea-dark-scheme-is-enabled', 'false');
    await expect(page.locator('body')).toHaveAttribute('data-theme', 'easyadmin-light');
    await expect(page.locator('body')).toHaveCSS('color-scheme', 'light');
    await expect(page.locator('[data-ea-color-scheme]')).toHaveCount(0);
    await expect(page.locator('#theme-primary')).toHaveCSS('background-color', await color(page, '#15803d'));
    await page.emulateMedia({ colorScheme: 'light' });
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.locator('body')).toHaveAttribute('data-theme', 'easyadmin-light');
});

async function chooseScheme(page, scheme) {
    await page.locator('.dropdown-settings-button:visible').click();
    await page.locator(`[data-ea-color-scheme="${scheme}"]:visible`).click();
}

async function color(page, value) {
    return page.evaluate((cssColor) => {
        const probe = document.createElement('span');
        probe.style.color = cssColor;
        document.body.append(probe);
        const normalized = getComputedStyle(probe).color;
        probe.remove();
        return normalized;
    }, value);
}

async function themeValues(page) {
    return page.locator('body').evaluate((body) => {
        const styles = getComputedStyle(body);
        return {
            gray: styles.getPropertyValue('--gray-100').trim(),
            zinc: styles.getPropertyValue('--neutral-gray-100').trim(),
            stone: styles.getPropertyValue('--warm-gray-100').trim(),
            primary: styles.getPropertyValue('--ea-primary').trim(),
            background: styles.backgroundColor,
            lightText: styles.getPropertyValue('--gray-800').trim(),
            darkText: styles.getPropertyValue('--gray-200').trim(),
            darkSurface: styles.getPropertyValue('--gray-900').trim(),
        };
    });
}
