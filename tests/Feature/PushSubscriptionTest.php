<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PushSubscriptionTest extends TestCase
{
    use RefreshDatabase;

    public function test_push_subscription_can_be_saved(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->postJson('/api/push-subscriptions', [
                'endpoint' => 'https://example.com/push/abc123',
                'keys' => [
                    'p256dh' => 'test-public-key',
                    'auth' => 'test-auth-token',
                ],
                'contentEncoding' => 'aes128gcm',
            ]);

        $response->assertOk();

        $this->assertDatabaseHas('push_subscriptions', [
            'subscribable_id' => $user->id,
            'subscribable_type' => User::class,
            'endpoint' => 'https://example.com/push/abc123',
        ]);
    }

    public function test_push_subscription_can_be_deleted(): void
    {
        $user = User::factory()->create();

        $user->updatePushSubscription(
            'https://example.com/push/abc123',
            'test-public-key',
            'test-auth-token',
            'aes128gcm',
        );

        $response = $this
            ->actingAs($user)
            ->deleteJson('/api/push-subscriptions', [
                'endpoint' => 'https://example.com/push/abc123',
            ]);

        $response->assertOk();

        $this->assertDatabaseMissing('push_subscriptions', [
            'endpoint' => 'https://example.com/push/abc123',
        ]);
    }
}
