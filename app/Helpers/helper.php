<?php

use App\Models\Setting;
use App\Models\User;
use App\Models\Currency;
use App\Models\Coupon;
use Carbon\Carbon;
use App\Models\Plan;
use App\Models\PlanOrder;
use App\Models\Role;
use App\Models\PaymentSetting;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

if (!function_exists('getCacheSize')) {
    /**
     * Get the total cache size in MB
     *
     * @return string
     */
    function getCacheSize()
    {
        $file_size = 0;
        $framework_path = storage_path('framework');

        if (is_dir($framework_path)) {
            foreach (\File::allFiles($framework_path) as $file) {
                $file_size += $file->getSize();
            }
        }

        return number_format($file_size / 1000000, 2);
    }
}

if (! function_exists('settings')) {
    function settings($user_id = null, $store_id = null)
    {
        // Skip database queries during installation
        if (request()->is('install*') || request()->is('update*') || request()->is('installer*') || !file_exists(storage_path('installed'))) {
            return [];
        }

        if (is_null($user_id)) {
            if (auth()->user()) {
                if (!in_array(auth()->user()->type, ['superadmin', 'company'])) {
                    $user_id = auth()->user()->created_by;
                    // For company users, get current store if not specified
                    $company = User::find($user_id);
                    if (is_null($store_id) && $company->type === 'company') {
                        $store_id = getCurrentStoreId($company);
                    }
                } else {
                    $user_id = auth()->id();
                    // For company users, get current store if not specified
                    if (is_null($store_id) && auth()->user()->type === 'company') {
                        $store_id = getCurrentStoreId(auth()->user());
                    }
                }
            } else {
                $user = User::where('type', 'superadmin')->first();
                $user_id = $user ? $user->id : null;
            }
        }

        if (!$user_id) {
            return collect();
        }

        // // Get superadmin settings as fallback if user is not superadmin
        // $superAdminSettings = [];
        // $superAdmin = User::where('type', 'superadmin')->first();
        // if ($superAdmin && $superAdmin->id !== $user_id) {
        //     $superAdminSettings = Setting::where('user_id', $superAdmin->id)
        //         ->whereNull('store_id')
        //         ->pluck('value', 'key')
        //         ->toArray();
        // }

        // Get user's global settings
        $globalSettings = Setting::where('user_id', $user_id)
            ->whereNull('store_id')
            ->pluck('value', 'key')
            ->toArray();

        // $merged = array_merge($superAdminSettings, $globalSettings);

        // If store_id is specified, merge store-specific settings
        if ($store_id !== null) {
            $storeSettings = Setting::where('user_id', $user_id)
                ->where('store_id', $store_id)
                ->pluck('value', 'key')
                ->toArray();

            return array_merge($globalSettings, $storeSettings);
            // return array_merge($merged, $storeSettings);
        }

        return $globalSettings;
        // return $merged;
    }
}

if (! function_exists('formatDateTime')) {
    function formatDateTime($date, $includeTime = true)
    {
        if (!$date) {
            return null;
        }

        $settings = settings();

        $dateFormat = $settings['dateFormat'] ?? 'Y-m-d';
        $timeFormat = $settings['timeFormat'] ?? 'H:i';
        $timezone = $settings['defaultTimezone'] ?? config('app.timezone', 'UTC');

        $format = $includeTime ? "$dateFormat $timeFormat" : $dateFormat;

        return Carbon::parse($date)->timezone($timezone)->format($format);
    }
}



if (! function_exists('getSetting')) {
    function getSetting($key, $default = null, $user_id = null, $store_id = null)
    {
        // Check if this is a payment/messaging setting that should be retrieved from payment_settings table
        $paymentSettingKeys = [
            'is_whatsapp_enabled',
            'whatsapp_number',
            'messaging_message_template',
            'messaging_item_template',
            'is_telegram_enabled',
            'telegram_bot_token',
            'telegram_chat_id',
            'messaging_order_variables',
            'messaging_item_variables'
        ];

        if (in_array($key, $paymentSettingKeys)) {
            $paymentSettings = getPaymentSettings($user_id, $store_id);
            return $paymentSettings[$key] ?? $default;
        }

        // Skip database queries during installation
        if (request()->is('install*') || request()->is('update*') || request()->is('installer*') || !file_exists(storage_path('installed'))) {
            $defaultSettings = defaultSettings();
            return $defaultSettings[$key] ?? $default;
        }

        // Determine user_id if not provided
        if (is_null($user_id)) {
            if (auth()->user()) {
                if (!in_array(auth()->user()->type, ['superadmin', 'company'])) {
                    $user_id = auth()->user()->created_by;
                } else {
                    $user_id = auth()->id();
                }
            } else {
                $user = User::where('type', 'superadmin')->first();
                $user_id = $user ? $user->id : null;
            }
        }

        if (!$user_id) {
            $defaultSettings = defaultSettings();
            return $defaultSettings[$key] ?? $default;
        }

        // For store-specific settings, use new method
        if ($store_id !== null) {
            return \App\Models\Setting::getSetting($key, $user_id, $store_id, $default);
        }

        $user = User::find($user_id);
        $settings = [];

        // For company users, check current store settings first
        if ($user && $user->type === 'company') {
            $currentStoreId = getCurrentStoreId($user);
            if ($currentStoreId) {
                // Special handling for favicon - check store_configuration first
                if ($key === 'favicon') {
                    $storeConfig = \App\Models\StoreConfiguration::getConfiguration($currentStoreId);
                    if (!empty($storeConfig['favicon'])) {
                        return $storeConfig['favicon'];
                    }
                }

                $settings = Setting::where('user_id', $user_id)
                    ->where('store_id', $currentStoreId)
                    ->pluck('value', 'key')
                    ->toArray();
            }
        }

        // If not found, check global settings for this user
        if (!isset($settings[$key])) {
            $globalSettings = Setting::where('user_id', $user_id)
                ->whereNull('store_id')
                ->pluck('value', 'key')
                ->toArray();
            if (isset($globalSettings[$key])) {
                return $globalSettings[$key];
            }
        }

        // If still not found and user is company, try superadmin settings
        if (!isset($settings[$key]) && $user && $user->type === 'company') {
            $superAdmin = User::where('type', 'superadmin')->first();
            if ($superAdmin) {
                $superAdminSettings = Setting::where('user_id', $superAdmin->id)
                    ->whereNull('store_id')
                    ->pluck('value', 'key')
                    ->toArray();
                if (isset($superAdminSettings[$key])) {
                    return $superAdminSettings[$key];
                }
            }
        }

        // If no value found and no default provided, try to get from defaultSettings
        if (!isset($settings[$key]) && $default === null) {
            $defaultSettings = defaultSettings();
            $default = $defaultSettings[$key] ?? null;
        }

        return $settings[$key] ?? $default;
    }
}

