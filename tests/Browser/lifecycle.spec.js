const { test, expect } = require('@playwright/test');
const { fixture, login, save } = require('./helpers');

let seeded;

test.beforeEach(async ({ page }) => {
    seeded = fixture('seed');
    await login(page);
});

async function reloadEntry(page, name) {
    await page.evaluate(
        (entryName) =>
            new Promise((resolve, reject) => {
                const previous = [...document.scripts].find((script) => script.src.includes(`/${entryName}.`));
                if (!previous) throw new Error(`Missing widget entry ${entryName}`);
                const script = document.createElement('script');
                script.src = previous.src;
                script.onload = resolve;
                script.onerror = reject;
                document.head.append(script);
            }),
        name
    );
}

async function editCode(page, value, index = 0) {
    await page.locator('.CodeMirror-code').nth(index).click();
    await page.keyboard.press('ControlOrMeta+A');
    if (value) {
        await page.keyboard.type(value);
    } else {
        await page.keyboard.press('Backspace');
    }
}

test('optional CodeMirror edits survive repeated initialization and retain unsaved protection before persisting', async ({
    page,
}) => {
    await page.goto(`/admin/widgets/${seeded.widgets[0].id}/edit?ui=tailwind`);
    await page.getByRole('tab', { name: 'Editors', exact: true }).click();
    await reloadEntry(page, 'field-code-editor');
    await reloadEntry(page, 'field-code-editor');
    await expect(page.locator('.CodeMirror')).toHaveCount(1);
    await editCode(page, 'const lifecycle = 27;');
    await expect(page.locator('[data-ea-code-editor-field]')).toHaveValue('const lifecycle = 27;');
    const warning = page.waitForEvent('dialog');
    const navigation = page.getByRole('link', { name: /Categories$/ }).click();
    const dialog = await warning;
    expect(dialog.type()).toBe('beforeunload');
    await dialog.dismiss();
    await navigation;
    expect(fixture().widgets[0].code).toBe(seeded.widgets[0].code);
    const response = page.waitForResponse(
        (candidate) => candidate.request().method() === 'POST' && candidate.url().includes('/widgets/')
    );
    await save(page);
    await response;
    await expect.poll(() => new URL(page.url()).pathname).toBe('/admin/widgets');
    expect(fixture().widgets[0].code).toBe('const lifecycle = 27;');
});

