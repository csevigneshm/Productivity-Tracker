<?php

use App\Http\Controllers\TestController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }

    return redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', fn () => Inertia::render('dashboard', [
        'remindersEnabled' => (bool) auth()->user()->daily_log_reminders_enabled,
        'vapidPublicKey' => config('webpush.vapid.public_key'),
    ]))->name('dashboard');
    Route::inertia('applications', 'applications/index')->name('applications');
    Route::get('applications/{id}', fn (int $id) => Inertia::render('applications/show', ['id' => $id]))->name('applications.show');
});

Route::get('/test/{id}', [TestController::class, 'index'])->where('id', '[0-9]+');

Route::get('/test/somethingnew', [TestController::class, 'new'])->name('new');
Route::get('/test/old', [TestController::class, 'old']);

require __DIR__.'/settings.php';
