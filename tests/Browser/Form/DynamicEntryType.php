<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Browser\Form;

use EasyCorp\Bundle\EasyAdminBundle\Form\Type\CodeEditorType;
use EasyCorp\Bundle\EasyAdminBundle\Form\Type\FileUploadType;
use EasyCorp\Bundle\EasyAdminBundle\Form\Type\SlugType;
use EasyCorp\Bundle\EasyAdminBundle\Form\Type\TextEditorType;
use EasyCorp\Bundle\EasyAdminBundle\Tests\Browser\Kernel;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\Form\Extension\Core\Type\TextareaType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Validator\Constraints\NotBlank;

class DynamicEntryType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder->add('title', TextType::class, ['constraints' => [new NotBlank()]])
            ->add('slug', SlugType::class, ['target' => 'title', 'required' => false])
            ->add('notes', TextareaType::class, ['required' => false, 'attr' => ['data-ea-textarea-field' => true]])
            ->add('code', CodeEditorType::class, ['constraints' => [new NotBlank()]])
            ->add('richText', TextEditorType::class, ['constraints' => [new NotBlank()]])
            ->add('disabledCode', CodeEditorType::class, ['disabled' => true, 'required' => false, 'data' => 'Disabled source'])
            ->add('choice', ChoiceType::class, ['choices' => ['Group A' => ['Choice A' => 'a'], 'Group B' => ['Choice B' => 'b']], 'attr' => ['data-ea-widget' => 'ea-autocomplete']])
            ->add('attachment', FileUploadType::class, ['required' => false, 'upload_dir' => Kernel::storageDir().'/uploads/', 'upload_filename' => '[name].[extension]', 'download_path' => '/uploads/']);
    }
}
