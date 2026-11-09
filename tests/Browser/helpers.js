const { execFileSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const { expect } = require('@playwright/test');

const root = path.resolve(__dirname, '../..');

function fixture(command = 'state') {
    return JSON.parse(
        execFileSync('php', ['tests/Browser/console.php', command], {
            cwd: root,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
        })
    );
}

async function login(page) {
    await page.goto('/login');
    await page.locator('#username').fill('admin');
    await page.locator('#password').fill('browser-password');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByTestId('dashboard-content')).toHaveText('Deterministic browser fixtures');
}

async function save(page, action = 'saveAndReturn') {
    const button = page.locator(`[data-action-name='${action}']`);
    await expect(button).toHaveAttribute('type', 'submit');
    const formId = await button.getAttribute('form');
    expect(formId).toBeTruthy();
    await expect(page.locator(`[id='${formId}']`)).toHaveAttribute('method', 'post');
    await button.click();
}

async function captureReference(page, name) {
    if (
        process.env.EASYADMIN_CAPTURE_REFERENCES !== '1' ||
        page.context().browser().browserType().name() !== 'chromium'
    )
        return;
    const directory = path.join(__dirname, 'references');
    fs.mkdirSync(directory, { recursive: true });
    await page.screenshot({ path: path.join(directory, `${name}.png`), fullPage: true, animations: 'disabled' });
    fs.writeFileSync(
        path.join(directory, `${name}.json`),
        `${JSON.stringify(
            {
                sourceBaseline: 'bd0fb8448a41f69b3493c5bea84f793e46fe7c21',
                captureCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
                browser: 'chromium',
                browserVersion: page.context().browser().version(),
                viewport: page.viewportSize(),
                url: page.url(),
                locale: 'en-US',
                timezone: 'UTC',
                scheme: await page.locator('body').evaluate((body) => getComputedStyle(body).colorScheme),
                direction: await page.locator('html').getAttribute('dir'),
            },
            null,
            2
        )}\n`
    );
}

module.exports = { fixture, login, save, captureReference };
