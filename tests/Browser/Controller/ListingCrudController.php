<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Browser\Controller;

use EasyCorp\Bundle\EasyAdminBundle\Attribute\AdminRoute;
use EasyCorp\Bundle\EasyAdminBundle\Config\Action;
use EasyCorp\Bundle\EasyAdminBundle\Config\ActionGroup;
use EasyCorp\Bundle\EasyAdminBundle\Config\Actions;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Field\FormField;
use EasyCorp\Bundle\EasyAdminBundle\Router\AdminUrlGenerator;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpFoundation\Response;

#[AdminRoute(path: '/listings', name: 'listings')]
class ListingCrudController extends CategoryCrudController
{
    public function __construct(private readonly RequestStack $requests)
    {
    }

    public function configureCrud(Crud $crud): Crud
    {
        return parent::configureCrud($crud)->setPaginatorPageSize(4)->showEntityActionsInlined(false)
            ->setDefaultRowAction(Action::DETAIL)
            ->setDefaultRowActionTrigger($this->requests->getCurrentRequest()?->query->get('trigger', 'single') ?? 'single');
    }

    public function configureFields(string $pageName): iterable
    {
        if (Crud::PAGE_DETAIL === $pageName) {
            yield FormField::addFieldset('Collapsed listing details', propertySuffix: 'listing_details')->collapsible()->renderCollapsed();
        }
        foreach (parent::configureFields($pageName) as $field) {
            if ('name' === $field->getAsDto()->getProperty()) {
                $field->setHelp('<strong>Rich listing help</strong> <img src="data:," onerror="window.listingUnsafe=true"><script>window.listingUnsafe=true</script><a href="javascript:window.listingUnsafe=true">Unsafe link</a>');
            }
            yield $field;
        }
    }

    public function configureActions(Actions $actions): Actions
    {
        $exports = ActionGroup::new('exports', 'Grouped exports')->createAsGlobalActionGroup()
            ->addAction(Action::new('groupExport', 'Confirmed group export')->linkToCrudAction('export')->renderAsForm()->askConfirmation('Export this group?', 'Confirm group export'))
            ->addAction(Action::new('groupVisit', 'Confirmed group visit')->linkToCrudAction('visit')->askConfirmation('Visit the fixture?', 'Confirm visit'));

        return parent::configureActions($actions)
            ->update(Crud::PAGE_INDEX, 'export', static fn (Action $action): Action => $action->askConfirmation('Export this listing?', 'Confirm export'))
            ->add(Crud::PAGE_INDEX, $exports);
    }

    #[AdminRoute(path: '/visit', name: 'visit', options: ['methods' => ['GET']])]
    public function visit(): Response
    {
        return new Response('Fixture GET action submitted');
    }

    #[AdminRoute(path: '/redirect-filters', name: 'redirect_filters', options: ['methods' => ['GET']])]
    public function redirectFilters(AdminUrlGenerator $urls): RedirectResponse
    {
        return $this->redirect($urls->setController(self::class)->setAction('renderFilters')->generateUrl());
    }
}
