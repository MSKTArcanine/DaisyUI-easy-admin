const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { expect, test } = require('@playwright/test');
const { fixture, login, expectSelectedMarker } = require('./helpers');

test.beforeEach(async ({ page }) => {
    fixture('seed');
    await login(page);
});

test('navigation preserves destinations, keyboard disclosure and permission visibility', async ({ page }) => {
    const menu = page.locator('#main-menu');
    await expect(menu.getByRole('link', { name: /Restricted navigation$/ })).toHaveCount(0);

    const widgets = menu.getByRole('button', { name: /Widgets$/ });
    await expect(widgets).toHaveAttribute('aria-expanded', 'false');
    await widgets.focus();
    await page.keyboard.press('Enter');
    await expect(widgets).toHaveAttribute('aria-expanded', 'true');
    const fields = menu.getByRole('link', { name: /Field widgets$/ });
    await expect(fields).toHaveAttribute('href', /\/admin\/widgets$/);
    await fields.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/admin\/widgets$/);
    await expect(menu.getByRole('link', { name: /Field widgets$/ })).toHaveAttribute('aria-current', 'page');

    await menu.getByRole('link', { name: /Categories$/ }).click();
    await expect(page).toHaveURL(/\/admin\/categories$/);
    await expect(menu.getByRole('link', { name: /Categories$/ })).toHaveAttribute('aria-current', 'page');
});

test('appearance menu supports keyboard entry, selection and Escape focus restoration', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const settings = page.locator('.dropdown-settings-button:visible');
    await settings.focus();
    await page.keyboard.press('ArrowDown');
    await expect(settings).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('[data-ea-color-scheme="light"]:visible')).toBeFocused();
    for (const scheme of ['light', 'dark', 'auto']) {
        await expectSelectedMarker(page.locator(`[data-ea-color-scheme="${scheme}"]:visible`), scheme === 'auto');
    }
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('[data-ea-color-scheme="dark"]:visible')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('body')).toHaveCSS('color-scheme', 'dark');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('ea/colorScheme'))).toBe('dark');

    await openSettings(page);
    for (const scheme of ['light', 'dark', 'auto']) {
        await expectSelectedMarker(page.locator(`[data-ea-color-scheme="${scheme}"]:visible`), scheme === 'dark');
    }
    await page.keyboard.press('Escape');
    await expect(settings).toHaveAttribute('aria-expanded', 'false');
    await expect(settings).toBeFocused();
    expect(errors).toEqual([]);
});

test('native menus preserve editable target handlers, native defaults and dynamically initialized keyboard choices', async ({
    page,
}) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    expect(await page.evaluate(() => typeof window.bootstrap)).toBe('undefined');
    const settings = page.locator('.dropdown-settings-button:visible');
    await settings.click();
    await settings.evaluate((toggle) => {
        const menu = document.getElementById(toggle.getAttribute('aria-controls'));
        const content = document.createElement('li');
        content.innerHTML =
            '<label for="native-menu-select">Menu select</label><select id="native-menu-select" size="2"><option value="first" selected>First value</option><option value="second">Second value</option></select><div id="native-menu-editor" contenteditable="true" role="textbox" aria-label="Menu editor" tabindex="0">Editable value</div>';
        menu.append(content);
        window.nativeEditableKeys = [];
        for (const control of content.querySelectorAll('select,[contenteditable]')) {
            control.addEventListener('keydown', (event) =>
                window.nativeEditableKeys.push({
                    id: control.id,
                    key: event.key,
                    prevented: event.defaultPrevented,
                })
            );
        }
    });
    const select = page.getByLabel('Menu select');
    await select.focus();
    await expect(select).toHaveValue('first');
    await page.keyboard.press('ArrowDown');
    await expect(select).toHaveValue('second');
    await page.keyboard.press('ArrowUp');
    await expect(select).toHaveValue('first');
    const editor = page.getByRole('textbox', { name: 'Menu editor', exact: true });
    await editor.focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');
    await expect(editor).toBeFocused();
    expect(await page.evaluate(() => window.nativeEditableKeys)).toEqual([
        { id: 'native-menu-select', key: 'ArrowDown', prevented: false },
        { id: 'native-menu-select', key: 'ArrowUp', prevented: false },
        { id: 'native-menu-editor', key: 'ArrowDown', prevented: false },
        { id: 'native-menu-editor', key: 'ArrowUp', prevented: false },
    ]);
    await page.keyboard.press('Escape');
    await expect(settings).toBeFocused();
    await expect(settings).toHaveAttribute('aria-expanded', 'false');

    await page.evaluate(() => {
        const dropdown = document.createElement('div');
        dropdown.className = 'dropdown';
        dropdown.innerHTML =
            '<button id="dynamic-menu-toggle" type="button" data-ea-toggle="dropdown" data-ea-target="#dynamic-menu-choices">Dynamic choices</button><ul id="dynamic-menu-choices" class="dropdown-menu menu" data-ea-menu hidden><li><a id="dynamic-menu-first" class="dropdown-item" data-ea-menu-item href="#">Dynamic first</a></li><li><a id="dynamic-menu-second" class="dropdown-item" data-ea-menu-item href="#">Dynamic second</a></li></ul>';
        document.body.append(dropdown);
        window.EasyAdminApp.init(dropdown);
    });
    const dynamic = page.locator('#dynamic-menu-toggle');
    await dynamic.focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#dynamic-menu-first')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#dynamic-menu-second')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dynamic).toBeFocused();
    await expect(dynamic).toHaveAttribute('aria-expanded', 'false');
    expect(errors).toEqual([]);
});

