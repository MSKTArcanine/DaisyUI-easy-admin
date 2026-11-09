<?php

require __DIR__.'/bootstrap.php';

use EasyCorp\Bundle\EasyAdminBundle\Tests\Browser\Kernel;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Request;

if (!\in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'], true)) {
    http_response_code(403);
    exit('The browser fixture is available on loopback only.');
}

$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'], \PHP_URL_PATH));
$staticRoots = [
    '/assets-built/' => __DIR__.'/public/assets-built',
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
$previewMode = $request->query->get('ui', $request->cookies->get('ea-ui-preview', 'legacy'));
$cspEnabled = '1' === $request->query->get('csp', $request->cookies->get('ea-ui-csp', '0'));
$request->attributes->set('browser_ui_preview', 'tailwind' === $previewMode);
$response = $kernel->handle($request);
if ($request->query->has('ui') && \in_array($previewMode, ['tailwind', 'legacy'], true)) {
    $response->headers->setCookie(Cookie::create('ea-ui-preview', $previewMode)->withHttpOnly(true)->withSameSite(Cookie::SAMESITE_LAX));
}
if ($request->query->has('csp')) {
    $response->headers->setCookie(Cookie::create('ea-ui-csp', $cspEnabled ? '1' : '0')->withHttpOnly(true)->withSameSite(Cookie::SAMESITE_LAX));
}
if ($cspEnabled) {
    $nonce = $request->attributes->get('browser_csp_nonce');
    $response->headers->set('Content-Security-Policy', sprintf("default-src 'self'; script-src 'self' 'nonce-%s'; style-src 'self' 'nonce-%s'; style-src-attr 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'", $nonce, $nonce));
}
$response->send();
$kernel->terminate($request, $response);
