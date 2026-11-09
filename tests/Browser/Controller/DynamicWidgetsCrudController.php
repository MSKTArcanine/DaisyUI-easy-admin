<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Browser\Controller;

use EasyCorp\Bundle\EasyAdminBundle\Attribute\AdminRoute;
use EasyCorp\Bundle\EasyAdminBundle\Config\Asset;
use EasyCorp\Bundle\EasyAdminBundle\Config\Assets;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\CollectionField;
use EasyCorp\Bundle\EasyAdminBundle\Field\FormField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use EasyCorp\Bundle\EasyAdminBundle\Tests\Browser\Form\DynamicEntryType;
use EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Apps\DefaultApp\Entity\Synthetic\FieldTestEntity;

/**
 * @extends AbstractCrudController<FieldTestEntity>
 */
#[AdminRoute(path: '/dynamic-widgets', name: 'dynamic_widgets')]
class DynamicWidgetsCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return FieldTestEntity::class;
    }

    public function configureAssets(Assets $assets): Assets
    {
        foreach (['field-code-editor.js', 'field-text-editor.js', 'field-textarea.js', 'field-slug.js', 'field-file-upload.js'] as $entry) {
            $assets->addJsFile(Asset::fromEasyAdminAssetPackage($entry));
        }
        foreach (['field-code-editor.css', 'field-text-editor.css'] as $entry) {
            $assets->addCssFile(Asset::fromEasyAdminAssetPackage($entry));
        }

        return $assets;
    }

    public function configureFields(string $pageName): iterable
    {
        yield FormField::addTab('Main');
        yield TextField::new('textField', 'Text');
        yield FormField::addTab('Dynamic');
        yield CollectionField::new('multipleChoiceField', 'Dynamic entries')->setRequired(true)
            ->setEntryType(DynamicEntryType::class)->setFormTypeOption('prototype_name', '__name__')
            ->setEntryToStringMethod(static fn (?array $entry): string => $entry['title'] ?? 'New entry');
    }
}
