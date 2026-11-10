const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (filename) => fs.readFileSync(path.join(root, filename), 'utf8');
const filesBelow = (directory) =>
    fs.readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap((entry) => {
        const filename = `${directory}/${entry.name}`;
        return entry.isDirectory() ? filesBelow(filename) : [filename];
    });
const packageJson = JSON.parse(read('package.json'));
assert(!packageJson.dependencies?.bootstrap && !packageJson.devDependencies?.bootstrap);
assert(!/^"?bootstrap@/m.test(read('yarn.lock')), 'Bootstrap remains in the dependency lock.');
assert(!fs.existsSync(path.join(root, 'node_modules/bootstrap')), 'Bootstrap is still installed.');

for (const filename of filesBelow('assets').filter((name) => /\.(?:css|js)$/.test(name))) {
    const source = read(filename);
    assert(!/['"]~?bootstrap(?:\/|['"])/.test(source), `${filename} imports Bootstrap.`);
    assert(!/data-bs-|\.bs\.(?:modal|dropdown|tooltip|popover|tab|collapse)/.test(source), filename);
}
for (const filename of filesBelow('templates').filter((name) => name.endsWith('.twig'))) {
    assert(!/data-bs-|bootstrap_(?:5|base)_layout/.test(read(filename)), `${filename} uses Bootstrap.`);
}

const expectedEntries = [
    'app',
    'form',
    'page-layout',
    'page-color-scheme',
    'field-boolean',
    'field-code-editor',
    'field-collection',
    'field-file-upload',
    'field-image',
    'field-slug',
    'field-textarea',
    'field-text-editor',
    'login',
];
const entries = JSON.parse(read('public/entrypoints.json')).entrypoints;
assert.deepEqual(Object.keys(entries).sort(), expectedEntries.sort(), 'Distributed entry names changed.');
const manifest = JSON.parse(read('public/manifest.json'));
for (const filename of Object.values(manifest)) {
    assert(!filename.startsWith('/') && !filename.includes('..'), filename);
    assert(fs.existsSync(path.join(root, 'public', filename)), `Missing manifest target ${filename}.`);
}
const compiledFiles = filesBelow('public').filter((name) => /\.(?:css|js)$/.test(name));
for (const filename of compiledFiles) {
    assert(!/ui-(?:preview|fonts-preview|crud-preview)/.test(filename), `Temporary asset ${filename}.`);
    assert(
        !/Bootstrap v[345]|--bs-|data-bs-|['"]bs\.(?:modal|dropdown|tooltip|popover|tab|collapse)/.test(read(filename)),
        `Bootstrap runtime signature in ${filename}.`
    );
}
for (const filename of ['dompurify-LICENSE.txt', 'popper-MIT.txt', 'tom-select-APACHE-2.0.txt']) {
    assert(
        fs.existsSync(path.join(root, 'public/licenses', filename)),
        `Missing retained dependency license ${filename}.`
    );
}

const statsPath = process.argv[2];
const moduleIdentifiers = new Set();
if (statsPath) {
    const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
    const visit = (node) => {
        if (typeof node !== 'object' || node === null) return;
        if (node.name || node.identifier) {
            assert(!/node_modules[\\/]bootstrap[\\/]/.test(`${node.name} ${node.identifier}`));
            if (node.identifier) moduleIdentifiers.add(node.identifier);
        }
        for (const [key, value] of Object.entries(node)) {
            if (key === 'source') continue;
            if (Array.isArray(value)) value.forEach(visit);
            else if (value && typeof value === 'object') visit(value);
        }
    };
    visit(stats);
    assert(moduleIdentifiers.size > 0, 'Webpack stats contain no resolved module records.');
}
console.log(
    JSON.stringify({
        passed: true,
        originalEntries: expectedEntries.length,
        manifestTargets: Object.keys(manifest).length,
        compiledFiles: compiledFiles.length,
        resolvedModules: moduleIdentifiers.size,
        bootstrap: false,
    })
);
