<?php

require \dirname(__DIR__, 2).'/vendor/autoload.php';
require __DIR__.'/Kernel.php';

use EasyCorp\Bundle\EasyAdminBundle\Tools\UiBuild\Kernel;
use Symfony\Component\Filesystem\Filesystem;

$filesystem = new Filesystem();
$manifestPath = __DIR__.'/public/assets/manifest.json';
$manifest = json_decode($filesystem->readFile($manifestPath), true, flags: \JSON_THROW_ON_ERROR);
$mappedPath = $manifest['easyadmin/ui.css'] ?? null;
if (!\is_string($mappedPath) || !str_starts_with($mappedPath, '/assets/')) {
    throw new RuntimeException('The AssetMapper build must contain the EasyAdmin stylesheet.');
}
$compiledRoot = realpath(__DIR__.'/public/assets');
$compiledPath = realpath(__DIR__.'/public'.$mappedPath);
if (false === $compiledRoot || false === $compiledPath || !str_starts_with($compiledPath, $compiledRoot.\DIRECTORY_SEPARATOR)) {
    throw new RuntimeException('The compiled stylesheet must be inside the AssetMapper output directory.');
}
$css = $filesystem->readFile($compiledPath);
$tailwindCss = $filesystem->readFile(__DIR__.'/var/tailwind/ui.built.css');
if ($css !== $tailwindCss) {
    throw new RuntimeException('The mapped stylesheet differs from the Tailwind cache used by Encore. Check asset URL processing before packaging it.');
}
$exportPath = Kernel::repositoryDir().'/var/ui-build/ui.css';
$filesystem->dumpFile($exportPath, $css);
$filesystem->dumpFile(Kernel::repositoryDir().'/var/ui-build/manifest.json', json_encode([
    'logicalPath' => 'easyadmin/ui.css', 'mappedPath' => $mappedPath,
    'sourceSha256' => hash('sha256', $css), 'bytes' => \strlen($css),
], \JSON_PRETTY_PRINT | \JSON_UNESCAPED_SLASHES | \JSON_THROW_ON_ERROR)."\n");
printf("Exported %d bytes from %s to %s.\n", \strlen($css), $mappedPath, $exportPath);
