# Bootstrap coupling and rendering inventory

Baseline: `bd0fb8448a41f69b3493c5bea84f793e46fe7c21`, 2026-11-09.
The original matrix records the **audited baseline**. Stage numbers indicate
planned work; implementation status and verified evidence are recorded in the
stage addenda. The matrix's verification column is an acceptance requirement.
Paths are relative to this repository unless stated otherwise. The source
catalog below assigns every shipped Twig/JS/CSS source file to a surface.

Prompt 2 adds behavioral evidence through `tests/Browser/`, combined-state HTTP
tests, and original visual references without changing these rendering sources.
See [coverage.md](coverage.md) and `reports/stage-2-browser.json`; one existing
DirtyForm cancellation/unsaved-navigation failure remains visible for Prompt 7.

Prompt 3 implements the build portion of B01-B04/C01-C02, with all rendering
surfaces still pending. Added paths and evidence:

| Path | Purpose | Verification |
| --- | --- | --- |
| `assets/css/ui-preview.css` | Isolated Tailwind/daisyUI entry, bounded discovery/variants and semantic themes | Local minified CSS parser proof and real computed styles on three engines |
| `assets/css/ui/foundation.css` | Scoped defaults and spacing/font bridge; no Preflight | Neutral-page margin/heading/native button checks |
| `tests/build/check-ui-css.js` | Production CSS/class/layer/isolation proof | `make check-ui-css` |
| `tests/Browser/Controller/PreviewController.php` and `templates/browser/ui_*.html.twig` beneath `tests/Browser/` | Isolated build and neutral-style probes | `tests/Browser/build.spec.js`, development and production servers |
| `tests/Browser/importmap.php`, `public/preview.js`, `Kernel.php`, `services.php` beneath `tests/Browser/` | Real AssetMapper/TailwindBundle/local ESM integration | Production manifest, module initialization, local network and token checks |

The preview entry/routes are isolated migration scaffolding. Adapt or remove
them at final cutover; retain meaningful build regressions against the final
delivered assets. Main Bootstrap imports and dependency removal remain Prompt 10.

## Build, styles, delivery, and extension contracts

| ID / stage | Location and current purpose | Replacement approach | Affected extension points | Required verification |
| --- | --- | --- | --- | --- |
| B01 / 3,10 | `package.json`, `yarn.lock`: Bootstrap 5.3.8, Popper 2.11.8; Encore 5 | Add pinned Tailwind 4/daisyUI 5; remove Bootstrap at final cutover; remove Popper only if unused | Yarn build workflow; consumers' package/runtime expectations | Frozen-lock install, dependency graph audit, development/production builds; inspect bundled code, not class names alone |
| B02 / 3,10 | `webpack.config.js`, `Makefile`, `src/Resources/bin/fix-assets-manifest-file.php`: compiled, hashed distribution | AssetMapper/Tailwind build path with compatible packaged JS; reuse entry names and manifest fixing | `public/manifest.json`, `public/entrypoints.json`, font URLs and licenses | Build twice reproducibly; all manifest targets exist; subdirectory asset URLs; no missing fonts |
| B03 / 3,9 | `src/Asset/AssetPackage.php`, `config/services.php`: named asset package at `/bundles/easyadmin` | Preserve precompiled install; add tested AssetMapper consumer setup | `Assets`, `Asset`, default asset package, `assets:install` | Install package archive in fresh Symfony app without Node; verify deployed asset responses and custom packages |
| B04 / 5,9 | `templates/includes/`, `templates/layout.html.twig`: plain CSS/JS, Encore, Reprise, importmap, head/body injection | Preserve includes, ordering, nonce guards, preload/async/defer/HTML attributes | `Assets::addCssFile()`, `addJsFile()`, `addAssetMapperEntry()`, Encore/Reprise entries, page-restricted assets | Customization asset tests plus actual network/CSP/subdirectory checks; importmap application runs once |
| C01 / 3,4,5 | `assets/css/app.css`, `layers.css`, `easyadmin-theme/theme.css`: Bootstrap CSS vendor layer, FontAwesome, EA layers | Isolated new CSS entry; final Bootstrap-free `app.css`; preserve independent icon CSS | Unlayered app overrides, layer order, three standalone CSS outputs | Separate preview documents; inspect emitted layers, required classes, style leakage and icons |
| C02 / 3,5,9 | `easyadmin-theme/{design-tokens,variables-theme,color-palette,fonts}.css`, `src/Config/Theme.php`, `src/Config/Option/`: existing semantic tokens and Theme API | Map `--ea-*`, fonts/gray/primary/radius/spacing into daisyUI roles; light/dark root | Theme configuration, font choices, custom properties | Custom Theme values affect every primitive; contrast, first paint, RTL, fonts/licenses, light/dark/system |
| C03 / 4-8,10 | `assets/css/easyadmin-theme/`: component, page, Bootstrap selector overrides and utilities | Use daisyUI/Tailwind and scoped layout/widget CSS; delete obsolete Bootstrap overrides | Custom CSS using `.form-control`, `.dropdown-*`, `.modal-*`, Bootstrap variables | Audit each catalog file; component/browser tests; verify application styles override appropriately |
| C04 / 5,8,9 | `base.css`, `prose.css`, `prose-defaults.css`: custom-page typography and exclusions for components | Scoped prose styling and small base defaults; omit global Tailwind Preflight initially | `page/content.html.twig`, `.ea-prose`, custom rich HTML and third-party content | Rich content still formats; buttons/tables/widgets not restyled by prose; neutral application page/profiler unaffected |

## JavaScript and observable interaction contracts

