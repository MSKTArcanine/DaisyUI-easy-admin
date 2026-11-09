const { expect, test } = require('@playwright/test');
const { fixture, login } = require('./helpers');

let seeded;
test.beforeEach(async ({ page }) => {
    seeded = fixture('seed');
    await login(page);
    await page.goto('/admin/listings?ui=tailwind');
    await page.goto('/admin/listings');
    await expect.poll(() => page.evaluate(() => typeof window.EasyAdminApp?.init)).toBe('function');
    expect(await page.evaluate(() => typeof window.bootstrap)).toBe('undefined');
});

test('native listing preserves combined state through pagination and lazy filter application and reset', async ({
    page,
}) => {
    const state = new URLSearchParams({
        query: 'Category',
        'sort[priority]': 'DESC',
        'filters[active]': '1',
        page: '1',
        campaign: 'native',
    });
    await page.goto(`/admin/categories?${state}`);
    await expect(page.getByTestId('custom-name')).toHaveText(['Category 5', 'Category 3']);
    const next = page.getByRole('link', { name: /Next/ }).last();
    const nextUrl = new URL(await next.getAttribute('href'), page.url());
    expect(nextUrl.searchParams.get('campaign')).toBe('native');
    expect(nextUrl.searchParams.get('filters[active]')).toBe('1');
    expect(nextUrl.searchParams.get('query')).toBe('Category');
    expect(nextUrl.searchParams.get('sort[priority]')).toBe('DESC');
    await next.click();
    await expect(page.getByTestId('custom-name')).toHaveText(['Category 1']);
    await page.evaluate(() => {
        window.EasyAdminApp.init();
        window.EasyAdminApp.init();
    });
    const filterRequests = [];
    page.on('request', (request) => {
        if (request.url().includes('/render-filters')) filterRequests.push(request);
    });
    await page.locator('.action-filters-button').click();
    const active = page.locator('[data-filter-property="active"]');
    await expect(active.locator('[data-ea-collapse]')).toBeVisible();
    await active.locator('input[type="radio"][value="0"]').check();
    await page.locator('#modal-apply-button').click();
    await expect(page.getByTestId('custom-name')).toHaveText(['Category 6', 'Category 4']);
    for (const [name, value] of Object.entries({
        campaign: 'native',
        query: 'Category',
        'sort[priority]': 'DESC',
        'filters[active]': '0',
    })) {
        expect(new URL(page.url()).searchParams.get(name)).toBe(value);
    }
    await page.locator('.action-filters-button').click();
    await expect(page.locator('[data-ea-filters-form-id]')).toBeVisible();
    await page.locator('#modal-clear-button').click();
    await expect(page.getByTestId('custom-name')).toHaveText(['Category 6', 'Category 5']);
    expect(new URL(page.url()).searchParams.has('filters[active]')).toBe(false);
    expect(new URL(page.url()).searchParams.get('campaign')).toBe('native');
    expect(filterRequests).toHaveLength(2);
    expect(filterRequests.every((request) => request.method() === 'GET')).toBe(true);
});

