<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Browser;

use Doctrine\Bundle\DoctrineBundle\DoctrineBundle;
use EasyCorp\Bundle\EasyAdminBundle\EasyAdminBundle;
use Symfony\Bundle\FrameworkBundle\FrameworkBundle;
use Symfony\Bundle\FrameworkBundle\Kernel\MicroKernelTrait;
use Symfony\Bundle\SecurityBundle\SecurityBundle;
use Symfony\Bundle\TwigBundle\TwigBundle;
use Symfony\Component\Config\Loader\LoaderInterface;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\HttpKernel\Kernel as BaseKernel;
use Symfony\Component\Routing\Loader\Configurator\RoutingConfigurator;
use Symfony\UX\TwigComponent\TwigComponentBundle;
use Symfonycasts\TailwindBundle\SymfonycastsTailwindBundle;
use Twig\Extra\TwigExtraBundle\TwigExtraBundle;

final class Kernel extends BaseKernel
{
    use MicroKernelTrait;

    public function __construct()
    {
        $environment = getenv('EASYADMIN_BROWSER_ENV') ?: 'browser';
        parent::__construct($environment, 'prod' !== $environment);
    }

    public static function storageDir(): string
    {
        return getenv('EASYADMIN_BROWSER_STORAGE') ?: sys_get_temp_dir().'/easyadmin-browser-baseline';
    }

    public function registerBundles(): iterable
    {
        return [new FrameworkBundle(), new SecurityBundle(), new TwigBundle(), new DoctrineBundle(), new TwigComponentBundle(), new TwigExtraBundle(), new EasyAdminBundle(), new SymfonycastsTailwindBundle()];
    }

    public function getProjectDir(): string
    {
        return __DIR__;
    }

    public function getCacheDir(): string
    {
        return self::storageDir().'/cache/'.$this->environment;
    }

    public function getLogDir(): string
    {
        return self::storageDir().'/log';
    }

    protected function configureContainer(ContainerBuilder $container, LoaderInterface $loader): void
    {
        $loader->load(__DIR__.'/../Functional/Apps/DefaultApp/config/packages/framework.php');
        $container->loadFromExtension('framework', [
            'secret' => 'easyadmin-browser-fixture',
            'test' => false,
            'session' => ['storage_factory_id' => 'session.storage.factory.native', 'save_path' => self::storageDir().'/sessions'],
            'asset_mapper' => [
                'paths' => [__DIR__.'/assets' => 'easyadmin', \dirname(__DIR__, 2).'/assets/css' => 'easyadmin', \dirname(__DIR__, 2).'/assets/js/ui' => 'easyadmin-ui', __DIR__.'/public' => ''],
                'excluded_patterns' => [
                    '*/assets/css/app.css',
                    '*/assets/css/ui-fonts-preview.css',
                    '*/assets/css/layers.css',
                    '*/assets/css/form-type-*.css',
                    '*/assets/css/easyadmin-theme/*',
                    '*/tests/Browser/public/assets-built/*',
                ],
                'public_prefix' => 'prod' === $this->environment ? '/assets-built/' : '/assets/',
                'missing_import_mode' => 'strict',
                'importmap_path' => __DIR__.'/importmap.php',
                'importmap_polyfill' => false,
            ],
        ]);
        $container->loadFromExtension('symfonycasts_tailwind', [
            'binary' => \dirname(__DIR__, 2).'/node_modules/.bin/tailwindcss',
            'input_css' => [__DIR__.'/assets/ui-preview.css'],
        ]);
        $container->loadFromExtension('twig', ['default_path' => __DIR__.'/templates', 'strict_variables' => true]);
        $container->loadFromExtension('twig_component', ['anonymous_template_directory' => 'components/']);
        $container->loadFromExtension('security', [
            'password_hashers' => ['Symfony\Component\Security\Core\User\InMemoryUser' => 'plaintext'],
            'providers' => ['browser' => ['memory' => ['users' => ['admin' => ['password' => 'browser-password', 'roles' => ['ROLE_ADMIN']]]]]],
            'firewalls' => ['auxiliary_login' => [
                'pattern' => '^/auxiliary-login$',
                'context' => 'main',
                'lazy' => true,
                'provider' => 'browser',
                'form_login' => [
                    'login_path' => 'browser_auxiliary_login', 'check_path' => 'browser_auxiliary_login',
                    'username_parameter' => 'identity', 'password_parameter' => 'secret', 'target_path_parameter' => 'destination',
                    'enable_csrf' => true, 'csrf_token_id' => 'authenticate', 'default_target_path' => 'browser_admin',
                ],
            ], 'main' => [
                'lazy' => true,
                'provider' => 'browser',
                'form_login' => ['login_path' => 'browser_login', 'check_path' => 'browser_login', 'enable_csrf' => true, 'default_target_path' => 'browser_admin'],
                'logout' => ['path' => 'browser_logout', 'target' => 'browser_login'],
            ]],
            'access_control' => [['path' => '^/admin', 'roles' => 'ROLE_ADMIN']],
        ]);
        $container->loadFromExtension('doctrine', [
            'dbal' => ['driver' => 'pdo_sqlite', 'path' => self::storageDir().'/browser.sqlite', 'logging' => false],
            'orm' => [
                'naming_strategy' => 'doctrine.orm.naming_strategy.underscore_number_aware',
                'mappings' => ['BrowserEntities' => [
                    'is_bundle' => false,
                    'type' => 'attribute',
                    'dir' => __DIR__.'/../Functional/Apps/DefaultApp/src/Entity',
                    'prefix' => 'EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Apps\DefaultApp\Entity',
                ]],
            ],
        ]);
        $container->setParameter('easyadmin.ui_kit.enabled', true);
        $loader->load(__DIR__.'/services.php');
    }

    protected function configureRoutes(RoutingConfigurator $routes): void
    {
        $routes->import(__DIR__.'/Controller/', 'attribute');
        $routes->import('.', 'easyadmin.routes');
    }
}
