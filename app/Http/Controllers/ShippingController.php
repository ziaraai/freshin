<?php

namespace App\Http\Controllers;

use App\Models\Shipping;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ShippingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $currentStoreId = $user->current_store;
        
        // Overall statistics for the store
        $allShippings = Shipping::where('store_id', $currentStoreId)->get();
        $totalShippings = $allShippings->count();
        $activeShippings = $allShippings->where('is_active', true)->count();
        $shippingZones = $allShippings->pluck('zone_type')->unique()->filter()->count();
        $avgShippingCost = $allShippings->where('type', '!=', 'free_shipping')->avg('cost') ?? 0;

        $query = Shipping::where('store_id', $currentStoreId);

        // Apply search filter
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('type', 'like', "%{$search}%")
                    ->orWhere('zone_type', 'like', "%{$search}%")
                    ->orWhere('delivery_time', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Apply type filter
        if ($request->has('type') && !empty($request->type) && $request->type !== '_empty_') {
            $query->where('type', $request->type);
        }

        // Apply zone filter
        if ($request->has('zone_type') && !empty($request->zone_type) && $request->zone_type !== '_empty_') {
            $query->where('zone_type', $request->zone_type);
        }

        // Calculate status counts based on current search & type/zone filter (excluding status filter itself)
        $statusCounts = [
            'all' => (clone $query)->count(),
            'active' => (clone $query)->where('is_active', true)->count(),
            'inactive' => (clone $query)->where('is_active', false)->count(),
        ];

        // Apply status filter: only all, active, inactive
        if ($request->has('status') && $request->status !== 'all' && $request->status !== '_empty_') {
            if ($request->status === 'active') {
                $query->where('is_active', true);
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        // Apply sorting
        $allowedSortFields = ['sort_order', 'name', 'type', 'zone_type', 'cost', 'delivery_time', 'is_active', 'id', 'created_at'];
        $sortField = $request->input('sort_field', 'sort_order');
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'sort_order';
        }

        $sortDirection = $request->input('sort_direction', 'asc');
        if (!in_array(strtolower($sortDirection), ['asc', 'desc'])) {
            $sortDirection = 'asc';
        }

        $query->orderBy($sortField, $sortDirection);

        // Pagination
        $perPage = (int) $request->input('per_page', 10);
        $shippings = $query->paginate($perPage)->withQueryString();

        return Inertia::render('shipping/index', [
            'shippings' => $shippings,
            'stats' => [
                'totalShippings' => $totalShippings,
                'activeShippings' => $activeShippings,
                'shippingZones' => $shippingZones,
                'avgShippingCost' => round($avgShippingCost, 2)
            ],
            'statusCounts' => $statusCounts,
            'filters' => array_merge(
                $request->only(['search', 'status', 'type', 'zone_type', 'sort_field', 'sort_direction']),
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
        return Inertia::render('shipping/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:flat_rate,free_shipping,weight_based,distance_based,percentage_based',
            'description' => 'nullable|string',
            'cost' => 'nullable|numeric|min:0',
            'min_order_amount' => 'nullable|numeric|min:0',
            'delivery_time' => 'nullable|string|max:255',
            'sort_order' => 'nullable|integer',
            'is_active' => 'boolean',
            'zone_type' => 'nullable|string|in:domestic,international,local,regional',
            'countries' => 'nullable|string',
            'postal_codes' => 'nullable|string',
            'max_distance' => 'nullable|numeric|min:0',
            'max_weight' => 'nullable|numeric|min:0',
            'max_dimensions' => 'nullable|string',
            'require_signature' => 'boolean',
            'insurance_required' => 'boolean',
            'tracking_available' => 'boolean',
            'handling_fee' => 'nullable|numeric|min:0'
        ], [], [
            'name' => __('Shipping Method Name'),
            'type' => __('Shipping Type'),
            'cost' => __('Shipping Cost'),
            'zone_type' => __('Shipping Zone'),
        ]);

        $user = Auth::user();
        $currentStoreId = $user->current_store;

        $data = $request->all();
        $data['store_id'] = $currentStoreId;
        
        // If free shipping, set cost to 0
        if ($data['type'] === 'free_shipping') {
            $data['cost'] = 0;
        }

        Shipping::create($data);

        return redirect()->route('shipping.index')
            ->with('success', 'Shipping method created successfully!');
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $user = Auth::user();
        $currentStoreId = $user->current_store;
        
        $shipping = Shipping::where('store_id', $currentStoreId)
            ->findOrFail($id);
        
        // Increment view count
        $shipping->incrementViews();
        
        // Calculate dynamic shipping statistics from actual orders
        $orders = \App\Models\Order::where('store_id', $currentStoreId)
                                  ->where('shipping_method_id', $shipping->id)
                                  ->get();
        
        $totalOrders = $orders->count();
        $totalRevenue = $orders->sum('shipping_amount');
        $avgShippingCost = $totalOrders > 0 ? $totalRevenue / $totalOrders : 0;
        $recentOrders = $orders->where('created_at', '>=', now()->subDays(30))->count();
        $deliveredOrders = $orders->where('status', 'delivered')->count();
        $deliveryRate = $totalOrders > 0 ? ($deliveredOrders / $totalOrders) * 100 : 0;
        
        // Calculate average delivery time for delivered orders
        $avgDeliveryDays = 0;
        if ($deliveredOrders > 0) {
            $deliveryTimes = $orders->where('status', 'delivered')
                                   ->map(function($order) {
                                       return $order->created_at->diffInDays($order->updated_at);
                                   });
            $avgDeliveryDays = $deliveryTimes->avg();
        }
        
        $stats = [
            'total_orders' => $totalOrders,
            'total_revenue' => $totalRevenue,
            'avg_shipping_cost' => $avgShippingCost,
            'recent_orders' => $recentOrders,
            'delivered_orders' => $deliveredOrders,
            'delivery_rate' => $deliveryRate,
            'avg_delivery_days' => round($avgDeliveryDays, 1),
            'views' => $shipping->views ?? 0,
        ];
        
        // Get recent orders using this shipping method
        $recentOrdersList = $orders->take(5)->map(function($order) {
            return [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'customer_name' => $order->customer_first_name . ' ' . $order->customer_last_name,
                'customer_email' => $order->customer_email,
                'customer_avatar' => $order->customer->avatar ?? null,
                'shipping_cost' => $order->shipping_amount,
                'status' => $order->status,
                'date' => $order->created_at ? $order->created_at->toISOString() : null,
                'created_at' => $order->created_at
            ];
        });
        
        return Inertia::render('shipping/show', [
            'shipping' => $shipping,
            'stats' => $stats,
            'recentOrders' => $recentOrdersList
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        $user = Auth::user();
        $currentStoreId = $user->current_store;
        
        $shipping = Shipping::where('store_id', $currentStoreId)
            ->findOrFail($id);
        
        return Inertia::render('shipping/edit', [
            'shipping' => $shipping
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $currentStoreId = $user->current_store;
        
        $shipping = Shipping::where('store_id', $currentStoreId)
            ->findOrFail($id);

        // Handle inline status toggle
        if ($request->has('is_active') && !$request->has('name')) {
            $request->validate([
                'is_active' => 'required|boolean',
            ]);

            $shipping->update([
                'is_active' => $request->boolean('is_active'),
            ]);

            return redirect()->back()
                ->with('success', __('Shipping method status updated successfully!'));
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:flat_rate,free_shipping,weight_based,distance_based,percentage_based',
            'description' => 'nullable|string',
            'cost' => 'nullable|numeric|min:0',
            'min_order_amount' => 'nullable|numeric|min:0',
            'delivery_time' => 'nullable|string|max:255',
            'sort_order' => 'nullable|integer',
            'is_active' => 'boolean',
            'zone_type' => 'nullable|string|in:domestic,international,local,regional',
            'countries' => 'nullable|string',
            'postal_codes' => 'nullable|string',
            'max_distance' => 'nullable|numeric|min:0',
            'max_weight' => 'nullable|numeric|min:0',
            'max_dimensions' => 'nullable|string',
            'require_signature' => 'boolean',
            'insurance_required' => 'boolean',
            'tracking_available' => 'boolean',
            'handling_fee' => 'nullable|numeric|min:0'
        ], [], [
            'name' => __('Shipping Method Name'),
            'type' => __('Shipping Type'),
            'cost' => __('Shipping Cost'),
            'zone_type' => __('Shipping Zone'),
        ]);
        
        $data = $request->all();
        
        // If free shipping, set cost to 0
        if ($data['type'] === 'free_shipping') {
            $data['cost'] = 0;
        }

        $shipping->update($data);

        return redirect()->route('shipping.index')
            ->with('success', 'Shipping method updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $user = Auth::user();
        $currentStoreId = $user->current_store;
        
        $shipping = Shipping::where('store_id', $currentStoreId)
            ->findOrFail($id);
        
        $shipping->delete();

        return redirect()->route('shipping.index')
            ->with('success', 'Shipping method deleted successfully!');
    }
    
    /**
     * Export shipping methods data as CSV.
     */
    public function export()
    {
        $user = Auth::user();
        $currentStoreId = $user->current_store;
        
        $shippings = Shipping::where('store_id', $currentStoreId)
            ->orderBy('sort_order')
            ->get();
        
        $csvData = [];
        $csvData[] = ['Shipping Method', 'Type', 'Cost', 'Zone Type', 'Min Order Amount', 'Delivery Time', 'Max Weight', 'Tracking Available', 'Status', 'Created Date'];
        
        foreach ($shippings as $shipping) {
            $csvData[] = [
                $shipping->name,
                ucfirst(str_replace('_', ' ', $shipping->type)),
                $shipping->type === 'free_shipping' ? 'Free' : formatStoreCurrency($shipping->cost, $user->id, $currentStoreId),
                $shipping->zone_type ? ucfirst($shipping->zone_type) : 'All zones',
                $shipping->min_order_amount ? formatStoreCurrency($shipping->min_order_amount, $user->id, $currentStoreId) : 'No minimum',
                $shipping->delivery_time ?: 'Not specified',
                $shipping->max_weight ? $shipping->max_weight . ' kg' : 'No limit',
                $shipping->tracking_available ? 'Yes' : 'No',
                $shipping->is_active ? 'Active' : 'Inactive',
                $shipping->created_at->format('Y-m-d H:i:s')
            ];
        }
        
        $filename = 'shipping-methods-export-' . now()->format('Y-m-d') . '.csv';
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];
        
        $callback = function() use ($csvData) {
            $file = fopen('php://output', 'w');
            foreach ($csvData as $row) {
                fputcsv($file, $row);
            }
            fclose($file);
        };
        
        return response()->stream($callback, 200, $headers);
    }
}