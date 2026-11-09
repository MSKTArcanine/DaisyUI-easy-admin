<?php

require \dirname(__DIR__, 2).'/vendor/autoload.php';

date_default_timezone_set('UTC');

foreach (['', '/sessions', '/uploads', '/log'] as $directory) {
    $path = EasyCorp\Bundle\EasyAdminBundle\Tests\Browser\Kernel::storageDir().$directory;
    if (!is_dir($path) && !mkdir($path, 0775, true) && !is_dir($path)) {
        throw new RuntimeException(sprintf('Cannot create browser fixture directory "%s".', $path));
    }
}
