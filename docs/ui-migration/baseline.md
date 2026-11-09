# Rendering migration baseline

Audit date: 2026-11-09. Stage: Prompt 1, source inspection only.
Read [inventory.md](inventory.md), [decisions.md](decisions.md),
[coverage.md](coverage.md), and [progress.md](progress.md) together.

## Immutable source baseline

| Item | Observed value |
| --- | --- |
| Repository | `/home/devuser/AI/DaisyUI-easy-admin` |
| Origin | `git@github.com:MSKTArcanine/DaisyUI-easy-admin.git` |
| Origin default branch | `5.x` |
| Checked-out stage branch | `audit_and_define_the_migration_boundary` |
| Baseline commit | `bd0fb8448a41f69b3493c5bea84f793e46fe7c21` |
| Commit subject/date | `Add tests`, 2026-11-08, author Javier Eguiluz |
| Bundle version | `5.9.1-DEV`, `src/EasyAdminBundle.php::VERSION` |
| Composer branch alias | `dev-master` -> `5.0.x-dev`, `composer.json` |
| Tags | No tag points to HEAD; `git describe --tags --always --dirty` returns `bd0fb8448` |
| History | Full checkout (`git rev-parse --is-shallow-repository`: `false`) |
| Initial worktree | No tracked changes; untracked `.idea/` belongs to the user |

