<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Browser\Controller;

use EasyCorp\Bundle\EasyAdminBundle\Attribute\AdminDashboard;
use EasyCorp\Bundle\EasyAdminBundle\Config\Asset;
use EasyCorp\Bundle\EasyAdminBundle\Config\Assets;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Config\Dashboard;
use EasyCorp\Bundle\EasyAdminBundle\Config\MenuItem;
use EasyCorp\Bundle\EasyAdminBundle\Config\Option\Font;
use EasyCorp\Bundle\EasyAdminBundle\Config\Option\FontFeature;
use EasyCorp\Bundle\EasyAdminBundle\Config\Option\GrayScale;
use EasyCorp\Bundle\EasyAdminBundle\Config\Theme;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractDashboardController;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[AdminDashboard(routePath: '/theme-admin', routeName: 'browser_theme_admin')]
#[IsGranted('ROLE_ADMIN')]
class ThemeDashboardController extends AbstractDashboardController
{
    public function __construct(private readonly RequestStack $requests)
    {
    }

    public function index(): Response
    {
        return $this->render('browser/theme_dashboard.html.twig');
    }

    public function configureDashboard(): Dashboard
    {
        $query = $this->requests->getCurrentRequest()?->query;
        $dashboard = Dashboard::new()->setTitle('Configured theme dashboard')
            ->setDefaultColorScheme($query?->get('default', 'auto') ?? 'auto')
            ->setTextDirection($query?->get('direction', 'ltr') ?? 'ltr')
            ->setTheme(Theme::new()
                ->primaryColor('#15803d', dark: '#a3e635')
                ->radius('0.75rem')->spacing('3px')
                ->grays(GrayScale::ZINC, dark: GrayScale::STONE)
                ->font(base: Font::IbmPlexSans, monospace: Font::JetBrainsMono, baseWeight: 437, features: [FontFeature::TabularNumbers, 'ss01']));

        if ('disabled' === $query?->get('dark')) {
            $dashboard->disableDarkMode();
        }
        if (\in_array($query?->get('configured'), ['compact', 'normal'], true)) {
            $compact = 'compact' === $query?->get('configured');
            $dashboard->renderSidebarMinimized($compact)->renderContentMaximized($compact);
        }

        return $dashboard;
    }

    public function configureCrud(): Crud
    {
        return parent::configureCrud()->overrideTemplate('layout', 'browser/theme_layout.html.twig');
    }

    public function configureAssets(): Assets
    {
        return parent::configureAssets()
            ->addCssFile(Asset::new('/browser/theme_fixture.css')->htmlAttr('data-theme-asset', 'style'))
            ->addJsFile(Asset::new('/browser/theme_fixture.js')->defer()->htmlAttr('data-theme-asset', 'script'))
            ->addHtmlContentToHead('<meta name="theme-fixture" content="configured head">')
            ->addHtmlContentToBody('<span data-testid="configured-body-content">Configured body content</span>');
    }

    public function configureMenuItems(): iterable
    {
        yield MenuItem::linkToDashboard('Theme dashboard', 'fa fa-home');
        yield MenuItem::linkTo(CategoryCrudController::class, 'Theme categories', 'fa fa-tags');
    }
}
