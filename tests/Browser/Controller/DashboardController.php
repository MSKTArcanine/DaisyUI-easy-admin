<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Browser\Controller;

use EasyCorp\Bundle\EasyAdminBundle\Attribute\AdminDashboard;
use EasyCorp\Bundle\EasyAdminBundle\Config\Assets;
use EasyCorp\Bundle\EasyAdminBundle\Config\Dashboard;
use EasyCorp\Bundle\EasyAdminBundle\Config\MenuItem;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractDashboardController;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpFoundation\Response;

#[AdminDashboard(routePath: '/admin', routeName: 'browser_admin')]
class DashboardController extends AbstractDashboardController
{
    public function __construct(private readonly RequestStack $requests)
    {
    }

    public function index(): Response
    {
        return $this->render('browser/dashboard.html.twig');
    }

    public function configureDashboard(): Dashboard
    {
        return Dashboard::new()->setTitle('Browser Baseline')->setTextDirection($this->requests->getCurrentRequest()?->query->get('direction', 'ltr') ?? 'ltr');
    }

    public function configureAssets(): Assets
    {
        return parent::configureAssets()->addCssFile('/browser/custom.css')->addJsFile('/browser/custom.js');
    }

    public function configureMenuItems(): iterable
    {
        yield MenuItem::linkToDashboard('Dashboard', 'fa fa-home');
        yield MenuItem::linkTo(CategoryCrudController::class, 'Categories', 'fa fa-tags');
        yield MenuItem::subMenu('Widgets', 'fa fa-list')->setSubItems([
            MenuItem::linkTo(WidgetCrudController::class, 'Field widgets', 'fa fa-list'),
            MenuItem::linkTo(LayoutCrudController::class, 'Form layout', 'fa fa-list'),
        ]);
        yield MenuItem::linkToUrl('Restricted navigation', null, '/admin/restricted')->setPermission('ROLE_SUPER_ADMIN');
    }
}
