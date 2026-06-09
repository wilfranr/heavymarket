<?php

namespace App\Models;

use App\Traits\NormalizesResources;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class State extends Model
{
    use HasFactory, NormalizesResources, SoftDeletes;

    protected $fillable = [
        'name', 'country_id', 'latitude', 'longitude', 'is_active',
    ];

    protected $normalizableAttributes = [
        'name' => 'title',
    ];

    public function country()
    {
        return $this->belongsTo(Country::class);
    }

    public function cities()
    {
        return $this->hasMany(City::class);
    }
}
