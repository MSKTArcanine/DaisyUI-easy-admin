const { test, expect } = require('@playwright/test');
const { fixture, login, save } = require('./helpers');

let seeded;

test.beforeEach(async ({ page }) => {
    seeded = fixture('seed');
    await login(page);
});

for (const ui of ['legacy', 'tailwind']) {
    test(`${ui}: confirmed external new/edit save preserves submitter, CSRF, method and persisted values`, async ({
        page,
    }) => {
        await page.goto(`/admin/confirmed-save/new?ui=${ui}`);
        await page.getByLabel('Name', { exact: true }).fill('Confirmed new');
        await page.getByLabel('Priority', { exact: true }).fill('19');
        await page.getByLabel('Description', { exact: true }).fill('Confirmed description');
        const posts = [];
        page.on('request', (request) => {
            if (request.method() === 'POST' && request.url().includes('/confirmed-save/')) posts.push(request);
        });
        await save(page);
        const dialog = page.locator('#modal-action-confirmation');
        await expect(dialog).toBeVisible();
        await expect(dialog).toHaveAccessibleName('Confirm fixture save');
        await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
        await expect(dialog).toBeHidden();
        expect(posts).toHaveLength(0);
        expect(fixture().categories).toHaveLength(seeded.categories.length);
        await save(page);
        await dialog.getByRole('button', { name: 'Save confirmed', exact: true }).click();
        await expect.poll(() => new URL(page.url()).pathname).toBe('/admin/confirmed-save');
        expect(posts).toHaveLength(1);
        const created = fixture().categories.find((category) => category.name === 'Confirmed new');
        expect(created).toMatchObject({ priority: 19, slug: 'confirmed-new', description: 'Confirmed description' });
        const body = new URLSearchParams(posts[0].postData());
        expect(body.get('Category[name]')).toBe('Confirmed new');
        expect(body.get('Category[_token]')).toBeTruthy();
        expect(body.get('ea[newForm][btn]')).toBe('saveAndReturn');
        await page.goto(`/admin/confirmed-save/${created.id}/edit`);
        await page.getByLabel('Name', { exact: true }).fill('Confirmed edited');
        await save(page, 'saveAndContinue');
        const editedResponse = page.waitForResponse(
            (response) =>
                response.request().method() === 'POST' &&
                new URL(response.url()).pathname === `/admin/confirmed-save/${created.id}/edit`
        );
        await page.locator('#modal-action-confirmation-button').click();
        await editedResponse;
        await expect(page).toHaveURL(new RegExp(`/admin/confirmed-save/${created.id}/edit`));
        expect(posts).toHaveLength(2);
        expect(new URLSearchParams(posts[1].postData()).get('ea[newForm][btn]')).toBe('saveAndContinue');
        expect(fixture().categories.find((category) => category.id === created.id).name).toBe('Confirmed edited');
    });

    test(`${ui}: confirmation closes before native validation and invalid values remain visible and unpersisted`, async ({
        page,
    }) => {
        await page.goto(`/admin/confirmed-save/${seeded.categories[0].id}/edit?ui=${ui}`);
        await page.getByLabel('Name', { exact: true }).fill('Initially valid');
        const posts = [];
        page.on('request', (request) => {
            if (request.method() === 'POST' && request.url().includes('/confirmed-save/')) posts.push(request);
        });
        await save(page);
        await expect(page.locator('#modal-action-confirmation')).toBeVisible();
        // external code can change the underlying form while its confirmation is open
        await page.getByLabel('Name', { exact: true }).evaluate((input) => {
            input.value = '';
        });
        await page.locator('#modal-action-confirmation-button').click();
        await expect(page.locator('#modal-action-confirmation')).toBeHidden();
        await expect(page.getByLabel('Name', { exact: true })).toBeFocused();
        await expect(page.getByLabel('Name', { exact: true })).toHaveAttribute('aria-invalid', 'true');
        const errorColor =
            ui === 'tailwind'
                ? await page.evaluate(() => {
                      const probe = document.createElement('span');
                      probe.style.color = 'var(--color-error)';
                      document.body.append(probe);
                      const color = getComputedStyle(probe).color;
                      probe.remove();
                      return color;
                  })
                : null;
        if (errorColor !== null) {
            await expect(page.getByLabel('Name', { exact: true })).toHaveCSS('border-top-color', errorColor);
        }
        expect(posts).toHaveLength(0);
        expect(fixture().categories[0].name).toBe('Category 1');
        await page.getByLabel('Name', { exact: true }).fill('Valid after confirmation');
        if (errorColor !== null) {
            await expect(page.getByLabel('Name', { exact: true })).not.toHaveAttribute('aria-invalid', 'true');
            await expect(page.getByLabel('Name', { exact: true })).not.toHaveCSS('border-top-color', errorColor);
        }
        await save(page);
        await page.locator('#modal-action-confirmation-button').click();
        await expect.poll(() => new URL(page.url()).pathname).toBe('/admin/confirmed-save');
        expect(posts).toHaveLength(1);
        expect(fixture().categories[0].name).toBe('Valid after confirmation');
    });

    test(`${ui}: canceled confirmed submit retains dirty protection and allows the same button to submit later`, async ({
        page,
    }) => {
        await page.goto(`/admin/confirmed-save/${seeded.categories[0].id}/edit?ui=${ui}`);
        await page.getByLabel('Name', { exact: true }).fill('Canceled confirmed change');
        await page.evaluate(() => {
            window.formSubmissions = [];
            document.addEventListener('ea.form.submit', (event) => {
                window.formSubmissions.push({
                    page: event.detail.page,
                    form: event.detail.form.name,
                    cancelable: event.cancelable,
                });
                if (window.formSubmissions.length === 1) event.preventDefault();
            });
        });
        await save(page);
        await page.locator('#modal-action-confirmation-button').click();
        await expect(page.locator('#modal-action-confirmation')).toBeHidden();
        await expect
            .poll(() => page.evaluate(() => window.formSubmissions))
            .toEqual([{ page: 'edit', form: 'Category', cancelable: true }]);
        expect(fixture().categories[0].name).toBe('Category 1');
        await expect(page.locator('[data-action-name="saveAndReturn"]')).toBeEnabled();
        const warning = page.waitForEvent('dialog');
        const navigation = page.getByRole('link', { name: /Categories$/ }).click();
        const beforeUnload = await warning;
        expect(beforeUnload.type()).toBe('beforeunload');
        await beforeUnload.dismiss();
        await navigation;
        await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Canceled confirmed change');
        await save(page);
        await page.locator('#modal-action-confirmation-button').click();
        await expect.poll(() => new URL(page.url()).pathname).toBe('/admin/confirmed-save');
        expect(fixture().categories[0].name).toBe('Canceled confirmed change');
    });

    test(`${ui}: unrelated form submissions preserve dirty state and client errors reveal every hidden ancestor`, async ({
        page,
    }) => {
        await page.goto(`/admin/layout/${seeded.layouts[0].id}/edit?ui=${ui}`);
        await page.getByRole('tab', { name: /Settings$/ }).click();
        const priority = page.getByLabel('Priority', { exact: true });
        const fieldset = page.locator('.form-fieldset').filter({ has: priority });
        await fieldset.locator('[data-ea-toggle="collapse"]').first().click();
        await priority.fill('');
        await fieldset.locator('[data-ea-toggle="collapse"]').first().click();
        await page.getByRole('tab', { name: /Basic Information$/ }).click();
        await page.evaluate(() => {
            const unrelated = document.createElement('form');
            document.body.append(unrelated);
            unrelated.addEventListener('submit', (event) => event.preventDefault());
            unrelated.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
            unrelated.remove();
        });
        await save(page);
        await expect(priority).toBeVisible();
        await expect(priority).toBeFocused();
        await expect(priority).toHaveAttribute('aria-invalid', 'true');
        await expect(page.getByRole('tab', { name: /Settings/ })).toHaveAttribute('aria-selected', 'true');
        await expect(fieldset.locator('[data-ea-toggle="collapse"]').first()).toHaveAttribute('aria-expanded', 'true');
        expect(fixture().layouts[0].priority).toBe(1);
        const warning = page.waitForEvent('dialog');
        const navigation = page.getByRole('link', { name: /Categories$/ }).click();
        await (await warning).dismiss();
        await navigation;
        await expect(priority).toBeVisible();
    });
}
