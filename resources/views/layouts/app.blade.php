<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Navi Co.')</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body data-page="@yield('body-page', '')">
    <div class="announcement"><span class="live-dot"></span> A new corner of the internet is taking shape <a href="{{ route('about') }}">Meet Navi Co. <span aria-hidden="true">↗</span></a></div>
    <header class="site-header">
        <a class="brand" href="{{ route('home') }}"><span class="brand-mark">n</span><span>navi<span class="brand-light">co.</span></span></a>
        <button class="menu-toggle" aria-label="Open navigation" aria-expanded="false">☰</button>
        <nav class="main-nav">
            <a href="{{ route('home') }}">Home</a>
            <a href="{{ route('about') }}">About</a>
            <a href="{{ route('freedom-wall') }}">Freedom wall</a>
            <a href="{{ route('connect') }}">Connect</a>
            <a href="{{ route('contact') }}">Contact</a>
        </nav>
        <div class="header-actions">
            @auth
                <a class="button button-outline" href="{{ route('profile') }}">My account</a>
                <form method="POST" action="{{ route('logout') }}">@csrf<button class="button button-accent" type="submit">Log out</button></form>
            @else
                <a class="button button-outline" href="{{ route('login') }}">Log in</a>
                <a class="button button-accent" href="{{ route('register') }}">Sign up <span>↗</span></a>
            @endauth
        </div>
    </header>
    <main>@yield('content')</main>
    <footer class="site-footer">
        <div class="footer-top"><a class="brand" href="{{ route('home') }}"><span class="brand-mark">n</span><span>navi<span class="brand-light">co.</span></span></a><p>A little corner of the internet<br>to be a little more you.</p></div>
        <div class="footer-bottom"><span>© {{ date('Y') }} NAVI CO. MADE WITH COMMUNITY IN MIND.</span></div>
    </footer>
</body>
</html>
