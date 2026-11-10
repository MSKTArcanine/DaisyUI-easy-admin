# Migration progress

## Execution rules

Execute one requested prompt/stage at a time. Keep this record and the
[baseline](baseline.md), [inventory](inventory.md), [decisions](decisions.md),
and [coverage](coverage.md) current. Preserve product behavior and public API;
migrate markup/styles/interactions together. Keep Bootstrap/new-style previews
in separate documents. Do not mark a surface migrated because its screenshot
looks complete. Remove temporary preview scaffolding in Prompt 10.

Use a branch derived from each prompt title in lowercase with underscores,
consistent with `AGENTS.md`. Base subsequent stages on accepted preceding work.
Commit all task changes; do not commit the user's untracked files or push
without instructions. Use `:<gitmoji intent>: EAD-N - <imperative intent>`;
for example `:memo: EAD-1 - Record UI migration audit`.

| Stage | Title-derived branch | Commit prefix |
| --- | --- | --- |
| 1 | `audit_and_define_the_migration_boundary` | `:memo: EAD-1 - ` |
| 2 | `establish_behavioral_regression_coverage` | `:test_tube: EAD-2 - ` |
| 3 | `integrate_tailwind_and_daisyui_into_the_asset_build` | `:construction_worker: EAD-3 - ` |
| 4 | `establish_reusable_twig_rendering_and_presentation_adapters` | `:art: EAD-4 - ` |
| 5 | `migrate_the_application_shell` | `:art: EAD-5 - ` |
| 6 | `migrate_crud_listings_detail_pages_and_actions` | `:art: EAD-6 - ` |
| 7 | `replace_the_bootstrap_based_symfony_form_theme` | `:art: EAD-7 - ` |
| 8 | `complete_field_widgets_and_remaining_rendering_surfaces` | `:art: EAD-8 - ` |
| 9 | `prove_downstream_extensibility` | `:test_tube: EAD-9 - ` |
| 10 | `remove_bootstrap_and_perform_final_acceptance` | `:fire: EAD-10 - ` |

Choose the actual gitmoji to match each commit's intent (documentation, fix,
tests, build); EAD numbers identify the stage, not the number of commits.
The continuation request authorizes Prompts 2 through 10 in sequence. Finish
and commit each stage before switching to the next title-derived branch.

## Staged acceptance checklist

- [x] **1. Audit and define the migration boundary.** Read instructions and
  checkout; pin upstream SHA; inspect reference AssetMapper app; enumerate all
  Twig/CSS/JS sources, components, generated assets, PHP styling outputs and
  widgets; record architecture, compatibility boundaries and verification gaps.
- [x] **2. Establish behavioral regression coverage.** Install/reproduce
  dependencies; run existing suites; deterministic fixture/browser harness,
  real requests/persistence, security, cancellation and dynamic-widget tests;
  desktop/mobile/light/dark/RTL/keyboard visual references; record existing
  failures separately. Cover every row of the coverage matrix.
- [x] **3. Integrate Tailwind and daisyUI into the asset build.** B01-B04,
  C01-C02: exact pins in package-manager resolution; local Tailwind 4 compiler,
  required AssetMapper build/delivery, explicit sources/static class maps,
  theme/layer/Preflight decisions, application override discovery, isolated
  Bootstrap-free Twig fixture. Development and minified production proof.
- [x] **4. Establish reusable Twig rendering and presentation adapters.**
  T06/P01-P05/J02/J10: existing component props/slots/classes/attrs/escaping,
  semantic styles, dialog/menu foundations and bounded legacy layout adapter.
  Test columns/defaults/rows/offsets/exact breakpoints and template overrides.
- [x] **5. Migrate the application shell.** T01/B04/C02-C04/J02-J04/P06:
  header/sidebar/user/locale/settings menus, nested navigation, responsive
  overlay, flashes/content/help, light/dark/auto/layout preferences, CSP/assets,
  template blocks. Keyboard/Escape/focus/scroll/reduced-motion/RTL validation.
- [x] **6. Migrate CRUD listings, detail pages, and actions.** T02-T03/T07,
  J05-J09/P03-P05: tables/empty/permission states, field values, search/sort
  dialog/pagination, lazy filters/apply/reset, global/row/custom/group/batch
  actions, confirmation/tooltips/popovers, default row actions and selection.
  Real canceled/confirmed outcomes, exact URLs/query/POST/CSRF contracts.
- [x] **7. Replace the Bootstrap-based Symfony form theme.** T04-T05,
  P01-P02/J10-J11/J13/W07: inherited block audit; neutral complete widgets,
  hidden/rest/CSRF/multipart/errors/labels/help/attrs; ordinary forms, compound
  date/time/choices/repeated fields, tabs/columns/fieldsets/rows/addons and
  nested collections. Valid/invalid persistence and error discovery.
