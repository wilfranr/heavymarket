<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class City extends Model
{
    use \App\Traits\NormalizesResources, SoftDeletes;

    protected $fillable = [
        'name', 'country_id', 'state_id', 'latitude', 'longitude', 'is_active',
    ];

    protected $normalizableAttributes = [
        'name' => 'title',
    ];

    public function state()
    {
        return $this->belongsTo(State::class);
    }

    public function country()
    {
        return $this->belongsTo(Country::class);
    }
}