test('Trix changes preserve unrelated custom validity and its global integration after repeated loading', async ({
    page,
}) => {
    await page.goto(`/admin/widgets/${seeded.widgets[0].id}/edit?ui=tailwind`);
    await page.evaluate(() => {
        window.initialTrix = window.Trix;
        document
            .querySelector('[name="FieldTestEntity[textField]"]')
            .setCustomValidity('Independent configured validation');
    });
    await page.getByRole('tab', { name: 'Editors', exact: true }).click();
    await reloadEntry(page, 'field-text-editor');
    await reloadEntry(page, 'field-text-editor');
    await expect(page.locator('trix-editor')).toHaveCount(1);
    await expect(page.locator('trix-toolbar')).toHaveCount(1);
    expect(await page.evaluate(() => window.Trix === window.initialTrix)).toBe(true);
    await page.locator('trix-editor').fill('Retained rich text');
    await expect
        .poll(() => page.getByLabel('Text', { exact: true }).evaluate((input) => input.validationMessage))
        .toBe('Independent configured validation');
    const posts = [];
    page.on('request', (request) => {
        if (request.method() === 'POST' && request.url().includes('/widgets/')) posts.push(request);
    });
    await save(page);
    await expect(page.getByLabel('Text', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Text', { exact: true })).toBeFocused();
    expect(posts).toHaveLength(0);
    expect(fixture().widgets[0].richText).toBe(seeded.widgets[0].richText);
    await page.getByLabel('Text', { exact: true }).evaluate((input) => input.setCustomValidity(''));
    await save(page);
    await expect.poll(() => new URL(page.url()).pathname).toBe('/admin/widgets');
    expect(fixture().widgets[0].richText).toBe('<div>Retained rich text</div>');
});

test('required hidden editors reveal their tab, focus visible inputs and render one associated error each', async ({
    page,
}) => {
    await page.goto(`/admin/widgets/${seeded.widgets[0].id}/edit?ui=tailwind&required=1`);
    await page.getByRole('tab', { name: 'Editors', exact: true }).click();
    await editCode(page, '');
    await page.locator('trix-editor').fill('');
    await page.getByRole('tab', { name: 'Values', exact: true }).click();
    const posts = [];
    page.on('request', (request) => {
        if (request.method() === 'POST' && request.url().includes('/widgets/')) posts.push(request);
    });
    await save(page);
    const code = page.locator('[data-ea-code-editor-field]');
    const codeTarget = page.locator(`[id="${await code.getAttribute('data-ea-validation-target')}"]`);
    await expect(codeTarget).toBeFocused();
    await expect(page.getByRole('tab', { name: /Editors/ })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-ea-widget-error]')).toHaveCount(2);
    await expect(codeTarget).toHaveAttribute('aria-describedby', /widget-error/);
    await editCode(page, 'const required = true;');
    await page.getByRole('tab', { name: 'Values', exact: true }).click();
    await save(page);
    await expect(page.locator('trix-editor')).toBeFocused();
    await expect(page.locator('trix-editor')).toHaveAttribute('aria-describedby', /widget-error/);
    await expect(page.locator('[data-ea-widget-error]')).toHaveCount(1);
    await expect(page.locator('[data-ea-widget-error]')).toContainText('Please fill in this field');
    await save(page);
    await expect(page.locator('[data-ea-widget-error]')).toHaveCount(1);
    expect(posts).toHaveLength(0);
    await page.locator('trix-editor').fill('Required rich text');
    await expect(page.locator('[data-ea-widget-error]')).toHaveCount(0);
    await save(page);
    await expect.poll(() => new URL(page.url()).pathname).toBe('/admin/widgets');
    expect(posts).toHaveLength(1);
    expect(fixture().widgets[0]).toMatchObject({
        code: 'const required = true;',
        richText: '<div>Required rich text</div>',
    });
});

test('disabled CodeMirror and readonly Trix remain immutable while ordinary edits submit', async ({ page }) => {
    await page.goto(`/admin/widgets/${seeded.widgets[0].id}/edit?ui=tailwind&readonly=1`);
    await page.getByRole('tab', { name: 'Editors', exact: true }).click();
    await expect(page.locator('[data-ea-code-editor-field]')).toBeDisabled();
    await editCode(page, 'Forbidden code');
    await expect(page.locator('[data-ea-code-editor-field]')).toHaveValue(seeded.widgets[0].code);
    const editor = page.locator('trix-editor');
    await expect(editor).toHaveAttribute('aria-readonly', 'true');
    await expect(editor).toHaveAttribute('contenteditable', 'false');
    await expect(page.locator('trix-toolbar')).toHaveAttribute('inert');
    await editor.focus();
    await page.keyboard.type('Forbidden rich text');
    await expect(page.locator('.ea-text-editor-content')).toBeEnabled();
    await expect(page.locator('.ea-text-editor-content')).toHaveValue(seeded.widgets[0].richText);
    await page.getByRole('tab', { name: 'Values', exact: true }).click();
    await page.getByLabel('Text', { exact: true }).fill('Ordinary edited value');
    await save(page);
    await expect.poll(() => new URL(page.url()).pathname).toBe('/admin/widgets');
    expect(fixture().widgets[0]).toMatchObject({
        text: 'Ordinary edited value',
        code: seeded.widgets[0].code,
        richText: seeded.widgets[0].richText,
    });
});

test('dynamic widgets initialize once, preserve slug lock state, resize hidden notes and persist edited values', async ({
    page,
}) => {
    const errors = [];
    const assetFailures = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (response) => {
        const type = response.request().resourceType();
        if (['stylesheet', 'script', 'font'].includes(type) && response.status() >= 400) {
            assetFailures.push({ url: response.url(), status: response.status(), type });
        }
    });
    await page.goto(`/admin/dynamic-widgets/${seeded.widgets[0].id}/edit?ui=tailwind`);
    await page.getByRole('tab', { name: 'Dynamic', exact: true }).click();
    const collection = page.locator('[data-ea-collection-field]');
    await collection.getByRole('button', { name: 'Add a new item', exact: true }).click();
    const title = page.locator('[name="FieldTestEntity[multipleChoiceField][0][title]"]');
    const slug = page.locator('[name="FieldTestEntity[multipleChoiceField][0][slug]"]');
    const notes = page.locator('[name="FieldTestEntity[multipleChoiceField][0][notes]"]');
    await expect(title).toBeVisible();
    await title.fill('Dynamic title');
    await expect(slug).toHaveValue('dynamic-title');
    const lock = collection.locator('[data-ea-slug-lock-button]');
    await lock.click();
    await slug.fill('manual-slug');
    for (const entry of ['field-code-editor', 'field-text-editor', 'field-textarea', 'field-slug'])
        await reloadEntry(page, entry);
    await expect(lock).toHaveAttribute('aria-pressed', 'false');
    await expect(slug).not.toHaveAttribute('readonly');
    await title.fill('Changed title');
    await expect(slug).toHaveValue('manual-slug');
    await lock.click();
    await expect(slug).toHaveValue('changed-title');
    const initialHeight = await notes.evaluate((input) => input.getBoundingClientRect().height);
    const notesText = 'Wrapping notes '.repeat(120).trim();
    await notes.fill(notesText);
    await expect
        .poll(() => notes.evaluate((input) => input.getBoundingClientRect().height))
        .toBeGreaterThan(initialHeight);
    await page.getByRole('tab', { name: 'Main', exact: true }).click();
    await expect(notes).toBeHidden();
    await page.setViewportSize({ width: 520, height: 900 });
    await page.getByRole('tab', { name: 'Dynamic', exact: true }).click();
    await expect.poll(() => notes.evaluate((input) => input.scrollHeight - input.clientHeight)).toBeLessThanOrEqual(1);
    await expect(page.locator('[data-ea-textarea-mirror]')).toHaveCount(1);
    await expect(page.locator('.CodeMirror')).toHaveCount(2);
    await expect(page.locator('trix-toolbar')).toHaveCount(1);
    const disabledCode = page.locator('[name="FieldTestEntity[multipleChoiceField][0][disabledCode]"]');
    await expect(disabledCode).toBeDisabled();
    await expect(disabledCode).toHaveValue('Disabled source');
    await editCode(page, 'Dynamic code');
    await page.locator('trix-editor').fill('Dynamic rich text');
    await collection.locator('.ts-control').click();
    await page.locator('.ts-dropdown [data-value="b"]').click();
    await collection.getByRole('button', { name: 'Add a new item', exact: true }).click();
    await expect(page.locator('.CodeMirror')).toHaveCount(4);
    await expect(page.locator('trix-toolbar')).toHaveCount(2);
    const removedCode = await page.locator('[name="FieldTestEntity[multipleChoiceField][1][code]"]').elementHandle();
    await collection.getByRole('button', { name: 'Remove the item', exact: true }).last().click();
    await removedCode.evaluate((control) => {
        Object.defineProperty(control, 'value', {
            get() {
                return '';
            },
            set() {
                throw new Error('Removed CodeMirror backing control was updated after disposal');
            },
        });
    });
    await expect(page.locator('.CodeMirror')).toHaveCount(2);
    await expect(page.locator('trix-toolbar')).toHaveCount(1);
    await expect(page.locator('[data-ea-textarea-mirror]')).toHaveCount(1);
    await save(page);
    await expect.poll(() => new URL(page.url()).pathname).toBe('/admin/dynamic-widgets');
    const entries = Object.values(fixture().widgets[0].multipleValues);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
        title: 'Changed title',
        slug: 'changed-title',
        notes: notesText,
        code: 'Dynamic code',
        richText: '<div>Dynamic rich text</div>',
        choice: 'b',
    });
    expect(entries[0]).not.toHaveProperty('disabledCode');
    expect(errors).toEqual([]);
    expect(assetFailures).toEqual([]);
});

