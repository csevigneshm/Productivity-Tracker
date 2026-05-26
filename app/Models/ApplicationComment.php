<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApplicationComment extends Model
{
    protected $table = 'job_application_comments';

    protected $fillable = ['job_application_id', 'comment'];

    public function jobApplication(): BelongsTo
    {
        return $this->belongsTo(JobApplication::class);
    }

    public static function getCommentsForApplication(int $jobApplicationId)
    {
        return static::where('job_application_id', $jobApplicationId)->orderByDesc('created_at')->get();
    }

    public static function getCommentById(int $id)
    {
        return static::findOrFail($id);
    }

    public static function addComment(int $jobApplicationId, string $comment)
    {
        return static::create(['job_application_id' => $jobApplicationId, 'comment' => $comment]);
    }

    public static function editComment(int $id, string $comment)
    {
        $record = static::findOrFail($id);
        $record->update(['comment' => $comment]);
        return $record;
    }

    public static function deleteComment(int $id)
    {
        return static::findOrFail($id)->delete();
    }

    public static function deleteAllComments(int $jobApplicationId)
    {
        return static::where('job_application_id', $jobApplicationId)->delete();
    }
}
