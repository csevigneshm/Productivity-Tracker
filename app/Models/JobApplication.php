<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JobApplication extends Model
{
    protected $fillable = [
        'user_id', 'company_name', 'role', 'type', 'source', 'applied_date', 'status',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function applicationComments(): HasMany
    {
        return $this->hasMany(ApplicationComment::class);
    }

    public static function getMyApplications(int $userId)
    {
        return static::where('user_id', $userId)->with('applicationComments')->orderByDesc('applied_date')->get();
    }

    public static function getApplicationById(int $id)
    {
        return static::with('applicationComments')->findOrFail($id);
    }

    public static function getApplicationsByStatus(int $userId, string $status)
    {
        return static::where('user_id', $userId)->where('status', $status)->with('applicationComments')->orderByDesc('applied_date')->get();
    }

    public static function getApplicationsBySource(int $userId, string $source)
    {
        return static::where('user_id', $userId)->where('source', $source)->orderByDesc('applied_date')->get();
    }

    public static function getApplicationsByType(int $userId, string $type)
    {
        return static::where('user_id', $userId)->where('type', $type)->orderByDesc('applied_date')->get();
    }

    public static function getApplicationCountBySource(int $userId)
    {
        return static::where('user_id', $userId)->selectRaw('source, COUNT(*) as total')->groupBy('source')->get();
    }

    public static function addNewApplication(array $data)
    {
        return static::create($data);
    }

    public static function updateApplication(int $id, array $data)
    {
        $application = static::findOrFail($id);
        $application->update($data);

        return $application;
    }

    public static function updateApplicationStatus(int $id, string $status)
    {
        $application = static::findOrFail($id);
        $application->update(['status' => $status]);

        return $application;
    }

    public static function deleteApplication(int $id)
    {
        return static::findOrFail($id)->delete();
    }

    public static function deleteAllApplications(int $userId)
    {
        return static::where('user_id', $userId)->delete();
    }
}
