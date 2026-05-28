<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyLog extends Model
{
    protected $fillable = [
        'user_id', 'date', 'study_hours', 'interview_calls',
        'linkedin_applications', 'naukri_applications', 'indeed_applications',
        'linkedin_updated', 'naukri_updated', 'github_updated', 'indeed_updated',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
        'linkedin_updated' => 'boolean',
        'naukri_updated' => 'boolean',
        'github_updated' => 'boolean',
        'indeed_updated' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function getAllDailyLogs(int $userId)
    {
        return static::where('user_id', $userId)->orderByDesc('date')->get();
    }

    public static function getTodayLog(int $userId)
    {
        return static::where('user_id', $userId)->where('date', today())->first();
    }

    public static function getLogByDate(int $userId, string $date)
    {
        return static::where('user_id', $userId)->where('date', $date)->first();
    }

    public static function getLogsByDateRange(int $userId, string $from, string $to)
    {
        return static::where('user_id', $userId)->whereBetween('date', [$from, $to])->orderByDesc('date')->get();
    }

    public static function saveTodayLog(int $userId, array $data)
    {
        return static::updateOrCreate(['user_id' => $userId, 'date' => today()], $data);
    }

    public static function saveLogByDate(int $userId, string $date, array $data)
    {
        return static::updateOrCreate(['user_id' => $userId, 'date' => $date], $data);
    }

    public static function saveProfileChecks(int $userId, array $checks)
    {
        return static::updateOrCreate(
            ['user_id' => $userId, 'date' => today()],
            array_intersect_key($checks, array_flip(['linkedin_updated', 'naukri_updated', 'github_updated', 'indeed_updated']))
        );
    }

    public static function deleteDailyLog(int $id)
    {
        return static::findOrFail($id)->delete();
    }

    public static function deleteAllDailyLogs(int $userId)
    {
        return static::where('user_id', $userId)->delete();
    }
}