- [x] **8. Complete field widgets and remaining rendering surfaces.**
  T07-T11/J12-J16/W01-W07: all 31 field templates, boolean PATCH, TomSelect,
  file/image/Vich and storage flags, CodeMirror/Trix/slug/textarea/collections,
  basicLightbox, labels, both login paths, welcome/content/both exceptions,
  all UI-kit foundations/examples and profiler. Dynamic initialization once,
  endpoint/event/readonly/validation contracts. Close every source-catalog row.
- [ ] **9. Prove downstream extensibility.** B03-B04/C02-C04/P06: separately
  installed consuming Symfony app using the normal package/archive, AssetMapper
  and asset setup; layout block, field/action template, form block, custom
  field/action, tokens, CSS/JS, class absent from bundle CSS. No vendor edits;
  precompiled install without Node; custom build instructions, Bootstrap
  override/JS migration and upstream maintenance guide.
- [ ] **10. Remove Bootstrap and perform final acceptance.** All inventory
  rows: remove actual Bootstrap packages/imports/runtime/inheritance/skins,
  obsolete CSS and temporary fixtures; conditionally remove Popper; normal
  asset rebuild/manifest/license verification, package/code/HTML/network audit;
  upstream checks plus full behavioral suite and downstream application.
  Review PHP diff and independently review extension/security/generated-asset
  risks. Report historical references/adapter tokens separately from runtime.

## Prompt 1 stage report

Changes made:

- Added the five requested migration records under `docs/ui-migration/`.
- Pinned `bd0fb8448a41f69b3493c5bea84f793e46fe7c21` and recorded branch,
  version, server requirements, exact commands, dependencies and asset hashes.
- Inspected existing components before recommending composition changes.
- Selected Tailwind 4.3.3/daisyUI 5.7.50 as initial pins and defined the required
  AssetMapper path, preserving precompiled package installation and widgets.
- Defined backend/presentation/downstream boundaries, source inventory,
  replacement/extension/verification mapping and the ten-stage checklist.
- Reused the already-created stage-title branch. No product code, dependency,
  generated asset, translation, or API change. `.idea/` remains untouched.

Validation log (2026-11-09):

| Check | Result |
| --- | --- |
| `make help` | Passed; targets recorded in baseline |
| Source/lock/config/test inspection with `rg`, `git`, and Python stdlib | Completed; exact surface catalog and findings in inventory |
| Official Tailwind/daisyUI/Symfony documentation and chosen release tags | Checked; linked in decisions, compatible architecture remains to be built |
| `make linter-docs` | Passed with approved Docker access and `tty: true`: `All files are valid!`; initial attempts hit socket permissions, then missing TTY |
| Documentation link/source-catalog/manifest checks | Passed using Python stdlib: 13 local Markdown links; 290 exact catalog paths, including all 16 JS, 33 stylesheet-directory and 191 template-directory files; 31 actual field templates; 51 manifest targets present; both baseline manifest hashes unchanged |
| `git diff --check`, `git diff --cached --check` | Passed; staged scope is exactly the five requested audit records |
| PHP tests/linters, Twig lint, frontend lint/build, browser suite | Not run: dependency directories absent; this stage changes Markdown records only |
| Reference application's production build | Not run: read-only inspection, missing referenced build script; no changes to that application |

The repository RST linter covers `doc/` only, not `docs/ui-migration/*.md`.
Separate local Markdown link/source-catalog and whitespace validation is needed.
No behavioral baseline pass, screenshot, production build success, or complete
Bootstrap removal is claimed by this audit.

Unresolved issues for later stages:

1. Prompt 2 must establish runnable PHP/browser baselines; no installed
   dependencies, browser harness, or visual references exist here yet.
2. Tailwind's modern browser floor is explicit; no repository browser policy
   was found. Minimum-engine verification and downstream guidance remain open.
3. AssetMapper cannot directly consume the current CommonJS/webpack-specific
   source. Prove CSS compilation/delivery plus retained packaged widgets before
   changing distribution, without imposing the reference app's PHP 8.5 minimum.
4. Optional Vich coverage and usage of historical missing registry templates
   remain unverified. Separate Pro feature documentation is outside this
   package's rendering scope; do not add those features during migration.
5. The reference Dockerfile names a missing script; use supported build commands
   and do not claim its application build is working based on source alone.

Next stage: **Prompt 2 - Establish behavioral regression coverage**, on
`establish_behavioral_regression_coverage`, with commit intent prefix
`:test_tube: EAD-2 - `. Do not implement the rendering migration in this stage.

## Prompt 2 stage report

Branch: `establish_behavioral_regression_coverage`.

Changes made:

