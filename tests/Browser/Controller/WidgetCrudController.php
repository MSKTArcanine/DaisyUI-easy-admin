<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Browser\Controller;

use EasyCorp\Bundle\EasyAdminBundle\Attribute\AdminRoute;
use EasyCorp\Bundle\EasyAdminBundle\Config\Action;
use EasyCorp\Bundle\EasyAdminBundle\Config\Actions;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Config\Filters;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Field\CodeEditorField;
use EasyCorp\Bundle\EasyAdminBundle\Field\CollectionField;
use EasyCorp\Bundle\EasyAdminBundle\Field\FileField;
use EasyCorp\Bundle\EasyAdminBundle\Field\FormField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextEditorField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use EasyCorp\Bundle\EasyAdminBundle\Filter\EntityFilter;
use EasyCorp\Bundle\EasyAdminBundle\Tests\Browser\Kernel;
use EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Apps\DefaultApp\Entity\Synthetic\FieldTestEntity;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * @extends AbstractCrudController<FieldTestEntity>
 */
#[AdminRoute(path: '/widgets', name: 'widgets')]
class WidgetCrudController extends AbstractCrudController
{
    public function __construct(private readonly RequestStack $requests)
    {
    }

    public static function getEntityFqcn(): string
    {
        return FieldTestEntity::class;
    }

    public function configureFields(string $pageName): iterable
    {
        $query = $this->requests->getCurrentRequest()?->query;
        yield IdField::new('id')->hideOnForm();
        yield FormField::addTab('Values');
        yield TextField::new('textField', 'Text');
        yield AssociationField::new('manyToOneAssociation', 'Category')->autocomplete()->setCrudController(CategoryCrudController::class);
        yield CollectionField::new('collectionField', 'Entries')->setEntryType(TextType::class)->allowAdd()->allowDelete()->renderExpanded();
        yield FileField::new('fileField', 'Attachment')->setUploadDir(Kernel::storageDir().'/uploads')->setBasePath('/uploads')->setUploadedFileNamePattern('[name].[extension]')->setRequired(false);
        yield FormField::addTab('Editors');
        yield CodeEditorField::new('codeEditorField', 'Code')->setLanguage('javascript')
            ->setRequired($query?->getBoolean('required') ?? false)->setDisabled($query?->getBoolean('readonly') ?? false);
        yield TextEditorField::new('textEditorField', 'Rich text')->setRequired($query?->getBoolean('required') ?? false)
            ->setFormTypeOption('attr.readonly', $query?->getBoolean('readonly') ?? false);
    }

    public function configureActions(Actions $actions): Actions
    {
        return $actions->add(Crud::PAGE_INDEX, Action::DETAIL);
    }

    public function configureFilters(Filters $filters): Filters
    {
        return $filters->add(EntityFilter::new('manyToOneAssociation')
            ->setFormTypeOption('value_type_options.attr.data-ea-widget', 'ea-autocomplete'));
    }
}
