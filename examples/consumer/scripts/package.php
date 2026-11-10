<?php

$projectDir = \dirname(__DIR__);
$repository = $argv[1] ?? null;
$revision = $argv[2] ?? null;
if (null === $repository || null === $revision) {
    throw new InvalidArgumentException('Usage: php scripts/package.php /path/to/fork COMMIT_OR_TAG.');
}

function command(array $arguments): string
{
    $process = proc_open($arguments, [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
    if (!\is_resource($process)) {
        throw new RuntimeException('Unable to start the archive command.');
    }
    $output = stream_get_contents($pipes[1]);
    $error = stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    if (0 !== proc_close($process)) {
        throw new RuntimeException(trim($error));
    }

    return trim($output);
}

$reference = command(['git', '-C', $repository, 'rev-parse', $revision.'^{commit}']);
$timestamp = (int) command(['git', '-C', $repository, 'show', '-s', '--format=%ct', $reference]);
$directory = $projectDir.'/var/packages';
if (!is_dir($directory)) {
    mkdir($directory, 0775, true);
}
$version = '5.9.1-dev';
$archive = $directory.'/easyadmin-bundle-'.$version.'.zip';
command(['git', '-C', $repository, 'archive', '--format=zip', '--output='.$archive, $reference]);
$zip = new ZipArchive();
if (true !== $zip->open($archive)) {
    throw new RuntimeException('Unable to open the package archive.');
}
$manifest = json_decode($zip->getFromName('composer.json'), true, flags: \JSON_THROW_ON_ERROR);
$manifest['version'] = $version;
$manifest['extra']['consumer-proof']['reference'] = $reference;
$zip->addFromString('composer.json', json_encode($manifest, \JSON_PRETTY_PRINT | \JSON_UNESCAPED_SLASHES | \JSON_THROW_ON_ERROR)."\n");
$zip->setMtimeName('composer.json', $timestamp);
$zip->setCompressionName('composer.json', ZipArchive::CM_STORE);
$zip->setExternalAttributesName('composer.json', ZipArchive::OPSYS_UNIX, 0100644 << 16);
$zip->close();
$record = ['reference' => $reference, 'version' => $version, 'sha256' => hash_file('sha256', $archive)];
file_put_contents($projectDir.'/package-reference.json', json_encode($record, \JSON_PRETTY_PRINT | \JSON_UNESCAPED_SLASHES | \JSON_THROW_ON_ERROR)."\n");
echo json_encode($record, \JSON_THROW_ON_ERROR)."\n";