- Installed the existing PHP/Yarn dependencies and recorded exact resolved PHP
  package versions/source references in `reports/stage-2-environment.json`.
- Added a minimal isolated browser harness in `tests/Browser/` reusing existing
  entities, framework config and form-layout controller. It provides persistent
  SQLite fixtures, native sessions, real authentication/CSRF, CLI seed/state,
  configured assets and template/form/custom-field/action extensions.
- Added four HTTP regressions and 25 browser scenarios, with request methods,
  payloads, cancellation, permissions, persisted values/bytes, physical upload
  deletion, lifecycle events and keyboard/focus/appearance/RTL assertions.
- Captured 15 PNG/JSON visual-reference pairs. Added Make commands, pinned
  Playwright 1.65.0 through Yarn, lint coverage and a three-engine CI workflow.
- Preserved product code and original distributed asset hashes. Restored the
  generated AdminRouteApp dependency-reference diff; `.idea/` remains untouched.

Validation results:

| Command/check | Result |
| --- | --- |
| Original `make tests` | Passed: 3903 tests, 11776 assertions |
| `make tests` after coverage additions | Passed: 3907 tests, 11825 assertions |
| Focused new HTTP tests | Passed: 5 tests, 51 assertions (one preexisting test included) |
| `EASYADMIN_BROWSER_ALL_ENGINES=1 make tests-browser` | 72 passed, 3 failed: the same existing DirtyForm regression once per Chromium/Firefox/WebKit; 0 skipped/retried/suppressed |
| `yarn ci` | Passed: browser sources included; generated result artifacts excluded from formatting |
| `make linter-phpstan` | Passed |
| `make linter-cs-fixer` | Passed: 0 of 1016 files need changes; existing ruleset deprecation reported |
| `make linter-twig` and fixture Twig lint | Passed: 190 product templates and 5 fixture templates |
| `make linter-docs` | Passed; covers RST documentation |
| Workflow YAML/local Markdown links/JSON/whitespace | Checked locally; remote GitHub workflow not run |

Existing failure: after `ea.form.submit` is canceled, DirtyForm clears dirty
state before cancellation, so later navigation loses the unsaved-change
warning. The combined scenario remains a normal failing test in the default
suite; normal unsaved navigation and canceled submission separately pass.
See `reports/stage-2-browser.json` and `tests/Browser/README.md`. Fix it in
Prompt 7 without weakening or excluding the regression.

Unresolved coverage: exact minimum engine versions, nested/dynamically inserted
editor combinations, optional Vich/Flysystem paths, image-viewer variants and
CSP enforcement need focused checks in the assigned later stages. Consumer
installation and AssetMapper builds have not been implemented yet.

Next: **Prompt 3 - Integrate Tailwind and daisyUI into the asset build**, on
`integrate_tailwind_and_daisyui_into_the_asset_build`. The sequential continuation
through Prompt 10 is authorized; the known baseline failure remains visible.

## Prompt 3 stage report

Branch: `integrate_tailwind_and_daisyui_into_the_asset_build`.

Changes made:

- Pinned Tailwind/CLI 4.3.3 and daisyUI 5.7.50 with Yarn; added compatible
  AssetMapper/TailwindBundle development dependencies through Composer.
- Added isolated CSS sources, explicit discovery/bounded variants, semantic
  light/dark themes, inherited token bridge and scoped defaults without
  Preflight or daisyUI global base effects.
- Added real development and production AssetMapper/ESM fixture routes, separate
  build prefixes/caches, production CSS verification and five browser scenarios.
- Added Make build targets and made browser tests build their required assets.
  Original bundle entry names, named asset package and manifest fixer remain.
- Resolved the demonstrated Biome 1.9/Tailwind 4 parser conflict with Biome
  2.6.6. Preserved prior checked languages/rules, formatted compatible CSS,
  retained icon-unit fallbacks and explicit callback effects. No backend or
  public PHP configuration change.
- Regenerated normal distributed assets through `make build-assets`.
  Bootstrap remains in the main runtime; the isolated preview loads only the
  compiled new stylesheet/module, as verified by network/CSS checks.

Validation results (details in `reports/stage-3-build.json`):

| Command/check | Result |
| --- | --- |
| `make build-ui-dev`, `make build-ui-assets`, `make check-ui-css` | Passed; minified CSS 117494 bytes, required classes/layers/themes present |
| New `build.spec.js` on all engines | Passed: 15/15 |
| Entire all-engine browser suite | 87 passed; same 3 retained DirtyForm failures; 0 skipped |
| `yarn dev`, `make build-assets` | Passed; existing intentional empty-public-path warning reported |
| Manifest/license/font targets | All present; 51 manifest mappings and five font licenses retained |
| `make tests` | Passed: 3907 tests, 11825 assertions |
| PHPStan, PHP CS Fixer, product/fixture Twig lint | Passed |
| `yarn ci` | Passed; existing legacy specificity/important-style and JS advisories remain visible warnings/info |
| CSS formatter normalization | 12 legacy files normalize identically; base icon fallbacks preserved through `@supports` |

