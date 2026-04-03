<?php

namespace Database\Factories;

use App\Models\Training;
use Illuminate\Database\Eloquent\Factories\Factory;

class ContextFactory extends Factory
{
    public function definition(): array
    {
        $contexts = [
            ['title' => 'Brief client', 'type' => 'client_brief', 'client' => fake()->company()],
            ['title' => 'CR réunion cadrage', 'type' => 'meeting_notes', 'client' => fake()->company()],
            ['title' => 'Spécificités techniques', 'type' => 'custom', 'client' => null],
        ];

        $ctx = fake()->randomElement($contexts);

        return [
            'training_id' => Training::factory(),
            'title' => $ctx['title'],
            'client_name' => $ctx['client'],
            'type' => $ctx['type'],
            'content' => "## Contexte\n\n" . fake()->paragraph(3) . "\n\n## Points clés\n\n- " . fake()->sentence() . "\n- " . fake()->sentence() . "\n- " . fake()->sentence(),
        ];
    }
}
