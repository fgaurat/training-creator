<?php

namespace Database\Factories;

use App\Models\Training;
use Illuminate\Database\Eloquent\Factories\Factory;

class ModuleFactory extends Factory
{
    public function definition(): array
    {
        $modules = [
            'Introduction et objectifs',
            'Mise en place de l\'environnement',
            'Les fondamentaux',
            'Concepts avancés',
            'Travaux pratiques',
            'Bonnes pratiques et patterns',
            'Tests et qualité',
            'Déploiement et production',
            'Synthèse et évaluation',
        ];

        return [
            'training_id' => Training::factory(),
            'title' => fake()->randomElement($modules),
            'order' => fake()->numberBetween(0, 10),
            'duration' => fake()->randomElement(['1h', '1h30', '2h', '2h30', '3h', 'demi-journée']),
            'objectives' => fake()->sentence(10),
            'content' => fake()->optional(0.6)->text(1000),
        ];
    }

    public function withMarpContent(): static
    {
        return $this->state(function () {
            return [
                'content' => "---\nmarp: true\ntheme: default\n---\n\n# " . fake()->sentence(4) . "\n\n---\n\n## Objectifs\n\n- " . fake()->sentence() . "\n- " . fake()->sentence() . "\n- " . fake()->sentence() . "\n\n---\n\n## Contenu\n\n" . fake()->paragraph(3) . "\n\n---\n\n## Exemple\n\n```python\nprint('Hello World')\n```\n\n---\n\n## Résumé\n\n" . fake()->paragraph(),
            ];
        });
    }
}
