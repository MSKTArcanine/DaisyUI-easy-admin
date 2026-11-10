<?php

use App\Kernel;
use Symfony\Component\HttpFoundation\Request;

require \dirname(__DIR__).'/vendor/autoload.php';
$environment = getenv('APP_ENV') ?: 'prod';
$kernel = new Kernel($environment, 'prod' !== $environment);
$request = Request::createFromGlobals();
$response = $kernel->handle($request);
$response->send();
$kernel->terminate($request, $response);
