<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Models\User;
use App\Models\Setting;
use App\Models\PlanOrder;
use App\Models\PaymentSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Stripe\Stripe;
use Stripe\PaymentIntent;
use Illuminate\Support\Facades\Validator;

class StripePaymentController extends Controller
{
    public function processPayment(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'plan_id' => 'required|exists:plans,id',
            'billing_cycle' => 'required|in:monthly,yearly',
            'payment_method_id' => 'required|string',
            'cardholder_name' => 'required|string',
            'coupon_code' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }
        $validated = $validator->validated();

        try {
            $plan = Plan::findOrFail($request->plan_id);
            $user = auth()->user();

            // Calculate pricing
            $pricing = calculatePlanPricing($plan, $validated['coupon_code'] ?? null, $request->billing_cycle);
            $finalPrice = $pricing['final_price'];

            // Get Stripe settings
            $superAdminId = User::where('type', 'superadmin')->value('id');
            $stripeSettings = $superAdminId ? PaymentSetting::getUserSettings($superAdminId) : [];

            if (!filter_var($stripeSettings['is_stripe_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
                return back()->withErrors(['error' => __('Stripe payment is not enabled')]);
            }

            if (!isset($stripeSettings['stripe_secret']) || !isset($stripeSettings['stripe_key'])) {
                return back()->withErrors(['error' => __('Stripe not configured properly')]);
            }

            $stripeSecret = $stripeSettings['stripe_secret'];
            if (!str_starts_with($stripeSecret, 'sk_')) {
                return back()->withErrors(['error' => __('Invalid Stripe secret key format')]);
            }

            Stripe::setApiKey($stripeSecret);

            $paymentIntent = PaymentIntent::create([
                'amount' => (int) round($finalPrice * 100),
                'currency' => strtolower(Setting::getUserSettings($superAdminId)['defaultCurrency'] ?? 'gbp'),
                'payment_method' => $request->payment_method_id,
                'confirmation_method' => 'manual',
                'confirm' => true,
                'return_url' => route('plans.index'),
                'description' => 'Subscription to ' . $plan->name . ' plan (' . $request->billing_cycle . ')',
                'metadata' => [
                    'user_id' => $user->id,
                    'plan_id' => $plan->id,
                    'billing_cycle' => $request->billing_cycle,
                ],
            ]);

            if ($paymentIntent->status === 'succeeded') {
                processPaymentSuccess([
                    'user_id' => auth()->id(),
                    'plan_id' => $plan->id,
                    'billing_cycle' => $request->billing_cycle,
                    'payment_method' => 'stripe',
                    'status' => 'approved',
                    'coupon_code' => $validated['coupon_code'] ?? null,
                    'payment_id' => $paymentIntent->id,
                    'processed_at' => now(),
                ]);


                return back()->with('success', __('Payment successful! Your plan has been activated.'));
            }

            return back()->withErrors(['error' => __('Payment failed. Please try again.')]);
        } catch (\Stripe\Exception\CardException $e) {
            \Log::error('Stripe Card Exception: ' . $e->getMessage());
            return back()->withErrors(['error' => __('Card error: ') . $e->getError()->message]);
        } catch (\Stripe\Exception\InvalidRequestException $e) {
            \Log::error('Stripe Invalid Request: ' . $e->getMessage());
            return back()->withErrors(['error' => __('Invalid request: ') . $e->getMessage()]);
        } catch (\Exception $e) {
            \Log::error('Stripe payment error: ' . $e->getMessage() . ' | Trace: ' . $e->getTraceAsString());
            return back()->withErrors(['error' => __('Payment processing failed. Please try again.')]);
        }
    }
}