Pin upstream to the commit above, not a moving branch or an inferred release.
The [upstream commit](https://github.com/EasyCorp/EasyAdminBundle/commit/bd0fb8448a41f69b3493c5bea84f793e46fe7c21)
was also located in the original repository. Only the fork remote is configured
locally. The stage branch already existed at that SHA when this task began;
its reflog says `branch: Created from HEAD`. Reuse it instead of creating a
second branch with a different title. Subsequent stages use their title-derived
branches and ordered EAD numbers in [progress.md](progress.md).

## Supported server platform

`composer.json` is authoritative, ahead of stale assistant hints in
`.github/copilot-instructions.md`:

- PHP `>=8.2`; Symfony components `^6.4|^7.0|^8.0`, with component-specific
  minimum patches. Examples: framework-bundle `^6.4.33`, form `^6.4.32`, and
  twig-bridge `^6.4.32|^7.1.9|^7.2|^8.0`.
- Doctrine ORM `^2.20|^3.6`, DBAL `^3.10|^4.4`, DoctrineBundle `^2.18|^3.2`.
- Twig and HTML/extra bundles `^3.23`; Symfony UX TwigComponent `^2.32|^3.0`.
- PHPUnit `^11.5.24`, ParaTest `^7.6.1`, DAMA DoctrineTestBundle `^8.2`,
  Foundry `^2.11`; BrowserKit and DomCrawler are development dependencies.
- No runtime requirement for Encore, AssetMapper, Node, or Tailwind today.
  Package identity remains `easycorp/easyadmin-bundle`; PHP namespace remains
  `EasyCorp\Bundle\EasyAdminBundle\`.

`.github/workflows/ci.yaml` covers PHP 8.2/8.3, multiple Symfony 6.4/7.x/8.x
combinations, operating systems, database variants, and experimental future
versions. `.github/workflows/integration-test.yaml` installs the bundle into a
new Symfony application. Preserve that server compatibility matrix.

## Frontend dependency resolution

The repository uses Yarn Classic (`yarn.lock`, v1 format). There is no
`packageManager` field or committed explicit browser target. All packages below
are development dependencies; `dependencies` is empty. Resolved versions were
read from `yarn.lock`, not installed packages.

| Dependency | Manifest constraint | Locked version | Purpose/disposition |
| --- | --- | --- | --- |
| bootstrap | `^5.3.8` | 5.3.8 | Remove after all surfaces migrate |
| @popperjs/core | `^2.11.5` | 2.11.8 | Review after dropdown/popover replacement |
| @symfony/webpack-encore | `^5.0.1` | 5.0.1 | Preserve JS packaging pending AssetMapper proof |
| webpack / webpack-cli | `^5.104.1` / `^5.1.4` | 5.104.1 / 5.1.4 | Existing distribution build |
| postcss | `^8.5.23` | 8.5.23 | CSS build tooling; not Tailwind 4's plugin |
| @babel/core / @babel/preset-env | `^7.29.6` / `^7.16.0` | 7.29.6 / 7.26.0 | JS transpilation |
| core-js / regenerator-runtime | `^3.38.0` / `^0.14.0` | 3.39.0 / 0.14.1 | Existing compatibility dependencies |
| file-loader | `^6.0.0` | 6.2.0 | Asset loading |
| @biomejs/biome | `^1.9.4` | 1.9.4 | Frontend lint/format checks |
| @fortawesome/fontawesome-free | `^6.7.1` | 6.7.1 | Keep icons and compatibility fonts |
| Five @fontsource-variable packages | `5.3.0` each | 5.3.0 each | Atkinson Hyperlegible Next, IBM Plex Sans, Inter, JetBrains Mono, Rubik; retain licenses |
| tom-select | `^2.0.1` | 2.4.1 | Keep autocomplete; replace Bootstrap-derived skin |
| codemirror | `^5.65.2` | 5.65.18 | Keep code editor and modes |
| trix | `^2.1.18` | 2.1.18 | Keep rich-text editor |
| basiclightbox | `^5.0.4` | 5.0.4 | Keep image viewer |
| dirty-form | `^0.4.0` | 0.4.0 | Keep unsaved-change protection |
| mark.js | `^8.11.1` | 8.11.1 | Keep search highlighting |
| slugify | `^1.4.0` | 1.6.6 | Keep slug generation |

## Commands and distributed assets

`Makefile` and `package.json` define these existing commands:

| Command | Actual behavior |
| --- | --- |
| `make help` | Lists repository targets |
| `make build` | `composer update`, then `yarn install`; setup changes resolution |
| `composer install` | PHP installation; no committed `composer.lock` (`.gitignore` excludes it) |
| `yarn install --frozen-lockfile` | Reproduce committed JS resolution |
| `yarn dev`, `yarn watch`, `yarn dev-server` | Encore development build/watch/server |
| `yarn build` | Encore production only; skips the bundle's manifest fix |
| `make build-assets` | `yarn encore production`, then `php ./src/Resources/bin/fix-assets-manifest-file.php` |
| `yarn ci` | `biome ci` |
| `make tests ARGS="tests/Functional/"` | Cache-reset wrapper around PHPUnit |
| `make tests-parallel` | ParaTest |
| `make tests-db DB=postgres` | Starts Compose database and runs functional tests; also mysql/mariadb |
| `make linter-docs` | Docker RST linter mounted at `doc/`; does not lint these Markdown records |
| `make linter-twig` | twig-cs-fixer on `templates/` |
| `make linter-phpstan`, `make linter-cs-fixer` | PHP checks; fixer target is dry-run |
| `make checks-before-pr` | PHP linters, RST linter, Twig linter, PHPUnit; frontend checks are separate |

`webpack.config.js` has 13 JS entries: `app`, `form`, `page-layout`,
`page-color-scheme`, `field-boolean`, `field-code-editor`, `field-collection`,
`field-file-upload`, `field-image`, `field-slug`, `field-textarea`,
`field-text-editor`, and `login`. Three CSS outputs are extracted:
`app.css`, `field-code-editor.css`, and `field-text-editor.css`.

Output is the bundle's tracked `public/`, not `src/Resources/public/` and not
an application's generated `public/bundles/`. Versioning is enabled, source
maps and a separate runtime chunk are disabled. There are 59 shipped files,
including manifests, font files, five OFL licenses, and JS license notices.
`public/manifest.json` has 51 mappings. Baseline SHA-256:

```text
public/manifest.json
a6e56271ad5fb2636e9cd05e99cc8dcc0706630c1e128bd8ba417be837cf7a30
public/entrypoints.json
714274dbbb2471ef4b3ffd3be4326572763b0942af5e8c210518f23b3cbf5bda
```

`src/Asset/AssetPackage.php` reads that manifest through a named Symfony Asset
package, `easyadmin.assets.package`, rooted at `/bundles/easyadmin`. Its request
context handles application subdirectories. The manifest fixer removes leading
slashes and corrects font references. Consumer installation uses
`php bin/console assets:install public`; inspect `.github/workflows/integration-test.yaml`
and `doc/design.rst`. `.gitattributes` excludes build tooling and tests from
package archives but includes precompiled assets. Consumers need no Node build.

## Development and test applications

There is no tracked standalone development application/front controller or root
`bin/console` here. The real Symfony applications in the source tree live in
`tests/Functional/Apps/{DefaultApp,CustomizationApp,SecuredApp,AdminRouteApp}/`.
Their kernels, controllers, entities, config, templates, and Foundry factories
are reusable; `tests/AGENTS.md` describes their responsibilities.

`tests/bootstrap.php` compiles three application containers and recreates their
databases; SQLite is the default. It uses UTC, collects bootstrap deprecations,
and fails rather than hiding them. DAMA rolls back each test. Test kernels force
the test environment; DefaultApp also uses mock file sessions. A normal browser
server cannot be assumed to exist. Prompt 2 must provide a runnable harness
around existing fixtures, with a separate deterministic database and working
sessions for browser requests. No such harness is added in Prompt 1.

`phpunit.xml.dist` defines Unit and Functional suites, and excludes app source
from discovery. No Playwright, Panther, Cypress, or JS test runner/configuration
was found. Source inventory: 16 JS files, 32 CSS files plus a theme license,
and 191 template-directory files (including the form-theme README).
Existing tests are cataloged by behavior in [coverage.md](coverage.md).

`.ddev/config.yaml` defines a PHP 8.5/Node 22/MariaDB 10.11 development
environment. `.ddev/docker-compose.web.yaml` mounts this bundle at
`/var/www/easyadminbundle` and a named `htdocs-data` volume at `/var/www/html`;
it does not provide a tracked consuming app in that volume. Its external
contents/runtime were not inspected or started. Do not assume that environment
is a reproducible browser fixture. `.symfony.bundle.yaml` identifies `5.x` as
the current/dev documentation branch.

## AssetMapper reference application

Read-only reference: `/home/devuser/symfony/symfolearner`, reached as
`../../symfony/symfolearner`; HEAD `ac0688118c9decf51556ac15d1ac59638aa145bb`.

- `composer.json` requires PHP `>=8.5`, Symfony `8.1.*`, AssetMapper `8.1.*`,
  and `symfonycasts/tailwind-bundle ^1.0`. Its lock resolves AssetMapper 8.1.9
  and TailwindBundle 1.0.0. Do not copy its higher server minimums into this fork.
- `config/packages/symfonycasts_tailwind.yaml` pins binary `v4.3.3`.
- `assets/styles/app.css` uses Tailwind 4 CSS configuration, explicit `@source`
  paths, local daisyUI plugins, and semantic light/dark theme tokens.
- `tools/tailwind/daisyui.mjs` identifies itself as 5.7.50; the companion
  `tools/tailwind/daisyui-theme.mjs` provides custom themes.
- `config/packages/asset_mapper.yaml` maps `assets/`, with strict missing
  imports in development and warnings in production. `importmap.php` includes
  `app` and UX modules; `assets/app.js` imports `./styles/app.css`.
- `templates/base.html.twig` renders `importmap('app')` and a first-paint
  `theme-bootstrap.js`; that filename alone does not indicate Bootstrap UI.
- `docker/Dockerfile` installs bundle assets/importmaps, builds Tailwind, then
  runs `asset-map:compile`. It references `infra/build-tailwind.sh`, which is
  absent in this reference checkout. Its Docker build was not executed and
  must not be described as verified. Reproduce the supported console sequence
  instead of copying this missing script or its extra CSS copy operation.

## Audit environment

Observed: PHP 8.5.11, Composer 2.7.1, Node 20.19.5, Yarn 1.22.22; Docker,
Symfony CLI, and a Chromium launcher exist. Composer emits PHP deprecations
even for `--version`. `vendor/`, `vendor/bin/phpunit`, and `node_modules/` are
absent. No dependencies were installed or lockfiles changed in this stage.
Tool presence is not evidence of a working browser, Docker daemon, or test run.