test('native delete cancellation restores focus and confirmation consumes only the current protected action once', async ({
    page,
}) => {
    await page.goto('/admin/categories');
    const first = page.locator(`tr[data-id="${seeded.categories[0].id}"] [data-action-name="delete"]`);
    const second = page.locator(`tr[data-id="${seeded.categories[1].id}"] [data-action-name="delete"]`);
    const requests = [];
    page.on('request', (request) => {
        if (request.method() === 'POST' && /\/categories\/\d+\/delete/.test(request.url())) requests.push(request);
    });
    await first.click();
    await expect(page.locator('#modal-action-confirmation')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(first).toBeFocused();
    expect(requests).toHaveLength(0);
    expect(fixture().categories).toEqual(seeded.categories);
    await second.click();
    await page.locator('#modal-action-confirmation-button').evaluate((button) => {
        button.click();
        button.click();
    });
    await expect(page.locator(`tr[data-id="${seeded.categories[1].id}"]`)).toHaveCount(0);
    expect(requests).toHaveLength(1);
    expect(new URLSearchParams(requests[0].postData()).get('token')).toBeTruthy();
    expect(fixture().categories.map((item) => item.id)).toEqual(
        seeded.categories.filter((_, index) => index !== 1).map((item) => item.id)
    );
});

test('batch range selection, deselection, cancellation and exact protected payload persist their intended entities', async ({
    page,
}) => {
    const checkboxes = page.locator('input.form-batch-checkbox');
    await checkboxes.first().check();
    await checkboxes.nth(3).click({ modifiers: ['Shift'] });
    await expect(page.locator('input.form-batch-checkbox:checked')).toHaveCount(4);
    await expect(page.locator('tr.selected-row')).toHaveCount(4);
    await page.locator('.form-batch-checkbox-all').check();
    await page.locator('.form-batch-checkbox-all').uncheck();
    await expect(page.locator('input.form-batch-checkbox:checked')).toHaveCount(0);
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();
    const requests = [];
    page.on('request', (request) => {
        if (request.method() === 'POST' && request.url().includes('/batch-delete')) requests.push(request);
    });
    await page.locator('[data-action-name="batchDelete"]').click();
    await page.locator('#modal-batch-action').getByRole('button', { name: 'Cancel', exact: true }).click();
    expect(requests).toHaveLength(0);
    expect(fixture().categories).toEqual(seeded.categories);
    await expect(page.locator('input.form-batch-checkbox:checked')).toHaveCount(2);
    await page.locator('[data-action-name="batchDelete"]').click();
    await page.locator('#modal-batch-action-button').click();
    await expect(page.getByTestId('custom-name')).toHaveText(['Category 3', 'Category 4', 'Category 5', 'Category 6']);
    expect(requests).toHaveLength(1);
    const payload = new URLSearchParams(requests[0].postData());
    expect(payload.get('batchActionName')).toBe('batchDelete');
    expect(payload.get('batchActionCsrfToken')).toBeTruthy();
    expect(payload.get('entityFqcn')).toBe(
        'EasyCorp\\Bundle\\EasyAdminBundle\\Tests\\Functional\\Apps\\DefaultApp\\Entity\\Category'
    );
    expect(payload.get('batchActionUrl')).toContain('/admin/listings/batch-delete');
    expect([payload.get('batchActionEntityIds[0]'), payload.get('batchActionEntityIds[1]')]).toEqual(
        seeded.categories.slice(0, 2).map((item) => String(item.id))
    );
    expect(fixture().categories.map((item) => item.id)).toEqual(seeded.categories.slice(2).map((item) => item.id));
});

test('confirmed standalone form actions retain POST and a meaningful custom dialog name', async ({ page }) => {
    await page.locator('[data-action-name="export"]').click();
    const dialog = page.getByRole('dialog', { name: 'Export this listing?', exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('#action-confirmation-title')).toBeHidden();
    const response = page.waitForResponse((result) => result.url().endsWith('/listings/export'));
    await dialog.getByRole('button', { name: 'Confirm export', exact: true }).click();
    const result = await response;
    expect(result.request().method()).toBe('POST');
    expect(result.status()).toBe(200);
    await expect(page.locator('body')).toHaveText('Fixture export submitted');
    expect(fixture().categories).toEqual(seeded.categories);
});

for (const action of [
    {
        name: 'Confirmed group export',
        confirmation: 'Confirm group export',
        method: 'POST',
        path: '/listings/export',
        content: 'Fixture export submitted',
    },
    {
        name: 'Confirmed group visit',
        confirmation: 'Confirm visit',
        method: 'GET',
        path: '/listings/visit',
        content: 'Fixture GET action submitted',
    },
]) {
    test(`grouped confirmed ${action.method} actions preserve their form or link contract`, async ({ page }) => {
        const group = page.getByRole('button', { name: 'Grouped exports', exact: true });
        await group.focus();
        await page.keyboard.press('ArrowDown');
        const item = page.getByRole('menuitem', { name: action.name, exact: true });
        await item.click();
        await expect(page.locator('#modal-action-confirmation')).toBeVisible();
        const response = page.waitForResponse((result) => result.url().endsWith(action.path));
        await page.getByRole('button', { name: action.confirmation, exact: true }).click();
        const result = await response;
        expect(result.request().method()).toBe(action.method);
        expect(result.status()).toBe(200);
        await expect(page.locator('body')).toHaveText(action.content);
        expect(fixture().categories).toEqual(seeded.categories);
    });
}

test('row activation ignores selection and supports keyboard navigation to a collapsible detail with sanitized help', async ({
    page,
}) => {
    const row = page.locator(`tr[data-id="${seeded.categories[0].id}"]`);
    await row.locator('input.form-batch-checkbox').check();
    await row.getByTestId('custom-name').click();
    await expect(page).toHaveURL(/\/admin\/listings$/);
    await row.locator('input.form-batch-checkbox').uncheck();
    await row.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`/admin/listings/${seeded.categories[0].id}$`));
    const disclosure = page.getByRole('link', { name: 'Collapsed listing details', exact: true });
    await expect(disclosure).toHaveAttribute('aria-expanded', 'false');
    const pane = page.locator('[data-ea-collapse]');
    await expect(pane).toBeHidden();
    await disclosure.focus();
    await page.keyboard.press('Space');
    await expect(disclosure).toHaveAttribute('aria-expanded', 'true');
    await expect(pane).toBeVisible();
    await expect(page.getByTestId('custom-name')).toHaveText('Category 1');
    const help = page.locator('[data-ea-toggle="tooltip"]');
    await help.focus();
    const tooltip = page.getByRole('tooltip');
    await expect(tooltip.locator('strong')).toHaveText('Rich listing help');
    await expect(tooltip.locator('script,[onerror],[href^="javascript:"]')).toHaveCount(0);
    expect(await page.evaluate(() => window.listingUnsafe)).toBeUndefined();
    const description = await help.getAttribute('aria-describedby');
    expect(description).toBeTruthy();
    await page.keyboard.press('Escape');
    await expect(tooltip).toHaveCount(0);
    await expect(help).toBeFocused();
    await expect(help).not.toHaveAttribute('aria-describedby');
});

