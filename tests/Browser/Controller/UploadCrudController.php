<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Browser\Controller;

use EasyCorp\Bundle\EasyAdminBundle\Attribute\AdminRoute;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\FileField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ImageField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use EasyCorp\Bundle\EasyAdminBundle\Tests\Browser\Kernel;
use EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Apps\DefaultApp\Entity\Synthetic\FieldTestEntity;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * @extends AbstractCrudController<FieldTestEntity>
 */
#[AdminRoute(path: '/uploads', name: 'uploads')]
class UploadCrudController extends AbstractCrudController
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
        yield TextField::new('textField', 'Text');
        if ($query?->getBoolean('image')) {
            yield ImageField::new('emailField', 'Image attachment')->setUploadDir(Kernel::storageDir().'/uploads')
                ->setBasePath('/uploads')->setFormTypeOption('download_path', '/uploads/')->setUploadedFileNamePattern('[name].[extension]')->setRequired(false);

            return;
        }
        yield FileField::new('multipleChoiceField', 'Attachments')->setUploadDir(Kernel::storageDir().'/uploads')
            ->setBasePath('/uploads')->setFormTypeOption('download_path', '/uploads/')->setUploadedFileNamePattern('[name].[extension]')->setFormTypeOption('multiple', true)
            ->setDisabled($query?->getBoolean('disabled') ?? false)
            ->isDeletable(!($query?->getBoolean('nodelete') ?? false));
    }
}
