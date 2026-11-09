# Behavioral coverage and verification plan

Status: Behavioral baseline and migration evidence through Prompt 4. The
source-audit matrix below records
existing infrastructure and the coverage required during migration. Executed
baseline results and remaining gaps are recorded after that matrix. The
Prompt 2 baseline predates product rendering changes.

## Existing coverage and required additions

All paths below are rooted at `tests/Functional/` unless stated otherwise.
BrowserKit does not execute browser JavaScript, so DOM assertions cannot prove
dialogs, menus, widgets, focus, or persisted browser-driven actions work.

| Surfaces | Existing test sources | Prompt 2 baseline requirement / gap |
| --- | --- | --- |
| Dashboard/navigation, T01/J03 | `Default/DashboardControllerTest.php`, `Default/Dashboard/{MenuTest,UserMenuTest,LayoutTest,DefaultLayoutTest}.php` | Preserve URLs/active/hidden items; add real mobile overlay, nested menu, keyboard/Escape/focus/scroll verification |
| CRUD index/detail, T02/T03 | `Default/Crud/{IndexTest,DetailTest,EmptyDataTest}.php` | Explicit deterministic values, permission and empty/null output, detail partials, link destinations |
| New/edit successful submission, T04 | `Default/Crud/{NewTest,EditTest}.php` | Existing tests include repository reload/persisted-value assertions; reuse and add method/payload/submit-action verification |
| Invalid/compound forms, T04/T05/J11 | `Default/Crud/FormWithoutSubmittedDataTest.php`, `FormLayout/FormLayoutValidationErrorsTest.php`, `Default/CustomFormPageControllerTest.php` | Invalid values retained; hidden/CSRF/multipart/form_rest; required/disabled/readonly; normal Symfony forms without EA context; error association and focus |
| Search/sort/page/filters, T02/J05/J08 | `Default/Search/`, `Default/Sort/`, `Pagination/PaginationTest.php`, `Filters/` | Add one combined search+sort+page+filter+custom-query scenario; assert returned records and URL/hidden fields before and after apply/reset |
| Mobile sort and row actions, T02/J08 | `Default/Sort/SortModalTest.php`, `Default/Sort/UrlSortSecurityTest.php`, `Default/DefaultRowActionCrudControllerTest.php` | Real sort-dialog action, single/double click, interactive cells, modifiers/middle click, keyboard, malicious URL and text-selection handling |
| Delete/batch/custom actions, J06/J07 | `Default/Crud/DeleteTest.php`, `BatchActions/{BatchDeleteTest,BatchActionsTest}.php`, `Actions/`, `Customization/Crud/BatchActions/ConfirmationTest.php` | Server tests include persisted deletion and invalid CSRF/FQCN protection; add browser cancel/no request, confirm exactly once, cancel A/open B/confirm B, no-confirm/custom form action paths, selection range and double-click |
| Permissions/unavailable actions | `Security/`, `Actions/EntityActionsTest.php` | Server denies direct action URLs as well as hidden controls; disabled/permission-dependent fields and actions stay unavailable |
| Field renderer families, T07 | `Fields/{Choice,Collection,DateTime,Intl,Media,Numeric,Special,Text}/` | Cover every actual field template listed in inventory, including display formatting, null/empty and custom template values; do not replace behavior checks with presence-only assertions |
| Boolean PATCH, J12 | `Fields/Choice/BooleanFieldTest.php` | Browser drives PATCH and verifies method/header/query, persisted value, permission/failure rollback and disabled control |
| Autocomplete, J14/W01 | `Autocomplete/{AssociationFieldAutocompleteTest,AutocompleteCustomizationTest,AutocompleteGroupByTest,EntityFilterAutocompleteTest}.php` | Exercise actual TomSelect, query/next_page/results/groups, chosen values, HTML opt-in, required/multiple and event customization; persist associations |
| Collection add/remove, J13 | `Fields/Collection/{CollectionFieldTest,NestedCrudFormTest,ArrayFieldTest}.php` | Real nested prototype insertion, unique IDs/indices, permissions, multiple adds/removes, repeated initialization/event payloads, persisted nested values |
| Upload/image/Vich, J15/W04/W07 | `Fields/Media/{FileUploadTest,ImageFieldTest,AvatarFieldTest}.php` | Real multipart bytes/filenames and deletion/clear flags; preview/replacement/validation/permission behavior; lightbox keyboard and fallback; optional Vich integration needs installed fixture dependency |
| Tabs/fieldsets/columns/addons, P01/P02/J10 | `FormLayout/`, including `TabsTest.php`, `ColumnsTest.php`, `RowsTest.php`, `FormFieldAddonsTest.php` and mixed-layout tests | Keep tree/blocks/configuration checks; add tab history/link hashes, keyboard, collapsed/nested invalid-control reveal, exact breakpoint/offset/wrapping measurements |
| Unsaved-change protection, J11 | `form.js` uses DirtyForm; no JS runner found | Navigate away/cancel/confirm; successful submission bypasses stale warning; canceled `ea.form.submit` does not persist |
| Editors/slug/textarea, J16/W02/W03/W05 | `Fields/Text/{CodeEditorFieldTest,TextEditorFieldTest,SlugFieldTest,TextareaFieldTest}.php` | Edit real widgets and submit values; readonly/required/error behavior; slug lock/confirmation; editors inside inserted collections and inactive tabs |
| Light/dark/auto/layout/RTL, C02/J03/J04 | `Default/Dashboard/`, `Customization/Dashboard/{ColorSchemeTest,DarkModeTest,TextDirectionTest,LocalesTest,ThemeControllerTest}.php`, `Customization/Crud/Layout/` | Real media/storage/preference precedence; first paint, configured overrides, both theme menus, RTL keyboard/placement and reduced motion |
| Components, T06 | `Component/`, `Twig/Component/FlagComponentTest.php`; `tests/Unit/Twig/Component/` | Props, coercion/defaults/deprecated inputs; DOM attrs/prefixed attrs/classes/slots; behavioral buttons/menus/dialogs/tabs and template overrides without Bootstrap |
| Templates/forms/custom assets, B04/T03/T04 | `Customization/Crud/Templates/{OverrideTemplateTest,OverrideDetailPartialsTest}.php`, `Customization/Crud/Forms/`, `Customization/Dashboard/AssetsControllerTest.php` | Real custom template/form block, custom field/action, asset packages/head/body/importmap/Encore/Reprise/CSP and request results; downstream standalone consumer in Prompt 9 |
| Login, T08 | No dedicated login browser test located | Context and minimal layouts, valid/invalid authentication, custom credential/target/remember-me/CSRF names and keyboard; one submit |
| Welcome/content/exceptions, T09 | `Default/CustomFormPageControllerTest.php`, dashboard tests provide partial coverage | Add standalone/context/no-context/permission-error cases; preserve public messages, escaping, welcome filepath and existing independent page behavior |
| UI kit/profiler, T10/T11 | `UiKit/{UiKitTest,UiKitDebugModeTest}.php`, `DataCollector/{EasyAdminDataCollectorTest,EasyAdminDataCollectorWithoutUiKitTest}.php`, `Performance/NonAdminRequestTest.php` | Every example/foundation page works, theme picker and dialogs interactive; disabled/debug routes unchanged; profiler and neutral app page unaffected |
| Build/install/asset delivery, B01-B04 | `.github/workflows/integration-test.yaml` | Add AssetMapper development/production harness, class-presence proof and package-archive consumer without Node; deployed requests have no Bootstrap runtime at final cutover |

