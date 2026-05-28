<?php

namespace App\Http\Controllers;

use App\Notifications\DailyLogReminderNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use NotificationChannels\WebPush\Events\NotificationFailed;

class ReminderSettingsController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'daily_log_reminders_enabled' => ['required', 'boolean'],
        ]);

        $enabled = $request->boolean('daily_log_reminders_enabled');

        $user = $request->user();
        $user->forceFill(['daily_log_reminders_enabled' => $enabled])->save();

        if (! $enabled) {
            $user->pushSubscriptions()->delete();
        }

        return response()->json([
            'daily_log_reminders_enabled' => (bool) $user->fresh()->daily_log_reminders_enabled,
        ]);
    }

    public function test(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->pushSubscriptions()->doesntExist()) {
            return response()->json([
                'message' => 'Turn reminders on first so this browser can receive push notifications.',
            ], 422);
        }

        $failureReason = null;

        Event::listen(NotificationFailed::class, function (NotificationFailed $event) use (&$failureReason): void {
            $failureReason = $event->report->getReason();
        });

        $user->notify(new DailyLogReminderNotification(test: true));

        if ($failureReason) {
            $expired = str_contains($failureReason, '410')
                || str_contains($failureReason, 'Gone')
                || str_contains($failureReason, 'No such subscription');

            if ($expired) {
                $user->pushSubscriptions()->delete();
            }

            $message = $expired
                ? 'Old browser subscription expired. Turn reminders off, then on again in Chrome.'
                : 'Push failed: '.$failureReason;

            return response()->json([
                'message' => $message,
                'delivered' => false,
                'expired' => $expired,
            ], 422);
        }

        return response()->json([
            'message' => 'Test reminder sent. Check your browser notifications.',
            'delivered' => true,
        ]);
    }
}
