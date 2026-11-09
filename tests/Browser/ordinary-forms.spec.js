const { test, expect } = require('@playwright/test');

test('ordinary Symfony widgets retain names, attributes, multipart PATCH, CSRF and typed submitted values', async ({
    page,
}) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/ordinary-form');
    const form = page.locator('form[data-testid="ordinary-form"]');
    await expect(form).toHaveAttribute('method', 'post');
    await expect(form).toHaveAttribute('action', '/ordinary-form');
    await expect(form).toHaveAttribute('enctype', 'multipart/form-data');
    await expect(form.locator('[name="_method"]')).toHaveValue('PATCH');
    await expect(form.locator('[name="ordinary[_token]"]')).not.toHaveValue('');
    await expect(page.getByLabel('Name', { exact: true })).toHaveAttribute('data-quoted', 'A "quoted" <value>');
    await expect(page.getByLabel('Name', { exact: true })).toHaveAttribute(
        'aria-describedby',
        /ordinary-hint.*ordinary_name_help/
    );
    await expect(form.locator('[data-row="retained"]')).toHaveCount(1);
    await expect(form.locator('[data-label="retained"]')).toHaveCount(1);
    await expect(page.locator('#ordinary_name_help')).toHaveText('<em>Escaped help</em>');
    await expect(page.locator('#ordinary_name_help em')).toHaveCount(0);
    await expect(page.locator('#ordinary_notes_help em')).toHaveText('HTML help');
    await expect(page.locator('label[for="ordinary_notes"] strong')).toHaveText('Notes');
    await expect(page.getByLabel('Disabled', { exact: true })).toBeDisabled();
    await expect(page.getByLabel('Readonly', { exact: true })).toHaveAttribute('readonly');
    await expect(page.getByTestId('standalone-money')).toContainText('$');
    await expect(page.locator('#ordinary_standaloneMoney')).toHaveValue('3.50');
    await page.getByLabel('Name', { exact: true }).fill('Submitted name');
    await page.getByLabel('Notes', { exact: true }).fill('Submitted notes');
    await page.getByLabel('Flavor', { exact: true }).selectOption('b');
    await page.locator('#ordinary_mode_1').check();
    await page.locator('#ordinary_flags_0').uncheck();
    await page.locator('#ordinary_flags_1').check();
    await page.getByLabel('Agreed', { exact: true }).uncheck();
    await page.getByLabel('Amount', { exact: true }).fill('19.75');
    await page.getByLabel('Money', { exact: true }).fill('31.50');
    await page.getByLabel('Percent', { exact: true }).fill('40');
    await page.getByLabel('Date', { exact: true }).fill('2027-04-05');
    await page.locator('#ordinary_compoundDate_year').selectOption('2027');
    await page.locator('#ordinary_compoundDate_month').selectOption('4');
    await page.locator('#ordinary_compoundDate_day').selectOption('5');
    await page.locator('#ordinary_time_hour').selectOption('14');
    await page.locator('#ordinary_time_minute').selectOption('45');
    await page.getByLabel('Datetime', { exact: true }).fill('2027-06-07T14:45');
    await page.locator('#ordinary_interval_days').fill('3');
    await page.getByLabel('Password', { exact: true }).fill('A repeated value');
    await page.getByLabel('Repeat password', { exact: true }).fill('A repeated value');
    await page.getByLabel('File', { exact: true }).setInputFiles({
        name: 'ordinary.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Ordinary multipart bytes\n'),
    });
    const responsePromise = page.waitForResponse(
        (response) => response.url().endsWith('/ordinary-form') && response.request().method() === 'POST'
    );
    await page.getByRole('button', { name: 'Submit ordinary form', exact: true }).click();
    const response = await responsePromise;
    expect(response.status()).toBe(200);
    expect(response.request().headers()['content-type']).toContain('multipart/form-data; boundary=');
    const result = await response.json();
    expect(result.request_fields._method).toBe('PATCH');
    expect(result.request_fields.ordinary.submit).toBe('');
    expect(result.request_fields.ordinary._token).toBeTruthy();
    expect(result.request_fields.ordinary).not.toHaveProperty('disabled');
    expect(result.request_fields.ordinary).not.toHaveProperty('agreed');
    expect(result).toMatchObject({
        method: 'PATCH',
        submitter: '',
        values: {
            name: 'Submitted name',
            notes: 'Submitted notes',
            flavor: 'b',
            mode: 'b',
            flags: ['b'],
            agreed: true,
            disabled: 'Disabled value',
            readonly: 'Readonly value',
            amount: 19.75,
            money: 31.5,
            percent: 0.4,
            date: '2027-04-05T00:00:00',
            compoundDate: '2027-04-05T00:00:00',
            time: '1970-01-01T14:45:00',
            datetime: '2027-06-07T14:45:00',
            interval: '0-0-3',
            password: 'A repeated value',
            hidden: 'Hidden value',
            file: { name: 'ordinary.txt', contents: 'Ordinary multipart bytes\n' },
            color: '#15803d',
            range: '25',
        },
    });
    expect(errors).toEqual([]);
});

