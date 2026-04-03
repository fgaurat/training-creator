<?php

use App\Http\Controllers\AiGenerateController;
use App\Http\Controllers\ContextController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\GoogleAuthController;
use App\Http\Controllers\ModuleController;
use App\Http\Controllers\TrainingController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    // Trainings
    Route::resource('trainings', TrainingController::class);
    Route::post('trainings/{training}/duplicate', [TrainingController::class, 'duplicate'])->name('trainings.duplicate');

    // Modules
    Route::get('trainings/{training}/modules/create', [ModuleController::class, 'create'])->name('modules.create');
    Route::post('trainings/{training}/modules', [ModuleController::class, 'store'])->name('modules.store');
    Route::get('trainings/{training}/modules/{module}/edit', [ModuleController::class, 'edit'])->name('modules.edit');
    Route::put('trainings/{training}/modules/{module}', [ModuleController::class, 'update'])->name('modules.update');
    Route::delete('trainings/{training}/modules/{module}', [ModuleController::class, 'destroy'])->name('modules.destroy');

    // Contexts
    Route::post('trainings/{training}/contexts', [ContextController::class, 'store'])->name('contexts.store');
    Route::put('trainings/{training}/contexts/{context}', [ContextController::class, 'update'])->name('contexts.update');
    Route::delete('trainings/{training}/contexts/{context}', [ContextController::class, 'destroy'])->name('contexts.destroy');

    // AI Generation
    Route::post('trainings/{training}/ai/modules', [AiGenerateController::class, 'generateModules'])->name('ai.modules');
    Route::post('trainings/{training}/modules/{module}/ai/content', [AiGenerateController::class, 'generateContent'])->name('ai.content');
    Route::post('trainings/{training}/modules/{module}/ai/exercises', [AiGenerateController::class, 'generateExercises'])->name('ai.exercises');
    Route::post('trainings/{training}/modules/{module}/ai/quizzes', [AiGenerateController::class, 'generateQuizzes'])->name('ai.quizzes');

    // Google OAuth
    Route::get('auth/google/redirect', [GoogleAuthController::class, 'redirect'])->name('google.redirect');
    Route::get('auth/google/callback', [GoogleAuthController::class, 'callback'])->name('google.callback');

    // Export
    Route::post('trainings/{training}/export/google-slides', [ExportController::class, 'googleSlides'])->name('export.google-slides');
});

require __DIR__.'/settings.php';
