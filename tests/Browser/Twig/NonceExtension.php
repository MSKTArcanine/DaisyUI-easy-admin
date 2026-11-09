<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Browser\Twig;

use Symfony\Component\HttpFoundation\RequestStack;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

class NonceExtension extends AbstractExtension
{
    public function __construct(private readonly RequestStack $requests)
    {
    }

    public function getFunctions(): array
    {
        return [new TwigFunction('csp_nonce', [$this, 'getNonce'])];
    }

    public function getNonce(string $kind): string
    {
        if (!\in_array($kind, ['script', 'style'], true)) {
            throw new \InvalidArgumentException(sprintf('The CSP nonce kind "%s" is not supported.', $kind));
        }
        $request = $this->requests->getCurrentRequest();
        if (null === $request) {
            throw new \LogicException('The browser fixture needs an active request to create a CSP nonce.');
        }
        if (!$request->attributes->has('browser_csp_nonce')) {
            $request->attributes->set('browser_csp_nonce', base64_encode(random_bytes(18)));
        }

        return $request->attributes->get('browser_csp_nonce');
    }
}