Compatibility details and the linter adaptation are in decisions D11-D12.
Application overrides can use inherited tokens/plain CSS immediately; classes
absent from the bundle require an application Tailwind build explicitly scanning
application and bundle Twig/JS/presentation literals. Prove the complete
consumer setup in Prompt 9. Minimum-version browser checks, widget styling and
full Theme API coverage remain for later stages. Do not interpret the isolated
fixture as a migrated EasyAdmin shell or forms.

Next: **Prompt 4 - Establish reusable Twig rendering and presentation adapters**,
on `establish_reusable_twig_rendering_and_presentation_adapters`.

## Prompt 4 stage report

Branch: `establish_reusable_twig_rendering_and_presentation_adapters`.

Changes made:

- Adapted existing Button, Badge, Alert, Switch, Pagination, ActionMenu, Modal
  and Tabs templates to daisyUI, preserving PHP props/enums/computed APIs,
  slots, native/prefixed attributes, translations and escaping.
- Added one internal presentation extension and explicitly registered it.
  Bounded semantic/layout mappings preserve caller overrides, supported legacy
  widths/offsets/rows, exact breakpoint meanings and unrelated custom classes.
- Added scoped primitive/layout/interaction CSS and native dialog/menu/tab
  behavior. Kept tab hashes/history/action links, keyboard/focus behavior,
  disabled actions, dialog validation/cancellation, supported dismissal and
  auto-close policies, and idempotent dynamic initialization.
- Removed competing Bootstrap menu handlers from `page-layout.js`; retained
  early layout preferences. Updated filter-target lookup and error-counter
  hooks without changing action payloads, URL sanitization or form processing.
- Added isolated real-Twig layout/component routes and browser proof, plus
  exhaustive mapping/rendering tests. Updated existing style-coupled assertions
  while retaining their semantic, payload, label, dot-marker and error checks.
- Isolated temporary legacy-only CSS/attribute bridging for the remaining
  Bootstrap pages. No document loads Bootstrap and daisyUI styles together.
  Regenerated distributed assets using the normal build and manifest fixer.

Validation results (details in `reports/stage-4-components.json`):

| Command/check | Result |
| --- | --- |
| `make tests` | Passed: 4140 tests, 12145 assertions |
| Focused mapping rerun after additional dismissal-policy assertions | Passed: 221 tests, 248 assertions |
| Focused all-engine build/layout/native-component proof | Passed: 57/57, no skipped/retried cases |
| `EASYADMIN_BROWSER_ALL_ENGINES=1 make tests-browser` | 129 passed, 3 unchanged DirtyForm baseline failures, 0 skipped/retried |
| Layout measurements | Every span/offset at ten boundary widths; default/explicit wrapping, rows, RTL and vertical fields passed on all engines |
| `make build-assets`, `make build-ui-assets`, production CSS proof | Passed; new CSS 155298 bytes; existing empty-public-path warning retained |
| `yarn ci`, PHPStan, PHP CS Fixer | Passed; 1023 PHP files checked; existing legacy lint warnings remain visible |
| Product and fixture Twig lint | Passed: 190 and 10 templates |
| RST docs, local Markdown links, manifest targets, whitespace | Passed |
| Independent source review | Fixed initial active-tab, disabled-link, menu focus/auto-close/positioning, selector-target and dialog-submission findings |

Unresolved issues and boundaries:

- The retained canceled-submit/unsaved-navigation failure remains assigned to
  Prompt 7. No new regression failure remains from this stage.
- The new layout adapter is proven in isolation; wire it into the real detail
  and form renderers alongside their migrations in Prompts 6-7.
- Shell, CRUD-specific interactions, complete form inheritance and independent
  widgets remain assigned to Prompts 5-8. This stage does not claim those pages
  are Bootstrap-free. Remove all isolated compatibility scaffolding in Prompt 10.
- Exact minimum browser versions and the lower PHP/Symfony dependency matrix
  still require separate verification; current three-engine results do not
  constitute a minimum-version test. Consumer installation remains Prompt 9.

Next: **Prompt 5 - Migrate the application shell**, on
`migrate_the_application_shell`. Continue the authorized sequence through
Prompt 10.

## Prompt 5 stage report

Branch: `migrate_the_application_shell`.

Changes made:

- Migrated shell styling through scoped tokens/layout/sidebar CSS, reusing
  neutral existing Sidebar/menu/flash components and preserving layout blocks,
  template replacement, configured asset includes, locale/direction and nonces.
