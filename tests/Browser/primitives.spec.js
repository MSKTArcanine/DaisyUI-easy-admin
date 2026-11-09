const { expect, test } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
    await page.goto('/ui-primitives');
    await expect(page.locator('#choices')).toHaveAttribute('role', 'menu');
});

test('dialog preserves slots and attributes, traps focus, cancels and restores focus', async ({ page }) => {
    expect(await page.evaluate(() => typeof window.bootstrap)).toBe('undefined');
    await expect(page.locator('link[rel="stylesheet"]')).toHaveCount(1);
    const trigger = page.locator('#open-dialog');
    await expect(trigger).toHaveAttribute('data-extra', 'A "quoted" <value>');
    await expect(trigger.locator('.caller-label')).toHaveText('Open dialog');
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Dialog title', exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('data-extra', 'A "quoted" <value>');
    await expect(dialog.getByTestId('dialog-header')).toHaveText('Custom dialog header');
    await expect(dialog.getByTestId('dialog-body')).toHaveText('Custom dialog body');
    await expect(dialog.locator('.caller-footer')).toContainText('Confirm dialog');
    await expect(dialog.getByLabel('Dialog value')).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(dialog.getByRole('button', { name: 'Confirm dialog', exact: true })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(dialog.getByLabel('Dialog value')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await expect.poll(() => page.evaluate(() => document.documentElement.style.overflow)).toBe('');
});

test('dialog cancel sends no POST and confirmation preserves real form method and payload', async ({ page }) => {
    const submissions = [];
    page.on('request', (request) => {
        if (request.url().endsWith('/ui-primitives/submit')) {
            submissions.push(request);
        }
    });
    await page.locator('#open-dialog').click();
    await page.getByLabel('Dialog value').fill('Canceled value');
    await page.getByRole('button', { name: 'Cancel dialog', exact: true }).click();
    expect(submissions).toHaveLength(0);
    await page.locator('#open-dialog').click();
    await expect(page.getByLabel('Dialog value')).toHaveValue('Canceled value');
    await page.getByLabel('Dialog value').fill('Confirmed value');
    const responsePromise = page.waitForResponse((response) => response.url().endsWith('/ui-primitives/submit'));
    await page.getByRole('button', { name: 'Confirm dialog', exact: true }).click();
    const response = await responsePromise;
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ method: 'POST', value: 'Confirmed value', submit: 'confirmed' });
    expect(submissions).toHaveLength(1);
    expect(submissions[0].method()).toBe('POST');
    const payload = new URLSearchParams(submissions[0].postData());
    expect(payload.get('value')).toBe('Confirmed value');
    expect(payload.get('submit')).toBe('confirmed');
    expect(payload.get('token')).toBeTruthy();
});

test('invalid and canceled form submissions keep the dialog and its errors discoverable', async ({ page }) => {
    const submissions = [];
    page.on('request', (request) => {
        if (request.url().endsWith('/ui-primitives/submit')) {
            submissions.push(request);
        }
    });
    await page.locator('#open-dialog').click();
    await page.getByLabel('Dialog value').fill('');
    await page.locator('#confirm-dialog').click();
    await expect(page.getByRole('dialog', { name: 'Dialog title', exact: true })).toBeVisible();
    await expect(page.getByLabel('Dialog value')).toBeFocused();
    expect(submissions).toHaveLength(0);
    await page.getByLabel('Dialog value').fill('Canceled submit');
    await page
        .locator('#primitive-form')
        .evaluate((form) => form.addEventListener('submit', (event) => event.preventDefault()));
    await page.locator('#confirm-dialog').click();
    await expect(page.getByRole('dialog', { name: 'Dialog title', exact: true })).toBeVisible();
    expect(submissions).toHaveLength(0);
});

test('dialog honors disabled keyboard dismissal and static or absent backdrops', async ({ page }) => {
    const dialog = page.locator('dialog[data-ea-dialog]');
    await dialog.evaluate((element) => {
        element.dataset.eaKeyboard = 'false';
        element.dataset.eaBackdrop = 'static';
    });
    await page.locator('#open-dialog').click();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeVisible();
    await dialog.click({ position: { x: 5, y: 5 } });
    await expect(dialog).toBeVisible();
    await dialog.evaluate((element) => (element.dataset.eaBackdrop = 'false'));
    await dialog.click({ position: { x: 5, y: 5 } });
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate((element) => getComputedStyle(element, '::backdrop').backgroundColor)).toBe(
        'rgba(0, 0, 0, 0)'
    );
    await page.getByRole('button', { name: 'Cancel dialog', exact: true }).click();
    await expect(dialog).not.toBeVisible();
});

