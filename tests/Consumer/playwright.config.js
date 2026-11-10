const { defineConfig, devices } = require('@playwright/test');
const { consumerDirectory, phpBinary } = require('./helpers');

module.exports = defineConfig({
    testDir: __dirname,
    testMatch: '*.spec.js',
    fullyParallel: false,
    workers: 1,
    retries: 0,
    timeout: 30000,
    expect: { timeout: 8000 },
    outputDir: './results/artifacts',
    reporter: [['list'], ['json', { outputFile: require('node:path').join(__dirname, 'results/results.json') }]],
    use: {
        baseURL: 'http://127.0.0.1:8091',
        viewport: { width: 1440, height: 1000 },
        locale: 'en-US',
        timezoneId: 'UTC',
        colorScheme: 'light',
        reducedMotion: 'reduce',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
        ...(process.env.EASYADMIN_BROWSER_ALL_ENGINES
            ? [
                  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
                  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
              ]
            : []),
    ],
    webServer: {
        command: `${phpBinary} -S 127.0.0.1:8091 -t public public/router.php`,
        cwd: consumerDirectory,
        env: { APP_ENV: 'prod', APP_DEBUG: '0' },
        url: 'http://127.0.0.1:8091/login',
        reuseExistingServer: false,
        timeout: 30000,
    },
});
