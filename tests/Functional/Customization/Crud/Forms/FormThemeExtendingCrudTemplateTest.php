<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Customization\Crud\Forms;

use EasyCorp\Bundle\EasyAdminBundle\Test\AbstractCrudTestCase;
use EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Apps\CustomizationApp\Controller\Crud\Forms\FormThemeExtendingCrudTemplateTestCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Apps\CustomizationApp\Controller\DashboardController;
use EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Apps\CustomizationApp\Entity\Category;
use EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Apps\CustomizationApp\Kernel;

/**
 * Symfony resolves the parent templates of form themes using only the Twig globals,
 * so this checks that the EasyAdmin CRUD templates can be extended from a form theme.
 */
class FormThemeExtendingCrudTemplateTest extends AbstractCrudTestCase
{
    protected static function getKernelClass(): string
    {
        return Kernel::class;
    }

    protected function getControllerFqcn(): string
    {
        return FormThemeExtendingCrudTemplateTestCrudController::class;
    }

    protected function getDashboardFqcn(): string
    {
        return DashboardController::class;
    }

    public function testFormThemeCanExtendCrudTemplate(): void
    {
        $this->client->request('GET', $this->generateNewFormUrl());

        static::assertResponseIsSuccessful();
        static::assertSelectorExists('form .custom-form-theme-row');
    }

    public function testCustomFormBlockPreservesCreateAndEditSubmissionContracts(): void
    {
        $repository = $this->entityManager->getRepository(Category::class);
        $initialCount = $repository->count([]);
        $crawler = $this->client->request('GET', $this->generateNewFormUrl());
        $formName = $this->getFormEntity();
        $form = $crawler->filter($this->getEntityFormSelector())->form();
        $form[$formName.'[name]'] = 'Custom row 1';

        static::assertSame('POST', $form->getMethod());
        static::assertNotSame('', $form[$formName.'[_token]']->getValue());
        $this->client->submit($form);

        static::assertSame('POST', $this->client->getRequest()->getMethod());
        static::assertResponseRedirects();
        $this->entityManager->clear();
        $category = $repository->findOneBy(['name' => 'Custom row 1']);
        static::assertNotNull($category);
        static::assertSame($initialCount + 1, $repository->count([]));
        $id = $category->getId();

        $crawler = $this->client->request('GET', $this->generateEditFormUrl($id));
        static::assertResponseIsSuccessful();
        $form = $crawler->filter($this->getEntityFormSelector())->form();
        static::assertSame('Custom row 1', $form[$formName.'[name]']->getValue());
        $form[$formName.'[name]'] = 'Custom row 2';
        $this->client->submit($form);

        static::assertSame('POST', $this->client->getRequest()->getMethod());
        static::assertResponseRedirects();
        $this->entityManager->clear();
        $category = $repository->find($id);
        static::assertNotNull($category);
        static::assertSame('Custom row 2', $category->getName());
        static::assertSame($initialCount + 1, $repository->count([]));
    }
}
