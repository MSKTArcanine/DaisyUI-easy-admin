<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Browser\Controller;

use EasyCorp\Bundle\EasyAdminBundle\Attribute\AdminRoute;
use EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Apps\DefaultApp\Controller\Synthetic\FormLayoutValidationErrorsCrudController;

#[AdminRoute(path: '/layout', name: 'layout')]
class LayoutCrudController extends FormLayoutValidationErrorsCrudController
{
}
