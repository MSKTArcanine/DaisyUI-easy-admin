<?php

$source = realpath(\dirname(__DIR__));
$target = $argv[1] ?? null;
if (null === $target || file_exists($target) || !is_dir(\dirname($target))) {
    throw new InvalidArgumentException('Pass a new application directory whose parent already exists.');
}
$target = realpath(\dirname($target)).\DIRECTORY_SEPARATOR.basename($target);
if ($target === $source || str_starts_with($target, $source.\DIRECTORY_SEPARATOR)) {
    throw new InvalidArgumentException('Choose a target outside the consumer source directory.');
}
$reference = json_decode(file_get_contents($source.'/package-reference.json'), true, flags: \JSON_THROW_ON_ERROR);
$archiveName = 'easyadmin-bundle-'.$reference['version'].'.zip';
$archive = $source.'/var/packages/'.$archiveName;
if (!is_file($archive) || hash_file('sha256', $archive) !== $reference['sha256']) {
    throw new RuntimeException('Prepare the pinned package archive before copying the application.');
}
function copySource(string $source, string $target, string $relative = ''): void
{
    mkdir($target, 0775, true);
    foreach (scandir($source) as $name) {
        if (\in_array($name, ['.', '..', 'vendor', 'node_modules', 'var'], true) || ('public' === $relative && \in_array($name, ['assets', 'bundles'], true))) {
            continue;
        }
        $path = $source.'/'.$name;
        if (is_link($path)) {
            throw new RuntimeException('The consumer source must contain ordinary files and directories.');
        }
        if (is_dir($path)) {
            copySource($path, $target.'/'.$name, ltrim($relative.'/'.$name, '/'));
        } else {
            copy($path, $target.'/'.$name);
        }
    }
}
copySource($source, $target);
mkdir($target.'/var/packages', 0775, true);
copy($archive, $target.'/var/packages/'.$archiveName);
echo realpath($target)."\n";
