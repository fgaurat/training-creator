<?php

namespace App\Http\Controllers;

use App\Models\Training;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TrainingController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('trainings/index', [
            'trainings' => Training::withCount('modules', 'contexts')
                ->orderByDesc('updated_at')
                ->get(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('trainings/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'duration' => 'nullable|string|max:255',
            'level' => 'nullable|string|max:255',
            'source_plan' => 'nullable|string',
        ]);

        $training = Training::create($validated);

        return to_route('trainings.show', $training);
    }

    public function show(Request $request, Training $training): Response
    {
        $training->load([
            'modules.exercises',
            'modules.quizzes.options',
            'contexts',
            'exports',
            'parent',
        ]);

        return Inertia::render('trainings/show', [
            'training' => $training,
            'googleConnected' => (bool) $request->user()->google_token,
        ]);
    }

    public function edit(Training $training): Response
    {
        return Inertia::render('trainings/edit', [
            'training' => $training,
        ]);
    }

    public function update(Request $request, Training $training): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'duration' => 'nullable|string|max:255',
            'level' => 'nullable|string|max:255',
            'status' => 'nullable|string|max:255',
            'source_plan' => 'nullable|string',
        ]);

        $training->update($validated);

        return to_route('trainings.show', $training);
    }

    public function destroy(Training $training): RedirectResponse
    {
        $training->delete();

        return to_route('trainings.index');
    }

    public function duplicate(Training $training): RedirectResponse
    {
        $clone = $training->clone();

        return to_route('trainings.show', $clone);
    }
}
