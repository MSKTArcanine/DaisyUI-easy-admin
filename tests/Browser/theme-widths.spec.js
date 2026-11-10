const { expect, test } = require('@playwright/test');
const { fixture, login } = require('./helpers');

test('layout preferences change physical widths and keep the compact logo inside its rail', async ({ page }) => {
    fixture('seed');
    await login(page);
    await page.setViewportSize({ width: 2300, height: 1000 });
    await page.goto('/theme-admin');
    const wrapper = page.locator('.main-content > .content-wrapper');
    const sidebar = page.locator('[data-ea-sidebar]');
    const contentToggle = page.locator('.ea-layout-toggle-content');
    const sidebarToggle = page.locator('.ea-layout-toggle-sidebar');
    const normalContent = await wrapper.boundingBox();
    const normalSidebar = await sidebar.boundingBox();
    expect(normalContent.width).toBeGreaterThan(1400);
    expect(normalContent.width).toBeLessThanOrEqual(1440);
    expect(normalSidebar.width).toBeCloseTo(230, 0);
    await expect(contentToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(sidebarToggle).toHaveAttribute('aria-expanded', 'true');

    await contentToggle.click();
    await expect(contentToggle).toHaveAttribute('aria-expanded', 'true');
    await expect.poll(async () => (await wrapper.boundingBox()).width).toBeGreaterThan(1900);
    const fullContent = await wrapper.boundingBox();
    expect(fullContent.width).toBeGreaterThan(normalContent.width + 400);
    await sidebarToggle.click();
    await expect(sidebarToggle).toHaveAttribute('aria-expanded', 'false');
    await expect.poll(async () => (await sidebar.boundingBox()).width).toBeCloseTo(64, 0);
    const compactSidebar = await sidebar.boundingBox();
    expect(compactSidebar.width).toBeLessThan(normalSidebar.width / 2);
    const icon = page.locator('.ea-sidebar-header .logo-compact .icon');
    await expect(icon).toBeVisible();
    const iconBox = await icon.boundingBox();
    expect(iconBox.width).toBeGreaterThan(0);
    expect(iconBox.x).toBeGreaterThanOrEqual(compactSidebar.x);
    expect(iconBox.x + iconBox.width).toBeLessThanOrEqual(compactSidebar.x + compactSidebar.width);
    expect(Math.abs(iconBox.x + iconBox.width / 2 - compactSidebar.x - compactSidebar.width / 2)).toBeLessThan(1);
    await expect.poll(() => page.evaluate(() => localStorage.getItem('ea/sidebar/width'))).toBe('compact');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('ea/content/width'))).toBe('full');

    await page.reload();
    expect((await sidebar.boundingBox()).width).toBeCloseTo(64, 0);
    expect((await wrapper.boundingBox()).width).toBeGreaterThan(1900);
    await contentToggle.click();
    await expect.poll(async () => (await wrapper.boundingBox()).width).toBeLessThanOrEqual(1440);
    await sidebarToggle.click();
    await expect.poll(async () => (await sidebar.boundingBox()).width).toBeCloseTo(230, 0);
});
