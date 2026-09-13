<!DOCTYPE html>
<html lang="fr">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title>{{ config('app.name') }}</title>
        <link rel="icon" href="{{ asset('assets/favicon.ico') }}" type="image/x-icon">
        <link rel="shortcut icon" href="{{ asset('assets/favicon.ico') }}" type="image/x-icon">
        @fonts
        @vite(['resources/css/app.css', 'resources/js/app.ts'])
    </head>
    <body class="min-h-screen bg-arcade-bg text-zinc-100 antialiased">
        <nav id="site-nav" class="arcade-site-nav">
            <button
                type="button"
                id="site-nav-toggle"
                class="arcade-site-nav__toggle"
                aria-expanded="false"
                aria-controls="site-nav-drawer"
                aria-label="Ouvrir le menu"
            >
                <i class="bi bi-list" aria-hidden="true"></i>
            </button>
            <div id="site-nav-backdrop" class="arcade-site-nav__backdrop" hidden></div>
            <div
                id="site-nav-drawer"
                class="arcade-site-nav__drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="site-nav-title"
                aria-hidden="true"
                inert
            >
                <div class="arcade-site-nav__header">
                    <p id="site-nav-title" class="arcade-end-badge mb-1">Arcadia</p>
                    <p class="arcade-site-nav__subtitle">Navigation</p>
                </div>
                <ul class="arcade-site-nav__links">
                    <li>
                        <a href="/" data-nav="games" class="arcade-site-nav__link">
                            <i class="bi bi-controller" aria-hidden="true"></i>
                            <span>Jeux</span>
                        </a>
                    </li>
                    <li>
                        <a href="/compte/connexion" id="site-nav-account" data-nav="account" class="arcade-site-nav__link">
                            <i class="bi bi-box-arrow-in-right" aria-hidden="true"></i>
                            <span class="arcade-site-nav__link-text">
                                <span id="site-nav-account-label">Connexion</span>
                                <small id="site-nav-account-meta" hidden></small>
                            </span>
                        </a>
                    </li>
                    <li>
                        <a href="/contact" data-nav="contact" class="arcade-site-nav__link">
                            <i class="bi bi-envelope-fill" aria-hidden="true"></i>
                            <span>Contact</span>
                        </a>
                    </li>
                </ul>
            </div>
        </nav>
        @yield('content')
    </body>
</html>
