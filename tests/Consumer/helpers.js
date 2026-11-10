const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { expect } = require('@playwright/test');

const configuredDirectory = process.env.EASYADMIN_CONSUMER_DIR;
if (!configuredDirectory || !path.isAbsolute(configuredDirectory)) {
    throw new Error('Set EASYADMIN_CONSUMER_DIR to the absolute path of the installed consuming application.');
}
const consumerDirectory = fs.realpathSync(configuredDirectory);
const phpBinary = process.env.EASYADMIN_CONSUMER_PHP || 'php8.3';
if (!/^[\w./+-]+$/.test(phpBinary)) {
    throw new Error('Set EASYADMIN_CONSUMER_PHP to a PHP executable name or path without shell syntax.');
}

function fixture(command = 'state') {
    return JSON.parse(
        execFileSync(phpBinary, ['bin/console', 'app:fixtures', command], {
            cwd: consumerDirectory,
            env: { ...process.env, APP_ENV: 'prod', APP_DEBUG: '0' },
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
        })
    );
}

async function login(page) {
    await page.goto('/login');
    await page.getByLabel('Username', { exact: true }).fill('admin');
    await page.getByLabel('Password', { exact: true }).fill('consumer-password');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.locator('body')).toContainText('Standalone consumer dashboard');
}

async function save(page, action = 'saveAndReturn') {
    const button = page.locator(`[data-action-name='${action}']`);
    await expect(button).toHaveAttribute('type', 'submit');
    const formId = await button.getAttribute('form');
    expect(formId).toBeTruthy();
    await expect(page.locator(`[id='${formId}']`)).toHaveAttribute('method', 'post');
    await button.click();
}

module.exports = { consumerDirectory, phpBinary, fixture, login, save };
