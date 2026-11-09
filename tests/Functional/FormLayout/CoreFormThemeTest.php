<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\FormLayout;

use EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Apps\DefaultApp\Kernel;
use PHPUnit\Framework\Attributes\TestWith;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class CoreFormThemeTest extends WebTestCase
{
    protected static function getKernelClass(): string
    {
        return Kernel::class;
    }

    public function testOrdinaryFormKeepsAttributesEscapingLabelsSymbolsAndRestWithoutAdminContext(): void
    {
        $client = static::createClient();
        $crawler = $client->request('GET', '/core-form-theme?put=1');

        static::assertResponseIsSuccessful();
        $form = $crawler->filter('form[name="presentation"]');
        static::assertSame('post', $form->attr('method'));
        static::assertSame('/core-form-theme?put=1', $form->attr('action'));
        static::assertSame('multipart/form-data', $form->attr('enctype'));
        static::assertSame('A "quoted" <form>', $form->attr('data-form-attribute'));
        static::assertCount(1, $form->filter('input[name="_method"][value="PUT"]'));
        static::assertCount(1, $form->filter('input[name="presentation[_token]"]'));
        static::assertCount(1, $form->filter('input[name="presentation[rest]"][value="Rest sentinel"]'));
        static::assertCount(1, $form->filter('input[type="file"][name="presentation[attachment]"]'));
        $title = $form->filter('input[name="presentation[title]"]');
        static::assertSame('presentation_title', $title->attr('id'));
        static::assertSame('Original title', $title->attr('value'));
        static::assertSame('<script>"quoted"</script>', $title->attr('data-note'));
        static::assertContains('caller-widget', explode(' ', $title->attr('class')));
        static::assertSame('application-description presentation_title_help', $title->attr('aria-describedby'));
        static::assertSame('preserved', $form->filter('.caller-row')->attr('data-row'));
        static::assertSame('<b>Escaped label</b>', $form->filter('label[for="presentation_title"]')->text());
        static::assertSame('preserved', $form->filter('label[for="presentation_title"]')->attr('data-label'));
        static::assertCount(0, $form->filter('label[for="presentation_title"] b, #presentation_title_help em, script'));
        static::assertSame('<em>Escaped help</em>', $form->filter('#presentation_title_help')->text());
        static::assertSame('Formatted label', $form->filter('label[for="presentation_rich"] strong')->text());
        static::assertSame('Formatted help', $form->filter('#presentation_rich_help em')->text());
        static::assertCount(1, $form->filter('input.toggle[name="presentation[active]"][value="enabled"][data-switch="preserved"]'));
        static::assertCount(1, $form->filter('label[for="presentation_active"]'));
        static::assertSame('Configured mode', $form->filter('#presentation_mode')->closest('fieldset')->filter('legend')->text());
        static::assertCount(1, $form->filter('label[for="presentation_mode_0"]'));
        static::assertSame('First <b>choice</b>', $form->filter('label[for="presentation_mode_0"]')->text());
        foreach (['standalone-money', 'row-money'] as $id) {
            static::assertSame(1, substr_count($form->filter('#'.$id)->text(), '€'));
        }
        foreach (['standalone-percent', 'row-percent'] as $id) {
            static::assertSame(1, substr_count($form->filter('#'.$id)->text(), '%'));
        }
        $collection = $form->filter('[data-ea-collection-field]');
        static::assertSame('0', $collection->attr('data-num-items'));
        static::assertStringContainsString('presentation[tags][__name__]', $collection->attr('data-prototype'));
        static::assertCount(1, $collection->filter('.field-collection-add-button'));
    }

    #[TestWith([false, 'POST'])]
    #[TestWith([true, 'PUT'])]
    public function testOrdinaryFormSubmitsItsProtectedMethodAndPersistsTransformedValues(bool $put, string $method): void
    {
        $client = static::createClient();
        $crawler = $client->request('GET', '/core-form-theme'.($put ? '?put=1' : ''));
        $form = $crawler->filter('form')->form();
        $values = $form->getPhpValues();
        $values['presentation']['title'] = 'Submitted title';
        $values['presentation']['active'] = 'enabled';
        $values['presentation']['mode'] = 'second';
        $values['presentation']['tags'] = ['First tag', 'Second tag'];
        $client->request('POST', $form->getUri(), $values);

        static::assertResponseIsSuccessful();
        $result = json_decode($client->getResponse()->getContent(), true, flags: \JSON_THROW_ON_ERROR);
        static::assertSame($method, $result['method']);
        static::assertSame('Submitted title', $result['values']['title']);
        static::assertTrue($result['values']['active']);
        static::assertSame('second', $result['values']['mode']);
        static::assertSame(1234, $result['values']['rowAmount']);
        static::assertSame(0.25, $result['values']['rowRatio']);
        static::assertSame(['First tag', 'Second tag'], $result['values']['tags']);
        static::assertSame('Rest sentinel', $result['values']['rest']);
        $client->request('GET', '/core-form-theme/result');
        static::assertSame($result['values'], json_decode($client->getResponse()->getContent(), true, flags: \JSON_THROW_ON_ERROR));
    }

    public function testInvalidValuesRemainEditableWithAssociatedErrorsAndInvalidCsrfPersistsNothing(): void
    {
        $client = static::createClient();
        $crawler = $client->request('GET', '/core-form-theme');
        $form = $crawler->filter('form')->form();
        $values = $form->getPhpValues();
        $values['presentation']['title'] = '';
        $crawler = $client->request('POST', $form->getUri(), $values);

        static::assertResponseStatusCodeSame(422);
        $title = $crawler->filter('input[name="presentation[title]"]');
        static::assertSame('true', $title->attr('aria-invalid'));
        static::assertSame('application-description presentation_title_help presentation_title_errors', $title->attr('aria-describedby'));
        static::assertSame('alert', $crawler->filter('#presentation_title_errors')->attr('role'));
        static::assertSame('This value should not be blank.', $crawler->filter('#presentation_title_errors')->text());
        $values['presentation']['title'] = 'Retained title';
        $values['presentation']['_token'] = 'invalid';
        $crawler = $client->request('POST', '/core-form-theme', $values);
        static::assertResponseStatusCodeSame(422);
        static::assertSame('Retained title', $crawler->filter('input[name="presentation[title]"]')->attr('value'));
        static::assertCount(1, $crawler->filter('#presentation_errors[role="alert"]'));
        $client->request('GET', '/core-form-theme/result');
        static::assertSame('null', $client->getResponse()->getContent());
    }
}
