<?php

namespace Tests\Feature;

use App\Models\FreedomPost;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReactApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_session_endpoint_returns_guest_state(): void
    {
        $this->getJson('/api/session')
            ->assertOk()
            ->assertExactJson(['user' => null]);
    }

    public function test_member_can_register_through_the_api(): void
    {
        $this->postJson('/api/register', [
            'username' => 'NaviMember',
            'email' => 'member@example.com',
            'password' => 'secret-password',
            'password_confirmation' => 'secret-password',
        ])->assertCreated()
            ->assertJsonPath('user.username', 'NaviMember');

        $this->assertAuthenticated();
    }

    public function test_anonymous_wall_submission_is_pending_and_not_publicly_visible(): void
    {
        $response = $this->postJson('/api/freedom-wall', ['message' => 'A note for the community']);

        $response->assertCreated()
            ->assertJsonPath('post.status', 'pending');

        $this->assertDatabaseHas('freedom_posts', [
            'message' => 'A note for the community',
            'status' => 'pending',
        ]);

        $this->getJson('/api/freedom-wall')
            ->assertOk()
            ->assertJsonCount(0, 'posts');
    }

    public function test_public_wall_only_returns_approved_posts(): void
    {
        FreedomPost::create(['message' => 'Waiting for review', 'status' => 'pending']);
        FreedomPost::create(['message' => 'Approved note', 'status' => 'approved']);

        $this->getJson('/api/freedom-wall')
            ->assertOk()
            ->assertJsonCount(1, 'posts')
            ->assertJsonPath('posts.0.message', 'Approved note');
    }
}
