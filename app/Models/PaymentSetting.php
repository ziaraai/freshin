<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentSetting extends Model
{
    protected $fillable = ['user_id', 'store_id', 'key', 'value'];

    protected $casts = [
        'user_id' => 'integer',
        'store_id' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function setValueAttribute($value)
    {
        $this->attributes['value'] = is_bool($value) ? ($value ? '1' : '0') : $value;
    }

    public function getValueAttribute($value)
    {
        if (in_array($this->key, ['is_stripe_enabled', 'is_cod_enabled'], true)) {
            return filter_var($value, FILTER_VALIDATE_BOOLEAN);
        }

        return $value;
    }

    /** Settings for the owner's form; secrets and retired gateway settings stay server-side. */
    public static function settingsForDisplay($userId, $storeId = null): array
    {
        $settings = self::getUserSettings($userId, $storeId);
        $display = [
            'is_stripe_enabled' => filter_var($settings['is_stripe_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'stripe_key' => $settings['stripe_key'] ?? '',
            'stripe_secret' => empty($settings['stripe_secret']) ? '' : '********',
        ];
        if ($storeId !== null) {
            $display['is_cod_enabled'] = filter_var($settings['is_cod_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);
        }

        return $display;
    }

    public static function updateOrCreateSetting($userId, $key, $value, $storeId = null)
    {
        return self::updateOrCreate(
            ['user_id' => $userId, 'store_id' => $storeId, 'key' => $key],
            ['value' => $value]
        );
    }

    public static function getUserSettings($userId, $storeId = null)
    {
        if (!$userId) {
            return [];
        }
        
        // For company users, get store-specific settings; for superadmin, get user settings
        $query = self::where('user_id', $userId);
        
        if ($storeId !== null) {
            $query->where('store_id', $storeId);
        } else {
            $query->whereNull('store_id');
        }
        
        $settings = $query->pluck('value', 'key')->toArray();
        
        return $settings;
    }
}