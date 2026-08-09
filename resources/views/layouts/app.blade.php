<!DOCTYPE html>
<html lang="fr">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title>{{ config('app.name') }}</title>
        @fonts
        @vite(['resources/css/app.css', 'resources/js/app.ts'])
    </head>
    <body class="min-h-screen bg-arcade-bg text-zinc-100 antialiased">
        <div id="account-fab"></div>
        @yield('content')
    </body>
</html>
