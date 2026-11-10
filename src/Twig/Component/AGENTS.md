# Twig Components

How to build UI components in EasyAdmin with [Symfony UX TwigComponent](https://symfony.com/bundles/ux-twig-component/current/index.html). Read this before adding or changing anything under `src/Twig/Component/` or `templates/components/`.

## Direction (read first)

- We're **incrementally breaking the whole UI into components.** Prefer extracting reusable components over hand-written markup; when you touch a template, consider whether its markup should become — or use — a component.
- **Long-term goal: a shadcn/ui-like design system built on a small set of global design tokens** (radius, spacing, colors, …). The theme uses **Tailwind CSS 4 and daisyUI 5** with scoped EasyAdmin styles. **Every new component must use the shared rendering foundation**:
  - Prefer **shared design tokens** over one-off props. Drive variants from a small, shared scale, not per-component booleans. The canonical example is the shared **radius scale**: the `Radius` backed enum in `Option/` (shadcn's `none/sm/md/lg/full` scale), rendered through utility classes tied to the `--border-radius*` CSS variables — instead of e.g. a `pill` boolean on a single component. Follow this pattern for new scales. The shared `Size` enum (`sm/md/lg`) in `Option/` plays the same role for component sizes; each component renders its own `{prefix}-{size}` class (`md` emits none) and may support only a subset of the scale.
  - Add to the shared scale instead of inventing a per-component option.
  - When a token is unset, inherit the project default — don't hardcode values.

## Two kinds of components

1. **Anonymous (template-only)** — for pure markup with no logic. Declare inputs with `{% props %}` at the top of `templates/components/<Name>.html.twig`. Examples: `Switch.html.twig`, `ActionMenu`.
2. **Class-backed** — when you need logic, computed values, defaults, or services. PHP class in `src/Twig/Component/<Name>.php` + template in `templates/components/<Name>.html.twig`. Examples: `Alert`, `Badge`, `Button`, `Icon`, `Flag`.

Prefer anonymous components; reach for a class only when there's real logic.

Complex components can be split into **sub-components in a subdirectory** of `templates/components/` (e.g. `ActionMenu/` contains `Button`, `Overlay`, `ActionList/Item`, …), used as `<twig:ea:ActionMenu:Button>`.

**⚠️ No Live Components.** Don't use Symfony UX LiveComponent — it doesn't work in a reusable third-party bundle like this one. Stick to plain TwigComponents; add interactivity through the native modules in `assets/js/ui/` and existing widget lifecycle instead.

## Conventions

**Naming & usage.** All components use the `ea` prefix: a class/template named `Alert` is used as `<twig:ea:Alert>`. This is configured once in `EasyAdminBundle::prependExtension()` (`name_prefix: ea`, `template_directory: @EasyAdmin/components/`) — you don't annotate classes with `#[AsTwigComponent]`.

**Registration (class-backed).** Register the component explicitly in `config/services.php` with the `twig.component` tag. No autowiring — pass dependencies as explicit args, like every service in this bundle:
```php
->set(Alert::class)
    ->tag('twig.component')
```

**Props.**
- Class-backed: declare public typed properties; use `mount()` for coercion/validation of inputs. Give every public property a docblock with its description (no type, PHP already has it). The UI Kit shows the type of the `mount()` argument with the same name when there is one (it usually accepts more, e.g. `string|AlertVariant`) and the default value of the property. Document arguments of `mount()` that have no property with `@param`.
- Anonymous: declare `{% props name = default %}`.
- Document every prop of an anonymous component with a Twig documentation comment (`## ...`) on the line **above** it, never after it (a `## ...` takes the rest of its line). The first word is the type, with no spaces (`bool`, `string|null`, `'sm'|'md'|Size`); mark internal props as `## bool Internal: ...`. See `Switch.html.twig`:
  ```twig
  {% props
      ## 'sm'|'md'|Size The size of the switch (a string or a `Size` enum case).
      size = 'md',
  %}
  ```
  ⚠️ Never write a `<twig:...>` tag inside a `##` prop comment: the TwigComponent pre-lexer doesn't treat it as a comment and parses the tag as a component. Name the sub-component instead (`ItemGroup` sub-components).
- Document every block (`<twig:block>` or `{% block %}`) with `{## ... -#}` on the line above it (or `{##- ... -#}` before `{%-`), so the output doesn't change. Free-form comments (usage examples, design notes) stay as `{# ... #}`.
- `ComponentDocumentationTest` fails when a prop or block of `templates/components/` or a public property of a component class has no documentation, and the UI Kit (`/_ea_ui_kit`) renders these docs as the props and blocks tables of each component.

**Variants via backed enums.** Put option enums in `src/Twig/Component/Option/` (e.g. `AlertVariant`, `ButtonVariant`). ⚠️ **TwigComponent does NOT auto-coerce string props to enums.** Accept `string|Enum` in `mount()` and coerce with `tryFrom()`, falling back to a default (see `Alert::mount()`):
```php
public function mount(string|AlertVariant $variant): void
{
    $this->variant = \is_string($variant) ? (AlertVariant::tryFrom($variant) ?? AlertVariant::Info) : $variant;
}
```

**Template structure.** Merge props into the root element with `attributes.defaults({...})`, expose slots with `<twig:block name="...">`, and call class methods through `this`:
```twig
<div {{ attributes.defaults({class: this.defaultCssClass(), role: 'alert'}) }}>
    <twig:block name="content"></twig:block>
</div>
```
Compose by calling other components: `<twig:ea:Button ... />`.

**⚠️ Translations in slots.** `{% trans_default_domain %}` set by the caller does NOT reach a component's slot content — the slot is compiled as a separate block scope, so a bare `|trans` falls back to the `messages` domain and renders the raw key (e.g. `label.true`). Always pass the domain explicitly inside slots: `{{ value|trans(domain: 'EasyAdminBundle') }}`. Component *attribute* expressions are evaluated in the caller's scope, so the default domain applies there.

**Styling.** Shared design tokens live in `assets/css/ui/tokens.css`; daisyUI semantic roles and both appearance themes are defined in `assets/css/ui.css`. Reuse existing `assets/css/ui/primitives.css` and the appropriate scoped surface stylesheet before adding another file. Use daisyUI components, complete Tailwind utilities and a small amount of scoped CSS. Preserve public `Theme` configuration for fonts, grays, primary colors, radius and spacing. Keep caller classes and native/prefixed attributes through `ea_ui_classes`/`ea_ui_attrs`; these helpers are a narrow rendering adapter for legacy configuration, not a Bootstrap compatibility stylesheet. Behavior uses `data-ea-*` hooks independent of visual classes. Theme variables are rooted at `[data-ea-ui]`; daisyUI's root option does not scope every component selector. Preflight is omitted. A token derived from other tokens must be declared where those values change (including the dark-scheme body), so inherited resolved values do not mask appearance overrides. Class names are `kebab-case`; existing `ea-` classes remain available. Run `yarn ci` and `make build-assets` after CSS/JS changes. The maintainer build uses TailwindBundle/AssetMapper and preserves the existing Encore distribution entries. For live updates run `make watch-ui` beside `yarn watch`. Keep explicit source discovery and finite semantic inclusion lists; do not scan consuming applications or test fixtures into the shipped bundle. If a component renders text elements (`p`, `a`, `ul`, `table`...), assess the scoped component exclusions in `assets/css/ui/prose.css` so content typography does not restyle controls. Keep the existing component prop/slot/block interface rather than adding another registry or framework.

**Accessibility & i18n.** `aria-*` attributes, semantic tags, and labels are required; all user-facing text goes through `|trans` (mind the slot caveat above). Icons use FontAwesome 6 names.

**Tests.** Add a unit test in `tests/Unit/Twig/Component/<Name>Test.php` (see `AlertTest`, `BadgeTest`, `IconTest`). Cover `mount()` coercion and any computed output.

## Adding a component — checklist

1. Template in `templates/components/<Name>.html.twig` (`{% props %}` if anonymous, with a `##` doc above each prop and a `{## ##}` doc above each block).
2. PHP class in `src/Twig/Component/<Name>.php` only if it needs logic, with a docblock on each public property; option enums in `Option/`.
3. Register in `config/services.php` with `->tag('twig.component')` (class-backed only).
4. Styles via shared tokens in `assets/css/ui/tokens.css` and existing scoped UI styles; `make build-assets`.
5. Use it as `<twig:ea:<Name>>`; build variants from shared scales, not one-off booleans.
6. Unit test in `tests/Unit/Twig/Component/`.
