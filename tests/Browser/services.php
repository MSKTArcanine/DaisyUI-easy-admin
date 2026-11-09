<?php

namespace Symfony\Component\DependencyInjection\Loader\Configurator;

use Symfony\Bridge\Twig\Extension\ImportMapExtension;
use Symfony\Bridge\Twig\Extension\ImportMapRuntime;

return static function (ContainerConfigurator $container): void {
    $container->services()
        ->set('twig.extension.importmap', ImportMapExtension::class)->tag('twig.extension')
        ->set('twig.runtime.importmap', ImportMapRuntime::class)
            ->args([service('asset_mapper.importmap.renderer')])->tag('twig.runtime');

    $container->services()->defaults()->autowire()->autoconfigure()
        ->load('EasyCorp\\Bundle\\EasyAdminBundle\\Tests\\Browser\\Controller\\', __DIR__.'/Controller/')
        ->tag('controller.service_arguments');
};
