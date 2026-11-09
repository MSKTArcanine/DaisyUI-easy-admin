const { expect, test } = require('@playwright/test');
const { fixture, login } = require('./helpers');

test.beforeEach(async ({ page }) => {
    fixture('seed');
    await login(page);
    await page.goto('/admin?ui=tailwind');
    await page.goto('/admin');
    await expect(page.locator('body')).toHaveAttribute('data-ea-ui');
});

test('dashboard shell preserves extension assets, navigation and accessible menus without Bootstrap', async ({
    page,
}) => {
    expect(await page.evaluate(() => typeof window.bootstrap)).toBe('undefined');
    await expect(page.getByTestId('shell-stylesheet')).toHaveCount(1);
    expect(
        await page.locator('link[rel="stylesheet"]').evaluateAll((links) => links.map((link) => link.href))
    ).not.toEqual(expect.arrayContaining([expect.stringMatching(/\/app(?:\.[a-f0-9]+)?\.css/)]));
    await expect(page.getByTestId('layout-override')).toHaveText('Browser override');
    await expect(page.getByTestId('layout-override')).toHaveCSS('font-size', '12px');
    await expect.poll(() => page.evaluate(() => window.browserFixtureAssetLoaded)).toBe(true);
    const menu = page.locator('#main-menu');
    await expect(menu.getByRole('link', { name: /Restricted navigation$/ })).toHaveCount(0);
    await expect(menu.getByRole('link', { name: /Dashboard$/ })).toHaveAttribute('aria-current', 'page');
    const widgets = menu.getByRole('button', { name: /Widgets$/ });
    const controls = await widgets.getAttribute('aria-controls');
    expect(controls).toBeTruthy();
    await widgets.press('Enter');
    await expect(widgets).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator(`[id="${controls}"]`)).toBeVisible();
    await expect(menu.getByRole('link', { name: /Field widgets$/ })).toHaveAttribute(
        'href',
        new URL('/admin/widgets', page.url()).href
    );

    const user = page.locator('.user-menu-wrapper .user-details:visible');
    await user.focus();
    await page.keyboard.press('ArrowDown');
    await expect(user).toHaveAttribute('aria-expanded', 'true');
    const logout = page.getByRole('menuitem', { name: /Sign out|Log out/i });
    await expect(logout).toHaveAttribute('href', '/logout');
    await expect(logout).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(user).toBeFocused();
    await expect(user).toHaveAttribute('aria-expanded', 'false');
});

test('mobile navigation traps focus, makes background inert and restores scroll and focus on Escape', async ({
    page,
}) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const toggle = page.getByRole('button', { name: 'Toggle navigation', exact: true });
    const sidebar = page.locator('[data-ea-sidebar]');
    await expect(sidebar).toHaveAttribute('inert');
    await expect(sidebar).toHaveAttribute('aria-hidden', 'true');
    await page.evaluate(() => {
        document.documentElement.style.overflow = 'auto';
        document.body.style.overflow = 'clip';
    });
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(sidebar).not.toHaveAttribute('inert');
    await expect(page.locator('.main-content')).toHaveAttribute('inert');
    await expect(page.locator('.responsive-header-actions')).toHaveAttribute('inert');
    await expect(page.locator('html')).toHaveCSS('overflow', 'hidden');
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
    expect(await sidebar.evaluate((element) => element.contains(document.activeElement))).toBe(true);

    const links = sidebar.locator('a[href]:visible,button:visible');
    const first = links.first();
    const last = links.last();
    await last.focus();
    await page.keyboard.press('Tab');
    await expect(first).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(last).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('.main-content')).not.toHaveAttribute('inert');
    await expect(page.locator('.ea-sidebar-backdrop')).toHaveCount(0);
    await expect(page.locator('html')).toHaveCSS('overflow', 'auto');
    await expect(page.locator('body')).toHaveCSS('overflow', 'clip');
});