| ID / stage | Location and purpose/coupling | Replacement approach | Affected extension points | Required verification |
| --- | --- | --- | --- | --- |
| J01 / 5,6,8 | `assets/js/app.js`: imports `bootstrap/dist/js/bootstrap.bundle`, exposes `window.bootstrap`, initializes shell, CRUD, tooltips/popovers | Separate focused vanilla modules, keep `window.EasyAdminApp` compatibility where used; remove Bootstrap global with migration guide | Existing data hooks; downstream Bootstrap calls require changes | Whole-page initialization once; no duplicate handlers; all specific flows below |
| J02 / 4,5,6 | `page-layout.js`, `components/ActionMenu/`, `crud/action_group.html.twig`: `window.bootstrap.Dropdown`, Popper config, `hide.bs.dropdown` and `hidden.bs.dropdown`; submenu keyboard/pointer/exit animation | Existing ActionMenu interface with managed menu state, positioning, keyboard navigation, Escape and focus restoration | Attributes/slots, action-group split button, selectable radio/checkbox menus, forms inside menus | Enter/Space/arrows/Home/End as applicable; nested menus; Tab/outside click; pointer drag; reduced motion; forms execute once |
| J03 / 5 | `app.js` shell methods, `page-layout.js`: sidebar accordion, mobile overlay, layout toggles/localStorage | Preserve independent logic, replace Bootstrap-looking backdrop styling and class selectors | `ea/sidebar/width`, `ea/content/width`, configured width priority, navigation IDs | Mobile open/close/Escape/backdrop, scrolling/focus restoration; nested menu state; remembered/configured layouts |
| J04 / 5 | `page-color-scheme.js`: `.ea-light-scheme`/`.ea-dark-scheme`, `data-bs-theme`, media query, duplicated selectors | Single resolved theme state with daisyUI `data-theme`, retain preferences and current flags | `ea/colorScheme`, `data-ea-default-color-scheme`, disabled dark mode, `head_theme` block | Initial paint, auto updates, persisted choice, both menus synchronized, disabled dark mode |
| J05 / 4,6 | `app.js::#createFilters()`, `crud/filters.html.twig`, `_filters_modal.html.twig`: lazy GET HTML, Bootstrap Modal and collapse controls | Modal component/dialog plus explicit initialization after insertion | `data-ea-filters-form-id`, `filters[property]`, hidden flattened GET parameters | Apply/reset produces correct results/URL; unchecked filters removed; combined search/sort/page/custom parameters; malicious cross-origin URL rejected |
| J06 / 4,6 | `app.js::#createBatchActions()`, `_batch_action_modal.html.twig`: select all/range/inert action toolbar and Bootstrap modal | Preserve selection/payload logic, replace dialog/toggle selectors and visual state classes | POST `batchActionName`, `entityFqcn`, `batchActionUrl`, `batchActionCsrfToken`, `batchActionEntityIds[i]`; `data-action-batch-no-confirm` | Cancel sends no request; confirm once deletes only selected permitted rows; reopen after cancel; invalid token/FQCN/empty selection; custom action and no-confirm path |
| J07 / 4,6 | `app.js::#createActionConfirmationModals()`, `_action_confirmation_modal.html.twig`: shared modal, text placeholders, pending action callback | Native dialog behind existing Modal API, explicit cancel/confirm state | POST hidden `token` from `csrf_token('ea-delete')`, `formaction`, `data-ea-action-form-id`, parent form, GET `href` paths; `data-action-confirmation-*` | All four execution paths, custom titles/content, no unintended submit, cancel/reopen/double activation, CSRF denial, persisted result, focus restoration |
| J08 / 6 | `app.js::#createDefaultRowAction()`, `#createSearchHighlight()`, content help, filter handlers; `helpers.js` | Preserve behavior with independent `data-ea-*` hooks; keep Mark.js and URL sanitizer | Click/double-click, Enter/middle/modifier click; interactive-cell exclusions; `data-default-action-url`; `toggleVisibilityClasses()` | Row URL/security/selection and link-target semantics; nested highlights, content help keyboard interaction, filter date/comparison widgets |
| J09 / 6,8 | `app.js` Popover/Tooltip constructors; code/text field modal triggers | Accessible disclosure/tooltips and existing Modal component, no Bootstrap runtime | `data-bs-toggle="tooltip"/"popover"`, field content/HTML options require downstream migration | Hover/focus/Escape, accessible names; long code/text content available; no unwanted HTML execution |
| J10 / 4,7 | `tabs.js`, `components/Tabs/Item.html.twig`: `bootstrap.Tab`, `shown.bs.tab`, `tablist-*`, hash/history and detail/edit link rewriting | Tabs component with explicit selected state and keyboard navigation | Existing component props and panes; edit/detail hash; form validation `setTabAsActive()` | Reload/hash/back/forward; middle-click/copy link; form-action links excluded; error tab activated and focused |
| J11 / 7 | `form.js`: DirtyForm, error badges/classes, Bootstrap Collapse, submit-button actions, invalid control focus | Preserve DirtyForm and form submit logic; adapt tab/fieldset reveal and state hooks | Cancelable document `ea.form.submit` and `ea.form.error`, detail `{page, form}` | Values/errors survive invalid submit; canceling event prevents submit; collapsed ancestors open; submit button name/value; unsaved confirm/cancel and successful navigation |
| J12 / 8 | `field-boolean.js`, `crud/field/boolean.html.twig`, Switch | Keep toggle request, move styling/selector coupling to explicit hooks | PATCH to existing `data-toggle-url` plus `newValue=true/false`, `X-Requested-With: XMLHttpRequest` | Database value changes; denied/error request reverts and disables; readonly/permitted display |
| J13 / 7,8 | `field-collection.js`, collection form blocks: Bootstrap accordion `.show`/`.collapsed`, escaped prototypes, add/remove handlers | Keep collection engine and event contracts, independent collapsible state and idempotent binding | `data-prototype`, prototype names/index, permissions; document `ea.collection.item-added` detail `{newElement, collection}`, `ea.collection.item-removed` detail `{deletedElement, collection}` | Nested prototype substitution/IDs/indexes, add/remove permissions, submit persisted nested changes; no duplicate handlers on reinitialization |
| J14 / 6,8 | `autocomplete.js`: TomSelect, inserted filter and collection fields; theme is Bootstrap-derived | Retain TomSelect/plugins/config events/guard; neutral skin and token adapter | Element events `ea.autocomplete.pre-connect` detail `{config, prefix}`, `ea.autocomplete.connect` detail `{tomSelect, config, prefix}`, bubbles; `assets/types.d.ts` types | Remote query/results/next_page, groups/preferred values/HTML opt-in, required/disabled/multiple, hooks modify config, inserted fields initialize once |
| J15 / 8 | `field-file-upload.js`: card/drop-zone and `d-none` visibility; `ea_fileupload_widget`, optional Vich blocks | Keep uploads/previews/delete bookkeeping; replace Bootstrap utility hooks only | Original multipart names, `deleted_files`, deletion flags, limits, Flysystem/download URLs | Actual upload bytes and persisted filenames; previews/replacement/removal/clear-all, forbidden inline formats, validation and collection insertion |
| J16 / 8 | `field-code-editor.js`, `field-text-editor.js`, `field-textarea.js`, `field-slug.js`, `field-image.js`, `login.js` | Keep independent libraries; change wrappers/error state/visibility and modal integration | Editor options/data/language, Trix hidden textarea/CSP meta nonce; slug lock/targets, textarea sizing, lightbox selector, login double-submit prevention | Real edited value submitted; required/readonly/disabled, long-content viewer, dynamic collection widgets, slug confirm, Escape/modifier-click/fallback, login POST once |

`helpers.js::sanitizeUrl()` allows http/https/mailto/tel and optionally requires
same origin. Filters fetch HTML only after the same-origin check. Row action
URLs also pass sanitization. Preserve both checks. Bootstrap lifecycle events
are implementation coupling; public EasyAdmin events above remain intact.
Do not infer that every current flow is already idempotent: specifically test
repeated collection initialization in Prompt 2 and fix only in its migration
stage if a baseline failure is reproduced.

## Twig composition, pages, components, and forms

