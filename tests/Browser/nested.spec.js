const { test, expect } = require('@playwright/test');
const { fixture, login, save } = require('./helpers');

let seeded;

test.beforeEach(async ({ page }) => {
    seeded = fixture('seed');
    await login(page);
});

test('nested collections preserve identical placeholders, unique indices and real persisted child values', async ({
    page,
}) => {
    await page.goto(`/admin/nested/${seeded.widgets[0].id}/edit`);
    const groups = page.getByTestId('nested-groups');
    await groups.getByRole('button', { name: 'Add a new item', exact: true }).last().click();
    const title = page.locator('[name="FieldTestEntity[arrayField][1][title]"]');
    await expect(title).toBeVisible();
    await title.fill('Group 2');
    await expect(groups.locator('.caller-group').nth(1)).toHaveAttribute('data-group-row', '<Group "1">');
    const children = page.getByTestId('nested-children').nth(1);
    await children.getByRole('button', { name: 'Add a new item', exact: true }).click();
    const child = children.locator('input:not([type="hidden"])').first();
    await expect(child).toHaveAttribute('name', 'FieldTestEntity[arrayField][1][items][0]');
    await child.fill('Child 2');
    await expect(children.locator('.caller-entry').first()).toHaveAttribute('data-entry-label', 'Child "0" <value>');
    await expect(children.locator('value')).toHaveCount(0);
    await children.getByRole('button', { name: 'Add a new item', exact: true }).click();
    await expect(children.locator('input:not([type="hidden"])').nth(1)).toHaveAttribute(
        'name',
        'FieldTestEntity[arrayField][1][items][1]'
    );
    await children.locator('input:not([type="hidden"])').nth(1).fill('Child 3');
    await children.getByRole('button', { name: 'Remove the item', exact: true }).first().click();
    await children.getByRole('button', { name: 'Add a new item', exact: true }).click();
    await children.locator('input:not([type="hidden"])').nth(1).fill('Child 4');
    expect(
        await children.locator('input:not([type="hidden"])').evaluateAll((inputs) => inputs.map((input) => input.name))
    ).toEqual(['FieldTestEntity[arrayField][1][items][1]', 'FieldTestEntity[arrayField][1][items][2]']);
    const ids = await groups.locator('input').evaluateAll((inputs) => inputs.map((input) => input.id));
    expect(ids.every((id) => !id.includes('__name__'))).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
    await save(page);
    await expect.poll(() => new URL(page.url()).pathname).toBe('/admin/nested');
    const values = Object.values(fixture().widgets[0].groups);
    expect(values.map((group) => group.title)).toEqual(['Group 1', 'Group 2']);
    expect(Object.values(values[0].items)).toEqual(['Child 1']);
    expect(Object.values(values[1].items)).toEqual(['Child 3', 'Child 4']);
});

test('repeated collection initialization executes one prototype script and one lifecycle event per addition', async ({
    page,
}) => {
    await page.goto(`/admin/nested/${seeded.widgets[0].id}/edit?csp=1`);
    const groups = page.getByTestId('nested-groups');
    const nonce = await page
        .locator('script[nonce]')
        .first()
        .evaluate((script) => script.nonce);
    await groups.evaluate((collection, nonce) => {
        window.prototypeRuns = 0;
        window.collectionEvents = [];
        collection.dataset.prototype = collection.dataset.prototype
            .replace(
                'class="field-collection-item',
                'data-fixture-index="__name__" title="Entry __name__" class="field-collection-item'
            )
            .replace(
                '</div>',
                `<script nonce="${nonce}">window.prototypeRuns += 1; window.prototypeIndex = '__name__';</script></div>`
            );
        document.addEventListener('ea.collection.item-added', (event) => {
            window.collectionEvents.push({
                name: event.detail.newElement.querySelector('input').name,
                collection: event.detail.collection.dataset.testid,
                attached: event.detail.newElement.isConnected,
                expanded: event.detail.newElement.querySelector('[aria-expanded]').getAttribute('aria-expanded'),
                nonce: event.detail.newElement.querySelector('script').nonce,
            });
        });
    }, nonce);
    await page.evaluate(
        () =>
            new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = [...document.scripts].find((entry) => entry.src.includes('/field-collection.')).src;
                script.onload = resolve;
                script.onerror = reject;
                document.head.append(script);
            })
    );
    await groups.getByRole('button', { name: 'Add a new item', exact: true }).last().click();
    await expect(page.locator('[name="FieldTestEntity[arrayField][1][title]"]')).toBeVisible();
    expect(await page.evaluate(() => window.prototypeRuns)).toBe(1);
    expect(await page.evaluate(() => window.prototypeIndex)).toBe('1');
    await expect(groups.locator('[data-fixture-index]')).toHaveAttribute('data-fixture-index', '1');
    await expect(groups.locator('[data-fixture-index]')).toHaveAttribute('title', 'Entry 1');
    expect(await page.evaluate(() => window.collectionEvents)).toEqual([
        {
            name: 'FieldTestEntity[arrayField][1][title]',
            collection: 'nested-groups',
            attached: true,
            expanded: 'true',
            nonce,
        },
    ]);
});

