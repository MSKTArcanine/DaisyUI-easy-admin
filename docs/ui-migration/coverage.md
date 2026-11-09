# Behavioral coverage and verification plan

Status: Prompt 1 source audit. No new fixture, test, screenshot, or product
behavior was implemented. The existing test sources below are evidence of
available infrastructure, not evidence of a passing baseline. Prompt 2 must run
and extend it before rendering changes.

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

## Result classifications

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
