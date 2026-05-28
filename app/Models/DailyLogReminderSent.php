<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyLogReminderSent extends Model
{
    protected $table = 'daily_log_reminder_sent';

    protected $fillable = [
        'user_id',
        'date',
        'slot',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
            'sent_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function alreadySent(int $userId, string $date, string $slot): bool
    {
        return static::query()
            ->where('user_id', $userId)
            ->where('date', $date)
            ->where('slot', $slot)
            ->exists();
    }

    public static function markSent(int $userId, string $date, string $slot): self
    {
        return static::query()->updateOrCreate(
            [
                'user_id' => $userId,
                'date' => $date,
                'slot' => $slot,
            ],
            [
                'sent_at' => now(),
            ]
        );
    }
}
