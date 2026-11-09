<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Browser\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Authentication\AuthenticationUtils;

class LoginController extends AbstractController
{
    #[Route('/login', name: 'browser_login')]
    public function login(AuthenticationUtils $authentication): Response
    {
        return $this->render('@EasyAdmin/page/login.html.twig', [
            'page_title' => 'Browser Baseline',
            'last_username' => $authentication->getLastUsername(),
            'error' => $authentication->getLastAuthenticationError(),
            'csrf_token_intention' => 'authenticate',
            'target_path' => '/admin',
        ]);
    }

    #[Route('/logout', name: 'browser_logout')]
    public function logout(): never
    {
        throw new \LogicException('The fixture firewall handles logout.');
    }
}
