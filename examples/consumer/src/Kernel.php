<?php

namespace App;

use Doctrine\Bundle\DoctrineBundle\DoctrineBundle;
use EasyCorp\Bundle\EasyAdminBundle\EasyAdminBundle;
use Symfony\Bundle\FrameworkBundle\FrameworkBundle;
use Symfony\Bundle\FrameworkBundle\Kernel\MicroKernelTrait;
use Symfony\Bundle\SecurityBundle\SecurityBundle;
use Symfony\Bundle\TwigBundle\TwigBundle;
use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;
use Symfony\Component\HttpKernel\Kernel as BaseKernel;
use Symfony\Component\Routing\Loader\Configurator\RoutingConfigurator;
use Symfony\UX\TwigComponent\TwigComponentBundle;
use Symfonycasts\TailwindBundle\SymfonycastsTailwindBundle;
use Twig\Extra\TwigExtraBundle\TwigExtraBundle;

class Kernel extends BaseKernel
{
    use MicroKernelTrait;

    public function getProjectDir(): string
    {
        return \dirname(__DIR__);
    }

    public function registerBundles(): iterable
    {
        yield new FrameworkBundle();
        yield new SecurityBundle();
        yield new TwigBundle();
        yield new DoctrineBundle();
        yield new TwigComponentBundle();
        yield new TwigExtraBundle();
        yield new EasyAdminBundle();
        if ('dev' === $this->environment && class_exists(SymfonycastsTailwindBundle::class)) {
            yield new SymfonycastsTailwindBundle();
        }
    }

    protected function configureContainer(ContainerConfigurator $container): void
    {
        $container->import(__DIR__.'/../config/packages/*.php');
        $container->import(__DIR__.'/../config/services.php');
        if ('dev' === $this->environment && class_exists(SymfonycastsTailwindBundle::class)) {
            $container->extension('symfonycasts_tailwind', [
                'binary' => '%kernel.project_dir%/node_modules/.bin/tailwindcss',
                'binary_version' => 'v4.3.3',
                'input_css' => ['%kernel.project_dir%/tailwind/consumer.css'],
            ]);
        }
    }

    protected function configureRoutes(RoutingConfigurator $routes): void
    {
        $routes->import(__DIR__.'/Controller/', 'attribute');
        $routes->import('.', 'easyadmin.routes');
    }
}
