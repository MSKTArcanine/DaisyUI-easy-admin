const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { test, expect } = require('@playwright/test');
const { consumerDirectory, fixture, login, save } = require('./helpers');

let seeded;

test.beforeEach(async ({ page }) => {
    seeded = fixture('seed');
    await login(page);
});

test('the separately installed package serves local compiled assets without a Node installation', async ({ page }) => {
    const repository = fs.realpathSync(path.resolve(__dirname, '../..'));
    const installedPackage = path.join(consumerDirectory, 'vendor/easycorp/easyadmin-bundle');
    expect(fs.realpathSync(installedPackage)).not.toBe(repository);
    expect(fs.lstatSync(installedPackage).isSymbolicLink()).toBe(false);
    expect(path.relative(repository, consumerDirectory).startsWith('..')).toBe(true);
    expect(fs.existsSync(path.join(consumerDirectory, 'node_modules'))).toBe(false);
    const metadata = JSON.parse(fs.readFileSync(path.join(installedPackage, 'composer.json'), 'utf8'));
    const reference = JSON.parse(fs.readFileSync(path.join(consumerDirectory, 'package-reference.json'), 'utf8'));
    expect(reference.reference).toMatch(/^[a-f0-9]{40}$/);
    expect(metadata.extra['consumer-proof'].reference).toBe(reference.reference);
    const install = JSON.parse(fs.readFileSync(path.join(consumerDirectory, 'var/install-proof.json'), 'utf8'));
    expect(install.reference).toBe(reference.reference);
    expect(install.frontendToolsOnPath).toEqual({ node: false, yarn: false });
    expect(install.tailwindBundleInstalled).toBe(false);
    const archive = path.join(consumerDirectory, 'var/packages', `easyadmin-bundle-${reference.version}.zip`);
    expect(createHash('sha256').update(fs.readFileSync(archive)).digest('hex')).toBe(reference.sha256);
    expect(metadata.name).toBe('easycorp/easyadmin-bundle');
    expect(metadata.autoload['psr-4']['EasyCorp\\Bundle\\EasyAdminBundle\\']).toBe('src/');

    const externalRequests = [];
    const assetFailures = [];
    const pageErrors = [];
    page.on('request', (request) => {
        if (new URL(request.url()).origin !== 'http://127.0.0.1:8091') externalRequests.push(request.url());
    });
    page.on('response', (response) => {
        if (['stylesheet', 'script', 'font'].includes(response.request().resourceType()) && !response.ok()) {
            assetFailures.push({ status: response.status(), url: response.url() });
        }
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    const index = await page.goto('/admin/entries');
    expect(index.status()).toBe(200);
    await expect(page.getByTestId('consumer-title-field')).toHaveText(seeded.entries.map((entry) => entry.title));
    const sheets = await page.locator('link[rel="stylesheet"]').evaluateAll((links) => links.map((link) => link.href));
    expect(sheets.some((href) => href.includes('/bundles/easyadmin/'))).toBe(true);
    for (const href of sheets) {
        const response = await page.request.get(href);
        expect(response.status()).toBe(200);
        expect(await response.text()).not.toMatch(/Bootstrap v5|--bs-(?:body|btn|modal)/);
    }
    expect(await page.evaluate(() => typeof window.bootstrap)).toBe('undefined');
    expect(externalRequests).toEqual([]);
    expect(assetFailures).toEqual([]);
    expect(pageErrors).toEqual([]);
});

test('layout, configured field, custom field, tokens, assets and application-only utilities compose', async ({
    page,
}) => {
    await expect(page.getByTestId('consumer-layout-block')).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.consumerAssetLoaded)).toBe(true);
    await expect.poll(() => page.evaluate(() => window.consumerImportmapLoaded)).toBe(true);
    await expect(page.locator('html')).toHaveAttribute('data-consumer-js', 'ready');
    await expect(page.locator('html')).toHaveAttribute('data-consumer-importmap', 'ready');
    await expect(page.getByTestId('consumer-configured-css-proof')).toHaveCSS('border-top-width', '3px');
    const utility = page.getByTestId('consumer-utility-demo');
    const size = await utility.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
    expect(await utility.evaluate((element) => Number.parseFloat(getComputedStyle(element).letterSpacing))).toBeCloseTo(
        size * 0.137,
        3
    );
    const installedPublic = path.join(consumerDirectory, 'vendor/easycorp/easyadmin-bundle/public');
    for (const file of fs.readdirSync(installedPublic).filter((name) => name.endsWith('.css'))) {
        expect(fs.readFileSync(path.join(installedPublic, file), 'utf8')).not.toContain('.tracking-\\[0\\.137em\\]');
    }

    await page.goto('/admin/entries');
    await expect(page.getByTestId('consumer-title-field')).toHaveText(seeded.entries.map((entry) => entry.title));
    await expect(page.getByTestId('consumer-status')).toHaveText(
        seeded.entries.map((entry) => entry.status.toUpperCase())
    );
    await expect(page.locator('[data-action-name="new"]')).toHaveCSS('background-color', 'rgb(124, 58, 237)');
    const first = seeded.entries[0];
    await page.goto(`/admin/entries/${first.id}`);
    await expect(page.getByTestId('consumer-title-field')).toHaveText(first.title);
    await expect(page.getByTestId('consumer-status')).toHaveText(first.status.toUpperCase());
    expect(fixture().entries).toEqual(seeded.entries);
});

