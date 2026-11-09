<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Browser\Field;

use EasyCorp\Bundle\EasyAdminBundle\Contracts\Field\FieldInterface;
use EasyCorp\Bundle\EasyAdminBundle\Field\FieldTrait;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Contracts\Translation\TranslatableInterface;

final class UppercaseField implements FieldInterface
{
    use FieldTrait;

    public static function new(string $propertyName, TranslatableInterface|string|bool|null $label = null): self
    {
        return (new self())->setProperty($propertyName)->setLabel($label)
            ->setTemplatePath('browser/uppercase_field.html.twig')->setFormType(TextType::class);
    }
}
