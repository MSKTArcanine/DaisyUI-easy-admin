const { expect, test } = require('@playwright/test');

test('every legacy span offset and row breakpoint has its actual width without Bootstrap', async ({ page }) => {
    await page.goto('/rendering-layout');
    await expect(page.getByRole('heading', { name: 'Presentation layout fixture', exact: true })).toBeVisible();
    expect(await page.evaluate(() => typeof window.bootstrap)).toBe('undefined');
    await expect(page.locator('link[rel="stylesheet"]')).toHaveCount(2);
    await expect(page.locator('link[rel="stylesheet"]').first()).toHaveAttribute(
        'href',
        /\/bundles\/easyadmin\/app\.[a-f0-9]+\.css$/
    );
    await expect(page.locator('link[rel="stylesheet"]').last()).toHaveAttribute(
        'href',
        /easyadmin-fixture\/fixture-[a-zA-Z0-9_-]+\.css$/
    );
    await expect(page.locator('script[src]')).toHaveCount(1);
    await expect(page.locator('script[src]')).toHaveAttribute('src', /\/bundles\/easyadmin\/app\.[a-f0-9]+\.js$/);

    for (const width of [575, 576, 767, 768, 991, 992, 1199, 1200, 1399, 1400]) {
        await page.setViewportSize({ width, height: 1000 });
        const measurements = await page.evaluate(() => {
            const cases = [];
            for (const row of document.querySelectorAll('[data-width-case]')) {
                const rowWidth = row.getBoundingClientRect().width;
                const span = Number(row.dataset.span);
                const active = window.innerWidth >= Number(row.dataset.minimum);
                cases.push({
                    name: `span ${span} at ${row.dataset.minimum}`,
                    actual: row.querySelector('[data-width-item]').getBoundingClientRect().width,
                    expected: rowWidth * (active ? span / 12 : 1),
                });
            }
            for (const row of document.querySelectorAll('[data-offset-case]')) {
                const box = row.getBoundingClientRect();
                const active = window.innerWidth >= Number(row.dataset.minimum);
                cases.push({
                    name: `offset ${row.dataset.offset} at ${row.dataset.minimum}`,
                    actual: row.querySelector('[data-offset-item]').getBoundingClientRect().left - box.left,
                    expected: active ? box.width * (Number(row.dataset.offset) / 12) : 0,
                });
            }
            for (const row of document.querySelectorAll('[data-break-case]')) {
                const first = row.querySelector('[data-break-first]').getBoundingClientRect();
                const second = row.querySelector('[data-break-second]').getBoundingClientRect();
                cases.push({
                    name: `row break at ${row.dataset.minimum}`,
                    actual: second.top - first.top,
                    expected: window.innerWidth >= Number(row.dataset.minimum) ? first.height : 0,
                });
            }

            return cases;
        });
        for (const measurement of measurements) {
            expect(
                Math.abs(measurement.actual - measurement.expected),
                `${measurement.name}, viewport ${width}`
            ).toBeLessThan(0.6);
        }
    }
});

