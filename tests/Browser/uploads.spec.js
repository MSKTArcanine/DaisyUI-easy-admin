const { test, expect } = require('@playwright/test');
const { fixture, login, save } = require('./helpers');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

let seeded;
const file = (name) => ({
    name: `${name}.txt`,
    mimeType: 'text/plain',
    buffer: Buffer.from(`Deterministic upload ${name} bytes\n`),
});

test.beforeEach(async ({ page }) => {
    seeded = fixture('seed');
    await login(page);
});

async function editUploads(page, query = '') {
    await page.goto(`/admin/uploads/${seeded.widgets[0].id}/edit${query.replace(/^&/, '?')}`);
    return page.locator('[data-ea-fileupload-field]');
}

async function submitUploads(page) {
    const submitted = page.waitForResponse(
        (response) => response.request().method() === 'POST' && new URL(response.url()).pathname.includes('/uploads/')
    );
    await save(page);
    const response = await submitted;
    expect(response.request().headers()['content-type']).toContain('multipart/form-data; boundary=');
    await expect.poll(() => new URL(page.url()).pathname).toBe('/admin/uploads');
}

test('multiple deletion preserves FileList indices and submits only the intended bytes after repeated initialization', async ({
    page,
}) => {
    await page.addInitScript(() => {
        window.createdObjectUrls = [];
        const create = URL.createObjectURL;
        URL.createObjectURL = (file) => {
            window.createdObjectUrls.push(file.name);
            return create(file);
        };
    });
    const widget = await editUploads(page);
    await widget.locator('input[type="file"]').setInputFiles([file('A'), file('B'), file('C')]);
    await expect(widget.locator('[data-new-file]')).toHaveCount(3);
    await page.evaluate(
        () =>
            new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = [...document.scripts].find((entry) => entry.src.includes('/field-file-upload.')).src;
                script.onload = resolve;
                script.onerror = reject;
                document.head.append(script);
            })
    );
    await expect(widget.locator('[data-new-file]')).toHaveCount(3);
    await widget.getByRole('button', { name: 'Remove the item', exact: true }).first().click();
    await widget.getByRole('button', { name: 'Remove the item', exact: true }).first().click();
    await expect(widget.locator('[data-new-file]')).toHaveCount(1);
    await expect(widget.locator('[data-new-file]')).toHaveAttribute('data-file-index', '0');
    expect(
        await widget.locator('input[type="file"]').evaluate((input) => [...input.files].map((entry) => entry.name))
    ).toEqual(['C.txt']);
    expect(await page.evaluate(() => window.createdObjectUrls)).toEqual([]);
    await submitUploads(page);
    expect(fixture().widgets[0]).toMatchObject({
        multipleValues: ['C.txt'],
        multipleFileContents: { 'C.txt': 'Deterministic upload C bytes\n' },
    });
    expect(fixture().uploads).toEqual(['C.txt']);
    const persisted = await editUploads(page);
    await expect(persisted.getByRole('link', { name: 'Download', exact: true })).toHaveAttribute('download', 'C.txt');
    await persisted.getByRole('button', { name: 'Remove the item', exact: true }).click();
    await expect(persisted.locator('[id$="_deleted_files"]')).toHaveValue('["C.txt"]');
    await submitUploads(page);
    expect(fixture().widgets[0].multipleValues).toEqual([]);
    expect(fixture().uploads).toEqual([]);
});

test('clear-all removes stored and selected files, then permits a new upload with exact persisted content', async ({
    page,
}) => {
    let widget = await editUploads(page);
    await widget.locator('input[type="file"]').setInputFiles([file('A'), file('B')]);
    await submitUploads(page);
    widget = await editUploads(page);
    await widget.locator('input[type="file"]').setInputFiles(file('C'));
    await expect(widget.locator('[data-ea-fileupload-card]')).toHaveCount(3);
    await widget.getByRole('button', { name: 'Clear all', exact: true }).click();
    await expect(widget.locator('[data-ea-fileupload-card]')).toHaveCount(0);
    await expect(widget.locator('input[type="checkbox"]')).toBeChecked();
    await expect(widget.getByRole('button', { name: 'Clear all', exact: true })).toBeHidden();
    await expect(widget.getByRole('button', { name: 'Add files', exact: true })).toBeVisible();
    await widget.locator('input[type="file"]').setInputFiles(file('D'));
    await submitUploads(page);
    expect(fixture().widgets[0]).toMatchObject({
        multipleValues: ['D.txt'],
        multipleFileContents: { 'D.txt': 'Deterministic upload D bytes\n' },
    });
    expect(fixture().uploads).toEqual(['D.txt']);
});