test('confirmation URL validation rejects executable schemes and retains allowed external destinations', async ({
    page,
}) => {
    await page.goto('/admin/categories');
    const action = page.locator(`tr[data-id="${seeded.categories[0].id}"] [data-action-name="delete"]`);
    await action.evaluate((element) => element.setAttribute('formaction', 'javascript:window.listingUnsafe=true'));
    const requests = [];
    page.on('request', (request) => {
        if (request.method() === 'POST') requests.push(request);
    });
    await action.click();
    await page.locator('#modal-action-confirmation-button').click();
    expect(requests).toHaveLength(0);
    expect(await page.evaluate(() => window.listingUnsafe)).toBeUndefined();
    expect(fixture().categories).toEqual(seeded.categories);

    await page.goto('/admin/listings');
    await page.getByRole('button', { name: 'Grouped exports', exact: true }).click();
    const visit = page.getByRole('menuitem', { name: 'Confirmed group visit', exact: true });
    await visit.evaluate((element) => element.setAttribute('href', 'http://127.0.0.1:8090/ui-preview'));
    await visit.click();
    await page.getByRole('button', { name: 'Confirm visit', exact: true }).click();
    await expect(page).toHaveURL('http://127.0.0.1:8090/ui-preview');
    await expect(page.getByRole('heading', { name: 'Rendering build fixture', exact: true })).toBeVisible();
});

