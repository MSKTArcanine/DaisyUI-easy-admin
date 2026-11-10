<?php

use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;
use Symfony\Component\Security\Core\User\InMemoryUser;

return static function (ContainerConfigurator $container): void {
    $container->extension('security', [
        'password_hashers' => [InMemoryUser::class => 'plaintext'],
        'providers' => ['consumer' => ['memory' => ['users' => ['admin' => ['password' => 'consumer-password', 'roles' => ['ROLE_ADMIN']]]]]],
        'firewalls' => ['main' => ['lazy' => true, 'provider' => 'consumer',
            'form_login' => ['login_path' => 'consumer_login', 'check_path' => 'consumer_login', 'enable_csrf' => true, 'default_target_path' => 'consumer_admin'],
            'logout' => ['path' => 'consumer_logout', 'target' => 'consumer_login'],
        ]],
        'access_control' => [['path' => '^/admin', 'roles' => 'ROLE_ADMIN']],
    ]);
};
