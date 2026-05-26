<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('date');

            // Activity counts
            $table->decimal('study_hours', 4, 2)->default(0.00);
            $table->unsignedTinyInteger('interview_calls')->default(0);

            // Application counts per platform
            $table->unsignedSmallInteger('linkedin_applications')->default(0);
            $table->unsignedSmallInteger('naukri_applications')->default(0);
            $table->unsignedSmallInteger('indeed_applications')->default(0);

            // Daily profile update checklist
            $table->boolean('linkedin_updated')->default(false);
            $table->boolean('naukri_updated')->default(false);
            $table->boolean('github_updated')->default(false);
            $table->boolean('indeed_updated')->default(false);

            $table->timestamps();

            $table->unique(['user_id', 'date']);
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_logs');
    }
};
