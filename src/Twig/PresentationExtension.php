<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Twig;

use Twig\Extension\AbstractExtension;
use Twig\TwigFilter;
use Twig\TwigFunction;

/**
 * @internal
 */
final class PresentationExtension extends AbstractExtension
{
    private const BREAKPOINTS = ['', 'sm', 'md', 'lg', 'xl', 'xxl'];
    private const BUTTON_COLORS = [
        'btn-default' => 'btn-neutral',
        'btn-secondary' => 'btn-neutral',
        'btn-neutral' => 'btn-neutral',
        'btn-primary' => 'btn-primary',
        'btn-success' => 'btn-success',
        'btn-warning' => 'btn-warning',
        'btn-danger' => 'btn-error',
        'btn-error' => 'btn-error',
        'btn-info' => 'btn-info',
        'btn-accent' => 'btn-accent',
    ];
    private const BUTTON_STYLES = [
        'btn-solid' => '',
        'btn-outline' => 'btn-outline',
        'btn-light' => 'btn-soft',
        'btn-soft' => 'btn-soft',
        'btn-ghost' => 'btn-ghost',
        'btn-link' => 'btn-link',
        'btn-dash' => 'btn-dash',
    ];
    private const BUTTON_SIZES = [
        'btn-xs' => 'btn-xs',
        'btn-sm' => 'btn-sm',
        'btn-md' => 'btn-md',
        'btn-lg' => 'btn-lg',
        'btn-xl' => 'btn-xl',
    ];
    private const BADGE_COLORS = [
        'badge-default' => 'badge-neutral',
        'badge-secondary' => 'badge-neutral',
        'badge-neutral' => 'badge-neutral',
        'badge-primary' => 'badge-primary',
        'badge-success' => 'badge-success',
        'badge-warning' => 'badge-warning',
        'badge-danger' => 'badge-error',
        'badge-error' => 'badge-error',
        'badge-info' => 'badge-info',
        'badge-accent' => 'badge-accent',
        'badge-light' => 'ea-badge-light',
        'badge-dark' => 'ea-badge-dark',
        'ea-badge-light' => 'ea-badge-light',
        'ea-badge-dark' => 'ea-badge-dark',
    ];
    private const BADGE_STYLES = [
        'badge-variant-light' => 'badge-soft',
        'badge-variant-solid' => '',
        'badge-variant-outline' => 'badge-outline',
        'badge-variant-dot' => 'badge-outline',
        'badge-soft' => 'badge-soft',
        'badge-outline' => 'badge-outline',
        'badge-ghost' => 'badge-ghost',
        'badge-dash' => 'badge-dash',
    ];
    private const BADGE_SIZES = [
        'badge-xs' => 'badge-xs',
        'badge-sm' => 'badge-sm',
        'badge-md' => 'badge-md',
        'badge-lg' => 'badge-lg',
        'badge-xl' => 'badge-xl',
    ];
    private const ALERT_COLORS = [
        'alert-primary' => 'ea-alert-primary',
        'alert-secondary' => 'ea-alert-secondary',
        'alert-light' => 'ea-alert-light',
        'alert-dark' => 'ea-alert-dark',
        'alert-success' => 'alert-success',
        'alert-warning' => 'alert-warning',
        'alert-danger' => 'alert-error',
        'alert-error' => 'alert-error',
        'alert-info' => 'alert-info',
        'alert-notice' => 'alert-info',
        'ea-alert-primary' => 'ea-alert-primary',
        'ea-alert-secondary' => 'ea-alert-secondary',
        'ea-alert-light' => 'ea-alert-light',
        'ea-alert-dark' => 'ea-alert-dark',
    ];
    private const UI_ATTRIBUTES = [
        'data-bs-toggle' => 'data-ea-toggle',
        'data-bs-target' => 'data-ea-target',
        'data-bs-dismiss' => 'data-ea-dismiss',
        'data-bs-keyboard' => 'data-ea-keyboard',
        'data-bs-backdrop' => 'data-ea-backdrop',
        'data-bs-auto-close' => 'data-ea-auto-close',
        'data-bs-reference' => 'data-ea-reference',
        'data-bs-offset' => 'data-ea-offset',
        'data-bs-placement' => 'data-ea-placement',
        'data-bs-animation' => 'data-ea-animation',
        'data-bs-trigger' => 'data-ea-trigger',
        'data-bs-delay' => 'data-ea-delay',
        'data-bs-container' => 'data-ea-container',
        'data-bs-boundary' => 'data-ea-boundary',
        'data-bs-html' => 'data-ea-html',
        'data-bs-custom-class' => 'data-ea-custom-class',
        'data-bs-title' => 'data-ea-title',
        'data-bs-content' => 'data-ea-content',
    ];

