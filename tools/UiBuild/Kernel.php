<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tools\UiBuild;

use Symfony\Bundle\FrameworkBundle\FrameworkBundle;
use Symfony\Bundle\FrameworkBundle\Kernel\MicroKernelTrait;
use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;
use Symfony\Component\HttpKernel\Kernel as BaseKernel;
use Symfony\Component\Routing\Loader\Configurator\RoutingConfigurator;
use Symfonycasts\TailwindBundle\SymfonycastsTailwindBundle;

final class Kernel extends BaseKernel
{
    use MicroKernelTrait;

    public function __construct()
    {
        parent::__construct('prod', false);
    }

    public static function repositoryDir(): string
    {
        return \dirname(__DIR__, 2);
    }

    public function getProjectDir(): string
    {
        return __DIR__;
    }

    public function getCacheDir(): string
    {
        return sys_get_temp_dir().'/easyadmin-ui-build/cache/'.$this->environment;
    }

    public function getLogDir(): string
    {
        return sys_get_temp_dir().'/easyadmin-ui-build/log';
    }

    public function registerBundles(): iterable
    {
        return [new FrameworkBundle(), new SymfonycastsTailwindBundle()];
    }

    protected function configureContainer(ContainerConfigurator $container): void
    {
        $container->extension('framework', [
            'secret' => 'easyadmin-local-ui-build',
            'asset_mapper' => [
                'paths' => [self::repositoryDir().'/assets/css' => 'easyadmin'],
                'excluded_patterns' => [
                    '*/assets/css/app.css', '*/assets/css/ui-fonts-preview.css', '*/assets/css/layers.css',
                    '*/assets/css/form-type-*.css', '*/assets/css/easyadmin-theme/*', '*/assets/css/ui/*',
                    '*/assets/css/migration-*.css',
                ],
                'server' => false,
                'public_prefix' => '/assets/',
                'missing_import_mode' => 'strict',
                'importmap_path' => __DIR__.'/importmap.php',
                'importmap_polyfill' => false,
            ],
        ]);
        $container->extension('symfonycasts_tailwind', [
            'binary' => self::repositoryDir().'/node_modules/.bin/tailwindcss',
            'input_css' => [self::repositoryDir().'/assets/css/ui-preview.css'],
        ]);
    }

    protected function configureRoutes(RoutingConfigurator $routes): void
    {
    }
}
