<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Browser\Controller;

use EasyCorp\Bundle\EasyAdminBundle\Exception\FlattenException;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Authentication\AuthenticationUtils;

class AuxiliaryController extends AbstractController
{
    #[Route('/auxiliary-login', name: 'browser_auxiliary_login')]
    public function login(Request $request, AuthenticationUtils $authentication): Response
    {
        $request->setLocale($request->query->get('locale', 'en'));

        return $this->render('browser/login_extension.html.twig', [
            'page_title' => 'Auxiliary login',
            'last_username' => $authentication->getLastUsername(),
            'error' => $authentication->getLastAuthenticationError(),
            'action' => $this->generateUrl('browser_auxiliary_login'),
            'csrf_token_intention' => 'authenticate',
            'username_parameter' => 'identity', 'username_label' => 'Account identity',
            'password_parameter' => 'secret', 'password_label' => 'Account secret',
            'target_path_parameter' => 'destination', 'target_path' => '/admin',
            'remember_me_enabled' => true, 'remember_me_checked' => true,
            'remember_me_parameter' => 'remember_identity', 'remember_me_label' => 'Keep this identity',
            'forgot_password_enabled' => true, 'forgot_password_path' => '/auxiliary/content/en',
            'forgot_password_label' => 'Recover access', 'sign_in_label' => 'Authenticate identity',
        ]);
    }

    #[Route('/auxiliary/content/{_locale}', name: 'browser_auxiliary_content', defaults: ['_locale' => 'en'])]
    public function content(): Response
    {
        return $this->render('browser/auxiliary_content.html.twig');
    }

    #[Route('/auxiliary/welcome', name: 'browser_auxiliary_welcome')]
    public function welcome(): Response
    {
        return $this->render('@EasyAdmin/welcome.html.twig', ['dashboard_controller_filepath' => '<script>private_path</script>']);
    }

    #[Route('/auxiliary/exception', name: 'browser_auxiliary_exception')]
    public function exception(): Response
    {
        return $this->render('@EasyAdmin/exception_standalone.html.twig', [
            'exception' => FlattenException::createFromThrowable(new NotFoundHttpException('<script>private_debug</script>')),
        ], new Response(status: 404));
    }
}
