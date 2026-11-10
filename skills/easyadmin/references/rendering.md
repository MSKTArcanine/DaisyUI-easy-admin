# Twig rendering in this fork

The package keeps Twig, Symfony Forms, the `ea` component namespace, existing
template paths/blocks, the named asset package and public PHP configuration.
Rendering uses Tailwind CSS 4 and daisyUI 5. Ordinary applications install
precompiled bundle assets with `assets:install`; no Node build is required.
Source: `src/Asset/AssetPackage.php`, `templates/layout.html.twig`, `UPGRADE.md`.

CSS layers are `theme`, `vendor`, `base`, `components`, `utilities`. Unlayered
application CSS overrides ordinary bundle rules. Configure application styles
after bundle styles. Theme source is `assets/css/ui.css`, shared tokens are in
`assets/css/ui/tokens.css`, and scoped surface styles are under `assets/css/ui/`.
Keep public `Theme` configuration for fonts, grays, primary colors, radius and
spacing. Set semantic variables on `[data-ea-ui]` and appearance overrides on its
`data-theme` root. Declare derived variables where their source values change.
Sources: `assets/css/layers.css`, `assets/css/ui.css`, `src/Config/Theme.php`.

Use existing `ea:*` Twig components and preserve their props, slots, native and
prefixed attributes. The `ea_ui_classes`/`ea_ui_attrs` adapter accepts bounded
legacy column/style/attribute configuration. Numeric columns and supported
responsive strings retain their original 576/768/992/1200/1400px breakpoints.
The adapter does not implement arbitrary Bootstrap utilities or plugins.
Sources: `src/Twig/PresentationExtension.php`, `templates/components/`.

Extend `@EasyAdmin/crud/form_theme.html.twig` for form blocks. Keep names, IDs,
attributes, translations, label/help/error associations, CSRF, multipart and
hidden/rest rendering. Old bundle Bootstrap theme paths are neutral aliases;
downstream Bootstrap-specific block markup still needs migration.
Sources: `templates/crud/form_theme.html.twig`, `UPGRADE.md`.

Custom content pages extend `@EasyAdmin/page/content.html.twig`; it enables
prose typography on the `main` block. Keep `parent()` when overriding body
classes. Elsewhere use `ea-prose`; `ea-not-prose` opts out. Prose excludes UI
controls and supports the existing `--ea-prose-*` variables.
Sources: `templates/page/content.html.twig`, `assets/css/ui/prose.css`.

Use native `data-ea-toggle`, `data-ea-target` and `data-ea-dismiss` controls for
menus, dialogs, tabs and collapse. Replace Bootstrap constructors and `*.bs.*`
listeners with the existing Twig components and native UI lifecycle events.
Keep `ea.form.submit`, `ea.form.error`, `ea.collection.item-added` and
`ea.collection.item-removed`, including cancellation and payloads. Call
`window.EasyAdminApp.init(container)` for application-inserted content after
loading its configured field entry scripts. Existing widget instances are reused.
Sources: `assets/js/ui/interactions.js`, `assets/js/crud.js`, `assets/js/form.js`,
`assets/js/field-collection.js`, `assets/js/widget-lifecycle.js`.

Add an application-owned compiled stylesheet for Tailwind classes absent from
the bundle. Use explicit application source discovery and complete class names.
AssetMapper delivers compiled files; it does not compile new class names added
to Twig. Do not add Bootstrap alongside daisyUI or load a browser compiler/CDN.
See `docs/ui-migration/extending.md` for configuration and migration details.
