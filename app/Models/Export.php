<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Export extends Model
{
    protected $fillable = [
        'training_id',
        'type',
        'file_path',
        'external_url',
        'generated_at',
    ];

    protected function casts(): array
    {
        return [
            'generated_at' => 'datetime',
        ];
    }

    public function training(): BelongsTo
    {
        return $this->belongsTo(Training::class);
    }
}
