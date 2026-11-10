<?php

namespace App\Controller;

use EasyCorp\Bundle\EasyAdminBundle\Attribute\AdminDashboard;
use EasyCorp\Bundle\EasyAdminBundle\Config\Assets;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Config\Dashboard;
use EasyCorp\Bundle\EasyAdminBundle\Config\MenuItem;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractDashboardController;
use Symfony\Component\HttpFoundation\Response;

#[AdminDashboard(routePath: '/admin', routeName: 'consumer_admin')]
class DashboardController extends AbstractDashboardController
{
    public function index(): Response
    {
        return $this->render('admin/dashboard.html.twig');
    }

    public function configureDashboard(): Dashboard
    {
        return Dashboard::new()->setTitle('Standalone consumer');
    }

    public function configureCrud(): Crud
    {
        return parent::configureCrud()->overrideTemplate('layout', 'admin/layout.html.twig')
            ->addFormTheme('admin/form_theme.html.twig');
    }

    public function configureAssets(): Assets
    {
        return parent::configureAssets()->addCssFile('styles/consumer.css')->addCssFile('styles/consumer-utilities.css')
            ->addJsFile('scripts/configured.js')->addAssetMapperEntry('consumer');
    }

    public function configureMenuItems(): iterable
    {
        yield MenuItem::linkToDashboard('Dashboard', 'fa fa-home');
        yield MenuItem::linkTo(EntryCrudController::class, 'Entries', 'fa fa-list');
    }
}
