const { test, expect } = require('@playwright/test');
const { fixture, login, save, captureReference } = require('./helpers');

let seeded;

test.beforeEach(async ({ page }) => {
    seeded = fixture('seed');
    await login(page);
});

test('index and detail render deterministic data and custom field templates', async ({ page }) => {
    await page.goto('/admin/categories');
    await expect(page.getByTestId('custom-name')).toHaveText(['Category 1', 'Category 2']);
    await page.locator(`tr[data-id='${seeded.categories[0].id}'] [data-action-name='detail']`).click();
    await expect(page).toHaveURL(new RegExp(`/admin/categories/${seeded.categories[0].id}$`));
    await expect(page.getByTestId('custom-name')).toHaveText('Category 1');
    await expect(page.getByTestId('uppercase-field')).toHaveText('DESCRIPTION 1');
    await expect(page.locator('body')).not.toContainText('Restricted Value');
});

test('new and edit submit real external buttons and preserve request and database values', async ({ page }) => {
    await page.goto('/admin/categories/new');
    await expect(page.getByTestId('custom-name-widget')).toBeVisible();
    await page.getByLabel('Name', { exact: true }).fill('Created category');
    await expect(page.getByLabel('Slug', { exact: true })).toHaveValue('created-category');
    await page.getByLabel('Priority', { exact: true }).fill('42');
    await page.getByLabel('Description', { exact: true }).fill('Created description');
    const createRequest = page.waitForRequest(
        (request) => request.method() === 'POST' && request.url().includes('/categories/new')
    );
    await save(page);
    const submitted = new URLSearchParams((await createRequest).postData());
    expect(submitted.get('Category[name]')).toBe('Created category');
    expect(submitted.get('ea[newForm][btn]')).toBe('saveAndReturn');
    expect(submitted.get('Category[_token]')).toBeTruthy();
    await expect(page).toHaveURL(/\/admin\/categories$/);
    const created = fixture().categories.find((category) => category.name === 'Created category');
    expect(created).toMatchObject({ slug: 'created-category', description: 'Created description', priority: 42 });

    await page.goto(`/admin/categories/${created.id}/edit`);
    await page.getByLabel('Name', { exact: true }).fill('Edited category');
    await page.getByLabel('Priority', { exact: true }).fill('43');
    await save(page, 'saveAndContinue');
    await expect(page).toHaveURL(new RegExp(`/admin/categories/${created.id}/edit`));
    expect(fixture().categories.find((category) => category.id === created.id)).toMatchObject({
        name: 'Edited category',
        priority: 43,
    });
});

test('server validation retains entered values and does not persist an invalid new form', async ({ page }) => {
    await page.goto('/admin/categories/new');
    await page.getByLabel('Name', { exact: true }).fill('');
    await page.getByLabel('Priority', { exact: true }).fill('77');
    await page.getByLabel('Description', { exact: true }).fill('Retained invalid description');
    await page.locator('form[name="Category"]').evaluate((form) => {
        form.noValidate = true;
    });
    await page.getByLabel('Slug', { exact: true }).evaluate((input) => {
        input.value = 'invalid-category';
    });
    const response = page.waitForResponse(
        (candidate) => candidate.request().method() === 'POST' && candidate.url().includes('/categories/new')
    );
    await save(page);
    expect((await response).status()).toBe(422);
    await expect(page.getByLabel('Description', { exact: true })).toHaveValue('Retained invalid description');
    await expect(page.getByLabel('Priority', { exact: true })).toHaveValue('77');
    await expect(page.locator('body')).toContainText('This value should not be blank.');
    await captureReference(page, 'new-invalid-desktop-light');
    expect(fixture().categories).toHaveLength(seeded.categories.length);
});