    public function getFilters(): array
    {
        return [
            new TwigFilter('ea_ui_classes', [$this, 'mapClasses']),
            new TwigFilter('ea_ui_attrs', [$this, 'mapAttributes']),
        ];
    }

    public function getFunctions(): array
    {
        return [
            new TwigFunction('ea_ui_classes', [$this, 'mapClasses']),
            new TwigFunction('ea_ui_attrs', [$this, 'mapAttributes']),
        ];
    }

    public function mapClasses(?string $classes, string $context = 'layout'): string
    {
        $tokens = preg_split('/\s+/', trim($classes ?? ''), flags: \PREG_SPLIT_NO_EMPTY);
        if (false === $tokens || [] === $tokens) {
            return '';
        }
        $tokens = array_map(static fn (string $token): string => 'visually-hidden' === $token ? 'sr-only' : $token, $tokens);

        return match ($context) {
            'button' => $this->componentClasses($tokens, self::BUTTON_COLORS, self::BUTTON_STYLES, self::BUTTON_SIZES, $context),
            'badge' => $this->componentClasses($tokens, self::BADGE_COLORS, self::BADGE_STYLES, self::BADGE_SIZES, $context),
            'alert' => $this->componentClasses($tokens, self::ALERT_COLORS, [], [], $context),
            'switch' => $this->switchClasses($tokens),
            'pagination' => $this->paginationClasses($tokens),
            'layout' => $this->layoutClasses($tokens),
            'row' => $this->rowClasses($tokens),
            default => throw new \InvalidArgumentException(sprintf('The presentation context "%s" is not supported.', $context)),
        };
    }

    /**
     * @param array<string, mixed> $attributes
     *
     * @return array<string, mixed>
     */
    public function mapAttributes(array $attributes): array
    {
        if (\array_key_exists('data-bs-toggle', $attributes) && !\in_array($attributes['data-bs-toggle'], ['modal', 'dropdown', 'tab', 'collapse', 'tooltip', 'popover'], true)) {
            return $attributes;
        }

        if (\array_key_exists('data-bs-dismiss', $attributes) && !\in_array($attributes['data-bs-dismiss'], ['modal', 'alert'], true)) {
            return $attributes;
        }

        foreach (self::UI_ATTRIBUTES as $legacyName => $name) {
            if (!\array_key_exists($legacyName, $attributes)) {
                continue;
            }

            if (!\array_key_exists($name, $attributes)) {
                $attributes[$name] = $attributes[$legacyName];
            }

            unset($attributes[$legacyName]);
        }

        if (isset($attributes['data-bs-popper-config']) && \is_string($attributes['data-bs-popper-config'])) {
            $configuration = json_decode($attributes['data-bs-popper-config'], true);
            if (['strategy' => 'fixed'] === $configuration) {
                if (!\array_key_exists('data-ea-position', $attributes)) {
                    $attributes['data-ea-position'] = 'fixed';
                }
                unset($attributes['data-bs-popper-config']);
            }
        }

        return $attributes;
    }

