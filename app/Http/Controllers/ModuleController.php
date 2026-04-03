<?php

namespace App\Http\Controllers;

use App\Models\Module;
use App\Models\Training;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ModuleController extends Controller
{
    public function create(Training $training): Response
    {
        return Inertia::render('modules/create', [
            'training' => $training,
        ]);
    }

    public function store(Request $request, Training $training): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'order' => 'nullable|integer',
            'duration' => 'nullable|string|max:255',
            'objectives' => 'nullable|string',
            'content' => 'nullable|string',
        ]);

        $validated['order'] ??= $training->modules()->count();

        $training->modules()->create($validated);

        return to_route('trainings.show', $training);
    }

    public function edit(Training $training, Module $module): Response
    {
        $module->load(['exercises', 'quizzes.options']);

        return Inertia::render('modules/edit', [
            'training' => $training,
            'module' => $module,
        ]);
    }

    public function update(Request $request, Training $training, Module $module): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'order' => 'nullable|integer',
            'duration' => 'nullable|string|max:255',
            'objectives' => 'nullable|string',
            'content' => 'nullable|string',
        ]);

        $module->update($validated);

        return to_route('trainings.show', $training);
    }

    public function destroy(Training $training, Module $module): RedirectResponse
    {
        $module->delete();

        return to_route('trainings.show', $training);
    }
}
