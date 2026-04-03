<?php

namespace Database\Factories;

use App\Models\Module;
use Illuminate\Database\Eloquent\Factories\Factory;

class ExerciseFactory extends Factory
{
    public function definition(): array
    {
        return [
            'module_id' => Module::factory(),
            'title' => 'Exercice : ' . fake()->sentence(4),
            'type' => fake()->randomElement(['pratique', 'code', 'réflexion']),
            'instructions' => "## Consigne\n\n" . fake()->paragraph(2) . "\n\n## Étapes\n\n1. " . fake()->sentence() . "\n2. " . fake()->sentence() . "\n3. " . fake()->sentence(),
            'solution' => "## Solution\n\n" . fake()->paragraph(2),
            'order' => fake()->numberBetween(0, 5),
        ];
    }
}
