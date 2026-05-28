<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Notifications\DailyLogReminderNotification;
use Illuminate\Console\Command;

class SendTestDailyLogReminder extends Command
{
    protected $signature = 'reminders:test {--user= : User ID to send the test reminder to}';

    protected $description = 'Send a test daily log reminder push notification immediately';

    public function handle(): int
    {
        $userId = $this->option('user');

        $users = User::query()
            ->when($userId, fn ($query) => $query->whereKey($userId))
            ->whereHas('pushSubscriptions')
            ->get();

        if ($users->isEmpty()) {
            $this->error('No users with push subscriptions found.');

            return self::FAILURE;
        }

        foreach ($users as $user) {
            $user->notify(new DailyLogReminderNotification(test: true));
            $this->info("Test reminder sent to {$user->email}.");
        }

        return self::SUCCESS;
    }
}
