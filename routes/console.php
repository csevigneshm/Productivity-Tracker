<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('reminders:daily-log')
    ->hourly()
    ->timezone('Asia/Kolkata')
    ->between('18:00', '23:00');

Schedule::command('reminders:daily-log')
    ->dailyAt('23:59')
    ->timezone('Asia/Kolkata');
