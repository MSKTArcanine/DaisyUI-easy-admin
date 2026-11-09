<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Filters;

use EasyCorp\Bundle\EasyAdminBundle\Form\Type\ComparisonType;
use EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Apps\DefaultApp\Controller\Filters\FilterRenderingCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Apps\DefaultApp\Entity\Synthetic\FilterTestEntity;
use EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Apps\DefaultApp\Factory\FilterTestEntityFactory;

class FilterFormRenderingTest extends FilterFunctionalTestCase
{
    protected function getControllerFqcn(): string
    {
        return FilterRenderingCrudController::class;
    }

    public function testConfiguredThemesPreserveWidgetAttributesLabelsHelpAndOverrideOrder(): void
    {
        $crawler = $this->client->request('GET', $this->getCrudUrl('renderFilters'));

        static::assertResponseIsSuccessful();
        static::assertCount(0, $crawler->filter('[data-testid="filter-first-override"]'));
        static::assertCount(1, $crawler->filter('[data-testid="filter-last-override"] input.input.caller-control'));
        $value = $crawler->filter('input[name="filters[textFilter][value]"]');
        static::assertSame('A "quoted" <value>', $value->attr('data-note'));
        static::assertSame('application-help filters_textFilter_value_help', $value->attr('aria-describedby'));
        static::assertNotNull($value->attr('readonly'));
        static::assertSame('preserved', $crawler->filter('.caller-row')->attr('data-row'));
        $label = $crawler->filter('label[for="filters_textFilter_value"]');
        static::assertSame('Value <i>label</i>', $label->text());
        static::assertCount(0, $label->filter('i'));
        static::assertSame('preserved', $label->attr('data-label'));
        static::assertContains('caller-label', explode(' ', $label->attr('class')));
        static::assertSame('markup', $crawler->filter('#filters_textFilter_value_help em')->text());
        $filterLabel = $crawler->filter('#configured-filter-label');
        static::assertSame('Text <strong>filter</strong>', $filterLabel->text());
        static::assertCount(0, $filterLabel->filter('strong'));
        static::assertSame('collapse', $filterLabel->attr('data-ea-toggle'));
        static::assertSame('preserved', $filterLabel->attr('data-filter-label'));
        static::assertSame('configured-filter-label', $crawler->filter('[data-filter-property="textFilter"] .filter-checkbox')->attr('aria-labelledby'));
    }

    public function testRenderedGetFormKeepsQueryStateAndExactFilterNames(): void
    {
        $crawler = $this->client->request('GET', $this->getCrudUrl('renderFilters', null, [
            'query' => 'Kept', 'sort' => ['numericFilter' => 'DESC'], 'campaign' => 'filter-rendering', 'page' => 3,
            'filters' => ['numericFilter' => ['comparison' => ComparisonType::BETWEEN, 'value' => 2, 'value2' => 6]],
        ]));

        static::assertResponseIsSuccessful();
        $form = $crawler->filter('form[data-ea-filters-form-id]');
        static::assertSame('get', strtolower($form->attr('method')));
        static::assertSame('filters', $form->attr('id'));
        static::assertSame('Kept', $form->filter('input[type="hidden"][name="query"]')->attr('value'));
        static::assertSame('DESC', $form->filter('input[type="hidden"][name="sort[numericFilter]"]')->attr('value'));
        static::assertSame('filter-rendering', $form->filter('input[type="hidden"][name="campaign"]')->attr('value'));
        static::assertCount(0, $form->filter('input[type="hidden"][name="page"], input[type="hidden"][name^="filters["], input[name$="[_token]"]'));
        static::assertCount(0, $form->filter('.filter-checkbox[name]'));
        static::assertSame('between', $form->filter('select[name="filters[numericFilter][comparison]"] option[selected]')->attr('value'));
        static::assertSame('2', $form->filter('input[name="filters[numericFilter][value]"]')->attr('value'));
        static::assertSame('6', $form->filter('input[name="filters[numericFilter][value2]"]')->attr('value'));
        static::assertCount(0, $form->filter('[data-filter-property="numericFilter"] .filter-content[hidden], [data-ea-value2-of-comparison-id="filters_numericFilter_comparison"][hidden]'));
        static::assertCount(1, $form->filter('[data-filter-property="textFilter"] .filter-content[hidden]'));
        static::assertCount(2, $form->filter('input[type="radio"][name="filters[booleanFilter]"]'));
        static::assertCount(1, $form->filter('[data-ea-widget="ea-autocomplete"][data-ea-autocomplete-endpoint-url]'));
    }

