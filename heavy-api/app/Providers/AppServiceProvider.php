<?php

namespace App\Providers;

use App\Models\Cotizacion;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\ServiceProvider;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Route::model('cotizacione', Cotizacion::class);

        Validator::resolver(function ($translator, $data, $rules, $messages, $customAttributes) {
            return new \App\Validation\CustomValidator($translator, $data, $rules, $messages, $customAttributes);
        });
    }
}
