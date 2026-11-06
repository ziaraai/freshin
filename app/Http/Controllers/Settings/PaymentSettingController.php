<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\PaymentSetting;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class PaymentSettingController extends Controller
{
    public function index()
    {
        [$userId, $storeId] = $this->settingsContext();

        return Inertia::render('settings/index', [
            'paymentSettings' => PaymentSetting::settingsForDisplay($userId, $storeId),
        ]);
    }

    /** Publishable configuration used when buying a SaaS plan. */
    public function getPaymentMethods()
    {
        $superAdminId = User::where('type', 'superadmin')->value('id');
        if (!$superAdminId) {
            return response()->json([]);
        }

        $stripe = getPaymentMethodConfig('stripe', $superAdminId);
        $settings = settings($superAdminId);

        return response()->json([
            'is_stripe_enabled' => $stripe['enabled'] && !empty($stripe['key']) && !empty($stripe['secret']),
            'stripe_key' => $stripe['key'],
            'defaultCurrency' => $settings['defaultCurrency'] ?? 'gbp',
            'titleText' => $settings['titleText'] ?? 'Freshin',
            'is_demo' => config('app.is_demo', false),
            'user_type' => auth()->user()?->type,
        ]);
    }

    public function store(Request $request)
    {
        if (!auth()->user()->hasPermissionTo('manage-settings')) {
            return back()->withErrors(['error' => 'You do not have permission to update payment settings.']);
        }

        [$userId, $storeId] = $this->settingsContext();
        $validated = $request->validate([
            'is_stripe_enabled' => 'sometimes|boolean',
            'stripe_key' => 'nullable|string|max:1000',
            'stripe_secret' => 'nullable|string|max:1000',
            'is_cod_enabled' => $storeId === null ? 'prohibited' : 'sometimes|boolean',
        ]);
        $current = getPaymentSettings($userId, $storeId);
        $enabled = $request->has('is_stripe_enabled')
            ? $request->boolean('is_stripe_enabled')
            : filter_var($current['is_stripe_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $key = $validated['stripe_key'] ?? $current['stripe_key'] ?? '';
        $secret = $validated['stripe_secret'] ?? '';
        if ($secret === '' || $secret === '********') {
            $secret = $current['stripe_secret'] ?? '';
        }

        $errors = [];
        if ($enabled && trim($key) === '') {
            $errors['stripe_key'] = 'Stripe publishable key is required when Stripe is enabled.';
        }
        if ($enabled && trim($secret) === '') {
            $errors['stripe_secret'] = 'Stripe secret key is required when Stripe is enabled.';
        }
        if ($errors) {
            throw ValidationException::withMessages($errors);
        }

        DB::transaction(function () use ($userId, $storeId, $key, $secret, $enabled, $validated) {
            foreach (['is_stripe_enabled' => $enabled, 'stripe_key' => $key, 'stripe_secret' => $secret] as $name => $value) {
                updatePaymentSetting($name, $value, $userId, $storeId);
            }
            if ($storeId !== null && array_key_exists('is_cod_enabled', $validated)) {
                updatePaymentSetting('is_cod_enabled', (bool) $validated['is_cod_enabled'], $userId, $storeId);
            }
        });

        return back()->with('success', 'Payment settings updated successfully.');
    }

    public function getEnabledMethods()
    {
        [$userId, $storeId] = $this->settingsContext();
        $methods = [];
        foreach (getEnabledPaymentMethods($userId, $storeId) as $name => $configuration) {
            if ($name === 'stripe') {
                if (!empty($configuration['key']) && !empty($configuration['secret'])) {
                    $methods['stripe'] = ['enabled' => true, 'key' => $configuration['key']];
                }
            } elseif ($name === 'cod') {
                $methods['cod'] = ['enabled' => true];
            }
        }

        return response()->json($methods);
    }

    private function settingsContext(): array
    {
        $user = auth()->user();
        abort_unless($user, 401);
        if ($user->type === 'superadmin') {
            return [$user->id, null];
        }

        $owner = $user->type === 'company' ? $user : User::find($user->created_by);
        $storeId = $owner ? getCurrentStoreId($owner) : null;
        abort_unless($owner && $storeId && Store::where('id', $storeId)->where('user_id', $owner->id)->exists(), 403, 'Select a store before configuring payments.');

        return [$owner->id, $storeId];
    }
}
