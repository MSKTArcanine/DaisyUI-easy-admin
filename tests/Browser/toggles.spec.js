const { test, expect } = require('@playwright/test');
const { fixture, login } = require('./helpers');

let seeded;

test.beforeEach(async ({ page }) => {
    seeded = fixture('seed');
    await login(page);
});

test('reloading a boolean entry keeps one PATCH with original CSRF, field and XHR contracts', async ({ page }) => {
    await page.goto('/admin/toggles?ui=tailwind');
    await page.evaluate(
        () =>
            new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = [...document.scripts].find((entry) => entry.src.includes('/field-boolean.')).src;
                script.onload = resolve;
                script.onerror = reject;
                document.head.append(script);
            })
    );
    const toggle = page.locator(`tr[data-id="${seeded.categories[0].id}"] input[data-toggle-url]`);
    const requests = [];
    page.on('request', (request) => {
        if (request.method() === 'PATCH') requests.push(request);
    });
    const response = page.waitForResponse((result) => result.request().method() === 'PATCH');
    await toggle.uncheck();
    expect((await response).status()).toBe(200);
    await expect(toggle).toBeEnabled();
    expect(requests).toHaveLength(1);
    const url = new URL(requests[0].url());
    expect(url.searchParams.get('newValue')).toBe('false');
    expect(url.searchParams.get('fieldName')).toBe('active');
    expect(url.searchParams.get('csrfToken')).toBeTruthy();
    expect(requests[0].headers()['x-requested-with']).toBe('XMLHttpRequest');
    expect(fixture().categories[0].active).toBe(false);
});

test('a real invalid-CSRF toggle rolls back, disables its control and leaves persisted state unchanged', async ({
    page,
}) => {
    await page.goto('/admin/toggles?ui=tailwind');
    const toggle = page.locator(`tr[data-id="${seeded.categories[0].id}"] input[data-toggle-url]`);
    await toggle.evaluate((input) => {
        const url = new URL(input.dataset.toggleUrl);
        url.searchParams.set('csrfToken', 'forged');
        input.dataset.toggleUrl = url.toString();
    });
    const response = page.waitForResponse((result) => result.request().method() === 'PATCH');
    await toggle.click();
    expect([302, 401, 403]).toContain((await response).status());
    await expect(toggle).toBeChecked();
    await expect(toggle).toBeDisabled();
    expect(fixture().categories[0].active).toBe(true);
});

test('a network failure restores the prior toggle state without changing the database', async ({ page }) => {
    await page.goto('/admin/toggles?ui=tailwind');
    await page.route('**/toggles/**', (route) =>
        route.request().method() === 'PATCH' ? route.abort('failed') : route.continue()
    );
    const toggle = page.locator(`tr[data-id="${seeded.categories[0].id}"] input[data-toggle-url]`);
    await toggle.click();
    await expect(toggle).toBeChecked();
    await expect(toggle).toBeDisabled();
    expect(fixture().categories[0].active).toBe(true);
});

test('configured disabled toggles ignore synthetic change events and send no request', async ({ page }) => {
    await page.goto('/admin/toggles?ui=tailwind&disabled=1');
    const toggle = page.locator(`tr[data-id="${seeded.categories[0].id}"] input[data-toggle-url]`);
    const requests = [];
    page.on('request', (request) => {
        if (request.method() === 'PATCH') requests.push(request);
    });
    await expect(toggle).toBeDisabled();
    await toggle.evaluate((input) => {
        input.checked = false;
        input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await expect(toggle).toBeChecked();
    expect(requests).toHaveLength(0);
    expect(fixture().categories[0].active).toBe(true);
});
