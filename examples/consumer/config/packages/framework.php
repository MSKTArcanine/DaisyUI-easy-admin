<?php

use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;

return static function (ContainerConfigurator $container): void {
    $container->extension('framework', [
        'secret' => 'standalone-consumer-example-secret',
        'default_locale' => 'en',
        'csrf_protection' => true,
        'http_method_override' => true,
        'session' => ['storage_factory_id' => 'session.storage.factory.native', 'save_path' => '%kernel.project_dir%/var/sessions'],
        'translator' => ['fallbacks' => ['en']],
        'asset_mapper' => ['paths' => ['%kernel.project_dir%/assets' => ''], 'public_prefix' => '/assets/', 'importmap_path' => '%kernel.project_dir%/importmap.php', 'importmap_polyfill' => false],
    ]);
    $container->extension('twig_component', ['anonymous_template_directory' => 'components/']);
    $container->extension('twig', ['default_path' => '%kernel.project_dir%/templates', 'strict_variables' => true]);
};
