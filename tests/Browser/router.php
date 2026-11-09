<?php

require __DIR__.'/bootstrap.php';

use EasyCorp\Bundle\EasyAdminBundle\Tests\Browser\Kernel;
use Symfony\Component\HttpFoundation\Request;

if (!\in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'], true)) {
    http_response_code(403);
    exit('The browser fixture is available on loopback only.');
}

$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'], \PHP_URL_PATH));
$staticRoots = [
    '/bundles/easyadmin/' => \dirname(__DIR__, 2).'/public',
    '/browser/' => __DIR__.'/public',
    '/uploads/' => Kernel::storageDir().'/uploads',
];
foreach ($staticRoots as $prefix => $directory) {
    if (!str_starts_with($path, $prefix)) {
        continue;
    }

    $filename = realpath($directory.'/'.substr($path, \strlen($prefix)));
    if (false === $filename || !str_starts_with($filename, realpath($directory).\DIRECTORY_SEPARATOR) || !is_file($filename)) {
        http_response_code(404);
        exit('Fixture asset not found.');
    }

    $extension = pathinfo($filename, \PATHINFO_EXTENSION);
    header('Content-Type: '.match ($extension) {
        'js' => 'text/javascript',
        'css' => 'text/css',
        'woff2' => 'font/woff2',
        'ttf' => 'font/ttf',
        'svg' => 'image/svg+xml',
        'png' => 'image/png',
        'jpg', 'jpeg' => 'image/jpeg',
        default => 'application/octet-stream',
    });
    header('X-Content-Type-Options: nosniff');
    readfile($filename);
    exit;
}

$kernel = new Kernel();
$request = Request::createFromGlobals();
$response = $kernel->handle($request);
$response->send();
$kernel->terminate($request, $response);
