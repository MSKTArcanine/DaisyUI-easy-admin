<?php

namespace Symfony\Component\DependencyInjection\Loader\Configurator;

use EasyCorp\Bundle\EasyAdminBundle\Tests\Browser\Form\NestedEntryType;
use EasyCorp\Bundle\EasyAdminBundle\Tests\Browser\Twig\NonceExtension;
use Symfony\Bridge\Twig\Extension\ImportMapExtension;
use Symfony\Bridge\Twig\Extension\ImportMapRuntime;

return static function (ContainerConfigurator $container): void {
    $container->services()
        ->set(NonceExtension::class)->args([service('request_stack')])->tag('twig.extension')
        ->set('twig.extension.importmap', ImportMapExtension::class)->tag('twig.extension')
        ->set('twig.runtime.importmap', ImportMapRuntime::class)
            ->args([service('asset_mapper.importmap.renderer')])->tag('twig.runtime');

    $container->services()->defaults()->autowire()->autoconfigure()
        ->set(NestedEntryType::class);

    $container->services()->defaults()->autowire()->autoconfigure()
        ->load('EasyCorp\\Bundle\\EasyAdminBundle\\Tests\\Browser\\Controller\\', __DIR__.'/Controller/')
        ->tag('controller.service_arguments');
};