    /**
     * @param list<string>          $tokens
     * @param array<string, string> $colors
     * @param array<string, string> $styles
     * @param array<string, string> $sizes
     */
    private function componentClasses(array $tokens, array $colors, array $styles, array $sizes, string $context): string
    {
        $result = [];
        $groups = [];
        $positions = [];
        $setGroup = static function (string $group, string $value) use (&$result, &$groups, &$positions): void {
            if (!isset($positions[$group])) {
                $positions[$group] = \count($result);
                $result[] = null;
            }

            $groups[$group] = $value;
        };

        foreach ($tokens as $token) {
            if (isset($colors[$token])) {
                $setGroup('color', $colors[$token]);
                continue;
            }

            if (\array_key_exists($token, $styles)) {
                $setGroup('style', $styles[$token]);
                continue;
            }

            if (isset($sizes[$token])) {
                $setGroup('size', $sizes[$token]);
                continue;
            }

            if ('button' === $context && str_starts_with($token, 'btn-outline-') && isset($colors['btn-'.substr($token, 12)])) {
                $setGroup('color', $colors['btn-'.substr($token, 12)]);
                $setGroup('style', 'btn-outline');
                continue;
            }

            $result[] = match (true) {
                'button' === $context && 'disabled' === $token => 'btn-disabled',
                'alert' === $context && 'alert-dismissible' === $token => 'ea-alert-dismissible',
                default => $token,
            };
        }

        foreach ($positions as $group => $position) {
            $result[$position] = $groups[$group];
        }

        if ('badge' === $context && !isset($positions['style'])) {
            $position = isset($positions['color']) ? $positions['color'] + 1 : (false !== ($badgePosition = array_search('badge', $result, true)) ? $badgePosition + 1 : 0);
            array_splice($result, $position, 0, ['badge-soft']);
        }

        return implode(' ', array_unique(array_filter($result, static fn (?string $token): bool => null !== $token && '' !== $token)));
    }

    /**
     * @param list<string> $tokens
     */
    private function layoutClasses(array $tokens): string
    {
        $result = [];
        foreach ($tokens as $token) {
            if (1 === preg_match('/^col(?:-(sm|md|lg|xl|xxl))?(?:-(auto|[1-9]|1[0-2]))?$/', $token)) {
                $result[] = 'ea-'.$token;
                continue;
            }

            if (1 === preg_match('/^offset(?:-(sm|md|lg|xl|xxl))?-(0|[1-9]|1[01])$/', $token)) {
                $result[] = 'ea-'.$token;
                continue;
            }

            $result[] = $token;
        }

        return implode(' ', array_unique($result));
    }

    /**
     * @param list<string> $tokens
     */
    private function rowClasses(array $tokens): string
    {
        $result = [];
        $breakpoint = null;
        foreach (self::BREAKPOINTS as $candidate) {
            if ('' === $candidate && \in_array('flex-fill', $tokens, true)) {
                $breakpoint = '';
                continue;
            }

            if ('' !== $candidate && \in_array('d-none', $tokens, true) && \in_array('d-'.$candidate.'-flex', $tokens, true) && \in_array('flex-'.$candidate.'-fill', $tokens, true)) {
                $breakpoint = $candidate;
            }
        }

        if (null === $breakpoint) {
            return implode(' ', $tokens);
        }

        $replaced = '' === $breakpoint ? ['flex-fill'] : ['d-none', 'd-'.$breakpoint.'-flex', 'flex-'.$breakpoint.'-fill'];
        foreach ($tokens as $token) {
            if (!\in_array($token, $replaced, true)) {
                $result[] = $token;
            }
        }
        $result[] = 'ea-row-break'.('' === $breakpoint ? '' : '-'.$breakpoint);

        return implode(' ', array_unique($result));
    }

    /**
     * @param list<string> $tokens
     */
    private function switchClasses(array $tokens): string
    {
        $colors = [
            'ea-switch-success' => 'toggle-success', 'toggle-success' => 'toggle-success',
            'ea-switch-warning' => 'toggle-warning', 'toggle-warning' => 'toggle-warning',
            'ea-switch-danger' => 'toggle-error', 'toggle-error' => 'toggle-error',
            'toggle-primary' => 'toggle-primary', 'toggle-secondary' => 'toggle-secondary',
            'toggle-neutral' => 'toggle-neutral', 'toggle-info' => 'toggle-info', 'toggle-accent' => 'toggle-accent',
        ];
        $sizes = ['ea-switch-sm' => 'toggle-sm', 'toggle-sm' => 'toggle-sm', 'ea-switch-lg' => 'toggle-lg', 'toggle-lg' => 'toggle-lg', 'toggle-md' => 'toggle-md'];

        return $this->componentClasses($tokens, $colors, [], $sizes, 'switch');
    }

    /**
     * @param list<string> $tokens
     */
    private function paginationClasses(array $tokens): string
    {
        $result = [];
        foreach ($tokens as $token) {
            $classes = match ($token) {
                'pagination' => ['pagination', 'join'],
                'page-link' => ['page-link', 'btn', 'btn-ghost', 'join-item'],
                default => [$token],
            };
            array_push($result, ...$classes);
        }

        return implode(' ', array_unique($result));
    }
}