test('menu supports nested keyboard navigation, disabled items, escaping and focus restoration', async ({ page }) => {
    const trigger = page.locator('#open-menu');
    await trigger.focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#first-choice')).toBeFocused();
    await expect(page.locator('#first-choice')).toHaveAttribute('data-extra', 'A "quoted" <value>');
    await expect(page.locator('#first-choice .caller-item-label')).toHaveText('First choice');
    await expect(page.locator('#escaped-choice')).toHaveText('<img src=x onerror=alert(1)>');
    await expect(page.locator('#escaped-choice img')).toHaveCount(0);
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitem', { name: 'Main choice', exact: true })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('menuitem', { name: 'Nested first', exact: true })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitem', { name: 'Nested second', exact: true })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-ea-menu-split]')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('menu forms keep native input keys and close after focus leaves; auto-close options are respected', async ({
    page,
}) => {
    const trigger = page.locator('#open-menu');
    await trigger.click();
    await page.getByLabel('Menu input').focus();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.click();
    await page.getByLabel('Menu input').focus();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('tab', { name: 'First panel', exact: true })).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await trigger.evaluate((element) => (element.dataset.eaAutoClose = 'inside'));
    await trigger.click();
    await page.locator('#outside-control').click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await page.locator('#escaped-choice').click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.evaluate((element) => (element.dataset.eaAutoClose = 'false'));
    await trigger.click();
    await page.locator('#escaped-choice').click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await page.locator('#outside-control').click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('menus position within the viewport, open submenus on hover and execute a pointer drag choice once', async ({
    page,
}) => {
    await page.setViewportSize({ width: 500, height: 700 });
    await page.locator('#open-menu').click();
    await page.locator('[data-ea-menu-split]').hover();
    await expect(page.locator('[data-ea-menu-split]')).toHaveAttribute('aria-expanded', 'true');
    const child = page.getByRole('menuitem', { name: 'Nested first', exact: true }).locator('..').locator('..');
    const box = await child.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(500);
    await page.locator('#outside-control').click();

    const requests = [];
    page.on('request', (request) => {
        if (new URL(request.url()).searchParams.get('selection') === 'first') {
            requests.push(request);
        }
    });
    const toggle = await page.locator('#open-menu').boundingBox();
    await page.mouse.move(toggle.x + toggle.width / 2, toggle.y + toggle.height / 2);
    await page.mouse.down();
    await expect(page.locator('#choices')).toBeVisible();
    const first = await page.locator('#first-choice').boundingBox();
    await page.mouse.move(first.x + first.width / 2, first.y + first.height / 2);
    await page.mouse.up();
    await expect(page).toHaveURL(/selection=first/);
    expect(requests).toHaveLength(1);
});

test('tabs retain history, linked action hashes, keyboard direction and child Twig overrides', async ({ page }) => {
    await page.goto('/ui-primitives/override?direction=rtl');
    await expect(page.getByTestId('fixture-header')).toHaveText('Child template override');
    const first = page.getByRole('tab', { name: 'First panel', exact: true });
    const second = page.getByRole('tab', { name: /^Second panel/ });
    await first.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(second).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#pane-first')).toBeHidden();
    await expect(page.locator('#pane-second')).toBeVisible();
    await expect(page).toHaveURL(/#pane-second$/);
    await expect(page.locator('#tab-edit-link')).toHaveAttribute('href', '/ui-primitives?destination=edit#pane-second');
    await page.goBack();
    await expect(first).toHaveAttribute('aria-selected', 'true');
    await page.goForward();
    await expect(second).toHaveAttribute('aria-selected', 'true');
    await page.reload();
    await expect(second).toHaveAttribute('aria-selected', 'true');
});

test('initial tabs preserve the server-selected panel and disabled menu items never execute', async ({ page }) => {
    await page.goto('/ui-primitives?active=second');
    await expect(page.getByRole('tab', { name: /^Second panel/ })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#pane-second')).toBeVisible();
    await expect(page.locator('#pane-first')).toBeHidden();
    const requests = [];
    page.on('request', (request) => {
        if (new URL(request.url()).searchParams.get('selection') === 'disabled') {
            requests.push(request);
        }
    });
    await page.locator('#open-menu').click();
    const disabled = page.locator('[data-ea-menu-item][aria-disabled="true"]');
    await disabled.focus();
    await page.keyboard.press('Enter');
    await disabled.evaluate((element) => element.click());
    expect(requests).toHaveLength(0);
    await expect(page).toHaveURL(/active=second$/);
});

test('repeated and dynamic initialization keeps one handler and supports CSS selector dialog targets', async ({
    page,
}) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.evaluate(async () => {
        const { initEasyAdminUI } = await import('ui-interactions');
        const wrapper = document.createElement('div');
        wrapper.innerHTML =
            '<button type="button" id="dynamic-trigger" data-ea-toggle="modal" data-ea-target="[data-dynamic-dialog]">Open dynamic</button><dialog id="dynamic:dialog" data-ea-dialog data-dynamic-dialog><div data-ea-dialog-panel><h2>Dynamic dialog</h2><button type="button" data-ea-dismiss="modal">Close dynamic</button></div></dialog>';
        document.body.append(wrapper);
        window.dynamicShows = 0;
        wrapper.querySelector('dialog').addEventListener('ea.modal.shown', () => window.dynamicShows++);
        document.dispatchEvent(
            new CustomEvent('ea.collection.item-added', { detail: { newElement: wrapper, collection: document.body } })
        );
        initEasyAdminUI(wrapper);
        initEasyAdminUI(wrapper);
    });
    const trigger = page.locator('#dynamic-trigger');
    await trigger.click();
    await expect(page.getByRole('dialog', { name: 'Dynamic dialog', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Close dynamic', exact: true }).click();
    await expect(trigger).toBeFocused();
    await trigger.evaluate((element) => element.setAttribute('data-ea-target', '#dynamic\\:dialog'));
    await trigger.click();
    await expect(page.getByRole('dialog', { name: 'Dynamic dialog', exact: true })).toBeVisible();
    expect(await page.evaluate(() => window.dynamicShows)).toBe(2);
    await page.keyboard.press('Escape');
    await trigger.evaluate((element) => element.setAttribute('data-ea-target', '['));
    await trigger.click();
    expect(errors).toEqual([]);
    await page.locator('#dismissible-alert').getByRole('button', { name: 'Close', exact: true }).click();
    await expect(page.locator('#dismissible-alert')).toHaveCount(0);
});
