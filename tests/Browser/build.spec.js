const fs = require('node:fs');
const path = require('node:path');
const { expect, test } = require('@playwright/test');

for (const mode of [
    { name: 'development', url: '/ui-preview', prefix: '/assets/' },
    { name: 'production', url: 'http://127.0.0.1:8090/ui-preview', prefix: '/assets-built/' },
]) {
    test(`${mode.name} AssetMapper page uses locally compiled Tailwind and daisyUI`, async ({ page }) => {
        const externalRequests = [];
        page.on('request', (request) => {
            const url = new URL(request.url());
            if (!['127.0.0.1', 'localhost'].includes(url.hostname)) {
                externalRequests.push(request.url());
            }
        });

        const response = await page.goto(mode.url);
        expect(response.status()).toBe(200);
        await expect(page.getByRole('heading', { name: 'Rendering build fixture', exact: true })).toBeVisible();
        await expect.poll(() => page.evaluate(() => window.previewFixtureReady)).toBe(true);
        const sheet = page.getByTestId('preview-stylesheet');
        const href = await sheet.getAttribute('href');
        expect(href.startsWith(mode.prefix)).toBe(true);
        expect(href).toMatch(/easyadmin\/ui-preview-[a-zA-Z0-9_-]+\.css$/);
        await expect(page.locator('link[rel="stylesheet"]')).toHaveCount(1);
        expect(await page.evaluate(() => typeof window.bootstrap)).toBe('undefined');
        expect(
            await page.locator('script[src]').evaluateAll((scripts) => scripts.map((script) => script.src))
        ).not.toContainEqual(expect.stringMatching(/(?:bootstrap|\/app\.)/));

        const cssResponse = await page.request.get(new URL(href, page.url()).href);
        expect(cssResponse.status()).toBe(200);
        const css = await cssResponse.text();
        expect(css).toContain('.btn-primary');
        expect(css).toContain('.badge-success');
        expect(css).toContain('.outline-offset-\\[7px\\]');
        expect(css).not.toMatch(/Bootstrap v5|--bs-(?:body|btn|modal)/);
        await expect(page.getByTestId('preview-primary')).toHaveCSS('display', 'inline-flex');
        await expect(page.getByTestId('preview-primary')).toHaveCSS('outline-offset', '7px');
        await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Fixture value');
        await expect(page.getByLabel('Name', { exact: true })).toBeEditable();
        await expect(page.getByTestId('preview-grid')).toHaveCSS('column-gap', '16px');

        const main = page.locator('main');
        const lightBackground = await main.evaluate((element) => getComputedStyle(element).backgroundColor);
        await page.getByTestId('preview-theme-toggle').click();
        await expect(page.locator('[data-ea-ui]')).toHaveAttribute('data-theme', 'easyadmin-dark');
        await expect(page.getByTestId('preview-theme-toggle')).toHaveAttribute('aria-pressed', 'true');
        await expect
            .poll(() => main.evaluate((element) => getComputedStyle(element).backgroundColor))
            .not.toBe(lightBackground);

        await page.setViewportSize({ width: 600, height: 800 });
        expect(await gridColumnCount(page)).toBe(1);
        await page.setViewportSize({ width: 900, height: 800 });
        expect(await gridColumnCount(page)).toBe(2);
        expect(externalRequests).toEqual([]);
    });
}

test('production output contains explicit source classes and no unresolved compiler directives', async () => {
    const manifestPath = path.join(__dirname, 'public/assets-built/manifest.json');
    expect(fs.existsSync(manifestPath), 'Run make build-ui-assets before browser tests.').toBe(true);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const outputPath = path.join(__dirname, 'public', manifest['easyadmin/ui-preview.css']);
    const css = fs.readFileSync(outputPath, 'utf8');

    expect(css).toContain('.outline-offset-\\[7px\\]');
    expect(css).toContain('.md\\:grid-cols-2');
    expect(css).toContain('[data-theme=easyadmin-dark]');
    expect(css).not.toMatch(/@source\b|@plugin\b|@import\s+["'](?:tailwindcss|daisyui)/);
    expect(Object.keys(manifest)).not.toContain('easyadmin/app.css');
    expect(Object.keys(manifest).some((key) => key.startsWith('easyadmin/easyadmin-theme/'))).toBe(false);
});

test('the reusable stylesheet omits Preflight resets on an ordinary Symfony page', async ({ page }) => {
    await page.goto('http://127.0.0.1:8090/ui-neutral');
    await expect(page.locator('[data-ea-ui]')).toHaveCount(0);
    await expect(page.getByTestId('neutral-heading')).toHaveCSS('font-size', '32px');
    await expect(page.locator('body')).toHaveCSS('margin-top', '8px');
    await expect(page.getByRole('button', { name: 'Ordinary button', exact: true })).toHaveCSS(
        'border-top-style',
        'outset'
    );
});

test('application root token overrides propagate through both themes', async ({ page }) => {
    await page.goto('/ui-preview');
    await expect.poll(() => page.evaluate(() => window.previewFixtureReady)).toBe(true);
    await page.evaluate(() => {
        document.documentElement.style.setProperty('--ea-primary', 'rgb(128, 0, 128)');
        document.documentElement.style.setProperty('--ea-radius', '0.75rem');
        document.documentElement.style.setProperty('--ea-spacing', '0.25rem');
    });

    const primary = page.getByTestId('preview-primary');
    await expect(primary).toHaveCSS('background-color', 'rgb(128, 0, 128)');
    await expect(primary).toHaveCSS('border-top-left-radius', '12px');
    await expect(page.getByTestId('preview-grid')).toHaveCSS('column-gap', '32px');
    await page.getByTestId('preview-theme-toggle').click();
    await expect(page.locator('[data-ea-ui]')).toHaveAttribute('data-theme', 'easyadmin-dark');
    await expect(primary).toHaveCSS('background-color', 'rgb(128, 0, 128)');
    await expect(primary).toHaveCSS('border-top-left-radius', '12px');
    await expect(page.getByTestId('preview-grid')).toHaveCSS('column-gap', '32px');
});

async function gridColumnCount(page) {
    return page
        .getByTestId('preview-grid')
        .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length);
}
