<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Stripe\Stripe;
use Stripe\Checkout\Session;

class OrderService
{
    public function createOrder(array $orderData, array $cartItems): Order
    {
        return DB::transaction(function () use ($orderData, $cartItems) {
            // Recheck at creation, before inventory, payment or cart mutations.
            $configuration = \App\Models\StoreConfiguration::getConfiguration($orderData['store_id']);
            $deliveryDate = app(OrderingSchedule::class)->validateOrder(
                $configuration['ordering_schedule'], $orderData['delivery_date'] ?? null
            );
            $store = \App\Models\Store::findOrFail($orderData['store_id']);
            $method = $orderData['payment_method'] ?? '';
            if (!in_array($method, ['stripe', 'cod'], true)) {
                throw \Illuminate\Validation\ValidationException::withMessages(['payment_method' => 'Choose Stripe or cash on delivery.']);
            }
            $paymentConfig = getPaymentMethodConfig($method, $store->user_id, $store->id);
            if (empty($paymentConfig['enabled']) || ($method === 'stripe' && (empty($paymentConfig['key']) || empty($paymentConfig['secret'])))) {
                throw \Illuminate\Validation\ValidationException::withMessages(['payment_method' => 'This payment method is not available. Please choose another method.']);
            }
            // Create the order
            $order = Order::create([
                'order_number' => Order::generateOrderNumber(),
                'store_id' => $orderData['store_id'],
                'customer_id' => Auth::guard('customer')->check() ? Auth::guard('customer')->id() : null,
                'session_id' => session()->getId(),
                'status' => 'pending',
                'payment_status' => 'pending',
                
                // Customer info
                'customer_email' => $orderData['customer_email'],
                'customer_phone' => $orderData['customer_phone'],
                'customer_first_name' => $orderData['customer_first_name'],
                'customer_last_name' => $orderData['customer_last_name'],
                
                // Shipping address
                'shipping_address' => $orderData['shipping_address'],
                'shipping_city' => $orderData['shipping_city'],
                'shipping_state' => $orderData['shipping_state'],
                'shipping_postal_code' => $orderData['shipping_postal_code'],
                'shipping_country' => $orderData['shipping_country'],
                
                // Billing address
                'billing_address' => $orderData['billing_address'],
                'billing_city' => $orderData['billing_city'],
                'billing_state' => $orderData['billing_state'],
                'billing_postal_code' => $orderData['billing_postal_code'],
                'billing_country' => $orderData['billing_country'],
                
                // Pricing
                'subtotal' => $orderData['subtotal'],
                'tax_amount' => $orderData['tax_amount'],
                'shipping_amount' => $orderData['shipping_amount'],
                'discount_amount' => $orderData['discount_amount'],
                'total_amount' => $orderData['total_amount'],
                
                // Payment info
                'payment_method' => $orderData['payment_method'],
                
                // Shipping info
                'shipping_method_id' => $orderData['shipping_method_id'] ?? null,
                'delivery_date' => $deliveryDate,
                
                // Additional info
                'notes' => $orderData['notes'] ?? null,
                'coupon_code' => $orderData['coupon_code'] ?? null,
                'coupon_discount' => $orderData['coupon_discount'] ?? 0,
            ]);

            // Create order items and update inventory
            foreach ($cartItems as $cartItem) {
                $unitPrice = $cartItem['sale_price'] ?? $cartItem['price'];
                
                // Check and update product inventory
                $product = Product::where('store_id', $store->id)->lockForUpdate()->findOrFail($cartItem['product_id']);
                if ($product) {
                    if ($product->stock < $cartItem['quantity']) {
                        throw new \Exception("Insufficient stock for product: {$cartItem['name']}");
                    }
                    
                    // Reduce product stock
                    $product->decrement('stock', $cartItem['quantity']);
                }
                
                // Calculate tax for this item
                $itemTotal = $unitPrice * $cartItem['quantity'];
                $taxAmount = 0;
                $taxName = null;
                $taxPercentage = null;
                
                if (isset($cartItem['taxPercentage']) && $cartItem['taxPercentage'] > 0) {
                    $taxPercentage = $cartItem['taxPercentage'];
                    $taxName = $cartItem['taxName'] ?? 'Tax';
                    $taxAmount = ($itemTotal * $taxPercentage) / 100;
                }
                
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $cartItem['product_id'],
                    'product_name' => $cartItem['name'],
                    'product_sku' => $cartItem['sku'] ?? null,
                    'product_price' => $cartItem['price'],
                    'quantity' => $cartItem['quantity'],
                    'product_variants' => $cartItem['variants'] ?? null,
                    'unit_price' => $unitPrice,
                    'total_price' => $itemTotal,
                    'tax_details' => json_encode([
                        'tax_name' => $taxName,
                        'tax_percentage' => $taxPercentage,
                        'tax_amount' => $taxAmount,
                    ]),
                ]);
            }

            return $order;
        });
    }

    public function processPayment(Order $order, ?string $storeSlug = null): array
    {
        return match ($order->payment_method) {
            'stripe' => $this->processStripePayment($order, $storeSlug),
            'cod' => $this->processCashOnDelivery($order),
            default => ['success' => false, 'message' => 'Choose Stripe or cash on delivery.'],
        };
    }

    private function processCashOnDelivery(Order $order): array
    {
        $order->update([
            'status' => 'pending',
            'payment_status' => 'pending',
        ]);

        return [
            'success' => true,
            'message' => 'Order placed successfully. Payment will be collected on delivery.',
            'order_id' => $order->id,
            'order_number' => $order->order_number,
        ];
    }

    private function processStripePayment(Order $order, ?string $storeSlug = null): array
    {
        try {
            // Get store owner's Stripe settings
            $storeModel = \App\Models\Store::find($order->store_id);
            if (!$storeModel || !$storeModel->user) {
                return ['success' => false, 'message' => 'Store configuration error'];
            }
            
            $stripeConfig = getPaymentMethodConfig('stripe', $storeModel->user->id, $order->store_id);
            
            if (!$stripeConfig['enabled'] || !$stripeConfig['secret']) {
                return ['success' => false, 'message' => 'Stripe is not configured for this store'];
            }
            
            Stripe::setApiKey($stripeConfig['secret']);
            $settings = \App\Models\Setting::getUserSettings($storeModel->user_id, $order->store_id);
            $configuration = \App\Models\StoreConfiguration::getConfiguration($order->store_id);
            $currency = strtolower($settings['defaultCurrency'] ?? $configuration['default_currency']);
            
            // Always use /store/{slug} format - works on all domains
            $successUrl = $storeModel->route('stripe/success/' . $order->order_number);
            $cancelUrl = $storeModel->route('checkout');
            
            // Create checkout session
            $checkoutSession = Session::create([
                'payment_method_types' => ['card'],
                'line_items' => [[
                    'price_data' => [
                        'currency' => $currency,
                        'product_data' => [
                            'name' => "Order #{$order->order_number}",
                        ],
                        'unit_amount' => (int) round((float) $order->total_amount * 100),
                    ],
                    'quantity' => 1,
                ]],
                'mode' => 'payment',
                'success_url' => $successUrl,
                'cancel_url' => $cancelUrl,
                'metadata' => [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'store_id' => $order->store_id,
                    'delivery_date' => $order->delivery_date?->format('Y-m-d') ?? '',
                ],
            ]);
            
            $order->update([
                'payment_transaction_id' => $checkoutSession->id,
                'payment_details' => [
                    'checkout_session_id' => $checkoutSession->id,
                ],
            ]);
            
            return [
                'success' => true,
                'message' => 'Stripe checkout session created',
                'checkout_url' => $checkoutSession->url,
                'order_id' => $order->id,
                'order_number' => $order->order_number,
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Stripe checkout could not be started. Please try again.'
            ];
        }
    }

}
