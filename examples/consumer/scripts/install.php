<?php

$projectDir = \dirname(__DIR__);
$composer = getenv('CONSUMER_COMPOSER_BINARY') ?: null;
if (null === $composer) {
    foreach (explode(\PATH_SEPARATOR, getenv('PATH') ?: '') as $directory) {
        if (is_file($candidate = $directory.'/composer')) {
            $composer = $candidate;
            break;
        }
    }
}
if (null === $composer || !is_file($projectDir.'/composer.lock')) {
    throw new RuntimeException('Install Composer and retain the committed consumer composer.lock before installing.');
}
if (!is_dir($projectDir.'/var/sessions')) {
    mkdir($projectDir.'/var/sessions', 0775, true);
}
$environment = array_merge(getenv(), ['APP_ENV' => 'prod', 'APP_DEBUG' => '0']);
$commands = [
    [\PHP_BINARY, $composer, 'install', '--no-dev', '--prefer-dist', '--no-interaction', '--no-scripts'],
    [\PHP_BINARY, 'bin/console', 'cache:clear', '--no-warmup'],
    [\PHP_BINARY, 'bin/console', 'assets:install', 'public'],
    [\PHP_BINARY, 'bin/console', 'asset-map:compile'],
    [\PHP_BINARY, 'bin/console', 'app:fixtures', 'seed'],
];
foreach ($commands as $arguments) {
    $process = proc_open($arguments, [0 => \STDIN, 1 => \STDOUT, 2 => \STDERR], $pipes, $projectDir, $environment);
    if (!\is_resource($process) || 0 !== proc_close($process)) {
        throw new RuntimeException('Consumer installation failed.');
    }
}
require $projectDir.'/vendor/autoload.php';
$bundleDir = Composer\InstalledVersions::getInstallPath('easycorp/easyadmin-bundle');
$manifest = json_decode(file_get_contents($bundleDir.'/composer.json'), true, flags: \JSON_THROW_ON_ERROR);
$frontendTools = ['node' => false, 'yarn' => false];
foreach ($frontendTools as $name => $available) {
    foreach (explode(\PATH_SEPARATOR, getenv('PATH') ?: '') as $directory) {
        $frontendTools[$name] = $frontendTools[$name] || is_executable($directory.'/'.$name);
    }
}
$proof = [
    'php' => \PHP_VERSION,
    'symfony' => Symfony\Component\HttpKernel\Kernel::VERSION,
    'package' => Composer\InstalledVersions::getPrettyVersion('easycorp/easyadmin-bundle'),
    'reference' => $manifest['extra']['consumer-proof']['reference'],
    'installPath' => realpath($bundleDir),
    'symlink' => is_link($bundleDir),
    'tailwindBundleInstalled' => class_exists(Symfonycasts\TailwindBundle\SymfonycastsTailwindBundle::class),
    'frontendToolsOnPath' => $frontendTools,
    'commands' => $commands,
];
file_put_contents($projectDir.'/var/install-proof.json', json_encode($proof, \JSON_PRETTY_PRINT | \JSON_UNESCAPED_SLASHES | \JSON_THROW_ON_ERROR)."\n");
echo json_encode($proof, \JSON_UNESCAPED_SLASHES | \JSON_THROW_ON_ERROR)."\n";
