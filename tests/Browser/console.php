<?php

require __DIR__.'/bootstrap.php';

use Doctrine\ORM\Tools\SchemaTool;
use EasyCorp\Bundle\EasyAdminBundle\Tests\Browser\Kernel;
use EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Apps\DefaultApp\Entity\BlogPost;
use EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Apps\DefaultApp\Entity\Category;
use EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Apps\DefaultApp\Entity\Synthetic\FieldTestEntity;
use EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Apps\DefaultApp\Entity\Synthetic\FormTestEntity;
use EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Apps\DefaultApp\Entity\User;
use Symfony\Bundle\FrameworkBundle\Console\Application;

$kernel = new Kernel();
if (!\in_array($_SERVER['argv'][1] ?? '', ['seed', 'state'], true)) {
    exit((new Application($kernel))->run());
}

$kernel->boot();
$manager = $kernel->getContainer()->get('doctrine')->getManager();
if ('seed' === $_SERVER['argv'][1]) {
    foreach (new DirectoryIterator(Kernel::storageDir().'/uploads') as $file) {
        if ($file->isFile() && !unlink($file->getPathname())) {
            throw new RuntimeException(sprintf('Cannot remove fixture upload "%s".', $file->getPathname()));
        }
    }
    $schema = new SchemaTool($manager);
    $metadata = $manager->getMetadataFactory()->getAllMetadata();
    $schema->dropSchema($metadata);
    $schema->createSchema($metadata);

    $categories = [];
    foreach (range(1, 6) as $number) {
        $category = (new Category())->setName('Category '.$number)->setSlug('category-'.$number)
            ->setDescription('Description '.$number)->setPriority($number)->setActive(0 !== $number % 2);
        $manager->persist($category);
        $categories[] = $category;
    }
    $author = (new User())->setName('Author 1')->setEmail('author1@example.com');
    $manager->persist($author);
    $post = (new BlogPost())->setTitle('Post 1')->setSlug('post-1')->setContent('Post content')
        ->setCreatedAt(new DateTimeImmutable('2026-01-01T12:00:00Z'))->setAuthor($author)->addCategory($categories[0]);
    $manager->persist($post);
    $widget = (new FieldTestEntity())->setTextField('Widget 1')->setCollectionField(['Entry 1'])
        ->setCodeEditorField('const value = 1;')->setTextEditorField('<div>Rich text 1</div>')->setManyToOneAssociation($categories[0]);
    $manager->persist($widget);
    $layout = (new FormTestEntity())->setName('Layout 1')->setEmail('layout@example.com')
        ->setStreet('Street 1')->setCity('City 1')->setCountry('US')->setPriority(1)->setStatus('draft');
    $manager->persist($layout);
    $manager->flush();
}

$categories = array_map(static fn (Category $category): array => [
    'id' => $category->getId(), 'name' => $category->getName(), 'slug' => $category->getSlug(),
    'description' => $category->getDescription(), 'priority' => $category->getPriority(), 'active' => $category->isActive(),
], $manager->getRepository(Category::class)->findBy([], ['id' => 'ASC']));
$widgets = array_map(static function (FieldTestEntity $widget): array {
    $filename = $widget->getFileField();
    $file = null !== $filename ? Kernel::storageDir().'/uploads/'.$filename : null;

    return ['id' => $widget->getId(), 'text' => $widget->getTextField(), 'entries' => $widget->getCollectionField(),
        'categoryId' => $widget->getManyToOneAssociation()?->getId(), 'file' => $filename,
        'fileContents' => null !== $file && is_file($file) ? file_get_contents($file) : null,
        'code' => $widget->getCodeEditorField(), 'richText' => $widget->getTextEditorField()];
}, $manager->getRepository(FieldTestEntity::class)->findBy([], ['id' => 'ASC']));
$layouts = array_map(static fn (FormTestEntity $layout): array => [
    'id' => $layout->getId(), 'name' => $layout->getName(), 'priority' => $layout->getPriority(),
], $manager->getRepository(FormTestEntity::class)->findBy([], ['id' => 'ASC']));

$uploads = [];
foreach (new DirectoryIterator(Kernel::storageDir().'/uploads') as $file) {
    if ($file->isFile()) {
        $uploads[] = $file->getFilename();
    }
}
sort($uploads);

echo json_encode(['categories' => $categories, 'widgets' => $widgets, 'layouts' => $layouts, 'uploads' => $uploads], \JSON_THROW_ON_ERROR | \JSON_PRETTY_PRINT)."\n";
$kernel->shutdown();
