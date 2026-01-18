<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Categoria extends Model
{
    use HasFactory;

    protected $fillable = ['nombre'];

    public function terceros()
    {
        return $this->belongsToMany(Tercero::class);
    }

    public function referencias()
    {
        return $this->hasMany(Referencia::class);
    }
}