- Preserved public Theme configuration and actual colors/foregrounds, gray
  ramps, fonts/weights/features, radius and spacing. Kept control density
  bounded while layout spacing scales; inherited root overrides work in dark
  mode. Added translated accessible names consistently in all 39 locales.
- Extracted idempotent shell interactions, retained preference keys/configured
  priority and synchronous appearance/layout initialization, and implemented
  mobile focus/inert/backdrop/scroll/resize handling. Shared scroll ownership
  and focus arbitration preserve nested native dialogs.
- Added real dashboard preview switching, independent compiled font delivery,
  enforced-CSP fixture and HTTP/browser extension/theme/physical-width tests.
  The preview loads no Bootstrap stylesheet or runtime. Temporary legacy CSS
  and preview/font scaffolding remain isolated for removal in Prompt 10.
- Regenerated distributed assets through the normal pipeline. No production
  PHP behavior or public PHP configuration API changed.

Validation results (details in `reports/stage-5-shell.json`):

| Command/check | Result |
| --- | --- |
| `make tests` | Passed: 4142 tests, 12178 assertions |
| Focused all-engine build/component/shell/theme/density/width proof | Passed: 105 unique cases, 0 skipped/retried |
| `EASYADMIN_BROWSER_ALL_ENGINES=1 make tests-browser` | 177 passed, same 3 retained DirtyForm failures, 0 skipped/retried |
| Actual Theme/fonts/CSP/width contracts | Passed on Chromium, Firefox and WebKit, including real configured JS execution and nonce response policy |
| Normal production build, AssetMapper production build/CSS proof | Passed; isolated CSS 189080 bytes; independent font assets shipped |
| PHPStan, PHP CS Fixer, Twig and frontend lint | Passed; 1027 PHP files, 190 product and 12 fixture Twig templates; existing frontend advisories remain visible |
| Documentation, local links, manifest/license targets, whitespace | Passed |
| Independent review | Concrete focus/scroll/menu/token/geometry findings fixed and behaviorally verified |

Unresolved issues and next stage:

- The existing DirtyForm canceled-submit/unsaved-navigation failure remains
  visible and assigned to Prompt 7. No new regression failure remains.
- The normal bundle still loads Bootstrap for unmigrated CRUD/form/widget
  surfaces. Only the shell preview is claimed Bootstrap-free at this stage.
- New accessible-name keys outside English use English placeholders. Existing
  translations remain intact. Exact minimum engine/lower PHP dependency runs
  and standalone consumer installation remain separately recorded gaps.
- Continue with **Prompt 6 - Migrate CRUD listings, detail pages, and actions**,
  on `migrate_crud_listings_detail_pages_and_actions`; then complete the remaining
  authorized stages through Prompt 10.


## Prompt 6 stage report

Branch: `migrate_crud_listings_detail_pages_and_actions`.

Changes made:

- Migrated index/detail tables, empty and permission states, responsive row
  rendering, sorting/selection, action groups and fieldsets/tabs while retaining
  existing paths, blocks, metadata, URLs, hidden state and public APIs.
- Extracted native CRUD interactions with cancel-safe current-target dialogs,
  unchanged delete/batch methods and payloads, idempotent lazy filters and
  complete neutral filter widgets with configured theme precedence.
- Replaced Bootstrap overlays with Popper and isolated DOMPurify; retained
  independent autocomplete/search libraries and delivered their licenses.
  The isolated real CRUD preview loads no Bootstrap CSS or runtime.
- Added real HTTP/browser regressions and regenerated normal distributed
  assets. Product PHP changes are limited to presentation attribute mappings.

Validation details are in `reports/stage-6-listings.json`. The PHP suite passes
4146 tests and 12229 assertions. Four new filter HTTP cases pass 51 assertions;
144 focused native browser cases pass across all three engines. PHPStan,
PHP CS Fixer (1030 files), Twig (191 product, 12 browser, 2 added partials),
frontend lint, documentation lint and both production builds pass. The normal
manifest resolves 55 targets, including three complete dependency licenses;
the isolated AssetMapper build compiles 89 assets and 212814 bytes of CSS.
Existing frontend advisories remain visible. Original screenshots are unchanged.

The full browser rerun before the final legacy delegate refinement passes
216 cases, with only the same three retained
DirtyForm failures (one per engine), no skipped or retried cases. The original
appearance-menu assertion also verifies zero page errors after correcting
Bootstrap keyboard interception during the staged transition. A subsequent
78-case legacy baseline passes 72 cases; three new fixture checks initially
used an unspecified listbox selection. After making that selection explicit,
the fresh final case passes in all three engines, including editable target
handlers, native values and raw legacy dropdown keys. The three original
DirtyForm failures remain visible. No product failure is suppressed.

