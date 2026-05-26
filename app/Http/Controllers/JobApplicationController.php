<?php

namespace App\Http\Controllers;

use App\Models\JobApplication;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JobApplicationController extends Controller
{
    public function getMyApplications(): JsonResponse
    {
        return response()->json(JobApplication::getMyApplications(auth()->id()));
    }

    public function getApplicationById(int $id): JsonResponse
    {
        return response()->json(JobApplication::getApplicationById($id));
    }

    public function getApplicationsByStatus(string $status): JsonResponse
    {
        return response()->json(JobApplication::getApplicationsByStatus(auth()->id(), $status));
    }

    public function getApplicationsBySource(string $source): JsonResponse
    {
        return response()->json(JobApplication::getApplicationsBySource(auth()->id(), $source));
    }

    public function getApplicationsByType(string $type): JsonResponse
    {
        return response()->json(JobApplication::getApplicationsByType(auth()->id(), $type));
    }

    public function getApplicationCountBySource(): JsonResponse
    {
        return response()->json(JobApplication::getApplicationCountBySource(auth()->id()));
    }

    public function addNewApplication(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'role'         => 'required|string|max:255',
            'type'         => 'required|in:government,corporate,startup',
            'source'       => 'required|in:linkedin,naukri,indeed,referral,other',
            'applied_date' => 'required|date',
            'status'       => 'required|in:applied,shortlisted,interview,offer,rejected,withdrawn,ghosted',
        ]);

        $validated['user_id'] = auth()->id();

        return response()->json(JobApplication::addNewApplication($validated), 201);
    }

    public function updateApplication(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'company_name' => 'sometimes|string|max:255',
            'role'         => 'sometimes|string|max:255',
            'type'         => 'sometimes|in:government,corporate,startup',
            'source'       => 'sometimes|in:linkedin,naukri,indeed,referral,other',
            'applied_date' => 'sometimes|date',
            'status'       => 'sometimes|in:applied,shortlisted,interview,offer,rejected,withdrawn,ghosted',
        ]);

        return response()->json(JobApplication::updateApplication($id, $validated));
    }

    public function updateApplicationStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:applied,shortlisted,interview,offer,rejected,withdrawn,ghosted',
        ]);

        return response()->json(JobApplication::updateApplicationStatus($id, $validated['status']));
    }

    public function updateApplicationSource(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'source' => 'required|in:linkedin,naukri,indeed,referral,careers_page,other',
        ]);

        return response()->json(JobApplication::updateApplication($id, ['source' => $validated['source']]));
    }

    public function deleteApplication(int $id): JsonResponse
    {
        JobApplication::deleteApplication($id);

        return response()->json(['message' => 'Application deleted']);
    }

    public function deleteAllApplications(): JsonResponse
    {
        JobApplication::deleteAllApplications(auth()->id());

        return response()->json(['message' => 'All applications deleted']);
    }
}
