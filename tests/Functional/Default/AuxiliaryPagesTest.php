<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Default;

use PHPUnit\Framework\Attributes\TestWith;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class AuxiliaryPagesTest extends WebTestCase
{
    #[TestWith(['/auxiliary-pages/login', false])]
    #[TestWith(['/admin/auxiliary-pages/login', true])]
    public function testLoginPreservesCustomAuthenticationInputsAndErrors(string $path, bool $context): void
    {
        $client = static::createClient();
        $crawler = $client->request('GET', $path);
        static::assertResponseIsSuccessful();
        static::assertSelectorExists('body.page-login[data-ea-ui]');
        $form = $crawler->filter('.login-wrapper form');
        static::assertSame('post', $form->attr('method'));
        static::assertSame('/authenticate-identity', $form->attr('action'));
        static::assertNotSame('', $form->filter('input[name="_csrf_token"]')->attr('value'));
        static::assertCount(1, $form->filter('input[name="destination"][value="/after-authentication"]'));
        static::assertCount(1, $form->filter('input[name="identity"][value="Previous identity"][required][autocomplete="username"]'));
        static::assertCount(1, $form->filter('input[name="secret"][required][autocomplete="current-password"]'));
        static::assertCount(1, $form->filter('input[name="remember_identity"][checked]'));
        static::assertSame('<b>Identity</b>', $form->filter('label[for="username"]')->text());
        static::assertCount(0, $form->filter('label[for="username"] b'));
        static::assertCount(1, $form->filter('a[href="/recover-identity"]'));
        static::assertSelectorTextContains('[role="alert"]', 'Invalid credentials.');
        static::assertSame($context ? 1 : 0, $crawler->filter('#header-logo a[href="/admin"]')->count());
    }

    #[TestWith(['/auxiliary-pages/content/en', false, 'ltr'])]
    #[TestWith(['/auxiliary-pages/content/ar', false, 'rtl'])]
    #[TestWith(['/admin/auxiliary-pages/content', true, 'ltr'])]
    public function testContentBlocksRenderInsideAndOutsideTheAdminContext(string $path, bool $context, string $direction): void
    {
        $client = static::createClient();
        $crawler = $client->request('GET', $path);
        static::assertResponseIsSuccessful();
        static::assertSelectorTextSame('title', 'Auxiliary content');
        static::assertSelectorTextSame('h1', 'Auxiliary content');
        static::assertSelectorTextSame('[data-testid="auxiliary-content"]', 'Content block override');
        static::assertSame($direction, $crawler->filter('html')->attr('dir'));
        static::assertSame($context ? 1 : 0, $crawler->filter('#main-menu')->count());
    }

    public function testIndependentPagesDoNotLoadBundleRuntimeOrExposePrivateExceptionDetails(): void
    {
        $client = static::createClient();
        $crawler = $client->request('GET', '/auxiliary-pages/welcome');
        static::assertResponseIsSuccessful();
        static::assertSelectorTextContains('h1', 'Welcome to EasyAdmin');
        static::assertCount(0, $crawler->filter('script[src], link[rel="stylesheet"]'));
        static::assertCount(0, $crawler->filter('pre script'));
        static::assertSelectorTextContains('pre', '<script>private_path</script>');
        $crawler = $client->request('GET', '/auxiliary-pages/exception');
        static::assertResponseStatusCodeSame(404);
        static::assertSelectorTextSame('h1', '404');
        static::assertCount(0, $crawler->filter('script, link[rel="stylesheet"]'));
        static::assertStringNotContainsString('private_debug', $client->getResponse()->getContent());
    }
}