Existing tests sometimes depend on Bootstrap classes/structure. Preserve those
tests in the baseline. During a corresponding migration, update assertions to
equivalent semantic/contract checks with the same behavioral strength; do not
delete checks or loosen them to accept missing functionality. The README in
`tests/Functional/Customization/` claims configuration coverage, not full
browser behavior coverage.

## Reproducible baseline work for Prompt 2

1. Install the PHP requirements using Composer and JS resolution using
   `yarn install --frozen-lockfile`. Record actual resolved PHP packages and
   tooling because the repository does not commit a Composer lock. Avoid
   `make build` for an unchanged JS baseline because it runs `composer update`.
2. Run `make tests` through the repository wrapper. Record failures before
   modifying assertions or fixtures; preserve fail-on-deprecation settings.
   Run scoped suites using the exact paths above when diagnosing failures.
3. Reuse the four existing test applications and Foundry factories, following
   `tests/AGENTS.md`. Set all asserted data explicitly: names, ordering values,
   dates, relationships, permission users, locale and timezone. Use each
   created object's ID instead of hard-coded IDs. Reload from the database
   after requests rather than relying on stale managed objects.
4. Provide a browser harness around the existing application configuration.
   Add only the minimal front controller/console, deterministic seed/reset,
   and real-session/authentication support needed. Browser processes need
   persistent isolated fixtures; DAMA's per-PHPUnit transaction cannot seed a
   separate web process reliably. Keep its database/upload/storage paths
   separate from other tests and any reference-application data.
