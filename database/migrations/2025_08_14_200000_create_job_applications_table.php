<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('company_name');
            $table->string('role');
            $table->enum('type', ['government', 'corporate', 'startup']);
            $table->enum('source', ['linkedin', 'naukri', 'indeed', 'referral', 'other']);
            $table->date('applied_date');
            $table->enum('status', ['applied', 'shortlisted', 'interview', 'offer', 'rejected', 'withdrawn', 'ghosted'])->default('applied');
            $table->timestamps();

            $table->index('user_id');
            $table->index('applied_date');
            $table->index('status');
            $table->index('source');
        });

        Schema::create('job_application_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_application_id')->constrained()->cascadeOnDelete();
            $table->text('comment');
            $table->timestamps();

            $table->index('job_application_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_application_comments');
        Schema::dropIfExists('job_applications');
    }
};
