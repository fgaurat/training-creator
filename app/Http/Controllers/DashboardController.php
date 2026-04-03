<?php

namespace App\Http\Controllers;

use App\Models\Training;
use App\Models\Module;
use App\Models\Exercise;
use App\Models\Quiz;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('dashboard', [
            'stats' => [
                'trainings' => Training::count(),
                'trainings_draft' => Training::where('status', 'draft')->count(),
                'trainings_in_progress' => Training::where('status', 'in_progress')->count(),
                'trainings_published' => Training::where('status', 'published')->count(),
                'modules' => Module::count(),
                'exercises' => Exercise::count(),
                'quizzes' => Quiz::count(),
            ],
            'recentTrainings' => Training::withCount('modules', 'contexts')
                ->orderByDesc('updated_at')
                ->limit(5)
                ->get(),
        ]);
    }
}
