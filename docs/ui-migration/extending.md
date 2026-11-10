# Extending the Twig UI

This fork keeps the Composer name `easycorp/easyadmin-bundle`, the PHP namespace
`EasyCorp\Bundle\EasyAdminBundle`, Symfony Forms, and the existing `@EasyAdmin`
template namespace. Install the fork from your chosen Composer repository;
do not rename namespaces or edit installed vendor files.

## Installation and assets

Ordinary applications use the package's precompiled assets. Run your normal
Composer installation and `php bin/console assets:install public`; retain the
`easyadmin.assets.package` asset package and its generated `public/manifest.json`.
The bundle does not require Node, Yarn, TailwindBundle, or Encore in a consuming
application. An application that uses AssetMapper can map its own styles and
modules normally and run `php bin/console asset-map:compile` for production.
Installing the bundle's precompiled files and compiling the application's
mapped assets are separate operations; retain both when using both contracts.

The maintainer build uses the pinned Yarn compiler through TailwindBundle and
AssetMapper, then packages the compiled CSS, JavaScript, fonts and licenses
through the existing Encore distribution. Existing CommonJS editor modules and
font URL imports require this packaging step. AssetMapper does not bundle those
source modules. The Makefile remains the command reference.

## Twig composition and forms

- Extend `@EasyAdmin/layout.html.twig` and override its existing named blocks.
  Use `parent()` to retain the default content when adding material. Keep asset
  blocks, nonce guards and configured assets when replacing a larger block.
- Use `Crud::overrideTemplate()` for registered template replacements and
  `Field::setTemplatePath()` for a field renderer. Application overrides under
  `templates/bundles/EasyAdminBundle/` keep their normal Symfony behavior.
- Reuse `ea:Button`, `ea:Badge`, `ea:Alert`, `ea:ActionMenu`, `ea:Modal`, `ea:Tabs`,
  `ea:Switch`, `ea:Pagination`, `ea:Icon` and `ea:Flag`. Existing props, slots,
  native attributes and prefixed attributes remain available. Pass the
  translation domain explicitly inside component slots.
- Extend `@EasyAdmin/crud/form_theme.html.twig` with a Symfony form theme. Import
  the parent theme with `use` and override a specific block. Preserve `attr`,
  `row_attr`, labels, help, error associations, names, IDs and hidden/rest fields.
  `Crud::setFormThemes()` retains its ordered list of themes.
- A custom field still implements the existing `FieldInterface`/`FieldTrait`
  contract. Add its form type and renderer through those existing interfaces;
  no additional component registry is required.

The separate [consumer application](../../examples/consumer/README.md) exercises
these extension points together with a real custom action and persisted form
submission. Its application configuration is independent of the bundle's test
kernel.

## Theme tokens and cascade

The theme root is `[data-ea-ui]`; appearance selection sets
`data-theme="easyadmin-light"` or `data-theme="easyadmin-dark"`. Existing public
`Theme` configuration still controls fonts, grays, primary colors, radius and
spacing. Existing appearance and layout preferences retain their storage keys.

For application CSS, configure a stylesheet through `Assets::addCssFile()` after
the bundle stylesheet. Use semantic daisyUI roles such as `--color-base-100`,
`--color-base-content`, `--color-primary`, `--color-primary-content` and
`--color-error`. Override common values on `[data-ea-ui]`, and appearance-specific
values on `[data-ea-ui][data-theme='easyadmin-dark']`. Set both foreground and
background roles for a changed color. Existing `--ea-primary`,
`--ea-primary-foreground`, `--ea-radius`, `--ea-spacing` and `--ea-prose-*` hooks
remain useful. Derived values must be declared at the element where the relevant
source values change, so a root-only resolved value does not mask dark mode.

The bundle uses CSS layers and omits Tailwind Preflight. Unlayered application
CSS can override layered bundle declarations without editing vendor files.
Widget skins remain scoped to their own elements. daisyUI's `root` option scopes
theme variables; it does **not** prefix every component selector or provide a
Shadow DOM boundary. Shared names such as `btn`, `badge` and `input` remain class
names in the document. An embedded host must assess its own selector overlap.
Native `hidden` handling and a small number of interaction state rules use
`!important`; do not override them to make a closed overlay visible.

## Application Tailwind utilities

The package stylesheet contains a finite set of classes discovered from bundle
templates, interaction source and the presentation adapter, plus a bounded
semantic inclusion list. It cannot contain arbitrary future application classes.
Adding a class to a template does not ask the browser or AssetMapper to compile it.

