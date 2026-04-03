<?php

namespace App\Http\Controllers;

use App\Models\Module;
use App\Models\Training;
use App\Services\AiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiGenerateController extends Controller
{
    public function __construct(
        protected AiService $ai,
    ) {
        set_time_limit(300);
    }

    public function generateModules(Request $request, Training $training): JsonResponse
    {
        $context = $training->contexts->pluck('content')->filter()->implode("\n\n---\n\n");

        $systemPrompt = "Tu es un concepteur pédagogique expert. Tu structures des formations en modules clairs et progressifs. Réponds en JSON uniquement.";

        $userPrompt = "Voici le plan de cours d'une formation :\n\n";
        $userPrompt .= "Titre : {$training->title}\n";
        $userPrompt .= "Description : {$training->description}\n";
        $userPrompt .= "Durée : {$training->duration}\n";
        $userPrompt .= "Niveau : {$training->level}\n\n";

        if ($training->source_plan) {
            $userPrompt .= "Plan de cours fourni :\n{$training->source_plan}\n\n";
        }

        if ($context) {
            $userPrompt .= "Contexte client :\n{$context}\n\n";
        }

        $userPrompt .= "Découpe cette formation en modules. Pour chaque module, donne : title, duration, objectives (texte). Retourne un tableau JSON de modules.";

        try {
            $result = $this->ai->generate($systemPrompt, $userPrompt);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Erreur appel IA : ' . $e->getMessage()], 500);
        }

        // Extract JSON from the response
        $json = $result;
        if (preg_match('/\[.*\]/s', $result, $matches)) {
            $json = $matches[0];
        }

        $modules = json_decode($json, true);

        if (!is_array($modules)) {
            return response()->json(['error' => 'Impossible de parser la réponse IA', 'raw' => $result], 422);
        }

        $created = [];
        foreach ($modules as $i => $moduleData) {
            $created[] = $training->modules()->create([
                'title' => $moduleData['title'] ?? "Module " . ($i + 1),
                'order' => $i,
                'duration' => $moduleData['duration'] ?? null,
                'objectives' => $moduleData['objectives'] ?? null,
            ]);
        }

        return response()->json(['modules' => $created]);
    }

    public function generateContent(Request $request, Training $training, Module $module): JsonResponse
    {
        $context = $training->contexts->pluck('content')->filter()->implode("\n\n---\n\n");

        $systemPrompt = <<<'PROMPT'
Tu es un formateur expert qui rédige des supports de cours au format Marp.

RÈGLES STRICTES :
- Retourne UNIQUEMENT le contenu Marp brut, sans aucun texte d'introduction, explication ou commentaire autour.
- Pas de "voici le contenu", pas de "```markdown", pas de conseils d'utilisation.
- Le frontmatter doit être minimal : ---\nmarp: true\npaginate: true\n--- et RIEN d'autre. Pas de style CSS, pas de theme custom, pas de footer, pas de backgroundColor.
- Chaque slide doit tenir sur un écran : maximum 15 lignes de contenu par slide. Si le contenu est trop long, découpe en plusieurs slides.
- Si une slide contient des éléments comparables (ex: avantages/inconvénients, avant/après, plusieurs concepts liés), utilise un layout multi-colonnes avec la syntaxe HTML : <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1em;"><div>colonne 1</div><div>colonne 2</div></div>. Tu peux utiliser 2 ou 3 colonnes selon la pertinence. N'en abuse pas, réserve-le aux cas où c'est vraiment utile.
- Utilise --- comme séparateur entre les slides.
- Inclus des exemples concrets et pratiques.
- Utilise le markdown standard : titres, listes, tableaux, blocs de code.
PROMPT;

        $userPrompt = "Formation : {$training->title}\n";
        $userPrompt .= "Module : {$module->title}\n";
        $userPrompt .= "Objectifs : {$module->objectives}\n";
        $userPrompt .= "Durée : {$module->duration}\n\n";

        if ($context) {
            $userPrompt .= "Contexte client :\n{$context}\n\n";
        }

        $userPrompt .= "Rédige le support de cours complet pour ce module au format Marp.";

        try {
            $result = $this->ai->generate($systemPrompt, $userPrompt);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Erreur appel IA : ' . $e->getMessage()], 500);
        }

        $result = $this->cleanMarpContent($result);

        $module->update(['content' => $result]);

        return response()->json(['content' => $result]);
    }

    protected function cleanMarpContent(string $content): string
    {
        // Remove wrapping ```markdown ... ``` blocks
        $content = preg_replace('/^```(?:markdown|marp)?\s*\n/i', '', $content);
        $content = preg_replace('/\n```\s*$/', '', $content);

        // Remove text before the first --- frontmatter
        if (preg_match('/^---\s*\nmarp:\s*true/m', $content, $matches, PREG_OFFSET_CAPTURE)) {
            $content = substr($content, $matches[0][1]);
        }

        // Remove text after the last slide content (trailing explanations)
        // Look for common patterns like "### Pour l'utiliser", "### Structure", "---\n\n###" at end
        $content = preg_replace('/\n---\s*\n+###\s*(Pour l|Structure|Comment|Note).*$/s', '', $content);

        // Strip style blocks from frontmatter
        $content = preg_replace('/^(---\s*\n(?:.*\n)*?)style:\s*\|[\s\S]*?\n(?=[a-z]|\n---)/m', '$1', $content);
        $content = preg_replace('/^(---\s*\n(?:.*\n)*?)style:\s*"[^"]*"\s*\n/m', '$1', $content);

        // Strip theme, backgroundColor, footer, header from frontmatter
        $content = preg_replace('/^(theme|backgroundColor|background|footer|header|class|color):.*\n/m', '', $content);

        return trim($content);
    }

    public function generateExercises(Request $request, Training $training, Module $module): JsonResponse
    {
        $context = $training->contexts->pluck('content')->filter()->implode("\n\n---\n\n");

        $systemPrompt = "Tu es un concepteur pédagogique expert. Tu crées des exercices pratiques et engageants. Réponds en JSON uniquement.";

        $userPrompt = "Formation : {$training->title}\n";
        $userPrompt .= "Module : {$module->title}\n";
        $userPrompt .= "Objectifs : {$module->objectives}\n";
        $userPrompt .= "Contenu du module :\n{$module->content}\n\n";

        if ($context) {
            $userPrompt .= "Contexte client :\n{$context}\n\n";
        }

        $userPrompt .= "Crée 2-3 exercices pour ce module. Pour chaque exercice : title, type (pratique|code|réflexion), instructions (markdown), solution (markdown). Retourne un tableau JSON.";

        try {
            $result = $this->ai->generate($systemPrompt, $userPrompt);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Erreur appel IA : ' . $e->getMessage()], 500);
        }

        $json = $result;
        if (preg_match('/\[.*\]/s', $result, $matches)) {
            $json = $matches[0];
        }

        $exercises = json_decode($json, true);

        if (!is_array($exercises)) {
            return response()->json(['error' => 'Impossible de parser la réponse IA', 'raw' => $result], 422);
        }

        $created = [];
        foreach ($exercises as $i => $data) {
            $created[] = $module->exercises()->create([
                'title' => $data['title'] ?? "Exercice " . ($i + 1),
                'type' => $data['type'] ?? 'pratique',
                'instructions' => $data['instructions'] ?? null,
                'solution' => $data['solution'] ?? null,
                'order' => $i,
            ]);
        }

        return response()->json(['exercises' => $created]);
    }

    public function generateQuizzes(Request $request, Training $training, Module $module): JsonResponse
    {
        $context = $training->contexts->pluck('content')->filter()->implode("\n\n---\n\n");

        $systemPrompt = "Tu es un concepteur pédagogique expert. Tu crées des quiz pour évaluer la compréhension. Réponds en JSON uniquement.";

        $userPrompt = "Formation : {$training->title}\n";
        $userPrompt .= "Module : {$module->title}\n";
        $userPrompt .= "Objectifs : {$module->objectives}\n";
        $userPrompt .= "Contenu du module :\n{$module->content}\n\n";

        if ($context) {
            $userPrompt .= "Contexte client :\n{$context}\n\n";
        }

        $userPrompt .= "Crée 3-5 questions de quiz. Pour chaque question : question, type (qcm|vrai_faux), options (tableau avec label et is_correct boolean). Retourne un tableau JSON.";

        try {
            $result = $this->ai->generate($systemPrompt, $userPrompt);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Erreur appel IA : ' . $e->getMessage()], 500);
        }

        $json = $result;
        if (preg_match('/\[.*\]/s', $result, $matches)) {
            $json = $matches[0];
        }

        $quizzes = json_decode($json, true);

        if (!is_array($quizzes)) {
            return response()->json(['error' => 'Impossible de parser la réponse IA', 'raw' => $result], 422);
        }

        $created = [];
        foreach ($quizzes as $i => $data) {
            $quiz = $module->quizzes()->create([
                'question' => $data['question'] ?? "Question " . ($i + 1),
                'type' => $data['type'] ?? 'qcm',
                'order' => $i,
            ]);

            if (isset($data['options']) && is_array($data['options'])) {
                foreach ($data['options'] as $j => $optionData) {
                    $quiz->options()->create([
                        'label' => $optionData['label'] ?? '',
                        'is_correct' => $optionData['is_correct'] ?? false,
                        'order' => $j,
                    ]);
                }
            }

            $quiz->load('options');
            $created[] = $quiz;
        }

        return response()->json(['quizzes' => $created]);
    }
}
