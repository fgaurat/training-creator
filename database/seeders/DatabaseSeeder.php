<?php

namespace Database\Seeders;

use App\Models\Context;
use App\Models\Exercise;
use App\Models\Module;
use App\Models\Quiz;
use App\Models\QuizOption;
use App\Models\Training;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        // Formation 1 : complète avec modules, exercices, quizzes et contexte
        $python = Training::factory()->create([
            'title' => 'Introduction à Python',
            'description' => 'Formation complète pour découvrir Python, de la syntaxe de base aux bibliothèques essentielles.',
            'duration' => '3 jours',
            'level' => 'Débutant',
            'status' => 'in_progress',
            'source_plan' => "Jour 1 : Syntaxe de base, types, structures de contrôle\nJour 2 : Fonctions, modules, POO\nJour 3 : Fichiers, exceptions, bibliothèques (pandas, requests)",
        ]);

        Context::factory()->create([
            'training_id' => $python->id,
            'title' => 'Brief client TechCorp',
            'client_name' => 'TechCorp',
            'type' => 'client_brief',
            'content' => "## Contexte\n\nÉquipe de 10 analystes data qui utilisent Excel. Objectif : les faire monter en compétence sur Python pour automatiser leurs rapports.\n\n## Points clés\n\n- Niveau très débutant, pas de background dev\n- Focus sur pandas et l'automatisation\n- Exemples avec des données financières",
        ]);

        $modules = [
            ['title' => 'Syntaxe de base et types', 'order' => 0, 'duration' => 'demi-journée', 'objectives' => 'Comprendre les variables, types et opérateurs Python'],
            ['title' => 'Structures de contrôle', 'order' => 1, 'duration' => 'demi-journée', 'objectives' => 'Maîtriser if/else, boucles for/while, compréhensions de liste'],
            ['title' => 'Fonctions et modules', 'order' => 2, 'duration' => 'demi-journée', 'objectives' => 'Créer des fonctions, importer et utiliser des modules'],
            ['title' => 'Programmation orientée objet', 'order' => 3, 'duration' => 'demi-journée', 'objectives' => 'Comprendre les classes, l\'héritage et l\'encapsulation'],
            ['title' => 'Pandas et automatisation', 'order' => 4, 'duration' => '1 jour', 'objectives' => 'Manipuler des DataFrames, lire/écrire du CSV et Excel'],
        ];

        foreach ($modules as $moduleData) {
            $module = Module::factory()->withMarpContent()->create([
                'training_id' => $python->id,
                ...$moduleData,
            ]);

            // 2 exercices par module
            Exercise::factory()->count(2)->sequence(
                ['order' => 0],
                ['order' => 1],
            )->create(['module_id' => $module->id]);

            // 3 quizzes par module avec options
            $quizzes = Quiz::factory()->count(3)->sequence(
                ['order' => 0],
                ['order' => 1],
                ['order' => 2],
            )->create(['module_id' => $module->id]);

            foreach ($quizzes as $quiz) {
                QuizOption::factory()->correct()->create([
                    'quiz_id' => $quiz->id,
                    'order' => 0,
                ]);
                QuizOption::factory()->count(2)->sequence(
                    ['order' => 1],
                    ['order' => 2],
                )->create(['quiz_id' => $quiz->id]);
            }
        }

        // Formation 2 : brouillon avec juste le plan
        Training::factory()->create([
            'title' => 'React Avancé',
            'description' => 'Patterns avancés React : hooks custom, performance, state management.',
            'duration' => '2 jours',
            'level' => 'Avancé',
            'status' => 'draft',
            'source_plan' => "Jour 1 : Hooks avancés, patterns de composition, context API\nJour 2 : Performance (memo, useMemo, useCallback), state management (Zustand/Jotai), testing",
        ]);

        // Formation 3 : publiée, clone de la formation Python
        $pythonClone = $python->clone();
        $pythonClone->update([
            'title' => 'Python pour DataViz Corp',
            'status' => 'published',
        ]);

        Context::factory()->create([
            'training_id' => $pythonClone->id,
            'title' => 'CR réunion DataViz Corp',
            'client_name' => 'DataViz Corp',
            'type' => 'meeting_notes',
            'content' => "## Compte-rendu réunion du 15/03\n\n- Équipe de data analysts (8 personnes)\n- Utilisent Tableau, veulent passer à Python + matplotlib\n- Besoin fort sur la visualisation de données\n- Exemples avec des données marketing",
        ]);

        // Formation 4 : vide
        Training::factory()->create([
            'title' => 'Docker & Kubernetes',
            'description' => 'Conteneurisation et orchestration pour le déploiement moderne.',
            'duration' => '3 jours',
            'level' => 'Intermédiaire',
            'status' => 'draft',
        ]);
    }
}
