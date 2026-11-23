<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_application_serves_the_react_mount_point(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertSee('id="root"', false)
            ->assertSee('name="csrf-token"', false);
    }
}
