const { test, expect } = require('@playwright/test');
const { fixture, login } = require('./helpers');

test('rendered pages and actual asset responses use the delivered Bootstrap-free runtime', async ({ page }) => {
    const state = fixture('seed');
    const errors = [];
    const failures = [];
    const examined = new Map();
    const inspections = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('requestfailed', (request) => {
        if (['stylesheet', 'script', 'font'].includes(request.resourceType())) failures.push(request.url());
    });
    page.on('response', (response) => {
        if (!['stylesheet', 'script', 'font'].includes(response.request().resourceType())) return;
        if (!response.ok()) failures.push(`${response.status()} ${response.url()}`);
        if (['stylesheet', 'script'].includes(response.request().resourceType()) && !examined.has(response.url())) {
            examined.set(response.url(), true);
            inspections.push(
                response.text().then((source) => {
                    expect(source, response.url()).not.toMatch(
                        /Bootstrap v[45]\.|\.bs\.(?:modal|dropdown|tab|tooltip|popover)/
                    );
                })
            );
        }
    });
    await login(page);
    for (const pathname of [
        '/admin',
        '/admin/categories',
        `/admin/categories/${state.categories[0].id}`,
        '/admin/categories/new',
        `/admin/categories/${state.categories[0].id}/edit`,
        `/admin/widgets/${state.widgets[0].id}/edit`,
        '/admin/_ea_ui_kit/foundations/colors',
        '/theme-admin',
        '/auxiliary-login',
    ]) {
        const response = await page.goto(pathname);
        expect(response.status(), pathname).toBe(200);
        expect(await page.evaluate(() => typeof window.bootstrap), pathname).toBe('undefined');
        await expect(page.locator('[data-bs-toggle],[data-bs-target],[data-bs-dismiss],[data-bs-theme]')).toHaveCount(
            0
        );
        const styles = await page
            .locator('link[rel="stylesheet"]')
            .evaluateAll((links) => links.map((link) => link.href));
        expect(styles.filter((url) => /\/bundles\/easyadmin\/app\.[a-f0-9]+\.css$/.test(url))).toHaveLength(1);
        expect(styles.some((url) => /(?:bootstrap|ui-preview|ui-fonts-preview)/.test(url))).toBe(false);
        expect(
            await page.locator('script[src]').evaluateAll((scripts) => scripts.map((script) => script.src))
        ).toContainEqual(expect.stringMatching(/\/bundles\/easyadmin\/app\.[a-f0-9]+\.js$/));
    }
    await Promise.all(inspections);
    expect(examined.size).toBeGreaterThan(5);
    expect(failures).toEqual([]);
    expect(errors).toEqual([]);
    expect((await page.context().cookies()).some((cookie) => cookie.name === 'ea-ui-preview')).toBe(false);
    expect(fixture().categories).toEqual(state.categories);
});