test('system appearance and explicit preferences survive reload and media changes', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.reload();
    await expect(page.locator('body')).toHaveCSS('color-scheme', 'dark');

    await chooseScheme(page, 'light');
    await expect(page.locator('body')).toHaveCSS('color-scheme', 'light');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('ea/colorScheme'))).toBe('light');
    await page.reload();
    await expect(page.locator('body')).toHaveCSS('color-scheme', 'light');
    await expect(page.locator('[data-ea-color-scheme="light"][aria-checked="true"]')).toHaveCount(2);

    await chooseScheme(page, 'auto');
    await expect(page.locator('body')).toHaveCSS('color-scheme', 'dark');
    await page.emulateMedia({ colorScheme: 'light' });
    await expect(page.locator('body')).toHaveCSS('color-scheme', 'light');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('ea/colorScheme'))).toBe('auto');
    await expect(page.locator('[data-ea-color-scheme="auto"][aria-checked="true"]')).toHaveCount(2);
});

test('mobile navigation opens from the keyboard and closes with Escape or backdrop', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const toggle = page.getByRole('button', { name: 'Toggle navigation', exact: true });
    const menu = page.locator('#main-menu');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(menu).toBeHidden();
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(menu).toBeVisible();
    await captureReference(page, testInfo, 'dashboard-mobile-navigation');

    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(menu).toBeHidden();
    await expect(toggle).toBeFocused();

    await page.keyboard.press('Space');
    await expect(menu).toBeVisible();
    await page.locator('.ea-sidebar-backdrop').click({ position: { x: 1, y: 1 } });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(menu).toBeHidden();
});

test('configured assets and layout overrides work with remembered layout preferences', async ({ page }) => {
    await page.getByRole('link', { name: /Categories$/ }).click();
    const override = page.getByTestId('layout-override');
    await expect(override).toHaveText('Browser override');
    await expect(override).toHaveCSS('display', 'block');
    await expect(override).toHaveCSS('font-size', '12px');
    await expect.poll(() => page.evaluate(() => window.browserFixtureAssetLoaded)).toBe(true);
    await expect(page.getByTestId('custom-name').first()).toHaveText('Category 1');

    const sidebar = page.locator('.ea-layout-toggle-sidebar');
    await expect(sidebar).toHaveAttribute('aria-expanded', 'true');
    await sidebar.click();
    await expect(sidebar).toHaveAttribute('aria-expanded', 'false');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('ea/sidebar/width'))).toBe('compact');
    const content = page.locator('.ea-layout-toggle-content');
    await expect(content).toHaveAttribute('aria-expanded', 'false');
    await content.click();
    await expect(content).toHaveAttribute('aria-expanded', 'true');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('ea/content/width'))).toBe('full');

    await page.reload();
    await expect(sidebar).toHaveAttribute('aria-expanded', 'false');
    await expect(content).toHaveAttribute('aria-expanded', 'true');
    await expect(override).toHaveText('Browser override');
});