test('search sorting pagination and filters preserve their combined request state', async ({ page }) => {
    const query = new URLSearchParams({
        query: 'Category',
        'sort[priority]': 'DESC',
        'filters[active]': '1',
        page: '1',
        campaign: 'baseline',
    });
    await page.goto(`/admin/categories?${query}`);
    await expect(page.getByTestId('custom-name')).toHaveText(['Category 5', 'Category 3']);
    const next = page.getByRole('link', { name: /Next/ }).last();
    const nextUrl = new URL(await next.getAttribute('href'), page.url());
    expect(nextUrl.searchParams.get('query')).toBe('Category');
    expect(nextUrl.searchParams.get('sort[priority]')).toBe('DESC');
    expect(nextUrl.searchParams.get('filters[active]')).toBe('1');
    expect(nextUrl.searchParams.get('campaign')).toBe('baseline');
    await next.click();
    await expect(page.getByTestId('custom-name')).toHaveText(['Category 1']);
    await expect(page.getByRole('searchbox')).toHaveValue('Category');

    await page.locator('.action-filters-button').click();
    await expect(page.locator('[data-ea-filters-form-id]')).toBeVisible();
    await captureReference(page, 'index-filters-desktop-light');
    const activeFilter = page.locator('[data-filter-property="active"]');
    await activeFilter.locator('input[type="radio"][value="0"]').check();
    await page.locator('#modal-apply-button').click();
    await expect(page.getByTestId('custom-name')).toHaveText(['Category 6', 'Category 4']);
    expect(new URL(page.url()).searchParams.get('filters[active]')).toBe('0');
    expect(new URL(page.url()).searchParams.get('campaign')).toBe('baseline');
    expect(new URL(page.url()).searchParams.get('query')).toBe('Category');
    expect(new URL(page.url()).searchParams.get('sort[priority]')).toBe('DESC');
    await page.locator('.action-filters-button').click();
    await expect(page.locator('[data-ea-filters-form-id]')).toBeVisible();
    await page.locator('#modal-clear-button').click();
    await expect(page).toHaveURL(/campaign=baseline/);
    expect(new URL(page.url()).searchParams.has('filters[active]')).toBe(false);
    expect(new URL(page.url()).searchParams.get('query')).toBe('Category');
    expect(new URL(page.url()).searchParams.get('sort[priority]')).toBe('DESC');
    await expect(page.getByTestId('custom-name')).toHaveText(['Category 6', 'Category 5']);
});

test('delete cancellation sends no request and confirmation deletes only its current entity once', async ({ page }) => {
    await page.goto('/admin/categories');
    const deletedRequests = [];
    page.on('request', (request) => {
        if (request.method() === 'POST' && /\/categories\/\d+\/delete/.test(request.url()))
            deletedRequests.push(request);
    });
    const first = seeded.categories[0];
    const second = seeded.categories[1];
    await page.locator(`tr[data-id='${first.id}'] [data-action-name='delete']`).click();
    await expect(page.locator('#modal-action-confirmation')).toBeVisible();
    await captureReference(page, 'delete-confirmation-desktop-light');
    await page.locator('#modal-action-confirmation').getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.locator('#modal-action-confirmation')).toBeHidden();
    expect(deletedRequests).toHaveLength(0);
    expect(fixture().categories.some((category) => category.id === first.id)).toBe(true);
    await page.locator(`tr[data-id='${second.id}'] [data-action-name='delete']`).click();
    await page.locator('#modal-action-confirmation-button').click();
    await expect(page.locator(`tr[data-id='${second.id}']`)).toHaveCount(0);
    expect(deletedRequests).toHaveLength(1);
    expect(new URLSearchParams(deletedRequests[0].postData()).get('token')).toBeTruthy();
    const remaining = fixture().categories;
    expect(remaining.some((category) => category.id === first.id)).toBe(true);
    expect(remaining.some((category) => category.id === second.id)).toBe(false);
});