if (! function_exists('updateSetting')) {
    function updateSetting($key, $value, $user_id = null, $store_id = null)
    {
        // For store-specific settings, use new method
        if ($store_id !== null) {
            return \App\Models\Setting::setSetting($key, $value, $user_id ?: auth()->id(), $store_id);
        }

        // Legacy behavior for global settings
        if (is_null($user_id)) {
            if (auth()->user()) {
                if (!in_array(auth()->user()->type, ['superadmin', 'company'])) {
                    $user_id = auth()->user()->created_by;
                } else {
                    $user_id = auth()->id();
                }
            } else {
                $user = User::where('type', 'superadmin')->first();
                $user_id = $user ? $user->id : null;
            }
        }

        if (!$user_id) {
            return false;
        }

        return Setting::updateOrCreate(
            ['user_id' => $user_id, 'store_id' => null, 'key' => $key],
            ['value' => $value]
        );
    }
}

if (! function_exists('isLandingPageEnabled')) {
    function isLandingPageEnabled()
    {
        return getSetting('landingPageEnabled', true) === true || getSetting('landingPageEnabled', true) === '1';
    }
}

if (! function_exists('isRegistrationEnabled')) {
    function isRegistrationEnabled()
    {
        return getSetting('registrationEnabled', true) === true || getSetting('registrationEnabled', true) === '1';
    }
}

if (! function_exists('defaultRoleAndSetting')) {
    function defaultRoleAndSetting($user)
    {
        $companyRole = Role::where('name', 'company')->first();

        if ($companyRole) {
            $user->assignRole($companyRole);
        }

        // Create default settings for the user
        if ($user->type === 'superadmin') {
            createDefaultSettings($user->id);
        } elseif ($user->type === 'company') {
            copySettingsFromSuperAdmin($user->id, $user->current_store);
            $user->companyDefaultData($user);
        }

        return true;
    }
}

if (! function_exists('getPaymentSettings')) {
    /**
     * Get payment settings for a user
     *
     * @param int|null $userId
     * @return array
     */
    function getPaymentSettings($userId = null, $storeId = null)
    {
        if (is_null($userId)) {
            if (auth()->check()) {
                $userId = auth()->id();
                // For company users, get current store ID
                if (auth()->user()->type === 'company' && is_null($storeId)) {
                    $storeId = getCurrentStoreId(auth()->user());
                }
            } else {
                $user = User::where('type', 'superadmin')->first();
                $userId = $user ? $user->id : null;
            }
        }

        return PaymentSetting::getUserSettings($userId, $storeId);
    }
}

if (! function_exists('updatePaymentSetting')) {
    /**
     * Update or create a payment setting
     *
     * @param string $key
     * @param mixed $value
     * @param int|null $userId
     * @return \App\Models\PaymentSetting
     */
    function updatePaymentSetting($key, $value, $userId = null, $storeId = null)
    {
        if (is_null($userId)) {
            $userId = auth()->id();
            // For company users, get current store ID
            if (auth()->user()->type === 'company' && is_null($storeId)) {
                $storeId = getCurrentStoreId(auth()->user());
            }
        }

        return PaymentSetting::updateOrCreateSetting($userId, $key, $value, $storeId);
    }
}

if (! function_exists('isPaymentMethodEnabled')) {
    /** Stripe is available for plans and stores; cash on delivery is store-only. */
    function isPaymentMethodEnabled($method, $userId = null, $storeId = null)
    {
        if (!in_array($method, ['stripe', 'cod'], true)) {
            return false;
        }
        if ($method === 'cod' && $storeId === null) {
            return false;
        }

        $settings = getPaymentSettings($userId, $storeId);

        return filter_var($settings["is_{$method}_enabled"] ?? false, FILTER_VALIDATE_BOOLEAN);
    }
}

if (! function_exists('getPaymentMethodConfig')) {
    /** Internal payment configuration. Never return this directly to a browser. */
    function getPaymentMethodConfig($method, $userId = null, $storeId = null)
    {
        if ($method === 'cod') {
            return ['enabled' => isPaymentMethodEnabled('cod', $userId, $storeId)];
        }
        if ($method !== 'stripe') {
            return [];
        }

        $settings = getPaymentSettings($userId, $storeId);

        return [
            'enabled' => isPaymentMethodEnabled('stripe', $userId, $storeId),
            'key' => $settings['stripe_key'] ?? null,
            'secret' => $settings['stripe_secret'] ?? null,
        ];
    }
}

