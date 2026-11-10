<?php

use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;

return static function (ContainerConfigurator $container): void {
    $container->extension('doctrine', [
        'dbal' => ['driver' => 'pdo_sqlite', 'path' => '%kernel.project_dir%/var/consumer.sqlite', 'logging' => false],
        'orm' => ['auto_generate_proxy_classes' => true, 'enable_lazy_ghost_objects' => true, 'mappings' => [
            'App' => ['is_bundle' => false, 'type' => 'attribute', 'dir' => '%kernel.project_dir%/src/Entity', 'prefix' => 'App\Entity'],
        ]],
    ]);
};
