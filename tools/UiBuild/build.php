#!/usr/bin/env php
<?php

require \dirname(__DIR__, 2).'/vendor/autoload.php';

use Symfony\Component\Process\Process;

if ([] !== array_diff(\array_slice($argv, 1), ['--dev'])) {
    throw new InvalidArgumentException('Use --dev for an unminified development stylesheet.');
}
$commands = [
    [\PHP_BINARY, __DIR__.'/console.php', 'cache:clear'],
    [\PHP_BINARY, __DIR__.'/console.php', 'tailwind:build', ...(!\in_array('--dev', $argv, true) ? ['--minify'] : [])],
    [\PHP_BINARY, __DIR__.'/console.php', 'asset-map:compile'],
    [\PHP_BINARY, __DIR__.'/export.php'],
];
foreach ($commands as $command) {
    $process = new Process($command, \dirname(__DIR__, 2));
    $process->setTimeout(120);
    $process->run(static function (string $type, string $output): void {
        fwrite(Process::ERR === $type ? \STDERR : \STDOUT, $output);
    });
    if (!$process->isSuccessful()) {
        exit($process->getExitCode() ?? 1);
    }
}
