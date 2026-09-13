<?php

namespace App\Support;

class LogoCategories
{
    /**
     * @return array<string, array{label: string, slugs: list<string>}>
     */
    public static function all(): array
    {
        /** @var array<string, array{label: string, slugs: list<string>}> $categories */
        $categories = require database_path('data/logo_categories.php');

        return $categories;
    }

    /**
     * @return list<string>
     */
    public static function ids(): array
    {
        return array_keys(self::all());
    }

    public static function label(string $id): ?string
    {
        return self::all()[$id]['label'] ?? null;
    }

    public static function isValid(string $id): bool
    {
        return isset(self::all()[$id]);
    }
}
