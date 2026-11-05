<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Shipping;
use App\Models\Country;
use App\Models\State;
use App\Models\City;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class OrderController extends Controller
{
    /**
     * Display a listing of orders.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $storeId = getCurrentStoreId($user);

        // Overall stats for the store
        $allOrders = Order::where('store_id', $storeId)->get();
        $totalOrders = $allOrders->count();
        $pendingOrders = $allOrders->whereIn('status', ['pending', 'processing'])->count();
        $paidOrders = $allOrders->where('payment_status', 'paid');
        $totalRevenue = $paidOrders->sum('total_amount');
        $avgOrderValue = $paidOrders->count() > 0 ? $totalRevenue / $paidOrders->count() : 0;

        $query = Order::where('store_id', $storeId);

        // Apply search filter
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhere('customer_first_name', 'like', "%{$search}%")
                    ->orWhere('customer_last_name', 'like', "%{$search}%")
                    ->orWhere('customer_email', 'like', "%{$search}%")
                    ->orWhere('payment_method', 'like', "%{$search}%");
            });
        }

        // Apply date filters
        if ($request->has('start_date') && !empty($request->start_date)) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->has('end_date') && !empty($request->end_date)) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        // Calculate status counts based on current filters (excluding status filter itself)
        $statusCounts = [
            'all' => (clone $query)->count(),
            'pending' => (clone $query)->where('status', 'pending')->count(),
            'processing' => (clone $query)->where('status', 'processing')->count(),
            'shipped' => (clone $query)->where('status', 'shipped')->count(),
            'delivered' => (clone $query)->where('status', 'delivered')->count(),
            'completed' => (clone $query)->where('status', 'completed')->count(),
            'cancelled' => (clone $query)->where('status', 'cancelled')->count(),
        ];

        // Apply status filter
        if ($request->has('status') && $request->status !== 'all' && $request->status !== '_empty_') {
            $query->where('status', strtolower($request->status));
        }

        // Eager load relationships
        $query->with(['customer', 'items.product']);

        // Apply sorting
        $allowedSortFields = ['order_number', 'created_at', 'total_amount', 'status', 'id'];
        $sortField = $request->input('sort_field', 'created_at');
        if (!in_array($sortField, $allowedSortFields)) {
            if ($sortField === 'orderNumber' || $sortField === 'name') {
                $sortField = 'order_number';
            } elseif ($sortField === 'total') {
                $sortField = 'total_amount';
            } else {
                $sortField = 'created_at';
            }
        }

        $sortDirection = $request->input('sort_direction', 'desc');
        if (!in_array(strtolower($sortDirection), ['asc', 'desc'])) {
            $sortDirection = 'desc';
        }

        $query->orderBy($sortField, $sortDirection);

        // Get view and pagination settings
        $view = $request->input('view') ?? $request->cookie('orders_view', 'list');
        $defaultPerPage = ($view === 'grid') ? 12 : 10;
        $perPage = (int) $request->input('per_page', $defaultPerPage);
        $orders = $query->paginate($perPage)->withQueryString();

        // Transform collection for frontend
        $orders->getCollection()->transform(function ($order) {
            $itemImages = $order->items ? $order->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->product_name ?? ($item->product->name ?? 'Product'),
                    'image' => $item->product && $item->product->cover_image ? $item->product->cover_image : '/placeholder.jpg',
                ];
            })->values()->toArray() : [];

            return [
                'id' => $order->id,
                'orderNumber' => $order->order_number,
                'customer' => trim($order->customer_first_name . ' ' . $order->customer_last_name),
                'email' => $order->customer_email,
                'avatar' => $order->customer?->avatar ?? null,
                'phone' => $order->customer_phone,
                'total' => (float) $order->total_amount,
                'status' => ucfirst($order->status),
                'paymentStatus' => ucfirst($order->payment_status ?? 'pending'),
                'items' => $order->items ? $order->items->count() : 0,
                'itemImages' => $itemImages,
                'date' => $order->created_at ? $order->created_at->format('Y-m-d') : '',
                'paymentMethod' => $order->payment_method === 'cod' ? 'Cash on Delivery' : ucfirst(str_replace('_', ' ', $order->payment_method ?? '')),
            ];
        });

        return Inertia::render('orders/index', [
            'orders' => $orders,
            'stats' => [
                'totalOrders' => $totalOrders,
                'pendingOrders' => $pendingOrders,
                'totalRevenue' => $totalRevenue,
                'avgOrderValue' => $avgOrderValue,
            ],
            'statusCounts' => $statusCounts,
            'filters' => array_merge(
                $request->only(['search', 'status', 'start_date', 'end_date', 'sort_field', 'sort_direction']),
                [
                    'per_page' => $perPage,
                    'view' => $view,
                ]
            ),
        ]);
    }

    /**
     * Display the specified order.
     */
    public function show($id)
    {
        $user = Auth::user();
        $storeId = getCurrentStoreId($user);
        
        $order = Order::where('store_id', $storeId)
            ->where('id', $id)
            ->with(['items.product', 'shippingMethod'])
            ->firstOrFail();
            
        $formattedOrder = [
            'id' => $order->id,
            'orderNumber' => $order->order_number,
            'date' => $order->created_at->format('F j, Y'),
            'status' => ucfirst($order->status),
            'paymentStatus' => ucfirst($order->payment_status),
            'paymentMethod' => $order->payment_method === 'cod' ? 'Cash on Delivery' : ucfirst(str_replace('_', ' ', $order->payment_method)),
            'bankTransferReceipt' => $order->bank_transfer_receipt ? '/storage/' . $order->bank_transfer_receipt : null,
            'customer' => [
                'name' => $order->customer_first_name . ' ' . $order->customer_last_name,
                'email' => $order->customer_email,
                'phone' => $order->customer_phone,
                'avatar' => $order->customer?->avatar ?? null,
            ],
            'shippingAddress' => [
                'name' => $order->customer_first_name . ' ' . $order->customer_last_name,
                'street' => $order->shipping_address,
                'city' => \App\Models\City::find($order->shipping_city)->name ?? $order->shipping_city,
                'state' => \App\Models\State::find($order->shipping_state)->name ?? $order->shipping_state,
                'zip' => $order->shipping_postal_code,
                'country' => \App\Models\Country::find($order->shipping_country)->name ?? $order->shipping_country,
            ],
            'items' => $order->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->product_name,
                    'sku' => $item->product_sku,
                    'quantity' => $item->quantity,
                    'price' => (float) $item->unit_price,
                    'image' => $item->product->cover_image ?? '/placeholder.jpg',
                ];
            }),
            'summary' => [
                'subtotal' => (float) $order->subtotal,
                'shipping' => (float) $order->shipping_amount,
                'tax' => (float) $order->tax_amount,
                'discount' => (float) $order->discount_amount,
                'total' => (float) $order->total_amount,
            ],
            'shippingMethod' => $order->shippingMethod->name ?? ' ',
            'trackingNumber' => $order->tracking_number,
            'notes' => $order->notes,
            'createdAt' => $order->created_at->format('M j, Y g:i A'),
            'updatedAt' => $order->updated_at->format('M j, Y g:i A'),
            'stats' => [
                'items_count' => $order->items->count(),
                'total_quantity' => $order->items->sum('quantity'),
                'avg_item_price' => $order->items->count() > 0 ? $order->items->avg('unit_price') : 0,
            ],
            'timeline' => (function () use ($order) {

                $statusLevels = [
                    'pending'    => 1,
                    'confirmed'  => 2,
                    'processing' => 3,
                    'shipped'    => 4,
                    'delivered'  => 5,
                    'completed'  => 6,
                ];

                $currentStatus = strtolower($order->status);
                $currentLevel = $statusLevels[$currentStatus] ?? 1;

                $timeline = [
                    [
                        'status'    => 'Order Placed',
                        'date'      => $order->created_at->format('M j, Y g:i A'),
                        'completed' => true
                    ],
                    [
                        'status'    => 'Payment Confirmed',
                        'date'      => $order->payment_status === 'paid' ? $order->updated_at->format('M j, Y g:i A') : null,
                        'completed' => $order->payment_status === 'paid'
                    ]
                ];

                if ($currentStatus === 'cancelled') {
                    $timeline[] = [
                        'status'    => 'Order Cancelled',
                        'date'      => $order->updated_at->format('M j, Y g:i A'),
                        'completed' => true,
                        'isTerminal' => true,
                        'variant'   => 'danger'
                    ];
                } elseif ($currentStatus === 'refunded') {
                    $timeline[] = [
                        'status'    => 'Order Refunded',
                        'date'      => $order->updated_at->format('M j, Y g:i A'),
                        'completed' => true,
                        'isTerminal' => true,
                        'variant'   => 'blue'
                    ];
                } else {
                    $milestones = [
                        ['status' => 'Order Confirmed',  'level' => 2],
                        ['status' => 'Order Processing', 'level' => 3],
                        ['status' => 'Shipped',          'level' => 4],
                        ['status' => 'Delivered',        'level' => 5],
                        ['status' => 'Order Completed',  'level' => 6],
                    ];

                    foreach ($milestones as $m) {
                        $isCompleted = $currentLevel >= $m['level'];
                        $timeline[] = [
                            'status'    => $m['status'],
                            'date'      => $isCompleted ? $order->updated_at->format('M j, Y g:i A') : null,
                            'completed' => $isCompleted
                        ];
                    }
                }

                return $timeline;
            })()
        ];
        
        return Inertia::render('orders/show', [
            'order' => $formattedOrder
        ]);
    }

    /**
     * Show the form for creating a new order.
     */
    public function create()
    {
        $user = Auth::user();
        $storeId = getCurrentStoreId($user);
        
        // Get customers for dropdown
        $customers = Customer::where('store_id', $storeId)
            ->select('id', 'first_name', 'last_name', 'email')
            ->get()
            ->map(function ($customer) {
                return [
                    'id' => $customer->id,
                    'name' => $customer->first_name . ' ' . $customer->last_name,
                    'email' => $customer->email,
                ];
            });
            
        // Get products for dropdown
        $products = Product::where('store_id', $storeId)
            ->where('is_active', true)
            ->select('id', 'name', 'price', 'sale_price')
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'price' => (float) ($product->sale_price ?? $product->price),
                ];
            });
            
        // Get shipping methods
        $shippingMethods = Shipping::where('store_id', $storeId)
            ->where('is_active', true)
            ->select('id', 'name', 'cost')
            ->get();
        
        return Inertia::render('orders/create', [
            'customers' => $customers,
            'products' => $products,
            'shippingMethods' => $shippingMethods,
        ]);
    }

    /**
     * Show the form for editing the specified order.
     */
    public function edit($id)
    {
        $user = Auth::user();
        $storeId = getCurrentStoreId($user);
        
        $order = Order::where('store_id', $storeId)
            ->where('id', $id)
            ->with(['items.product', 'shippingMethod'])
            ->firstOrFail();
            
        // Get customers for dropdown
        $customers = Customer::where('store_id', $storeId)
            ->select('id', 'first_name', 'last_name', 'email')
            ->get()
            ->map(function ($customer) {
                return [
                    'id' => $customer->id,
                    'name' => $customer->first_name . ' ' . $customer->last_name,
                    'email' => $customer->email,
                ];
            });
            
        // Get products for dropdown
        $products = Product::where('store_id', $storeId)
            ->where('is_active', true)
            ->select('id', 'name', 'price', 'sale_price')
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'price' => (float) ($product->sale_price ?? $product->price),
                ];
            });
            
        // Get shipping methods
        $shippingMethods = Shipping::where('store_id', $storeId)
            ->where('is_active', true)
            ->select('id', 'name', 'cost')
            ->get();
            
        // Update products to include variants
        $products = Product::where('store_id', $storeId)
            ->where('is_active', true)
            ->select('id', 'name', 'price', 'sale_price', 'variants')
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'price' => (float) ($product->sale_price ?? $product->price),
                    'variants' => is_string($product->variants) ? json_decode($product->variants, true) : ($product->variants ?? []),
                ];
            });
        
        $formattedOrder = [
            'id' => $order->id,
            'orderNumber' => $order->order_number,
            'status' => $order->status,
            'paymentStatus' => $order->payment_status,
            'paymentMethod' => $order->payment_method,
            'customer' => [
                'id' => $order->customer_id,
                'name' => $order->customer_first_name . ' ' . $order->customer_last_name,
                'email' => $order->customer_email,
                'phone' => $order->customer_phone,
            ],
            'shippingAddress' => [
                'address' => $order->shipping_address,
                'city' => \App\Models\City::find($order->shipping_city)->name ?? $order->shipping_city,
                'state' => \App\Models\State::find($order->shipping_state)->name ?? $order->shipping_state,
                'postalCode' => $order->shipping_postal_code,
                'country' => \App\Models\Country::find($order->shipping_country)->name ?? $order->shipping_country,
            ],
            'items' => $order->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'productId' => $item->product_id,
                    'name' => $item->product_name,
                    'quantity' => $item->quantity,
                    'price' => (float) $item->unit_price,
                ];
            }),
            'summary' => [
                'subtotal' => (float) $order->subtotal,
                'shipping' => (float) $order->shipping_amount,
                'tax' => (float) $order->tax_amount,
                'total' => (float) $order->total_amount,
            ],
            'shippingMethodId' => $order->shipping_method_id,
            'trackingNumber' => $order->tracking_number,
            'notes' => $order->notes,
        ];
        
        return Inertia::render('orders/edit', [
            'order' => $formattedOrder,
            'customers' => $customers,
            'products' => $products,
            'shippingMethods' => $shippingMethods,
        ]);
    }

    /**
     * Update the specified order.
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $storeId = getCurrentStoreId($user);
        
        $order = Order::where('store_id', $storeId)
            ->where('id', $id)
            ->firstOrFail();
            
        // Store old status for event
        $oldStatus = $order->status;
        
        $request->validate([
            'status' => 'required|string',
            'payment_status' => 'nullable|string',
            'tracking_number' => 'nullable|string',
            'notes' => 'nullable|string',
        ], [], [
            'status' => __('Order Status'),
            'payment_status' => __('Payment Status'),
        ]);

        $order->update([
            'status' => strtolower($request->status),
            'payment_status' => $request->input('payment_status', $order->payment_status),
            'tracking_number' => $request->input('tracking_number', $order->tracking_number),
            'notes' => $request->input('notes', $order->notes),
        ]);
        
        // Dispatch OrderStatusChanged event if status changed
        if ($oldStatus !== strtolower($request->status)) {
            event(new \App\Events\OrderStatusChanged($order, $oldStatus, strtolower($request->status)));
        }
        
        // Update order items if provided
        if ($request->has('items')) {
            foreach ($request->items as $itemData) {
                if (isset($itemData['id'])) {
                    $orderItem = $order->items()->find($itemData['id']);
                    if ($orderItem && isset($itemData['variants'])) {
                        $orderItem->update([
                            'product_variants' => json_encode($itemData['variants'])
                        ]);
                    }
                }
            }
        }
        
        return redirect()->route('orders.index')->with('success', __('Order updated successfully.'));
    }

    /**
     * Remove the specified order.
     */
    public function destroy($id)
    {
        $user = Auth::user();
        $storeId = getCurrentStoreId($user);
        
        $order = Order::where('store_id', $storeId)
            ->where('id', $id)
            ->firstOrFail();
            
        $order->delete();
        
        return redirect()->route('orders.index')->with('success', 'Order deleted successfully.');
    }
    
    /**
     * Export orders data as CSV.
     */
    public function export()
    {
        $user = Auth::user();
        $storeId = getCurrentStoreId($user);
        
        $orders = Order::where('store_id', $storeId)
            ->with(['customer', 'items'])
            ->orderBy('created_at', 'desc')
            ->get();
        
        $csvData = [];
        $csvData[] = ['Order Number', 'Customer Name', 'Email', 'Phone', 'Status', 'Payment Status', 'Payment Method', 'Items Count', 'Subtotal', 'Tax', 'Shipping', 'Total', 'Shipping Address', 'Order Date'];
        
        foreach ($orders as $order) {
            $shippingAddress = $order->shipping_address . ', ' . 
                (City::find($order->shipping_city)->name ?? $order->shipping_city) . ', ' . 
                (State::find($order->shipping_state)->name ?? $order->shipping_state) . ' ' . 
                $order->shipping_postal_code . ', ' . 
                (Country::find($order->shipping_country)->name ?? $order->shipping_country);
                
            $csvData[] = [
                $order->order_number,
                $order->customer_first_name . ' ' . $order->customer_last_name,
                $order->customer_email,
                $order->customer_phone ?: 'Not provided',
                ucfirst($order->status),
                ucfirst($order->payment_status),
                $order->payment_method === 'cod' ? 'Cash on Delivery' : ucfirst(str_replace('_', ' ', $order->payment_method)),
                $order->items->count(),
                formatStoreCurrency($order->subtotal, $user->id, $storeId),
                formatStoreCurrency($order->tax_amount, $user->id, $storeId),
                formatStoreCurrency($order->shipping_amount, $user->id, $storeId),
                formatStoreCurrency($order->total_amount, $user->id, $storeId),
                $shippingAddress,
                $order->created_at->format('Y-m-d H:i:s')
            ];
        }
        
        $filename = 'orders-export-' . now()->format('Y-m-d') . '.csv';
        
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