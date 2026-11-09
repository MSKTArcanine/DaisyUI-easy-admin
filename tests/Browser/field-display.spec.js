const { test, expect } = require('@playwright/test');
const { fixture, login } = require('./helpers');

let seeded;

test.beforeEach(async ({ page }) => {
    seeded = fixture('seed');
    await login(page);
});

for (const ui of ['legacy', 'tailwind']) {
    test(`${ui}: field dimensions, color samples, URLs and image names survive index and detail rendering`, async ({
        page,
    }) => {
        const widget = seeded.widgets[0];
        await page.goto(`/admin/field-display?ui=${ui}`);
        const row = page.locator(`tr[data-id="${widget.id}"]`);
        const avatar = row.locator('[data-column="avatarField"] .image-avatar');
        await expect(avatar).toHaveAttribute('height', '96');
        await expect(avatar).toHaveAttribute('width', '96');
        expect((await avatar.getAttribute('alt')).trim()).toBe('Avatar "quoted"');
        await expect(avatar).toHaveCSS('height', '96px');
        await expect(avatar).toHaveCSS('width', '96px');

        const image = row.locator('[data-column="imageField"] .ea-lightbox-thumbnail img');
        await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth)).toBe(1800);
        expect((await image.getAttribute('alt')).trim()).toBe('Image "quoted"');
        if (ui === 'tailwind') {
            await expect(image).toHaveCSS('max-block-size', '64px');
            await expect(image).toHaveCSS('max-inline-size', '112px');
        }
        expect((await image.boundingBox()).height).toBeLessThanOrEqual(64.001);
        expect((await image.boundingBox()).width).toBeLessThanOrEqual(112.001);
        const sourceSelector = await image.locator('..').getAttribute('data-ea-lightbox-content-selector');
        await expect(page.locator(sourceSelector)).toBeHidden();

        const color = row.locator('[data-column="colorField"]');
        await expect(color).toContainText('#15803d');
        await expect(color.locator('.color-sample')).toHaveCSS('background-color', 'rgb(21, 128, 61)');
        await expect(color.locator('.color-sample')).toHaveAttribute('title', '#15803d');
        const safe = row.locator('[data-column="urlField"] a');
        await expect(safe).toHaveAttribute('href', 'https://example.com/path?value=%3Cvalue%3E');
        await expect(safe).toHaveAttribute('target', '_blank');
        await expect(safe).toHaveAttribute('rel', 'noopener');
        const unsafe = row.locator('[data-column="telephoneField"]');
        await expect(unsafe.locator('.ea-unsafe-url')).toHaveText('javascript:alert(1)');
        await expect(unsafe.locator('a,script')).toHaveCount(0);

        await page.goto(`/admin/field-display/${widget.id}?ui=${ui}`);
        const detailAvatar = page.locator('.field-group.field-avatar .image-avatar');
        await expect(detailAvatar).toHaveCSS('height', '96px');
        await expect(detailAvatar).toHaveCSS('width', '96px');
        const detailImage = page.locator('.field-group.field-image .ea-lightbox-thumbnail img');
        await expect.poll(() => detailImage.evaluate((element) => element.complete && element.naturalWidth)).toBe(1800);
        if (ui === 'tailwind') {
            await expect(detailImage).toHaveCSS('max-block-size', '300px');
            await expect(detailImage.locator('..')).toHaveCSS('max-inline-size', '400px');
        }
        const bounds = await detailImage.boundingBox();
        expect(bounds.height).toBeGreaterThan(128);
        expect(bounds.height).toBeLessThanOrEqual(300.001);
        expect(bounds.width).toBeLessThanOrEqual(400.001);
        await page.setViewportSize({ width: 390, height: 844 });
        expect((await detailImage.boundingBox()).width).toBeLessThanOrEqual(390.001);
        await expect(detailAvatar).toHaveCSS('height', '96px');
    });

    test(`${ui}: native readonly code and text viewers retain values, focus and theme readability`, async ({
        page,
    }) => {
        await page.goto(`/admin/field-display?ui=${ui}`);
        const row = page.locator(`tr[data-id="${seeded.widgets[0].id}"]`);
        for (const scheme of ['light', 'dark']) {
            if (scheme === 'dark') {
                await page.locator('.dropdown-settings-button:visible').click();
                await page.locator('[data-ea-color-scheme="dark"]:visible').click();
            }
            await expect(page.locator('body')).toHaveCSS('color-scheme', scheme);
            const trigger = row.locator('[data-column="codeEditorField"] [data-ea-toggle="modal"]');
            const dialog = page.locator(await trigger.getAttribute('data-ea-target'));
            await trigger.click();
            await expect(dialog).toBeVisible();
            expect(await dialog.evaluate((element) => element.tagName)).toBe('DIALOG');
            const editor = dialog.locator('.CodeMirror');
            await expect
                .poll(() => editor.evaluate((element) => element.CodeMirror?.getValue()))
                .toBe(seeded.widgets[0].code);
            expect(await editor.evaluate((element) => element.CodeMirror.getOption('readOnly'))).toBe(true);
            await editor.locator('textarea').focus();
            await expect(editor.locator('textarea')).toBeFocused();
            await page.keyboard.type('Attempted edit');
            expect(await editor.evaluate((element) => element.CodeMirror.getValue())).toBe(seeded.widgets[0].code);
            if (ui === 'tailwind') {
                const colors = await page.evaluate(() => {
                    const probe = document.createElement('span');
                    probe.style.color = 'var(--color-base-content)';
                    probe.style.backgroundColor = 'var(--color-base-100)';
                    document.body.append(probe);
                    const style = getComputedStyle(probe);
                    const result = { foreground: style.color, background: style.backgroundColor };
                    probe.remove();
                    return result;
                });
                await expect(editor).toHaveCSS('color', colors.foreground);
                await expect(editor).toHaveCSS('background-color', colors.background);
                expect(colors.foreground).not.toBe(colors.background);
            }
            // keep the editor's Escape selection command while checking the dialog shortcut
            await dialog.getByRole('button', { name: 'Close', exact: true }).focus();
            await page.keyboard.press('Escape');
            await expect(dialog).toBeHidden();
            await expect(trigger).toBeFocused();

            const richTrigger = row.locator('[data-column="textEditorField"] [data-ea-toggle="modal"]');
            const richDialog = page.locator(await richTrigger.getAttribute('data-ea-target'));
            await richTrigger.click();
            await expect(richDialog).toBeVisible();
            await expect(richDialog.locator('.modal-body-content')).toHaveText(seeded.widgets[0].richText);
            await richDialog.getByRole('button', { name: 'Close', exact: true }).click();
            await expect(richDialog).toBeHidden();
            await expect(richTrigger).toBeFocused();
        }
    });
}
