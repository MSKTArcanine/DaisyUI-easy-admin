const { test, expect } = require('@playwright/test');
const { fixture, login, save, captureReference } = require('./helpers');

let seeded;

test.beforeEach(async ({ page }) => {
    seeded = fixture('seed');
    await login(page);
});

test('autocomplete requests remote choices and persists its selected association', async ({ page }) => {
    await page.addInitScript(() => {
        window.autocompleteEvents = [];
        for (const name of ['ea.autocomplete.pre-connect', 'ea.autocomplete.connect']) {
            document.addEventListener(name, (event) => {
                window.autocompleteEvents.push({
                    type: name,
                    prefix: event.detail.prefix,
                    bubbles: event.bubbles,
                    hasConfig: !!event.detail.config,
                });
            });
        }
    });
    await page.goto(`/admin/widgets/${seeded.widgets[0].id}/edit`);
    await captureReference(page, 'widgets-desktop-light');
    await page.locator('.ts-control').click();
    const input = page.locator('.ts-dropdown .dropdown-input');
    const remoteResponse = page.waitForResponse(
        (candidate) =>
            candidate.url().includes('/autocomplete') &&
            new URL(candidate.url()).searchParams.get('query') === 'Category 3'
    );
    await input.fill('Category 3');
    const response = await remoteResponse;
    expect(response.request().method()).toBe('GET');
    const result = await response.json();
    expect(result.results.some((item) => String(item.entityId) === String(seeded.categories[2].id))).toBe(true);
    await page.locator(`.ts-dropdown [data-value='${seeded.categories[2].id}']`).click();
    await expect(page.locator('[data-ea-widget="ea-autocomplete"]')).toHaveValue(String(seeded.categories[2].id));
    const events = await page.evaluate(() => window.autocompleteEvents);
    expect(events.map((event) => event.type)).toEqual(['ea.autocomplete.pre-connect', 'ea.autocomplete.connect']);
    expect(events.every((event) => event.prefix === 'autocomplete' && event.bubbles && event.hasConfig)).toBe(true);
    await save(page);
    await expect(page).toHaveURL(/\/admin\/widgets$/);
    expect(fixture().widgets[0].categoryId).toBe(seeded.categories[2].id);
});

test('collection add remove emits lifecycle payloads, keeps unique indices and persists entries', async ({ page }) => {
    await page.addInitScript(() => {
        window.collectionEvents = [];
        for (const type of ['ea.collection.item-added', 'ea.collection.item-removed']) {
            document.addEventListener(type, (event) => {
                const item = event.detail.newElement || event.detail.deletedElement;
                window.collectionEvents.push({
                    type,
                    input: item.querySelector('input').name,
                    collection: event.detail.collection.dataset.eaCollectionField,
                    attached: item.isConnected,
                });
            });
        }
    });
    await page.goto(`/admin/widgets/${seeded.widgets[0].id}/edit`);
    const collection = page.locator('[data-ea-collection-field]');
    await collection.getByRole('button', { name: 'Add a new item', exact: true }).click();
    await collection.locator('input').nth(1).fill('Entry 2');
    await collection.getByRole('button', { name: 'Add a new item', exact: true }).click();
    await collection.locator('input').nth(2).fill('Entry 3');
    const ids = await collection.locator('input').evaluateAll((inputs) => inputs.map((input) => input.id));
    expect(new Set(ids).size).toBe(3);
    await collection.getByRole('button', { name: 'Remove the item', exact: true }).nth(1).click();
    await collection.getByRole('button', { name: 'Add a new item', exact: true }).click();
    await collection.locator('input').nth(2).fill('Entry 4');
    const names = await collection.locator('input').evaluateAll((inputs) => inputs.map((input) => input.name));
    expect(names).toEqual([
        'FieldTestEntity[collectionField][0]',
        'FieldTestEntity[collectionField][2]',
        'FieldTestEntity[collectionField][3]',
    ]);
    const events = await page.evaluate(() => window.collectionEvents);
    expect(events.map((event) => event.type)).toEqual([
        'ea.collection.item-added',
        'ea.collection.item-added',
        'ea.collection.item-removed',
        'ea.collection.item-added',
    ]);
    expect(events.every((event) => event.collection === 'true')).toBe(true);
    expect(events[2].attached).toBe(false);
    await save(page);
    await expect(page).toHaveURL(/\/admin\/widgets$/);
    expect(Object.values(fixture().widgets[0].entries)).toEqual(['Entry 1', 'Entry 3', 'Entry 4']);
});

test('upload submits multipart bytes and deletion persists and removes the stored file', async ({ page }) => {
    await page.goto(`/admin/widgets/${seeded.widgets[0].id}/edit`);
    await expect(page.locator('input[type="file"]')).toHaveAttribute('name', 'FieldTestEntity[fileField][file]');
    await page.locator('input[type="file"]').setInputFiles({
        name: 'browser-attachment.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Deterministic upload bytes\n'),
    });
    const submitted = page.waitForRequest(
        (request) => request.method() === 'POST' && request.url().includes('/widgets/')
    );
    await save(page);
    const upload = await submitted;
    expect(upload.headers()['content-type']).toContain('multipart/form-data; boundary=');
    await expect(page).toHaveURL(/\/admin\/widgets$/);
    const uploaded = fixture().widgets[0];
    expect(uploaded.file).toBe('browser-attachment.txt');
    expect(uploaded.fileContents).toBe('Deterministic upload bytes\n');

    await page.goto(`/admin/widgets/${uploaded.id}/edit`);
    await page.locator('[data-ea-fileupload-delete-card]').click();
    await save(page);
    await expect(page).toHaveURL(/\/admin\/widgets$/);
    expect(fixture().widgets[0]).toMatchObject({ file: null, fileContents: null });
    expect(fixture().uploads).not.toContain(uploaded.file);
});