test('disabled upload controls preserve stored files even when forged deletion fields are submitted', async ({
    page,
}) => {
    let widget = await editUploads(page);
    await widget.locator('input[type="file"]').setInputFiles(file('A'));
    await submitUploads(page);
    widget = await editUploads(page, '&disabled=1');
    await expect(widget.locator('input[type="file"]')).toBeDisabled();
    await expect(widget.getByRole('button', { name: 'Add files', exact: true })).toBeDisabled();
    await expect(widget.getByRole('button', { name: 'Clear all', exact: true })).toBeDisabled();
    await expect(widget.getByRole('button', { name: 'Remove the item', exact: true })).toBeDisabled();
    await widget.evaluate((container) => {
        const deleted = container.querySelector('[id$="_deleted_files"]');
        deleted.disabled = false;
        deleted.value = '["A.txt"]';
        const clear = container.querySelector('input[type="checkbox"]');
        clear.disabled = false;
        clear.checked = true;
    });
    await page.getByLabel('Text', { exact: true }).fill('Disabled attachment retained');
    await submitUploads(page);
    expect(fixture().widgets[0]).toMatchObject({
        text: 'Disabled attachment retained',
        multipleValues: ['A.txt'],
        multipleFileContents: { 'A.txt': 'Deterministic upload A bytes\n' },
    });
    expect(fixture().uploads).toEqual(['A.txt']);
});

test('delete permissions remove destructive controls while allowing additional files', async ({ page }) => {
    let widget = await editUploads(page);
    await widget.locator('input[type="file"]').setInputFiles(file('A'));
    await submitUploads(page);
    widget = await editUploads(page, '&nodelete=1');
    await expect(widget.getByRole('button', { name: 'Remove the item', exact: true })).toHaveCount(0);
    await expect(widget.getByRole('button', { name: 'Clear all', exact: true })).toHaveCount(0);
    await widget.locator('input[type="file"]').setInputFiles(file('B'));
    await submitUploads(page);
    expect(fixture().widgets[0].multipleValues).toEqual(['A.txt', 'B.txt']);
    expect(fixture().uploads).toEqual(['A.txt', 'B.txt']);
});

test('removing a stored attachment triggers unsaved-change protection without deleting server state', async ({
    page,
}) => {
    let widget = await editUploads(page);
    await widget.locator('input[type="file"]').setInputFiles(file('A'));
    await submitUploads(page);
    widget = await editUploads(page);
    await widget.getByRole('button', { name: 'Remove the item', exact: true }).click();
    const dialog = page.waitForEvent('dialog');
    const navigation = page.getByRole('link', { name: /Categories$/ }).click();
    const warning = await dialog;
    expect(warning.type()).toBe('beforeunload');
    await warning.dismiss();
    await navigation;
    await expect.poll(() => new URL(page.url()).pathname).toBe(`/admin/uploads/${seeded.widgets[0].id}/edit`);
    expect(fixture().widgets[0].multipleValues).toEqual(['A.txt']);
    expect(fixture().uploads).toEqual(['A.txt']);
});

test('image uploads create a real preview, revoke removed object URLs and persist exact image bytes', async ({
    page,
}) => {
    const bytes = fs.readFileSync(path.join(__dirname, 'references/dashboard-desktop-light.png'));
    const image = { name: 'preview.png', mimeType: 'image/png', buffer: bytes };
    await page.addInitScript(() => {
        window.createdUrls = [];
        window.revokedUrls = [];
        const create = URL.createObjectURL,
            revoke = URL.revokeObjectURL;
        URL.createObjectURL = (file) => {
            const url = create(file);
            window.createdUrls.push(url);
            return url;
        };
        URL.revokeObjectURL = (url) => {
            window.revokedUrls.push(url);
            revoke(url);
        };
    });
    let widget = await editUploads(page, '&image=1');
    await widget.locator('input[type="file"]').setInputFiles(image);
    const preview = widget.locator('.ea-fileupload-card-thumbnail');
    await expect(preview).toBeVisible();
    await expect.poll(() => preview.evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
    const url = await preview.getAttribute('src');
    expect(url).toMatch(/^blob:/);
    await widget.getByRole('button', { name: 'Remove the item', exact: true }).click();
    expect(await page.evaluate(() => window.revokedUrls)).toEqual([url]);
    await expect(widget.getByRole('button', { name: 'Add file', exact: true })).toBeVisible();
    await widget.locator('input[type="file"]').setInputFiles(image);
    await submitUploads(page);
    expect(fixture().widgets[0]).toMatchObject({
        imageUpload: 'preview.png',
        imageUploadChecksum: crypto.createHash('sha256').update(bytes).digest('hex'),
    });
    expect(fixture().uploads).toEqual(['preview.png']);
    widget = await editUploads(page, '&image=1');
    await expect(widget.locator('.ea-fileupload-card-thumbnail')).toHaveAttribute('src', '/uploads/preview.png');
    await widget.getByRole('button', { name: 'Remove the item', exact: true }).click();
    await submitUploads(page);
    expect(fixture().widgets[0]).toMatchObject({ imageUpload: null, imageUploadChecksum: null });
    expect(fixture().uploads).toEqual([]);
});
