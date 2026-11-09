# Browser regression fixture

This harness exercises the real bundle with a browser, native Symfony sessions,
CSRF, Doctrine, SQLite, and the existing DefaultApp entities. It supplements
PHPUnit/BrowserKit; it does not replace the upstream functional suite.

The DefaultApp kernel is final, forces the test environment, and uses mock
sessions. `Kernel.php` therefore provides a small browser entry point with the
same entities and reuses its framework config and form-layout controller. No
production controller, field renderer, theme, or JavaScript is replaced by the
fixture.

## Install and run

Run from the repository root:

```bash
composer install
yarn install --frozen-lockfile
yarn playwright install chromium firefox webkit
make tests-browser
EASYADMIN_BROWSER_ALL_ENGINES=1 make tests-browser
```

Playwright starts its own `php -S 127.0.0.1:8089 tests/Browser/router.php` server
and refuses a stale occupied port. Set `EASYADMIN_BROWSER_REUSE_SERVER=1` only
when deliberately testing an already-running instance of this fixture. The default
project is Chromium; the environment flag adds Firefox and WebKit. Install
platform browser dependencies with `yarn playwright install-deps` if the
browser launch reports missing libraries.

To inspect manually:

```bash
make browser-seed
make browser-serve
```

Open `http://127.0.0.1:8089/login`, sign in as `admin` with password
`browser-password`, and browse `/admin`. These credentials belong only to the
loopback test fixture. The PHP router rejects non-loopback requests. All scripts
and endpoints are under `tests/` and excluded from the distributed package.

Useful targeted runs:

```bash
yarn test:browser crud.spec.js
yarn test:browser widgets.spec.js
yarn test:browser appearance.spec.js
yarn test:browser --grep 'baseline DirtyForm issue'
php tests/Browser/console.php state
php tests/Browser/console.php debug:router
php tests/Browser/console.php lint:twig tests/Browser/templates
```

`console.php` also runs ordinary Symfony commands. The fixture adds `seed` and
`state`, which print JSON; assertions reload actual persisted values through
`state`, independently of managed objects in the web request.

## Isolation and determinism

Storage defaults to `/tmp/easyadmin-browser-baseline/` (the system temporary
directory on other platforms). Set `EASYADMIN_BROWSER_STORAGE` to an isolated
path if needed. It contains `browser.sqlite`, cache, logs, sessions, and uploads.
PHPUnit uses different database/cache paths. `seed` recreates only this
fixture's schema, removes fixture upload files, and creates explicitly named
data with fixed dates. Tests use returned IDs rather than assuming numeric IDs.

Every test resets data. Playwright uses one worker and no retries. Do not run
separate Playwright/seed processes concurrently against the same storage path
and port. Browser console/read operations have no HTTP reset or state backdoor.
The router serves the bundle's actual distributed assets at
`/bundles/easyadmin/`, including fonts; `/browser/` serves only fixture assets.

The fixture login is a real form-login/CSRF session. Category CRUD uses real
generated EasyAdmin routes, form submissions, filters, sorting, pagination,
delete/batch behavior, field permissions, custom field/action templates, and
configured CSS/JavaScript. Widget CRUD reuses the existing synthetic entity for
TomSelect associations, collection prototypes/events, uploads, CodeMirror, and
Trix. Layout CRUD reuses DefaultApp's mixed tabs/columns/collapsed-error fixture.

## Baseline failure retained as a failing test

`widgets.spec.js` contains the normal regression
`baseline DirtyForm issue: canceled submission must retain unsaved navigation protection`.
At the original product baseline it fails: DirtyForm 0.4.0 clears its dirty
flag on every submit event before the cancelable `ea.form.submit` event stops
submission. Clicking navigation afterward leaves the changed form without a
warning. The test remains in the default suite with no skip, expected-failure
annotation, retry, or ignored assertion. Separate tests verify normal unsaved
navigation and cancellation of form submission.

Reproduce with the targeted command above. The existing rendering must remain
unchanged during Prompt 2; fix the interaction in the form migration stage and
keep this test as a permanent regression. The stage report must distinguish
this known product failure from setup errors and corrected test selectors.

## Visual references

Capture only the original rendering baseline with:

```bash
EASYADMIN_CAPTURE_REFERENCES=1 make tests-browser
```

The command still fails for any behavioral failure, including the DirtyForm
case above. Completed tests write PNG/JSON pairs under `references/` for
dashboard, index/detail/new/edit, invalid form, filters, delete/batch dialogs,
widgets/editors, collapsed validation error, minimal login, mobile navigation,
and dark RTL rendering. Metadata includes source baseline, capture commit,
browser/version, viewport, URL, locale, timezone, scheme, and text direction.
References are produced in Chromium to avoid engine-to-engine glyph variation.

These are visual references only: assertions verify real requests, payloads,
events, persisted records/bytes, physical file deletion, permissions, and
keyboard/focus state. No screenshot assertion substitutes for behavior. Do not
overwrite the original reference directory during later migration stages.

## Remaining coverage boundaries

The existing PHPUnit suite covers many more fields, query permutations,
security rules, template replacements, optional configurations, and nested CRUD
forms. The browser suite exercises representative behavior and explicitly adds
dynamic widget interaction; it does not claim every browser/field combination.
Nested collection prototypes with every editor type, optional Vich/Flysystem
services, content inserted by arbitrary downstream frameworks, and exact
minimum supported engine versions remain separate verification work. The
consuming package installation/AssetMapper build is established in later
stages. Record these limits in `docs/ui-migration/coverage.md` and close them in
their assigned migration stages.
