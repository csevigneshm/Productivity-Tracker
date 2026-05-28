<?php

namespace Tests\Feature\Reminders;

use App\Models\DailyLog;
use App\Models\DailyLogReminderSent;
use App\Models\User;
use App\Notifications\DailyLogReminderNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class SendDailyLogRemindersTest extends TestCase
{
    use RefreshDatabase;

    public function test_command_sends_reminder_when_log_missing_and_reminders_enabled(): void
    {
        Notification::fake();

        $this->travelTo(now()->setTime(20, 0));

        $user = User::factory()->create([
            'daily_log_reminders_enabled' => true,
        ]);

        $user->updatePushSubscription(
            'https://example.com/push/abc123',
            'test-public-key',
            'test-auth-token',
            'aes128gcm',
        );

        $this->artisan('reminders:daily-log')->assertSuccessful();

        Notification::assertSentTo($user, DailyLogReminderNotification::class);

        $this->assertTrue(
            DailyLogReminderSent::alreadySent($user->id, now()->toDateString(), '20')
        );
    }

    public function test_command_skips_user_when_todays_log_exists(): void
    {
        Notification::fake();

        $this->travelTo(now()->setTime(20, 0));

        $user = User::factory()->create([
            'daily_log_reminders_enabled' => true,
        ]);

        $user->updatePushSubscription(
            'https://example.com/push/abc123',
            'test-public-key',
            'test-auth-token',
            'aes128gcm',
        );

        DailyLog::saveTodayLog($user->id, [
            'study_hours' => 0,
            'interview_calls' => 0,
            'linkedin_applications' => 0,
            'naukri_applications' => 0,
            'indeed_applications' => 0,
        ]);

        $this->artisan('reminders:daily-log')->assertSuccessful();

        Notification::assertNothingSent();
    }

    public function test_command_skips_user_when_reminders_disabled(): void
    {
        Notification::fake();

        $this->travelTo(now()->setTime(20, 0));

        $user = User::factory()->create([
            'daily_log_reminders_enabled' => false,
        ]);

        $user->updatePushSubscription(
            'https://example.com/push/abc123',
            'test-public-key',
            'test-auth-token',
            'aes128gcm',
        );

        $this->artisan('reminders:daily-log')->assertSuccessful();

        Notification::assertNothingSent();
    }

    public function test_command_does_not_send_outside_reminder_window(): void
    {
        Notification::fake();

        $this->travelTo(now()->setTime(15, 0));

        $user = User::factory()->create([
            'daily_log_reminders_enabled' => true,
        ]);

        $user->updatePushSubscription(
            'https://example.com/push/abc123',
            'test-public-key',
            'test-auth-token',
            'aes128gcm',
        );

        $this->artisan('reminders:daily-log')->assertSuccessful();

        Notification::assertNothingSent();
    }
}