if (! function_exists('getEnabledPaymentMethods')) {
    function getEnabledPaymentMethods($userId = null, $storeId = null)
    {
        $enabled = [];
        foreach (['stripe', 'cod'] as $method) {
            if (isPaymentMethodEnabled($method, $userId, $storeId)) {
                $enabled[$method] = getPaymentMethodConfig($method, $userId, $storeId);
            }
        }

        return $enabled;
    }
}

if (! function_exists('validatePaymentMethodConfig')) {
    function validatePaymentMethodConfig($method, $config)
    {
        $errors = [];
        if ($method === 'stripe') {
            if (empty($config['key'])) {
                $errors[] = 'Stripe publishable key is required';
            }
            if (empty($config['secret'])) {
                $errors[] = 'Stripe secret key is required';
            }
        } elseif ($method !== 'cod') {
            $errors[] = 'This payment method is no longer supported';
        }

        return ['valid' => empty($errors), 'errors' => $errors];
    }
}

if (! function_exists('calculatePlanPricing')) {
    function calculatePlanPricing($plan, $couponCode = null, $billingCycle = 'monthly')
    {
        $originalPrice = $plan->getPriceForCycle($billingCycle);
        $discountAmount = 0;
        $finalPrice = $originalPrice;
        $couponId = null;

        if ($couponCode) {
            $coupon = Coupon::where('code', $couponCode)
                ->where('status', 1)
                ->first();

            if ($coupon) {
                if ($coupon->type === 'percentage') {
                    $discountAmount = ($originalPrice * $coupon->discount_amount) / 100;
                } else {
                    $discountAmount = min($coupon->discount_amount, $originalPrice);
                }
                $finalPrice = max(0, $originalPrice - $discountAmount);
                $couponId = $coupon->id;
            }
        }

        return [
            'original_price' => $originalPrice,
            'discount_amount' => $discountAmount,
            'final_price' => $finalPrice,
            'coupon_id' => $couponId
        ];
    }
}

if (! function_exists('createPlanOrder')) {
    function createPlanOrder($data)
    {
        $plan = Plan::findOrFail($data['plan_id']);
        $pricing = calculatePlanPricing($plan, $data['coupon_code'] ?? null, $data['billing_cycle'] ?? 'monthly');

        return PlanOrder::create([
            'order_number' => 'PO-' . strtoupper(Str::random(8)),
            'user_id' => $data['user_id'],
            'plan_id' => $plan->id,
            'coupon_id' => $pricing['coupon_id'],
            'billing_cycle' => $data['billing_cycle'] ?? 'monthly',
            'payment_method' => $data['payment_method'],
            'coupon_code' => $data['coupon_code'] ?? null,
            'original_price' => $pricing['original_price'],
            'discount_amount' => $pricing['discount_amount'],
            'final_price' => $pricing['final_price'],
            'payment_id' => $data['payment_id'] ?? null,
            'status' => $data['status'] ?? 'pending',
            'ordered_at' => now(),
            'processed_at' => $data['processed_at'] ?? now(),
            'receipt' => $data['receipt'] ?? null,
        ]);
    }
}


if (! function_exists('processPaymentSuccess')) {
    function processPaymentSuccess($data)
    {
        $plan = Plan::findOrFail($data['plan_id']);
        $user = User::findOrFail($data['user_id']);

        $planOrder = createPlanOrder(array_merge($data, ['processed_at' => now(), 'status' => 'approved']));
        assignPlanToUser($user, $plan, $data['billing_cycle']);

        // Verify the plan was assigned
        $user->refresh();
        return $planOrder;
    }
}

if (! function_exists('getPaymentGatewaySettings')) {
    function getPaymentGatewaySettings()
    {
        $superAdminId = User::where('type', 'superadmin')->first()?->id;

        return [
            'payment_settings' => PaymentSetting::getUserSettings($superAdminId),
            'general_settings' => Setting::getUserSettings($superAdminId),
            'super_admin_id' => $superAdminId
        ];
    }
}

if (! function_exists('validatePaymentRequest')) {
    function validatePaymentRequest($request, $additionalRules = [])
    {
        $baseRules = [
            'plan_id' => 'required|exists:plans,id',
            'billing_cycle' => 'required|in:monthly,yearly',
            'coupon_code' => 'nullable|string',
        ];

        return $request->validate(array_merge($baseRules, $additionalRules));
    }
}

if (! function_exists('handlePaymentError')) {
    function handlePaymentError($e, $method = 'payment')
    {
        return back()->withErrors(['error' => __('Payment processing failed: :message', ['message' => $e->getMessage()])]);
    }
}

