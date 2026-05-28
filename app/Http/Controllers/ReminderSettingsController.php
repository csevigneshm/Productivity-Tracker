<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
}