Unresolved issues and next stage:

- The retained DirtyForm canceled-submit failure remains assigned to Prompt 7.
  The original external-save confirmation dispatch gap is a source finding to
  reproduce and fix alongside submitter/validation coverage in that stage.
- Normal unmigrated forms/widgets still use Bootstrap; the isolated native
  CRUD proof does not declare the final delivered runtime complete.
- Minimum-engine and lower PHP/Symfony matrix runs, standalone installation
  and translated new-key placeholders remain explicit limits.
- Continue with **Prompt 7 - Replace the Bootstrap-based Symfony form theme**
  on `replace_the_bootstrap_based_symfony_form_theme`, then through Prompt 10.


## Prompt 7 stage report

Branch: `replace_the_bootstrap_based_symfony_form_theme`.

Changes made:

- Replaced Bootstrap form inheritance with the local neutral Symfony base and
  one reusable layout trait. All 90 inherited block names remain available;
  the new union contains 91. Core widgets, ordinary forms, localized addons,
  labels/help, hidden/rest/CSRF/multipart, layout, custom attributes and errors
  retain their contracts. Filter rendering shares the same complete theme.
- Migrated form tabs/fieldsets/collections and client invalid appearance.
  Collection prototypes preserve identical nested placeholders, exact names,
  unique indices, custom snippets and row attributes; scripts retain nonces.
- Retained DirtyForm and fixed its canceled native-submit regression. Confirmed
  external saves preserve the original submitter, validation and EasyAdmin
  events. Added the existing confirmation dialog to the new page.
- Added deterministic ordinary and nested fixtures with real HTTP/browser
  submission and persistence checks; preserved original baseline assertions.
  Regenerated normal assets and kept legacy support isolated from new CSS.

Validation results (details in `reports/stage-7-forms.json`):

| Command/check | Result |
| --- | --- |
| `make tests` | Passed: 4150 tests, 12344 assertions |
| New core form HTTP suite | Passed: 4 tests, 62 assertions |
| `EASYADMIN_BROWSER_ALL_ENGINES=1 make tests-browser` | Passed: 270/270, no skipped/retried cases; original DirtyForm test passes in all three engines |
| Final collection row-attribute refinement | Passed: 12/12 nested cases across all three engines, followed by the complete passing PHP suite |
| Ordinary multipart/typed/CSRF and nested persisted values | Passed; POST/PATCH semantics, actual uploaded bytes, server validation, permissions, error discovery and custom attributes verified |
| CSP/dynamic initialization | Trusted prototype script runs once with retained response nonce; lifecycle payloads, unique IDs and custom placeholders verified |
| Builds and CSS proof | Passed: normal 64-file distribution, 55 manifest targets, 90 mapped assets, 218852-byte isolated CSS |
| PHPStan/PHP CS Fixer/Twig/frontend/docs | Passed: 1036 PHP files; 192 product plus 14 fixture Twig templates; 117 frontend files; existing 154 advisories visible |
| Override/block/source review | No inherited block loss, caller attributes preserved, custom badges retained, no production PHP diff in this stage |

Unresolved issues and next stage:

- No known stage 7 behavioral failure remains. Independent widget lifecycle,
  editor/media/upload styling, login/UI-kit and remaining auxiliary rendering
  are explicitly assigned to Prompt 8; the delivered legacy app still loads
  Bootstrap until cutover. This stage claims the new form preview is independent.
- Minimum-engine and PHP8.2 runtime tests, optional external Vich/storage
  integration and independent consumer installation remain separately recorded
  verification limits. New translated keys still use allowed placeholders.
- Continue with **Prompt 8 - Complete field widgets and remaining rendering
  surfaces** on `complete_field_widgets_and_remaining_rendering_surfaces`, then
  complete the authorized downstream proof and final cutover stages.


## Prompt 8 stage report

Branch: `complete_field_widgets_and_remaining_rendering_surfaces`.

Changes made:

- Audited all 31 actual field templates and recorded each retained formatter
  or presentation integration in the inventory. Added accessible image names,
  logical color spacing, neutral unsafe-URL markup and scoped field/media/upload
  skins; preserved configured avatar sizes and primary/muted Boolean roles.
- Retained independent widgets and their distribution entries. Added safe
  repeated/dynamic initialization and disposal, visible hidden-editor validation,
  readonly/disabled behavior, native media keyboard/focus handling and upload
  deletion/preview cleanup while preserving requests/events/persisted values.
- Completed login/content/exception/welcome/UI-kit rendering and scoped prose;
  retained independent profiler/icon sources. Fixed actual tab pointer overlap
  while preserving public component markup and blocks.
- Added 25 deterministic browser cases and six HTTP cases, regenerated assets
  through normal commands and left all production PHP/dependency APIs intact.

