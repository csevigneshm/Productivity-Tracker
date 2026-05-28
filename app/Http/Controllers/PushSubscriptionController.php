<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PushSubscriptionController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'endpoint' => ['required', 'url', 'max:500'],
            'keys.p256dh' => ['required', 'string'],
            'keys.auth' => ['required', 'string'],
            'contentEncoding' => ['nullable', 'string', 'max:50'],
        ]);

        $contentEncoding = $validated['contentEncoding']
            ?? (str_contains($validated['endpoint'], 'mozilla.com') ? 'aesgcm' : null);

        $user = $request->user();

        // Keep one subscription — the current browser (drop stale Firefox/Chrome entries).
        $user->pushSubscriptions()->delete();

        $user->updatePushSubscription(
            $validated['endpoint'],
            $validated['keys']['p256dh'],
            $validated['keys']['auth'],
            $contentEncoding,
        );

        return response()->json(['message' => 'Push subscription saved']);
    }

    public function destroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'endpoint' => ['required', 'url', 'max:500'],
        ]);

        $request->user()->deletePushSubscription($validated['endpoint']);

        return response()->json(['message' => 'Push subscription deleted']);
    }
}
