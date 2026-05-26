<?php

namespace App\Http\Controllers;

use App\Models\ApplicationComment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApplicationCommentController extends Controller
{
    public function getCommentsForApplication(int $jobApplicationId): JsonResponse
    {
        return response()->json(ApplicationComment::getCommentsForApplication($jobApplicationId));
    }

    public function addComment(Request $request, int $jobApplicationId): JsonResponse
    {
        $validated = $request->validate([
            'comment' => 'required|string',
        ]);

        return response()->json(ApplicationComment::addComment($jobApplicationId, $validated['comment']), 201);
    }

    public function editComment(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'comment' => 'required|string',
        ]);

        return response()->json(ApplicationComment::editComment($id, $validated['comment']));
    }

    public function deleteComment(int $id): JsonResponse
    {
        ApplicationComment::deleteComment($id);

        return response()->json(['message' => 'Comment deleted']);
    }

    public function deleteAllComments(int $jobApplicationId): JsonResponse
    {
        ApplicationComment::deleteAllComments($jobApplicationId);

        return response()->json(['message' => 'All comments deleted']);
    }
}
