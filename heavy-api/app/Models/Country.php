<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Country extends Model
{
    use \App\Traits\NormalizesResources, HasFactory, SoftDeletes;

    protected $fillable = [
        'name', 'iso2', 'iso3', 'numeric_code', 'phonecode', 'capital',
        'currency', 'currency_name', 'currency_symbol', 'tld', 'native',
        'region', 'subregion', 'timezones', 'translations', 'latitude',
        'longitude', 'emoji', 'emojiU', 'flag', 'is_active',
    ];

    protected $normalizableAttributes = [
        'name' => 'title',
        'iso2' => 'code',
        'iso3' => 'code',
        'currency' => 'code',
        'region' => 'title',
        'subregion' => 'title',
    ];

    public function states()
    {
        return $this->hasMany(State::class);
    }

    public function cities()
    {
        return $this->hasMany(City::class);
    }
}