if (! function_exists('defaultSettings')) {
    /**
     * Get default settings for System, Brand, Storage, and Currency configurations
     *
     * @return array
     */
    function defaultSettings()
    {
        return [
            // System Settings
            'defaultLanguage' => 'en',
            'dateFormat' => 'Y-m-d',
            'timeFormat' => 'H:i',
            'calendarStartDay' => 'sunday',
            'defaultTimezone' => 'UTC',
            'emailVerification' => false,
            'landingPageEnabled' => true,
            'registrationEnabled' => true,

            // Brand Settings
            'logoDark' => '/images/logos/logo-dark.png',
            'logoLight' => '/images/logos/logo-light.png',
            'favicon' => '/images/logos/favicon.png',
            'titleText' => 'WhatsStore',
            'footerText' => '© 2026 WhatsStore. All rights reserved.',
            'themeColor' => 'green',
            'customColor' => '#10b77f',
            'sidebarVariant' => 'inset',
            'sidebarStyle' => 'plain',
            'layoutDirection' => 'left',
            'themeMode' => 'light',

            // Storage Settings
            'storage_type' => 'local',
            'storage_file_types' => 'jpg,png,webp,gif,pdf,doc,docx,txt,csv',
            'storage_max_upload_size' => '2048',
            'aws_access_key_id' => '',
            'aws_secret_access_key' => '',
            'aws_default_region' => 'us-east-1',
            'aws_bucket' => '',
            'aws_url' => '',
            'aws_endpoint' => '',
            'wasabi_access_key' => '',
            'wasabi_secret_key' => '',
            'wasabi_region' => 'us-east-1',
            'wasabi_bucket' => '',
            'wasabi_url' => '',
            'wasabi_root' => '',

            // Currency Settings
            'decimalFormat' => '2',
            'defaultCurrency' => 'USD',
            'decimalSeparator' => '.',
            'thousandsSeparator' => ',',
            'floatNumber' => true,
            'currencySymbolSpace' => false,
            'currencySymbolPosition' => 'before',

            // Cookie Settings
            'enableLogging' => false,
            'strictlyNecessaryCookies' => true,
            'cookieTitle' => 'Cookie Consent',
            'strictlyCookieTitle' => 'Strictly Necessary Cookies',
            'cookieDescription' => 'We use cookies to enhance your browsing experience and provide personalized content.',
            'strictlyCookieDescription' => 'These cookies are essential for the website to function properly.',
            'contactUsDescription' => 'If you have any questions about our cookie policy, please contact us.',
            'contactUsUrl' => 'https://example.com/contact',
        ];
    }
}

