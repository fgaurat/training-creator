<?php

namespace App\Http\Controllers;

use App\Models\Context;
use App\Models\Training;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ContextController extends Controller
{
    public function store(Request $request, Training $training): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'client_name' => 'nullable|string|max:255',
            'type' => 'nullable|string|max:255',
            'content' => 'nullable|string',
        ]);

        $training->contexts()->create($validated);

        return to_route('trainings.show', $training);
    }

    public function update(Request $request, Training $training, Context $context): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'client_name' => 'nullable|string|max:255',
            'type' => 'nullable|string|max:255',
            'content' => 'nullable|string',
        ]);

        $context->update($validated);

        return to_route('trainings.show', $training);
    }

    public function destroy(Training $training, Context $context): RedirectResponse
    {
        $context->delete();

        return to_route('trainings.show', $training);
    }
}
