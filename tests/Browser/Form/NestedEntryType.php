<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Browser\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\CollectionType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Validator\Constraints\NotBlank;

class NestedEntryType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder->add('title', TextType::class, ['constraints' => [new NotBlank()]])
            ->add('items', CollectionType::class, [
                'label' => 'Children',
                'entry_type' => TextType::class,
                'entry_options' => ['label' => 'Child', 'constraints' => [new NotBlank()], 'row_attr' => ['class' => 'caller-entry', 'data-entry-label' => 'Child "__name__" <value>']],
                'allow_add' => true,
                'allow_delete' => true,
                'row_attr' => ['data-testid' => 'nested-children'],
            ]);
    }
}