Validation (details in `reports/stage-8-widgets.json`):

| Command/check | Result |
| --- | --- |
| `make tests` | Passed: 4156 tests, 12413 assertions |
| `EASYADMIN_BROWSER_ALL_ENGINES=1 make tests-browser` | 345 cases: 344 passed, one Firefox DOMRect precision mismatch; no skips/flaky cases |
| `EASYADMIN_BROWSER_ALL_ENGINES=1 yarn test:browser tests/Browser/field-display.spec.js` after precision-only refinement | Passed: 12/12; exact CSS bounds retained with 0.001px DOMRect tolerance, no product CSS change |
| PHPStan / PHP CS Fixer | Passed: 338 analyzed PHP sources; zero of 1045 files require fixing |
| Twig lint | Passed: 192 product and 16 fixture templates |
| `yarn ci` | Passed: 132 files; 153 existing advisories remain visible |
| `make build-assets` | Passed: final `public/` contains 66 files; 55 manifest targets exist |
| `make build-ui-assets` / production CSS proof | Passed: 97 mapped assets, 249587 CSS bytes; no Bootstrap signature or global Preflight reset in isolated CSS |
| `make linter-docs` | Passed; repository RST scope only |
| Original visual references / production PHP diff | Unchanged references; no production PHP changes |

The complete browser run and focused follow-up are distinct results. The
Firefox failure was subpixel representation of a correct 64px CSS maximum;
the refined test keeps the limit and all behavioral assertions. Source/widget
findings discovered earlier in this stage were fixed and rerun rather than
suppressed. No known stage 8 behavioral failure remains in the tested paths.

Unresolved issues and next stage:

- Installed VichUploader, remote Flysystem round trips, rendered profiler panel,
  PHP8.2 and exact minimum browser versions remain explicitly unverified.
- Normal legacy Bootstrap assets and temporary migration scaffolding remain
  until Prompt 10; independent preview proof does not declare global cutover.
- Continue with **Prompt 9 - Prove downstream extensibility** on
  `prove_downstream_extensibility`, then complete final Bootstrap removal and
  acceptance on the Prompt 10 branch.


## Prompt 9 stage report

Branch: `prove_downstream_extensibility`; build-foundation commit `77076f5eb`.

Changes made:

- Extracted a standalone Framework/AssetMapper/Tailwind maintainer build and
  preserved Yarn/Encore distribution, fonts, manifests and widget entry names.
  Separated fixture source discovery from shipped CSS and proved real watch
  propagation. Added an isolated precompiled CSS entry until final cutover.
- Created `examples/consumer/` with normal pinned Composer ZIP installation,
  its own package-manager locks, Symfony/Doctrine configuration and deterministic
  SQLite data. A fresh copy runs outside this repository without vendor edits.
- Demonstrated all eight requested extension points with actual rendered values,
  configured assets and application-owned compiled utilities; documented stable
  hooks, theme layers/tokens, Bootstrap integration changes and upstream upkeep.
- Added `tests/Consumer/`, `make tests-consumer` and a separate CI job with a
  production PHP-only PATH installation. CI configuration was parsed locally;
  remote CI was not invoked.

Validation (details in `reports/stage-9-consumer.json`):

| Command/check | Result |
| --- | --- |
| Independent development/production build and direct `yarn dev` | Passed; 325625/248286 CSS bytes; mapped/cache/export equality |
| `yarn watch` with `make watch-ui` and real temporary Twig edit | Passed; both compilers updated delivered CSS; probe removed |
| Normal asset build and manifest verification | Passed; 67 files, 56 targets, one independently mapped CSS asset |
| Browser build contract suite, all three engines | Passed: 15/15 |
| Fresh outside Composer `--no-dev`, `assets:install`, `asset-map:compile`, SQLite seed | Passed on PHP 8.3.33/Symfony 6.4.50; Node/Yarn absent from PATH, TailwindBundle absent, copied vendor package |
| Archive reproducibility and installed reference/checksum | Passed; same pinned archive produced identical SHA256 twice |
| `EASYADMIN_BROWSER_ALL_ENGINES=1 make tests-consumer` with outside app/PHP environment | Passed: 15/15, zero skipped/flaky/retried cases |
| PHP CS Fixer / Twig / frontend | Passed: zero of 1068 PHP files fixable; six consumer and 15 browser Twig templates; 142 frontend files, 153 visible advisories |
| Product PHP / original visual references | No production PHP changes; original references unchanged |

Early consumer setup errors were corrected in application configuration and
its custom field signature. Request assertions now verify observed historical
submitter naming and generated URL semantics. No behavior assertion was removed
to make an exception page pass; installation checks require a successful real
index and seeded content. The final complete consumer run passes.

