<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Apps\DefaultApp\Controller\Filters;

use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Config\Filters;
use EasyCorp\Bundle\EasyAdminBundle\Filter\BooleanFilter;
use EasyCorp\Bundle\EasyAdminBundle\Filter\DateTimeFilter;
use EasyCorp\Bundle\EasyAdminBundle\Filter\EntityFilter;
use EasyCorp\Bundle\EasyAdminBundle\Filter\NumericFilter;
use EasyCorp\Bundle\EasyAdminBundle\Filter\TextFilter;
use EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Apps\DefaultApp\Controller\Synthetic\FilterTestEntityCrudController;

class FilterRenderingCrudController extends FilterTestEntityCrudController
{
    public function configureCrud(Crud $crud): Crud
    {
        return parent::configureCrud($crud)->setSearchFields(['textFilter'])
            ->addFormTheme('admin/filter_rendering_first.html.twig')
            ->addFormTheme('admin/filter_rendering_last.html.twig');
    }

    public function configureFilters(Filters $filters): Filters
    {
        return $filters
            ->add(TextFilter::new('textFilter', 'Text <strong>filter</strong>')
                ->setFormTypeOption('label_attr', ['id' => 'configured-filter-label', 'class' => 'caller-filter-label', 'data-filter-label' => 'preserved'])
                ->setFormTypeOption('value_type_options.label', 'Value <i>label</i>')
                ->setFormTypeOption('value_type_options.label_html', false)
                ->setFormTypeOption('value_type_options.label_attr', ['class' => 'caller-label', 'data-label' => 'preserved'])
                ->setFormTypeOption('value_type_options.row_attr', ['class' => 'caller-row', 'data-row' => 'preserved'])
                ->setFormTypeOption('value_type_options.attr', ['class' => 'caller-control', 'data-note' => 'A "quoted" <value>', 'aria-describedby' => 'application-help', 'readonly' => true])
                ->setFormTypeOption('value_type_options.help', 'Help <em>markup</em>')
                ->setFormTypeOption('value_type_options.help_html', true))
            ->add(NumericFilter::new('numericFilter'))
            ->add(DateTimeFilter::new('dateFilter'))
            ->add(BooleanFilter::new('booleanFilter'))
            ->add(EntityFilter::new('relatedEntity')->autocomplete());
    }
}
