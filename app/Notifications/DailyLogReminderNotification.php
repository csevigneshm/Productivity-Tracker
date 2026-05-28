<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class DailyLogReminderNotification extends Notification
{
    public function __construct(private bool $test = false) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return [WebPushChannel::class];
    }

    public function toWebPush(object $notifiable, Notification $notification): WebPushMessage
    {
        return (new WebPushMessage)
            ->title($this->test ? 'Test reminder' : 'Daily log reminder')
            ->body($this->test
                ? 'This is a test push. Your reminders are working!'
                : "You haven't updated today's productivity log yet.")
            ->tag($this->test ? 'daily-log-reminder-test' : 'daily-log-reminder')
            ->data(['url' => url('/dashboard')])
            ->options(['TTL' => 3600, 'urgency' => 'high']);
    }
}