test('mobile sorting and empty results keep their generated state and permission-dependent output', async ({
    page,
}) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/admin/listings?query=Category&campaign=mobile');
    await page.locator('[data-ea-target="#modal-sort"]').click();
    const dialog = page.locator('#modal-sort');
    await expect(dialog).toBeVisible();
    await dialog.locator('[data-column="priority"]').click();
    expect(new URL(page.url()).searchParams.get('campaign')).toBe('mobile');
    expect(new URL(page.url()).searchParams.get('query')).toBe('Category');
    expect(new URL(page.url()).searchParams.get('sort[priority]')).toBe('DESC');
    await expect(page.getByTestId('custom-name')).toHaveText(['Category 6', 'Category 5', 'Category 4', 'Category 3']);
    await expect(page.locator('[data-action-name="restricted"]')).toHaveCount(0);
    await page.getByRole('searchbox').fill('No matching fixture');
    await page.getByRole('searchbox').press('Enter');
    await expect(page.getByTestId('custom-name')).toHaveCount(0);
    await expect(page.locator('.datagrid')).toContainText('No results');
    expect(new URL(page.url()).searchParams.get('campaign')).toBe('mobile');
    expect(fixture().categories).toEqual(seeded.categories);
});

test('dynamic popovers retain sanitized HTML and descriptions and Escape closes them before mobile navigation', async ({
    page,
}) => {
    await page.evaluate(() => {
        const button = document.createElement('a');
        button.href = '#';
        button.setAttribute('role', 'button');
        button.id = 'listing-popover';
        button.textContent = 'Listing popover';
        button.dataset.eaToggle = 'popover';
        button.dataset.eaTrigger = 'click focus';
        button.dataset.eaHtml = 'true';
        button.dataset.eaContent =
            '<strong>Allowed popover</strong><img src="data:," onerror="window.listingUnsafe=true"><a href="javascript:window.listingUnsafe=true">Unsafe</a><a href="/admin/listings">Safe popover link</a>';
        button.setAttribute('aria-describedby', 'listing-existing-description');
        const description = document.createElement('span');
        description.id = 'listing-existing-description';
        description.textContent = 'Existing description';
        document.querySelector('.ea-sidebar-content').append(button, description);
        window.EasyAdminApp.init();
        window.EasyAdminApp.init();
    });
    await page.setViewportSize({ width: 390, height: 844 });
    const navigation = page.locator('#navigation-toggler');
    await navigation.click();
    const trigger = page.locator('#listing-popover');
    await trigger.click();
    const popup = page.getByRole('tooltip');
    await expect(popup.locator('strong')).toHaveText('Allowed popover');
    await expect
        .poll(async () => {
            const box = await popup.boundingBox();
            return box.x >= 0 && box.y >= 0 && box.x + box.width <= 390 && box.y + box.height <= 844;
        })
        .toBe(true);
    await expect
        .poll(() =>
            popup.evaluate((element) => {
                const box = element.getBoundingClientRect();
                return element.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
            })
        )
        .toBe(true);
    await expect(popup.locator('[onerror],[href^="javascript:"]')).toHaveCount(0);
    await expect(trigger).toHaveAttribute('aria-describedby', /listing-existing-description ea-overlay-/);
    expect(await page.evaluate(() => window.listingUnsafe)).toBeUndefined();
    await popup.getByRole('link', { name: 'Safe popover link', exact: true }).focus();
    await expect(popup.getByRole('link', { name: 'Safe popover link', exact: true })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(popup).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(navigation).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger).toHaveAttribute('aria-describedby', 'listing-existing-description');
    await page.keyboard.press('Escape');
    await expect(navigation).toHaveAttribute('aria-expanded', 'false');
    await expect(navigation).toBeFocused();
});

test('lazy filters follow legitimate same-origin redirects before initializing their controls', async ({ page }) => {
    await page.locator('.action-filters-button').evaluate((element) => {
        element.href = '/admin/listings/redirect-filters?filters[active]=1';
    });
    const redirected = page.waitForResponse((result) => result.url().includes('/redirect-filters'));
    await page.locator('.action-filters-button').click();
    expect((await redirected).status()).toBe(302);
    const filter = page.locator('[data-filter-property="active"]');
    await expect(filter.locator('input.filter-checkbox')).toBeChecked();
    await expect(filter.locator('[data-ea-collapse]')).toBeVisible();
    await expect(page.locator('#modal-apply-button')).toBeEnabled();
});

