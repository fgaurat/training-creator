<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Exercise extends Model
{
    use HasFactory;

    protected $fillable = [
        'module_id',
        'title',
        'type',
        'instructions',
        'solution',
        'order',
    ];

    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }
}
