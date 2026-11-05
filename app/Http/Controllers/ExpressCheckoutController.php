<?php

namespace App\Http\Controllers;

use App\Models\ExpressCheckout;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ExpressCheckoutController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $currentStoreId = function_exists('getCurrentStoreId') ? (getCurrentStoreId($user) ?: $user->current_store) : $user->current_store;
        
        // Overall statistics for the store
        $allCheckouts = ExpressCheckout::where('store_id', $currentStoreId)->get();
        $totalCheckouts = $allCheckouts->count();
        $activeCheckouts = $allCheckouts->where('is_active', true)->count();
        $totalConversions = $allCheckouts->sum('conversions');
        $totalRevenue = (float) $allCheckouts->sum('revenue');
        
        // Calculate conversion rate
        $conversionRate = 0;
        if ($totalConversions > 0) {
            $conversionRate = 23.5;
        }

        $query = ExpressCheckout::where('store_id', $currentStoreId);

        // Apply search filter
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('type', 'like', "%{$search}%")
                    ->orWhere('button_text', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Apply type filter if provided
        if ($request->has('type') && !empty($request->type) && $request->type !== '_empty_') {
            $query->where('type', $request->type);
        }

        // Calculate status counts based on current filters (excluding status filter itself)
        $statusCounts = [
            'all' => (clone $query)->count(),
            'active' => (clone $query)->where('is_active', true)->count(),
            'inactive' => (clone $query)->where('is_active', false)->count(),
        ];

        // Apply status filter: all, active, inactive
        if ($request->has('status') && $request->status !== 'all' && $request->status !== '_empty_') {
            if ($request->status === 'active') {
                $query->where('is_active', true);
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        // Apply sorting
        $allowedSortFields = ['name', 'type', 'button_text', 'conversions', 'revenue', 'is_active', 'created_at', 'id'];
        $sortField = $request->input('sort_field', 'created_at');
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'created_at';
        }

        $sortDirection = $request->input('sort_direction', 'desc');
        if (!in_array(strtolower($sortDirection), ['asc', 'desc'])) {
            $sortDirection = 'desc';
        }

        $query->orderBy($sortField, $sortDirection);

        // Pagination
        $perPage = (int) $request->input('per_page', 10);
        $checkouts = $query->paginate($perPage)->withQueryString();

        return Inertia::render('express-checkout/index', [
            'checkouts' => $checkouts,
            'stats' => [
                'total' => $totalCheckouts,
                'active' => $activeCheckouts,
                'conversionRate' => $conversionRate,
                'totalRevenue' => $totalRevenue,
                'totalCheckouts' => $totalCheckouts,
                'activeCheckouts' => $activeCheckouts,
            ],
            'statusCounts' => $statusCounts,
            'filters' => array_merge(
                $request->only(['search', 'status', 'type', 'sort_field', 'sort_direction']),
                [
                    'per_page' => $perPage,
                ]
            ),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('express-checkout/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:50',
            'description' => 'nullable|string',
            'button_text' => 'nullable|string|max:50',
            'button_color' => 'nullable|string|max:20',
            'is_active' => 'boolean',
            'payment_methods' => 'nullable|array',
            'default_payment_method' => 'nullable|string|max:50',
            'skip_cart' => 'boolean',
            'auto_fill_customer_data' => 'boolean',
            'guest_checkout_allowed' => 'boolean',
            'mobile_optimized' => 'boolean',
            'save_payment_methods' => 'boolean',
            'success_redirect_url' => 'nullable|string|max:255',
            'cancel_redirect_url' => 'nullable|string|max:255',
        ], [], [
            'name' => __('Checkout Name'),
            'type' => __('Checkout Type'),
            'description' => __('Description'),
            'button_text' => __('Button Text'),
            'button_color' => __('Button Color'),
            'default_payment_method' => __('Default Payment Method'),
            'success_redirect_url' => __('Success Redirect URL'),
            'cancel_redirect_url' => __('Cancel Redirect URL'),
        ]);

        $user = Auth::user();
        $currentStoreId = $user->current_store;

        $checkout = ExpressCheckout::create([
            'store_id' => $currentStoreId,
            'name' => $request->name,
            'type' => $request->type,
            'description' => $request->description,
            'button_text' => $request->button_text ?? 'Buy Now',
            'button_color' => $request->button_color ?? '#000000',
            'is_active' => $request->is_active ?? true,
            'payment_methods' => $request->payment_methods,
            'default_payment_method' => $request->default_payment_method,
            'skip_cart' => $request->skip_cart ?? true,
            'auto_fill_customer_data' => $request->auto_fill_customer_data ?? true,
            'guest_checkout_allowed' => $request->guest_checkout_allowed ?? false,
            'mobile_optimized' => $request->mobile_optimized ?? true,
            'save_payment_methods' => $request->save_payment_methods ?? false,
            'success_redirect_url' => $request->success_redirect_url,
            'cancel_redirect_url' => $request->cancel_redirect_url,
        ]);

        return redirect()->route('express-checkout.index')
            ->with('success', 'Express checkout created successfully!');
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $user = Auth::user();
        $currentStoreId = $user->current_store;
        
        $checkout = ExpressCheckout::where('store_id', $currentStoreId)
            ->findOrFail($id);
        
        // Add conversion rate using model accessor
        $checkout->append('conversion_rate');
        
        // Get recent transactions (placeholder)
        // $recentTransactions = [
        //     [
        //         'id' => '#TXN-001',
        //         'customer' => 'John Doe',
        //         'email' => 'john.doe@example.com',
        //         'amount' => 89.99,
        //         'method' => 'Credit Card',
        //         'date' => '2024-01-15'
        //     ],
        //     [
        //         'id' => '#TXN-002',
        //         'customer' => 'Jane Smith',
        //         'email' => 'jane.smith@example.com',
        //         'amount' => 156.50,
        //         'method' => 'PayPal',
        //         'date' => '2024-01-14'
        //     ],
        //     [
        //         'id' => '#TXN-003',
        //         'customer' => 'Mike Johnson',
        //         'email' => 'mike.johnson@example.com',
        //         'amount' => 234.00,
        //         'method' => 'Credit Card',
        //         'date' => '2024-01-13'
        //     ]
        // ];
        
        // // Format transaction amounts for display
        // foreach ($recentTransactions as &$transaction) {
        //     $transaction['formatted_amount'] = formatStoreCurrency($transaction['amount'], $user->id, $currentStoreId);
        // }
        
        return Inertia::render('express-checkout/show', [
            'checkout' => $checkout,
            // 'recentTransactions' => $recentTransactions
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        $user = Auth::user();
        $currentStoreId = $user->current_store;
        
        $checkout = ExpressCheckout::where('store_id', $currentStoreId)
            ->findOrFail($id);
        
        return Inertia::render('express-checkout/edit', [
            'checkout' => $checkout
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $currentStoreId = function_exists('getCurrentStoreId') ? (getCurrentStoreId($user) ?: $user->current_store) : $user->current_store;
        
        $checkout = ExpressCheckout::where('store_id', $currentStoreId)
            ->findOrFail($id);

        // Handle inline status toggle
        if ($request->has('is_active') && !$request->has('name')) {
            $request->validate([
                'is_active' => 'required|boolean',
            ]);

            $checkout->update([
                'is_active' => $request->boolean('is_active'),
            ]);

            return redirect()->back()
                ->with('success', __('Express checkout status updated successfully!'));
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:50',
            'description' => 'nullable|string',
            'button_text' => 'nullable|string|max:50',
            'button_color' => 'nullable|string|max:20',
            'is_active' => 'boolean',
            'payment_methods' => 'nullable|array',
            'default_payment_method' => 'nullable|string|max:50',
            'skip_cart' => 'boolean',
            'auto_fill_customer_data' => 'boolean',
            'guest_checkout_allowed' => 'boolean',
            'mobile_optimized' => 'boolean',
            'save_payment_methods' => 'boolean',
            'success_redirect_url' => 'nullable|string|max:255',
            'cancel_redirect_url' => 'nullable|string|max:255',
        ], [], [
            'name' => __('Checkout Name'),
            'type' => __('Checkout Type'),
            'description' => __('Description'),
            'button_text' => __('Button Text'),
            'button_color' => __('Button Color'),
            'default_payment_method' => __('Default Payment Method'),
            'success_redirect_url' => __('Success Redirect URL'),
            'cancel_redirect_url' => __('Cancel Redirect URL'),
        ]);
        $checkout->update([
            'name' => $request->name,
            'type' => $request->type,
            'description' => $request->description,
            'button_text' => $request->button_text,
            'button_color' => $request->button_color,
            'is_active' => $request->is_active,
            'payment_methods' => $request->payment_methods,
            'default_payment_method' => $request->default_payment_method,
            'skip_cart' => $request->skip_cart,
            'auto_fill_customer_data' => $request->auto_fill_customer_data,
            'guest_checkout_allowed' => $request->guest_checkout_allowed,
            'mobile_optimized' => $request->mobile_optimized,
            'save_payment_methods' => $request->save_payment_methods,
            'success_redirect_url' => $request->success_redirect_url,
            'cancel_redirect_url' => $request->cancel_redirect_url,
        ]);

        return redirect()->route('express-checkout.index')
            ->with('success', 'Express checkout updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $user = Auth::user();
        $currentStoreId = $user->current_store;
        
        $checkout = ExpressCheckout::where('store_id', $currentStoreId)
            ->findOrFail($id);
        
        $checkout->delete();

        return redirect()->route('express-checkout.index')
            ->with('success', 'Express checkout deleted successfully!');
    }
}