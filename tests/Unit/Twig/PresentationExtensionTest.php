<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Unit\Twig;

use EasyCorp\Bundle\EasyAdminBundle\Field\FormField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use EasyCorp\Bundle\EasyAdminBundle\Twig\PresentationExtension;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class PresentationExtensionTest extends TestCase
{
    #[DataProvider('provideComponentClasses')]
    public function testComponentClassesPreserveMeaningAndCallerPriority(string $context, string $input, string $expected): void
    {
        self::assertSame($expected, (new PresentationExtension())->mapClasses($input, $context));
    }

    public static function provideComponentClasses(): iterable
    {
        yield 'neutral outlined button' => ['button', 'btn btn-secondary btn-outline', 'btn btn-neutral btn-outline'];
        yield 'danger light button' => ['button', 'btn btn-danger btn-light', 'btn btn-error btn-soft'];
        yield 'filled button' => ['button', 'btn btn-primary btn-solid', 'btn btn-primary'];
        yield 'caller color wins' => ['button', 'btn btn-secondary btn-outline custom-button btn-primary', 'btn btn-primary btn-outline custom-button'];
        yield 'caller outline color overrides both groups' => ['button', 'btn btn-secondary btn-light custom-button btn-outline-danger', 'btn btn-error btn-outline custom-button'];
        yield 'caller fill clears default outline' => ['button', 'btn btn-secondary btn-outline custom-button btn-solid', 'btn btn-neutral custom-button'];
        yield 'caller style and size win' => ['button', 'btn btn-primary btn-solid btn-sm custom-button btn-danger btn-light btn-lg', 'btn btn-error btn-soft btn-lg custom-button'];
        yield 'custom button color remains' => ['button', 'btn btn-custom btn-outline', 'btn btn-custom btn-outline'];
        yield 'custom button variant remains' => ['button', 'btn btn-secondary btn-custom-layout', 'btn btn-neutral btn-custom-layout'];
        yield 'disabled is component scoped' => ['button', 'btn btn-secondary btn-outline disabled btn-block', 'btn btn-neutral btn-outline btn-disabled btn-block'];
        yield 'default badge is soft neutral' => ['badge', 'badge badge-secondary', 'badge badge-neutral badge-soft'];
        yield 'caller badge color wins' => ['badge', 'badge badge-secondary custom-badge badge-danger', 'badge badge-error badge-soft custom-badge'];
        yield 'solid badge does not inherit soft' => ['badge', 'badge badge-danger badge-variant-solid', 'badge badge-error'];
        yield 'caller outline badge wins' => ['badge', 'badge badge-primary badge-variant-solid custom-badge badge-outline', 'badge badge-primary badge-outline custom-badge'];
        yield 'dot retains outline semantics' => ['badge', 'badge badge-success badge-variant-dot', 'badge badge-success badge-outline'];
        yield 'custom badge and radius remain' => ['badge', 'badge badge-currency ea-rounded-full', 'badge badge-soft badge-currency ea-rounded-full'];
        yield 'no badge color is forced' => ['badge', 'badge', 'badge badge-soft'];
        yield 'light badge extension' => ['badge', 'badge badge-light', 'badge ea-badge-light badge-soft'];
        yield 'dark badge extension' => ['badge', 'badge badge-dark badge-variant-outline', 'badge ea-badge-dark badge-outline'];
        yield 'alert error alias' => ['alert', 'alert alert-danger alert-dismissible', 'alert alert-error ea-alert-dismissible'];
        yield 'notice alias' => ['alert', 'alert alert-notice', 'alert alert-info'];
        yield 'custom alert keeps fallback' => ['alert', 'alert alert-info alert-custom', 'alert alert-info alert-custom'];
        yield 'caller alert variant wins' => ['alert', 'alert alert-info custom-alert alert-warning', 'alert alert-warning custom-alert'];
        yield 'primary alert extension' => ['alert', 'alert alert-primary', 'alert ea-alert-primary'];
        yield 'secondary alert extension' => ['alert', 'alert alert-secondary', 'alert ea-alert-secondary'];
        yield 'light alert extension' => ['alert', 'alert alert-light', 'alert ea-alert-light'];
        yield 'dark alert extension' => ['alert', 'alert alert-dark', 'alert ea-alert-dark'];
        yield 'switch caller variants win' => ['switch', 'toggle ea-switch-danger toggle-sm custom-switch toggle-success toggle-lg', 'toggle toggle-success toggle-lg custom-switch'];
        yield 'pagination hooks remain' => ['pagination', 'pagination pagination-sm custom-pagination', 'pagination join pagination-sm custom-pagination'];
        yield 'page links compose daisyUI' => ['pagination', 'page-link ea-rounded-full custom-link', 'page-link btn btn-ghost join-item ea-rounded-full custom-link'];
        yield 'unrelated disabled remains' => ['layout', 'custom disabled', 'custom disabled'];
        yield 'accessible hidden label' => ['layout', 'btn-label visually-hidden custom-label', 'btn-label sr-only custom-label'];
    }

    #[DataProvider('provideLayoutClasses')]
    public function testEverySupportedLayoutWidthAndOffsetIsMapped(string $input, string $expected): void
    {
        self::assertSame($expected, (new PresentationExtension())->mapClasses($input));
    }

    public static function provideLayoutClasses(): iterable
    {
        foreach (['' => '', 'sm' => '-sm', 'md' => '-md', 'lg' => '-lg', 'xl' => '-xl', 'xxl' => '-xxl'] as $breakpoint => $suffix) {
            yield $breakpoint.' equal' => ['col'.$suffix, 'ea-col'.$suffix];
            yield $breakpoint.' auto' => ['col'.$suffix.'-auto', 'ea-col'.$suffix.'-auto'];
            for ($span = 1; $span <= 12; ++$span) {
                yield $breakpoint.' span '.$span => ['col'.$suffix.'-'.$span, 'ea-col'.$suffix.'-'.$span];
            }
            for ($offset = 0; $offset <= 11; ++$offset) {
                yield $breakpoint.' offset '.$offset => ['offset'.$suffix.'-'.$offset, 'ea-offset'.$suffix.'-'.$offset];
            }
        }

        yield 'multiple responsive widths and offsets' => ['col-12 col-sm-8 col-md-6 col-lg-5 col-xl-4 col-xxl-3 offset-1 offset-md-0 custom-layout', 'ea-col-12 ea-col-sm-8 ea-col-md-6 ea-col-lg-5 ea-col-xl-4 ea-col-xxl-3 ea-offset-1 ea-offset-md-0 custom-layout'];
        yield 'unsupported Bootstrap tokens stay intact' => ['col-0 col-md-13 offset-12 order-lg-2 g-3 d-none custom-layout', 'col-0 col-md-13 offset-12 order-lg-2 g-3 d-none custom-layout'];
        yield 'custom punctuation remains escaped by the caller' => ['col-md-6 custom-"value" hover:custom-[value] field-form_column', 'ea-col-md-6 custom-"value" hover:custom-[value] field-form_column'];
    }

    #[DataProvider('provideRows')]
    public function testOnlyCompleteGeneratedRowPatternsAreAdapted(string $input, string $expected): void
    {
        self::assertSame($expected, (new PresentationExtension())->mapClasses($input, 'row'));
    }

    public static function provideRows(): iterable
    {
        yield 'base' => ['field-form_row flex-fill custom-row', 'field-form_row custom-row ea-row-break'];
        foreach (['sm', 'md', 'lg', 'xl', 'xxl'] as $breakpoint) {
            yield $breakpoint => ['field-form_row d-none d-'.$breakpoint.'-flex flex-'.$breakpoint.'-fill custom-row', 'field-form_row custom-row ea-row-break-'.$breakpoint];
        }
        yield 'incomplete row is not guessed' => ['d-none d-md-flex custom-row', 'd-none d-md-flex custom-row'];
        yield 'mismatched breakpoint is not guessed' => ['d-none d-md-flex flex-lg-fill', 'd-none d-md-flex flex-lg-fill'];
    }

    public function testNumericPublicConfigurationStillMeansMediumColumns(): void
    {
        $field = TextField::new('name')->setColumns(6)->getAsDto();
        $column = FormField::addColumn(6)->getAsDto();
        $defaultField = TextField::new('name')->getAsDto();

        self::assertSame('col-md-6', $field->getColumns());
        self::assertSame('field-form_column col-md-6', $column->getCssClass());
        self::assertNull($defaultField->getColumns());
        self::assertSame('col-md-6 col-xxl-5', $defaultField->getDefaultColumns());
        self::assertSame('ea-col-md-6', (new PresentationExtension())->mapClasses($field->getColumns()));
    }

    #[DataProvider('provideEmptyClasses')]
    public function testEmptyClassInputsRemainEmpty(?string $input, string $context): void
    {
        self::assertSame('', (new PresentationExtension())->mapClasses($input, $context));
    }

    public static function provideEmptyClasses(): iterable
    {
        foreach (['button', 'badge', 'alert', 'switch', 'pagination', 'layout', 'row'] as $context) {
            yield $context.' null' => [null, $context];
            yield $context.' whitespace' => [" \n\t", $context];
        }
    }

    public function testUiAttributesLeaveActionPayloadsUntouchedAndHonorNativeOverrides(): void
    {
        $actionAttributes = [
            'data-action-name' => 'delete',
            'data-action-url' => '/admin/categories/1/delete?query=kept',
            'data-action-csrf-token' => 'protected-token',
            'formaction' => '/admin/categories/1/delete',
            'form' => 'edit-Category-form',
            'name' => 'ea[newForm][btn]',
            'value' => 'saveAndReturn',
            'data-custom' => 'quoted "value"',
            'class' => 'btn-danger custom-action',
        ];
        $attributes = $actionAttributes + [
            'data-bs-toggle' => 'modal', 'data-bs-target' => '#legacy',
            'data-bs-dismiss' => 'modal', 'data-ea-target' => '#native',
            'data-bs-keyboard' => 'false', 'data-bs-backdrop' => 'static',
            'data-bs-popper-config' => '{"strategy":"fixed"}',
        ];
        $result = (new PresentationExtension())->mapAttributes($attributes);

        foreach ($actionAttributes as $name => $value) {
            self::assertSame($value, $result[$name]);
        }
        self::assertSame('modal', $result['data-ea-toggle']);
        self::assertSame('#native', $result['data-ea-target']);
        self::assertSame('modal', $result['data-ea-dismiss']);
        self::assertSame('false', $result['data-ea-keyboard']);
        self::assertSame('static', $result['data-ea-backdrop']);
        self::assertSame('fixed', $result['data-ea-position']);
        self::assertArrayNotHasKey('data-bs-toggle', $result);
        self::assertArrayNotHasKey('data-bs-target', $result);
        self::assertArrayNotHasKey('data-bs-dismiss', $result);
        self::assertArrayNotHasKey('data-bs-keyboard', $result);
        self::assertArrayNotHasKey('data-bs-backdrop', $result);
        self::assertArrayNotHasKey('data-bs-popper-config', $result);
    }

    #[DataProvider('provideUnmigratedUiAttributes')]
    public function testUnmigratedMechanismsKeepTheirWholeAttributeMap(array $attributes): void
    {
        self::assertSame($attributes, (new PresentationExtension())->mapAttributes($attributes));
    }

    public static function provideUnmigratedUiAttributes(): iterable
    {
        foreach (['collapse', 'tooltip', 'popover', 'offcanvas'] as $mechanism) {
            yield $mechanism => [[
                'data-bs-toggle' => $mechanism, 'data-bs-target' => '#target',
                'data-bs-title' => 'Help', 'data-bs-html' => 'true',
                'data-bs-offset' => '0,5', 'data-action-name' => 'custom',
            ]];
        }
        yield 'unsupported dismiss' => [['data-bs-dismiss' => 'toast', 'data-bs-target' => '#target']];
    }

    public function testUnsupportedPopperConfigurationAndNullNativeValuesArePreserved(): void
    {
        $extension = new PresentationExtension();
        self::assertSame(['data-bs-popper-config' => '{"strategy":"absolute"}'], $extension->mapAttributes(['data-bs-popper-config' => '{"strategy":"absolute"}']));
        self::assertSame(['data-bs-popper-config' => 'invalid'], $extension->mapAttributes(['data-bs-popper-config' => 'invalid']));
        self::assertSame(['data-ea-target' => null], $extension->mapAttributes(['data-bs-target' => '#legacy', 'data-ea-target' => null]));
        self::assertSame(['data-ea-position' => null], $extension->mapAttributes(['data-bs-popper-config' => '{"strategy":"fixed"}', 'data-ea-position' => null]));
    }
}