test('ordinary invalid forms retain values and associate escaped help and server errors without an admin context', async ({
    page,
}) => {
    await page.goto('/ordinary-form');
    await page.getByLabel('Name', { exact: true }).fill('');
    await page.getByLabel('Notes', { exact: true }).fill('Retained invalid notes');
    await page.getByLabel('Flavor', { exact: true }).selectOption('b');
    const response = page.waitForResponse(
        (candidate) => candidate.url().endsWith('/ordinary-form') && candidate.status() === 422
    );
    await page.locator('form[data-testid="ordinary-form"]').evaluate((form) => {
        form.noValidate = true;
        form.requestSubmit(form.querySelector('[type="submit"]'));
    });
    await response;
    await expect(page.getByLabel('Name', { exact: true })).toHaveValue('');
    await expect(page.getByLabel('Notes', { exact: true })).toHaveValue('Retained invalid notes');
    await expect(page.getByLabel('Flavor', { exact: true })).toHaveValue('b');
    await expect(page.getByLabel('Name', { exact: true })).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByLabel('Name', { exact: true })).toHaveAttribute('aria-describedby', /ordinary_name_errors/);
    await expect(page.locator('#ordinary_name_errors')).toHaveAttribute('role', 'alert');
    await expect(page.locator('#ordinary_name_errors')).toContainText('This value should not be blank.');
    await expect(page.locator('#ordinary_name_help')).toHaveText('<em>Escaped help</em>');
});

test('ordinary multipart form rejects a forged CSRF field through the real request layer', async ({ page }) => {
    await page.goto('/ordinary-form');
    await page.locator('[name="ordinary[_token]"]').evaluate((token) => {
        token.value = 'forged';
    });
    const response = page.waitForResponse(
        (candidate) => candidate.url().endsWith('/ordinary-form') && candidate.status() === 422
    );
    await page.getByRole('button', { name: 'Submit ordinary form', exact: true }).click();
    await response;
    await expect(page.getByRole('alert').filter({ hasText: 'The CSRF token is invalid.' })).toBeVisible();
    await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Name 1');
});

test('ordinary POST clears an unchecked checkbox while PATCH preserves an omitted value', async ({ page }) => {
    await page.goto('/ordinary-form?method=POST');
    await page.getByLabel('Agreed', { exact: true }).uncheck();
    const response = page.waitForResponse(
        (candidate) => new URL(candidate.url()).pathname === '/ordinary-form' && candidate.request().method() === 'POST'
    );
    await page.getByRole('button', { name: 'Submit ordinary form', exact: true }).click();
    const submitted = await response;
    expect(submitted.status()).toBe(200);
    const result = await submitted.json();
    expect(result.method).toBe('POST');
    expect(result.values.agreed).toBe(false);
    expect(result.request_fields).not.toHaveProperty('_method');
    expect(result.request_fields.ordinary).not.toHaveProperty('agreed');
});
