<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Context extends Model
{
    use HasFactory;

    protected $fillable = [
        'training_id',
        'title',
        'client_name',
        'type',
        'content',
    ];

    public function training(): BelongsTo
    {
        return $this->belongsTo(Training::class);
    }
}