test('code and rich text editors submit their actual edited values', async ({ page }) => {
    await page.goto(`/admin/widgets/${seeded.widgets[0].id}/edit`);
    await page.getByRole('tab', { name: 'Editors', exact: true }).click();
    await expect(page.locator('.CodeMirror')).toBeVisible();
    await page.locator('.CodeMirror-code').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.type('const value = 9;');
    await expect
        .poll(() => page.locator('.CodeMirror').evaluate((editor) => editor.CodeMirror.getValue()))
        .toBe('const value = 9;');
    await page.locator('trix-editor').fill('Edited rich text');
    await captureReference(page, 'editors-desktop-light');
    await save(page);
    await expect(page).toHaveURL(/\/admin\/widgets$/);
    expect(fixture().widgets[0]).toMatchObject({ code: 'const value = 9;', richText: '<div>Edited rich text</div>' });
});

test('tabs persist hashes and reveal a required error inside an initially collapsed section', async ({ page }) => {
    await page.addInitScript(() => {
        window.formErrors = [];
        document.addEventListener('ea.form.error', (event) =>
            window.formErrors.push({
                page: event.detail.page,
                form: event.detail.form.tagName,
                cancelable: event.cancelable,
            })
        );
    });
    await page.goto(`/admin/layout/${seeded.layouts[0].id}/edit`);
    await page.getByRole('tab', { name: /Settings$/ }).click();
    expect(new URL(page.url()).hash).toBe('#tab-settings');
    const fieldset = page.locator('fieldset').filter({ has: page.getByLabel('Priority', { exact: true }) });
    await expect(page.getByLabel('Priority', { exact: true })).toBeHidden();
    await fieldset.locator('[aria-controls]').first().click();
    await page.getByLabel('Priority', { exact: true }).fill('');
    await fieldset.locator('[aria-controls]').first().click();
    await page.getByRole('tab', { name: /Basic Information$/ }).click();
    await save(page);
    await expect(page.getByLabel('Priority', { exact: true })).toBeVisible();
    await captureReference(page, 'nested-form-error-desktop-light');
    await expect(page.locator('[id^="tablist-"]').filter({ hasText: 'Settings' })).toHaveAttribute(
        'aria-selected',
        'true'
    );
    expect(await page.evaluate(() => window.formErrors)).toEqual([{ page: 'edit', form: 'FORM', cancelable: true }]);
    expect(fixture().layouts[0].priority).toBe(1);
});

test('cancelable form event prevents persistence', async ({ page }) => {
    await page.goto(`/admin/categories/${seeded.categories[0].id}/edit`);
    await page.getByLabel('Name', { exact: true }).fill('Unsaved name');
    await page.evaluate(() => {
        document.addEventListener(
            'ea.form.submit',
            (event) => {
                window.lastSubmitEvent = {
                    page: event.detail.page,
                    form: event.detail.form.tagName,
                    cancelable: event.cancelable,
                };
                event.preventDefault();
            },
            { once: true }
        );
    });
    await save(page);
    expect(await page.evaluate(() => window.lastSubmitEvent)).toEqual({ page: 'edit', form: 'FORM', cancelable: true });
    expect(fixture().categories[0].name).toBe('Category 1');
    await expect(page).toHaveURL(new RegExp(`/admin/categories/${seeded.categories[0].id}/edit`));
});

test('unsaved navigation can be canceled or confirmed without persisting edits', async ({ page }) => {
    await page.goto(`/admin/categories/${seeded.categories[0].id}/edit`);
    await page.getByLabel('Name', { exact: true }).fill('Unsaved name');
    const dialog = page.waitForEvent('dialog');
    const navigate = page.getByRole('link', { name: /Categories$/ }).click();
    const warning = await dialog;
    expect(warning.type()).toBe('beforeunload');
    await warning.dismiss();
    await navigate;
    await expect(page).toHaveURL(new RegExp(`/admin/categories/${seeded.categories[0].id}/edit`));
    await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Unsaved name');
    page.once('dialog', (warning) => warning.accept());
    await page.getByRole('link', { name: /Categories$/ }).click();
    await expect(page).toHaveURL(/\/admin\/categories$/);
    expect(fixture().categories[0].name).toBe('Category 1');
});

test('baseline DirtyForm issue: canceled submission must retain unsaved navigation protection', async ({ page }) => {
    await page.goto(`/admin/categories/${seeded.categories[0].id}/edit`);
    await page.getByLabel('Name', { exact: true }).fill('Canceled unsaved name');
    await page.evaluate(() => {
        document.addEventListener('ea.form.submit', (event) => event.preventDefault(), { once: true });
    });
    await save(page);
    expect(fixture().categories[0].name).toBe('Category 1');
    const warnings = [];
    page.on('dialog', async (dialog) => {
        warnings.push(dialog.type());
        await dialog.dismiss();
    });
    await page.getByRole('link', { name: /Categories$/ }).click();
    await expect(page).toHaveURL(new RegExp(`/admin/categories/${seeded.categories[0].id}/edit`), { timeout: 1500 });
    expect(warnings).toEqual(['beforeunload']);
    await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Canceled unsaved name');
});
