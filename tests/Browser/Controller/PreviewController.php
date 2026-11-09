<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Browser\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class PreviewController extends AbstractController
{
    #[Route('/ui-preview', name: 'browser_ui_preview')]
    public function preview(): Response
    {
        return $this->render('browser/ui_preview.html.twig');
    }

    #[Route('/ui-neutral', name: 'browser_ui_neutral')]
    public function neutral(): Response
    {
        return $this->render('browser/ui_neutral.html.twig');
    }
}
