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
- [ ] **5. Migrate the application shell.** T01/B04/C02-C04/J02-J04/P06:
  header/sidebar/user/locale/settings menus, nested navigation, responsive
  overlay, flashes/content/help, light/dark/auto/layout preferences, CSP/assets,
  template blocks. Keyboard/Escape/focus/scroll/reduced-motion/RTL validation.
- [ ] **6. Migrate CRUD listings, detail pages, and actions.** T02-T03/T07,
  J05-J09/P03-P05: tables/empty/permission states, field values, search/sort
  dialog/pagination, lazy filters/apply/reset, global/row/custom/group/batch
  actions, confirmation/tooltips/popovers, default row actions and selection.
  Real canceled/confirmed outcomes, exact URLs/query/POST/CSRF contracts.
- [ ] **7. Replace the Bootstrap-based Symfony form theme.** T04-T05,
  P01-P02/J10-J11/J13/W07: inherited block audit; neutral complete widgets,
  hidden/rest/CSRF/multipart/errors/labels/help/attrs; ordinary forms, compound
  date/time/choices/repeated fields, tabs/columns/fieldsets/rows/addons and
  nested collections. Valid/invalid persistence and error discovery.
- [ ] **8. Complete field widgets and remaining rendering surfaces.**
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