test('batch cancellation and confirmation preserve selection and exact protected POST payload', async ({ page }) => {
    await page.goto('/admin/categories');
    const selected = seeded.categories.slice(0, 2);
    for (const category of selected)
        await page.locator(`tr[data-id='${category.id}'] input[type='checkbox']`).first().check();
    const batches = [];
    page.on('request', (request) => {
        if (request.method() === 'POST' && request.url().includes('/batch-delete')) batches.push(request);
    });
    await page.locator('[data-action-name="batchDelete"]').click();
    await captureReference(page, 'batch-confirmation-desktop-light');
    await page.locator('#modal-batch-action').getByRole('button', { name: 'Cancel', exact: true }).click();
    expect(batches).toHaveLength(0);
    expect(fixture().categories).toHaveLength(seeded.categories.length);
    await page.locator('[data-action-name="batchDelete"]').click();
    await page.locator('#modal-batch-action-button').click();
    await expect(page.getByTestId('custom-name')).toHaveText(['Category 3', 'Category 4']);
    expect(batches).toHaveLength(1);
    const body = new URLSearchParams(batches[0].postData());
    expect(body.get('batchActionName')).toBe('batchDelete');
    expect(body.get('entityFqcn')).toBe(
        'EasyCorp\\Bundle\\EasyAdminBundle\\Tests\\Functional\\Apps\\DefaultApp\\Entity\\Category'
    );
    expect(body.get('batchActionCsrfToken')).toBeTruthy();
    expect(body.get('batchActionUrl')).toContain('/admin/categories/batch-delete');
    expect([body.get('batchActionEntityIds[0]'), body.get('batchActionEntityIds[1]')]).toEqual(
        selected.map((category) => String(category.id))
    );
    expect(fixture().categories.map((category) => category.id)).toEqual(
        seeded.categories.slice(2).map((category) => category.id)
    );
});

test('boolean toggle sends PATCH and persists its value', async ({ page }) => {
    await page.goto('/admin/categories');
    const category = seeded.categories[0];
    const toggle = page.locator(`tr[data-id='${category.id}'] input[data-toggle-url]`);
    await expect(toggle).toBeChecked();
    const response = page.waitForResponse((candidate) => candidate.request().method() === 'PATCH');
    await toggle.uncheck();
    const result = await response;
    expect(result.ok()).toBe(true);
    expect(result.request().headers()['x-requested-with']).toBe('XMLHttpRequest');
    expect(new URL(result.url()).searchParams.get('newValue')).toBe('false');
    expect(fixture().categories.find((item) => item.id === category.id).active).toBe(false);
});

test('permission-protected actions stay hidden and direct requests are denied', async ({ page, request }) => {
    await page.goto('/admin/categories');
    await expect(page.locator('[data-action-name="restricted"]')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Restricted navigation' })).toHaveCount(0);
    const denied = await page.request.get('/admin/categories/restricted');
    expect(denied.status()).toBe(403);
    const anonymous = await request.get('/admin/categories', { maxRedirects: 0 });
    expect(anonymous.status()).toBe(302);
    expect(anonymous.headers().location).toContain('/login');
    expect(fixture().categories).toEqual(seeded.categories);
});

test('custom form action uses POST and its configured target', async ({ page }) => {
    await page.goto('/admin/categories');
    const response = page.waitForResponse((candidate) => candidate.url().includes('/categories/export'));
    await page.locator('[data-action-name="export"]').click();
    const result = await response;
    expect(result.request().method()).toBe('POST');
    expect(result.status()).toBe(200);
    await expect(page.locator('body')).toHaveText('Fixture export submitted');
});

test('login rejects invalid credentials and accepts a protected form submission', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/login');
    await captureReference(page, 'login-minimal-desktop-light');
    await page.locator('#username').fill('admin');
    await page.locator('#password').fill('wrong-password');
    const failedRequest = page.waitForRequest(
        (request) => request.method() === 'POST' && request.url().endsWith('/login')
    );
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    const parameters = new URLSearchParams((await failedRequest).postData());
    expect(parameters.get('_username')).toBe('admin');
    expect(parameters.get('_password')).toBe('wrong-password');
    expect(parameters.get('_csrf_token')).toBeTruthy();
    await expect(page.locator('body')).toContainText('Invalid credentials.');
    await expect(page.locator('#username')).toHaveValue('admin');
    await page.locator('#password').fill('browser-password');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByTestId('dashboard-content')).toBeVisible();
    expect(fixture().categories).toEqual(seeded.categories);
});
