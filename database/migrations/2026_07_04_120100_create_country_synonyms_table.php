<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('country_synonyms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('country_id')->constrained()->cascadeOnDelete();
            $table->string('synonym');
            $table->timestamps();

            $table->unique(['country_id', 'synonym']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('country_synonyms');
    }
};