test('RTL keeps navigation and appearance controls usable', async ({ page }, testInfo) => {
    await page.goto('/admin/categories?direction=rtl');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    const menu = page.locator('#main-menu');
    await expect(menu).toHaveCSS('direction', 'rtl');
    await expect(menu.getByRole('link', { name: /Categories$/ })).toHaveAttribute('aria-current', 'page');
    const box = await menu.boundingBox();
    expect(box.x).toBeGreaterThan(page.viewportSize().width / 2);
    await chooseScheme(page, 'dark');
    await expect(page.locator('body')).toHaveCSS('color-scheme', 'dark');
    await captureReference(page, testInfo, 'index-desktop-dark-rtl');
    await page.locator('.dropdown-settings-button:visible').press('Escape');
    await expect(page.locator('.dropdown-settings-button:visible')).toBeFocused();
});

test('representative desktop pages remain usable when visual references are captured', async ({ page }, testInfo) => {
    const state = fixture();
    const category = state.categories[0];
    await expect(page.getByTestId('dashboard-content')).toHaveText('Deterministic browser fixtures');
    await captureReference(page, testInfo, 'dashboard-desktop-light');

    await page.goto('/admin/categories');
    await expect(page.getByTestId('custom-name').first()).toHaveText(category.name);
    await captureReference(page, testInfo, 'index-desktop-light');
    await page.goto(`/admin/categories/${category.id}`);
    await expect(page.getByTestId('custom-name')).toHaveText(category.name);
    await captureReference(page, testInfo, 'detail-desktop-light');
    await page.goto('/admin/categories/new');
    await expect(page.getByTestId('custom-name-widget')).toBeEditable();
    await captureReference(page, testInfo, 'new-desktop-light');
    await page.goto(`/admin/categories/${category.id}/edit`);
    await expect(page.getByTestId('custom-name-widget')).toHaveValue(category.name);
    await captureReference(page, testInfo, 'edit-desktop-light');
});

async function openSettings(page) {
    const settings = page.locator('.dropdown-settings-button:visible');
    if ((await settings.getAttribute('aria-expanded')) !== 'true') {
        await settings.click();
    }
    await expect(settings).toHaveAttribute('aria-expanded', 'true');
}

async function chooseScheme(page, scheme) {
    await openSettings(page);
    await page.locator(`[data-ea-color-scheme="${scheme}"]:visible`).click();
}

async function captureReference(page, testInfo, name) {
    if (process.env.EASYADMIN_CAPTURE_REFERENCES === '1') {
        throw new Error('Original references are immutable; use EASYADMIN_CAPTURE_FINAL_REFERENCES=1.');
    }
    if (process.env.EASYADMIN_CAPTURE_FINAL_REFERENCES !== '1' || testInfo.project.name !== 'chromium') {
        return;
    }

    const directory = path.join(__dirname, 'references-final');
    fs.mkdirSync(directory, { recursive: true });
    await page.screenshot({ path: path.join(directory, `${name}.png`), fullPage: true, animations: 'disabled' });
    const metadata = {
        sourceBaseline: 'bd0fb8448a41f69b3493c5bea84f793e46fe7c21',
        capturePhase: 'final',
        assetManifestSha256: createHash('sha256')
            .update(fs.readFileSync(path.resolve(__dirname, '../../public/manifest.json')))
            .digest('hex'),
        captureCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
        browser: testInfo.project.name,
        browserVersion: page.context().browser().version(),
        viewport: page.viewportSize(),
        url: page.url(),
        locale: 'en-US',
        timezone: 'UTC',
        scheme: await page.locator('body').evaluate((body) => getComputedStyle(body).colorScheme),
        direction: await page.locator('html').getAttribute('dir'),
        test: testInfo.title,
    };
    fs.writeFileSync(path.join(directory, `${name}.json`), `${JSON.stringify(metadata, null, 4)}\n`);
}
