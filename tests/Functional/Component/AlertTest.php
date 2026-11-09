<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Component;

use EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\AbstractFieldFunctionalTestCase;
use Symfony\Component\DomCrawler\Crawler;

class AlertTest extends AbstractFieldFunctionalTestCase
{
    public function testSemanticAppearanceAndCallerRoleRemainIndependent(): void
    {
        $crawler = $this->renderAlert('<twig:ea:Alert variant="danger" role="status" class="alert-success custom-alert" data-note="safe">Saved</twig:ea:Alert>');
        $alert = $crawler->filter('[data-ea-alert]');

        self::assertCount(1, $alert);
        self::assertSame('status', $alert->attr('role'));
        self::assertSame('safe', $alert->attr('data-note'));
        self::assertCount(1, $crawler->filter('.alert.alert-success.alert-soft.custom-alert'));
        self::assertCount(0, $crawler->filter('.alert-error'));
        self::assertSame('Saved', trim($alert->text()));
    }

    public function testTitleAndActionsSlotsRemainOverridableWithEscapedContent(): void
    {
        $crawler = $this->renderAlert(<<<'TWIG'
            <twig:ea:Alert title="Default title" data-note="{{ note }}">
                <twig:block name="title"><strong>Custom title</strong></twig:block>
                <twig:block name="content">{{ message }}</twig:block>
                <twig:block name="actions"><twig:ea:Button htmlElement="a" href="/help">Help</twig:ea:Button></twig:block>
            </twig:ea:Alert>
            TWIG, ['note' => '<script>"quoted"</script>', 'message' => '<img src=x onerror=alert(1)>']);

        self::assertSame('Custom title', $crawler->filter('.alert-title strong')->text());
        self::assertSame('<img src=x onerror=alert(1)>', trim($crawler->filter('.alert-description')->text()));
        self::assertSame('/help', $crawler->filter('.alert-actions a')->attr('href'));
        self::assertSame('<script>"quoted"</script>', $crawler->filter('[data-ea-alert]')->attr('data-note'));
        self::assertCount(0, $crawler->filter('script, img'));
    }

    public function testDismissButtonUsesTranslatedNameAndIndependentBehaviorHook(): void
    {
        $crawler = $this->renderAlert('<twig:ea:Alert withDismissButton icon="internal:check">Saved</twig:ea:Alert>');
        $dismissButton = $crawler->filter('button[data-ea-dismiss="alert"]');

        self::assertCount(1, $dismissButton);
        self::assertSame('button', $dismissButton->attr('type'));
        self::assertSame('Close', $dismissButton->attr('aria-label'));
        self::assertCount(0, $crawler->filter('[data-bs-dismiss]'));
        self::assertCount(1, $crawler->filter('.alert-icon svg'));
    }

    private function renderAlert(string $template, array $context = []): Crawler
    {
        return new Crawler(static::getContainer()->get('twig')->createTemplate($template)->render($context));
    }
}
