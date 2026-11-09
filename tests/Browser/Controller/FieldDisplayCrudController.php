<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Browser\Controller;

use EasyCorp\Bundle\EasyAdminBundle\Attribute\AdminRoute;
use EasyCorp\Bundle\EasyAdminBundle\Config\Action;
use EasyCorp\Bundle\EasyAdminBundle\Config\Actions;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\AvatarField;
use EasyCorp\Bundle\EasyAdminBundle\Field\CodeEditorField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ColorField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ImageField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextEditorField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use EasyCorp\Bundle\EasyAdminBundle\Field\UrlField;
use EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Apps\DefaultApp\Entity\Synthetic\FieldTestEntity;

/**
 * @extends AbstractCrudController<FieldTestEntity>
 */
#[AdminRoute(path: '/field-display', name: 'field_display')]
class FieldDisplayCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return FieldTestEntity::class;
    }

    public function configureFields(string $pageName): iterable
    {
        yield TextField::new('textField', 'Text');
        yield AvatarField::new('avatarField', 'Avatar "quoted" <value>')->setHeight(96)->setIsGravatarEmail(false);
        yield ImageField::new('imageField', 'Image "quoted" <value>')->setBasePath('/')->allowRiskyInlineRender();
        yield ColorField::new('colorField', 'Color')->showValue();
        yield UrlField::new('urlField', 'Safe URL');
        yield UrlField::new('telephoneField', 'Unsafe URL');
        yield CodeEditorField::new('codeEditorField', 'Code')->setLanguage('javascript');
        yield TextEditorField::new('textEditorField', 'Rich text');
    }

    public function configureActions(Actions $actions): Actions
    {
        return $actions->add(Crud::PAGE_INDEX, Action::DETAIL);
    }
}
