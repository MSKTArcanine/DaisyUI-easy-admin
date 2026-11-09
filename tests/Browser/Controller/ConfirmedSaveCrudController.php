<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Browser\Controller;

use EasyCorp\Bundle\EasyAdminBundle\Attribute\AdminRoute;
use EasyCorp\Bundle\EasyAdminBundle\Config\Action;
use EasyCorp\Bundle\EasyAdminBundle\Config\Actions;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;

#[AdminRoute(path: '/confirmed-save', name: 'confirmed_save')]
class ConfirmedSaveCrudController extends CategoryCrudController
{
    public function configureActions(Actions $actions): Actions
    {
        $actions = parent::configureActions($actions);
        foreach ([Crud::PAGE_NEW, Crud::PAGE_EDIT] as $page) {
            foreach ([Action::SAVE_AND_RETURN, Crud::PAGE_NEW === $page ? Action::SAVE_AND_ADD_ANOTHER : Action::SAVE_AND_CONTINUE] as $name) {
                $actions->update($page, $name, static fn (Action $action): Action => $action->askConfirmation('Confirm fixture save', 'Save confirmed'));
            }
        }

        return $actions;
    }
}
