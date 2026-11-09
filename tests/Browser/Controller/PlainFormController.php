<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Browser\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Form\Extension\Core\Type;
use Symfony\Component\Form\FormFactoryInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Constraints\Length;
use Symfony\Component\Validator\Constraints\NotBlank;

class PlainFormController extends AbstractController
{
    #[Route('/ordinary-form', name: 'browser_ordinary_form', methods: ['GET', 'POST', 'PATCH'])]
    public function index(Request $request, FormFactoryInterface $factory): Response
    {
        $method = 'POST' === $request->query->get('method') ? 'POST' : 'PATCH';
        $builder = $factory->createNamedBuilder('ordinary', Type\FormType::class, [
            'name' => 'Name 1', 'notes' => 'Notes 1', 'flavor' => 'a', 'mode' => 'a', 'flags' => ['a'],
            'agreed' => true, 'disabled' => 'Disabled value', 'readonly' => 'Readonly value',
            'amount' => 12.5, 'money' => 24.5, 'percent' => 0.25,
            'date' => new \DateTime('2026-01-02'), 'compoundDate' => new \DateTime('2026-02-03'),
            'time' => new \DateTime('12:30:00'), 'datetime' => new \DateTime('2026-03-04T12:30:00'),
            'interval' => new \DateInterval('P2D'), 'hidden' => 'Hidden value', 'color' => '#15803d', 'range' => 25,
        ], ['method' => $method, 'action' => $this->generateUrl('browser_ordinary_form', 'POST' === $method ? ['method' => $method] : []), 'attr' => ['data-testid' => 'ordinary-form']]);
        $choices = ['Choice A' => 'a', 'Choice B' => 'b'];
        $builder->add('name', Type\TextType::class, [
            'constraints' => [new NotBlank(), new Length(min: 3)],
            'help' => '<em>Escaped help</em>',
            'attr' => ['data-quoted' => 'A "quoted" <value>', 'aria-describedby' => 'ordinary-hint'],
            'row_attr' => ['data-row' => 'retained'], 'label_attr' => ['data-label' => 'retained'],
        ])->add('notes', Type\TextareaType::class, ['label' => '<strong>Notes</strong>', 'label_html' => true, 'help' => '<em>HTML help</em>', 'help_html' => true])
            ->add('flavor', Type\ChoiceType::class, ['choices' => $choices])
            ->add('mode', Type\ChoiceType::class, ['choices' => $choices, 'expanded' => true])
            ->add('flags', Type\ChoiceType::class, ['choices' => $choices, 'expanded' => true, 'multiple' => true])
            ->add('agreed', Type\CheckboxType::class, ['required' => false])
            ->add('disabled', Type\TextType::class, ['disabled' => true])
            ->add('readonly', Type\TextType::class, ['attr' => ['readonly' => true]])
            ->add('amount', Type\NumberType::class, ['scale' => 2])
            ->add('money', Type\MoneyType::class, ['currency' => 'EUR'])
            ->add('standaloneMoney', Type\MoneyType::class, ['currency' => 'USD', 'mapped' => false, 'data' => 3.5])
            ->add('percent', Type\PercentType::class)
            ->add('date', Type\DateType::class, ['widget' => 'single_text'])
            ->add('compoundDate', Type\DateType::class, ['widget' => 'choice', 'years' => [2025, 2026, 2027]])
            ->add('time', Type\TimeType::class, ['widget' => 'choice'])
            ->add('datetime', Type\DateTimeType::class, ['widget' => 'single_text'])
            ->add('interval', Type\DateIntervalType::class, ['widget' => 'integer', 'with_days' => true])
            ->add('password', Type\RepeatedType::class, ['type' => Type\PasswordType::class, 'required' => false, 'first_options' => ['label' => 'Password'], 'second_options' => ['label' => 'Repeat password']])
            ->add('file', Type\FileType::class, ['required' => false])
            ->add('color', Type\ColorType::class)->add('range', Type\RangeType::class)
            ->add('hidden', Type\HiddenType::class)
            ->add('submit', Type\SubmitType::class, ['label' => 'Submit ordinary form']);
        $form = $builder->getForm()->handleRequest($request);
        if ($form->isSubmitted() && $form->isValid()) {
            $data = $form->getData();
            foreach ($data as $name => $value) {
                if ($value instanceof \DateTimeInterface) {
                    $data[$name] = $value->format('Y-m-d\TH:i:s');
                } elseif ($value instanceof \DateInterval) {
                    $data[$name] = $value->format('%y-%m-%d');
                } elseif ($value instanceof UploadedFile) {
                    $data[$name] = ['name' => $value->getClientOriginalName(), 'contents' => file_get_contents($value->getPathname())];
                }
            }

            return $this->json(['method' => $request->getMethod(), 'values' => $data, 'submitter' => $request->request->all('ordinary')['submit'] ?? null, 'request_fields' => $request->request->all()]);
        }

        return $this->render('browser/ordinary_form.html.twig', ['form' => $form->createView()], new Response(status: $form->isSubmitted() ? 422 : 200));
    }
}
