<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Customer;
use App\Models\Product;
use App\Models\OrderItem;
use App\Models\Category;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $storeId = $user->current_store;

        $days = (int) request('days', 15);
        $period = request('period', 'last_30_days');
        $startDate = request('start_date');
        $endDate = request('end_date');

        if (config('app.is_demo', false)) {
            $analytics = $this->getDemoAnalytics();
            $analytics['comparative'] = $this->getComparativeAnalytics($storeId, $period, $startDate, $endDate);
        } else {
            $analytics = [
                'metrics' => $this->getKeyMetrics($storeId),
                'topProducts' => $this->getTopProducts($storeId),
                'topCustomers' => $this->getTopCustomers($storeId),
                'recentActivity' => $this->getRecentActivity($storeId),
                'revenueChart' => $this->getRevenueChartData($storeId, $days),
                'salesChart' => $this->getSalesChartData($storeId, $days),
                'inventoryHealth' => $this->getInventoryHealth($storeId),
                'comparative' => $this->getComparativeAnalytics($storeId, $period, $startDate, $endDate),
            ];
        }

        return Inertia::render('analytics/index', [
            'analytics' => $analytics,
            'chartDays' => $days,
            'selectedPeriod' => $period,
            'startDate' => $startDate,
            'endDate' => $endDate,
        ]);
    }

    private function getKeyMetrics($storeId)
    {
        $currentMonth = Carbon::now()->startOfMonth();
        $lastMonth = Carbon::now()->subMonth()->startOfMonth();

        // Total revenue (all time) and current month revenue
        $totalRevenue = Order::where('store_id', $storeId)
            ->where('payment_status', 'paid')
            ->sum('total_amount');

        $currentMonthRevenue = Order::where('store_id', $storeId)
            ->where('payment_status', 'paid')
            ->where('created_at', '>=', $currentMonth)
            ->sum('total_amount');

        $lastMonthRevenue = Order::where('store_id', $storeId)
            ->where('payment_status', 'paid')
            ->whereBetween('created_at', [$lastMonth, $currentMonth])
            ->sum('total_amount');

        $currentOrders = Order::where('store_id', $storeId)
            ->where('created_at', '>=', $currentMonth)
            ->count();

        $lastMonthOrders = Order::where('store_id', $storeId)
            ->whereBetween('created_at', [$lastMonth, $currentMonth])
            ->count();

        $totalCustomers = Customer::where('store_id', $storeId)->count();
        $newCustomers = Customer::where('store_id', $storeId)
            ->where('created_at', '>=', $currentMonth)
            ->count();

        // Fix revenue growth calculation
        $revenueGrowth = 0;
        if ($lastMonthRevenue > 0) {
            $revenueGrowth = (($currentMonthRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100;
        } elseif ($currentMonthRevenue > 0) {
            $revenueGrowth = 100;
        }

        return [
            'revenue' => [
                'current' => $totalRevenue, // Show total revenue, not just current month
                'change' => round($revenueGrowth, 1)
            ],
            'orders' => [
                'current' => $currentOrders,
                'change' => $currentOrders - $lastMonthOrders
            ],
            'customers' => [
                'total' => $totalCustomers,
                'new' => $newCustomers
            ],
            'conversion' => [
                'rate' => 3.2, // Placeholder
                'change' => 0.5
            ]
        ];
    }

    private function getTopProducts($storeId)
    {
        return OrderItem::select('product_name', 'product_id')
            ->selectRaw('SUM(quantity) as total_sold')
            ->selectRaw('SUM(total_price) as total_revenue')
            ->whereHas('order', function ($query) use ($storeId) {
                $query->where('store_id', $storeId);
            })
            ->groupBy('product_id', 'product_name')
            ->orderBy('total_revenue', 'desc')
            ->limit(4)
            ->get()
            ->map(function ($item) use ($storeId) {
                $user = Auth::user();
                return [
                    'name' => $item->product_name,
                    'sales' => $item->total_sold,
                    'revenue' => formatStoreCurrency($item->total_revenue, $user->id, $storeId)
                ];
            });
    }

    private function getTopCustomers($storeId)
    {
        return Customer::select('customers.*')
            ->selectRaw('COUNT(orders.id) as order_count')
            ->selectRaw('SUM(orders.total_amount) as total_spent')
            ->leftJoin('orders', 'customers.id', '=', 'orders.customer_id')
            ->where('customers.store_id', $storeId)
            ->groupBy('customers.id')
            ->orderBy('total_spent', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($customer) use ($storeId) {
                $user = Auth::user();
                $fullName = trim(($customer->first_name ?? '') . ' ' . ($customer->last_name ?? ''));
                $spent = (float) ($customer->total_spent ?: 0);
                $orders = (int) ($customer->order_count ?: 0);
                $aov = $orders > 0 ? $spent / $orders : 0;

                return [
                    'id' => $customer->id,
                    'name' => $fullName ?: 'Customer #' . $customer->id,
                    'email' => $customer->email,
                    'phone' => $customer->phone,
                    'customer_group' => $customer->customer_group ?: 'Regular',
                    'is_active' => (bool) $customer->is_active,
                    'avatar' => $customer->avatar ? $customer->avatar : null,
                    'orders' => $orders,
                    'spent' => formatStoreCurrency($spent, $user->id, $storeId),
                    'avg_order_value' => formatStoreCurrency($aov, $user->id, $storeId),
                    'joined' => $customer->created_at ? $customer->created_at->format('Y-m-d') : null,
                    'created_at' => $customer->created_at ? $customer->created_at->format('Y-m-d H:i:s') : null,
                ];
            });
    }

    private function getRecentActivity($storeId)
    {
        return Order::where('store_id', $storeId)
            ->with('customer')
            ->orderBy('created_at', 'desc')
            ->limit(6)
            ->get()
            ->map(function ($order) use ($storeId) {
                $user = Auth::user();
                $custName = trim(($order->customer_first_name ?? '') . ' ' . ($order->customer_last_name ?? ''));
                if (!$custName && $order->customer) {
                    $custName = trim(($order->customer->first_name ?? '') . ' ' . ($order->customer->last_name ?? ''));
                }
                return [
                    'type' => 'Order',
                    'order_number' => $order->order_number,
                    'customer_name' => $custName ?: 'Customer',
                    'customer_email' => $order->customer_email ?: ($order->customer->email ?? null),
                    'avatar' => $order->customer ? $order->customer->avatar : null,
                    'payment_status' => $order->payment_status ?: 'paid',
                    'description' => "New order {$order->order_number} from " . ($custName ?: 'Customer'),
                    'amount' => formatStoreCurrency($order->total_amount, $user->id, $storeId),
                    'date' => $order->created_at->format('Y-m-d'),
                    'time' => $order->created_at->diffForHumans(),
                    'created_at' => $order->created_at->format('Y-m-d H:i:s'),
                ];
            });
    }

    private function getRevenueChartData($storeId, int $days = 30)
    {
        return Order::where('store_id', $storeId)
            ->selectRaw('DATE(created_at) as date, SUM(total_amount) as revenue')
            ->where('created_at', '>=', Carbon::now()->subDays($days))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => Carbon::parse($item->date)->format('M d'),
                    'revenue' => (float) $item->revenue
                ];
            });
    }

    private function getSalesChartData($storeId, int $days = 30)
    {
        return Order::where('store_id', $storeId)
            ->selectRaw('DATE(created_at) as date, COUNT(*) as orders')
            ->where('created_at', '>=', Carbon::now()->subDays($days))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => Carbon::parse($item->date)->format('M d'),
                    'orders' => (int) $item->orders
                ];
            });
    }

    private function getDemoAnalytics()
    {
        return [
            'metrics' => [
                'revenue' => ['current' => 45250, 'change' => 12.5],
                'orders' => ['current' => 156, 'change' => 23],
                'customers' => ['total' => 89, 'new' => 12],
                'conversion' => ['rate' => 3.2, 'change' => 0.5]
            ],
            'topProducts' => [
                ['name' => 'iPhone 15 Pro Max', 'sales' => 45, 'revenue' => '$22,500'],
                ['name' => 'Samsung Galaxy S24', 'sales' => 32, 'revenue' => '$16,800'],
                ['name' => 'MacBook Air M3', 'sales' => 18, 'revenue' => '$21,600'],
                ['name' => 'AirPods Pro', 'sales' => 67, 'revenue' => '$13,400']
            ],
            'topCustomers' => [
                ['id' => 1, 'name' => 'David Wilson', 'email' => 'david.wilson@example.com', 'phone' => '+1 (555) 234-5678', 'customer_group' => 'VIP', 'is_active' => true, 'avatar' => '/storage/media/avatars/boys1.png', 'orders' => 5, 'spent' => '$360.07', 'avg_order_value' => '$72.01', 'joined' => '2025-01-15', 'created_at' => '2025-01-15 10:00:00'],
                ['id' => 2, 'name' => 'Amanda Rodriguez', 'email' => 'amanda.r@example.com', 'phone' => '+1 (555) 876-5432', 'customer_group' => 'Wholesale', 'is_active' => true, 'avatar' => '/storage/media/avatars/boys2.png', 'orders' => 4, 'spent' => '$318.94', 'avg_order_value' => '$79.74', 'joined' => '2025-03-20', 'created_at' => '2025-03-20 11:30:00'],
                ['id' => 3, 'name' => 'Lisa Anderson', 'email' => 'lisa.anderson@example.com', 'phone' => '+1 (555) 345-6789', 'customer_group' => 'Regular', 'is_active' => true, 'avatar' => '/storage/media/avatars/boys3.png', 'orders' => 3, 'spent' => '$190.91', 'avg_order_value' => '$63.64', 'joined' => '2025-06-12', 'created_at' => '2025-06-12 14:15:00'],
                ['id' => 4, 'name' => 'Robert Garcia', 'email' => 'robert.garcia@example.com', 'phone' => '+1 (555) 456-7890', 'customer_group' => 'Regular', 'is_active' => false, 'avatar' => '/storage/media/avatars/boys4.png', 'orders' => 2, 'spent' => '$175.14', 'avg_order_value' => '$87.57', 'joined' => '2025-11-05', 'created_at' => '2025-11-05 09:45:00'],
                ['id' => 5, 'name' => 'Jessica Martinez', 'email' => 'jessica.m@example.com', 'phone' => '+1 (555) 987-6543', 'customer_group' => 'VIP', 'is_active' => true, 'avatar' => '/storage/media/avatars/boys5.png', 'orders' => 2, 'spent' => '$86.38', 'avg_order_value' => '$43.19', 'joined' => '2026-01-10', 'created_at' => '2026-01-10 16:20:00'],
            ],
            'recentActivity' => [
                ['type' => 'Order', 'order_number' => 'ORD-6AC5E75793699', 'customer_name' => 'John Doe', 'customer_email' => 'john.doe@example.com', 'avatar' => '/storage/media/avatars/boys6.png', 'payment_status' => 'paid', 'description' => 'New order ORD-6AC5E75793699 from John Doe', 'amount' => '$22.99', 'date' => '2026-10-07', 'time' => '5 hours ago', 'created_at' => '2026-10-07 08:31:00'],
                ['type' => 'Order', 'order_number' => 'ORD-69565F25EAF3A', 'customer_name' => 'David Wilson', 'customer_email' => 'david.wilson@example.com', 'avatar' => '/storage/media/avatars/boys7.png', 'payment_status' => 'paid', 'description' => 'New order ORD-69565F25EAF3A from David Wilson', 'amount' => '$360.07', 'date' => '2026-07-15', 'time' => '9 months ago', 'created_at' => '2025-12-24 12:09:00'],
                ['type' => 'Order', 'order_number' => 'ORD-69565F25AFE4D', 'customer_name' => 'Lisa Anderson', 'customer_email' => 'lisa.anderson@example.com', 'avatar' => '/storage/media/avatars/boys8.png', 'payment_status' => 'paid', 'description' => 'New order ORD-69565F25AFE4D from Lisa Anderson', 'amount' => '$102.95', 'date' => '2026-06-12', 'time' => '9 months ago', 'created_at' => '2025-12-22 00:38:00'],
                ['type' => 'Order', 'order_number' => 'ORD-69565F25D0C21', 'customer_name' => 'Jessica Martinez', 'customer_email' => 'jessica.m@example.com', 'avatar' => '/storage/media/avatars/boys9.png', 'payment_status' => 'paid', 'description' => 'New order ORD-69565F25D0C21 from Jessica Martinez', 'amount' => '$86.38', 'date' => '2026-06-12', 'time' => '9 months ago', 'created_at' => '2025-12-10 14:59:00'],
                ['type' => 'Order', 'order_number' => 'ORD-69565F25E3C4D', 'customer_name' => 'Robert Garcia', 'customer_email' => 'robert.garcia@example.com', 'avatar' => '/storage/media/avatars/boys10.png', 'payment_status' => 'paid', 'description' => 'New order ORD-69565F25E3C4D from Robert Garcia', 'amount' => '$175.14', 'date' => '2025-11-19', 'time' => '10 months ago', 'created_at' => '2025-11-19 01:38:00'],
            ],
            'revenueChart' => [
                ['date' => 'Jan 1', 'revenue' => 1200],
                ['date' => 'Jan 2', 'revenue' => 1450],
                ['date' => 'Jan 3', 'revenue' => 1100],
                ['date' => 'Jan 4', 'revenue' => 1800],
                ['date' => 'Jan 5', 'revenue' => 1650],
                ['date' => 'Jan 6', 'revenue' => 2100],
                ['date' => 'Jan 7', 'revenue' => 1900],
                ['date' => 'Jan 8', 'revenue' => 2300],
                ['date' => 'Jan 9', 'revenue' => 2050],
                ['date' => 'Jan 10', 'revenue' => 2400],
                ['date' => 'Jan 11', 'revenue' => 2200],
                ['date' => 'Jan 12', 'revenue' => 2650],
                ['date' => 'Jan 13', 'revenue' => 2800],
                ['date' => 'Jan 14', 'revenue' => 2450]
            ],
            'salesChart' => [
                ['date' => 'Jan 1', 'orders' => 8],
                ['date' => 'Jan 2', 'orders' => 12],
                ['date' => 'Jan 3', 'orders' => 7],
                ['date' => 'Jan 4', 'orders' => 15],
                ['date' => 'Jan 5', 'orders' => 11],
                ['date' => 'Jan 6', 'orders' => 18],
                ['date' => 'Jan 7', 'orders' => 14],
                ['date' => 'Jan 8', 'orders' => 20],
                ['date' => 'Jan 9', 'orders' => 16],
                ['date' => 'Jan 10', 'orders' => 22],
                ['date' => 'Jan 11', 'orders' => 19],
                ['date' => 'Jan 12', 'orders' => 25],
                ['date' => 'Jan 13', 'orders' => 28],
                ['date' => 'Jan 14', 'orders' => 24]
            ],
            'inventoryHealth' => [
                'totalProducts' => 45,
                'inStock' => 31,
                'lowStock' => 8,
                'outOfStock' => 4,
                'digital' => 2,
                'totalStockUnits' => 1240,
                'totalStockValue' => 38950.00,
                'lowStockItems' => [
                    ['id' => 1, 'name' => 'Wireless Headphones Pro', 'stock' => 2, 'price' => 199.99],
                    ['id' => 2, 'name' => 'Smart Fitness Watch Series 5', 'stock' => 0, 'price' => 149.50],
                    ['id' => 3, 'name' => 'Organic Cotton Crewneck T-Shirt', 'stock' => 4, 'price' => 29.00],
                    ['id' => 4, 'name' => 'Ceramic Pour-Over Coffee Dripper', 'stock' => 0, 'price' => 34.00],
                ],
            ]
        ];
    }

    private function getInventoryHealth($storeId)
    {
        $products = Product::where('store_id', $storeId)->get();

        $inStock = 0;
        $lowStock = 0;
        $outOfStock = 0;
        $digital = 0;
        $totalStockUnits = 0;
        $totalStockValue = 0;

        foreach ($products as $product) {
            if ($product->is_downloadable) {
                $digital++;
            } else {
                $stock = (int) $product->stock;
                $totalStockUnits += $stock;
                $price = (float) ($product->sale_price ?: $product->price ?: 0);
                $totalStockValue += ($stock * $price);

                if ($stock <= 0) {
                    $outOfStock++;
                } elseif ($stock <= 5) {
                    $lowStock++;
                } else {
                    $inStock++;
                }
            }
        }

        $totalProducts = $products->count();

        $lowStockItems = Product::where('store_id', $storeId)
            ->where('is_downloadable', false)
            ->where('stock', '<=', 5)
            ->orderBy('stock', 'asc')
            ->limit(4)
            ->get(['id', 'name', 'stock', 'price', 'sale_price', 'cover_image'])
            ->map(function ($p) {
                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'stock' => (int) $p->stock,
                    'price' => (float) ($p->sale_price ?: $p->price ?: 0),
                    'cover_image' => $p->cover_image,
                ];
            });

        return [
            'totalProducts' => $totalProducts,
            'inStock' => $inStock,
            'lowStock' => $lowStock,
            'outOfStock' => $outOfStock,
            'digital' => $digital,
            'totalStockUnits' => $totalStockUnits,
            'totalStockValue' => $totalStockValue,
            'lowStockItems' => $lowStockItems,
        ];
    }

    private function getComparativeAnalytics($storeId, $period = 'last_30_days', $startDate = null, $endDate = null)
    {
        $now = Carbon::now();
        $presetLabel = 'Last 30 Days';

        switch ($period) {
            case 'today':
                $currentStart = $now->copy()->startOfDay();
                $currentEnd = $now->copy()->endOfDay();
                $previousStart = $now->copy()->subDay()->startOfDay();
                $previousEnd = $now->copy()->subDay()->endOfDay();
                $daysCount = 1;
                $presetLabel = 'Today';
                $currentRangeText = $currentStart->format('M d, Y');
                $previousRangeText = $previousStart->format('M d, Y');
                break;

            case 'last_7_days':
                $currentStart = $now->copy()->subDays(6)->startOfDay();
                $currentEnd = $now->copy()->endOfDay();
                $previousStart = $currentStart->copy()->subDays(7)->startOfDay();
                $previousEnd = $currentStart->copy()->subSecond();
                $daysCount = 7;
                $presetLabel = 'Last 7 Days';
                $currentRangeText = $currentStart->format('M d') . ' – ' . $currentEnd->format('M d, Y');
                $previousRangeText = $previousStart->format('M d') . ' – ' . $previousEnd->format('M d, Y');
                break;

            case 'last_90_days':
                $currentStart = $now->copy()->subDays(89)->startOfDay();
                $currentEnd = $now->copy()->endOfDay();
                $previousStart = $currentStart->copy()->subDays(90)->startOfDay();
                $previousEnd = $currentStart->copy()->subSecond();
                $daysCount = 90;
                $presetLabel = 'Last 90 Days (3 Months)';
                $currentRangeText = $currentStart->format('M d') . ' – ' . $currentEnd->format('M d, Y');
                $previousRangeText = $previousStart->format('M d') . ' – ' . $previousEnd->format('M d, Y');
                break;

            case 'last_6_months':
                $currentStart = $now->copy()->subMonths(6)->startOfDay();
                $currentEnd = $now->copy()->endOfDay();
                $daysCount = (int) $currentStart->diffInDays($currentEnd) + 1;
                $previousStart = $currentStart->copy()->subDays($daysCount)->startOfDay();
                $previousEnd = $currentStart->copy()->subSecond();
                $presetLabel = 'Last 6 Months';
                $currentRangeText = $currentStart->format('M d, Y') . ' – ' . $currentEnd->format('M d, Y');
                $previousRangeText = $previousStart->format('M d, Y') . ' – ' . $previousEnd->format('M d, Y');
                break;

            case 'this_year':
                $currentStart = $now->copy()->startOfYear();
                $currentEnd = $now->copy()->endOfDay();
                $daysCount = (int) $currentStart->diffInDays($currentEnd) + 1;
                $previousStart = $currentStart->copy()->subYear();
                $previousEnd = $currentEnd->copy()->subYear();
                $presetLabel = 'This Year (12 Months)';
                $currentRangeText = $currentStart->format('M d, Y') . ' – ' . $currentEnd->format('M d, Y');
                $previousRangeText = $previousStart->format('M d, Y') . ' – ' . $previousEnd->format('M d, Y');
                break;

            case 'custom':
                if ($startDate && $endDate) {
                    $currentStart = Carbon::parse($startDate)->startOfDay();
                    $currentEnd = Carbon::parse($endDate)->endOfDay();
                } else {
                    $currentStart = $now->copy()->subDays(29)->startOfDay();
                    $currentEnd = $now->copy()->endOfDay();
                }
                $daysCount = (int) $currentStart->diffInDays($currentEnd) + 1;
                $previousStart = $currentStart->copy()->subDays($daysCount)->startOfDay();
                $previousEnd = $currentStart->copy()->subSecond();
                $presetLabel = 'Custom Range';
                $currentRangeText = $currentStart->format('M d, Y') . ' – ' . $currentEnd->format('M d, Y');
                $previousRangeText = $previousStart->format('M d, Y') . ' – ' . $previousEnd->format('M d, Y');
                break;

            case 'last_30_days':
            default:
                $currentStart = $now->copy()->subDays(29)->startOfDay();
                $currentEnd = $now->copy()->endOfDay();
                $previousStart = $currentStart->copy()->subDays(30)->startOfDay();
                $previousEnd = $currentStart->copy()->subSecond();
                $daysCount = 30;
                $presetLabel = 'Last 30 Days (Default)';
                $currentRangeText = $currentStart->format('M d') . ' – ' . $currentEnd->format('M d, Y');
                $previousRangeText = $previousStart->format('M d') . ' – ' . $previousEnd->format('M d, Y');
                break;
        }

        if (config('app.is_demo', false)) {
            return $this->getDemoComparativeData($period, $daysCount, $presetLabel, $currentRangeText, $previousRangeText);
        }

        $currentTotalOrders = (int) Order::where('store_id', $storeId)
            ->whereBetween('created_at', [$currentStart, $currentEnd])
            ->count();

        $currentRevenue = (float) Order::where('store_id', $storeId)
            ->where('payment_status', 'paid')
            ->whereBetween('created_at', [$currentStart, $currentEnd])
            ->sum('total_amount');

        $previousTotalOrders = (int) Order::where('store_id', $storeId)
            ->whereBetween('created_at', [$previousStart, $previousEnd])
            ->count();

        $previousRevenue = (float) Order::where('store_id', $storeId)
            ->where('payment_status', 'paid')
            ->whereBetween('created_at', [$previousStart, $previousEnd])
            ->sum('total_amount');

        // Revenue Growth Calculation
        $revenueDiff = round($currentRevenue - $previousRevenue, 2);
        if ($previousRevenue > 0) {
            $revenueGrowth = round((($currentRevenue - $previousRevenue) / $previousRevenue) * 100, 1);
        } else {
            $revenueGrowth = $currentRevenue > 0 ? 100.0 : 0.0;
        }

        // Orders Growth Calculation
        $ordersDiff = $currentTotalOrders - $previousTotalOrders;
        if ($previousTotalOrders > 0) {
            $ordersGrowth = round((($currentTotalOrders - $previousTotalOrders) / $previousTotalOrders) * 100, 1);
        } else {
            $ordersGrowth = $currentTotalOrders > 0 ? 100.0 : 0.0;
        }

        // AOV Growth Calculation
        $currentAov = $currentTotalOrders > 0 ? round($currentRevenue / $currentTotalOrders, 2) : 0.0;
        $previousAov = $previousTotalOrders > 0 ? round($previousRevenue / $previousTotalOrders, 2) : 0.0;
        $aovDiff = round($currentAov - $previousAov, 2);
        if ($previousAov > 0) {
            $aovGrowth = round((($currentAov - $previousAov) / $previousAov) * 100, 1);
        } else {
            $aovGrowth = $currentAov > 0 ? 100.0 : 0.0;
        }

        // Category Breakdown
        $categories = Category::where('store_id', $storeId)->get();
        $categoryList = [];

        foreach ($categories as $cat) {
            $curSales = (float) OrderItem::whereHas('order', function ($q) use ($storeId, $currentStart, $currentEnd) {
                $q->where('store_id', $storeId)
                    ->where('payment_status', 'paid')
                    ->whereBetween('created_at', [$currentStart, $currentEnd]);
            })->whereHas('product', function ($q) use ($cat) {
                $q->where('category_id', $cat->id);
            })->sum('total_price');

            $curOrders = (int) OrderItem::whereHas('order', function ($q) use ($storeId, $currentStart, $currentEnd) {
                $q->where('store_id', $storeId)
                    ->whereBetween('created_at', [$currentStart, $currentEnd]);
            })->whereHas('product', function ($q) use ($cat) {
                $q->where('category_id', $cat->id);
            })->distinct('order_id')->count('order_id');

            $prevSales = (float) OrderItem::whereHas('order', function ($q) use ($storeId, $previousStart, $previousEnd) {
                $q->where('store_id', $storeId)
                    ->where('payment_status', 'paid')
                    ->whereBetween('created_at', [$previousStart, $previousEnd]);
            })->whereHas('product', function ($q) use ($cat) {
                $q->where('category_id', $cat->id);
            })->sum('total_price');

            $prevOrders = (int) OrderItem::whereHas('order', function ($q) use ($storeId, $previousStart, $previousEnd) {
                $q->where('store_id', $storeId)
                    ->whereBetween('created_at', [$previousStart, $previousEnd]);
            })->whereHas('product', function ($q) use ($cat) {
                $q->where('category_id', $cat->id);
            })->distinct('order_id')->count('order_id');

            $salesGrowth = $prevSales > 0 ? round((($curSales - $prevSales) / $prevSales) * 100, 1) : ($curSales > 0 ? 100.0 : 0.0);
            $ordersGrowth = $prevOrders > 0 ? round((($curOrders - $prevOrders) / $prevOrders) * 100, 1) : ($curOrders > 0 ? 100.0 : 0.0);

            $categoryList[] = [
                'category' => $cat->name,
                'current_sales' => $curSales,
                'previous_sales' => $prevSales,
                'sales_growth' => $salesGrowth,
                'current_orders' => $curOrders,
                'previous_orders' => $prevOrders,
                'orders_growth' => $ordersGrowth,
            ];
        }

        if (empty($categoryList)) {
            $categoryList = $this->getFallbackCategoryComparison();
        }

        $timeline = $this->buildTimelinePoints($storeId, $daysCount, $currentStart, $currentEnd, $previousStart, $previousEnd);

        return [
            'period' => $period,
            'preset_label' => $presetLabel,
            'days_count' => $daysCount,
            'current_range_text' => $currentRangeText,
            'previous_range_text' => $previousRangeText,
            'metrics' => [
                'revenue' => [
                    'current' => $currentRevenue,
                    'previous' => $previousRevenue,
                    'difference' => $revenueDiff,
                    'growth' => $revenueGrowth,
                ],
                'orders' => [
                    'current' => $currentTotalOrders,
                    'previous' => $previousTotalOrders,
                    'difference' => $ordersDiff,
                    'growth' => $ordersGrowth,
                ],
                'aov' => [
                    'current' => $currentAov,
                    'previous' => $previousAov,
                    'difference' => $aovDiff,
                    'growth' => $aovGrowth,
                ],
            ],
            'categories' => $categoryList,
            'timeline' => $timeline,
        ];
    }

    private function getDemoComparativeData($period, $daysCount, $presetLabel, $currentRangeText, $previousRangeText)
    {
        $baseDailyRevenue = 840.0;
        $prevDailyRevenue = 715.0;

        $curRevenue = round($daysCount * $baseDailyRevenue, 2);
        $prevRevenue = round($daysCount * $prevDailyRevenue, 2);
        $curOrders = max(1, (int) round($daysCount * 5.2));
        $prevOrders = max(1, (int) round($daysCount * 4.4));

        $revDiff = round($curRevenue - $prevRevenue, 2);
        $revGrowth = round((($curRevenue - $prevRevenue) / $prevRevenue) * 100, 1);

        $ordDiff = $curOrders - $prevOrders;
        $ordGrowth = round((($curOrders - $prevOrders) / $prevOrders) * 100, 1);

        $curAov = round($curRevenue / $curOrders, 2);
        $prevAov = round($prevRevenue / $prevOrders, 2);
        $aovDiff = round($curAov - $prevAov, 2);
        $aovGrowth = round((($curAov - $prevAov) / $prevAov) * 100, 1);

        $demoCats = [
            ['name' => 'Electronics', 'cur_pct' => 0.38, 'prev_pct' => 0.32],
            ['name' => 'Fashion & Apparel', 'cur_pct' => 0.28, 'prev_pct' => 0.30],
            ['name' => 'Home & Living', 'cur_pct' => 0.16, 'prev_pct' => 0.18],
            ['name' => 'Beauty & Care', 'cur_pct' => 0.11, 'prev_pct' => 0.12],
            ['name' => 'Accessories', 'cur_pct' => 0.07, 'prev_pct' => 0.08],
        ];

        $categories = [];
        foreach ($demoCats as $c) {
            $catCurSales = round($curRevenue * $c['cur_pct'], 2);
            $catPrevSales = round($prevRevenue * $c['prev_pct'], 2);
            $catCurOrders = max(1, (int) round($curOrders * $c['cur_pct']));
            $catPrevOrders = max(1, (int) round($prevOrders * $c['prev_pct']));
            $sGrowth = round((($catCurSales - $catPrevSales) / $catPrevSales) * 100, 1);
            $oGrowth = round((($catCurOrders - $catPrevOrders) / $catPrevOrders) * 100, 1);

            $categories[] = [
                'category' => $c['name'],
                'current_sales' => $catCurSales,
                'previous_sales' => $catPrevSales,
                'sales_growth' => $sGrowth,
                'current_orders' => $catCurOrders,
                'previous_orders' => $catPrevOrders,
                'orders_growth' => $oGrowth,
            ];
        }

        if ($daysCount === 1) {
            $numPoints = 6;
        } elseif ($daysCount <= 7) {
            $numPoints = $daysCount;
        } elseif ($daysCount <= 35) {
            $numPoints = 7;
        } elseif ($daysCount <= 120) {
            $numPoints = 6;
        } else {
            $numPoints = min(12, max(6, (int) round($daysCount / 30)));
        }

        $timeline = [];
        $now = Carbon::now();
        $stepDays = $numPoints > 1 ? ($daysCount - 1) / ($numPoints - 1) : 1;

        for ($i = 0; $i < $numPoints; $i++) {
            $dayOffset = (int) round(($numPoints - 1 - $i) * $stepDays);
            $curDate = $now->copy()->subDays($dayOffset);
            $prevDate = $curDate->copy()->subDays($daysCount);

            if ($daysCount === 1) {
                $label = sprintf('%02d:00', $i * 4);
                $curDateLabel = 'Today ' . sprintf('%02d:00', $i * 4);
                $prevDateLabel = 'Yesterday ' . sprintf('%02d:00', $i * 4);
            } elseif ($daysCount <= 35) {
                $label = $curDate->format('M d');
                $curDateLabel = $curDate->format('M d, Y');
                $prevDateLabel = $prevDate->format('M d, Y');
            } elseif ($daysCount <= 120) {
                $label = $curDate->format('M d');
                $curDateLabel = $curDate->format('M d, Y');
                $prevDateLabel = $prevDate->format('M d, Y');
            } else {
                $label = $curDate->format('M Y');
                $curDateLabel = $curDate->format('M Y');
                $prevDateLabel = $prevDate->format('M Y');
            }

            $sliceCurRev = round(($curRevenue / $numPoints) * (0.85 + (sin($i + 1) * 0.25)), 2);
            $slicePrevRev = round(($prevRevenue / $numPoints) * (0.85 + (cos($i + 1) * 0.20)), 2);
            $sliceCurOrd = max(1, (int) round(($curOrders / $numPoints) * (0.9 + (sin($i + 1) * 0.2))));
            $slicePrevOrd = max(1, (int) round(($prevOrders / $numPoints) * (0.9 + (cos($i + 1) * 0.15))));

            $timeline[] = [
                'label' => $label,
                'current_date' => $curDateLabel,
                'previous_date' => $prevDateLabel,
                'current_sales' => $sliceCurRev,
                'previous_sales' => $slicePrevRev,
                'current_orders' => $sliceCurOrd,
                'previous_orders' => $slicePrevOrd,
            ];
        }

        return [
            'period' => $period,
            'preset_label' => $presetLabel,
            'days_count' => $daysCount,
            'current_range_text' => $currentRangeText,
            'previous_range_text' => $previousRangeText,
            'metrics' => [
                'revenue' => [
                    'current' => $curRevenue,
                    'previous' => $prevRevenue,
                    'difference' => $revDiff,
                    'growth' => $revGrowth,
                ],
                'orders' => [
                    'current' => $curOrders,
                    'previous' => $prevOrders,
                    'difference' => $ordDiff,
                    'growth' => $ordGrowth,
                ],
                'aov' => [
                    'current' => $curAov,
                    'previous' => $prevAov,
                    'difference' => $aovDiff,
                    'growth' => $aovGrowth,
                ],
            ],
            'categories' => $categories,
            'timeline' => $timeline,
        ];
    }

    private function getFallbackCategoryComparison()
    {
        return [
            ['category' => 'Electronics', 'current_sales' => 0, 'previous_sales' => 0, 'sales_growth' => 0, 'current_orders' => 0, 'previous_orders' => 0, 'orders_growth' => 0],
            ['category' => 'Fashion', 'current_sales' => 0, 'previous_sales' => 0, 'sales_growth' => 0, 'current_orders' => 0, 'previous_orders' => 0, 'orders_growth' => 0],
            ['category' => 'Home & Living', 'current_sales' => 0, 'previous_sales' => 0, 'sales_growth' => 0, 'current_orders' => 0, 'previous_orders' => 0, 'orders_growth' => 0],
            ['category' => 'Beauty', 'current_sales' => 0, 'previous_sales' => 0, 'sales_growth' => 0, 'current_orders' => 0, 'previous_orders' => 0, 'orders_growth' => 0],
        ];
    }

    private function buildTimelinePoints($storeId, $daysCount, $curStart, $curEnd, $prevStart, $prevEnd)
    {
        if ($daysCount === 1) {
            $numPoints = 6;
        } elseif ($daysCount <= 7) {
            $numPoints = $daysCount;
        } elseif ($daysCount <= 35) {
            $numPoints = 7;
        } elseif ($daysCount <= 120) {
            $numPoints = 6;
        } else {
            $numPoints = min(12, max(6, (int) round($daysCount / 30)));
        }

        $timeline = [];
        $stepSeconds = ($curEnd->timestamp - $curStart->timestamp) / $numPoints;

        for ($i = 0; $i < $numPoints; $i++) {
            $sliceCurStart = Carbon::createFromTimestamp((int) ($curStart->timestamp + ($i * $stepSeconds)));
            $sliceCurEnd = Carbon::createFromTimestamp((int) ($curStart->timestamp + (($i + 1) * $stepSeconds)));

            $slicePrevStart = Carbon::createFromTimestamp((int) ($prevStart->timestamp + ($i * $stepSeconds)));
            $slicePrevEnd = Carbon::createFromTimestamp((int) ($prevStart->timestamp + (($i + 1) * $stepSeconds)));

            $curSales = (float) Order::where('store_id', $storeId)
                ->where('payment_status', 'paid')
                ->whereBetween('created_at', [$sliceCurStart, $sliceCurEnd])
                ->sum('total_amount');

            $prevSales = (float) Order::where('store_id', $storeId)
                ->where('payment_status', 'paid')
                ->whereBetween('created_at', [$slicePrevStart, $slicePrevEnd])
                ->sum('total_amount');

            $curOrders = (int) Order::where('store_id', $storeId)
                ->whereBetween('created_at', [$sliceCurStart, $sliceCurEnd])
                ->count();

            $prevOrders = (int) Order::where('store_id', $storeId)
                ->whereBetween('created_at', [$slicePrevStart, $slicePrevEnd])
                ->count();

            if ($daysCount === 1) {
                $label = $sliceCurStart->format('H:i');
                $curDateLabel = 'Today ' . $sliceCurStart->format('h:i A');
                $prevDateLabel = 'Yesterday ' . $slicePrevStart->format('h:i A');
            } elseif ($daysCount <= 35) {
                $label = $sliceCurStart->format('M d');
                $curDateLabel = $sliceCurStart->format('M d, Y');
                $prevDateLabel = $slicePrevStart->format('M d, Y');
            } elseif ($daysCount <= 120) {
                $label = $sliceCurStart->format('M d');
                $curDateLabel = $sliceCurStart->format('M d, Y');
                $prevDateLabel = $slicePrevStart->format('M d, Y');
            } else {
                $label = $sliceCurStart->format('M Y');
                $curDateLabel = $sliceCurStart->format('M Y');
                $prevDateLabel = $slicePrevStart->format('M Y');
            }

            $timeline[] = [
                'label' => $label,
                'current_date' => $curDateLabel,
                'previous_date' => $prevDateLabel,
                'current_sales' => $curSales,
                'previous_sales' => $prevSales,
                'current_orders' => $curOrders,
                'previous_orders' => $prevOrders,
            ];
        }

        return $timeline;
    }

    private function getStaticRevenueChart()
    {
        return [
            ['date' => 'Jan 1', 'revenue' => 1200],
            ['date' => 'Jan 2', 'revenue' => 1450],
            ['date' => 'Jan 3', 'revenue' => 1100],
            ['date' => 'Jan 4', 'revenue' => 1800],
            ['date' => 'Jan 5', 'revenue' => 1650],
            ['date' => 'Jan 6', 'revenue' => 2100],
            ['date' => 'Jan 7', 'revenue' => 1900],
            ['date' => 'Jan 8', 'revenue' => 2300],
            ['date' => 'Jan 9', 'revenue' => 2050],
            ['date' => 'Jan 10', 'revenue' => 2400],
            ['date' => 'Jan 11', 'revenue' => 2200],
            ['date' => 'Jan 12', 'revenue' => 2650],
            ['date' => 'Jan 13', 'revenue' => 2800],
            ['date' => 'Jan 14', 'revenue' => 2450]
        ];
    }

    private function getStaticSalesChart()
    {
        return [
            ['date' => 'Jan 1', 'orders' => 8],
            ['date' => 'Jan 2', 'orders' => 12],
            ['date' => 'Jan 3', 'orders' => 7],
            ['date' => 'Jan 4', 'orders' => 15],
            ['date' => 'Jan 5', 'orders' => 11],
            ['date' => 'Jan 6', 'orders' => 18],
            ['date' => 'Jan 7', 'orders' => 14],
            ['date' => 'Jan 8', 'orders' => 20],
            ['date' => 'Jan 9', 'orders' => 16],
            ['date' => 'Jan 10', 'orders' => 22],
            ['date' => 'Jan 11', 'orders' => 19],
            ['date' => 'Jan 12', 'orders' => 25],
            ['date' => 'Jan 13', 'orders' => 28],
            ['date' => 'Jan 14', 'orders' => 24]
        ];
    }
    public function export()
    {
        $user = Auth::user();
        $storeId = $user->current_store;

        if (!$storeId) {
            return response()->json(['error' => 'No store selected'], 400);
        }

        $analytics = [
            'metrics' => $this->getKeyMetrics($storeId),
            'topProducts' => $this->getTopProducts($storeId),
            'topCustomers' => $this->getTopCustomers($storeId),
            'revenueChart' => $this->getRevenueChartData($storeId)
        ];

        $csvData = [];
        $csvData[] = ['Analytics Export - Store ID: ' . $storeId];
        $csvData[] = ['Generated on: ' . now()->format('Y-m-d H:i:s')];
        $csvData[] = [];

        // Key Metrics
        $csvData[] = ['KEY METRICS'];
        $csvData[] = ['Metric', 'Current Value', 'Change'];
        $csvData[] = ['Revenue', formatStoreCurrency($analytics['metrics']['revenue']['current'], $user->id, $storeId), number_format($analytics['metrics']['revenue']['change'], 1) . '%'];
        $csvData[] = ['Orders', $analytics['metrics']['orders']['current'], $analytics['metrics']['orders']['change']];
        $csvData[] = ['Total Customers', $analytics['metrics']['customers']['total'], ''];
        $csvData[] = ['New Customers', $analytics['metrics']['customers']['new'], ''];
        $csvData[] = [];

        // Top Products
        $csvData[] = ['TOP PRODUCTS'];
        $csvData[] = ['Product Name', 'Units Sold', 'Revenue'];
        foreach ($analytics['topProducts'] as $product) {
            $csvData[] = [$product['name'], $product['sales'], $product['revenue']];
        }
        $csvData[] = [];

        // Top Customers
        $csvData[] = ['TOP CUSTOMERS'];
        $csvData[] = ['Customer Name', 'Orders', 'Total Spent'];
        foreach ($analytics['topCustomers'] as $customer) {
            $csvData[] = [$customer['name'], $customer['orders'], $customer['spent']];
        }
        $csvData[] = [];

        // Revenue Chart Data
        $csvData[] = ['DAILY REVENUE (Last 30 Days)'];
        $csvData[] = ['Date', 'Revenue'];
        foreach ($analytics['revenueChart'] as $data) {
            $csvData[] = [$data['date'], formatStoreCurrency($data['revenue'], $user->id, $storeId)];
        }

        $filename = 'analytics-export-' . now()->format('Y-m-d') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function () use ($csvData) {
            $file = fopen('php://output', 'w');
            foreach ($csvData as $row) {
                fputcsv($file, $row);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
