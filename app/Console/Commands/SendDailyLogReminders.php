<?php

namespace App\Console\Commands;

use App\Models\DailyLog;
use App\Models\DailyLogReminderSent;
use App\Models\User;
use App\Notifications\DailyLogReminderNotification;
use Illuminate\Console\Command;

class SendDailyLogReminders extends Command
{
    protected $signature = 'reminders:daily-log';

    protected $description = 'Send web push reminders when today\'s daily log has not been saved';

    /**
     * @var array<int, string>
     */
    private const REMINDER_SLOTS = ['18', '19', '20', '21', '22', '23', '23:59'];

    public function handle(): int
    {
        $now = now();
        $slot = $now->format('H:i') === '23:59' ? '23:59' : $now->format('H');

        if (! in_array($slot, self::REMINDER_SLOTS, true)) {
            return self::SUCCESS;
        }

        $today = $now->toDateString();

        User::query()
            ->where('daily_log_reminders_enabled', true)
            ->whereHas('pushSubscriptions')
            ->eachById(function (User $user) use ($today, $slot): void {
                if (DailyLog::getTodayLog($user->id)) {
                    return;
                }

                if (DailyLogReminderSent::alreadySent($user->id, $today, $slot)) {
                    return;
                }

                $user->notify(new DailyLogReminderNotification);

                DailyLogReminderSent::markSent($user->id, $today, $slot);
            });

        $this->info("Processed daily log reminders for slot {$slot}.");

        return self::SUCCESS;
    }
}