| ID / stage | Locations and purpose | Replacement approach | Affected extension points | Required verification |
| --- | --- | --- | --- | --- |
| T01 / 5 | `templates/layout.html.twig`, `menu.html.twig`, `flash_messages.html.twig`: shell, nested menus, user/locale/theme controls, search, content/help/actions | Compose existing Sidebar, ActionMenu, Alert with daisyUI; preserve configured URLs and permission output | All layout blocks, `ea.templatePath('layout'/'main_menu'/'flash_messages')`; body data, configured assets | Child overrides `header_logo`, `sidebar_footer`, `main`, `body_javascript`; active/hidden menu, locale, flash dismissal and accessible mobile behavior |
| T02 / 6 | `crud/index.html.twig`, `paginator.html.twig`, `action.html.twig`, `action_group.html.twig`, includes: listing/sorting/filtering/actions | Tailwind/daisyUI table/actions/dialog/pagination components | Index/page/batch/table blocks, default row action, permission/empty output, action metadata | State/URLs/results, selection and all actions; sort dialog on mobile and multiple-field server sorting; keyboard table links |
| T03 / 6,7 | `crud/detail.html.twig`, all `crud/detail/` partials: columns, fieldsets, tabs, grouped fields | Same configured detail partial lookup and FormLayoutFactory output; presentation adapter | `TemplateRegistry` keys `crud/detail/*` and child blocks | Override partials still used; translated labels/help, inaccessible/null values, columns/tab/fieldset behavior |
| T04 / 7 | `crud/new.html.twig`, `edit.html.twig`, `form_theme.html.twig`: Symfony forms and EA layout/widget blocks | Preserve theme entry path; derive from neutral blocks with complete widgets | `setFormThemes()`, `addFormTheme()`, field `block_name`, caller row/widget attrs; normal Symfony forms | Valid/invalid real POST, CSRF, multipart, names/IDs/values, form_rest/hidden fields, ordinary forms without EA context |
| T05 / 7,10 | `symfony-form-themes/bootstrap_5_layout.html.twig` -> `bootstrap_base_layout.html.twig` -> `form_div_layout.html.twig`; `README.txt` describes Symfony 5.4 copies | Audit inherited hierarchy; replace Bootstrap inheritance, retain neutral base and attribution | Downstream direct Bootstrap inheritance requires migration; stable Symfony block names | Text, textarea, choices/optgroups/expanded, checkbox/radio, range/color, date/time/datetime/dateinterval, money/percent/number, file, repeated, compound, help/errors/labels and attrs |
| T06 / 4-8 | `templates/components/` and `src/Twig/Component/`: class-backed Alert, Badge, Button, Flag, Icon, Pagination; anonymous ActionMenu, Modal, Sidebar, Switch, Tabs and children | Adapt existing components; preserve sizes/radius/options and slots; no new component system | `ea` prefix, native/prefixed attributes, deprecated props, `attributes.defaults()`; Button link/form/method override | Unit coercion tests plus rendered attributes/slots/overrides, translation domains, escaping, inactive links, forms/CSRF and component documentation tests |
| T07 / 6,8 | All 31 actual files in `crud/field/`, four `label/` templates | Keep formatting/data/permission logic; switch visual wrappers/badges/viewers | Configured field templates and `label/empty`, `inaccessible`, `null`, `undefined` | Each field family in all supported pages, empty/null/permission states, formatted/custom HTML, escaping and viewer content |
| T08 / 8 | `page/login.html.twig`, `page/login_minimal.html.twig`: context/no-context login with form controls and flashes | Both paths use migrated controls/styles and existing login JS | Login blocks/parameter names/action/target/CSRF/remember-me/forgot-password; minimal asset blocks | Real authentication request in harness, invalid credentials/errors, custom parameters, CSRF, both layouts, keyboard and asset load |
| T09 / 8 | `page/content.html.twig`, `exception.html.twig`, `exception_standalone.html.twig`, `welcome.html.twig` | Shared content/errors use new shell; standalone pages retain independent CSS where appropriate | Conditional layout inheritance without EA context; exception public-message translation; welcome controller filepath | Context/no-context render, inaccessible/error messages escaped as before, standalone page without bundle JS/CSS, responsive/reduced-motion welcome behavior |
| T10 / 8 | `templates/ui_kit/`, `src/UiKit/UiKitController.php`: `/_ea_ui_kit`, components and foundation/theme examples | Migrate demo markup, inline scripts, token picker and source examples with components | Debug/parameter availability, foundation/component routes, props/blocks documentation | Every component/foundation page renders and works; no Bootstrap examples/runtime left; disabled/debug routing unchanged |
| T11 / 8 | `templates/inspector/{data_collector.html.twig,icon.svg.twig,icon-v3.svg.twig}` | Preserve profiler integration; adjust only coupled presentation if needed | Symfony profiler tabs, theme switch/source links | Profiler and non-admin requests work; no admin style leakage or unauthorized UI-kit enablement |

Field catalog families (all retain formatting and configured templates):

- Values/text: `generic`, `hidden`, `id`, `text`, `textarea`, `array`.
- Links: `email`, `telephone`, `url`; preserve targets and URL handling.
- Numbers: `integer`, `number`, `money`, `percent`.
- Date/time: `date`, `datetime`, `time`.
- International: `country`, `currency`, `language`, `locale`, `timezone`.
- Choices/relations: `boolean`, `choice`, `association`, `collection`.
- Media/editors: `avatar`, `image`, `file`, `color`, `code_editor`, `text_editor`.

`TemplateRegistry.php` also accepts historical field template keys with no
corresponding file in this checkout; see the catalog finding below. Do not
create new field behavior or silently remove these keys as part of styling.

## PHP presentation values