test('image links retain modifier and missing-content fallbacks while the viewer restores keyboard focus', async ({
    page,
}) => {
    await page.goto('/admin/field-display?ui=tailwind');
    await reloadEntry(page, 'field-image');
    await reloadEntry(page, 'field-image');
    const thumbnail = page.locator('.ea-lightbox-thumbnail').first();
    const imageUrl = new URL(await thumbnail.getAttribute('href'), page.url()).href;
    const popupPromise = page.context().waitForEvent('page');
    await thumbnail.click({ modifiers: ['Control'] });
    const popup = await popupPromise;
    await expect(popup).toHaveURL(imageUrl);
    await popup.close();
    await expect(page.locator('.basicLightbox')).toHaveCount(0);
    const originalSelector = await thumbnail.getAttribute('data-ea-lightbox-content-selector');
    await thumbnail.evaluate((link) => {
        link.dataset.eaLightboxContentSelector = '#missing-media-source';
    });
    const fallbackPromise = page.context().waitForEvent('page');
    await thumbnail.click();
    const fallback = await fallbackPromise;
    await expect(fallback).toHaveURL(imageUrl);
    await fallback.close();
    await thumbnail.evaluate((link, selector) => {
        link.dataset.eaLightboxContentSelector = selector;
    }, originalSelector);
    const originalOverflow = await page.locator('html').evaluate((html) => html.style.overflow);
    await thumbnail.click();
    const viewer = page.locator('.basicLightbox__placeholder');
    await expect(page.locator('.basicLightbox--visible')).toHaveCount(1);
    await expect(viewer).toBeFocused();
    await expect(viewer).toHaveAccessibleName(await thumbnail.locator('img').getAttribute('alt'));
    await page.keyboard.press('Tab');
    await expect(viewer).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('.basicLightbox')).toHaveCount(0);
    await expect(thumbnail).toBeFocused();
    expect(await page.locator('html').evaluate((html) => html.style.overflow)).toBe(originalOverflow);
    await page.getByRole('link', { name: /View code/ }).click();
    const dialog = page.locator('dialog[open]');
    await expect(dialog).toBeVisible();
    await thumbnail.evaluate((link) => {
        const nested = link.cloneNode(true);
        nested.dataset.testid = 'nested-image-link';
        document.querySelector('dialog[open] .modal-body').append(nested);
    });
    const nested = page.getByTestId('nested-image-link');
    await nested.click();
    await expect(dialog.locator('.basicLightbox--visible')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(page.locator('.basicLightbox')).toHaveCount(0);
    await expect(dialog).toBeVisible();
    await expect(nested).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
});

