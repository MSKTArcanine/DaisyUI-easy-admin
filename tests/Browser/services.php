<?php

namespace Symfony\Component\DependencyInjection\Loader\Configurator;

return static function (ContainerConfigurator $container): void {
    $container->services()->defaults()->autowire()->autoconfigure()
        ->load('EasyCorp\\Bundle\\EasyAdminBundle\\Tests\\Browser\\Controller\\', __DIR__.'/Controller/')
        ->tag('controller.service_arguments');
};