| ID / stage | Source and meaning | Rendering replacement | Extension points | Required verification |
| --- | --- | --- | --- | --- |
| P01 / 4,7 | `src/Field/FieldTrait.php::setColumns()/setDefaultColumns()`, `src/Field/FormField.php::addColumn()/addRow()`, `src/Dto/FieldDto.php`; field constructors set default col strings | Narrow token adapter at Twig boundary; numbers mean md width; responsive spans/offsets/auto/equal/wrapping | Public numeric/string layout inputs and arbitrary added classes stay accepted | Bounded parser and rendered width tests at 575/576, 767/768, 991/992, 1199/1200, 1399/1400px; defaults/nested/explicit widths and unrelated classes |
| P02 / 4,7 | `src/Field/Configurator/FormConfigurator.php` creates `d-none d-{breakpoint}-flex flex-{breakpoint}-fill`; `src/Factory/FormLayoutFactory.php` builds form/detail layout and assigns `col-12` within columns | Interpret generated row/layout strings in presentation; preserve form tree and grouping | Row breaks, tabs, columns, fieldsets, error counts | Existing FormLayout tests, mixed layouts, explicit row breaks and validation reveal; do not change tree/data logic |
| P03 / 4,6 | `src/Config/Action.php`, `ActionGroup.php`, `src/Dto/ActionDto.php`, `ActionGroupDto.php`, `src/Twig/Component/Button.php` and option enums | Map semantic color/style and recognized legacy `btn-*` tokens; preserve custom classes and deprecated enum cases | Public action styling/priority/classes, default variant selection, split/group actions and custom colors | Same action/button configuration semantics and attrs; default neutral, danger/error, all variants; no action URL/method/permission changes |
| P04 / 4,6 | `src/Factory/ActionFactory.php` emits Bootstrap modal attributes beside action metadata and CSRF tokens | Renderer adapter translates modal hooks; a minimal presentation-only attribute change is acceptable if required | `data-action-*`, batch CSRF tied to action/entity FQCN, `formaction`, confirmation text | PHP diff limited to hooks; identical URL/token/payload/permissions; downstream Bootstrap hook migration documented |
| P05 / 4,5,6 | `src/Dto/MenuItemBadgeDto.php`, `FormTabBadgeDto.php`, `src/Field/Configurator/ChoiceConfigurator.php`, Badge/Alert option enums | Map predefined style names; preserve raw CSS style, HTML attributes, callable values, zero-visible badge behavior | Menu/tab/choice badges, alerts/flash variants, custom Badge color/variant | All colors/variants, callable and zero/false/null content; custom CSS attrs/styles retained, escaping/domain behavior |
| P06 / 5,9 | `src/Config/Theme.php`, `Assets.php`, `Asset.php`, Dashboard/Crud presentation options | CSS/token/rendering adapters; preserve builders and DTOs | Theme/font/palette/size/radius, asset package and CSP config, content/sidebar preferences | Existing configuration/asset tests and consuming-app examples; no public signature changes |

## Independent and optional integrations

| ID / stage | Dependency/source | Disposition | Extension points and required verification |
| --- | --- | --- | --- |
| W01 / 8 | TomSelect; `assets/css/easyadmin-theme/autocomplete.css` explicitly forks `tom-select.bootstrap5.min.css` | Retain widget; replace Bootstrap-derived skin with neutral/token styling, not a renamed copy of Bootstrap | Config/plugin API, remote groups/virtual scroll and lifecycle events; keyboard, selected results, lazy/nested widgets, persisted associations |
| W02 / 8 | CodeMirror 5; `form-type-code-editor.css`, `field-code-editor.js` and modes | Retain editor; small token integration and Bootstrap-free field viewer | Language/indent/line/autorefresh/readonly config, textarea value; actual edited content and visibility after tabs/collapse |
| W03 / 8 | Trix; `form-type-text-editor.css`, `field-text-editor.js` | Retain editor and toolbar; adapt error/field wrappers | Hidden textarea synchronization, cancelable form event, required validation, CSP style nonce, trusted rich content |
| W04 / 8 | basicLightbox; `field-image.js`, `easyadmin-theme/images.css` (adapted independent lightbox CSS) | Retain independent viewer | Delegated dynamic thumbnails, Escape listener lifetime, modifier clicks, fallback original URL and preview limits |
| W05 / 6-8 | DirtyForm, Mark.js, slugify; named JS modules in J08/J11/J16 | Retain independent libraries | Unsaved submit/cancel, search marks, slug lock/confirmation/multiple targets; no duplicate dynamic bindings |
| W06 / 4,8,10 | FontAwesome including v4/v5 shims; five Fontsource font families; `assets/icons/`, `assets/images/`, Icon/Flag | Retain assets, fonts/licenses, independent SVG rendering | Custom icon set/prefix, flags/unknown flag, file-type icons, font choices; local asset requests and no broken relative URLs |
| W07 / 7,8 | `crud/form_theme.html.twig` blocks `vich_file_*`, `vich_image_*`; File/Image configurators and upload types | Preserve optional Vich integration and independent upload server handling | If package available, test real compound field upload/delete; explicitly mark unverified optional path otherwise; preserve view/download security flags |

## Findings that are not implemented features

`doc/content-lock.rst` and `doc/fields/MarkdownEditorField.rst` exist, but no
matching content-lock/MarkdownEditor implementation, template, entrypoint, or
package dependency was found in `src/`, `templates/`, `assets/`, or manifests.
`README.md` identifies these as separate EasyAdmin Pro features, along with
Audit Log and Messenger Inspector. They are outside this package's rendering
boundary. CodeMirror's Markdown mode is present. Do not add Pro features based
only on documentation names. Recheck if package contents change in later stages.

The standalone welcome page defines small utilities itself and uses external
confetti code; the standalone exception page has independent inline CSS.
Neither is proof of a Bootstrap runtime dependency. Classify them separately
and verify their behavior/security without expanding this styling task.

## Reproduce the source audit

Run from the repository root:

```bash
git status --short --branch
git log -1 --format=fuller
git describe --tags --always --dirty
git ls-files public
rg --files assets/js assets/css templates src/Twig/Component
rg -n 'bootstrap|data-bs-|\.bs\.' assets templates src package.json webpack.config.js
rg -n 'col-|offset-|setColumns|setDefaultColumns|btn-|badge-' src/Field src/Dto src/Factory src/Twig
rg -n 'dispatchEvent|CustomEvent|fetch\(|method:|sanitizeUrl' assets/js
rg -n 'use |block ' templates/crud/form_theme.html.twig templates/symfony-form-themes
rg --files tests/Functional tests/Unit
```

Searches identify evidence; the tables above also include indirect coupling
such as inherited form blocks, independently styled widgets, generated assets,
configuration outputs, and auxiliary pages. At final acceptance inspect package
resolution, delivered code, rendered pages and network traffic together.

## Complete source catalog

The following catalog is generated from the baseline source tree, excluding
binary/static icon artwork. Each ID links to a replacement and verification
requirement above. File presence does not imply a passing behavior check.

### JavaScript (16 files)

| Exact path | Inventory ID |
| --- | --- |
| `assets/js/app.js` | J01, J03, J05-J09 |
| `assets/js/autocomplete.js` | J14 / W01 |
| `assets/js/field-boolean.js` | J12 |
| `assets/js/field-code-editor.js` | J16 / W02 |
| `assets/js/field-collection.js` | J13 |
| `assets/js/field-file-upload.js` | J15 |
| `assets/js/field-image.js` | J16 / W04 |
| `assets/js/field-slug.js` | J16 / W05 |
| `assets/js/field-text-editor.js` | J16 / W03 |
| `assets/js/field-textarea.js` | J16 |
| `assets/js/form.js` | J11 |
| `assets/js/helpers.js` | J08 |
| `assets/js/login.js` | J16 / T08 |
| `assets/js/page-color-scheme.js` | J04 |
| `assets/js/page-layout.js` | J02-J03 |
| `assets/js/tabs.js` | J10 |

### Stylesheets (32 CSS files and a license)

