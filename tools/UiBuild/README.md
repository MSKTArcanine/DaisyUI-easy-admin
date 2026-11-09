# UI asset compilation

This build application uses only FrameworkBundle, AssetMapper and
SymfonyCasts TailwindBundle. It does not boot the browser fixtures, Doctrine,
security or EasyAdmin controllers. The checked-in Yarn dependencies provide
the pinned Tailwind 4 CLI and daisyUI plugin; the build downloads nothing.

`php tools/UiBuild/build.php --dev` builds development CSS, and the same
command without `--dev` builds minified production CSS. Both commands compile
the real AssetMapper manifest and export its stylesheet to
`var/ui-build/ui-preview.css`. The export verifies that the mapped bytes
exactly match the Tailwind cache used by Encore. Encore retains the normal
hashed files, `manifest.json`, `entrypoints.json`, fonts, licenses and
JavaScript entry names. `ui-preview.css` is the additional migration entry
until the final asset cutover.

The ordinary `yarn dev`, `yarn build`, `yarn watch` and `yarn dev-server`
commands prepare this stylesheet before starting Encore. `make build-assets`
also applies the existing asset-manifest and relative-font-URL normalization.
Consumers install the distributed assets without running these tools.

For live development, start `yarn watch` or `yarn dev-server`, then run
`make watch-ui` in a second terminal. Tailwind watches the explicit Twig,
JavaScript and presentation sources; Encore watches its compiled cache file.
An edit to a discovered Twig class therefore updates the shipped CSS through
both watchers. Stop both processes when you finish. A normal production build
recreates the AssetMapper manifest/export and distribution artifacts.

`make build-ui-assets` verifies the production stylesheet independently.
`make build-browser-assets` builds the distribution and the separate browser
fixture wrapper. Fixture templates and JavaScript are discovered by that
wrapper, so test-only classes do not enter the distributed stylesheet.