test('lazy autocomplete filters destroy replaced instances once and retain their real GET contract', async ({
    page,
}) => {
    await page.goto('/admin/widgets?ui=tailwind');
    await page.evaluate(() => {
        window.filterConnects = 0;
        window.filterDestroyCalls = 0;
        window.filterLoads = [];
        document.addEventListener('ea.autocomplete.connect', () => {
            window.filterConnects++;
        });
        document.addEventListener('ea.filters.loaded', (event) => {
            window.filterLoads.push({ connected: event.detail.body.isConnected, tag: event.detail.body.tagName });
        });
    });
    await page.locator('.action-filters-button').click();
    const filter = page.locator('[data-filter-property="manyToOneAssociation"]');
    const select = filter.locator('[data-ea-widget="ea-autocomplete"]');
    await expect(filter.locator('.ts-wrapper')).toHaveCount(1);
    await select.evaluate((input) => {
        window.firstFilterInput = input;
        const destroy = input.tomselect.destroy.bind(input.tomselect);
        input.tomselect.destroy = () => {
            window.filterDestroyCalls++;
            destroy();
        };
    });
    await filter.locator('[data-ea-toggle="collapse"]').click();
    await filter.locator('.ts-control').click();
    await filter.locator(`.ts-dropdown [data-value="${seeded.categories[1].id}"]`).click();
    await page.keyboard.press('Escape');
    await expect(page.locator('#modal-filters')).toBeHidden();
    expect(await page.evaluate(() => window.filterDestroyCalls)).toBe(0);
    await page.locator('.action-filters-button').click();
    await expect.poll(() => page.evaluate(() => window.filterConnects)).toBe(2);
    await expect(filter.locator('.ts-wrapper')).toHaveCount(1);
    expect(
        await page.evaluate(() => ({
            destroyed: window.filterDestroyCalls,
            attached: window.firstFilterInput.isConnected,
            hasInstance: !!window.firstFilterInput.tomselect,
            validationTarget: window.firstFilterInput.getAttribute('data-ea-validation-target'),
        }))
    ).toEqual({ destroyed: 1, attached: false, hasInstance: false, validationTarget: null });
    expect(await page.evaluate(() => window.filterLoads)).toEqual([
        { connected: true, tag: 'DIV' },
        { connected: true, tag: 'DIV' },
    ]);
    await filter.locator('[data-ea-toggle="collapse"]').click();
    await filter.locator('.ts-control').click();
    await filter.locator(`.ts-dropdown [data-value="${seeded.categories[0].id}"]`).click();
    const request = page.waitForRequest(
        (candidate) =>
            candidate.method() === 'GET' &&
            new URL(candidate.url()).searchParams.has('filters[manyToOneAssociation][value]')
    );
    await page.locator('#modal-apply-button').click();
    const parameters = new URL((await request).url()).searchParams;
    expect(parameters.get('filters[manyToOneAssociation][value]')).toBe(String(seeded.categories[0].id));
    await expect(page.locator(`tr[data-id="${seeded.widgets[0].id}"]`)).toBeVisible();
    expect(fixture().widgets[0].categoryId).toBe(seeded.widgets[0].categoryId);
});
