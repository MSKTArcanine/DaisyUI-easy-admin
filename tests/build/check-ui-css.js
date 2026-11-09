const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const postcss = require('postcss');

const filename = process.argv[2] || 'tests/Browser/var/tailwind/ui-preview.built.css';
const css = fs.readFileSync(path.resolve(filename), 'utf8');
const stylesheet = postcss.parse(css, { from: filename });
const selectors = [];
const layerNames = new Set();

stylesheet.walkRules((rule) => selectors.push(rule.selector));
stylesheet.walkAtRules('layer', (rule) => {
    for (const name of rule.params.split(',')) layerNames.add(name.trim());
});

for (const selector of [
    '.btn',
    '.btn-primary',
    '.badge',
    '.badge-success',
    '.input',
    '.grid',
    '.md\\:grid-cols-2',
    '.outline-offset-\\[7px\\]',
]) {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const classBoundary = new RegExp(`${escaped}(?![\\w\\\\-])`);
    assert(
        selectors.some((candidate) => classBoundary.test(candidate)),
        `The production stylesheet is missing ${selector}.`
    );
}
for (const layer of ['theme', 'base', 'utilities']) {
    assert(layerNames.has(layer), `The stylesheet is missing its ${layer} layer.`);
}
for (const theme of ['easyadmin-light', 'easyadmin-dark']) {
    assert(
        selectors.some(
            (selector) => selector.includes(`[data-theme=${theme}]`) || selector.includes(`[data-theme="${theme}"]`)
        ),
        `The ${theme} theme is missing.`
    );
}

assert(!/@(?:import|plugin|source|tailwind)\b/.test(css), 'Uncompiled build directives remain in the output.');
assert(
    !/Bootstrap v[345]|--bs-body-font-family|--bs-gutter-x/.test(css),
    'Bootstrap runtime CSS was found in the isolated stylesheet.'
);

const globalResetProperties = new Set([
    'box-sizing',
    'margin',
    'padding',
    'font',
    'font-family',
    'font-size',
    'border',
    'border-width',
    'appearance',
]);
stylesheet.walkRules((rule) => {
    if (!/(?:^|,)\s*(?:\*|html|body|:host)\s*(?:,|$)/.test(rule.selector)) return;
    rule.walkDecls((declaration) => {
        assert(
            !globalResetProperties.has(declaration.prop),
            `Unscoped reset ${rule.selector} { ${declaration.prop}: ${declaration.value} } was found.`
        );
    });
});

console.log(
    `Verified ${filename}: ${Buffer.byteLength(css)} bytes, production classes, named themes/layers, no uncompiled directives, Bootstrap signature, or global Preflight reset.`
);