| Exact path | Inventory ID |
| --- | --- |
| `assets/css/app.css` | C01 |
| `assets/css/easyadmin-theme/LICENSE.md` | C01 (retain attribution) |
| `assets/css/easyadmin-theme/action-menu.css` | J02 / C03 |
| `assets/css/easyadmin-theme/alerts.css` | T06 / C03 |
| `assets/css/easyadmin-theme/autocomplete.css` | W01 |
| `assets/css/easyadmin-theme/badges.css` | P05 / T06 |
| `assets/css/easyadmin-theme/base.css` | C04 |
| `assets/css/easyadmin-theme/buttons.css` | P03 / T06 |
| `assets/css/easyadmin-theme/color-palette.css` | C02 |
| `assets/css/easyadmin-theme/content-search.css` | J08 / T01 |
| `assets/css/easyadmin-theme/datagrids.css` | T02 |
| `assets/css/easyadmin-theme/design-tokens.css` | C02 |
| `assets/css/easyadmin-theme/detail-page.css` | T03 |
| `assets/css/easyadmin-theme/errors.css` | T09 |
| `assets/css/easyadmin-theme/fields.css` | T07 |
| `assets/css/easyadmin-theme/fonts.css` | C02 / W06 |
| `assets/css/easyadmin-theme/forms.css` | T04-T05 |
| `assets/css/easyadmin-theme/images.css` | W04 |
| `assets/css/easyadmin-theme/modals.css` | T06 / J07 |
| `assets/css/easyadmin-theme/pages.css` | T08-T10 |
| `assets/css/easyadmin-theme/pagination.css` | T02 / T06 |
| `assets/css/easyadmin-theme/prose-defaults.css` | C04 |
| `assets/css/easyadmin-theme/prose.css` | C04 |
| `assets/css/easyadmin-theme/sidebar.css` | T01 / J03 |
| `assets/css/easyadmin-theme/switches.css` | T06 / J12 |
| `assets/css/easyadmin-theme/tabs.css` | T06 / J10 |
| `assets/css/easyadmin-theme/theme.css` | C01 |
| `assets/css/easyadmin-theme/utilities.css` | C03 / P01 |
| `assets/css/easyadmin-theme/variables-theme.css` | C02 |
| `assets/css/easyadmin-theme/vendor-overrides.css` | C03 |
| `assets/css/form-type-code-editor.css` | W02 |
| `assets/css/form-type-text-editor.css` | W03 |
| `assets/css/layers.css` | C01 |

### Twig and theme documentation (191 files)

