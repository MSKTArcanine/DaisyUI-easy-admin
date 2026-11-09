<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Browser\Controller;

use EasyCorp\Bundle\EasyAdminBundle\Attribute\AdminRoute;
use Symfony\Component\HttpFoundation\RequestStack;

#[AdminRoute(path: '/toggles', name: 'toggles')]
class ToggleCrudController extends CategoryCrudController
{
    public function __construct(private readonly RequestStack $requests)
    {
    }

    public function configureFields(string $pageName): iterable
    {
        foreach (parent::configureFields($pageName) as $field) {
            if ('active' === $field->getAsDto()->getProperty()) {
                $field->setDisabled($this->requests->getCurrentRequest()?->query->getBoolean('disabled') ?? false);
            }
            yield $field;
        }
    }
}
