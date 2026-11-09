<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Default\Search;

use EasyCorp\Bundle\EasyAdminBundle\Config\Action;
use EasyCorp\Bundle\EasyAdminBundle\Config\Option\EA;
use EasyCorp\Bundle\EasyAdminBundle\Test\AbstractCrudTestCase;
use EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Apps\DefaultApp\Controller\CategoryCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Apps\DefaultApp\Controller\DashboardController;
use EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Apps\DefaultApp\Entity\Category;
use EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Apps\DefaultApp\Factory\CategoryFactory;
use Symfony\Component\DomCrawler\Crawler;

class CombinedListingStateTest extends AbstractCrudTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->client->followRedirects();
    }

    protected function getControllerFqcn(): string
    {
        return CategoryCrudController::class;
    }

    protected function getDashboardFqcn(): string
    {
        return DashboardController::class;
    }

    public function testPaginationPreservesCombinedListingStateAndResults(): void
    {
        $categories = $this->createCategories();
        $crawler = $this->client->request('GET', $this->combinedIndexUrl());

        self::assertResponseIsSuccessful();
        $this->assertVisibleCategories(\array_slice(array_reverse($categories), 20));

        $previous = $crawler->selectLink('Previous')->link();
        $this->assertListingState($previous->getUri(), 'Match', true);
        $this->client->click($previous);

        self::assertResponseIsSuccessful();
        $this->assertVisibleCategories(\array_slice(array_reverse($categories), 0, 20));
    }

    public function testSearchSubmissionPreservesFiltersSortAndCustomContext(): void
    {
        $categories = $this->createCategories();
        $crawler = $this->client->request('GET', $this->combinedIndexUrl());
        $form = $crawler->filter('input[name="query"]')->ancestors()->filter('form')->form();
        $form[EA::QUERY] = 'Match 03';

        self::assertSame('GET', $form->getMethod());
        $this->client->request('GET', parse_url($form->getUri(), \PHP_URL_PATH), $form->getPhpValues());

        self::assertResponseIsSuccessful();
        self::assertSame('GET', $this->client->getRequest()->getMethod());
        $this->assertListingState($this->client->getRequest()->getUri(), 'Match 03', true);
        self::assertFalse($this->client->getRequest()->query->has(EA::PAGE));
        $this->assertVisibleCategories([$categories[2]]);
    }

    public function testFilterApplyAndResetPreserveSearchSortAndCustomContext(): void
    {
        $categories = $this->createCategories();
        $crawler = $this->client->request('GET', $this->combinedIndexUrl());
        $filterUrl = $crawler->filter('a[data-href]')->attr('data-href');
        $crawler = $this->client->request('GET', $filterUrl);
        $form = $crawler->filter('form[data-ea-filters-form-id]')->form();
        $values = $form->getPhpValues();
        unset($values[EA::FILTERS]['name']);

        self::assertSame('GET', $form->getMethod());
        self::assertArrayNotHasKey(EA::PAGE, $values);
        $this->client->request('GET', parse_url($form->getUri(), \PHP_URL_PATH), $values);

        self::assertResponseIsSuccessful();
        $this->assertListingState($this->client->getRequest()->getUri(), 'Match', true);
        $this->assertVisibleCategories(\array_slice(array_reverse($categories), 0, 20));

        unset($values[EA::FILTERS]);
        $this->client->request('GET', parse_url($form->getUri(), \PHP_URL_PATH), $values);

        self::assertResponseIsSuccessful();
        $this->assertListingState($this->client->getRequest()->getUri(), 'Match', false);
        $inactive = $this->entityManager->getRepository(Category::class)->findOneBy(['slug' => 'match-inactive']);
        self::assertNotNull($inactive);
        $this->assertVisibleCategories([$inactive, ...\array_slice(array_reverse($categories), 0, 19)]);
    }

    private function combinedIndexUrl(): string
    {
        return $this->getCrudUrl(Action::INDEX, options: [
            EA::QUERY => 'Match',
            EA::PAGE => '2',
            EA::SORT.'[name]' => 'DESC',
            EA::FILTERS.'[active]' => '1',
            '_section' => 'review',
            '_context[panel]' => 'queue',
        ]);
    }

    /**
     * @return list<Category>
     */
    private function createCategories(): array
    {
        $categories = [];
        for ($i = 1; $i <= 23; ++$i) {
            $categories[] = CategoryFactory::createOne([
                'name' => sprintf('Match %02d', $i),
                'slug' => sprintf('match-%02d', $i),
                'active' => true,
            ]);
        }

        CategoryFactory::createOne(['name' => 'Match 24', 'slug' => 'match-inactive', 'active' => false]);
        CategoryFactory::createOne(['name' => 'Other 25', 'slug' => 'other-25', 'active' => true]);

        return $categories;
    }

    /**
     * @param list<Category> $categories
     */
    private function assertVisibleCategories(array $categories): void
    {
        self::assertSame(
            array_map(static fn (Category $category): string => (string) $category->getId(), $categories),
            $this->client->getCrawler()->filter('tbody tr[data-id]')->each(static fn (Crawler $row): string => $row->attr('data-id'))
        );
    }

    private function assertListingState(string $uri, string $query, bool $hasActiveFilter): void
    {
        parse_str(parse_url($uri, \PHP_URL_QUERY) ?? '', $parameters);

        self::assertSame($query, $parameters[EA::QUERY]);
        self::assertSame(['name' => 'DESC'], $parameters[EA::SORT]);
        self::assertSame('review', $parameters['_section']);
        self::assertSame(['panel' => 'queue'], $parameters['_context']);
        if ($hasActiveFilter) {
            self::assertSame(['active' => '1'], $parameters[EA::FILTERS]);

            return;
        }

        self::assertArrayNotHasKey(EA::FILTERS, $parameters);
    }
}
