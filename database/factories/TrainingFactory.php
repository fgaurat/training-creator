<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class TrainingFactory extends Factory
{
    public function definition(): array
    {
        $trainings = [
            ['title' => 'Introduction à Python', 'level' => 'Débutant', 'duration' => '3 jours'],
            ['title' => 'React Avancé', 'level' => 'Avancé', 'duration' => '2 jours'],
            ['title' => 'DevOps & CI/CD', 'level' => 'Intermédiaire', 'duration' => '4 jours'],
            ['title' => 'Laravel pour les pros', 'level' => 'Intermédiaire', 'duration' => '3 jours'],
            ['title' => 'Docker & Kubernetes', 'level' => 'Intermédiaire', 'duration' => '3 jours'],
            ['title' => 'Introduction au Machine Learning', 'level' => 'Débutant', 'duration' => '5 jours'],
        ];

        $training = fake()->randomElement($trainings);

        return [
            'title' => $training['title'],
            'description' => fake()->paragraph(),
            'duration' => $training['duration'],
            'level' => $training['level'],
            'status' => fake()->randomElement(['draft', 'in_progress', 'published']),
            'source_plan' => fake()->optional(0.5)->text(500),
            'parent_id' => null,
        ];
    }

    public function draft(): static
    {
        return $this->state(['status' => 'draft']);
    }

    public function published(): static
    {
        return $this->state(['status' => 'published']);
    }
}
