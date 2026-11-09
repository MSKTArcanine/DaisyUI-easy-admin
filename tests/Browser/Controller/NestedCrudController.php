<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Browser\Controller;

use EasyCorp\Bundle\EasyAdminBundle\Attribute\AdminRoute;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\CollectionField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use EasyCorp\Bundle\EasyAdminBundle\Tests\Browser\Form\NestedEntryType;
use EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Apps\DefaultApp\Entity\Synthetic\FieldTestEntity;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * @extends AbstractCrudController<FieldTestEntity>
 */
#[AdminRoute(path: '/nested', name: 'nested')]
class NestedCrudController extends AbstractCrudController
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
        $locked = $this->requests->getCurrentRequest()?->query->getBoolean('locked') ?? false;
        yield TextField::new('textField', 'Text');
        yield CollectionField::new('arrayField', 'Groups')->setRequired(true)->setEntryType(NestedEntryType::class)
            ->setFormTypeOption('prototype_name', '__name__')
            ->setFormTypeOption('entry_options.row_attr', ['class' => 'caller-group', 'data-group-row' => '<Group "__name__">'])
            ->setFormTypeOption('row_attr', ['data-testid' => 'nested-groups'])
            ->setEntryToStringMethod(static fn (?array $entry): string => $entry['title'] ?? 'New group')
            ->allowAdd(!$locked)->allowDelete(!$locked);
    }
}
