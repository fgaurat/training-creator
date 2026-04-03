<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Training extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'duration',
        'level',
        'status',
        'source_plan',
        'parent_id',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Training::class, 'parent_id');
    }

    public function variants(): HasMany
    {
        return $this->hasMany(Training::class, 'parent_id');
    }

    public function modules(): HasMany
    {
        return $this->hasMany(Module::class)->orderBy('order');
    }

    public function contexts(): HasMany
    {
        return $this->hasMany(Context::class);
    }

    public function exports(): HasMany
    {
        return $this->hasMany(Export::class);
    }

    public function clone(): static
    {
        $clone = $this->replicate(['id', 'created_at', 'updated_at']);
        $clone->parent_id = $this->id;
        $clone->status = 'draft';
        $clone->title = $this->title . ' (copie)';
        $clone->save();

        foreach ($this->modules as $module) {
            $clonedModule = $module->replicate(['id', 'created_at', 'updated_at']);
            $clonedModule->training_id = $clone->id;
            $clonedModule->save();

            foreach ($module->exercises as $exercise) {
                $clonedExercise = $exercise->replicate(['id', 'created_at', 'updated_at']);
                $clonedExercise->module_id = $clonedModule->id;
                $clonedExercise->save();
            }

            foreach ($module->quizzes as $quiz) {
                $clonedQuiz = $quiz->replicate(['id', 'created_at', 'updated_at']);
                $clonedQuiz->module_id = $clonedModule->id;
                $clonedQuiz->save();

                foreach ($quiz->options as $option) {
                    $clonedOption = $option->replicate(['id', 'created_at', 'updated_at']);
                    $clonedOption->quiz_id = $clonedQuiz->id;
                    $clonedOption->save();
                }
            }
        }

        return $clone;
    }
}
