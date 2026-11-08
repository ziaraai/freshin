<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\LoginHistory;
use App\Models\Store;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        $isDemo = config('app.is_demo', false);
        $demoStores = [];
        
        if ($isDemo) {
            $demoStores = Store::select('id', 'name', 'slug', 'theme')
                ->limit(8)
                ->get()
                ->toArray();
        }
        
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
            'settings' => settings(),
            'isDemo' => $isDemo,
            'demoStores' => $demoStores,
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        $this->logLoginHistory($request);

        // Check if email verification is enabled and user is not verified
        $emailVerificationEnabled = getSetting('emailVerification', false);
        if ($emailVerificationEnabled && !$request->user()->hasVerifiedEmail()) {
            return redirect()->route('verification.notice');
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        // Only regenerate token, don't invalidate entire session
        // This prevents affecting customer authentication
        $request->session()->regenerateToken();

        return redirect('/');
    }

    private function logLoginHistory(Request $request): void
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return;
            }

            $ip = $request->ip();
            $userAgent = $request->userAgent() ?? '';
            $browserData = parseBrowserData($userAgent);
            $details = array_merge(['query' => $ip], $browserData, [
                'status' => 'success',
                'referrer_host' => $request->headers->get('referer') ? parse_url($request->headers->get('referer'), PHP_URL_HOST) : null,
                'referrer_path' => $request->headers->get('referer') ? parse_url($request->headers->get('referer'), PHP_URL_PATH) : null,
            ]);

            // For superadmin don't store the store id
            $storeId = null;
            if ($user->type !== 'superadmin') {
                $storeId = getCurrentStoreId($user);
            }

            $loginHistory             = new LoginHistory();
            $loginHistory->user_id    = $user->id;
            $loginHistory->store_id   = $storeId;
            $loginHistory->ip         = $ip;
            $loginHistory->date       = now()->toDateString();
            $loginHistory->details    = $details;
            $loginHistory->type       = $user->type;
            $loginHistory->created_by = in_array($user->type, ['superadmin', 'company']) ? $user->id : $user->created_by;
            $loginHistory->save();

            // The IP location lookup calls an outside service; run it after the response is sent
            // so a slow or unreachable service never delays the login.
            \Illuminate\Support\defer(function () use ($loginHistory, $ip) {
                try {
                    $loginHistory->details = array_merge($loginHistory->details ?? [], $this->getLocationData($ip));
                    $loginHistory->save();
                } catch (\Throwable $e) {
                    \Log::info('Login location lookup failed: '.$e->getMessage());
                }
            });
        } catch (\Exception $e) {
            // Silently ignore login history errors to prevent login disruption
            \Log::info('Login history logging failed: ' . $e->getMessage());
        }
    }

    private function getLocationData(string $ip): array
    {
        try {
            if ($ip === '127.0.0.1' || $ip === '::1' || str_starts_with($ip, '192.168.') || str_starts_with($ip, '10.')) {
                return [
                    'country' => 'Localhost',
                    'countryCode' => 'LOC',
                    'region' => 'Local',
                    'regionName' => 'Local',
                    'city' => 'Localhost',
                    'zip' => '00000',
                    'timezone' => config('app.timezone', 'UTC'),
                    'isp' => 'Internal',
                    'org' => 'Internal',
                    'query' => $ip,
                ];
            }

            $response = Http::connectTimeout(2)->timeout(3)->get("http://ip-api.com/json/{$ip}");
            if ($response->successful()) {
                $data = $response->json();
                return [
                    'country' => $data['country'] ?? null,
                    'countryCode' => $data['countryCode'] ?? null,
                    'region' => $data['region'] ?? null,
                    'regionName' => $data['regionName'] ?? null,
                    'city' => $data['city'] ?? null,
                    'zip' => $data['zip'] ?? null,
                    'lat' => $data['lat'] ?? null,
                    'lon' => $data['lon'] ?? null,
                    'timezone' => $data['timezone'] ?? null,
                    'isp' => $data['isp'] ?? null,
                    'org' => $data['org'] ?? null,
                    'as' => $data['as'] ?? null,
                    'query' => $data['query'] ?? $ip,
                ];
            }
        } catch (\Exception $e) {
            // Ignore API errors
        }
        return ['query' => $ip];
    }
}
