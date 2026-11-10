# Final acceptance report

The rendering migration is complete through Prompt 10. Twig, Symfony Forms,
backend behavior and public PHP configuration remain in place. The delivered
EasyAdmin runtime uses Tailwind CSS 4.3.3 and daisyUI 5.7.50 without Bootstrap.
The final product is pinned to `be15cf210ecf45f55ad0312829124039e7c54b23`;
the upstream baseline is `bd0fb8448a41f69b3493c5bea84f793e46fe7c21`.

The current branch is `remove_bootstrap_and_perform_final_acceptance`. Each of
the ten stages has its title-derived branch and numbered `EAD-N` commits.
The package remains `easycorp/easyadmin-bundle` with the original PHP namespace.

## Removed dependencies and runtime integrations

- Removed Bootstrap 5.3.8 with `yarn remove bootstrap`, including its lock entry.
- Removed Bootstrap imports/global APIs/events, client attribute bridges,
  inherited Bootstrap form implementations and the Bootstrap TomSelect skin.
- Removed 26 obsolete theme stylesheets, two temporary migration CSS shims,
  preview entrypoints and transitional browser mode/cookie/source imports.
- Retained both old bundle form-theme paths as neutral aliases. Supported
  legacy column/style/attribute values remain inputs to the narrow Twig adapter.
- Retained independent widgets and Popper, which native overlays still import.
  DOMPurify, TomSelect, CodeMirror, Trix, DirtyForm, Mark.js, slugify,
  basicLightbox, FontAwesome and existing fonts remain, with required licenses.

Removal was checked at several levels: package/lock/install state, source
imports and template inheritance, all generated CSS/JS, 221 unique resolved
Webpack modules, rendered attributes/globals and real browser network responses.
No Bootstrap module is resolved. Shared names such as `btn`, FontAwesome's
`.fa-bootstrap` brand icon, historical reports, neutral alias filenames and
intentional PHP adapter tokens are classified separately. Managed Symfony or
widget packages can contain unused alternative theme sources; the EasyAdmin
runtime does not import them. A class-name search is not the removal proof.

## Behavioral validation

| Check | Verified result |
| --- | --- |
| `make checks-before-pr` | Passed: 4168 PHP tests, 12562 assertions; PHP CS Fixer, PHPStan, Twig and RST checks pass |
| Final browser regression suite | 330 cases across Chromium, Firefox and WebKit; no skipped, unexpected or retried cases |
| Independent consuming application | 15/15 cases across the same three engines |
| Neutral main theme and both legacy aliases | Rendered switch attributes, invalid state, boolean submission and input identity retained |
| Root/subdirectory asset resolution | 2 tests, 144 assertions using real manifest and font targets |
| Prose review regressions | Correct link color/underline and configurable code font; targeted 12/12 checks pass |
| Selectable menu marker regressions | Both tests fail against the old CSS, then 6/6 engine checks pass after the correction |
| Visual references | 15 final PNG/JSON pairs; original 15 upstream pairs unchanged byte-for-byte |

The suites verify server outcomes and requests, including successful and invalid
CRUD submissions, exact submitter/CSRF/method/payload contracts, persisted typed
values, combined search/sort/page/filter state, delete and batch cancellation and
confirmation, permissions, remote autocomplete, nested collections, real uploaded
bytes and physical deletion, editor/read-only states and repeated initialization.
They also cover tabs/collapse/error discovery, unsaved cancellation, mobile and
keyboard focus/Escape/scrolling, light/dark/system appearance, RTL, empty states,
custom templates/form blocks/actions/fields and configured assets.

Six workflows formerly ran in both transitional styling modes. They now run
once with every behavior assertion and the stronger final-style checks. Removing
18 duplicate engine executions and adding three delivered-runtime cases changes
345 cases to 330. Tests were not skipped or changed to accept incorrect behavior.
The original DirtyForm cancellation regression remains a normal passing test.

The complete PHP run preceded the last bounded CSS review fixes; PHP/backend
sources did not change afterward. Those fixes were rebuilt and checked with
frontend/documentation lint, targeted regressions and the complete final browser
suite. Preliminary interrupted runs and intentionally failing regression proofs
are recorded separately from acceptance in the machine-readable report.

## Downstream extension and installation proof

The separate [consumer application](../../examples/consumer/README.md) installs
a pinned Composer ZIP into an ordinary, nonsymlinked vendor directory outside
this repository. Its 641 archived production files match the pinned Git tree.
The archive SHA256 is
`95a5859c8f3a8aba6b164145688b6cad8d0918aafacaea203009692e8980e79d`.
Composer validation passes. Production installation uses `--no-dev`,
`assets:install` and `asset-map:compile` with Node and Yarn absent from PATH;
TailwindBundle is absent from the installed production dependencies.