Unresolved issues and next stage:

- Actual PHP 8.2/minimum-browser runtimes and the previously documented optional
  Vich/remote-storage/profiler integrations remain unverified. Composer PHP 8.2
  resolution plus actual PHP 8.3/Symfony 6.4 and PHP 8.5/Symfony 8.1 runs are
  distinct evidence. The temporary PHP 8.3 extension wrapper is host-only tooling.
- Bootstrap remains in the normal distribution until Prompt 10. Stage 9 loads
  isolated daisyUI assets and does not claim global removal.
- Continue with **Prompt 10 - Remove Bootstrap and perform final acceptance**
  on `remove_bootstrap_and_perform_final_acceptance`: remove obsolete runtime
  code/styles/scaffolding, restore original asset entry names for the new UI,
  repeat all behavior/consumer checks and complete independent review.


## Prompt 10 stage report - accepted

Branch: `remove_bootstrap_and_perform_final_acceptance`. Final product/consumer
archive pins `be15cf210ecf45f55ad0312829124039e7c54b23`; all stage branches
and intent-prefixed `EAD-N` commits are retained.

Changes made:

- Removed Bootstrap package/lock/runtime/imports/inheritance/widget theme, old
  theme styles and migration CSS/JS/preview delivery scaffolding. Original
  `app.css`/`app.js`/field entry names now deliver the new UI. Retained Popper
  and independent widgets with their licenses; kept neutral legacy template
  aliases and supported configuration values through the rendering adapter.
- Preserved all 190 baseline Twig paths and their README, overridable blocks,
  Symfony form/component interfaces and public PHP configuration. Production
  PHP changes are only the internal presentation helper and explicit service
  registration; backend/controller/query/security/persistence APIs are unchanged.
- Converted test pages to real shipped assets with application-only utilities;
  removed transient styling modes and retained all behavior assertions. Added
  delivered-runtime/module/network and root/subdirectory manifest checks.
- Completed downstream, theme/source-discovery/asset and human/AI upgrade docs;
  updated shipped skill provenance without increasing its 500-line limit.
  Independently reviewed and fixed prose layering, scope examples, selected-menu
  markers and the intermediate packaging omission; refreshed final references.

Validation (full details in [acceptance.md](acceptance.md) and
`reports/stage-10-acceptance.json`):

| Command/check | Result |
| --- | --- |
| `make checks-before-pr` | Passed: 4168 PHP tests, 12562 assertions; CS/PHPStan/Twig/RST checks pass |
| Final three-engine browser run against actual distribution | Passed: 330/330; zero skipped/unexpected/flaky/retried cases |
| Fresh outside consumer, actual PHP8.3/Symfony6.4, three engines | Passed: 15/15; all eight extension examples and real request/persistence/validation/CSRF outcomes |
| Focused review regressions | Prose/asset/dialog/layout/overlay 12/12; marker regressions reproduce old bug then pass 6/6 |
| Local development/production builds, real watch edit, AssetMapper byte equality | Passed; final UI248582 bytes, appCSS381208 bytes, appJS190743 bytes |
| Dependency/source/compiled/actual resolved module/runtime/network audits | Passed; 221 resolved modules, zero Bootstrap; 13 original entries, all 53 relative manifest targets and original keys |
| Normal Composer ZIP/no-Node production installation | Passed; exact 641-file source parity, strict Composer validation, nonsymlink vendor, no Node/Yarn/TailwindBundle |
| Template/block and production PHP review | All paths/blocks retained; only internal adapter and four service lines added in production PHP |
| Original/final visual references | Original 15 pairs unchanged; separate final 15 pairs match product pin and current manifest |

Six duplicate styling-mode workflows were consolidated with all assertions
retained (18 engine executions removed); the new runtime audit adds three, so
345 becomes 330. Preliminary interrupted runs, fixture corrections and intentional
red regression proofs are separate from accepted complete runs. No test, failure
or functionality was suppressed to declare completion.

Unresolved limits:

- Actual PHP8.2 and exact minimum browsers, a separate Symfony7 runtime and
  PostgreSQL/MySQL/MariaDB execution were not run. Verified runtimes are
  PHP8.5/Symfony8.1/ORM3 and PHP8.3/Symfony6.4/ORM2, with PHP8.2 Composer resolution.
- Installed Vich, remote Flysystem browser integration and a rendered profiler
  panel remain unverified; interfaces and existing source/unit coverage remain.
- Four new accessible-name translation keys use allowed English placeholders
  outside English; existing translations are unchanged. Remote CI was not run.
- One visible frontend advisory documents required native `hidden` precedence.

No known failure remains in accepted checks. No further rendering migration
stage remains; optional environment/integration/localization follow-up is clearly
separate from the completed cutover.
