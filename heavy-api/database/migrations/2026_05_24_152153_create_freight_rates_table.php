<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('freight_rates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('country_id')->constrained('countries')->onDelete('cascade');
            $table->decimal('rate_per_lb', 10, 2)->comment('Tarifa USD por libra');
            $table->decimal('minimum_weight_lb', 10, 2)->nullable()->comment('Peso minimo de envio en libras');
            $table->string('origin')->nullable()->comment('Origen del envio, ej: Miami, China');
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['country_id', 'origin', 'active'], 'idx_freight_rates_country_origin_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('freight_rates');
    }
};
