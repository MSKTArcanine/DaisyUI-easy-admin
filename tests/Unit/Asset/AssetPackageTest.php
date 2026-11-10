<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Unit\Asset;

use EasyCorp\Bundle\EasyAdminBundle\Asset\AssetPackage;
use PHPUnit\Framework\Attributes\TestWith;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;

class AssetPackageTest extends TestCase
{
    #[TestWith([''])]
    #[TestWith(['/school'])]
    public function testDistributedEntryAndFontUrlsRespectTheApplicationBasePath(string $basePath): void
    {
        $request = Request::create($basePath.'/admin', server: [
            'SCRIPT_FILENAME' => '/app/public/index.php',
            'SCRIPT_NAME' => $basePath.'/index.php',
            'PHP_SELF' => $basePath.'/index.php',
        ]);
        self::assertSame($basePath, $request->getBasePath());
        $requests = new RequestStack();
        $requests->push($request);
        $assets = new AssetPackage($requests);
        $publicDirectory = \dirname(__DIR__, 3).'/public';
        $manifest = json_decode(file_get_contents($publicDirectory.'/manifest.json'), true, flags: \JSON_THROW_ON_ERROR);
        $fontNames = array_values(array_filter(array_keys($manifest), static fn (string $name): bool => str_starts_with($name, 'fonts/') && str_ends_with($name, '.woff2')));
        self::assertNotEmpty($fontNames);

        foreach (['app.css', 'app.js', 'form.js', 'field-code-editor.css', 'field-text-editor.css', ...$fontNames] as $name) {
            self::assertFileExists($publicDirectory.'/'.$manifest[$name]);
            self::assertSame($basePath.'/bundles/easyadmin/'.$manifest[$name], $assets->getUrl($name));
        }
    }
}