test('mobile backdrop and desktop resizing close navigation without stale overlays or inert content', async ({
    page,
}) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const toggle = page.getByRole('button', { name: 'Toggle navigation', exact: true });
    await toggle.click();
    await expect(page.locator('[data-ea-sidebar-backdrop]')).toHaveCount(1);
    await page.locator('[data-ea-sidebar-backdrop]').click({ position: { x: 370, y: 600 } });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
    await toggle.click();
    await page.setViewportSize({ width: 992, height: 900 });
    await expect(page.locator('body')).not.toHaveClass(/ea-mobile-sidebar-visible/);
    await expect(page.locator('[data-ea-sidebar-backdrop]')).toHaveCount(0);
    await expect(page.locator('[data-ea-sidebar]')).not.toHaveAttribute('inert');
    await expect(page.locator('.main-content')).not.toHaveAttribute('inert');
    await expect(page.locator('#main-menu')).toBeVisible();
    await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden');
    await page.setViewportSize({ width: 991, height: 900 });
    await expect(page.locator('[data-ea-sidebar]')).toHaveAttribute('inert');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('mobile navigation preserves destinations and RTL positioning', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/admin?direction=rtl');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    const toggle = page.getByRole('button', { name: 'Toggle navigation', exact: true });
    await toggle.click();
    const sidebar = page.locator('.ea-sidebar');
    const bounds = await sidebar.boundingBox();
    const inset = await sidebar.evaluate((element) => Number.parseFloat(getComputedStyle(element).insetInlineStart));
    expect(bounds.x + bounds.width).toBeCloseTo(390 - inset, 0);
    await page
        .locator('#main-menu')
        .getByRole('link', { name: /Categories$/ })
        .click();
    await expect(page).toHaveURL(/\/admin\/categories$/);
    await expect(page.locator('[data-ea-sidebar-backdrop]')).toHaveCount(0);
    await expect(page.locator('body')).not.toHaveClass(/ea-mobile-sidebar-visible/);
    await expect(
        page.locator('#main-menu').getByRole('link', { name: /Categories$/, includeHidden: true })
    ).toHaveAttribute('aria-current', 'page');
});

test('a native dialog owns focus while navigation is open and shared scroll locks survive resizing', async ({
    page,
}) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(async () => {
        const { initEasyAdminUI } = await import('ui-interactions');
        document.documentElement.style.overflow = 'auto';
        document.body.style.overflow = 'clip';
        const trigger = document.createElement('a');
        trigger.href = '#';
        trigger.id = 'sidebar-dialog-trigger';
        trigger.dataset.eaToggle = 'modal';
        trigger.dataset.eaTarget = '#sidebar-dialog';
        trigger.textContent = 'Open sidebar dialog';
        document.querySelector('.ea-sidebar-content').append(trigger);
        const dialog = document.createElement('dialog');
        dialog.id = 'sidebar-dialog';
        dialog.dataset.eaDialog = '';
        dialog.innerHTML =
            '<div data-ea-dialog-panel><h2>Sidebar dialog</h2><label for="sidebar-dialog-value">Sidebar dialog value</label><input id="sidebar-dialog-value"><button type="button" data-ea-dismiss="modal">Close sidebar dialog</button></div>';
        document.body.append(dialog);
        initEasyAdminUI();
    });
    const toggle = page.locator('#navigation-toggler');
    const trigger = page.locator('#sidebar-dialog-trigger');
    const dialog = page.getByRole('dialog', { name: 'Sidebar dialog', exact: true });
    await toggle.click();
    await trigger.click();
    await expect(page.getByLabel('Sidebar dialog value')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Close sidebar dialog', exact: true })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger).toBeFocused();
    await trigger.click();
    await page.setViewportSize({ width: 992, height: 900 });
    await expect(dialog).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('[data-ea-sidebar-backdrop]')).toHaveCount(0);
    await expect(page.locator('html')).toHaveCSS('overflow', 'hidden');
    await page.getByRole('button', { name: 'Close sidebar dialog', exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator('html')).toHaveCSS('overflow', 'auto');
    await expect(page.locator('body')).toHaveCSS('overflow', 'clip');
});

test('repeated shell initialization preserves one disclosure and one layout or navigation action', async ({ page }) => {
    await page.evaluate(async () => {
        const { initShell } = await import('ui-shell');
        initShell();
        initShell();
        window.sidebarShows = 0;
        document.addEventListener('ea.sidebar.shown', () => window.sidebarShows++);
    });
    const widgets = page.locator('#main-menu').getByRole('button', { name: /Widgets$/ });
    await widgets.click();
    await expect(widgets).toHaveAttribute('aria-expanded', 'true');
    await widgets.click();
    await expect(widgets).toHaveAttribute('aria-expanded', 'false');
    const sidebarToggle = page.locator('.ea-layout-toggle-sidebar');
    await sidebarToggle.click();
    await expect(sidebarToggle).toHaveAttribute('aria-expanded', 'false');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('ea/sidebar/width'))).toBe('compact');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#navigation-toggler').click();
    await expect(page.locator('[data-ea-sidebar-backdrop]')).toHaveCount(1);
    expect(await page.evaluate(() => window.sidebarShows)).toBe(1);
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-ea-sidebar-backdrop]')).toHaveCount(0);
});