5. Add a browser runner compatible with the existing package manager. Choose
   and pin it in that stage; none is installed or selected as an existing
   project convention. Document the exact server/seed/test commands only
   after they exist and have been run. Capture HTTP methods, query/body fields,
   failed/confirmed requests and persisted outcomes, not only DOM visibility.
6. Capture desktop/mobile reference screenshots of shell/index/detail/new/edit,
   invalid nested form, filters/sort/action dialogs, login, and representative
   widgets in light/dark and RTL where supported. Record fixture state,
   viewport, browser, scheme, locale, and commit. Store them with the regression
   artifacts established in Prompt 2. They are visual references, not tests of
   server behavior or pixel-match requirements for the new design.

## Commands available today

```bash
make help
composer install
yarn install --frozen-lockfile
make tests
make tests ARGS="tests/Functional/Default/"
make tests ARGS="tests/Functional/Actions/"
make tests ARGS="tests/Functional/FormLayout/"
make tests ARGS="tests/Functional/Fields/"
make tests ARGS="tests/Functional/Customization/"
make tests ARGS="tests/Functional/Security/"
make tests-db DB=postgres
make checks-before-pr
yarn ci
make build-assets
```

Some commands require dependency installation, Docker, or change generated
assets. They are documented commands, not commands all executed in Prompt 1.
Do not invent a currently runnable `bin/console`, browser command, or fixture
route. Build/install proof for AssetMapper starts in Prompt 3 after the harness.

## Prompt 1 result classifications (historical)

Verified in Prompt 1: source paths, dependency constraints/JS lock resolutions,
manifest target presence, existing commands and application infrastructure.
See [progress.md](progress.md) for executed checks and exact outcomes.

Existing source findings: absent reference-app `infra/build-tailwind.sh`,
historical registry keys without files, no browser harness, and documentation
for separate Pro features absent from this package. These are not application
test failures. No behavioral failure is claimed without running a test.

Unverified: all PHP/JS behavior, browser matrix, screenshots, optional Vich path,
production asset builds, and the consuming installation. `vendor/` and
`node_modules/` are absent. Prompt 2 acceptance remains open until a runnable
baseline and explicit gap list are committed.

## Prompt 2 coverage established

`tests/Browser/` provides the necessary browser entry point because DefaultApp's
final kernel forces mock test sessions and cannot serve a real authenticated
browser. It reuses DefaultApp entities/framework configuration and its mixed
form-layout controller, with its own SQLite database, cache, native sessions,
uploads, seed CLI, and real CSRF-protected form login. There is no HTTP reset or
state endpoint. Each test seeds deterministic data and reloads persisted state
through `php tests/Browser/console.php state`. A single worker and fresh server
prevent cross-test races. See [the harness instructions](../../tests/Browser/README.md).

