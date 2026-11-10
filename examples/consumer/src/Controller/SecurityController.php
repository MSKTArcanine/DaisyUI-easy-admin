<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Authentication\AuthenticationUtils;

class SecurityController extends AbstractController
{
    public function __construct(private readonly AuthenticationUtils $authentication)
    {
    }

    #[Route('/login', name: 'consumer_login')]
    public function login(): Response
    {
        return $this->render('security/login.html.twig', ['page_title' => 'Standalone consumer', 'last_username' => $this->authentication->getLastUsername(), 'error' => $this->authentication->getLastAuthenticationError(), 'csrf_token_intention' => 'authenticate', 'target_path' => '/admin']);
    }

    #[Route('/logout', name: 'consumer_logout')]
    public function logout(): never
    {
        throw new \LogicException('The firewall handles logout.');
    }
}
