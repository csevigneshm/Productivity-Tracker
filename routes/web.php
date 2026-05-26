<?php

use App\Http\Controllers\TestController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::inertia('applications', 'applications/index')->name('applications');
    Route::get('applications/{id}', fn (int $id) => Inertia::render('applications/show', ['id' => $id]))->name('applications.show');
});

Route::get('/test/{id}', [TestController::class, 'index'])->where('id', '[0-9]+');

Route::get('/test/somethingnew', [TestController::class, 'new'])->name('new');
Route::get('/test/old', [TestController::class, 'old']);

require __DIR__.'/settings.php';
