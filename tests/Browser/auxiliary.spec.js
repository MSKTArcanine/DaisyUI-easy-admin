const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const { fixture, login } = require('./helpers');

test.beforeEach(async ({ page }) => {
    fixture('seed');
    await page.addInitScript(() => localStorage.clear());
});

test('minimal login preserves custom authentication parameters, CSRF failures, submitter and one successful POST', async ({
    page,
}) => {
    const requests = [];
    page.on('request', (request) => requests.push(request));
    const response = await page.goto('/auxiliary-login?ui=tailwind&csp=1');
    expect(response.headers()['content-security-policy']).toContain("script-src 'self' 'nonce-");
    await expect(page.getByTestId('login-logo-override')).toHaveText('Login block override');
    await expect(page.getByTestId('login-footer-override')).toHaveText('Login footer override');
    await expect(page.locator('form')).toHaveAttribute('method', 'post');
    await expect(page.locator('form')).toHaveAttribute('action', '/auxiliary-login');
    await expect(page.locator('[name="destination"]')).toHaveValue('/admin');
    await expect(page.getByRole('link', { name: 'Recover access', exact: true })).toHaveAttribute(
        'href',
        '/auxiliary/content/en'
    );
    await expect(page.getByLabel('Keep this identity', { exact: true })).toBeChecked();
    const token = await page.locator('[name="_csrf_token"]').inputValue();
    expect(token).toBeTruthy();
    await page.getByLabel('Account identity', { exact: true }).fill('admin');
    await page.getByLabel('Account secret', { exact: true }).fill('browser-password');
    await page.locator('[name="_csrf_token"]').evaluate((input) => {
        input.value = 'invalid';
    });
    await page.getByRole('button', { name: 'Authenticate identity', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Invalid CSRF token.');
    await expect(page.getByLabel('Account identity', { exact: true })).toHaveValue('admin');
    await page.getByLabel('Account secret', { exact: true }).fill('wrong-password');
    await page.getByRole('button', { name: 'Authenticate identity', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Invalid credentials.');
    await page.getByLabel('Account secret', { exact: true }).fill('browser-password');
    const submit = page.getByRole('button', { name: 'Authenticate identity', exact: true });
    await submit.evaluate((button) => {
        button.name = 'login_intent';
        button.value = 'authenticate';
        button.form.addEventListener('submit', (event) => event.preventDefault(), { once: true });
    });
    await submit.click();
    await expect(submit).toBeEnabled();
    expect(requests.filter((request) => request.method() === 'POST')).toHaveLength(2);
    await submit.click();
    await expect(page.getByTestId('dashboard-content')).toHaveText('Deterministic browser fixtures');
    const posts = requests.filter((request) => request.method() === 'POST');
    expect(posts).toHaveLength(3);
    const body = new URLSearchParams(posts[2].postData());
    expect(body.get('identity')).toBe('admin');
    expect(body.get('secret')).toBe('browser-password');
    expect(body.get('destination')).toBe('/admin');
    expect(body.get('remember_identity')).toBe('on');
    expect(body.get('login_intent')).toBe('authenticate');
    expect(body.get('_csrf_token')).toBeTruthy();
    expect(requests.some((request) => /\/(?:app\.[^/]+\.(?:css|js)|bootstrap[^/]*)$/.test(request.url()))).toBe(false);
    expect(await page.evaluate(() => typeof window.bootstrap)).toBe('undefined');
});

test('minimal and context login retain responsive controls, locale direction and appearance', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/auxiliary-login?ui=tailwind&locale=ar');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('body')).toHaveAttribute('data-theme', 'easyadmin-dark');
    const field = page.getByLabel('Account identity', { exact: true });
    const bounds = await field.boundingBox();
    expect(bounds.width).toBeGreaterThan(200);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
    expect(await field.evaluate((input) => getComputedStyle(input).borderStyle)).toBe('solid');
    await login(page);
    await page.goto('/auxiliary-admin?ui=tailwind');
    await expect(page.locator('#header-logo a')).toHaveAttribute('href', '/auxiliary-admin');
    await expect(page.locator('[name="_target_path"]')).toHaveValue('/admin');
    await expect(page.getByTestId('login-logo-override')).toBeVisible();
    await expect(page.getByTestId('login-footer-override')).toBeVisible();
});

test('every shipped UI-kit component and foundation works with native assets and live theme examples', async ({
    page,
}) => {
    await login(page);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/admin/_ea_ui_kit?ui=tailwind&csp=1');
    const componentNames = fs
        .readdirSync(path.join(__dirname, '../../templates/ui_kit/components'), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);
    for (const name of componentNames) {
        const response = await page.goto(`/admin/_ea_ui_kit/components/${name}`);
        expect(response.status()).toBe(200);
        await expect(page.locator('.ea-ui-kit-example').first()).toBeVisible();
        expect(await page.locator('[data-bs-toggle],[data-bs-dismiss]').count()).toBe(0);
    }
    for (const name of ['typography', 'colors', 'fonts']) {
        const response = await page.goto(`/admin/_ea_ui_kit/foundations/${name}`);
        expect(response.status()).toBe(200);
        await expect(
            page.getByRole('heading', { name: name[0].toUpperCase() + name.slice(1), level: 1, exact: true })
        ).toBeVisible();
    }
    const fontPicker = page.locator('[data-ea-ui-kit-theme-picker="fonts"]');
    const fontBefore = await page
        .locator('#ea-ui-kit-fonts-name')
        .evaluate((input) => getComputedStyle(input).fontFamily);
    await fontPicker.getByRole('button', { name: 'Rubik', exact: true }).click();
    await expect(fontPicker.getByRole('button', { name: 'Rubik', exact: true })).toHaveAttribute(
        'aria-pressed',
        'true'
    );
    expect(
        await page.locator('#ea-ui-kit-fonts-name').evaluate((input) => getComputedStyle(input).fontFamily)
    ).not.toBe(fontBefore);
    await expect(page.locator('[data-ea-ui-kit-theme-code]')).toContainText('Font::Rubik');
    await page.goto('/admin/_ea_ui_kit/foundations/colors');
    const primary = page
        .locator('[data-ea-ui-kit-mockup]')
        .first()
        .getByRole('button', { name: 'Add order', exact: true });
    const before = await primary.evaluate((button) => getComputedStyle(button).backgroundColor);
    await page
        .locator('[data-ea-ui-kit-theme-picker="accent-colors"]')
        .getByRole('button', { name: 'Blue', exact: true })
        .click();
    expect(await primary.evaluate((button) => getComputedStyle(button).backgroundColor)).not.toBe(before);
    await expect(page.locator('[data-ea-ui-kit-theme-code]')).toContainText('ThemeColor::Blue');
    await page.getByRole('tab', { name: 'Shipping', exact: true }).click();
    await expect(page.getByRole('combobox', { name: 'Choice field', exact: true })).toBeVisible();
    await page.goto('/admin/_ea_ui_kit/components/modal');
    await page.getByRole('button', { name: 'Delete customer', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Delete this customer?', exact: true })).toBeVisible();
    await page
        .getByRole('dialog', { name: 'Delete this customer?', exact: true })
        .getByRole('button', { name: 'Cancel', exact: true })
        .click();
    await expect(page.getByRole('dialog', { name: 'Delete this customer?', exact: true })).toBeHidden();
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => typeof window.bootstrap)).toBe('undefined');
});

test('content and exception pages preserve overridden blocks and standalone welcome respects CSP and reduced motion', async ({
    page,
}) => {
    await page.goto('/auxiliary/content/ar?ui=tailwind&csp=1');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('h1')).toHaveText('Auxiliary content');
    await expect(page.getByTestId('auxiliary-content')).toHaveText('Content block override');
    await login(page);
    await page.goto('/auxiliary-admin/content?ui=tailwind');
    await expect(page.getByTestId('auxiliary-content')).toHaveText('Content block override');
    await expect(page.locator('#main-menu')).toBeVisible();
    const automatic = page.getByTestId('automatic-prose');
    await expect(automatic.locator('p').first()).toHaveCSS('font-size', '20px');
    await expect(automatic.locator('p').first()).toHaveCSS('line-height', '40px');
    await expect(automatic.locator('p').last()).toHaveCSS('margin-block-start', '40px');
    await expect(automatic.locator('h2')).toHaveCSS('font-size', '28px');
    expect(await automatic.locator('h2').evaluate((heading) => getComputedStyle(heading).fontFamily)).toContain(
        'monospace'
    );
    await expect(automatic.locator('table')).toHaveCSS('border-bottom-width', '1px');
    expect(
        await automatic.locator('td').evaluate((cell) => Number.parseFloat(getComputedStyle(cell).paddingTop))
    ).toBeCloseTo(11.42, 1);
    const explicit = page.getByTestId('explicit-prose');
    await expect(explicit).toHaveCSS('font-size', '20px');
    await expect(explicit).toHaveCSS('line-height', '40px');
    expect(
        await explicit.locator('code').evaluate((code) => Number.parseFloat(getComputedStyle(code).fontSize))
    ).toBeCloseTo(17.14, 1);
    const ordinarySize = await page
        .getByTestId('prose-control-outside')
        .evaluate((input) => getComputedStyle(input).fontSize);
    await expect(page.getByTestId('class-prose-optout').locator('p')).toHaveCSS('font-size', '14px');
    await expect(page.getByTestId('attribute-prose-optout').locator('p')).toHaveCSS('font-size', '14px');
    await expect(page.getByTestId('prose-control-inside')).toHaveCSS('font-size', ordinarySize);
    const outsideHeight = (await page.getByTestId('prose-control-outside').boundingBox()).height;
    expect((await page.getByTestId('prose-control-inside').boundingBox()).height).toBe(outsideHeight);
    const contextError = await page.goto('/auxiliary-admin/exception');
    expect(contextError.status()).toBe(403);
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toHaveCSS('max-width', '512px');
    expect(await page.locator('.error-message h1').evaluate((heading) => getComputedStyle(heading).color)).not.toBe(
        await page.locator('body').evaluate((body) => getComputedStyle(body).color)
    );
    await expect(page.locator('body')).not.toContainText('private_debug');
    const standalone = await page.goto('/auxiliary/exception?csp=1');
    expect(standalone.status()).toBe(404);
    await expect(page.locator('h1')).toHaveText('404');
    await expect(page.locator('body')).not.toContainText('private_debug');
    expect(await page.locator('script[src],link[rel="stylesheet"]').count()).toBe(0);
    const response = await page.goto('/auxiliary/welcome?csp=1');
    const nonce = await page.locator('style').evaluate((style) => style.nonce);
    expect(response.headers()['content-security-policy']).toContain(`'nonce-${nonce}'`);
    await expect(page.locator('pre')).toContainText('<script>private_path</script>');
    expect(await page.locator('pre script,canvas,script[src],link[rel="stylesheet"]').count()).toBe(0);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('.welcome-desktop-only').first()).toBeHidden();
    await page.setViewportSize({ width: 900, height: 900 });
    await expect(page.locator('.welcome-desktop-only').first()).toBeVisible();
});
