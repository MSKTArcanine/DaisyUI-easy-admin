<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Customization\Dashboard;

use EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Apps\CustomizationApp\Kernel;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class ShellExtensionTest extends WebTestCase
{
    protected static function getKernelClass(): string
    {
        return Kernel::class;
    }

    public function testConfiguredLayoutComposesParentBlocksAndGeneratedNavigation(): void
    {
        $client = static::createClient();
        $crawler = $client->request('GET', '/customization_shell_admin');

        static::assertResponseIsSuccessful();
        static::assertSame('Child dashboard title', $crawler->filter('title')->text());
        static::assertSame('width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no', $crawler->filter('meta[name="viewport"]')->attr('content'));
        static::assertSame('inherited', $crawler->filter('meta[name="shell-layout-override"]')->attr('content'));
        static::assertSame('Parent dashboard title', $crawler->filter('.ea-sidebar-header .logo-custom')->text());
        static::assertSame('Child logo extension', $crawler->filter('[data-testid="shell-logo-override"]')->text());
        static::assertSame('/customization_shell_admin', $crawler->filter('.ea-sidebar-header .logo')->attr('href'));
        static::assertSame('http://localhost/customization_shell_admin', $crawler->selectLink('Parent dashboard destination')->attr('href'));
        static::assertSame('Child sidebar footer', $crawler->filter('[data-testid="shell-sidebar-footer"]')->text());
        static::assertSame('/customization_shell_admin', $crawler->filter('[data-testid="shell-sidebar-footer"]')->attr('href'));
        static::assertSame('Child dashboard content', $crawler->filter('[data-testid="shell-main-override"]')->text());
        static::assertSame('Child content footer', $crawler->filter('[data-testid="shell-content-footer"]')->text());
    }

    public function testConfiguredAssetsKeepAttributesAndOrderingAroundThemeAndContents(): void
    {
        $client = static::createClient();
        $crawler = $client->request('GET', '/customization_shell_admin');

        static::assertResponseIsSuccessful();
        $style = $crawler->filter('head link[href="/shell-custom.css"]');
        static::assertSame('screen', $style->attr('media'));
        static::assertSame('A "quoted" value', $style->attr('data-shell-asset'));
        $script = $crawler->filter('head script[src="/shell-custom.js"]');
        static::assertNotNull($script->attr('defer'));
        static::assertSame('script', $script->attr('data-shell-asset'));
        static::assertSame('configured', $crawler->filter('head meta[name="shell-configured-head"]')->attr('content'));
        static::assertSame('Configured body extension', $crawler->filter('body > [data-testid="shell-configured-body"]')->text());

        $html = (string) $client->getResponse()->getContent();
        $themePosition = strpos($html, '--ea-primary: #15803d;');
        $stylePosition = strpos($html, '/shell-custom.css');
        $scriptPosition = strpos($html, '/shell-custom.js');
        $headContentPosition = strpos($html, 'name="shell-configured-head"');
        $bodyContentPosition = strpos($html, 'data-testid="shell-configured-body"');
        $mainContentPosition = strpos($html, 'data-testid="shell-main-override"');
        foreach ([$themePosition, $stylePosition, $scriptPosition, $headContentPosition, $bodyContentPosition, $mainContentPosition] as $position) {
            static::assertNotFalse($position);
        }
        static::assertGreaterThan($themePosition, $stylePosition);
        static::assertGreaterThan($stylePosition, $scriptPosition);
        static::assertGreaterThan($scriptPosition, $headContentPosition);
        static::assertGreaterThan($mainContentPosition, $bodyContentPosition);
    }
}