test('default widths break rows while explicit widths pack and wrap with offsets', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 1000 });
    await page.goto('/rendering-layout');
    const defaults = page.locator('[data-default-field]');
    const explicit = page.locator('[data-explicit-field]');
    const defaultBoxes = await boxes(defaults);
    const explicitBoxes = await boxes(explicit);
    expect(defaultBoxes[1].y).toBeGreaterThan(defaultBoxes[0].y);
    expect(explicitBoxes[1].y).toBe(explicitBoxes[0].y);
    await expect(page.locator('[data-default-break]')).toHaveCount(2);
    await expect(page.locator('[data-explicit-break]')).toHaveCount(0);

    const equal = await boxes(page.getByTestId('equal-row').locator(':scope > div'));
    expect(Math.abs(equal[0].width - equal[1].width)).toBeLessThan(0.6);
    expect(equal[0].y).toBe(equal[1].y);
    const auto = await boxes(page.getByTestId('auto-row').locator(':scope > div'));
    expect(auto[0].width).toBeLessThan(auto[1].width);
    expect(auto[0].y).toBe(auto[1].y);
    const wrapped = await boxes(page.getByTestId('wrap-row').locator(':scope > div'));
    expect(wrapped[1].y).toBeGreaterThan(wrapped[0].y);

    const offset = page.getByTestId('offset-reset-row').locator(':scope > div');
    await expect(offset).toHaveClass(/custom-layout-marker/);
    await expect(offset).toHaveAttribute('data-custom', 'quoted "value"');
    await expect(offset).toHaveCSS('outline-color', 'rgb(1, 2, 3)');
    for (const width of [767, 768]) {
        await page.setViewportSize({ width, height: 1000 });
        const ratio = await offset.evaluate((element) => {
            const parent = element.parentElement.getBoundingClientRect();

            return (element.getBoundingClientRect().left - parent.left) / parent.width;
        });
        expect(ratio).toBeCloseTo(width < 768 ? 0.25 : 0, 3);
    }
    await page.locator('html').evaluate((element) => {
        element.dir = 'rtl';
    });
    await page.setViewportSize({ width: 767, height: 1000 });
    const rtlOffset = await offset.evaluate((element) => {
        const parent = element.parentElement.getBoundingClientRect();

        return (parent.right - element.getBoundingClientRect().right) / parent.width;
    });
    expect(rtlOffset).toBeCloseTo(0.25, 3);
});

test('numeric equal and auto widths remain meaningful inside vertical form columns', async ({ page }) => {
    await page.goto('/rendering-layout');
    for (const width of [767, 768, 1400]) {
        await page.setViewportSize({ width, height: 1000 });
        const sizes = await page.getByTestId('vertical-column').evaluate((column) => {
            const style = getComputedStyle(column);
            const contentWidth =
                column.getBoundingClientRect().width -
                Number.parseFloat(style.paddingLeft) -
                Number.parseFloat(style.paddingRight);
            const widths = {};
            for (const name of ['numeric', 'equal', 'auto', 'responsive-equal']) {
                widths[name] =
                    column.querySelector(`[data-testid='inside-${name}']`).getBoundingClientRect().width / contentWidth;
            }

            return widths;
        });
        expect(sizes.numeric).toBeCloseTo(width < 768 ? 1 : 0.5, 3);
        expect(sizes.equal).toBeCloseTo(1, 3);
        expect(sizes.auto).toBeCloseTo(1, 3);
        expect(sizes['responsive-equal']).toBeCloseTo(1, 3);
    }
});

test('caller semantic variants win without conflicting colors and application CSS still overrides', async ({
    page,
}) => {
    await page.goto('/rendering-layout');
    for (const [reference, caller] of [
        ['reference-primary', 'caller-primary'],
        ['reference-danger', 'caller-danger'],
        ['reference-primary', 'caller-solid'],
        ['reference-badge', 'caller-badge'],
        ['reference-alert', 'caller-alert'],
    ]) {
        const expected = await page.getByTestId(reference).evaluate((element) => ({
            background: getComputedStyle(element).backgroundColor,
            color: getComputedStyle(element).color,
        }));
        await expect(page.getByTestId(caller)).toHaveCSS('background-color', expected.background);
        await expect(page.getByTestId(caller)).toHaveCSS('color', expected.color);
    }
    await expect(page.getByTestId('caller-primary')).not.toHaveClass(/btn-neutral/);
    await expect(page.getByTestId('caller-danger')).not.toHaveClass(/btn-primary/);
    await expect(page.getByTestId('caller-badge')).not.toHaveClass(/badge-neutral/);
    await expect(page.getByTestId('caller-alert')).not.toHaveClass(/alert-info/);
    await expect(page.getByTestId('application-override')).toHaveClass(/application-button-override/);
    await expect(page.getByTestId('application-override')).toHaveCSS('background-color', 'rgb(1, 2, 3)');
});

async function boxes(locator) {
    return locator.evaluateAll((elements) =>
        elements.map((element) => {
            const { x, y, width, height } = element.getBoundingClientRect();

            return { x, y, width, height };
        })
    );
}
