<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Apps\DefaultApp\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Form\Extension\Core\Type\CheckboxType;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\Form\Extension\Core\Type\CollectionType;
use Symfony\Component\Form\Extension\Core\Type\FileType;
use Symfony\Component\Form\Extension\Core\Type\FormType;
use Symfony\Component\Form\Extension\Core\Type\HiddenType;
use Symfony\Component\Form\Extension\Core\Type\MoneyType;
use Symfony\Component\Form\Extension\Core\Type\PercentType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Constraints\NotBlank;

class CoreFormThemeController extends AbstractController
{
    #[Route('/core-form-theme', name: 'core_form_theme')]
    public function form(Request $request): Response
    {
        $put = $request->query->has('put');
        $form = $this->container->get('form.factory')->createNamedBuilder('presentation', FormType::class, [
            'title' => 'Original title', 'active' => false, 'mode' => 'first', 'amount' => 1234, 'rowAmount' => 1234,
            'ratio' => 0.25, 'rowRatio' => 0.25, 'tags' => [],
        ], [
            'method' => $put ? 'PUT' : 'POST',
            'action' => $this->generateUrl('core_form_theme', $put ? ['put' => 1] : []),
            'attr' => ['data-form-attribute' => 'A "quoted" <form>'],
        ])
            ->add('title', TextType::class, [
                'label' => '<b>Escaped label</b>', 'label_html' => false,
                'label_attr' => ['class' => 'caller-label', 'data-label' => 'preserved'],
                'attr' => ['class' => 'caller-widget', 'data-note' => '<script>"quoted"</script>', 'aria-describedby' => 'application-description'],
                'row_attr' => ['class' => 'caller-row', 'data-row' => 'preserved'],
                'help' => '<em>Escaped help</em>', 'help_html' => false, 'constraints' => [new NotBlank()],
            ])
            ->add('rich', TextType::class, [
                'mapped' => false, 'required' => false, 'label' => '<strong>Formatted label</strong>', 'label_html' => true,
                'help' => '<em>Formatted help</em>', 'help_html' => true,
            ])
            ->add('active', CheckboxType::class, [
                'required' => false, 'value' => 'enabled', 'label' => 'Active setting',
                'label_attr' => ['class' => 'checkbox-switch checkbox-switch-danger caller-switch-label'],
                'attr' => ['data-switch' => 'preserved'],
            ])
            ->add('mode', ChoiceType::class, [
                'choices' => ['First <b>choice</b>' => 'first', 'Second choice' => 'second'],
                'expanded' => true, 'choice_translation_domain' => false, 'label' => 'Configured mode',
            ])
            ->add('amount', MoneyType::class, ['currency' => 'EUR', 'divisor' => 100])
            ->add('rowAmount', MoneyType::class, ['currency' => 'EUR', 'divisor' => 100])
            ->add('ratio', PercentType::class)
            ->add('rowRatio', PercentType::class)
            ->add('tags', CollectionType::class, ['entry_type' => TextType::class, 'allow_add' => true, 'allow_delete' => true])
            ->add('attachment', FileType::class, ['mapped' => false, 'required' => false])
            ->add('rest', HiddenType::class, ['data' => 'Rest sentinel'])
            ->getForm();
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $values = $form->getData();
            $request->getSession()->set('core_form_values', $values);

            return $this->json(['method' => $request->getMethod(), 'values' => $values]);
        }

        return $this->render('admin/core_form_theme.html.twig', ['form' => $form]);
    }

    #[Route('/core-form-theme/result', name: 'core_form_theme_result')]
    public function result(Request $request): JsonResponse
    {
        return $this->json($request->getSession()->get('core_form_values'));
    }
}
