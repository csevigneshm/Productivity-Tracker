<?php

namespace App\Http\Controllers;

use App\Models\DailyLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DailyLogController extends Controller
{
    public function getAllDailyLogs(): JsonResponse
    {
        return response()->json(DailyLog::getAllDailyLogs(auth()->id()));
    }

    public function getTodayLog(): JsonResponse
    {
        return response()->json(DailyLog::getTodayLog(auth()->id()));
    }

    public function getLogByDate(string $date): JsonResponse
    {
        return response()->json(DailyLog::getLogByDate(auth()->id(), $date));
    }

    public function getLogsByDateRange(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from' => 'required|date',
            'to'   => 'required|date|after_or_equal:from',
        ]);

        return response()->json(DailyLog::getLogsByDateRange(auth()->id(), $validated['from'], $validated['to']));
    }

    public function saveTodayLog(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'study_hours'           => 'sometimes|numeric|min:0|max:24',
            'interview_calls'       => 'sometimes|integer|min:0',
            'linkedin_applications' => 'sometimes|integer|min:0',
            'naukri_applications'   => 'sometimes|integer|min:0',
            'indeed_applications'   => 'sometimes|integer|min:0',
        ]);

        return response()->json(DailyLog::saveTodayLog(auth()->id(), $validated));
    }

    public function saveLogByDate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date'                  => 'required|date|before_or_equal:today',
            'study_hours'           => 'sometimes|numeric|min:0|max:24',
            'interview_calls'       => 'sometimes|integer|min:0',
            'linkedin_applications' => 'sometimes|integer|min:0',
            'naukri_applications'   => 'sometimes|integer|min:0',
            'indeed_applications'   => 'sometimes|integer|min:0',
            'linkedin_updated'      => 'sometimes|boolean',
            'naukri_updated'        => 'sometimes|boolean',
            'github_updated'        => 'sometimes|boolean',
            'indeed_updated'        => 'sometimes|boolean',
        ]);

        $date = $validated['date'];
        unset($validated['date']);

        return response()->json(DailyLog::saveLogByDate(auth()->id(), $date, $validated));
    }

    public function saveProfileChecks(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'linkedin_updated' => 'sometimes|boolean',
            'naukri_updated'   => 'sometimes|boolean',
            'github_updated'   => 'sometimes|boolean',
            'indeed_updated'   => 'sometimes|boolean',
        ]);

        return response()->json(DailyLog::saveProfileChecks(auth()->id(), $validated));
    }

    public function deleteDailyLog(int $id): JsonResponse
    {
        DailyLog::deleteDailyLog($id);

        return response()->json(['message' => 'Daily log deleted']);
    }

    public function deleteAllDailyLogs(): JsonResponse
    {
        DailyLog::deleteAllDailyLogs(auth()->id());

        return response()->json(['message' => 'All daily logs deleted']);
    }
}
