<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('logos', function (Blueprint $table) {
            $table->string('category')->nullable()->after('name')->index();
            $table->string('hex', 6)->nullable()->after('category');
        });
    }

    public function down(): void
    {
        Schema::table('logos', function (Blueprint $table) {
            $table->dropColumn(['category', 'hex']);
        });
    }
};