    public function testUnselectedComparisonValueStaysPresentAndEnabledAndErrorsRemainAssociated(): void
    {
        $crawler = $this->client->request('GET', $this->getCrudUrl('renderFilters', null, [
            'filters' => ['numericFilter' => ['comparison' => ComparisonType::EQ, 'value' => 'invalid']],
        ]));

        static::assertResponseStatusCodeSame(422);
        static::assertCount(1, $crawler->filter('[data-ea-value2-of-comparison-id="filters_numericFilter_comparison"][hidden] input[name="filters[numericFilter][value2]"]'));
        static::assertCount(0, $crawler->filter('input[name="filters[numericFilter][value2]"][disabled]'));
        $invalidValue = $crawler->filter('input[name="filters[numericFilter][value]"]');
        static::assertSame('true', $invalidValue->attr('aria-invalid'));
        static::assertSame('filters_numericFilter_value_errors', $invalidValue->attr('aria-describedby'));
        static::assertSame('alert', $crawler->filter('#filters_numericFilter_value_errors')->attr('role'));
        static::assertNotSame('', $crawler->filter('#filters_numericFilter_value_errors')->text());
        static::assertCount(0, $crawler->filter('[data-filter-property="numericFilter"] .filter-content[hidden]'));
    }

    public function testRenderedSelectedFilterSubmitsGetAndReturnsRealMatchingEntities(): void
    {
        $first = FilterTestEntityFactory::createOne(['textFilter' => 'Kept first', 'numericFilter' => 3]);
        $second = FilterTestEntityFactory::createOne(['textFilter' => 'Kept second', 'numericFilter' => 6]);
        $excluded = FilterTestEntityFactory::createOne(['textFilter' => 'Kept outside', 'numericFilter' => 9]);
        $other = FilterTestEntityFactory::createOne(['textFilter' => 'Other text', 'numericFilter' => 4]);
        $crawler = $this->client->request('GET', $this->getCrudUrl('renderFilters', null, [
            'query' => 'Kept', 'sort' => ['numericFilter' => 'DESC'], 'campaign' => 'filter-rendering', 'page' => 3,
            'filters' => ['numericFilter' => ['comparison' => ComparisonType::BETWEEN, 'value' => 2, 'value2' => 6]],
        ]));
        $form = $crawler->filter('form[data-ea-filters-form-id]');
        $values = $form->form()->getPhpValues();
        // applying filters removes the controls of every unchecked filter before submission
        $values['filters'] = ['numericFilter' => $values['filters']['numericFilter']];
        // browser GET submissions discard the action query; its retained values are hidden controls
        $target = explode('?', $form->attr('action'), 2)[0];
        $this->client->request('GET', $target, $values);

        static::assertResponseIsSuccessful();
        static::assertSame('GET', $this->client->getRequest()->getMethod());
        static::assertSame('filter-rendering', $this->client->getRequest()->query->get('campaign'));
        static::assertSame(['numericFilter' => 'DESC'], $this->client->getRequest()->query->all('sort'));
        static::assertFalse($this->client->getRequest()->query->has('page'));
        $this->assertVisibleEntityIds([$first->getId(), $second->getId()]);
        $this->entityManager->clear();
        static::assertSame(\count([$first, $second, $excluded, $other]), $this->entityManager->getRepository(FilterTestEntity::class)->count([]));
        $unchangedExcluded = $this->entityManager->find(FilterTestEntity::class, $excluded->getId());
        $unchangedOther = $this->entityManager->find(FilterTestEntity::class, $other->getId());
        static::assertInstanceOf(FilterTestEntity::class, $unchangedExcluded);
        static::assertInstanceOf(FilterTestEntity::class, $unchangedOther);
        static::assertSame(9, $unchangedExcluded->getNumericFilter());
        static::assertSame('Other text', $unchangedOther->getTextFilter());
    }
}