test('an extended form block submits native create and edit requests with the original submitter and CSRF', async ({
    page,
}) => {
    await page.goto('/admin/entries/new');
    const title = page.getByTestId('consumer-title-widget');
    await expect(title).toHaveAttribute('name', 'Entry[title]');
    await expect(title).toHaveAttribute('id', 'Entry_title');
    await title.fill('Consumer created entry');
    await page.getByLabel('Priority', { exact: true }).fill('27');
    await page.getByLabel('Notes', { exact: true }).fill('Created through the installed bundle');
    await page.getByLabel('Published', { exact: true }).check();
    const createdRequest = page.waitForRequest(
        (request) => request.method() === 'POST' && new URL(request.url()).pathname === '/admin/entries/new'
    );
    await save(page);
    const body = new URLSearchParams((await createdRequest).postData());
    expect(body.get('Entry[title]')).toBe('Consumer created entry');
    expect(body.get('Entry[priority]')).toBe('27');
    expect(body.get('Entry[notes]')).toBe('Created through the installed bundle');
    expect(body.get('Entry[published]')).toBe('1');
    expect(body.get('Entry[_token]')).toBeTruthy();
    expect(body.get('ea[newForm][btn]')).toBe('saveAndReturn');
    await expect(page).toHaveURL(/\/admin\/entries$/);
    const created = fixture().entries.find((entry) => entry.title === 'Consumer created entry');
    expect(created).toMatchObject({ priority: 27, notes: 'Created through the installed bundle', published: true });

    await page.goto(`/admin/entries/${created.id}/edit`);
    await page.getByTestId('consumer-title-widget').fill('Consumer edited entry');
    await page.getByLabel('Priority', { exact: true }).fill('28');
    await page.getByLabel('Published', { exact: true }).uncheck();
    const editedResponse = page.waitForResponse(
        (response) =>
            response.request().method() === 'POST' &&
            new URL(response.url()).pathname === `/admin/entries/${created.id}/edit`
    );
    await save(page, 'saveAndContinue');
    const response = await editedResponse;
    expect(response.status()).toBe(302);
    const editedBody = new URLSearchParams(response.request().postData());
    expect(editedBody.get('Entry[title]')).toBe('Consumer edited entry');
    expect(editedBody.get('Entry[priority]')).toBe('28');
    expect(editedBody.has('Entry[published]')).toBe(false);
    expect(editedBody.get('Entry[_token]')).toBeTruthy();
    expect(editedBody.get('ea[newForm][btn]')).toBe('saveAndContinue');
    await expect(page).toHaveURL(new RegExp(`/admin/entries/${created.id}/edit$`));
    expect(fixture().entries.find((entry) => entry.id === created.id)).toMatchObject({
        title: 'Consumer edited entry',
        priority: 28,
        published: false,
    });
});

test('server validation and a forged CSRF token retain form values without persisting an entry', async ({ page }) => {
    await page.goto('/admin/entries/new');
    await page.getByTestId('consumer-title-widget').fill('');
    await page.getByLabel('Notes', { exact: true }).fill('Retained invalid notes');
    await page.locator('form[name="Entry"]').evaluate((form) => {
        form.noValidate = true;
    });
    const invalid = page.waitForResponse(
        (response) =>
            response.request().method() === 'POST' && new URL(response.url()).pathname === '/admin/entries/new'
    );
    await save(page);
    expect((await invalid).status()).toBe(422);
    await expect(page.getByLabel('Notes', { exact: true })).toHaveValue('Retained invalid notes');
    await expect(page.locator('body')).toContainText('This value should not be blank.');
    expect(fixture().entries).toEqual(seeded.entries);

    await page.getByTestId('consumer-title-widget').fill('Rejected forged token');
    await page.locator('[name="Entry[_token]"]').evaluate((input) => {
        input.value = 'forged';
    });
    const rejected = page.waitForResponse(
        (response) =>
            response.request().method() === 'POST' && new URL(response.url()).pathname === '/admin/entries/new'
    );
    await save(page);
    expect((await rejected).status()).toBe(422);
    await expect(page.locator('body')).toContainText('The CSRF token is invalid.');
    await expect(page.getByTestId('consumer-title-widget')).toHaveValue('Rejected forged token');
    expect(fixture().entries).toEqual(seeded.entries);
});

test('a custom action follows its generated GET destination and exports the real records without mutation', async ({
    page,
}) => {
    await page.goto('/admin/entries');
    const action = page.locator('[data-action-name="export"]');
    const actionUrl = new URL(await action.getAttribute('href'), page.url());
    expect(actionUrl.origin).toBe(new URL(page.url()).origin);
    expect(actionUrl.pathname).toBe('/admin/entries/export');
    expect(actionUrl.search).toBe('');
    const exported = page.waitForResponse((response) => new URL(response.url()).pathname === '/admin/entries/export');
    await action.click();
    const response = await exported;
    expect(response.request().method()).toBe('GET');
    expect(response.request().postData()).toBeNull();
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ entries: seeded.entries });
    expect(fixture().entries).toEqual(seeded.entries);
});
