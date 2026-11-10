<?php

use App\Command\FixturesCommand;
use App\Controller\DashboardController;
use App\Controller\EntryCrudController;
use App\Controller\SecurityController;
use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;
use function Symfony\Component\DependencyInjection\Loader\Configurator\service;

return static function (ContainerConfigurator $container): void {
    $services = $container->services()->defaults()->autoconfigure();
    $services->set(DashboardController::class)->autowire()->tag('controller.service_arguments');
    $services->set(EntryCrudController::class)->autowire()->args([service('doctrine.orm.entity_manager')])->tag('controller.service_arguments');
    $services->set(SecurityController::class)->autowire()->args([service('security.authentication_utils')])->tag('controller.service_arguments');
    $services->set(FixturesCommand::class)->args([service('doctrine.orm.entity_manager')]);
};