if (! function_exists('createDefaultSettings')) {
    function createDefaultSettings($userId)
    {
        if (Setting::where('user_id', $userId)->exists()) {
            return;
        }

        $defaults = defaultSettings();
        $settingsData = [];

        foreach ($defaults as $key => $value) {
            $settingsData[] = [
                'user_id' => $userId,
                'key' => $key,
                'value' => is_bool($value) ? ($value ? '1' : '0') : (string)$value,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        Setting::insert($settingsData);
    }
}

if (! function_exists('copySettingsFromSuperAdmin')) {
    /**
     * Copy system and brand settings from superadmin to company user
     *
     * @param int $companyUserId
     * @return void
     */
    function copySettingsFromSuperAdmin($companyUserId, $companyUserCurrentStore = null)
    {
        $superAdmin = User::where('type', 'superadmin')->first();
        if (!$superAdmin) {
            createDefaultSettings($companyUserId);
            return;
        }

        // Settings to copy from superadmin (system and brand settings only)
        $settingsToCopy = [
            'defaultLanguage',
            'dateFormat',
            'timeFormat',
            'calendarStartDay',
            'defaultTimezone',
            'logoDark',
            'logoLight',
            'favicon',
            'titleText',
            'footerText',
            'themeColor',
            'customColor',
            'sidebarVariant',
            'sidebarStyle',
            'layoutDirection',
            'themeMode'
        ];

        $superAdminSettings = Setting::where('user_id', $superAdmin->id)
            ->whereIn('key', $settingsToCopy)
            ->get();

        $settingsData = [];

        // Only copy existing superadmin settings
        foreach ($superAdminSettings as $setting) {
            Setting::updateOrCreate(
                [
                    'user_id' => $companyUserId,
                    'store_id' => $companyUserCurrentStore,
                    'key' => $setting->key
                ],
                ['value' => $setting->value]
            );
        }
    }
}

if (! function_exists('formatStoreCurrency')) {
    /**
     * Format currency using store-specific settings
     *
     * @param float|string $amount
     * @param int|null $userId
     * @param int|null $storeId
     * @return string
     */
    function formatStoreCurrency($amount, $userId = null, $storeId = null)
    {
        // Get user and store ID if not provided
        if (is_null($userId) && auth()->check()) {
            $userId = auth()->id();
            if (is_null($storeId) && auth()->user()->current_store) {
                $storeId = getCurrentStoreId(auth()->user());
            }
        }

        // Convert amount to float
        $numAmount = is_string($amount) ? (float)$amount : $amount;

        try {
            // Get store-specific currency settings
            $storeSettings = $storeId ? Setting::getUserSettings($userId, $storeId) : [];

            // Get currency code from store settings or fall back to global settings
            $currencyCode = $storeSettings['defaultCurrency'] ?? settings($userId)['defaultCurrency'] ?? 'USD';

            // Get currency details
            $currency = \App\Models\Currency::where('code', $currencyCode)->first();

            // Currency formatting settings
            $symbol = $currency ? $currency->symbol : '$';
            $position = $storeSettings['currencySymbolPosition'] ?? 'before';
            $decimals = (int)($storeSettings['decimalFormat'] ?? 2);
            $decimalSeparator = $storeSettings['decimalSeparator'] ?? '.';
            $thousandsSeparator = $storeSettings['thousandsSeparator'] ?? ',';

            // Format the number
            $formattedNumber = number_format($numAmount, $decimals, $decimalSeparator, $thousandsSeparator);

            // Return with currency symbol in correct position
            return $position === 'after'
                ? $formattedNumber . ' ' . $symbol
                : $symbol . ' ' . $formattedNumber;
        } catch (\Exception $e) {
            // Fallback to simple formatting
            return '$' . number_format($numAmount, 2);
        }
    }
}

if (! function_exists('formatCurrency')) {
    /**
     * Format currency based on store settings (matches TypeScript formatCurrency function)
     *
     * @param float|string $amount
     * @param array $storeSettings
     * @param array $currencies
     * @return string
     */
    function formatCurrency($amount, $storeSettings = [], $currencies = [])
    {
        $defaultCurrency = $storeSettings['defaultCurrency'] ?? 'USD';
        $decimalFormat = $storeSettings['decimalFormat'] ?? '2';
        $decimalSeparator = $storeSettings['decimalSeparator'] ?? '.';
        $thousandsSeparator = $storeSettings['thousandsSeparator'] ?? ',';
        $currencySymbolPosition = $storeSettings['currencySymbolPosition'] ?? 'before';
        $currencySymbolSpace = $storeSettings['currencySymbolSpace'] ?? false;
        $floatNumber = $storeSettings['floatNumber'] ?? true;

        // Convert amount to number
        $numAmount = is_string($amount) ? (float)$amount : $amount;
        if (is_nan($numAmount)) return '$0.00';

        // Get currency symbol
        $currency = null;
        foreach ($currencies as $curr) {
            if ($curr['code'] === $defaultCurrency) {
                $currency = $curr;
                break;
            }
        }
        $symbol = $currency['symbol'] ?? '$';

        // Handle float number setting
        $finalAmount = ($floatNumber === false || $floatNumber === '0')
            ? floor($numAmount)
            : $numAmount;

        // Format decimal places
        $decimalPlaces = (int)$decimalFormat ?: 2;
        $formattedNumber = number_format($finalAmount, $decimalPlaces, '.', '');

        // Split into integer and decimal parts
        $parts = explode('.', $formattedNumber);

        // Add thousands separator
        if ($thousandsSeparator && $thousandsSeparator !== 'none') {
            $parts[0] = preg_replace('/\B(?=(\d{3})+(?!\d))/', $thousandsSeparator, $parts[0]);
        }

        // Join with decimal separator
        $finalNumber = implode($decimalSeparator, $parts);

        // Add currency symbol with proper positioning and spacing
        $space = ($currencySymbolSpace === true || $currencySymbolSpace === '1') ? ' ' : '';

        return $currencySymbolPosition === 'after'
            ? $finalNumber . $space . $symbol
            : $symbol . $space . $finalNumber;
    }
}

if (! function_exists('getCurrentStoreId')) {
    /**
     * Get the current store ID, handling both demo and production modes
     *
     * @param \App\Models\User|null $user
     * @return int|null
     */
    function getCurrentStoreId($user = null)
    {
        if (!$user) {
            $user = auth()->user();
        }

        if (!$user) {
            return null;
        }

        // Check if demo mode is enabled
        if (config('app.is_demo', false)) {
            // Demo mode: use cookie if available and valid
            if (request()->cookie('demo_store_id')) {
                $storeId = (int) request()->cookie('demo_store_id');

                // Verify the store belongs to the user or their creator
                $storeExists = false;
                if ($user->type === 'company') {
                    $storeExists = $user->stores->contains('id', $storeId);
                } elseif ($user->type === 'user' && $user->created_by) {
                    $creator = \App\Models\User::find($user->created_by);
                    if ($creator) {
                        $storeExists = $creator->stores->contains('id', $storeId);
                    }
                }

                if ($storeExists) {
                    return $storeId;
                }
            }
            // Fall back to database if no valid cookie
            return $user->current_store;
        } else {
            // Production mode: always use database current_store field
            return $user->current_store;
        }
    }
}

if (! function_exists('isSuperAdmin')) {
    /**
     * Check if the current user is a super admin
     *
     * @param \App\Models\User|null $user
     * @return bool
     */
    function isSuperAdmin($user = null)
    {
        if (!$user) {
            $user = auth()->user();
        }

        if (!$user) {
            return false;
        }

        return $user->isSuperAdmin();
    }
}

if (! function_exists('isCompanyUser')) {
    /**
     * Check if the current user is a company user
     *
     * @param \App\Models\User|null $user
     * @return bool
     */
    function isCompanyUser($user = null)
    {
        if (!$user) {
            $user = auth()->user();
        }

        if (!$user) {
            return false;
        }

        return $user->type === 'company';
    }
}

if (! function_exists('getWhatsStoreVersion')) {
    /**
     * Get WhatsStore application version
     *
     * @return string
     */
    function getWhatsStoreVersion()
    {
        return '1.0.0';
    }
}

if (! function_exists('getWhatsStoreStats')) {
    /**
     * Get basic WhatsStore statistics
     *
     * @return array
     */
    function getWhatsStoreStats()
    {
        try {
            return [
                'total_companies' => \App\Models\User::where('type', 'company')->count(),
                'total_stores' => \App\Models\Store::count(),
                'active_stores' => \App\Models\Store::count(),
                'total_plans' => \App\Models\Plan::count(),
                'active_plans' => \App\Models\Plan::where('is_plan_enable', 'on')->count(),
            ];
        } catch (\Exception $e) {
            return [
                'total_companies' => 0,
                'total_stores' => 0,
                'active_stores' => 0,
                'total_plans' => 0,
                'active_plans' => 0,
            ];
        }
    }
}

if (!function_exists('reactivateResources')) {
    /**
     * Reactivate resources when plan is upgraded
     */
    function reactivateResources($user)
    {
        if (!$user->plan) {
            return;
        }

        $plan = $user->plan;
        $maxStores = $plan->max_stores ?? 0;
        $maxUsersPerStore = $plan->max_users_per_store ?? 0;
        $maxProductsPerStore = $plan->max_products_per_store ?? 0;

        // Reactivate stores within new limit
        $allStores = $user->stores()->orderBy('created_at', 'asc')->take($maxStores)->get();
        foreach ($allStores as $store) {
            \App\Models\StoreConfiguration::updateOrCreate(
                ['store_id' => $store->id, 'key' => 'store_status'],
                ['value' => 'true']
            );
        }

        // Reactivate users within new limit for each active store
        foreach ($user->stores as $store) {
            $config = \App\Models\StoreConfiguration::getConfiguration($store->id);
            if (!($config['store_status'] ?? true)) continue;

            $deactivatedUsers = \App\Models\User::where('current_store', $store->id)
                ->where('type', '!=', 'company')
                ->where('status', 'inactive')
                ->orderBy('created_at', 'asc')
                ->limit($maxUsersPerStore)
                ->get();

            foreach ($deactivatedUsers as $storeUser) {
                $storeUser->update(['status' => 'active']);
            }
        }

        // Reactivate products within new limit for each active store
        if ($maxProductsPerStore > 0) {
            foreach ($user->stores as $store) {
                $config = \App\Models\StoreConfiguration::getConfiguration($store->id);
                if (!($config['store_status'] ?? true)) continue;

                $deactivatedProducts = \App\Models\Product::where('store_id', $store->id)
                    ->where('is_active', false)
                    ->orderBy('created_at', 'asc')
                    ->limit($maxProductsPerStore)
                    ->get();

                foreach ($deactivatedProducts as $product) {
                    $product->update(['is_active' => true]);
                }
            }
        }
    }
}

if (!function_exists('enforcePlanLimitations')) {
    /**
     * Enforce plan limitations when plan changes
     */
    function enforcePlanLimitations($user)
    {
        if (!$user->plan) {
            return;
        }

        $plan = $user->plan;
        $maxStores = $plan->max_stores ?? 0;
        $maxUsersPerStore = $plan->max_users_per_store ?? 0;
        $maxProductsPerStore = $plan->max_products_per_store ?? 0;

        // Enforce store limitations
        $stores = $user->stores()->orderBy('created_at', 'asc')->get();
        $activeCount = 0;
        foreach ($stores as $store) {
            $config = \App\Models\StoreConfiguration::getConfiguration($store->id);
            if ($config['store_status'] ?? true) {
                $activeCount++;
                if ($activeCount > $maxStores) {
                    \App\Models\StoreConfiguration::updateOrCreate(
                        ['store_id' => $store->id, 'key' => 'store_status'],
                        ['value' => 'false']
                    );
                }
            }
        }

        // Enforce user limitations per store (only for active stores)
        foreach ($user->stores as $store) {
            $config = \App\Models\StoreConfiguration::getConfiguration($store->id);
            if (!($config['store_status'] ?? true)) continue;

            $storeUsers = \App\Models\User::where('current_store', $store->id)
                ->where('type', '!=', 'company')
                ->where('status', 'active')
                ->orderBy('created_at', 'desc')
                ->get();

            if ($storeUsers->count() > $maxUsersPerStore) {
                $usersToDeactivate = $storeUsers->skip($maxUsersPerStore);
                foreach ($usersToDeactivate as $storeUser) {
                    $storeUser->update(['status' => 'inactive']);
                }
            }
        }

        // Enforce product limitations per store (only for active stores)
        if ($maxProductsPerStore > 0) {
            foreach ($user->stores as $store) {
                $config = \App\Models\StoreConfiguration::getConfiguration($store->id);
                if (!($config['store_status'] ?? true)) continue;

                $products = \App\Models\Product::where('store_id', $store->id)
                    ->where('is_active', true)
                    ->orderBy('created_at', 'desc')
                    ->get();

                if ($products->count() > $maxProductsPerStore) {
                    $productsToDeactivate = $products->skip($maxProductsPerStore);
                    foreach ($productsToDeactivate as $product) {
                        $product->update(['is_active' => false]);
                    }
                }
            }
        }

        // Enforce theme limitations
        $allowedThemes = $user->getAvailableThemes();
        if (is_array($allowedThemes) && !empty($allowedThemes)) {
            $defaultTheme = $allowedThemes[0] ?? 'gadgets';
            $user->stores()->whereNotIn('theme', $allowedThemes)->update(['theme' => $defaultTheme]);
        }
    }
}

if (!function_exists('isPlanUpgrade')) {
    /**
     * Check if new plan is an upgrade from old plan
     */
    function isPlanUpgrade($oldPlan, $newPlan)
    {
        if (!$oldPlan || !$newPlan) {
            return false;
        }

        return (
            ($newPlan->max_stores ?? 0) > ($oldPlan->max_stores ?? 0) ||
            ($newPlan->max_users_per_store ?? 0) > ($oldPlan->max_users_per_store ?? 0) ||
            ($newPlan->max_products_per_store ?? 0) > ($oldPlan->max_products_per_store ?? 0)
        );
    }
}

// Domain Helper Functions
if (!function_exists('getStoreUrl')) {
    /**
     * Get store URL based on domain configuration
     */
    function getStoreUrl($store)
    {
        if (!$store) {
            return url('/');
        }

        return $store->getStoreUrl();
    }
}



if (!function_exists('isCustomDomain')) {
    /**
     * Check if current request is on custom domain
     */
    function isCustomDomain($host = null)
    {
        if (!$host) {
            $host = request()->getHost();
        }

        // Check custom domain
        $customDomain = \App\Models\Store::where('custom_domain', $host)
            ->where('enable_custom_domain', true)
            ->whereHas('configurations', function ($q) {
                $q->where('key', 'store_status')->where('value', 'true');
            })->exists();

        // Also check stores without configuration (default active)
        if (!$customDomain) {
            $customDomain = \App\Models\Store::where('custom_domain', $host)
                ->where('enable_custom_domain', true)
                ->whereDoesntHave('configurations', function ($q) {
                    $q->where('key', 'store_status');
                })->exists();
        }

        if ($customDomain) {
            return true;
        }

        // Check custom subdomain
        if (str_contains($host, '.')) {
            $subdomain = explode('.', $host)[0];
            $subdomainExists = \App\Models\Store::where('custom_subdomain', $subdomain)
                ->where('enable_custom_subdomain', true)
                ->whereHas('configurations', function ($q) {
                    $q->where('key', 'store_status')->where('value', 'true');
                })->exists();

            // Also check stores without configuration (default active)
            if (!$subdomainExists) {
                $subdomainExists = \App\Models\Store::where('custom_subdomain', $subdomain)
                    ->where('enable_custom_subdomain', true)
                    ->whereDoesntHave('configurations', function ($q) {
                        $q->where('key', 'store_status');
                    })->exists();
            }

            return $subdomainExists;
        }

        return false;
    }
}

if (!function_exists('getCurrentStore')) {
    /**
     * Get current store from request
     */
    function getCurrentStore()
    {
        return request()->attributes->get('resolved_store');
    }
}



if (!function_exists('isCustomDomainRequest')) {
    /**
     * Check if current request is from custom domain
     */
    function isCustomDomainRequest(): bool
    {
        $store = getCurrentStore();
        return $store && ($store->enable_custom_domain || $store->enable_custom_subdomain);
    }
}

if (!function_exists('storeUrl')) {
    /**
     * Generate store URL with custom domain support
     */
    function storeUrl($store, $path = '', $parameters = [])
    {
        if (is_string($store)) {
            $store = \App\Models\Store::where('slug', $store)->first();
        }

        if (!$store) {
            return url($path);
        }

        return $store->route($path, $parameters);
    }
}




if (! function_exists('assignPlanToUser')) {
    function assignPlanToUser($user, $plan, $billingCycle)
    {
        $expiresAt = $billingCycle === 'yearly' ? now()->addYear() : now()->addMonth();

        $oldPlan = $user->plan;

        try {
            DB::beginTransaction();

            $updated = $user->update([
                // 'plan_id' => $plan->id,
                // 'plan_duration' => $billingCycle,
                // 'plan_expire_date' => $expiresAt,
                // 'plan_is_active' => 1,
                // 'is_trial' => 0,
                // 'trial_expire_date' => null,

                'plan_id' => $plan->id,
                'plan_duration' => $billingCycle,
                'plan_expire_date' => $expiresAt,
                'plan_is_active' => 1,
                'is_trial' => $user->is_trial == 1 ? 0 : $user->is_trial,
                'trial_expire_date' => null,
                'trial_day' => 0,
            ]);

            if ($updated) {
                $user = $user->fresh();

                // Create referral record if user was referred
                if (class_exists('\App\Http\Controllers\ReferralController')) {
                    \App\Http\Controllers\ReferralController::createReferralRecord($user, $billingCycle);
                }

                // If upgrading (higher limits), reactivate resources first
                if ($oldPlan && isPlanUpgrade($oldPlan, $plan)) {
                    reactivateResources($user);
                }

                // Then enforce current plan limitations
                enforcePlanLimitations($user);
            }

            \DB::commit();
            return $updated;
        } catch (\Exception $e) {
            \DB::rollback();
            \Log::error('Plan assignment failed: ' . $e->getMessage());
            throw $e;
        }
    }
}

if (! function_exists('getPWAIconUrl')) {
    /**
     * Get PWA icon URL with proper fallback chain
     * Priority: Store favicon > Company store favicon > Store logo > Default
     */
    function getPWAIconUrl($store)
    {
        // Get store configuration
        $storeConfig = \App\Models\StoreConfiguration::getConfiguration($store->id);

        // Priority 1: Store favicon from store_configuration
        if (!empty($storeConfig['favicon'])) {
            return asset($storeConfig['favicon']);
        }

        // Priority 2: Company favicon for this store (settings table with store_id)
        if ($store->user) {
            $userSettings = \App\Models\Setting::getUserSettings($store->user->id, $store->id);
            if (!empty($userSettings['favicon'])) {
                return asset($userSettings['favicon']);
            }
        }

        // Priority 3: Store logo
        if (!empty($storeConfig['logo'])) {
            return asset($storeConfig['logo']);
        }

        // Priority 4: Default logo (check if exists, otherwise use fallback)
        $defaultPath = public_path('images/logos/favicon.png');
        if (file_exists($defaultPath)) {
            return asset('images/logos/favicon.png');
        }

        return null;
    }
}

if (! function_exists('generatePWAIcons')) {
    /**
     * Generate PWA icons array with optimized fallback chain
     */
    function generatePWAIcons($store)
    {
        // PWA standard sizes - we use the dynamic route to ensure perfect compatibility
        $sizes = [72, 96, 128, 144, 152, 192, 256, 384, 512];
        $icons = [];

        foreach ($sizes as $size) {
            $icons[] = [
                'src' => route('store.pwa.icon', ['storeSlug' => $store->slug, 'size' => $size]),
                'sizes' => $size . 'x' . $size,
                'type' => 'image/png',
                'purpose' => 'any maskable'
            ];
        }

        return $icons;
    }
}

if (! function_exists('getSuperadminId')) {
    function getSuperadminId()
    {
        if (request()->is('install*') || request()->is('update*') || request()->is('installer*') || !file_exists(storage_path('installed'))) {
            return null;
        }

        static $superadminId = null;
        if ($superadminId === null) {
            $superAdmin = User::where('type', 'superadmin')->first();
            $superadminId = $superAdmin?->id;
        }
        return $superadminId;
    }
}

if (! function_exists('getCurrencySettings')) {
    function getCurrencySettings($userId = null, $storeId = null)
    {
        if (request()->is('install*') || request()->is('update*') || request()->is('installer*') || !file_exists(storage_path('installed'))) {
            return defaultSettings();
        }

        if (is_null($userId)) {
            if (auth()->user()) {
                $user = auth()->user();
                if ($user->type === 'superadmin') {
                    $userId = $user->id;
                    $storeId = null;
                } elseif ($user->type === 'company') {
                    $userId = $user->id;
                    $storeId = $storeId ?: getCurrentStoreId($user);
                } else {
                    $userId = $user->created_by;
                    $companyUser = User::find($user->created_by);
                    $storeId = $storeId ?: ($companyUser ? getCurrentStoreId($companyUser) : null);
                }
            } else {
                $superadminId = getSuperadminId();
                $userId = $superadminId;
                $storeId = null;
            }
        }

        if (!$userId) {
            return defaultSettings();
        }

        if ($storeId) {
            $storeSettings = Setting::where('user_id', $userId)
                ->where('store_id', $storeId)
                ->pluck('value', 'key')
                ->toArray();
            if (!empty($storeSettings)) {
                return array_merge(defaultSettings(), $storeSettings);
            }
        }

        $userSettings = Setting::where('user_id', $userId)
            ->whereNull('store_id')
            ->pluck('value', 'key')
            ->toArray();
        if (!empty($userSettings)) {
            return array_merge(defaultSettings(), $userSettings);
        }

        if ($userId !== getSuperadminId()) {
            $superadminSettings = Setting::where('user_id', getSuperadminId())
                ->whereNull('store_id')
                ->pluck('value', 'key')
                ->toArray();
            if (!empty($superadminSettings)) {
                return array_merge(defaultSettings(), $superadminSettings);
            }
        }

        return defaultSettings();
    }
}

if (! function_exists('formatCurrencyAmount')) {
    function formatCurrencyAmount($amount, $userId = null, $storeId = null)
    {
        // Always use superadmin settings for plan prices
        $superadminId = getSuperadminId();
        $settings = getCurrencySettings($superadminId, null);
        $currencies = Currency::all()->map(function ($currency) {
            return [
                'code' => $currency->code,
                'symbol' => $currency->symbol,
                'name' => $currency->name
            ];
        })->toArray();

        return formatCurrency($amount, $settings, $currencies);
    }
}

if (! function_exists('get_file')) {
    /**
     * Get the correct URL for a file based on active storage disk
     */
    function get_file($path)
    {
        if (empty($path)) {
            return null;
        }

        // If path is already a full URL, return as is
        if (filter_var($path, FILTER_VALIDATE_URL)) {
            return $path;
        }

        \App\Services\DynamicStorageService::configureDynamicDisks();
        $disk = \App\Services\StorageConfigService::getActiveDisk();

        try {
            if ($disk === 'public') {
                $baseUrl = rtrim(config('app.url'), '/');
                $path = ltrim($path, '/');
                if (strpos($path, 'storage/') !== false) {
                    return $baseUrl . '/' . $path;
                }
                return $baseUrl . '/storage/' . $path;
            }

            return \Illuminate\Support\Facades\Storage::disk($disk)->url($path);
        } catch (\Exception $e) {
            // Fallback to local public url
            $baseUrl = rtrim(config('app.url'), '/');
            $path = ltrim($path, '/');
            if (strpos($path, 'storage/') !== false) {
                return $baseUrl . '/' . $path;
            }
            return $baseUrl . '/storage/' . $path;
        }
    }
}

if (!function_exists('parseBrowserData')) {
    function parseBrowserData(string $userAgent): array
    {
        $browser = 'Unknown';
        $os = 'Unknown';
        $deviceType = 'desktop';

        // Browser detection
        if (preg_match('/Chrome\/([0-9.]+)/', $userAgent)) {
            $browser = 'Chrome';
        } elseif (preg_match('/Firefox\/([0-9.]+)/', $userAgent)) {
            $browser = 'Firefox';
        } elseif (preg_match('/Safari\/([0-9.]+)/', $userAgent) && !preg_match('/Chrome/', $userAgent)) {
            $browser = 'Safari';
        } elseif (preg_match('/Edge\/([0-9.]+)/', $userAgent)) {
            $browser = 'Edge';
        }

        // OS detection
        if (preg_match('/Windows NT/', $userAgent)) {
            $os = 'Windows';
        } elseif (preg_match('/Mac OS X/', $userAgent)) {
            $os = 'macOS';
        } elseif (preg_match('/Linux/', $userAgent)) {
            $os = 'Linux';
        } elseif (preg_match('/Android/', $userAgent)) {
            $os = 'Android';
            $deviceType = 'mobile';
        } elseif (preg_match('/iPhone|iPad/', $userAgent)) {
            $os = 'iOS';
            $deviceType = preg_match('/iPad/', $userAgent) ? 'tablet' : 'mobile';
        }

        return [
            'browser_name' => $browser,
            'os_name' => $os,
            'browser_language' => 'en',
            'device_type' => $deviceType,
        ];
    }
}
