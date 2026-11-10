<?php

namespace App\Controller;

use App\Entity\Entry;
use App\Field\StatusField;
use Doctrine\ORM\EntityManagerInterface;
use EasyCorp\Bundle\EasyAdminBundle\Attribute\AdminRoute;
use EasyCorp\Bundle\EasyAdminBundle\Config\Action;
use EasyCorp\Bundle\EasyAdminBundle\Config\Actions;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\BooleanField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ChoiceField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IntegerField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextareaField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use Symfony\Component\HttpFoundation\JsonResponse;

/**
 * @extends AbstractCrudController<Entry>
 */
#[AdminRoute(path: '/entries', name: 'entries')]
class EntryCrudController extends AbstractCrudController
{
    public function __construct(private readonly EntityManagerInterface $entityManager)
    {
    }

    public static function getEntityFqcn(): string
    {
        return Entry::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud->setEntityLabelInSingular('Entry')->setEntityLabelInPlural('Entries')->showEntityActionsInlined()->setDefaultSort(['priority' => 'ASC']);
    }

    public function configureFields(string $pageName): iterable
    {
        yield TextField::new('title', 'Title')->setFormTypeOption('empty_data', '')->setTemplatePath('admin/fields/title.html.twig');
        yield StatusField::new('status', 'Status')->hideOnForm();
        yield ChoiceField::new('status', 'Status')->setChoices(['Draft' => 'draft', 'Reviewed' => 'reviewed'])->onlyOnForms();
        yield IntegerField::new('priority', 'Priority');
        yield TextareaField::new('notes', 'Notes');
        yield BooleanField::new('published', 'Published');
    }

    public function configureActions(Actions $actions): Actions
    {
        return $actions->add(Crud::PAGE_INDEX, Action::DETAIL)
            ->add(Crud::PAGE_INDEX, Action::new('export', 'Export entries')->createAsGlobalAction()->linkToCrudAction('export'));
    }

    #[AdminRoute(path: '/export', name: 'export', options: ['methods' => ['GET']])]
    public function export(): JsonResponse
    {
        return $this->json(['entries' => array_map(static fn (Entry $entry): array => ['id' => $entry->getId(), 'title' => $entry->getTitle(), 'status' => $entry->getStatus(), 'priority' => $entry->getPriority(), 'notes' => $entry->getNotes(), 'published' => $entry->isPublished()], $this->entityManager->getRepository(Entry::class)->findBy([], ['priority' => 'ASC']))]);
    }
}
