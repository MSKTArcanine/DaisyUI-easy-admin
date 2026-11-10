# Standalone consuming application

This application installs `easycorp/easyadmin-bundle` as a Composer ZIP artifact.
It has its own entity, configuration, templates, assets, dependency lockfiles,
and database. It never reads the bundle checkout or its development fixtures at
runtime. You need PHP 8.2+ with `pdo_sqlite` and `zip`, Composer, and the
standard Symfony PHP extensions. The archive reference and checksum are in `package-reference.json`.

An application distribution includes its ZIP in `var/packages/`. Install it
without the fork checkout or its development dependencies:

```bash
php8.3 scripts/install.php
APP_ENV=prod php8.3 -S 127.0.0.1:8091 -t public public/router.php
```

To reproduce that distribution as a maintainer, prepare the exact pinned archive
and copy only application source plus that archive into a fresh directory:

```bash
php8.3 examples/consumer/scripts/package.php /path/to/fork COMMIT_SHA
php8.3 examples/consumer/scripts/copy.php /tmp/standalone-consumer
```

`copy.php` excludes installed dependencies, build output, caches, and databases.
Run the installation commands above from the copied directory. The archive-only
consumer version is `5.9.1-dev`; package name and namespace stay unchanged.
This example pins Symfony components to 6.4 to exercise the supported minimum
line. Its Composer platform is PHP 8.2; verification uses PHP 8.3.

Sign in at `/login` with `admin` and `consumer-password`. The install script uses
Composer `--no-dev`, copies bundle assets with `assets:install`, compiles the
application AssetMapper map, and creates deterministic local SQLite data. It
calls no Node or Yarn commands. `var/install-proof.json` records the PHP/Symfony
versions, installed package reference, actual vendor directory, and commands.
Use `php8.3 bin/console app:fixtures seed` to reset this demonstration database,
and `php8.3 bin/console app:fixtures state` to inspect persisted values.

The eight examples are a layout block in `templates/admin/layout.html.twig`, a
configured title template, a partial Symfony form-theme block, `StatusField`, a
GET export action, semantic theme tokens in application CSS, configured CSS and
JavaScript plus an AssetMapper importmap entry, and the arbitrary application
utility `tracking-[0.137em]`. No example edits vendor files.

The compiled application utility stylesheet is committed, so ordinary production
installation requires no frontend compiler. To change the application's class
set, install development dependencies and rebuild it through TailwindBundle and
AssetMapper, using the same pinned Tailwind 4 CLI integration as the fork:

```bash
php8.3 /path/to/composer install
yarn install --frozen-lockfile
APP_ENV=dev php8.3 bin/console tailwind:build --minify
php8.3 scripts/publish-css.php
APP_ENV=prod php8.3 bin/console asset-map:compile
```

`tailwind/consumer.css` stays outside mapped production assets. Its explicit
sources include application templates and presentation mappings. The generated
`assets/styles/consumer-utilities.css` is the only Tailwind application output
served to browsers. Adding classes to Twig requires rebuilding that output.

The application inherits the ordinary bundle `app.css` and `app.js` entrypoints.
The layout override changes only the header block; the login template inherits
the bundle login interface. `assets:install` copies the precompiled package
assets, and AssetMapper serves the application stylesheet, utility output, and
JavaScript without rebuilding the bundle.
