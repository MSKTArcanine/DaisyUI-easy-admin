<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Browser\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class RenderingController extends AbstractController
{
    #[Route('/rendering-contract', name: 'browser_rendering_contract')]
    public function rendering(): Response
    {
        return $this->render('browser/rendering_contract.html.twig');
    }

    #[Route('/rendering-host', name: 'browser_rendering_host')]
    public function neutral(): Response
    {
        return $this->render('browser/rendering_host.html.twig');
    }
}
