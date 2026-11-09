# Rendering boundary and target architecture

Status: Prompt 1 design decisions with implementation addenda through Prompt 4,
2026-11-09. The initial decisions are targets; the stage addenda and reports
identify verified results. Source evidence is in [baseline.md](baseline.md)
and [inventory.md](inventory.md).

## D1. Preserve backend and configuration contracts

Keep Twig, Symfony Forms, public builders and DTO meanings, controller actions,
route names and URL generation, queries, persistence, voters, permissions,
validation, translations, and CSRF protection. Preserve action availability,
HTTP methods, field names, and submit-button semantics. Do not change
`src/Contracts/`, `src/Controller/AbstractCrudController.php`, router, ORM,
security, or form data processing to accommodate visual changes.

Allowed implementation areas are `templates/`, `assets/`, build configuration,
focused tests/fixtures, documentation, and generated assets through the build.
A small internal presentation helper registered explicitly in
`config/services.php` may translate styling inputs when Twig alone becomes
unwieldy. It must not become a new public configuration API or modify DTOs.
Retain public presentation enums/methods, including methods with Bootstrap in
their name; stop calling their legacy output from migrated renderers where
appropriate. Do not remove public contracts to satisfy a text search.

The repository's instruction to use Bootstrap styling is superseded by this
migration request. Its security, accessibility, API, and contribution rules
still apply. No upgrade entry is needed for this source-only audit. When an
implementation requires consumer action, update both `UPGRADE.md` and
`UPGRADE-AI.md` and review the shipped skill's rules/provenance in that stage.

## D2. Select Tailwind 4 and daisyUI 5 with explicit compatibility limits

