# Rendering behavior and delivered-asset regression application

This loopback-only Symfony application reuses the existing functional entities,
controllers and form types. It serves the bundle's normal hashed `app.css`,
`app.js` and field entries through the existing AssetPackage manifest. It has
no migration modes, preview cookie or alternative framework stylesheet.

## Run the suite

```bash
composer install
yarn install --frozen-lockfile
yarn playwright install chromium firefox webkit
make tests-browser
EASYADMIN_BROWSER_ALL_ENGINES=1 make tests-browser
EASYADMIN_BROWSER_ALL_ENGINES=1 make tests-browser ARGS="forms.spec.js nested.spec.js"
```

`make tests-browser` first runs the normal distribution build and compiles the
fixture's AssetMapper assets. Tests run sequentially with one worker and no
retries. Chromium is the default; the environment flag adds Firefox and WebKit.
Servers use ports 8089 and 8090 for development and production AssetMapper
behavior. An existing server is reused only when
`EASYADMIN_BROWSER_REUSE_SERVER=1` is explicitly set. Don't run two browser
processes against the same fixture database concurrently.

For manual inspection:

```bash
make build-browser-assets
make browser-seed
make browser-serve
```

Visit `http://127.0.0.1:8089/login` with username `admin` and password
`browser-password`. These credentials belong only to this deterministic
fixture. `php tests/Browser/console.php seed` resets the data and fixture-owned
uploaded files; `php tests/Browser/console.php state` reads actual persisted
values and stored artifacts. There is no HTTP reset endpoint.

SQLite, native sessions, cache, logs and uploaded files use
`/tmp/easyadmin-browser-baseline` by default. Set `EASYADMIN_BROWSER_STORAGE`
to another absolute directory for an independent instance. PHPUnit uses its
own test applications and storage. Browser seeding doesn't reset those
applications, and PHPUnit doesn't reset the browser fixture.

## Permanent rendering contracts

All real admin, login, content and ordinary form pages load delivered bundle
assets. `/rendering-contract` proves those assets compose with application
utilities; `/rendering-host` checks that the delivered stylesheet doesn't reset
an ordinary Symfony page. `/rendering-layout` measures the public column,
offset and breakpoint adapter. `/rendering-primitives` and its `/override`
child exercise existing components, slots and overridable blocks. Their native
confirmation form makes a real CSRF-protected POST.

`assets/fixture.css` compiles only Tailwind utilities for finite fixture source
paths. It references core theme metadata without emitting daisyUI, bundle
components, theme definitions or Preflight. This separate application stylesheet
supplies fixture-only classes such as `outline-offset-[7px]`; production bundle
CSS must not contain that class. `build.spec.js` reads the actual distribution
and both mapped fixture outputs to verify this boundary. Product compilation
never scans these fixture sources.

Dynamic and repeated initialization tests call the `EasyAdminApp` instance
provided by delivered `app.js`. They don't import a second implementation from
repository source. `delivery.spec.js` audits actual stylesheet/script/font
responses, rendered behavior attributes and runtime globals on representative
pages alongside the behavioral tests.

Six workflows previously ran once in each transitional styling mode. The final
suite runs each once and retains every behavioral assertion plus the stronger
computed-style checks: four form workflows and two field-display workflows.
That removes 18 duplicate engine executions; the new delivered-runtime audit
adds three. This is deduplication of obsolete modes, not reduced behavior
coverage. Keep the original canceled-submit/unsaved-change regression as a
normal passing test; don't skip or mark it expected to fail.

## Visual references

The 15 original PNG/JSON pairs in `references/` are immutable upstream visual
references. Capture final rendering separately:

```bash
EASYADMIN_CAPTURE_FINAL_REFERENCES=1 make tests-browser
```

Only Chromium writes `references-final/`. Metadata includes the pinned upstream
SHA, current capture commit, asset-manifest SHA-256, browser/version, viewport,
URL, locale, timezone, appearance and direction. The old
`EASYADMIN_CAPTURE_REFERENCES=1` flag now fails explicitly to prevent accidental
overwriting of the original directory.

Images remain visual references. Tests independently verify requests, methods,
payloads, CSRF, persisted records and uploaded bytes, physical deletion,
permissions, validation, keyboard/focus behavior and layout geometry. A
screenshot doesn't substitute for any of those checks.

## Explicit limits

Existing PHPUnit suites cover additional field types, query permutations,
permissions and extension combinations. Browser tests exercise actual dynamic
editors, nested collections, uploads, autocomplete and the original regression
stories, without claiming every third-party configuration or minimum browser
version. Installed VichUploader, remote Flysystem storage, rendered profiler
panels and the exact PHP 8.2/browser minimum matrix remain separate limits in
`docs/ui-migration/coverage.md`. The independent installed consuming application
and its package/archive/AssetMapper tests live under `examples/consumer/` and
`tests/Consumer/`.
