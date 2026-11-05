<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    {{-- Inline script to detect system dark mode preference and apply it immediately --}}
    <script>
        (function() {
            const appearance = '{{ $appearance ?? 'system' }}';

            if (appearance === 'system') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                if (prefersDark) {
                    document.documentElement.classList.add('dark');
                }
            }
        })();
    </script>

    {{-- Inline style to set the HTML background color based on our theme in app.css --}}
    <style>
        html {
            background-color: oklch(1 0 0);
        }

        html.dark {
            background-color: oklch(0.145 0 0);
        }
    </style>

    @isset($page['props'])
        @isset($page['props']["seo_data"])
            @php
            $seoData = $page['props']["seo_data"];
            @endphp
            @isset($seoData["meta_title"])
                <meta name="og:title" content="{{ $seoData["meta_title"] }}">
                <meta name="twitter:title" content="{{ $seoData["meta_title"] }}">
            @endisset
            @isset($seoData["meta_description"])
                <meta name="og:description" content="{{ $seoData["meta_description"] }}">
                <meta name="twitter:description" content="{{ $seoData["meta_description"] }}">
            @endisset
            @isset($seoData["meta_image"])
                <meta name="og:image" content="{{ $seoData["meta_image"] }}">
                <meta name="twitter:image" content="{{ $seoData["meta_image"] }}">
            @endisset
            @isset($seoData["meta_keywords"])
                <meta name="og:keywords" content="{{ $seoData["meta_keywords"] }}">
                <meta name="twitter:keywords" content="{{ $seoData["meta_keywords"] }}">
            @endisset
            @isset($seoData["meta_type"])
                <meta name="og:type" content="{{ $seoData["meta_type"] }}">
                <meta name="twitter:type" content="{{ $seoData["meta_type"] }}">
            @endisset
            @isset($seoData["twitter_card"])
                <meta name="twitter:card" content="{{ $seoData["twitter_card"] }}">
            @endisset
        @endisset
    @endisset
    <title inertia>{{ getSetting('titleText', config('app.name', 'WhatsStore')) }}</title>

    {{-- Dynamic Favicon --}}
    @php
        $favicon = getSetting('favicon', '/images/logos/favicon.png');
        $faviconUrl = $favicon;
        if (!str_starts_with($favicon, 'http')) {
            // Remove leading slash and construct proper URL
            $cleanPath = ltrim($favicon, '/');
            $faviconUrl = rtrim(config('app.url'), '/') . '/' . $cleanPath;
        }
    @endphp
    <link rel="icon" href="{{ $faviconUrl }}">

    {{-- <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" /> --}}

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <script src="{{ asset('js/jquery.min.js') }}"></script>

    <script>
        window.appConfig = {
            url: '{{ config('app.url') }}'
        };

        // Set demo mode flag
        window.isDemo = {{ config('app.is_demo') ? 'true' : 'false' }};

        // Set base URL for image helper
        window.appSettings = {
            baseUrl: '{{ config('app.url') }}'
        };
    </script>

    @routes
    @viteReactRefresh
    @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
    @inertiaHead
</head>

<body class="font-sans antialiased">
    @inertia
</body>

</html>
