<?php

namespace App\Http\Controllers;

use App\Models\Store;
use App\Models\StoreConfiguration;
use App\Models\Currency;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class StoreSettingsController extends Controller
{
    public function show($storeId)
    {
        if (!Auth::user()->can('settings-stores')) {
            return redirect()->back()->with('error', __('You do not have permission to access store settings.'));
        }
        
        $user = Auth::user();
        $storeQuery = $user->type === 'company' ? 
            Store::where('user_id', $user->id) : 
            Store::where('user_id', $user->created_by);
        $store = $storeQuery->findOrFail($storeId);
        $configuration = StoreConfiguration::getConfiguration($storeId);
        $currencies = Currency::select('code', 'name', 'symbol')->get();
        $timezones = config('timezones');
        
        return Inertia::render('stores/settings', [
            'store' => $store,
            'settings' => $configuration,
            'currencies' => $currencies,
            'timezones' => $timezones
        ]);
    }

    public function update(Request $request, $storeId)
    {
        if (!Auth::user()->can('settings-stores')) {
            return redirect()->back()->with('error', __('You do not have permission to update store settings.'));
        }
        
        $user = Auth::user();
        $storeQuery = $user->type === 'company' ? 
            Store::where('user_id', $user->id) : 
            Store::where('user_id', $user->created_by);
        $store = $storeQuery->findOrFail($storeId);
        
        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.custom_css' => 'nullable|string|max:50000',
            'settings.custom_javascript' => 'nullable|string|max:50000',
            'settings.ordering_schedule' => 'sometimes|required|array:enabled,timezone,open_days,opens_at,closes_at,delivery_days,advance_days',
            'settings.ordering_schedule.enabled' => 'required_with:settings.ordering_schedule|boolean',
            'settings.ordering_schedule.timezone' => 'required_with:settings.ordering_schedule|in:Europe/London',
            'settings.ordering_schedule.open_days' => 'required_with:settings.ordering_schedule|array|min:1|max:7',
            'settings.ordering_schedule.open_days.*' => 'required|integer|between:1,7|distinct',
            'settings.ordering_schedule.opens_at' => 'required_with:settings.ordering_schedule|date_format:H:i',
            'settings.ordering_schedule.closes_at' => 'required_with:settings.ordering_schedule|date_format:H:i|after:settings.ordering_schedule.opens_at',
            'settings.ordering_schedule.delivery_days' => 'required_with:settings.ordering_schedule|array|min:1|max:7',
            'settings.ordering_schedule.delivery_days.*' => 'required|integer|between:1,7|distinct',
            'settings.ordering_schedule.advance_days' => 'required_with:settings.ordering_schedule|integer|between:1,90',
        ]);
        
        // Get all settings from request (not just validated ones)
        $allSettings = $request->input('settings', []);
        
        // Validate WhatsApp widget settings only if enabled
        $whatsappEnabled = $request->input('settings.whatsapp_widget_enabled', false);
        
        if ($whatsappEnabled) {
            $phone = $request->input('settings.whatsapp_widget_phone', '');
            
            if (empty(trim($phone))) {
                return redirect()->back()->withErrors([
                    'whatsapp_widget_phone' => 'WhatsApp phone number is required when widget is enabled.'
                ])->withInput();
            }
            
            // Clean and validate phone number
            $cleanPhone = preg_replace('/[^0-9+]/', '', $phone);
            if (!str_starts_with($cleanPhone, '+')) {
                $cleanPhone = '+' . ltrim($cleanPhone, '0');
            }
            
            if (!preg_match('/^\+[1-9]\d{1,14}$/', $cleanPhone)) {
                return redirect()->back()->withErrors([
                    'whatsapp_widget_phone' => 'Invalid WhatsApp phone number. Use international format like +919876543210'
                ])->withInput();
            }
            
            $validated['settings']['whatsapp_widget_phone'] = $cleanPhone;
        }
        
        // Check if store_status is being enabled
        if (isset($validated['settings']['store_status']) && ($validated['settings']['store_status'] === 'true' || $validated['settings']['store_status'] === true)) {
            $companyUser = $user->type === 'company' ? $user : $user->creator;
            if ($companyUser && $companyUser->plan) {
                // Get current status from database
                $currentStatusRecord = StoreConfiguration::where('store_id', $storeId)
                    ->where('key', 'store_status')
                    ->first();
                $currentStatus = $currentStatusRecord ? ($currentStatusRecord->value === 'true') : true;
                
                // If currently disabled and trying to enable, check plan limits
                if (!$currentStatus) {
                    // Count currently active stores (excluding this one)
                    $activeStores = 0;
                    foreach ($companyUser->stores as $userStore) {
                        if ($userStore->id == $storeId) continue; // Skip current store
                        
                        $storeStatusRecord = StoreConfiguration::where('store_id', $userStore->id)
                            ->where('key', 'store_status')
                            ->first();
                        $storeStatus = $storeStatusRecord ? ($storeStatusRecord->value === 'true') : true;
                        
                        if ($storeStatus) {
                            $activeStores++;
                        }
                    }
                    
                    $maxStores = $companyUser->plan->max_stores ?? 0;
                    if ($activeStores >= $maxStores) {
                        return redirect()->back()->with('error', __('Cannot enable store. You have reached your plan limit of :max stores. Please upgrade your plan or disable another store first.', ['max' => $maxStores]));
                    }
                }
            }
        }

        // Use all settings instead of just validated ones
        $settingsToSave = array_merge($validated['settings'], $allSettings);
        if (isset($settingsToSave['ordering_schedule'])) {
            $schedule = $validated['settings']['ordering_schedule'];
            $schedule['enabled'] = (bool) $schedule['enabled'];
            $schedule['open_days'] = array_map('intval', $schedule['open_days']);
            $schedule['delivery_days'] = array_map('intval', $schedule['delivery_days']);
            $schedule['advance_days'] = (int) $schedule['advance_days'];
            $settingsToSave['ordering_schedule'] = $schedule;
        }
        
        StoreConfiguration::updateConfiguration($storeId, $settingsToSave);

        return redirect()->back()->with('success', 'Store configuration updated successfully.');
    }
}
