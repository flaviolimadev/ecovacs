<!DOCTYPE html>
<html lang="pt-BR" translate="no">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        
        <!-- Bloquear tradução automática do Google -->
        <meta name="google" content="notranslate">
        <meta http-equiv="content-language" content="pt-BR">
        
        <!-- SEO Meta Tags -->
        <title>Ecovacs Robotics - Plataforma de Investimentos Inteligentes</title>
        <meta name="description" content="Invista em tecnologia de ponta com a Ecovacs Robotics. Planos de rendimento progressivo com comissões atrativas e sistema de indicação multinível. Inovação e rentabilidade ao seu alcance.">
        <meta name="keywords" content="ecovacs, robotics, investimentos, tecnologia, robôs inteligentes, rendimento progressivo, plataforma de investimentos, comissões, indicação, MLM">
        <meta name="author" content="Ecovacs Robotics">
        <meta name="robots" content="index, follow">
        
        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="{{ config('app.url') }}">
        <meta property="og:title" content="Ecovacs Robotics - Plataforma de Investimentos Inteligentes">
        <meta property="og:description" content="Invista em tecnologia de ponta com a Ecovacs Robotics. Planos de rendimento progressivo com comissões atrativas e sistema de indicação multinível.">
        <meta property="og:image" content="{{ config('app.url') }}/assets/logo.jpg">
        <meta property="og:locale" content="pt_BR">
        
        <!-- Twitter -->
        <meta property="twitter:card" content="summary_large_image">
        <meta property="twitter:url" content="{{ config('app.url') }}">
        <meta property="twitter:title" content="Ecovacs Robotics - Plataforma de Investimentos Inteligentes">
        <meta property="twitter:description" content="Invista em tecnologia de ponta com a Ecovacs Robotics. Planos de rendimento progressivo com comissões atrativas.">
        <meta property="twitter:image" content="{{ config('app.url') }}/assets/logo.jpg">
        
        <!-- Favicon -->
        <link rel="icon" type="image/png" href="/assets/faviiconvacs.png">
        <link rel="shortcut icon" type="image/png" href="/assets/faviiconvacs.png">
        <link rel="apple-touch-icon" href="/assets/faviiconvacs.png">
        
        <!-- CSRF Token -->
        <meta name="csrf-token" content="{{ csrf_token() }}">
        
        <!-- Theme Color -->
        <meta name="theme-color" content="#0EA5E9">
        
        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
        
        <!-- Meta Pixel Code -->
        <script>
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');

          fbq('init', '552554990448130'); 
          fbq('track', 'PageView');
        </script>
        <noscript>
          <img height="1" width="1" style="display:none"
               src="https://www.facebook.com/tr?id=552554990448130&ev=PageView&noscript=1"/>
        </noscript>
        <!-- End Meta Pixel Code -->
        
        <!-- Scripts & Styles (Vite) -->
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
    </head>
    <body class="notranslate" translate="no">
        <div id="app" class="notranslate"></div>
    </body>
</html>

