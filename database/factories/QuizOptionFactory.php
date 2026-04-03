<?php

namespace Database\Factories;

use App\Models\Quiz;
use Illuminate\Database\Eloquent\Factories\Factory;

class QuizOptionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'quiz_id' => Quiz::factory(),
            'label' => fake()->sentence(3),
            'is_correct' => false,
            'order' => fake()->numberBetween(0, 3),
        ];
    }

    public function correct(): static
    {
        return $this->state(['is_correct' => true]);
    }
}