| Added test file | Verified contracts |
| --- | --- |
| `tests/Functional/Default/Search/CombinedListingStateTest.php` | Exact record IDs/order under combined search/filter/sort/page, actual GET search/filter forms, hidden query state, nested custom context, Apply and Reset |
| `tests/Functional/Customization/Crud/Forms/FormThemeExtendingCrudTemplateTest.php` | Existing custom form block plus create/edit POST, CSRF and persisted values |
| `tests/Browser/crud.spec.js` | Index/detail/new/edit, custom field/templates/form block, real external save buttons and button payloads, invalid 422 retained data/no row, combined listing state and real lazy filter Apply/Clear results, canceled/confirmed delete and batch exact POST/CSRF/IDs/outcomes, boolean PATCH header/value/persistence, hidden and directly denied actions, custom POST action, valid/invalid login |
| `tests/Browser/widgets.spec.js` | Remote autocomplete request/results/config lifecycle and persisted association; collection events, unique/nonreused prototype indices and persisted entries; multipart input/bytes/stored file and physical deletion; actual CodeMirror/Trix edits and synchronization; tab hashes/error reveal/focus; cancelable form event and unsaved navigation |
| `tests/Browser/appearance.spec.js` | Navigation URLs/current state and permissions, keyboard menu/focus/Escape, mobile overlay/keyboard/backdrop, light/dark/auto media/storage state, RTL placement, configured CSS/JS/layout overrides, stored layout preferences |

Commands now available:

```bash
make browser-seed
make browser-serve
make tests-browser
EASYADMIN_BROWSER_ALL_ENGINES=1 make tests-browser
EASYADMIN_CAPTURE_REFERENCES=1 make tests-browser
php tests/Browser/console.php state
php tests/Browser/console.php lint:twig tests/Browser/templates
```

The default browser command runs Chromium; the all-engine flag adds Firefox and
WebKit. The runner starts a fresh loopback server on port 8089. Reusing a server
requires explicit `EASYADMIN_BROWSER_REUSE_SERVER=1`. Do not run separate browser
processes against the same fixture storage/port. `EASYADMIN_BROWSER_STORAGE`
can select a separate disposable storage directory.

Fifteen PNG/JSON pairs in `tests/Browser/references/` record original desktop,
mobile, light/dark, RTL, CRUD/form/error, dialog, widget/editor and login
rendering. Metadata records the product baseline, capture commit, engine,
version, viewport, locale, timezone, URL, direction, scheme and test. Assertions
verify behavior independently; there are no pixel-match acceptance assertions.
Do not overwrite original references during migration.