| Exact path | Inventory ID |
| --- | --- |
| `templates/components/ActionMenu/ActionList/CheckboxList.html.twig` | T06 |
| `templates/components/ActionMenu/ActionList/Content.html.twig` | T06 |
| `templates/components/ActionMenu/ActionList/Divider.html.twig` | T06 |
| `templates/components/ActionMenu/ActionList/Header.html.twig` | T06 |
| `templates/components/ActionMenu/ActionList/Item.html.twig` | T06 |
| `templates/components/ActionMenu/ActionList/ItemGroup.html.twig` | T06 |
| `templates/components/ActionMenu/ActionList/RadioList.html.twig` | T06 |
| `templates/components/ActionMenu/ActionList.html.twig` | T06 |
| `templates/components/ActionMenu/Button.html.twig` | T06 |
| `templates/components/ActionMenu/Overlay.html.twig` | T06 |
| `templates/components/ActionMenu.html.twig` | T06 |
| `templates/components/Alert.html.twig` | T06 |
| `templates/components/Badge.html.twig` | T06 |
| `templates/components/Button.html.twig` | T06 |
| `templates/components/Flag.html.twig` | T06 |
| `templates/components/Icon.html.twig` | T06 |
| `templates/components/Modal/Close.html.twig` | T06 |
| `templates/components/Modal/Trigger.html.twig` | T06 |
| `templates/components/Modal.html.twig` | T06 |
| `templates/components/Pagination.html.twig` | T06 |
| `templates/components/Sidebar/Content.html.twig` | T06 |
| `templates/components/Sidebar/Footer.html.twig` | T06 |
| `templates/components/Sidebar/Group.html.twig` | T06 |
| `templates/components/Sidebar/Header.html.twig` | T06 |
| `templates/components/Sidebar/Item.html.twig` | T06 |
| `templates/components/Sidebar/Submenu.html.twig` | T06 |
| `templates/components/Sidebar.html.twig` | T06 |
| `templates/components/Switch.html.twig` | T06 |
| `templates/components/Tabs/Item.html.twig` | T06 |
| `templates/components/Tabs.html.twig` | T06 |
| `templates/crud/action.html.twig` | T02 |
| `templates/crud/action_group.html.twig` | T02 |
| `templates/crud/detail/column_close.html.twig` | T03 |
| `templates/crud/detail/column_group_close.html.twig` | T03 |
| `templates/crud/detail/column_group_open.html.twig` | T03 |
| `templates/crud/detail/column_open.html.twig` | T03 |
| `templates/crud/detail/field_group.html.twig` | T03 |
| `templates/crud/detail/fieldset_close.html.twig` | T03 |
| `templates/crud/detail/fieldset_open.html.twig` | T03 |
| `templates/crud/detail/layout_field.html.twig` | T03 |
| `templates/crud/detail/tab_close.html.twig` | T03 |
| `templates/crud/detail/tab_group_close.html.twig` | T03 |
| `templates/crud/detail/tab_group_open.html.twig` | T03 |
| `templates/crud/detail/tab_list.html.twig` | T03 |
| `templates/crud/detail/tab_open.html.twig` | T03 |
| `templates/crud/detail.html.twig` | T02 |
| `templates/crud/edit.html.twig` | T04 |
| `templates/crud/field/array.html.twig` | T07 |
| `templates/crud/field/association.html.twig` | T07 |
| `templates/crud/field/avatar.html.twig` | T07 |
| `templates/crud/field/boolean.html.twig` | T07 |
| `templates/crud/field/choice.html.twig` | T07 |
| `templates/crud/field/code_editor.html.twig` | T07 |
| `templates/crud/field/collection.html.twig` | T07 |
| `templates/crud/field/color.html.twig` | T07 |
| `templates/crud/field/country.html.twig` | T07 |
| `templates/crud/field/currency.html.twig` | T07 |
| `templates/crud/field/date.html.twig` | T07 |
| `templates/crud/field/datetime.html.twig` | T07 |
| `templates/crud/field/email.html.twig` | T07 |
| `templates/crud/field/file.html.twig` | T07 |
| `templates/crud/field/generic.html.twig` | T07 |
| `templates/crud/field/hidden.html.twig` | T07 |
| `templates/crud/field/id.html.twig` | T07 |
| `templates/crud/field/image.html.twig` | T07 |
| `templates/crud/field/integer.html.twig` | T07 |
| `templates/crud/field/language.html.twig` | T07 |
| `templates/crud/field/locale.html.twig` | T07 |
| `templates/crud/field/money.html.twig` | T07 |
| `templates/crud/field/number.html.twig` | T07 |
| `templates/crud/field/percent.html.twig` | T07 |
| `templates/crud/field/telephone.html.twig` | T07 |
| `templates/crud/field/text.html.twig` | T07 |
| `templates/crud/field/text_editor.html.twig` | T07 |
| `templates/crud/field/textarea.html.twig` | T07 |
| `templates/crud/field/time.html.twig` | T07 |
| `templates/crud/field/timezone.html.twig` | T07 |
| `templates/crud/field/url.html.twig` | T07 |
| `templates/crud/filters.html.twig` | T02 |
| `templates/crud/form_theme.html.twig` | T04 |
| `templates/crud/includes/_action_confirmation_modal.html.twig` | T02 |
| `templates/crud/includes/_batch_action_modal.html.twig` | T02 |
| `templates/crud/includes/_filters_modal.html.twig` | T02 |
| `templates/crud/includes/_sort_modal.html.twig` | T02 |
| `templates/crud/index.html.twig` | T02 |
| `templates/crud/new.html.twig` | T04 |
| `templates/crud/paginator.html.twig` | T02 |
| `templates/exception.html.twig` | T09 |
| `templates/exception_standalone.html.twig` | T09 |
| `templates/flash_messages.html.twig` | T01 |
| `templates/includes/_css_assets.html.twig` | B04 |
| `templates/includes/_encore_link_tags.html.twig` | B04 |
| `templates/includes/_encore_script_tags.html.twig` | B04 |
| `templates/includes/_fonts.html.twig` | B04 |
| `templates/includes/_importmap.html.twig` | B04 |
| `templates/includes/_js_assets.html.twig` | B04 |
| `templates/includes/_reprise_link_tags.html.twig` | B04 |
| `templates/includes/_reprise_script_tags.html.twig` | B04 |
| `templates/inspector/data_collector.html.twig` | T11 |
| `templates/inspector/icon-v3.svg.twig` | T11 |
| `templates/inspector/icon.svg.twig` | T11 |
| `templates/label/empty.html.twig` | T07 |
| `templates/label/inaccessible.html.twig` | T07 |
| `templates/label/null.html.twig` | T07 |
| `templates/label/undefined.html.twig` | T07 |
| `templates/layout.html.twig` | T01 |
| `templates/menu.html.twig` | T01 |
| `templates/page/content.html.twig` | T09 |
| `templates/page/login.html.twig` | T08 |
| `templates/page/login_minimal.html.twig` | T08 |
| `templates/symfony-form-themes/README.txt` | T05 |
| `templates/symfony-form-themes/bootstrap_5_layout.html.twig` | T05 |
| `templates/symfony-form-themes/bootstrap_base_layout.html.twig` | T05 |
| `templates/symfony-form-themes/form_div_layout.html.twig` | T05 |
| `templates/ui_kit/component.html.twig` | T10 |
| `templates/ui_kit/components/action_menu/01_basic.html.twig` | T10 |
| `templates/ui_kit/components/action_menu/02_icon_button.html.twig` | T10 |
| `templates/ui_kit/components/action_menu/03_headers.html.twig` | T10 |
| `templates/ui_kit/components/action_menu/04_selectable_items.html.twig` | T10 |
| `templates/ui_kit/components/action_menu/05_forms.html.twig` | T10 |
| `templates/ui_kit/components/alert/01_variants.html.twig` | T10 |
| `templates/ui_kit/components/alert/02_flash_messages.html.twig` | T10 |
| `templates/ui_kit/components/alert/03_title_and_icon.html.twig` | T10 |
| `templates/ui_kit/components/alert/04_dismissible.html.twig` | T10 |
| `templates/ui_kit/components/alert/05_actions.html.twig` | T10 |
| `templates/ui_kit/components/badge/01_colors.html.twig` | T10 |
| `templates/ui_kit/components/badge/02_variants/01_light.html.twig` | T10 |
| `templates/ui_kit/components/badge/02_variants/02_solid.html.twig` | T10 |
| `templates/ui_kit/components/badge/02_variants/03_outline.html.twig` | T10 |
| `templates/ui_kit/components/badge/02_variants/04_dot.html.twig` | T10 |
| `templates/ui_kit/components/badge/02_variants/_group.html.twig` | T10 |
| `templates/ui_kit/components/badge/03_default.html.twig` | T10 |
| `templates/ui_kit/components/badge/04_sizes.html.twig` | T10 |
| `templates/ui_kit/components/badge/05_icons.html.twig` | T10 |
| `templates/ui_kit/components/badge/06_dismissible.html.twig` | T10 |
| `templates/ui_kit/components/badge/07_images_and_flags.html.twig` | T10 |
| `templates/ui_kit/components/badge/08_radius.html.twig` | T10 |
| `templates/ui_kit/components/badge/09_custom_colors.html.twig` | T10 |
| `templates/ui_kit/components/button/01_colors.html.twig` | T10 |
| `templates/ui_kit/components/button/02_variants/01_solid.html.twig` | T10 |
| `templates/ui_kit/components/button/02_variants/02_outline.html.twig` | T10 |
| `templates/ui_kit/components/button/02_variants/03_light.html.twig` | T10 |
| `templates/ui_kit/components/button/02_variants/04_ghost.html.twig` | T10 |
| `templates/ui_kit/components/button/02_variants/05_link.html.twig` | T10 |
| `templates/ui_kit/components/button/02_variants/_group.html.twig` | T10 |
| `templates/ui_kit/components/button/03_sizes.html.twig` | T10 |
| `templates/ui_kit/components/button/04_icons.html.twig` | T10 |
| `templates/ui_kit/components/button/05_links.html.twig` | T10 |
| `templates/ui_kit/components/button/06_forms.html.twig` | T10 |
| `templates/ui_kit/components/button/07_inactive.html.twig` | T10 |
| `templates/ui_kit/components/button/08_block.html.twig` | T10 |
| `templates/ui_kit/components/flag/01_basic.html.twig` | T10 |
| `templates/ui_kit/components/flag/02_with_name.html.twig` | T10 |
| `templates/ui_kit/components/flag/03_height.html.twig` | T10 |
| `templates/ui_kit/components/flag/04_unknown_country.html.twig` | T10 |
| `templates/ui_kit/components/flag/05_style.html.twig` | T10 |
| `templates/ui_kit/components/icon/01_fontawesome.html.twig` | T10 |
| `templates/ui_kit/components/icon/02_sizes.html.twig` | T10 |
| `templates/ui_kit/components/modal/01_confirmation.html.twig` | T10 |
| `templates/ui_kit/components/modal/02_icons.html.twig` | T10 |
| `templates/ui_kit/components/modal/03_custom_contents.html.twig` | T10 |
| `templates/ui_kit/components/pagination/01_basic.html.twig` | T10 |
| `templates/ui_kit/components/pagination/02_results_count.html.twig` | T10 |
| `templates/ui_kit/components/pagination/03_first_and_last.html.twig` | T10 |
| `templates/ui_kit/components/pagination/04_compact.html.twig` | T10 |
| `templates/ui_kit/components/pagination/05_range.html.twig` | T10 |
| `templates/ui_kit/components/pagination/06_size_and_radius.html.twig` | T10 |
| `templates/ui_kit/components/sidebar/01_groups_and_items.html.twig` | T10 |
| `templates/ui_kit/components/sidebar/02_submenus.html.twig` | T10 |
| `templates/ui_kit/components/sidebar/03_external_links.html.twig` | T10 |
| `templates/ui_kit/components/switch/01_basic.html.twig` | T10 |
| `templates/ui_kit/components/switch/02_label.html.twig` | T10 |
| `templates/ui_kit/components/switch/03_sizes.html.twig` | T10 |
| `templates/ui_kit/components/switch/04_variants.html.twig` | T10 |
| `templates/ui_kit/components/switch/05_disabled.html.twig` | T10 |
| `templates/ui_kit/components/tabs/01_basic.html.twig` | T10 |
| `templates/ui_kit/components/tabs/02_icons_and_errors.html.twig` | T10 |
| `templates/ui_kit/foundation.html.twig` | T10 |
| `templates/ui_kit/foundations/_form_page_mockup.html.twig` | T10 |
| `templates/ui_kit/foundations/_index_page_mockup.html.twig` | T10 |
| `templates/ui_kit/foundations/_mockup_sidebar.html.twig` | T10 |
| `templates/ui_kit/foundations/_theme_code.html.twig` | T10 |
| `templates/ui_kit/foundations/_theme_picker.html.twig` | T10 |
| `templates/ui_kit/foundations/_theme_picker_script.html.twig` | T10 |
| `templates/ui_kit/foundations/_typography_sample.html.twig` | T10 |
| `templates/ui_kit/foundations/colors.html.twig` | T10 |
| `templates/ui_kit/foundations/fonts.html.twig` | T10 |
| `templates/ui_kit/foundations/typography.html.twig` | T10 |
| `templates/ui_kit/index.html.twig` | T10 |
| `templates/ui_kit/layout.html.twig` | T10 |
| `templates/welcome.html.twig` | T09 |

