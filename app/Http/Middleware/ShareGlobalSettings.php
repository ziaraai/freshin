<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Artisan;

class ShareGlobalSettings
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        // Ensure storage link exists
        $this->ensureStorageLink();

        // Skip during installation
        if (!$request->is('install/*') && !$request->is('update/*') && file_exists(storage_path('installed'))) {
            // Share settings with all Inertia responses
            Inertia::share([
                'globalSettings' => function () use ($request) {
                    $settings = (array) settings();
                    return $request->user() ? $settings : \App\Models\Setting::publicSettings($settings);
                }
            ]);
        }

        return $next($request);
    }

    /**
     * Ensure storage symlink exists
     */
    private function ensureStorageLink()
    {
        if (!File::exists(public_path('storage'))) {
            try {
                Artisan::call('storage:link');
            } catch (\Exception $e) {
                // Silently fail if unable to create link
            }
        }
    }
}
