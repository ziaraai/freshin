<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function getMethods(Request $request)
    {
        $validated = $request->validate(['store_id' => 'required|exists:stores,id']);
        $store = Store::findOrFail($validated['store_id']);
        $methods = [];
        foreach (['stripe', 'cod'] as $method) {
            $config = getPaymentMethodConfig($method, $store->user_id, $store->id);
            if (empty($config['enabled']) || ($method === 'stripe' && (empty($config['key']) || empty($config['secret'])))) {
                continue;
            }
            $methods[] = [
                'name' => $method,
                'display_name' => $method === 'stripe' ? 'Credit/Debit Card (Stripe)' : 'Cash on Delivery',
                'description' => $method === 'stripe' ? 'Pay securely by card with Stripe.' : 'Pay when your meals are delivered.',
                'icon' => null,
                'form_fields' => null,
            ];
        }

        return response()->json(['payment_methods' => $methods]);
    }
}