### PHP presentation source catalog

This is a source-search catalog, not authorization to change public API.

| Exact path | Inventory ID |
| --- | --- |
| `src/Factory/ActionFactory.php` | P04 |
| `src/Config/Action.php` | P03 |
| `src/Contracts/Field/FieldTraitAwareInterface.php` | P01 / T07 |
| `src/Dto/ActionDto.php` | P03 |
| `src/Dto/ActionGroupDto.php` | P03 |
| `src/Dto/FieldDto.php` | P01 |
| `src/Dto/FormTabBadgeDto.php` | P05 |
| `src/Dto/MenuItemBadgeDto.php` | P05 |
| `src/Factory/FormLayoutFactory.php` | P02 |
| `src/Field/ArrayField.php` | P01 / T07 |
| `src/Field/AssociationField.php` | P01 / T07 |
| `src/Field/AvatarField.php` | P01 / T07 |
| `src/Field/CodeEditorField.php` | P01 / T07 |
| `src/Field/CollectionField.php` | P01 / T07 |
| `src/Field/Configurator/ChoiceConfigurator.php` | P05 |
| `src/Field/Configurator/FileConfigurator.php` | P01 / T07 |
| `src/Field/Configurator/FormConfigurator.php` | P02 |
| `src/Field/Configurator/ImageConfigurator.php` | P01 / T07 |
| `src/Field/CountryField.php` | P01 / T07 |
| `src/Field/CurrencyField.php` | P01 / T07 |
| `src/Field/DateField.php` | P01 / T07 |
| `src/Field/DateTimeField.php` | P01 / T07 |
| `src/Field/EmailField.php` | P01 / T07 |
| `src/Field/FieldTrait.php` | P01 / T07 |
| `src/Field/FileField.php` | P01 / T07 |
| `src/Field/FormField.php` | P01 / T07 |
| `src/Field/IdField.php` | P01 / T07 |
| `src/Field/ImageField.php` | P01 / T07 |
| `src/Field/IntegerField.php` | P01 / T07 |
| `src/Field/LanguageField.php` | P01 / T07 |
| `src/Field/LocaleField.php` | P01 / T07 |
| `src/Field/MoneyField.php` | P01 / T07 |
| `src/Field/NumberField.php` | P01 / T07 |
| `src/Field/PercentField.php` | P01 / T07 |
| `src/Field/SlugField.php` | P01 / T07 |
| `src/Field/TelephoneField.php` | P01 / T07 |
| `src/Field/TextEditorField.php` | P01 / T07 |
| `src/Field/TextField.php` | P01 / T07 |
| `src/Field/TextareaField.php` | P01 / T07 |
| `src/Field/TimeField.php` | P01 / T07 |
| `src/Field/TimezoneField.php` | P01 / T07 |
| `src/Field/UrlField.php` | P01 / T07 |
| `src/Twig/Component/Alert.php` | T06 / P05 |
| `src/Twig/Component/Badge.php` | T06 / P05 |
| `src/Twig/Component/Button.php` | P03 |
| `src/Twig/Component/Option/AlertVariant.php` | T06 / P05 |
| `src/Twig/Component/Option/BadgeColor.php` | T06 / P05 |
| `src/Twig/Component/Option/BadgeVariant.php` | T06 / P05 |
| `src/Twig/Component/Option/ButtonColor.php` | P03 |
| `src/Twig/Component/Option/ButtonVariant.php` | P03 |

### Historical registry targets absent at baseline

The following `src/Registry/TemplateRegistry.php` defaults have no matching
file in this checkout. This is a static finding, not a reproduced request
failure; their actual usage must be checked if a downstream app selects them.

- `@EasyAdmin/crud/field/bigint.html.twig`
- `@EasyAdmin/crud/field/datetimetz.html.twig`
- `@EasyAdmin/crud/field/decimal.html.twig`
- `@EasyAdmin/crud/field/float.html.twig`
- `@EasyAdmin/crud/field/raw.html.twig`
- `@EasyAdmin/crud/field/smallint.html.twig`
- `@EasyAdmin/crud/field/toggle.html.twig`

## Prompt 4 implementation boundary

