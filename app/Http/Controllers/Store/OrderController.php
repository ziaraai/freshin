<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Services\OrderService;
use App\Services\CartCalculationService;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    protected $orderService;

    public function __construct(OrderService $orderService)
    {
        $this->orderService = $orderService;
    }

    public function placeOrder(Request $request, $storeSlug)
    {
        $store = $request->attributes->get('resolved_store')
            ?? \App\Models\Store::where('slug', $storeSlug)->firstOrFail();
        try {
            $validationRules = [
                'store_id' => ['required', 'integer', \Illuminate\Validation\Rule::in([$store->id])],
                'delivery_date' => 'nullable|date_format:Y-m-d',
                'customer_first_name' => 'required|string|max:255',
                'customer_last_name' => 'required|string|max:255',
                'customer_email' => 'required|email|max:255',
                'customer_phone' => 'nullable|string|max:20',
                'shipping_address' => 'required|string|max:255',
                'shipping_city' => 'required|max:100',
                'shipping_state' => 'required|max:100',
                'shipping_postal_code' => 'required|string|max:20',
                'shipping_country' => 'required|max:100',
                'billing_address' => 'required|string|max:255',
                'billing_city' => 'required|max:100',
                'billing_state' => 'required|max:100',
                'billing_postal_code' => 'required|string|max:20',
                'billing_country' => 'required|max:100',
                'payment_method' => 'required|in:stripe,cod',
                'shipping_method_id' => 'nullable|exists:shippings,id',
                'notes' => 'nullable|string',
                'coupon_code' => 'nullable|string',
            ];
            
            $validator = \Validator::make($request->all(), $validationRules);
            
            if ($validator->fails()) {
                if ($request->expectsJson() || $request->ajax()) {
                    return response()->json([
                        'success' => false,
                        'message' => $validator->errors()->first(),
                        'errors' => $validator->errors()
                    ], 422);
                }
                return back()->withErrors($validator)->withInput();
            }
            $configuration = \App\Models\StoreConfiguration::getConfiguration($store->id);
            $deliveryDate = app(\App\Services\OrderingSchedule::class)->validateOrder(
                $configuration['ordering_schedule'], $request->input('delivery_date')
            );

            // Get cart calculation
            $calculation = CartCalculationService::calculateCartTotals(
                $request->store_id,
                session()->getId(),
                $request->coupon_code,
                $request->shipping_method_id
            );

            if ($calculation['items']->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Your cart is empty'
                ], 400);
            }

            // Prepare order data
            $orderData = [
                'store_id' => $request->store_id,
                'customer_first_name' => $request->customer_first_name,
                'customer_last_name' => $request->customer_last_name,
                'customer_email' => $request->customer_email,
                'customer_phone' => $request->customer_phone,
                'shipping_address' => $request->shipping_address,
                'shipping_city' => $request->shipping_city,
                'shipping_state' => $request->shipping_state,
                'shipping_postal_code' => $request->shipping_postal_code,
                'shipping_country' => $request->shipping_country,
                'billing_address' => $request->billing_address,
                'billing_city' => $request->billing_city,
                'billing_state' => $request->billing_state,
                'billing_postal_code' => $request->billing_postal_code,
                'billing_country' => $request->billing_country,
                'subtotal' => $calculation['subtotal'],
                'tax_amount' => $calculation['tax'],
                'shipping_amount' => $calculation['shipping'],
                'discount_amount' => $calculation['discount'],
                'total_amount' => $calculation['total'],
                'payment_method' => $request->payment_method,
                'shipping_method_id' => $request->shipping_method_id,
                'notes' => $request->notes,
                'delivery_date' => $deliveryDate,
                'coupon_code' => $request->coupon_code,
                'coupon_discount' => $calculation['discount'],
            ];

            // Prepare cart items
            $cartItems = $calculation['items']->map(function ($item) {
                return [
                    'product_id' => $item->product_id,
                    'name' => $item->product->name,
                    'sku' => $item->product->sku,
                    'price' => $item->product->price,
                    'sale_price' => $item->product->sale_price,
                    'quantity' => $item->quantity,
                    'variants' => $item->variants,
                    'taxName' => $item->product->tax->name ?? NULL,
                    'taxPercentage' => $item->product->tax->rate ?? 0,
                    'taxType' => $item->product->tax->type ?? NULL,
                ];
            })->toArray();

            [$order, $paymentResult] = \Illuminate\Support\Facades\DB::transaction(function () use ($orderData, $cartItems, $calculation, $storeSlug) {
                $order = $this->orderService->createOrder($orderData, $cartItems);
                $paymentResult = $this->orderService->processPayment($order, $storeSlug);
                if (!$paymentResult['success']) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'payment_method' => $paymentResult['message'],
                    ]);
                }
                if ($calculation['coupon']) {
                    $calculation['coupon']->increment('used_count');
                }
                // Remove exactly the basket used for this order, after checkout succeeds.
                \App\Models\CartItem::whereIn('id', $calculation['items']->pluck('id'))->delete();

                return [$order, $paymentResult];
            });
            event(new \App\Events\OrderCreated($order));

            return response()->json([
                'success' => true,
                'redirect_url' => $paymentResult['checkout_url'] ?? null,
                'order_number' => $order->order_number,
                'message' => $paymentResult['message'],
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => $e->validator->errors()->first(),
                    'errors' => $e->validator->errors()
                ], 422);
            }
            throw $e;
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'The order could not be placed. Please try again.'
            ], 500);
        }
    }
}
