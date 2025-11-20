<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;
use Carbon\Carbon;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Configurar timezone do Brasil para Carbon
        Carbon::setLocale('pt_BR');
        date_default_timezone_set(config('app.timezone'));
        
        // Forçar HTTPS em produção
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }
        
        // Confiar em proxies (para Easypanel/Docker)
        $this->app['request']->server->set('HTTPS', 'on');
    }
}
