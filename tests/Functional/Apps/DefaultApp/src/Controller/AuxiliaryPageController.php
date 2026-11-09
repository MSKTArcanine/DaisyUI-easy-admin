<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Apps\DefaultApp\Controller;

use EasyCorp\Bundle\EasyAdminBundle\Attribute\AdminRoute;
use EasyCorp\Bundle\EasyAdminBundle\Exception\FlattenException;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Core\Exception\BadCredentialsException;

class AuxiliaryPageController extends AbstractController
{
    #[Route('/auxiliary-pages/login', name: 'auxiliary_pages_login')]
    #[AdminRoute(path: '/auxiliary-pages/login', name: 'auxiliary_pages_login')]
    public function login(): Response
    {
        return $this->render('@EasyAdmin/page/login.html.twig', [
            'page_title' => 'Auxiliary login', 'action' => '/authenticate-identity',
            'csrf_token_intention' => 'authenticate', 'target_path_parameter' => 'destination',
            'target_path' => '/after-authentication', 'last_username' => 'Previous identity',
            'username_parameter' => 'identity', 'username_label' => '<b>Identity</b>',
            'password_parameter' => 'secret', 'password_label' => 'Secret',
            'remember_me_enabled' => true, 'remember_me_checked' => true,
            'remember_me_parameter' => 'remember_identity', 'remember_me_label' => 'Remember identity',
            'forgot_password_enabled' => true, 'forgot_password_path' => '/recover-identity',
            'forgot_password_label' => 'Recover identity', 'error' => new BadCredentialsException(),
        ]);
    }

    #[Route('/auxiliary-pages/content/{_locale}', name: 'auxiliary_pages_content', defaults: ['_locale' => 'en'])]
    #[AdminRoute(path: '/auxiliary-pages/content', name: 'auxiliary_pages_content')]
    public function content(): Response
    {
        return $this->render('admin/auxiliary_content.html.twig');
    }

    #[Route('/auxiliary-pages/welcome', name: 'auxiliary_pages_welcome')]
    public function welcome(): Response
    {
        return $this->render('@EasyAdmin/welcome.html.twig', ['dashboard_controller_filepath' => '<script>private_path</script>']);
    }

    #[Route('/auxiliary-pages/exception', name: 'auxiliary_pages_exception')]
    public function exception(): Response
    {
        return $this->render('@EasyAdmin/exception_standalone.html.twig', [
            'exception' => FlattenException::createFromThrowable(new NotFoundHttpException('<script>private_debug</script>')),
        ], new Response(status: 404));
    }
}
