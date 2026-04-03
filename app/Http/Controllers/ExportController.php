<?php

namespace App\Http\Controllers;

use App\Models\Training;
use App\Services\GoogleSlidesService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExportController extends Controller
{
    public function __construct()
    {
        set_time_limit(300);
    }

    public function googleSlides(Request $request, Training $training): JsonResponse
    {
        $user = $request->user();

        if (!$user->google_token) {
            return response()->json(['error' => 'Google non connecté', 'redirect' => route('google.redirect')], 401);
        }

        $training->load('modules');

        // Build full Marp markdown from all modules
        $markdown = "---\nmarp: true\npaginate: true\n---\n\n";
        $markdown .= "# {$training->title}\n\n";

        if ($training->description) {
            $markdown .= "{$training->description}\n\n";
        }

        if ($training->duration || $training->level) {
            $parts = array_filter([
                $training->duration ? "**Durée** : {$training->duration}" : null,
                $training->level ? "**Niveau** : {$training->level}" : null,
            ]);
            $markdown .= implode(' | ', $parts) . "\n\n";
        }

        foreach ($training->modules as $module) {
            $markdown .= "---\n\n";
            $markdown .= "# {$module->title}\n\n";

            if ($module->objectives) {
                $markdown .= "**Objectifs** : {$module->objectives}\n\n";
            }

            if ($module->content) {
                // Strip any existing marp frontmatter from module content
                $content = preg_replace('/^---\s*\n.*?---\s*\n/s', '', $module->content);
                $markdown .= $content . "\n\n";
            }
        }

        try {
            $slidesService = new GoogleSlidesService();
            $slidesService->authenticateAs($user);

            $slides = $slidesService->parseMarpToSlides($markdown);

            $title = $training->title . ' - Support de cours';
            $result = $slidesService->createPresentation($title, $slides);

            // Save export record
            $training->exports()->create([
                'type' => 'google_slides',
                'external_url' => $result['url'],
                'generated_at' => now(),
            ]);

            return response()->json([
                'url' => $result['url'],
                'file_id' => $result['id'],
                'name' => $title,
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Export échoué : ' . $e->getMessage()], 500);
        }
    }
}
