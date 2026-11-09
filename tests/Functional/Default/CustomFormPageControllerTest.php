<?php

namespace EasyCorp\Bundle\EasyAdminBundle\Tests\Functional\Default;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class CustomFormPageControllerTest extends WebTestCase
{
    public function testCustomFormUsesEasyAdminFormThemeInsideAdminContext(): void
    {
        $client = static::createClient();
        $client->request('GET', '/admin/custom-page-with-form');

        $this->assertResponseIsSuccessful();
        // the custom page renders the full admin layout
        $this->assertSelectorExists('body.ea.page-content');
        $this->assertCustomFormFields();
    }

    public function testEasyAdminFormThemeWorksWithoutAdminContext(): void
    {
        $client = static::createClient();
        $client->request('GET', '/custom-form-without-admin-context');

        $this->assertResponseIsSuccessful();
        $this->assertCustomFormFields();
    }

    private function assertCustomFormFields(): void
    {
        $this->assertSelectorExists('.form-group');
        $this->assertSelectorExists('.form-widget input#form_name[type="text"][name="form[name]"][required]');
        $this->assertSelectorTextSame('label[for="form_name"]', 'Name');
        $this->assertSelectorExists('#form_name[aria-describedby~="form_name_help"]');
        $this->assertSelectorExists('.form-widget textarea#form_bio[name="form[bio]"]:not([required])');
        $this->assertSelectorExists('.form-widget select#form_color[name="form[color]"]:not([required])');
        $this->assertSelectorExists('label[for="form_color"].required');
        $this->assertSelectorTextSame('#form_color option[value="red"]', 'Red');
        $this->assertSelectorTextSame('#form_color option[value="blue"]', 'Blue');
        $this->assertSelectorExists('input#form_subscribe[type="checkbox"][name="form[subscribe]"][value="1"]:not([required])');
        $this->assertSelectorExists('form[method="post"] input[type="hidden"][name="form[_token]"]');
        $this->assertSelectorTextContains('.form-help', 'Your full name');
    }
}