| Inventory rows | Implemented paths | Evidence and remaining work |
| --- | --- | --- |
| T06/P03/P05 | `templates/components/{Button,Badge,Alert,Switch,Pagination}.html.twig`, `assets/css/ui/primitives.css` | Existing interfaces and render tests retained; daisyUI semantic roles, caller precedence, native/prefixed attrs, escaping, method override and slots verified. Keep independent Icon/Flag implementations; complete remaining field/widget styling in Prompt 8. |
| T06/J02/J10 | `templates/components/{ActionMenu,Modal,Tabs}*`, `assets/js/ui/interactions.js`, `assets/css/ui/interactions.css`, `assets/js/tabs.js` | Native dialog/menu/tab composition, keyboard/focus, canceled/confirmed form requests, hash/history and repeated initialization. No Bootstrap dependency in isolated fixtures. Shell, CRUD and form-specific interactions remain assigned to Prompts 5-7. |
| P01/P02 | `src/Twig/PresentationExtension.php`, `config/services.php`, `assets/css/ui/layout.css` | Bounded legacy presentation adapter; all supported widths/offsets and exact breakpoints. Wire into real form/detail renderers with their associated migration in Prompts 6-7. No builder/DTO meaning changes. |
| J01/J02/J05/J11 | `assets/js/app.js`, `assets/js/page-layout.js`, `assets/js/form.js`, error-counter attributes in `templates/crud/form_theme.html.twig` | Reuse native foundation; remove duplicate Bootstrap menu handlers, retain early layout preferences, update filter target lookup and independent error-counter hook. Keep form processing, URL sanitizer and action payload logic intact. |
| Temporary staged support | `assets/css/migration-components.css`, `assets/css/migration-dialog.css`, legacy attribute bridge in `assets/js/ui/interactions.js` | Loaded only by remaining legacy pages; no daisyUI stylesheet is mixed with Bootstrap. Remove at final cutover. |
| Isolated proof | `tests/Browser/Controller/{PresentationLayoutController,PrimitivesController}.php`, `tests/Browser/templates/browser/ui_{layout,primitives,primitives_override}.html.twig`, `tests/Browser/{layout,primitives}.spec.js`, `tests/Unit/Twig/PresentationExtensionTest.php`, `tests/Functional/Component/` | Deterministic real component rendering, measured geometry, request/CSRF/keyboard/override evidence. Retain meaningful tests while replacing temporary fixture pages at acceptance. |

## Prompt 5 implementation boundary

| Inventory rows | Implemented paths | Evidence and remaining work |
| --- | --- | --- |
| T01/B04 | `templates/layout.html.twig` | Preserved every block, template/include and asset/nonce injection; added theme root, named navigation target and accessible names. Existing neutral `menu.html.twig`, `flash_messages.html.twig` and Sidebar component interfaces retained. |
| C02-C04/T01 | `assets/css/ui/{tokens,shell,sidebar}.css`, `assets/css/ui/primitives.css`, `assets/css/ui-preview.css` | Existing palette and token contracts feed daisyUI roles; actual Theme grays/fonts/primary/foreground/radius/spacing, bounded controls, shell layout, compact sidebar and responsive RTL styles. No Bootstrap bridge imported into the new stylesheet. |
| J01/J03/J04 | `assets/js/ui/{shell,scroll-lock}.js`, `assets/js/{app,page-layout,page-color-scheme}.js` | Shared idempotent shell interactions, first-paint preferences, native mobile focus/inert/scroll boundaries, nested dialog ownership and resize cleanup. Existing keys/configured-width semantics retained. |
| J02 | `assets/js/ui/interactions.js`, `tests/Browser/primitives.spec.js` | Cancel pending submenu hover when the parent closes; preserve prevented navigation and dialog/sidebar arbitration. |
| B02/C02 temporary font delivery | `assets/css/ui-fonts-preview.css`, `webpack.config.js` | Independent FontAwesome and bundled faces compiled by the existing pipeline, without Bootstrap. Fold into final `app.css` and remove temporary entry in Prompt 10. |
| Isolated proof | `tests/Browser/{shell,theme-shell,theme-widths,density}.spec.js`, `Controller/ThemeDashboardController.php`, `Twig/NonceExtension.php`, `templates/browser/theme_*.html.twig`, `public/theme_fixture.{css,js}` beneath `tests/Browser/` | Real shell, public Theme values, actual fonts/layout widths, configured assets and enforced CSP; fixture-only preview cookie/router/child-layout wiring. |
| Extension proof | `tests/Functional/Customization/Dashboard/ShellExtensionTest.php`, `Controller/Dashboard/ShellExtensionTestDashboardController.php` and `templates/admin/shell_{layout,dashboard}.html.twig` beneath CustomizationApp | Existing block inheritance composes with parent logo/navigation/footer/title/main; exact URL, asset attributes/order and configured HTML placement preserved. |

CRUD search/highlighting/help, listing/detail actions and filters remain Prompt 6.
New/edit form inheritance remains Prompt 7. The isolated dashboard proof does
not declare those pages or the normal delivered bundle Bootstrap-free.


## Prompt 6 implementation boundary

| Inventory rows | Implemented paths | Replacement and verification |
| --- | --- | --- |
| T02-T03/T07 | `templates/crud/index.html.twig`, `templates/crud/detail/*.html.twig`, `templates/crud/action_group.html.twig` | Scoped daisyUI table/mobile cards, semantic alignment/sorting/selection, adapted detail columns/fieldsets/tabs, existing ActionMenu composition; HTTP and three-engine query/action/state tests. |
| J05-J09/P03-P05 | `assets/js/crud.js`, `assets/js/ui/interactions.js`, `assets/js/helpers.js`, `src/Twig/PresentationExtension.php` | Native confirmations, selection, lazy filters and collapse; unchanged request payloads/CSRF/URL sanitizer, adapter for legacy attributes; real persistence and canceled/confirmed outcomes. |
| T04/J08 | `templates/crud/filter_theme.html.twig`, `templates/crud/filters.html.twig` | Neutral filter widgets and ordered configured themes; exact GET fields, hidden combined state, editable 422 responses, same-origin redirects, help/labels/errors. Main form theme follows in Prompt 7. |
| J09/W01 | `assets/js/overlays.js`, `assets/css/ui/{overlays,autocomplete}.css`, `templates/crud/field/{code_editor,text_editor}.html.twig` | Native Popper overlays with DOMPurify, neutral TomSelect skin, existing Modal viewer interface; malicious HTML/protocol, keyboard/focus/cleanup and mobile viewport tests. Editors themselves remain Prompt 8. |
| C02-C04 | `assets/css/ui/{listing,detail,search,visibility}.css`, `assets/css/ui-preview.css` | Responsive table/detail/filter styling, scoped native hidden states and initial collapse visibility; repeated initialization and physical geometry verified. |
| B02 temporary support | `assets/js/{app,ui-crud-preview}.js`, `webpack.config.js`, `public/licenses/` | Legacy app wrapper and isolated native CRUD entry; normal distribution rebuilt with full retained dependency licenses. Remove wrappers/scaffolding in Prompt 10. |
| Behavioral proof | `tests/Browser/listing.spec.js`, `tests/Browser/Controller/ListingCrudController.php`, `tests/Functional/Filters/FilterFormRenderingTest.php`, DefaultApp filter rendering controller/themes | Real requests, values, persisted outcomes, permissions, empty/mobile states and extension behavior; existing assertions updated to equivalent semantic attributes/states. |
