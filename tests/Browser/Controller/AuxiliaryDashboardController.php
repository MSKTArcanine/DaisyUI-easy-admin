<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Browser\Controller;

use EasyCorp\Bundle\EasyAdminBundle\Attribute\AdminDashboard;
use EasyCorp\Bundle\EasyAdminBundle\Attribute\AdminRoute;
use EasyCorp\Bundle\EasyAdminBundle\Exception\FlattenException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

#[AdminDashboard(routePath: '/auxiliary-admin', routeName: 'browser_auxiliary_admin')]
class AuxiliaryDashboardController extends DashboardController
{
    public function index(): Response
    {
        return $this->render('browser/login_extension.html.twig', [
            'page_title' => 'Context login', 'action' => '/auxiliary-login',
            'csrf_token_intention' => 'authenticate', 'target_path' => '/admin',
        ]);
    }

    #[AdminRoute(path: '/content', name: 'content')]
    public function content(): Response
    {
        return $this->render('browser/auxiliary_content.html.twig');
    }

    #[AdminRoute(path: '/exception', name: 'exception')]
    public function exception(): Response
    {
        return $this->render('@EasyAdmin/exception.html.twig', [
            'exception' => FlattenException::createFromThrowable(new AccessDeniedHttpException('private_debug')),
            'layout_template_path' => 'browser/layout.html.twig',
        ], new Response(status: 403));
    }
}
