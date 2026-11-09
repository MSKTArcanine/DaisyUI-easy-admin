<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Apps\CustomizationApp\Controller\Dashboard;

use EasyCorp\Bundle\EasyAdminBundle\Attribute\AdminDashboard;
use EasyCorp\Bundle\EasyAdminBundle\Config\Asset;
use EasyCorp\Bundle\EasyAdminBundle\Config\Assets;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Config\Dashboard;
use EasyCorp\Bundle\EasyAdminBundle\Config\MenuItem;
use EasyCorp\Bundle\EasyAdminBundle\Config\Theme;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractDashboardController;
use Symfony\Component\HttpFoundation\Response;

#[AdminDashboard(routePath: '/customization_shell_admin', routeName: 'customization_shell_admin')]
class ShellExtensionTestDashboardController extends AbstractDashboardController
{
    public function index(): Response
    {
        return $this->render('admin/shell_dashboard.html.twig');
    }

    public function configureDashboard(): Dashboard
    {
        return Dashboard::new()->setTitle('Parent dashboard title')->setTheme(Theme::new()->primaryColor('#15803d'));
    }

    public function configureCrud(): Crud
    {
        return parent::configureCrud()->overrideTemplate('layout', 'admin/shell_layout.html.twig');
    }

    public function configureAssets(): Assets
    {
        return parent::configureAssets()
            ->addCssFile(Asset::new('/shell-custom.css')->htmlAttrs(['media' => 'screen', 'data-shell-asset' => 'A "quoted" value']))
            ->addJsFile(Asset::new('/shell-custom.js')->defer()->htmlAttr('data-shell-asset', 'script'))
            ->addHtmlContentToHead('<meta name="shell-configured-head" content="configured">')
            ->addHtmlContentToBody('<span data-testid="shell-configured-body">Configured body extension</span>');
    }

    public function configureMenuItems(): iterable
    {
        yield MenuItem::linkToDashboard('Parent dashboard destination', 'fa fa-home');
    }
}
