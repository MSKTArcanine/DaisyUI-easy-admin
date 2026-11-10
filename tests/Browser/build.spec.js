const fs = require('node:fs');
const path = require('node:path');
const { expect, test } = require('@playwright/test');

for (const mode of [
    { name: 'development', url: '/rendering-contract', prefix: '/assets/' },
    { name: 'production', url: 'http://127.0.0.1:8090/rendering-contract', prefix: '/assets-built/' },
]) {
    test(`${mode.name} AssetMapper page composes delivered assets with application-only utilities`, async ({
        page,
    }) => {
        const externalRequests = [];
        page.on('request', (request) => {
            const url = new URL(request.url());
            if (!['127.0.0.1', 'localhost'].includes(url.hostname)) externalRequests.push(request.url());
        });

        const response = await page.goto(mode.url);
        expect(response.status()).toBe(200);
        await expect(page.getByRole('heading', { name: 'Rendering build fixture', exact: true })).toBeVisible();
        await expect.poll(() => page.evaluate(() => window.renderingFixtureReady)).toBe(true);
        await expect.poll(() => page.evaluate(() => typeof window.EasyAdminApp?.init)).toBe('function');
        const productHref = await page.getByTestId('rendering-stylesheet').getAttribute('href');
        expect(productHref).toMatch(/\/bundles\/easyadmin\/app\.[a-f0-9]+\.css$/);
        const fixtureHref = await page.getByTestId('fixture-stylesheet').getAttribute('href');
        expect(fixtureHref.startsWith(mode.prefix)).toBe(true);
        expect(fixtureHref).toMatch(/easyadmin-fixture\/fixture-[a-zA-Z0-9_-]+\.css$/);
        await expect(page.locator('link[rel="stylesheet"]')).toHaveCount(2);
        expect(await page.evaluate(() => typeof window.bootstrap)).toBe('undefined');
        expect(
            await page.locator('script[src]').evaluateAll((scripts) => scripts.map((script) => script.src))
        ).toContainEqual(expect.stringMatching(/\/bundles\/easyadmin\/app\.[a-f0-9]+\.js$/));

        const cssResponse = await page.request.get(new URL(productHref, page.url()).href);
        expect(cssResponse.status()).toBe(200);
        const css = await cssResponse.text();
        expect(css).toContain('.btn-primary');
        expect(css).toContain('.badge-success');
        expect(css).not.toContain('.outline-offset-\\[7px\\]');
        expect(css).not.toMatch(/Bootstrap v5|--bs-(?:body|btn|modal)/);
        const fixtureResponse = await page.request.get(new URL(fixtureHref, page.url()).href);
        expect(fixtureResponse.status()).toBe(200);
        const fixtureCss = await fixtureResponse.text();
        expect(fixtureCss).toContain('.outline-offset-\\[7px\\]');
        expect(fixtureCss).not.toContain('.btn');
        expect(fixtureCss).not.toContain('easyadmin-dark');
        await expect(page.getByTestId('rendering-primary')).toHaveCSS('display', 'inline-flex');
        await expect(page.getByTestId('rendering-primary')).toHaveCSS('outline-offset', '7px');
        await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Fixture value');
        await expect(page.getByLabel('Name', { exact: true })).toBeEditable();
        await expect(page.getByTestId('rendering-grid')).toHaveCSS('column-gap', '16px');

        const main = page.locator('main');
        const lightBackground = await main.evaluate((element) => getComputedStyle(element).backgroundColor);
        await page.getByTestId('rendering-theme-toggle').click();
        await expect(page.locator('[data-ea-ui]')).toHaveAttribute('data-theme', 'easyadmin-dark');
        await expect(page.getByTestId('rendering-theme-toggle')).toHaveAttribute('aria-pressed', 'true');
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

test('production assets contain their own classes and the fixture emits only compiled utilities', async () => {
    const manifestPath = path.join(__dirname, 'public/assets-built/manifest.json');
    expect(fs.existsSync(manifestPath), 'Run make build-browser-assets before browser tests.').toBe(true);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const fixtureCss = fs.readFileSync(
        path.join(__dirname, 'public', manifest['easyadmin-fixture/fixture.css']),
        'utf8'
    );
    const productManifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../../public/manifest.json'), 'utf8'));
    const productCss = fs.readFileSync(path.join(__dirname, '../../public', productManifest['app.css']), 'utf8');
    expect(fixtureCss).toContain('.outline-offset-\\[7px\\]');
    expect(fixtureCss).toContain('.md\\:grid-cols-2');
    expect(fixtureCss).not.toContain('.btn');
    expect(fixtureCss).not.toContain('easyadmin-dark');
    expect(productCss).toContain('[data-theme=easyadmin-dark]');
    expect(productCss).not.toContain('.outline-offset-\\[7px\\]');
    for (const css of [fixtureCss, productCss])
        expect(css).not.toMatch(/@source\b|@plugin\b|@import\s+["'](?:tailwindcss|daisyui)/);
    expect(Object.keys(manifest)).not.toContain('easyadmin/ui.css');
    expect(Object.keys(manifest).some((key) => key.startsWith('easyadmin/easyadmin-theme/'))).toBe(false);
});

test('the delivered stylesheet omits Preflight resets on an ordinary Symfony page', async ({ page }) => {
    await page.goto('http://127.0.0.1:8090/rendering-host');
    await expect(page.locator('[data-ea-ui]')).toHaveCount(0);
    await expect(page.getByTestId('rendering-stylesheet')).toHaveAttribute(
        'href',
        /\/bundles\/easyadmin\/app\.[a-f0-9]+\.css$/
    );
    await expect(page.locator('link[rel="stylesheet"]')).toHaveCount(1);
    await expect(page.getByTestId('neutral-heading')).toHaveCSS('font-size', '32px');
    await expect(page.locator('body')).toHaveCSS('margin-top', '8px');
    await expect(page.getByRole('button', { name: 'Ordinary button', exact: true })).toHaveCSS(
        'border-top-style',
        'outset'
    );
});

test('application root token overrides propagate through both themes', async ({ page }) => {
    await page.goto('/rendering-contract');
    await expect.poll(() => page.evaluate(() => window.renderingFixtureReady)).toBe(true);
    await page.evaluate(() => {
        document.documentElement.style.setProperty('--ea-primary', 'rgb(128, 0, 128)');
        document.documentElement.style.setProperty('--ea-radius', '0.75rem');
        document.documentElement.style.setProperty('--ea-spacing', '0.25rem');
    });
    const primary = page.getByTestId('rendering-primary');
    await expect(primary).toHaveCSS('background-color', 'rgb(128, 0, 128)');
    await expect(primary).toHaveCSS('border-top-left-radius', '12px');
    await expect(page.getByTestId('rendering-grid')).toHaveCSS('column-gap', '32px');
    await page.getByTestId('rendering-theme-toggle').click();
    await expect(page.locator('[data-ea-ui]')).toHaveAttribute('data-theme', 'easyadmin-dark');
    await expect(primary).toHaveCSS('background-color', 'rgb(128, 0, 128)');
    await expect(primary).toHaveCSS('border-top-left-radius', '12px');
    await expect(page.getByTestId('rendering-grid')).toHaveCSS('column-gap', '32px');
});

async function gridColumnCount(page) {
    return page
        .getByTestId('rendering-grid')
        .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length);
}
