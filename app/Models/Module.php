<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Module extends Model
{
    use HasFactory;

    protected $fillable = [
        'training_id',
        'title',
        'order',
        'duration',
        'objectives',
        'content',
    ];

    public function training(): BelongsTo
    {
        return $this->belongsTo(Training::class);
    }

    public function exercises(): HasMany
    {
        return $this->hasMany(Exercise::class)->orderBy('order');
    }

    public function quizzes(): HasMany
    {
        return $this->hasMany(Quiz::class)->orderBy('order');
    }
}
