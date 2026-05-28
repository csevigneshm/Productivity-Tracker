<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class DailyLogReminderNotification extends Notification
{
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
            ->title('Daily log reminder')
            ->body("You haven't updated today's productivity log yet.")
            ->tag('daily-log-reminder')
            ->data(['url' => url('/dashboard?log=1')])
            ->options(['TTL' => 3600, 'urgency' => 'high']);
    }
}
