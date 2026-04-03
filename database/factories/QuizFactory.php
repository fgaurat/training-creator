<?php

namespace Database\Factories;

use App\Models\Module;
use Illuminate\Database\Eloquent\Factories\Factory;

class QuizFactory extends Factory
{
    public function definition(): array
    {
        $questions = [
            'Quelle est la différence entre une liste et un tuple ?',
            'Quel design pattern est utilisé ici ?',
            'Comment optimiser cette requête ?',
            'Quelle commande permet de lancer les tests ?',
            'Quel est le rôle du middleware dans ce contexte ?',
            'Vrai ou faux : REST est un protocole ?',
            'Quel type de base de données est le plus adapté ?',
        ];

        return [
            'module_id' => Module::factory(),
            'question' => fake()->randomElement($questions),
            'type' => fake()->randomElement(['qcm', 'vrai_faux']),
            'order' => fake()->numberBetween(0, 5),
        ];
    }
}
