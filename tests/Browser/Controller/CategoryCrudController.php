<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Browser\Controller;

use EasyCorp\Bundle\EasyAdminBundle\Attribute\AdminRoute;
use EasyCorp\Bundle\EasyAdminBundle\Config\Action;
use EasyCorp\Bundle\EasyAdminBundle\Config\Actions;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Config\Filters;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\BooleanField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IntegerField;
use EasyCorp\Bundle\EasyAdminBundle\Field\SlugField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use EasyCorp\Bundle\EasyAdminBundle\Tests\Browser\Field\UppercaseField;
use EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Apps\DefaultApp\Entity\Category;
use Symfony\Component\HttpFoundation\Response;

/**
 * @extends AbstractCrudController<Category>
 */
#[AdminRoute(path: '/categories', name: 'categories')]
class CategoryCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return Category::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud->setEntityLabelInSingular('Category')->setEntityLabelInPlural('Categories')
            ->setSearchFields(['name', 'description'])->setDefaultSort(['priority' => 'ASC'])->setPaginatorPageSize(2)
            ->showEntityActionsInlined()->overrideTemplate('layout', 'browser/layout.html.twig')->addFormTheme('browser/form_theme.html.twig');
    }

    public function configureFields(string $pageName): iterable
    {
        yield IdField::new('id')->hideOnForm();
        yield TextField::new('name')->setFormTypeOption('empty_data', '')->setTemplatePath('browser/name_field.html.twig');
        yield SlugField::new('slug')->setTargetFieldName('name')->hideOnIndex();
        yield BooleanField::new('active');
        yield IntegerField::new('priority');
        yield TextField::new('description')->onlyOnForms();
        yield UppercaseField::new('description')->onlyOnDetail();
        yield BooleanField::new('activeDisabled')->setDisabled()->hideOnIndex();
        yield TextField::new('restrictedValue')->setPermission('ROLE_SUPER_ADMIN');
    }

    public function configureFilters(Filters $filters): Filters
    {
        return $filters->add('name')->add('active')->add('priority');
    }

    public function configureActions(Actions $actions): Actions
    {
        return $actions->add(Crud::PAGE_INDEX, Action::DETAIL)
            ->add(Crud::PAGE_INDEX, Action::new('export', 'Export fixture')->createAsGlobalAction()->linkToCrudAction('export')->renderAsForm())
            ->add(Crud::PAGE_INDEX, Action::new('restricted', 'Restricted action')->createAsGlobalAction()->linkToCrudAction('restricted'))
            ->setPermission('restricted', 'ROLE_SUPER_ADMIN');
    }

    #[AdminRoute(path: '/export', name: 'export', options: ['methods' => ['POST']])]
    public function export(): Response
    {
        return new Response('Fixture export submitted');
    }

    #[AdminRoute(path: '/restricted', name: 'restricted')]
    public function restricted(): Response
    {
        return new Response('Restricted fixture');
    }
}
