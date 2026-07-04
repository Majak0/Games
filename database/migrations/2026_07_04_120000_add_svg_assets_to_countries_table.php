<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('countries', function (Blueprint $table) {
            $table->mediumText('flag_svg')->nullable()->after('flag_url');
            $table->mediumText('shape_svg')->nullable()->after('flag_svg');
        });
    }

    public function down(): void
    {
        Schema::table('countries', function (Blueprint $table) {
            $table->dropColumn(['flag_svg', 'shape_svg']);
        });
    }
};