Initial reproducible candidates: **Tailwind CSS 4.3.3** and **daisyUI 5.7.50**,
matching the inspected reference application. Both release tags were checked:
[Tailwind release](https://github.com/tailwindlabs/tailwindcss/releases/tag/v4.3.3),
[daisyUI release](https://github.com/saadeghi/daisyui/releases/tag/v5.7.50).
They are chosen pins, not a promise to track floating `latest` on every build.
Resolve them with Yarn in Prompt 3, including the matching `@tailwindcss/cli`
if using the managed local CLI described in D3. No lock changes in this stage.

Tailwind's documented floor is Safari 16.4+, Chrome 111+, Firefox 128+.
The checkout has no explicit browser policy or Browserslist configuration;
its existing theme already uses modern colors and cascade layers. That does
not prove support for the new CSS. Treat the Tailwind floor as a documented
compatibility boundary, and verify selected components on those engines.
Older browser requirements would conflict with Tailwind 4 and must be resolved
before final acceptance. Babel cannot lower CSS feature requirements.
See [Tailwind compatibility](https://tailwindcss.com/docs/compatibility) and
[Bootstrap browser policy](https://getbootstrap.com/docs/5.3/getting-started/browsers-devices/).

Use Tailwind 4's CSS-first configuration and `@plugin` directives. Do not add
Tailwind 3 `content`/`safelist` configuration or assume `tailwindcss` itself is
the PostCSS plugin. If a PostCSS route becomes necessary, use the separately
versioned `@tailwindcss/postcss` package and record that decision.

## D3. Make AssetMapper a required build/delivery path

The user specifically requires compatibility with the AssetMapper approach in
`../../symfony/symfolearner`. Provide a real AssetMapper fixture/consumer path,
not only an importmap tag on an Encore page. AssetMapper maps/version-controls
assets; Tailwind compilation is a separate local step.

Recommended repository integration:

1. Retain Yarn Classic and its lock. Add exact development pins for
   `tailwindcss`, `@tailwindcss/cli`, and `daisyui`. Use SymfonyCasts
   TailwindBundle 1.0.0 in the development/consumer harness, with its `binary`
   pointing to the Yarn-managed `node_modules/.bin/tailwindcss`. This keeps
   plugin and compiler resolution reproducible through the existing package
   manager while using the same Symfony command interface as the reference.
2. Add AssetMapper to that harness with a constraint compatible with the
   bundle's Symfony 6.4/7.x/8.x range. Do not impose Symfony 8.1 or PHP 8.5 on
   consumers because the reference application uses them. Composer must resolve
   the actual version matrix in Prompt 3. The current repository ignores
   `composer.lock`; retain that policy unless a separately packaged fixture
   needs its own committed application lock.
3. Run the harness's console commands in this order:
   `php bin/console tailwind:build --minify`, then
   `php bin/console asset-map:compile --env=prod`.
   These are target harness commands; this checkout has no root console today.
   Add appropriate Make targets rather than undocumented ad hoc commands.
4. Feed the same compiled CSS into the package distribution build. Keep
   `app.css`, all existing JS/CSS entry names, manifest lookup, asset packages,
   font/license delivery, and `assets:install` working. Retain Encore for
   existing packaged JS and independent widgets until there is a demonstrated
   need to replace it. This is packaging tooling, not another renderer.

The reference's alternative is a pinned standalone Tailwind binary plus local
`daisyui.mjs`/`daisyui-theme.mjs` release artifacts. It can support a consumer
that wants to compile custom CSS without Node; record checksums and licenses
if adopting that route. Ordinary consumers use the precompiled CSS with no
compiler or Node requirement.

There is a concrete tooling incompatibility with passing the existing source
directly to AssetMapper: `require()` calls, extensionless imports, webpack `~`
CSS paths, and CodeMirror 5/CommonJS modes need bundling or conversion.
AssetMapper does not perform those transformations. Preserve prebuilt widget
entry files as script assets while delivering application modules through
importmaps. Prove that neither path initializes widgets twice. A full removal
of Encore is not required to replace Bootstrap and would expand this stage's
scope; reconsider only with evidence and without breaking shipped assets.

The SymfonyCasts command and compilation order are documented in
[TailwindBundle](https://symfony.com/bundles/TailwindBundle/current/index.html).
AssetMapper is available within the supported Symfony range; verify the
6.4 integration as well as the reference's version using
[Symfony 6.4 AssetMapper](https://symfony.com/doc/6.4/frontend/asset_mapper.html).
The optional standalone plugin route is supported by
[daisyUI's standalone guide](https://daisyui.com/docs/install/standalone/).

## D4. Keep composition in the existing Twig system

Use existing `ea:*` TwigComponents, includes, and `ea.templatePath()` lookups.
`src/EasyAdminBundle.php::prependExtension()` configures the `ea` prefix and
application overrides under `templates/bundles/EasyAdminBundle/`; preserve both
namespace paths and normal `@EasyAdmin` inheritance.

Keep component props, slots/blocks, `attributes.defaults()` merging, prefixed
attributes, caller classes, HTML attributes, and link/button/form behavior.
Use existing `Button`, `Badge`, `Alert`, `ActionMenu`, `Modal`, `Pagination`,
`Sidebar`, `Switch`, `Tabs`, `Icon`, and `Flag` interfaces. Add a small anonymous
include/component only when there is actual repeated markup. No parallel
component registry, LiveComponent dependency, React, or Vue.

Preserve every named block in `layout.html.twig`, CRUD templates, and form
themes where practical. Keep detail partial replacement via
`src/Registry/TemplateRegistry.php`, custom field templates, translation domains,
and current trusted-HTML versus escaped-content contracts. Component slots need
explicit translation domains, as `src/Twig/Component/AGENTS.md` explains.

## D5. Use a framework-neutral Symfony form foundation

Current hierarchy is `crud/form_theme.html.twig` -> bundled
`symfony-form-themes/bootstrap_5_layout.html.twig` ->
`bootstrap_base_layout.html.twig` -> `form_div_layout.html.twig`.
These are copied templates, not just the installed Symfony version's theme.

Base the new implementation on framework-neutral `form_div_layout` blocks,
after comparing the bundled copy and supported Symfony versions. Preserve the
`@EasyAdmin/crud/form_theme.html.twig` entry and custom `ea_*`, collection,
Vich, row, error, and layout block names. Explicitly implement every previously
inherited styled widget; no removal of a `use` statement as the whole change.
Retain multipart/hidden/CSRF/rest handling, labels/help/errors, row and widget
attributes, and ordinary Symfony forms rendered without an admin context.
FormFactory/FormLayoutFactory remain responsible for the existing form tree;
renderers adapt to it. Validation must reveal errors in tabs and collapsed
ancestors before focusing invalid controls.

## D6. Adapt semantic styling at the rendering edge

Use bounded, complete class mappings for action colors, button styles, badges,
alerts, and legacy column inputs. `danger` maps to daisyUI's `error` role;
`notice` maps to `info`; default/secondary keeps its current neutral meaning.
Do not equate the current `secondary` gray with daisyUI's accent secondary.
Preserve solid/outline/light/ghost/link, sizes, radius, block width, disabled,
loading, and icon-only behavior; small scoped CSS may express variants absent
from daisyUI. Retain deprecated enum inputs and their current default semantics.

For columns, parse recognized tokens from `FieldDto::columns`, defaultColumns,
form-column CSS, and row attributes, without changing public setters:

- Integers in `FieldTrait::setColumns()` and `FormField::addColumn()` currently
  become `col-md-N`: below 768px they stack, at 768px they occupy N/12.
- Preserve explicit `col-N`, responsive `col-{breakpoint}-N`, equal/auto columns,
  offsets, natural wrapping, explicit row breaks, and defaults such as
  `col-md-6 col-xxl-5`. Include `offset-0` resets where provided.
- Preserve Bootstrap widths exactly for legacy inputs: xs/base, sm 576px,
  md 768px, lg 992px, xl 1200px, xxl 1400px. Tailwind defaults differ. Use
  bounded mapping classes or named custom variants with these widths; do not
  globally redefine consumers' Tailwind `lg`/`xl` to fix bundle layout.
- Bootstrap offset means extra inline-start space on a wrapping row; a naive
  `col-start-*` grid replacement can change wrapping. Prefer scoped flex layout
  with mapped basis/margin rules where needed, and verify before/after widths.
- Preserve unrelated custom tokens verbatim. Record unsupported tokens (for
  example arbitrary Bootstrap order/gutter utilities) explicitly in the
  downstream guide instead of silently claiming all Bootstrap classes work.

This adapter interprets known configuration, not arbitrary user HTML. It must
not rewrite content strings, mutate API values, or re-create Bootstrap utilities
globally. Test combinations, offsets, rows, nested columns, attributes, and
detail layouts as well as input parsing.

## D7. Theme tokens, layers, and source discovery

Retain public `Theme`, font, spacing, radius, gray palette, primary-color, and
light/dark preferences. Map them to daisyUI semantic roles (`base-*`, content,
primary, neutral, success/warning/error/info and foregrounds) at the theme root.
Keep supported `--ea-*` knobs as an explicit compatibility token layer; resolve
derived tokens at both light and dark roots. Avoid two competing sources of
color state. Keep `ea/colorScheme`, `ea/sidebar/width`, `ea/content/width`, and
configured-preference precedence; synchronize daisyUI `data-theme` at first
paint. Preserve `lang`, `dir`, CSP nonces, fonts, and reduced-motion preferences.

Use explicit Tailwind 4 `@source` paths for bundle Twig, JS, UI kit examples,
and presentation mapping literals. Disable uncontrolled automatic discovery
with `source(none)` and enumerate the bounded adapter output if necessary.
Dynamic `btn-{{ value }}` strings are insufficient for class detection.
Consumers wanting classes absent from shipped CSS must compile an application
entry scanning their templates/JS and the published bundle sources/mappings;
CSS/token-only overrides require no Node build. See
[Tailwind source discovery](https://tailwindcss.com/docs/detecting-classes-in-source-files).

Proposed default: omit Tailwind Preflight from the reusable bundle stylesheet,
use minimal scoped element defaults under EasyAdmin roots, and inspect daisyUI
base styles separately. Keep third-party rules in a vendor layer with semantic
adapters above them and application overrides last/unlayered. Verify the emitted
layer order: the current build guarantees unlayered application CSS overrides
bundle CSS, with special reversed ordering for `!important` vendor fixes.
Do not copy the reference's layer setup without inspecting generated output.
See [Preflight](https://tailwindcss.com/docs/preflight).

Prefer no class prefix initially to preserve familiar daisyUI components;
use `data-ea-*` hooks for behavior and scoped CSS for bundle-specific layouts.
A daisyUI `root` option scopes theme-variable placement, not every component
selector. A prefix changes class names, not general element resets; neither
isolates an entire application. Check style leakage against a neutral Symfony
page and the profiler. Render old and new previews in separate documents;
never load Bootstrap and daisyUI styles in the same document.
See [daisyUI configuration](https://daisyui.com/docs/config/).

## D8. Replace interactions in small modules

Keep vanilla JavaScript and independent widgets. Extract/adapt only the coupled
parts of `app.js`, `page-layout.js`, `tabs.js`, and `form.js`. Native `dialog`
is the candidate for Modal's implementation; daisyUI supplies styling, not the
application's event and request behavior. Menus need managed keyboard/focus
behavior, outside-click, Escape, submenu navigation, and reduced motion.
Retain independent mobile-sidebar functionality and its scrolling/focus rules.

Preserve all existing `ea.*` events, targets, payloads, bubbling/cancelability,
and form cancellation. Replace internal `.bs.*` listeners together with their
producers. Direct downstream `window.bootstrap`, `.bs.*`, Popper configuration,
and `data-bs-*` integrations require documented migration, not a permanent fake
Bootstrap global. Use explicit idempotent initialization for document load,
lazy filter content, and collection additions.

Keep `helpers.js::sanitizeUrl()` and same-origin filtering; do not loosen URL
or HTML handling. Confirm dialogs must clear pending state on cancel, restore
focus, prevent default submission and duplicate execution, and preserve the
exact server contracts listed in the inventory.

## D9. Downstream migration boundary

Stable: PHP configuration/signatures and meaning, Twig paths/blocks/template
replacement, component props/slots/attributes, Symfony form names and blocks,
configured asset injection, request/event contracts, precompiled installation.

Requires consumer migration: Bootstrap CSS selectors/utilities in custom HTML,
Bootstrap form-theme inheritance, `$().modal()` or `window.bootstrap.*`,
`data-bs-*`, `.bs.*` event listeners, Popper-specific options, and unlisted
Bootstrap CSS-variable overrides. Publish concrete replacements during the
relevant stage and prove them in Prompt 9. Legacy layout tokens intentionally
handled by D6 remain accepted; shared names such as `btn` are not evidence that
Bootstrap remains. Historical documentation and standalone CSS with a similar
class name must be classified separately from actual Bootstrap runtime code.

## D10. Keep observed baseline failures executable

Prompt 2 established a normal failing browser regression for DirtyForm clearing
dirty state before a canceled `ea.form.submit`. Keep it in the default suite,
with no skip, expected-failure annotation or retries. Record the three engine
failures separately from passing tests and fix the interaction in Prompt 7.
Retain DirtyForm as an independent widget unless its replacement is necessary;
prefer a narrow integration fix preserving the cancelable EasyAdmin event and
successful-submit behavior. Visual references remain historical artifacts,
not pixel-match requirements for the new rendering.

## D11. Asset build foundation implemented in Prompt 3

The chosen CSS entry is `assets/css/ui-preview.css`, with small scoped defaults
in `assets/css/ui/foundation.css`. It uses Tailwind 4 imports/directives,
`source(none)`, explicit Twig/JS/Twig-helper/fixture source directories, and
bounded complete component-variant inclusion lists. Themes are named
`easyadmin-light` and `easyadmin-dark`. Semantic roles bridge inherited
`--ea-primary`, `--ea-primary-foreground`, `--ea-radius`, `--ea-spacing`, and
font variables. Tailwind spacing and daisyUI control sizing derive from the
same spacing knob. Full `Theme` option integration remains shell-stage work.

Preflight is omitted. daisyUI's global root color/scroll/gutter/lock/scrollbar/SVG
base effects are excluded. Our small defaults apply under `[data-ea-ui]` only.
No class prefix is used: daisyUI component selectors remain class-based and
are not scoped by `root`; the option controls theme-variable/root-controller
placement. Named theme selectors can apply to any matching `data-theme` node.
Neither this setting nor a class prefix is universal style isolation.
Actual ordinary-page tests verify default body margin, heading size and native
button borders with the stylesheet present but no EasyAdmin theme root.

The fixture maps only new CSS sources under `easyadmin/`; legacy source CSS is
excluded because AssetMapper cannot compile webpack `~` imports. It provides
`/ui-preview` and `/ui-neutral`, with local importmap module `ui-preview`.
Development uses AssetMapper's `/assets/` controller. Production uses a separate
`/assets-built/` prefix at `tests/Browser/public/assets-built/` so a compiled
manifest cannot mask development resolution. These are fixture prefixes, not
changes to distributed bundle entry names or asset packages.

`make build-ui-assets` clears the fixture's production cache, runs local
`tailwind:build --minify`, then `asset-map:compile`, and verifies compiled CSS.
The compiled input replacement lives at
`tests/Browser/var/tailwind/ui-preview.built.css`. The existing bundle public
assets are automatically mapped too, but isolated preview documents load only
the new stylesheet/module. Their network and CSS are checked for Bootstrap and
external delivery. Bootstrap remains in the main package until final cutover.

Symfony 8.1 conditionally omits Twig's importmap extension when AssetMapper is
only a development dependency of a package whose TwigBundle requirement is
runtime. The fixture explicitly registers Symfony's official ImportMapExtension
and runtime services. This keeps optional build tooling out of the bundle's
runtime requirements. A real AssetMapper consuming application installs it as
an application dependency and must be verified separately in Prompt 9.

## D12. Resolve the demonstrated linter incompatibility

Biome 1.9.4 cannot parse Tailwind 4's import-source modifier or daisyUI plugin
configuration. Upgrade to exact Biome 2.6.6 and enable
`css.parser.tailwindDirectives`, using the official configuration migration.
See [Biome's Tailwind parser option](https://biomejs.dev/reference/configuration/#cssparsertailwinddirectives).
No lint rule was disabled to accept invalid CSS.

Keep the previously checked languages (JSON, CSS and JS): Biome 1.9 did not
implement Markdown checking, so the upgrade does not introduce unrelated
Markdown reformatting of instructions, upgrades or skill provenance. Markdown
links/records continue to receive explicit local checks; RST uses the existing
Make linter. Add browser and CSS-proof JS to the checked source set. Generated
browser/AssetMapper results remain excluded as generated artifacts.

The new formatter reformats 13 legacy CSS files. Twelve normalize identically
through Lightning CSS; the icon `cap` fallbacks in `base.css` move to equivalent
`@supports` rules to retain older-engine fallback behavior. Six arrow callbacks
use explicit blocks for the new forEach-return rule; their calls and effects
are unchanged. Legacy specificity/important-style advisories remain visible
warnings, alongside existing JS advisories. No unsafe automatic fixes were
applied. Production assets were regenerated using the normal build.

## D13. Adapt existing components at the render boundary

Prompt 4 keeps the existing `ea` TwigComponent system, PHP props, option enums,
public computed methods, template paths and slots. An internal, explicitly
registered `src/Twig/PresentationExtension.php` translates bounded presentation
values through `ea_ui_classes` and `ea_ui_attrs`. It does not mutate a builder,
DTO, form value, action URL, CSRF token or backend configuration.

Class mapping is contextual: buttons, badges and alerts map legacy semantic
roles to daisyUI roles; layout maps supported column/offset tokens. Caller
classes and unknown custom tokens survive. Recognized conflicting color/style/
size tokens resolve in caller order, so a caller override does not depend on
stylesheet rule order. Native and prefixed component attributes continue through
TwigComponent's escaping and attribute-merging implementation. Attribute mapping
is restricted to UI triggers/targets/dismissal; action metadata remains intact.
The used `ComponentAttributes::all()`, `only()`, `without()`, `defaults()` and
`render()` methods also exist in the allowed
[TwigComponent 2.32 baseline](https://github.com/symfony/ux-twig-component/blob/v2.32.0/src/ComponentAttributes.php).
Current execution uses TwigComponent 3.7; the older dependency matrix still
requires installation verification.

The layout adapter preserves the configured twelve-column meaning, including
base/sm/md/lg/xl/xxl widths, equal/auto columns, offsets and explicit row breaks.
Its media queries use **576/768/992/1200/1400px**. It does not redefine Tailwind's
breakpoints. Numeric `FieldTrait::setColumns()` and `FormField::addColumn()`
currently produce `col-md-N`; those public outputs and their 768px activation
remain unchanged. Default field widths and explicit field widths retain their
different wrapping behavior. Widths also apply inside vertical form columns;
logical margins preserve RTL offsets. Generated row-break triples are mapped
as a unit.

This is a narrow configuration adapter, not a general Bootstrap stylesheet.
Bootstrap order, gutter, display and arbitrary component utility classes outside
the documented contexts are not recreated. Unknown tokens remain in HTML for
application CSS. Consumers using such tokens must provide equivalent Tailwind
utilities or custom CSS. Unsupported/malformed column tokens are preserved,
not silently interpreted as another width. Final consumer guidance is required
in Prompt 9.

`assets/js/ui/interactions.js` provides native dialogs, menus and tabs behind
independent `data-ea-*` hooks. It preserves keyboard navigation, Escape and focus
restoration without a frontend framework. The existing tab hash/history and
edit/detail URL behavior stays in `assets/js/tabs.js`. The old Bootstrap menu
handlers in `page-layout.js` are removed with this replacement to avoid duplicate
handlers; the file retains its early layout-preference initialization.

During staged development, a narrow bridge recognizes legacy UI attributes on
migrated elements. The isolated `assets/css/migration-{components,dialog}.css`
files let existing Bootstrap pages use the migrated primitives and native
dialog. Neither loads daisyUI into a Bootstrap page. Remove these temporary
compatibility stylesheets and obsolete runtime
bridges at final cutover after all product emitters are migrated.