The actual consumer runs PHP 8.3.33, Symfony HttpKernel 6.4.50/FrameworkBundle
6.4.49 and ORM 2.20.14; Composer resolves with PHP platform 8.2. The maintainer
suite runs PHP 8.5.11, Symfony 8.1.11 and ORM 3.7.6.

All eight extension examples run without vendor edits: a layout block, configured
field template, extended form block, custom field, custom action, theme tokens,
configured CSS/JavaScript/importmap, and an application Tailwind utility absent
from the bundle stylesheet. The application ships its 447-byte utility output;
an application build is needed when changing its class set. See the
[extension guide](extending.md) for stable hooks and migration conventions.

## Build and asset delivery

The independent `tools/UiBuild/` kernel uses TailwindBundle and AssetMapper with
the pinned local Yarn compiler. Mapped, compiler-cache and exported CSS bytes
are checked for equality. Encore packages that CSS with the existing fonts,
icons and CommonJS widgets. This preserves the existing package manager,
distribution manifest, named asset package and precompiled consumer contract.

Development and production builds pass. Real Twig edits were verified through
the paired Tailwind/Encore watch workflow. The original 13 entry names, three
CSS entries and every original manifest key remain; all 53 current targets
exist and are relative. There are 63 distributed files. Final compiled UI CSS
is 248582 bytes; `app.css` is 381208 bytes and `app.js` is 190743 bytes.
Webpack reports zero errors or warnings and no Bootstrap module.

Reproduce the principal checks from the repository root:

```bash
yarn install --frozen-lockfile
make checks-before-pr
yarn ci
make build-assets
make check-runtime
EASYADMIN_BROWSER_ALL_ENGINES=1 make tests-browser
```

For consumer installation/tests, follow its README and set
`EASYADMIN_CONSUMER_DIR` to the fresh outside application, then run
`EASYADMIN_BROWSER_ALL_ENGINES=1 make tests-consumer`. The documented Make
targets rebuild normally; the final local run built once and ran the fixture
and browser commands separately to avoid concurrent asset cleaning.

## Review and intentional compatibility changes

Independent PHP review confirms the production PHP diff is only the internal
340-line presentation extension and four explicit service-registration lines.
Controllers, routes, queries, repositories, factories, persistence, permissions,
validation, CSRF, forms, fields, DTOs and public builders/interfaces have no
production PHP changes. Composer adds only the two maintainer development
dependencies needed for AssetMapper/TailwindBundle.

All 190 baseline Twig files plus their README retain their paths, and original
named blocks remain available through the neutral inheritance/trait hierarchy.
Review also checked URL enforcement, filter responses, HTML sanitization,
dialog/menu cancellation/focus, widget disposal, uploads and generated assets.
Confirmed prose layering, theme-scope documentation and selectable-marker issues
were fixed and regression-tested. A packaging checkpoint missing the neutral
aliases was corrected before the accepted archive was generated.

Downstream Bootstrap-specific CSS/JS/plugins and raw markup require migration.
Supported public grid inputs keep their original pixel breakpoints; arbitrary
Bootstrap utilities are not supported by the adapter. Theme source paths and
layer names change as documented. Tailwind's documented browser floor is
Safari 16.4+, Chrome 111+ and Firefox 128+. Existing PHP requirements remain.
The [human](../../UPGRADE.md) and [AI](../../UPGRADE-AI.md) guides and shipped
agent skill describe these changes.

## Remaining verification limits

No known failure remains in accepted local checks. These checks were not run:

- Actual PHP 8.2, exact minimum browser versions, a separate Symfony 7 runtime
  or PostgreSQL/MySQL/MariaDB execution. The tested environments above are
  distinct from the wider supported dependency range.
- Installed VichUploader integration, remote Flysystem browser round trips and
  a rendered WebProfiler panel. Their interfaces and existing source/unit
  coverage remain; they are not claimed as browser proof.
- Remote CI execution. The reproducible browser and independent consumer jobs
  are configured, but no remote workflow was triggered.

The four added accessible-name translation keys use the repository-permitted
English placeholders outside English. Existing translations are unchanged.
One visible Biome advisory remains for native `hidden` precedence; no rule or
failure is suppressed. No additional rendering migration stage remains.

Detailed provenance: [baseline](baseline.md), [inventory](inventory.md),
[decisions](decisions.md), [coverage](coverage.md), [progress](progress.md),
[machine-readable acceptance](reports/stage-10-acceptance.json), and
[final visual references](../../tests/Browser/references-final/).
