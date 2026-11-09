<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Browser\Controller;

use EasyCorp\Bundle\EasyAdminBundle\Config\Action;
use EasyCorp\Bundle\EasyAdminBundle\Config\ActionGroup;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class PrimitivesController extends AbstractController
{
    #[Route('/ui-primitives', name: 'browser_ui_primitives')]
    #[Route('/ui-primitives/override', name: 'browser_ui_primitives_override')]
    public function index(Request $request): Response
    {
        $group = ActionGroup::new('nested', 'Nested choices')
            ->addMainAction(Action::new('main', 'Main choice')->linkToUrl('/ui-primitives?selection=main'))
            ->addAction(Action::new('first', 'Nested first')->linkToUrl('/ui-primitives?selection=first'))
            ->addAction(Action::new('second', 'Nested second')->linkToUrl('/ui-primitives?selection=second'))->getAsDto();
        foreach ([$group->getMainAction(), ...$group->getActions()] as $action) {
            $action->setLinkUrl('/ui-primitives?selection='.$action->getName());
        }

        return $this->render('browser_ui_primitives_override' === $request->attributes->get('_route') ? 'browser/ui_primitives_override.html.twig' : 'browser/ui_primitives.html.twig', [
            'group' => $group,
            'quoted_attribute' => 'A "quoted" <value>',
            'unsafe_label' => '<img src=x onerror=alert(1)>',
            'direction' => $request->query->get('direction', 'ltr'),
        ]);
    }

    #[Route('/ui-primitives/submit', name: 'browser_ui_primitives_submit', methods: ['POST'])]
    public function submit(Request $request): JsonResponse
    {
        if (!$this->isCsrfTokenValid('primitive-form', $request->request->get('token'))) {
            return $this->json(['error' => 'Invalid CSRF token.'], Response::HTTP_FORBIDDEN);
        }

        return $this->json([
            'method' => $request->getMethod(),
            'value' => $request->request->get('value'),
            'submit' => $request->request->get('submit'),
        ]);
    }
}