test('client and server errors reveal every collapsed collection ancestor and preserve persisted values', async ({
    page,
}) => {
    await page.goto(`/admin/nested/${seeded.widgets[0].id}/edit`);
    const groups = page.getByTestId('nested-groups');
    await groups.getByRole('button', { name: 'Group 1', exact: true }).click();
    const children = page.getByTestId('nested-children');
    const child = children.locator('input:not([type="hidden"])');
    if (!(await child.isVisible())) {
        await children.getByRole('button', { name: 'Child 1', exact: true }).click();
    }
    await child.fill('');
    await children.getByRole('button', { name: 'Child 1', exact: true }).click();
    await groups.getByRole('button', { name: 'Group 1', exact: true }).click();
    await expect(child).toBeHidden();
    await page.evaluate(() => {
        window.formErrors = 0;
        document.addEventListener('ea.form.error', () => window.formErrors++);
    });
    await save(page);
    await expect(child).toBeVisible();
    await expect(child).toBeFocused();
    expect(await page.evaluate(() => window.formErrors)).toBe(1);
    const response = page.waitForResponse(
        (candidate) => candidate.request().method() === 'POST' && candidate.url().includes('/nested/')
    );
    await page.locator('form[name="FieldTestEntity"]').evaluate((form) => {
        form.noValidate = true;
        form.requestSubmit([...form.elements].find((element) => element.type === 'submit'));
    });
    expect((await response).status()).toBe(422);
    await expect(page.getByTestId('nested-children').locator('input:not([type="hidden"])')).toBeVisible();
    await expect(page.getByRole('alert').filter({ hasText: 'This value should not be blank.' })).toBeVisible();
    expect(Object.values(fixture().widgets[0].groups)[0].items).toEqual(['Child 1']);
});

test('parent collection permissions do not disable independently configured nested additions', async ({ page }) => {
    await page.goto(`/admin/nested/${seeded.widgets[0].id}/edit?locked=1`);
    const groups = page.getByTestId('nested-groups');
    await expect(groups).toHaveAttribute('data-allow-add', 'false');
    await expect(groups).toHaveAttribute('data-allow-delete', 'false');
    expect(
        await groups.evaluate(
            (collection) =>
                [...collection.querySelectorAll('.field-collection-add-button,.field-collection-delete-button')].filter(
                    (button) => button.closest('[data-ea-collection-field]') === collection
                ).length
        )
    ).toBe(0);
    await groups.getByRole('button', { name: 'Group 1', exact: true }).click();
    const children = page.getByTestId('nested-children');
    await children.getByRole('button', { name: 'Add a new item', exact: true }).click();
    await children.locator('[name="FieldTestEntity[arrayField][0][items][1]"]').fill('Permitted child');
    await save(page);
    await expect.poll(() => new URL(page.url()).pathname).toBe('/admin/nested');
    const values = Object.values(fixture().widgets[0].groups);
    expect(values).toHaveLength(1);
    expect(Object.values(values[0].items)).toEqual(['Child 1', 'Permitted child']);
});
