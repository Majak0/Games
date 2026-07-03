<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('game', 32);
            $table->string('mode', 64);
            $table->unsignedInteger('score');
            $table->unsignedBigInteger('elapsed_microseconds')->default(0);
            $table->boolean('completed')->default(false);
            $table->timestamps();

            $table->unique(['user_id', 'game', 'mode']);
            $table->index(['game', 'mode', 'score']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_scores');
    }
};
