<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Browser\Controller;

use EasyCorp\Bundle\EasyAdminBundle\Field\FormField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class PresentationLayoutController extends AbstractController
{
    #[Route('/rendering-layout', name: 'browser_rendering_layout')]
    public function layout(): Response
    {
        return $this->render('browser/rendering_layout.html.twig', [
            'breakpoints' => ['base' => 0, 'sm' => 576, 'md' => 768, 'lg' => 992, 'xl' => 1200, 'xxl' => 1400],
            'default_fields' => [TextField::new('default_1')->getAsDto(), TextField::new('default_2')->getAsDto()],
            'explicit_fields' => [TextField::new('explicit_1')->setColumns(6)->getAsDto(), TextField::new('explicit_2')->setColumns(6)->getAsDto()],
            'column' => FormField::addColumn(12)->getAsDto(),
            'inside_field' => TextField::new('inside')->setColumns(6)->getAsDto(),
            'custom_value' => 'quoted "value"',
        ]);
    }
}
