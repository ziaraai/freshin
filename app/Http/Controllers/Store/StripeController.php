<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Stripe\Stripe;

class StripeController extends Controller
{
    public function success(Request $request, $storeSlug, $orderNumber)
    {
        $storeModel = $request->attributes->get('resolved_store')
            ?? \App\Models\Store::where('slug', $storeSlug)->firstOrFail();
        $order = Order::where('order_number', $orderNumber)
            ->where('store_id', $storeModel->id)
            ->where('payment_method', 'stripe')->firstOrFail();
        try {
            // Get store owner's Stripe settings
            if (!$storeModel || !$storeModel->user) {
                return redirect()->to($this->getStoreHomeUrl($storeModel, $storeSlug))
                    ->with('payment_status', 'failed')
                    ->withErrors(['error' => 'Store configuration error']);
            }
            
            $stripeConfig = getPaymentMethodConfig('stripe', $storeModel->user->id, $order->store_id);
            
            if (!$stripeConfig['enabled'] || !$stripeConfig['secret']) {
                return redirect()->to($this->getStoreHomeUrl($storeModel, $storeSlug))
                    ->with('payment_status', 'failed')
                    ->withErrors(['error' => 'Stripe is not configured']);
            }
            
            Stripe::setApiKey($stripeConfig['secret']);
            
            // Retrieve checkout session
            $sessionId = $order->payment_details['checkout_session_id'] ?? null;
            if (!$sessionId) {
                return redirect()->to($this->getStoreHomeUrl($storeModel, $storeSlug))
                    ->with('payment_status', 'failed')
                    ->withErrors(['error' => 'Invalid payment session']);
            }
            
            $session = \Stripe\Checkout\Session::retrieve($sessionId);
            
            if ($session->payment_status === 'paid') {
                $order->update([
                    'status' => 'confirmed',
                    'payment_status' => 'paid',
                    'payment_details' => array_merge($order->payment_details ?? [], [
                        'payment_intent_id' => $session->payment_intent,
                        'amount_total' => $session->amount_total,
                        'payment_status' => $session->payment_status,
                    ]),
                ]);
                
                return redirect()->to($this->getStoreHomeUrl($storeModel, $storeSlug))
                    ->with('payment_status', 'success')
                    ->with('order_number', $order->order_number)
                    ->with('success', 'Payment completed successfully!');
            } else {
                return redirect()->to($this->getStoreHomeUrl($storeModel, $storeSlug))
                    ->with('payment_status', 'failed')
                    ->withErrors(['error' => 'Payment was not completed']);
            }
            
        } catch (\Exception $e) {
            $storeModel = \App\Models\Store::where('slug', $storeSlug)->first();
            return redirect()->to($this->getStoreHomeUrl($storeModel, $storeSlug))
                ->with('payment_status', 'failed')
                ->withErrors(['error' => 'Payment verification failed. Please try again.']);
        }
    }
    
    /**
     * Get proper store home URL (custom domain or default)
     */
    private function getStoreHomeUrl($store, $storeSlug)
    {
        if (!$store) {
            return route('store.home', $storeSlug);
        }
        
        // If on custom domain, return root URL
        if ($store->isCurrentDomain()) {
            return $store->getStoreUrl();
        }
        
        // Otherwise use default route
        return route('store.home', $store->slug);
    }
}
