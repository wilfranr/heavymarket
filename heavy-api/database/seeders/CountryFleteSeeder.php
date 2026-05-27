<?php

namespace Database\Seeders;

use App\Models\Country;
use Illuminate\Database\Seeder;

class CountryFleteSeeder extends Seeder
{
    public function run(): void
    {
        Country::query()
            ->where(function ($q): void {
                $q->where('iso2', 'CO')
                    ->orWhere('name', 'Colombia')
                    ->orWhere('id', 48);
            })
            ->update(['flete' => 2.5]);
    }
}
