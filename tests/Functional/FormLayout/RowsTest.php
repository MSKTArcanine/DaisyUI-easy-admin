<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\FormLayout;

use EasyCorp\Bundle\EasyAdminBundle\Test\AbstractCrudTestCase;
use EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Apps\DefaultApp\Controller\DashboardController;
use EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Apps\DefaultApp\Controller\Synthetic\FormLayoutRowsCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Apps\DefaultApp\Entity\Synthetic\FormTestEntity;
use EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Apps\DefaultApp\Factory\FormTestEntityFactory;

class RowsTest extends AbstractCrudTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->client->followRedirects();
    }

    protected function getControllerFqcn(): string
    {
        return FormLayoutRowsCrudController::class;
    }

    protected function getDashboardFqcn(): string
    {
        return DashboardController::class;
    }

    public function testRowBreaksAreRenderedInNewForm(): void
    {
        $crawler = $this->client->request('GET', $this->generateNewFormUrl());

        // check that form uses columns (rows work within columns)
        static::assertCount(2, $crawler->filter('.form-column'), 'Should have 2 columns');

        // check that row elements are present (they have field-form_row class)
        $rowElements = $crawler->filter('.field-form_row');
        static::assertGreaterThanOrEqual(1, $rowElements->count(), 'Should have row break elements');
    }

    public function testRowsCreateVisualBreaks(): void
    {
        $crawler = $this->client->request('GET', $this->generateNewFormUrl());

        $rowElements = $crawler->filter('.field-form_row');
        static::assertCount(3, $rowElements);
        static::assertCount(2, $crawler->filter('.form-column.ea-col-md-6'));

        foreach (['ea-row-break', 'ea-row-break-md', 'ea-row-break'] as $index => $expectedBreak) {
            $row = $rowElements->eq($index);
            $classes = preg_split('/\s+/', trim($row->attr('class')));
            static::assertContains($expectedBreak, $classes);
            static::assertSame('div', $row->nodeName());
            static::assertSame('', trim($row->text()));
            static::assertStringContainsString('ea-form-row', $row->ancestors()->filter('.ea-form-row')->first()->attr('class'));
            foreach (['flex-fill', 'flex-md-fill', 'd-none', 'd-md-flex'] as $legacyClass) {
                static::assertNotContains($legacyClass, $classes);
            }
        }
    }

    public function testFormSubmissionWorksWithRows(): void
    {
        $crawler = $this->client->request('GET', $this->generateNewFormUrl());

        $form = $crawler->filter('form.ea-new-form')->form();
        $form['FormTestEntity[name]'] = 'Row Test Entity';
        $form['FormTestEntity[email]'] = 'row@test.com';
        $form['FormTestEntity[city]'] = 'Row City';

        $this->client->submit($form);

        // check that entity was created
        $entity = $this->entityManager->getRepository(FormTestEntity::class)->findOneBy(['name' => 'Row Test Entity']);
        static::assertNotNull($entity, 'Entity should be created');
        static::assertSame('row@test.com', $entity->getEmail());
        static::assertSame('Row City', $entity->getCity());
    }

    public function testRowsAreRenderedInEditForm(): void
    {
        $entity = FormTestEntityFactory::createOne([
            'name' => 'Edit Row Test',
            'email' => 'edit.row@test.com',
        ]);

        $crawler = $this->client->request('GET', $this->generateEditFormUrl($entity->getId()));

        // check that row elements are present in edit form
        $rowElements = $crawler->filter('.field-form_row');
        static::assertGreaterThanOrEqual(1, $rowElements->count(), 'Edit form should have row break elements');
    }
}
