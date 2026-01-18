<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Country extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name', 'iso2', 'iso3', 'numeric_code', 'phonecode', 'capital', 
        'currency', 'currency_name', 'currency_symbol', 'tld', 'native', 
        'region', 'subregion', 'timezones', 'translations', 'latitude', 
        'longitude', 'emoji', 'emojiU', 'flag', 'is_active'
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

