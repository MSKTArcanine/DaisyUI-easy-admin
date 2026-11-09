<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Component;

use EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\AbstractFieldFunctionalTestCase;
use EasyCorp\Bundle\EasyAdminBundle\Twig\Component\Option\Size;
use Symfony\Component\DomCrawler\Crawler;
use Symfony\Component\Form\Extension\Core\Type\CheckboxType;
use Symfony\Component\Form\FormError;
use Symfony\Component\Form\FormInterface;

class SwitchTest extends AbstractFieldFunctionalTestCase
{
    public function testDefaultSizeEmitsNoSizeClass(): void
    {
        $html = $this->renderSwitch('<twig:ea:Switch />');

        self::assertStringContainsString('class="ea-switch"', $html);
        self::assertStringNotContainsString('ea-switch-sm', $html);
        self::assertStringNotContainsString('ea-switch-md', $html);
    }

    public function testSmallSizeAsString(): void
    {
        self::assertStringContainsString(
            'class="ea-switch ea-switch-sm"',
            $this->renderSwitch('<twig:ea:Switch size="sm" />')
        );
    }

    public function testSmallSizeAsEnum(): void
    {
        self::assertStringContainsString(
            'class="ea-switch ea-switch-sm"',
            $this->renderSwitch('<twig:ea:Switch size="{{ size }}" />', ['size' => Size::Small])
        );
    }

    public function testMediumSizeAsEnumEmitsNoSizeClass(): void
    {
        self::assertStringContainsString(
            'class="ea-switch"',
            $this->renderSwitch('<twig:ea:Switch size="{{ size }}" />', ['size' => Size::Medium])
        );
    }

    public function testExtraAttributesAreRenderedOnTheInput(): void
    {
        $html = $this->renderSwitch('<twig:ea:Switch data-foo="bar" />');

        self::assertMatchesRegularExpression('/<input[^>]+data-foo="bar"/', $html);
    }

    public function testCustomClassIsMergedIntoTheInputClass(): void
    {
        $html = $this->renderSwitch('<twig:ea:Switch class="custom" />');

        self::assertMatchesRegularExpression('/<input[^>]+class="ea-switch-input toggle custom"/', $html);
        self::assertStringContainsString('<span class="ea-switch">', $html);
    }

    public function testFormAttrOptionIsRenderedOnTheSwitchInput(): void
    {
        $html = $this->renderCheckboxThroughFormTheme($this->createSwitchForm());

        self::assertMatchesRegularExpression('/<input[^>]+role="switch"/', $html);
        self::assertMatchesRegularExpression('/<input[^>]+data-device-target="monoblock"/', $html);
    }

    public function testInvalidSwitchInputGetsTheInvalidClass(): void
    {
        $form = $this->createSwitchForm();
        $form->submit(['monoblock' => '1']);
        $form->get('monoblock')->addError(new FormError('Some error'));

        $html = $this->renderCheckboxThroughFormTheme($form);

        self::assertMatchesRegularExpression('/<input[^>]+class="ea-switch-input toggle is-invalid"/', $html);
    }

    public function testNativeInputStateAndBehaviorAttributesArePreserved(): void
    {
        $crawler = new Crawler($this->renderSwitch('<twig:ea:Switch id="active" name="category[active]" value="enabled" checked disabled required size="lg" variant="danger" ariaLabel="Active category" data-toggle-url="{{ toggle_url }}" />', ['toggle_url' => '/category/1?field=active&value=0']));
        $input = $crawler->filter('input');

        self::assertCount(1, $input);
        self::assertSame('checkbox', $input->attr('type'));
        self::assertSame('switch', $input->attr('role'));
        self::assertSame('active', $input->attr('id'));
        self::assertSame('category[active]', $input->attr('name'));
        self::assertSame('enabled', $input->attr('value'));
        self::assertNotNull($input->attr('checked'));
        self::assertNotNull($input->attr('disabled'));
        self::assertNotNull($input->attr('required'));
        self::assertSame('Active category', $input->attr('aria-label'));
        self::assertSame('/category/1?field=active&value=0', $input->attr('data-toggle-url'));
        self::assertCount(1, $crawler->filter('input.toggle.toggle-lg.toggle-error'));
    }

    public function testCallerColorSizeRoleAndEscapedAttributesOverrideDefaults(): void
    {
        $crawler = new Crawler($this->renderSwitch(<<<'TWIG'
            <twig:ea:Switch variant="danger" size="sm" role="checkbox" class="toggle-success toggle-lg custom-switch" data-note="{{ note }}" />
            TWIG, ['note' => '<script>"quoted"</script>']));

        self::assertCount(1, $crawler->filter('input.ea-switch-input.toggle.toggle-success.toggle-lg.custom-switch'));
        self::assertCount(0, $crawler->filter('input.toggle-error, input.toggle-sm'));
        self::assertSame('checkbox', $crawler->filter('input')->attr('role'));
        self::assertSame('<script>"quoted"</script>', $crawler->filter('input')->attr('data-note'));
        self::assertCount(0, $crawler->filter('script'));
    }

    public function testSymfonyCheckboxSubmissionPreservesBooleanValuesAndInputIdentity(): void
    {
        $checkedForm = $this->createSwitchForm();
        $checkedForm->submit(['monoblock' => '1']);
        $uncheckedForm = $this->createSwitchForm();
        $uncheckedForm->submit([]);

        self::assertTrue($checkedForm->isValid());
        self::assertTrue($checkedForm->get('monoblock')->getData());
        self::assertFalse($uncheckedForm->get('monoblock')->getData());
        $input = (new Crawler($this->renderCheckboxThroughFormTheme($checkedForm)))->filter('input');
        self::assertSame('device_monoblock', $input->attr('id'));
        self::assertSame('device[monoblock]', $input->attr('name'));
        self::assertSame('1', $input->attr('value'));
        self::assertNotNull($input->attr('checked'));
    }

    private function createSwitchForm(): FormInterface
    {
        return static::getContainer()->get('form.factory')
            ->createNamedBuilder('device', options: ['csrf_protection' => false])
            ->add('monoblock', CheckboxType::class, [
                'label_attr' => ['class' => 'checkbox-switch'],
                'attr' => ['data-device-target' => 'monoblock'],
            ])
            ->getForm();
    }

    private function renderCheckboxThroughFormTheme(FormInterface $form): string
    {
        $template = <<<'TWIG'
            {% form_theme form '@EasyAdmin/symfony-form-themes/bootstrap_5_layout.html.twig' %}
            {{ form_widget(form.monoblock) }}
            TWIG;

        return $this->renderSwitch($template, ['form' => $form->createView()]);
    }

    private function renderSwitch(string $template, array $context = []): string
    {
        return static::getContainer()->get('twig')->createTemplate($template)->render($context);
    }
}
