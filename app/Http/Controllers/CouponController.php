<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use App\Http\Requests\CouponRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CouponController extends BaseController
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Coupon::with('creator');

        // Apply search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        // Apply filters
        if ($request->has('type') && $request->type !== 'all' && $request->type !== '_empty_' && $request->type !== '') {
            $query->where('type', $request->type);
        }

        // Calculate counts
        $statusCounts = [
            'all' => (clone $query)->count(),
            'active' => (clone $query)->where('status', 1)->count(),
            'inactive' => (clone $query)->where('status', 0)->count(),
        ];

        if ($request->has('status') && $request->status !== 'all' && $request->status !== '' && $request->status !== '_empty_') {
            $query->where('status', $request->status);
        }

        // Apply sorting
        $sortField = $request->input('sort_field', 'id');
        $sortDirection = $request->input('sort_direction', 'desc');
        if (!in_array(strtolower($sortDirection), ['asc', 'desc'])) {
            $sortDirection = 'desc';
        }

        // Validate sort field
        if (!in_array($sortField, ['name', 'type', 'code', 'expiry_date', 'status', 'id'])) {
            $sortField = 'id';
        }

        // In demo mode: show coupons with usage history first
        // if (config('app.is_demo', false)) {
        //     $firstCouponId = (int) (Coupon::orderBy('id')->value('id') ?? 1);
        //     $query->orderByRaw(
        //         "CASE 
        //             WHEN (SELECT count(*) FROM plan_orders WHERE plan_orders.coupon_id = coupons.id) > 0 THEN 0 
        //             WHEN id = {$firstCouponId} THEN 1 
        //             ELSE 2 
        //         END ASC"
        //     );
        // }

        $query->orderBy($sortField, $sortDirection);

        $perPage = $request->get('per_page', 10);
        $coupons = $query->paginate($perPage)->withQueryString();

        return Inertia::render('coupons/index', [
            'coupons' => $coupons,
            'statusCounts' => $statusCounts,
            'filters' => $request->only(['search', 'type', 'status', 'sort_field', 'sort_direction', 'per_page'])
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Coupon $coupon)
    {
        $coupon->load('creator');

        $hasRealOrders = \App\Models\PlanOrder::where('coupon_id', $coupon->id)->exists();
        $firstCouponId = (int) (Coupon::orderBy('id')->value('id') ?? 1);

        if (config('app.is_demo', false)) {
        // if (config('app.is_demo', false) && !$hasRealOrders && ($coupon->id == $firstCouponId || $coupon->id == 1)) {
            // Mock usage data for demo mode
            $usageHistory = collect([
                [
                    'id' => 1,
                    'user_name' => 'John Doe',
                    'user_email' => 'john@example.com',
                    'user_avatars' => '/storage/media/avatars/boys25.png',
                    'order_id' => 'ORD-001',
                    'amount' => 100.00,
                    'discount_amount' => 10.00,
                    'used_at' => now()->subDays(2)->toISOString()
                ],
                [
                    'id' => 2,
                    'user_name' => 'Jane Smith',
                    'user_email' => 'jane@example.com',
                    'user_avatars' => '/storage/media/avatars/boys24.png',
                    'order_id' => 'ORD-002',
                    'amount' => 150.00,
                    'discount_amount' => 15.00,
                    'used_at' => now()->subDays(1)->toISOString()
                ]
            ]);

            $perPage = $request->get('per_page', 10);
            $page = (int) $request->get('page', 1);
            $total = $usageHistory->count();
            $items = $usageHistory->forPage($page, $perPage)->values();

            $paginatedUsage = new \Illuminate\Pagination\LengthAwarePaginator(
                $items,
                $total,
                $perPage,
                $page,
                ['path' => $request->url(), 'pageName' => 'page']
            );

            $coupon->used_count = $usageHistory->count();
        } else {
            // Fetch real usage history from plan_orders
            $perPage = $request->get('per_page', 10);

            $query = \App\Models\PlanOrder::with('user')
                ->where('coupon_id', $coupon->id);

            $paginatedOrders = $query->latest('ordered_at')->paginate($perPage);

            $coupon->used_count = \App\Models\PlanOrder::where('coupon_id', $coupon->id)->count();

            $transformedItems = $paginatedOrders->getCollection()->map(function ($order) {
                return [
                    'id' => $order->id,
                    'user_name' => $order->user ? $order->user->name : __('Unknown User'),
                    'user_email' => $order->user ? $order->user->email : '-',
                    'user_avatars' => $order->user?->avatar ? $order->user->avatar : null,
                    'order_id' => $order->order_number ?? ('ORD-' . $order->id),
                    'amount' => (float) ($order->original_price ?? 0),
                    'discount_amount' => (float) ($order->discount_amount ?? 0),
                    'used_at' => $order->ordered_at ? $order->ordered_at->toISOString() : ($order->created_at ? $order->created_at->toISOString() : now()->toISOString())
                ];
            });

            $paginatedUsage = new \Illuminate\Pagination\LengthAwarePaginator(
                $transformedItems,
                $paginatedOrders->total(),
                $paginatedOrders->perPage(),
                $paginatedOrders->currentPage(),
                ['path' => $request->url(), 'pageName' => 'page']
            );
        }

        return Inertia::render('coupons/show', [
            'coupon' => $coupon,
            'usage_history' => $paginatedUsage
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(CouponRequest $request)
    {

        $data = $request->all();
        $data['created_by'] = Auth::id();

        // Generate code if auto-generate is selected
        if ($request->code_type === 'auto') {
            do {
                $data['code'] = strtoupper(Str::random(8));
            } while (Coupon::where('code', $data['code'])->exists());
        }

        $coupon = Coupon::create($data);

        return redirect()->route('coupons.index')->with('success', __('Coupon created successfully!'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(CouponRequest $request, Coupon $coupon)
    {

        $data = $request->all();

        // Generate new code if switching to auto-generate
        if ($request->code_type === 'auto' && $coupon->code_type !== 'auto') {
            do {
                $data['code'] = strtoupper(Str::random(8));
            } while (Coupon::where('code', $data['code'])->where('id', '!=', $coupon->id)->exists());
        }

        $coupon->update($data);

        return redirect()->route('coupons.index')->with('success', __('Coupon updated successfully!'));
    }

    /**
     * Validate coupon code
     */
    public function validate(Request $request)
    {
        $request->validate([
            'coupon_code' => 'required|string',
            'plan_id' => 'required|integer',
            'amount' => 'required|numeric|min:0'
        ]);
        
        $coupon = Coupon::where('code', $request->coupon_code)
            ->where('status', 1)
            ->first();
            
        if (!$coupon) {
            return response()->json([
                'valid' => false,
                'message' => __('Invalid or inactive coupon code')
            ], 400);
        }
        
        // Check if coupon is expired
        if ($coupon->expiry_date && $coupon->expiry_date < now()) {
            return response()->json([
                'valid' => false,
                'message' => __('Coupon has expired')
            ], 400);
        }
        
        // Check usage limit
        if ($coupon->use_limit_per_coupon && $coupon->used_count >= $coupon->use_limit_per_coupon) {
            return response()->json([
                'valid' => false,
                'message' => __('Coupon usage limit exceeded')
            ], 400);
        }
        
        // Check minimum amount
        if ($coupon->minimum_spend && $request->amount < $coupon->minimum_spend) {
            return response()->json([
                'valid' => false,
                'message' => __('Minimum spend requirement not met')
            ], 400);
        }
        
        return response()->json([
            'valid' => true,
            'coupon' => [
                'id' => $coupon->id,
                'code' => $coupon->code,
                'type' => $coupon->type,
                'value' => $coupon->discount_amount
            ]
        ]);
    }

    /**
     * Toggle the status of the specified coupon.
     */
    public function toggleStatus(Coupon $coupon)
    {
        $coupon->update([
            'status' => !$coupon->status
        ]);

        return redirect()->back()->with('success', __('Coupon status updated successfully!'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Coupon $coupon)
    {
        $coupon->delete();

        return redirect()->route('coupons.index')->with('success', __('Coupon deleted successfully!'));
    }
}