For classes absent from the package, build an application-owned stylesheet with
Tailwind 4 and deliver its compiled output through AssetMapper. Keep complete
class names in Twig/JavaScript or list a bounded set with `@source inline(...)`.
For example, a source file outside the mapped production asset directory can use:

```css
@layer theme, base, components, utilities;
@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/utilities.css' layer(utilities) source(none);
@source '../templates';
@source '../assets';
```

Resolve those paths relative to that stylesheet. Do not construct partial class
names such as `bg-{{ color }}-500`. Use a finite mapping of complete names.
The consumer example checks that its arbitrary utility is absent from shipped
bundle CSS and effective through its separately compiled application stylesheet.
It ships that compiled file, so its ordinary production installation needs no
Node build. Rebuild it when changing the application's class set.

TailwindBundle can invoke either a pinned local compiler or a compatible
standalone compiler. This repository keeps Yarn for plugin/version resolution.
Do not copy Tailwind 3 configuration or add a production browser compiler/CDN.
See the primary guides for [Tailwind source discovery](https://tailwindcss.com/docs/detecting-classes-in-source-files),
[daisyUI configuration](https://daisyui.com/docs/config/),
[Symfony 6.4 AssetMapper](https://symfony.com/doc/6.4/frontend/asset_mapper.html)
and [TailwindBundle](https://symfony.com/bundles/TailwindBundle).

## Interaction hooks

Keep visual classes separate from behavior. Native menu, dialog, collapse and
tab triggers use `data-ea-toggle`, `data-ea-target`, `data-ea-dismiss` and the
existing component interfaces. Do not call `window.bootstrap`, Bootstrap
constructors or `*.bs.*` events in migrated application code. Native `dialog`
supports `showModal()` and `close()`; use the rendered component controls when
you need EasyAdmin's focus restoration and `ea.modal.*` lifecycle.

The UI module initializes once per document and handles inserted collection and
filter content. Widget instances are attached once per element and disposed
before removal. After inserting application-owned UI content, call
`window.EasyAdminApp.init(container)` on that subtree; repeated initialization
does not add another instance to an existing element. Load the configured field
entry when introducing a widget type that was absent from the original page.
Retain `ea.form.submit`, `ea.form.error`,
`ea.collection.item-added` and `ea.collection.item-removed`, including their
existing cancellation/data contracts. New native UI lifecycle events include
`ea.modal.show/shown/hide/hidden`, `ea.menu.shown/hidden`,
`ea.tab.show/shown`, `ea.collapse.show/shown/hide/hidden`, and
`ea.filters.loaded`. Do not use a visual utility as an initialization selector.

## Migrating downstream Bootstrap customizations

Existing public PHP column and action styling inputs are accepted at the render
boundary. Numeric and supported responsive grid values keep their original
pixel breakpoints, including 576/768/992/1200/1400px. A Tailwind `lg` breakpoint
does not imply Bootstrap's 992px breakpoint. Supported `col-*`, `offset-*` and
row break mappings are finite; arbitrary Bootstrap utility strings are not a
new compatibility stylesheet. Unrelated custom classes remain present.
Bootstrap `row-cols-*`, `g-*`/`gx-*`/`gy-*`, `order-*`, container classes and
arbitrary display/flex utilities are outside this adapter. Replace them with
complete Tailwind classes or application CSS; a preserved class token alone does
not provide Bootstrap styling.

Migrate Bootstrap-specific template inheritance, Sass imports, utility layouts,
raw dropdown/modal markup, widget Bootstrap themes, constructors and event
listeners. Use the neutral form theme, existing Twig components, daisyUI roles
or application CSS. The narrow Twig presentation adapter accepts legacy
configuration tokens; it does not load Bootstrap or make arbitrary third-party
Bootstrap plugins work. Preserve request URLs, methods, CSRF fields and action
metadata while replacing those UI integrations.

## Maintaining this fork

1. Pin the upstream tag/SHA and compare it with `baseline.md` before each update.
2. Review new/changed templates, components, form blocks, field assets, auxiliary
   pages and PHP-generated presentation values against `inventory.md`.
3. Keep the Composer namespace, asset entry/manifest contract and public PHP API
   separate from presentation changes. Audit controller/query/security diffs.
4. Resolve dependency changes through Composer/Yarn and regenerate distributed
   assets through Make. Never hand-edit generated manifests or lockfiles.
5. Run upstream checks, behavior tests and the separately installed consumer.
   Capture new visual references separately from the original baseline.
6. Update all five migration records and paired human/AI upgrade instructions
   for changes that require downstream action. Review shipped skill provenance.
