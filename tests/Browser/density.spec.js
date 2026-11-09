const { expect, test } = require('@playwright/test');

for (const mode of [
    { name: 'development', url: '/ui-preview' },
    { name: 'production', url: 'http://127.0.0.1:8090/ui-preview' },
]) {
    test(`${mode.name} density scales layout spacing and preserves bounded component sizes`, async ({ page }) => {
        await page.goto(mode.url);
        await expect.poll(() => page.evaluate(() => window.previewFixtureReady)).toBe(true);
        await page.evaluate(() => {
            const primary = document.querySelector('[data-testid="preview-primary"]');
            for (const size of ['xs', 'sm', 'md', 'lg', 'xl']) {
                const button = primary.cloneNode(true);
                button.classList.add(`btn-${size}`);
                button.dataset.testid = `density-${size}`;
                button.textContent = `Density ${size}`;
                primary.after(button);
            }
        });

        for (const scheme of ['light', 'dark']) {
            if (scheme === 'dark') {
                await page.getByTestId('preview-theme-toggle').click();
            }
            await expect(page.locator('[data-ea-ui]')).toHaveAttribute('data-theme', `easyadmin-${scheme}`);

            for (const density of [
                { spacing: '1.5px', normal: '28px', small: '24px', large: '32px', gap: '12px' },
                { spacing: '2px', normal: '32px', small: '28px', large: '36px', gap: '16px' },
                { spacing: '3px', normal: '32px', small: '28px', large: '36px', gap: '24px' },
            ]) {
                await page.evaluate((spacing) => {
                    document.documentElement.style.setProperty('--ea-spacing', spacing);
                }, density.spacing);

                await expect(page.getByTestId('preview-primary')).toHaveCSS('height', density.normal);
                await expect(page.getByTestId('density-md')).toHaveCSS('height', density.normal);
                await expect(page.getByTestId('density-sm')).toHaveCSS('height', density.small);
                await expect(page.getByTestId('density-lg')).toHaveCSS('height', density.large);
                await expect(page.getByTestId('preview-grid')).toHaveCSS('column-gap', density.gap);
                const smallHeight = await page
                    .getByTestId('density-xs')
                    .evaluate((element) => element.getBoundingClientRect().height);
                const largeHeight = await page
                    .getByTestId('density-xl')
                    .evaluate((element) => element.getBoundingClientRect().height);
                expect(smallHeight).toBeLessThan(Number.parseFloat(density.normal));
                expect(largeHeight).toBeGreaterThan(Number.parseFloat(density.normal));
            }
        }
    });
}
