<?php

use App\Http\Controllers\ApplicationCommentController;
use App\Http\Controllers\DailyLogController;
use App\Http\Controllers\JobApplicationController;
use Illuminate\Support\Facades\Route;

// All routes are protected — user must be logged in (session based via Inertia)
Route::middleware(['auth'])->group(function () {

    // -------------------------------------------------------------------------
    // Job Applications
    // -------------------------------------------------------------------------

    Route::get('applications', [JobApplicationController::class, 'getMyApplications']);
    Route::get('applications/count-by-source', [JobApplicationController::class, 'getApplicationCountBySource']);
    Route::get('applications/status/{status}', [JobApplicationController::class, 'getApplicationsByStatus']);
    Route::get('applications/source/{source}', [JobApplicationController::class, 'getApplicationsBySource']);
    Route::get('applications/type/{type}', [JobApplicationController::class, 'getApplicationsByType']);
    Route::get('applications/{id}', [JobApplicationController::class, 'getApplicationById']);

    Route::post('applications', [JobApplicationController::class, 'addNewApplication']);
    Route::put('applications/{id}', [JobApplicationController::class, 'updateApplication']);
    Route::patch('applications/{id}/status', [JobApplicationController::class, 'updateApplicationStatus']);
    Route::patch('applications/{id}/source', [JobApplicationController::class, 'updateApplicationSource']);

    Route::delete('applications/{id}', [JobApplicationController::class, 'deleteApplication']);
    Route::delete('applications', [JobApplicationController::class, 'deleteAllApplications']);

    // -------------------------------------------------------------------------
    // Application Comments
    // -------------------------------------------------------------------------

    Route::get('applications/{jobApplicationId}/comments', [ApplicationCommentController::class, 'getCommentsForApplication']);
    Route::post('applications/{jobApplicationId}/comments', [ApplicationCommentController::class, 'addComment']);
    Route::put('applications/comments/{id}', [ApplicationCommentController::class, 'editComment']);
    Route::delete('applications/comments/{id}', [ApplicationCommentController::class, 'deleteComment']);
    Route::delete('applications/{jobApplicationId}/comments', [ApplicationCommentController::class, 'deleteAllComments']);

    // -------------------------------------------------------------------------
    // Daily Logs
    // -------------------------------------------------------------------------

    Route::get('daily-logs', [DailyLogController::class, 'getAllDailyLogs']);
    Route::get('daily-logs/today', [DailyLogController::class, 'getTodayLog']);
    Route::get('daily-logs/range', [DailyLogController::class, 'getLogsByDateRange']);
    Route::get('daily-logs/{date}', [DailyLogController::class, 'getLogByDate']);

    Route::post('daily-logs', [DailyLogController::class, 'saveTodayLog']);
    Route::post('daily-logs/save', [DailyLogController::class, 'saveLogByDate']);
    Route::patch('daily-logs/profile-checks', [DailyLogController::class, 'saveProfileChecks']);

    Route::delete('daily-logs/{id}', [DailyLogController::class, 'deleteDailyLog']);
    Route::delete('daily-logs', [DailyLogController::class, 'deleteAllDailyLogs']);
});
