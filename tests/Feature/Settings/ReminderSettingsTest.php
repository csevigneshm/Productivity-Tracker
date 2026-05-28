<?php

namespace Tests\Feature\Settings;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReminderSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_reminder_setting_can_be_enabled_via_api(): void
    {
        $user = User::factory()->create([
            'daily_log_reminders_enabled' => false,
        ]);

        $response = $this
            ->actingAs($user)
            ->patchJson('/api/reminder-settings', [
                'daily_log_reminders_enabled' => true,
            ]);

        $response
            ->assertOk()
            ->assertJson(['daily_log_reminders_enabled' => true]);

        $this->assertTrue($user->fresh()->daily_log_reminders_enabled);
    }

    public function test_reminder_setting_can_be_disabled_via_api(): void
    {
        $user = User::factory()->create([
            'daily_log_reminders_enabled' => true,
        ]);

        $response = $this
            ->actingAs($user)
            ->patchJson('/api/reminder-settings', [
                'daily_log_reminders_enabled' => false,
            ]);

        $response
            ->assertOk()
            ->assertJson(['daily_log_reminders_enabled' => false]);

        $this->assertFalse($user->fresh()->daily_log_reminders_enabled);
    }

    public function test_disabling_reminders_deletes_push_subscriptions(): void
    {
        $user = User::factory()->create([
            'daily_log_reminders_enabled' => true,
        ]);

        $user->updatePushSubscription(
            'https://example.com/push/abc123',
            'test-public-key',
            'test-auth-token',
            'aes128gcm',
        );

        $this
            ->actingAs($user)
            ->patchJson('/api/reminder-settings', [
                'daily_log_reminders_enabled' => false,
            ])
            ->assertOk();

        $this->assertDatabaseMissing('push_subscriptions', [
            'endpoint' => 'https://example.com/push/abc123',
        ]);
    }

}