The browser workflow `.github/workflows/browser-tests.yaml` installs the pinned
Yarn resolution and browsers, runs the same Make command on all three engines,
and retains result artifacts. Browser JS/CSS is included in `yarn ci`;
generated result artifacts are excluded from formatting, not from testing.
The CI pattern follows [Playwright's CI guidance](https://playwright.dev/docs/ci-intro),
adapted to this repository's PHP/Yarn tools. Remote CI has not been executed.

## Existing failure retained

The normal default-suite regression `baseline DirtyForm issue: canceled
submission must retain unsaved navigation protection` reproduces an existing
interaction bug. `assets/js/form.js` installs DirtyForm before the cancelable
EasyAdmin submit handler; DirtyForm 0.4.0 clears its dirty state before an
extension cancels `ea.form.submit`. Subsequent navigation loses the unsaved
warning. The test is not skipped, marked as an expected failure, retried, or
excluded. Reproduce with:

```bash
yarn test:browser --grep 'baseline DirtyForm issue'
```

Separate passing tests cover ordinary unsaved navigation and canceled form
submission. Fix the combined interaction in Prompt 7 while keeping the failing
test unchanged. The baseline remains runnable and deliberately reports this
known failure. Exact aggregate engine results are in [progress.md](progress.md).

## Remaining coverage gaps

- Exact minimum engine versions are not installed; current Playwright engines
  cover behavior, not a guarantee for every Tailwind minimum-version boundary.
- Nested collection/editor permutations, repeated initialization and inserted
  CodeMirror/autogrow controls need focused regression cases in Prompts 7/8.
- Optional Vich/Flysystem combinations, image-viewer dynamic/fallback behavior,
  and CSP enforcement need additional fixture cases in their migration stages.
- UI-kit component examples, standalone auxiliary pages and all 31 field
  templates have broad PHP coverage, but not every combination has browser
  interaction coverage yet. Close the inventory rows in Prompt 8.
- Package archive installation, application Tailwind source discovery and the
  AssetMapper production build remain Prompts 3/9/10 work.

No existing PHPUnit test or assertion was removed or weakened. The root
Composer lock stays ignored; resolved versions/source references are preserved
in `reports/stage-2-environment.json`. Tests generate a dependency-version-only
change in AdminRouteApp's tracked `config/reference.php`; that generated diff
was restored rather than included in the migration.

## Prompt 3 build coverage

`tests/Browser/build.spec.js` adds five scenarios, run on Chromium, Firefox and
WebKit (15 passing checks). They verify real development and production
AssetMapper stylesheet/ESM responses, computed daisyUI and responsive styles,
named light/dark themes, inherited application token overrides, local-only
requests, no Bootstrap loading, compiled class inclusion, and an ordinary
Symfony page that retains native styles without Preflight resets.

`tests/build/check-ui-css.js` parses minified CSS with PostCSS and checks actual
selector boundaries, required component/responsive/arbitrary classes, named
layers/themes, and the absence of unresolved build directives, Bootstrap
signatures and global element resets. It does not replace browser checks.

All 3907 PHP tests/11825 assertions still pass. The expanded all-engine browser
run has 87 passes and the same three DirtyForm baseline failures. No new
behavioral failure is accepted. Both the existing Encore development/production
builds and new Tailwind/AssetMapper builds pass; see
`reports/stage-3-build.json`. The source-only component fixture does not prove
real EasyAdmin templates migrated; that remains Prompts 4-8 work.

## Prompt 4 focused coverage

- `tests/Unit/Twig/PresentationExtensionTest.php` exhaustively covers every
  supported width/offset/breakpoint, row pattern, contextual semantic role,
  caller precedence and UI-attribute mapping. It also asserts that numeric
  public setters still emit `col-md-N` and that default field columns remain
  distinct from explicit columns. Unsupported tokens and unrelated action
  metadata remain intact.
- `tests/Browser/layout.spec.js` measures compiled styles without Bootstrap:
  all spans/offsets across ten boundary widths, explicit packing/wrapping,
  default row breaks, offset reset, RTL, numeric/equal/auto vertical fields,
  semantic caller overrides and unlayered application CSS.
- `tests/Browser/primitives.spec.js` exercises native dialogs, menu keyboard/
  pointer behavior, editable menu content, auto-close modes, tabs/history/RTL,
  dynamic initialization, alert dismissal and child-template/slot overrides.
  Dialog opening/canceling must send no submission; confirmation verifies a
  real CSRF-protected POST and exact submitted fields.
- Existing component and consumer tests retain their payload, attribute,
  escaping, label and override assertions. Assertions coupled to Bootstrap
  classes/attributes are updated to the corresponding semantic classes or
  behavior hooks, including error counters. Dot badges remain distinguishable
  from ordinary outline badges through their inner marker.

The existing DirtyForm cancellation regression remains in the normal suite for
Prompt 7. Shell, CRUD-specific interactions, form inheritance and independent
widget initialization still require their later-stage verification; the shared
component proof does not claim those surfaces are complete.