test('lazy filter validation responses remain editable and associate their errors', async ({ page }) => {
    const button = page.locator('.action-filters-button');
    await button.evaluate((element) => {
        const url = new URL(element.href);
        url.searchParams.set('filters[priority][comparison]', '=');
        url.searchParams.set('filters[priority][value]', 'invalid');
        element.href = url.href;
    });
    const response = page.waitForResponse((result) => result.url().includes('/render-filters'));
    await button.click();
    expect((await response).status()).toBe(422);
    const invalid = page.locator('[data-filter-property="priority"] input[aria-invalid="true"]');
    await expect(invalid).toBeVisible();
    const errors = await invalid.getAttribute('aria-describedby');
    expect(errors).toBeTruthy();
    await expect(page.locator(`[id="${errors}"]`)).toHaveAttribute('role', 'alert');
    await expect(page.locator(`[id="${errors}"]`)).not.toBeEmpty();
    await expect(page.locator('#modal-apply-button')).toBeEnabled();
    expect(fixture().categories).toEqual(seeded.categories);
});

test('dialog and collection removal dispose popovers and cancel delayed hidden tooltips', async ({ page }) => {
    await page.locator('.action-filters-button').click();
    await expect(page.locator('[data-ea-filters-form-id]')).toBeVisible();
    await page.evaluate(() => {
        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.id = 'dialog-popover';
        trigger.textContent = 'Dialog popover';
        trigger.dataset.eaToggle = 'popover';
        trigger.dataset.eaContent = 'Native dialog content';
        trigger.dataset.eaContainer = 'body';
        document.querySelector('#modal-filters .modal-body').append(trigger);
        window.EasyAdminApp.init();
    });
    await page.locator('#dialog-popover').click();
    await expect(page.locator('#modal-filters [data-ea-overlay]')).toHaveText('Native dialog content');
    await page.locator('#modal-filters').click({ position: { x: 2, y: 2 } });
    await expect(page.locator('[data-ea-overlay]')).toHaveCount(0);

    await page.locator('.action-filters-button').click();
    await expect(page.locator('[data-ea-filters-form-id]')).toBeVisible();
    await page.clock.install();
    await page.evaluate(() => {
        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.id = 'delayed-dialog-tooltip';
        trigger.textContent = 'Delayed tooltip';
        trigger.dataset.eaToggle = 'tooltip';
        trigger.dataset.eaTitle = 'Delayed content';
        trigger.dataset.eaDelay = '100';
        document.querySelector('#modal-filters .modal-body').append(trigger);
        window.EasyAdminApp.init();
    });
    await page.locator('#delayed-dialog-tooltip').dispatchEvent('pointerover', { pointerType: 'mouse' });
    await page.keyboard.press('Escape');
    await page.clock.runFor(150);
    await expect(page.locator('#modal-filters')).toBeHidden();
    await expect(page.locator('[data-ea-overlay]')).toHaveCount(0);
    await page.evaluate(() => {
        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.id = 'removed-collection-popup';
        trigger.textContent = 'Collection popup';
        trigger.setAttribute('data-bs-toggle', 'popover');
        trigger.setAttribute('data-bs-content', 'Removed content');
        document.querySelector('.content-body').append(trigger);
        document.dispatchEvent(
            new CustomEvent('ea.collection.item-added', {
                detail: { newElement: trigger, collection: trigger.parentElement },
            })
        );
        trigger.addEventListener('ea.popover.hide', (event) => event.preventDefault());
    });
    await page.locator('#removed-collection-popup').click();
    await expect(page.locator('[data-ea-overlay]')).toHaveCount(1);
    await page.evaluate(() => {
        const item = document.querySelector('#removed-collection-popup');
        item.remove();
        document.dispatchEvent(
            new CustomEvent('ea.collection.item-removed', {
                detail: { deletedElement: item, collection: document.querySelector('.content-body') },
            })
        );
    });
    await expect(page.locator('[data-ea-overlay]')).toHaveCount(0);
});
