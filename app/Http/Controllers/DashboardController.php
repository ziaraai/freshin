<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Store;
use App\Models\Order;
use App\Models\Product;
use App\Models\Customer;
use App\Models\OrderItem;
use App\Models\User;
use App\Models\Plan;
use App\Models\PlanOrder;
use App\Models\PlanRequest;
use App\Models\Coupon;
use App\Models\Shipping;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        
        // Super admin gets system-wide dashboard
        if ($user->type === 'superadmin' || $user->type === 'super admin') {
            return $this->renderSuperAdminDashboard();
        }
        
        // Company users get store-based dashboard
        if ($user->type === 'company') {
            return $this->renderCompanyDashboard();
        }
        
        // Check if user has dashboard permission (skip if permission doesn't exist)
        try {
            if ($user->hasPermissionTo('manage-dashboard')) {
                return $this->renderCompanyDashboard();
            }
        } catch (\Exception $e) {
            // Permission doesn't exist, continue to dashboard for authenticated users
            return $this->renderCompanyDashboard();
        }
        
        // Redirect to first available page
        return $this->redirectToFirstAvailablePage();
    }
    
    public function redirectToFirstAvailablePage()
    {
        $user = auth()->user();
        
        // Define available routes with their permissions
        $routes = [
            ['route' => 'users.index', 'permission' => 'manage-users'],
            ['route' => 'roles.index', 'permission' => 'manage-roles'],





            ['route' => 'plans.index', 'permission' => 'manage-plans'],
            ['route' => 'referral.index', 'permission' => 'manage-referral'],
            ['route' => 'settings.index', 'permission' => 'manage-settings'],
        ];
        
        // Find first available route
        foreach ($routes as $routeData) {
            if ($user->hasPermissionTo($routeData['permission'])) {
                return redirect()->route($routeData['route']);
            }
        }
        
        // If no permissions found, logout user
        auth()->logout();
        return redirect()->route('login')->with('error', __('No access permissions found.'));
    }
    
    private function renderSuperAdminDashboard()
    {
        return Inertia::render('dashboard', [
            'dashboardData' => $this->getSuperAdminDashboardData(),
            'currentStore' => null,
            'isSuperAdmin' => true
        ]);
    }
    
    private function renderCompanyDashboard()
    {
        $user = auth()->user();
        $storeId = getCurrentStoreId($user);
        
        if (!$storeId) {
            return Inertia::render('dashboard', [
                'dashboardData' => $this->getEmptyDashboard(),
                'currentStore' => null,
                'isSuperAdmin' => false
            ]);
        }
        
        $currentStore = Store::find($storeId);
        $dashboardData = $this->getDashboardData($storeId);
        
        return Inertia::render('dashboard', [
            'dashboardData' => $dashboardData,
            'currentStore' => $currentStore,
            'storeUrl' => $currentStore->getStoreUrl(),
            'isSuperAdmin' => false
        ]);
    }
    
    private function getSuperAdminDashboardData()
    {
        $revenueYear = (int) request('revenueYear', now()->year);
        $companiesYear = (int) request('companiesYear', now()->year);

        $currentMonth = Carbon::now()->startOfMonth();
        $lastMonth = Carbon::now()->subMonth()->startOfMonth();
        
        // System-wide metrics
        $totalCompanies = User::where('type', 'company')->count();
        $totalActivePlanCompanies = User::where('type', 'company')->where(function($q) {
            $q->where('plan_is_active', '1')
              ->orWhere('plan_is_active', 1)
              ->orWhere('plan_is_active', true);
        })->count();
        $totalStores = Store::count();
        // Count active stores from store_configuration
        $activeStores = Store::whereHas('configurations', function($q) {
            $q->where('key', 'store_status')->where('value', 'true');
        })->count();
        // Add stores without configuration (default active)
        $storesWithoutConfig = Store::whereDoesntHave('configurations', function($q) {
            $q->where('key', 'store_status');
        })->count();
        $activeStores += $storesWithoutConfig;
        $totalPlans = Plan::count();
        $activePlans = Plan::where('is_plan_enable', 'on')->count();
        $totalRevenue = PlanOrder::where('status', 'approved')->sum('final_price') ?? 0;
        $monthlyRevenue = PlanOrder::where('status', 'approved')
            ->where('created_at', '>=', $currentMonth)
            ->sum('final_price') ?? 0;
        $lastMonthRevenue = PlanOrder::where('status', 'approved')
            ->whereBetween('created_at', [$lastMonth, $currentMonth])
            ->sum('final_price') ?? 0;
        
        // Fix Monthly Growth calculation for demo mode
        if (config('app.is_demo', false)) {
            $monthlyGrowth = 18.5; // Demo mode: show positive growth
        } elseif ($lastMonthRevenue > 0) {
            $monthlyGrowth = (($monthlyRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100;
        } elseif ($monthlyRevenue > 0) {
            $monthlyGrowth = 100; // 100% growth if no previous revenue but current revenue exists
        } else {
            $monthlyGrowth = 0; // No growth if both are zero
        }
        
        // Plan orders and requests
        $pendingOrders = PlanOrder::where('status', 'pending')->count();
        $approvedOrders = PlanOrder::where('status', 'approved')->count();
        $totalOrders = PlanOrder::count();
        $pendingRequests = PlanRequest::where('status', 'pending')->count();
        
        // Coupons
        $activeCoupons = Coupon::where('status', true)
            ->where(function($query) {
                $query->whereNull('expiry_date')
                      ->orWhere('expiry_date', '>=', now());
            })
            ->count();
        $totalCoupons = Coupon::count();

        // Monthly revenue chart series for selected revenueYear
        if (config('app.is_demo', false)) {
            $demoRevenue = [4200, 5800, 3900, 7100, 6400, 8900, 7600, 9200, 8100, 10500, 9800, 12400];
            $monthlyRevenueChart = [];
            for ($i = 1; $i <= 12; $i++) {
                $monthlyRevenueChart[] = [
                    'month' => date('F Y', mktime(0, 0, 0, $i, 1, $revenueYear)),
                    'short' => date('M', mktime(0, 0, 0, $i, 1, $revenueYear)),
                    'revenue' => (float) $demoRevenue[$i - 1],
                ];
            }
        } else {
            $monthlyRevenueChart = [];
            for ($i = 1; $i <= 12; $i++) {
                $revenue = PlanOrder::where('status', 'approved')
                    ->where(function ($q) use ($i, $revenueYear) {
                        $q->where(function ($sub) use ($i, $revenueYear) {
                            $sub->whereNotNull('processed_at')
                                ->whereMonth('processed_at', $i)
                                ->whereYear('processed_at', $revenueYear);
                        })->orWhere(function ($sub) use ($i, $revenueYear) {
                            $sub->whereNull('processed_at')
                                ->whereMonth('created_at', $i)
                                ->whereYear('created_at', $revenueYear);
                        });
                    })
                    ->sum('final_price') ?? 0;
                $monthlyRevenueChart[] = [
                    'month' => date('F Y', mktime(0, 0, 0, $i, 1, $revenueYear)),
                    'short' => date('M', mktime(0, 0, 0, $i, 1, $revenueYear)),
                    'revenue' => (float) $revenue,
                ];
            }
        }

        // Monthly companies registered for selected companiesYear
        if (config('app.is_demo', false)) {
            $demoCompanies = [3, 5, 4, 7, 6, 9, 8, 11, 7, 13, 10, 15];
            $monthlyCompanies = [];
            for ($i = 1; $i <= 12; $i++) {
                $monthlyCompanies[] = [
                    'month' => date('F Y', mktime(0, 0, 0, $i, 1, $companiesYear)),
                    'short' => date('M', mktime(0, 0, 0, $i, 1, $companiesYear)),
                    'count' => $demoCompanies[$i - 1],
                ];
            }
        } else {
            $monthlyCompanies = [];
            for ($i = 1; $i <= 12; $i++) {
                $count = User::where('type', 'company')
                    ->whereMonth('created_at', $i)
                    ->whereYear('created_at', $companiesYear)
                    ->count();
                $monthlyCompanies[] = [
                    'month' => date('F Y', mktime(0, 0, 0, $i, 1, $companiesYear)),
                    'short' => date('M', mktime(0, 0, 0, $i, 1, $companiesYear)),
                    'count' => $count,
                ];
            }
        }

        $firstCompanyYear = User::where('type', 'company')->min('created_at')
            ? (int) date('Y', strtotime(User::where('type', 'company')->min('created_at')))
            : now()->year;
        $firstRevenueYear = PlanOrder::where('status', 'approved')->min('created_at')
            ? (int) date('Y', strtotime(PlanOrder::where('status', 'approved')->min('created_at')))
            : now()->year;
        $minAvailableYear = min($firstCompanyYear, $firstRevenueYear, now()->year - 2);
        $availableYears = range(now()->year + 1, $minAvailableYear);
        
        // Get diverse system activities
        $recentOrders = $this->getRecentSystemActivity();

        $recentActivity = User::where('type', 'company')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get(['id', 'name', 'email', 'avatar', 'created_at'])
            ->map(function ($company) {
                return [
                    'id' => $company->id,
                    'name' => $company->name,
                    'email' => $company->email,
                    'avatar' => $company->avatar ? (function_exists('get_file') ? get_file($company->avatar) : $company->avatar) : null,
                    'registered_at' => $company->created_at->diffForHumans(),
                    'status' => 'active',
                ];
            });
        
        // Top performing plans
        $topPlans = PlanOrder::select('plan_id')
            ->selectRaw('COUNT(*) as order_count, SUM(final_price) as total_revenue')
            ->where('status', 'approved')
            ->with('plan')
            ->groupBy('plan_id')
            ->orderBy('total_revenue', 'desc')
            ->limit(5)
            ->get()
            ->map(function($item) {
                return [
                    'id' => $item->plan_id,
                    'name' => $item->plan->name ?? 'Unknown Plan',
                    'orders' => $item->order_count,
                    'revenue' => (float) $item->total_revenue,
                    'subscribers' => $item->order_count
                ];
            });

        if ($topPlans->isEmpty()) {
            $topPlans = Plan::withCount(['users' => function($q) {
                $q->where('type', 'company');
            }])
            ->orderBy('users_count', 'desc')
            ->take(5)
            ->get()
            ->map(function ($plan) {
                return [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'orders' => $plan->users_count,
                    'revenue' => (float) ($plan->users_count * $plan->price),
                    'subscribers' => $plan->users_count
                ];
            });
        }
        
        return [
            'metrics' => [
                'totalCompanies' => $totalCompanies,
                'totalActivePlanCompanies' => $totalActivePlanCompanies,
                'totalStores' => $totalStores,
                'activeStores' => $activeStores,
                'totalPlans' => $totalPlans,
                'activePlans' => $activePlans,
                'totalRevenue' => $totalRevenue,
                'monthlyRevenue' => $monthlyRevenue,
                'monthlyGrowth' => round($monthlyGrowth, 2),
                'pendingRequests' => $pendingRequests,
                'pendingOrders' => $pendingOrders,
                'approvedOrders' => $approvedOrders,
                'totalOrders' => $totalOrders,
                'activeCoupons' => $activeCoupons,
                'totalCoupons' => $totalCoupons
            ],
            'recentOrders' => $recentOrders,
            'recentActivity' => $recentActivity,
            'topPlans' => $topPlans,
            'monthlyRevenue' => $monthlyRevenueChart,
            'revenueYear' => $revenueYear,
            'availableYears' => $availableYears,
            'monthlyCompanies' => $monthlyCompanies,
            'companiesYear' => $companiesYear,
            'availableCompanyYears' => $availableYears,
        ];
    }
    
    private function getDashboardData($storeId)
    {
        $currentMonth = Carbon::now()->startOfMonth();
        $lastMonth = Carbon::now()->subMonth()->startOfMonth();
        
        $totalOrders = Order::where('store_id', $storeId)->count();
        $completedOrders = Order::where('store_id', $storeId)
            ->where(function($q) {
                $q->whereIn('status', ['completed', 'delivered', 'paid', 'Completed', 'Delivered', 'Paid'])
                  ->orWhere('payment_status', 'paid');
            })
            ->count();
        if (config('app.is_demo', false) && $completedOrders === 0 && $totalOrders > 0) {
            $completedOrders = (int) round($totalOrders * 0.75);
        }

        $totalProducts = Product::where('store_id', $storeId)->count();
        $totalCustomers = Customer::where('store_id', $storeId)->count();
        $totalRevenue = Order::where('store_id', $storeId)->sum('total_amount');

        // Today's metrics
        $todaySales = Order::where('store_id', $storeId)
            ->whereDate('created_at', Carbon::today())
            ->sum('total_amount');
        $todayOrders = Order::where('store_id', $storeId)
            ->whereDate('created_at', Carbon::today())
            ->count();

        // Monthly growth calculation
        $thisMonthRevenue = Order::where('store_id', $storeId)
            ->where('created_at', '>=', $currentMonth)
            ->sum('total_amount');
        $lastMonthRevenue = Order::where('store_id', $storeId)
            ->whereBetween('created_at', [$lastMonth, $currentMonth])
            ->sum('total_amount');

        if ($lastMonthRevenue > 0) {
            $monthlyGrowth = round((($thisMonthRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100);
        } elseif ($thisMonthRevenue > 0) {
            $monthlyGrowth = 100;
        } else {
            $monthlyGrowth = 0;
        }

        // Pending notifications (e.g. pending orders needing action)
        $notificationsCount = Order::where('store_id', $storeId)
            ->where('status', 'pending')
            ->count();
        
        $recentOrders = Order::where('store_id', $storeId)
            ->with(['customer', 'items.product'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function($order) {
                $itemImages = $order->items ? $order->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'name' => $item->product_name ?? ($item->product->name ?? 'Product'),
                        'image' => $item->product && $item->product->cover_image ? $item->product->cover_image : '/storage/media/product/product.png',
                    ];
                })->values()->toArray() : [];

                if (empty($itemImages) && config('app.is_demo', false)) {
                    $itemImages = [
                        ['id' => 1, 'name' => 'Sample Product 1', 'image' => '/storage/media/product/product.png'],
                        ['id' => 2, 'name' => 'Sample Product 2', 'image' => '/storage/media/product/product.png'],
                        ['id' => 3, 'name' => 'Sample Product 3', 'image' => '/storage/media/product/product.png'],
                    ];
                }

                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'customer' => trim(($order->customer_first_name ?? '') . ' ' . ($order->customer_last_name ?? '')) ?: ($order->customer ? $order->customer->name : 'Customer'),
                    'customer_email' => $order->customer_email ?: ($order->customer ? $order->customer->email : null),
                    'customer_photo' => $order->customer ? $order->customer->avatar : get_file('/storage/media/avatars/avatar.png'),
                    'amount' => $order->total_amount,
                    'status' => $order->status,
                    'payment_method' => $order->payment_method,
                    'payment_status' => $order->payment_status ?? 'pending',
                    'date' => $order->created_at ? $order->created_at->diffForHumans() : '',
                    'itemImages' => $itemImages,
                    'items_count' => count($itemImages),
                ];
            });
            
        $topProducts = OrderItem::select('product_id', 'product_name')
            ->selectRaw('SUM(quantity) as total_sold')
            ->whereHas('order', function($query) use ($storeId) {
                $query->where('store_id', $storeId);
            })
            ->groupBy('product_id', 'product_name')
            ->orderBy('total_sold', 'desc')
            ->limit(5)
            ->get()
            ->map(function($item) {
                $product = Product::find($item->product_id);
                return [
                    'id' => $item->product_id,
                    'name' => $item->product_name,
                    'sold' => (int) $item->total_sold,
                    'price' => $product ? (float) $product->price : 0,
                    'sale_price' => $product && $product->sale_price ? (float) $product->sale_price : null,
                    'image' => $product && $product->cover_image ? $product->cover_image : null,
                ];
            });

        if ($topProducts->isEmpty() && config('app.is_demo', false)) {
            $topProducts = collect([
                [
                    'id' => 1,
                    'name' => 'Premium Wireless Headphones',
                    'sold' => 48,
                    'price' => 129.99,
                    'sale_price' => 99.99,
                    'image' => '/storage/media/product/product.png',
                ],
                [
                    'id' => 2,
                    'name' => 'Smart Fitness Watch Series 5',
                    'sold' => 36,
                    'price' => 199.00,
                    'sale_price' => 179.00,
                    'image' => '/storage/media/product/product.png',
                ],
                [
                    'id' => 3,
                    'name' => 'Ergonomic Mechanical Keyboard',
                    'sold' => 29,
                    'price' => 89.50,
                    'sale_price' => null,
                    'image' => '/storage/media/product/product.png',
                ],
                [
                    'id' => 4,
                    'name' => 'Noise-Cancelling Earbuds Pro',
                    'sold' => 22,
                    'price' => 69.99,
                    'sale_price' => 54.99,
                    'image' => '/storage/media/product/product.png',
                ],
                [
                    'id' => 5,
                    'name' => 'Ultra-Slim Fast Wireless Charger',
                    'sold' => 18,
                    'price' => 34.00,
                    'sale_price' => null,
                    'image' => '/storage/media/product/product.png',
                ],
            ]);
        }

        $recentShippingMethods = Shipping::where('store_id', $storeId)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function($shipping) {
                return [
                    'id' => $shipping->id,
                    'name' => $shipping->name,
                    'type' => $shipping->type,
                    'cost' => (float)$shipping->cost,
                    'delivery_time' => $shipping->delivery_time,
                    'is_active' => (bool)$shipping->is_active,
                ];
            });

        if ($recentShippingMethods->isEmpty() && config('app.is_demo', false)) {
            $recentShippingMethods = collect([
                [
                    'id' => 1,
                    'name' => 'Express Courier Delivery',
                    'type' => 'express',
                    'cost' => 15.00,
                    'delivery_time' => '1-2 Days',
                    'is_active' => true,
                ],
                [
                    'id' => 2,
                    'name' => 'Standard Ground Shipping',
                    'type' => 'flat_rate',
                    'cost' => 5.00,
                    'delivery_time' => '3-5 Days',
                    'is_active' => true,
                ],
                [
                    'id' => 3,
                    'name' => 'Free Local Delivery',
                    'type' => 'free_shipping',
                    'cost' => 0.00,
                    'delivery_time' => '2-3 Days',
                    'is_active' => true,
                ],
                [
                    'id' => 4,
                    'name' => 'Store Pickup',
                    'type' => 'local_pickup',
                    'cost' => 0.00,
                    'delivery_time' => 'Same Day',
                    'is_active' => true,
                ],
                [
                    'id' => 5,
                    'name' => 'Next-Day Priority Air',
                    'type' => 'express',
                    'cost' => 25.00,
                    'delivery_time' => '1 Day',
                    'is_active' => true,
                ],
            ]);
        }
        
        // Available years for dropdowns
        $availableYears = Order::where('store_id', $storeId)
            ->selectRaw('YEAR(created_at) as order_year')
            ->distinct()
            ->pluck('order_year')
            ->filter()
            ->map(fn($y) => (int)$y)
            ->toArray();

        $currentYear = (int) Carbon::now()->year;
        if (!in_array($currentYear, $availableYears)) {
            $availableYears[] = $currentYear;
        }
        for ($y = $currentYear - 2; $y <= $currentYear; $y++) {
            if (!in_array($y, $availableYears)) {
                $availableYears[] = $y;
            }
        }
        rsort($availableYears);
        $availableYears = array_values(array_unique($availableYears));

        // Sales and orders chart data based on selected year (all 12 months)
        $salesYear = (int) request('salesYear', request('sales_year', Carbon::now()->year));
        if ($salesYear < 2000 || $salesYear > 2100) {
            $salesYear = (int) Carbon::now()->year;
        }

        $isDemo = config('app.is_demo', false) || env('APP_IS_DEMO', false) || env('IS_DEMO', false);
        $monthsLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        if ($isDemo) {
            $baseSales = [3200, 4100, 3800, 5200, 4600, 6100, 5800, 6700, 6200, 7400, 8100, 9300];
            $baseOrders = [12, 16, 14, 21, 18, 25, 23, 27, 24, 30, 33, 39];
            $yearFactor = 1.0 + ((($salesYear % 5) - 2) * 0.1);

            $salesChartData = [];
            foreach ($monthsLabels as $idx => $mName) {
                $salesChartData[] = [
                    'label' => $mName,
                    'month' => $idx + 1,
                    'sales' => (float) round($baseSales[$idx] * $yearFactor, 2),
                    'orders' => (int) round($baseOrders[$idx] * $yearFactor),
                ];
            }
        } else {
            $salesChartData = [];
            for ($m = 1; $m <= 12; $m++) {
                $completedAmount = Order::where('store_id', $storeId)
                    ->whereYear('created_at', $salesYear)
                    ->whereMonth('created_at', $m)
                    ->where(function($q) {
                        $q->whereIn('status', ['completed', 'delivered', 'paid', 'Completed', 'Delivered', 'Paid'])
                          ->orWhere('payment_status', 'paid');
                    })
                    ->sum('total_amount') ?? 0;
                $amount = $completedAmount > 0 ? $completedAmount : (Order::where('store_id', $storeId)
                    ->whereYear('created_at', $salesYear)
                    ->whereMonth('created_at', $m)
                    ->sum('total_amount') ?? 0);
                $ordersCount = Order::where('store_id', $storeId)
                    ->whereYear('created_at', $salesYear)
                    ->whereMonth('created_at', $m)
                    ->count() ?? 0;

                $salesChartData[] = [
                    'label' => Carbon::create($salesYear, $m, 1)->format('M'),
                    'month' => $m,
                    'sales' => (float) max(0, $amount),
                    'orders' => (int) $ordersCount,
                ];
            }
        }

        // Category sales chart data based on year and month filter
        $categoryYear = (int) request('categoryYear', request('category_year', Carbon::now()->year));
        $categoryMonth = (int) request('categoryMonth', request('category_month', Carbon::now()->month));
        if ($categoryYear < 2000 || $categoryYear > 2100) {
            $categoryYear = (int) Carbon::now()->year;
        }
        if ($categoryMonth < 1 || $categoryMonth > 12) {
            $categoryMonth = (int) Carbon::now()->month;
        }

        if ($isDemo) {
            $demoCategories = [
                ['category' => 'Electronics', 'sales' => 12450.00, 'quantity' => 114, 'orders' => 86],
                ['category' => 'Fashion & Apparel', 'sales' => 9820.00, 'quantity' => 165, 'orders' => 110],
                ['category' => 'Home & Living', 'sales' => 7640.00, 'quantity' => 72, 'orders' => 58],
                ['category' => 'Beauty & Care', 'sales' => 6150.00, 'quantity' => 128, 'orders' => 79],
                ['category' => 'Sports & Outdoors', 'sales' => 4920.00, 'quantity' => 54, 'orders' => 42],
                ['category' => 'Food & Groceries', 'sales' => 3850.00, 'quantity' => 92, 'orders' => 64],
                ['category' => 'Books & Media', 'sales' => 2480.00, 'quantity' => 46, 'orders' => 35],
            ];
            $factor = 1.0 + ((($categoryMonth * 7 + $categoryYear) % 6) * 0.08) - 0.15;
            $categoryChartData = array_map(function($item) use ($factor) {
                return [
                    'category' => $item['category'],
                    'sales' => (float) round($item['sales'] * $factor, 2),
                    'quantity' => (int) round($item['quantity'] * $factor),
                    'orders' => (int) round($item['orders'] * $factor),
                ];
            }, $demoCategories);
        } else {
            $categorySales = DB::table('order_items')
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->join('products', 'order_items.product_id', '=', 'products.id')
                ->join('categories', 'products.category_id', '=', 'categories.id')
                ->where('orders.store_id', $storeId)
                ->whereYear('orders.created_at', $categoryYear)
                ->whereMonth('orders.created_at', $categoryMonth)
                ->select(
                    'categories.id as category_id',
                    'categories.name as category_name',
                    DB::raw('SUM(order_items.total_price) as total_sales'),
                    DB::raw('SUM(order_items.quantity) as total_quantity'),
                    DB::raw('COUNT(DISTINCT orders.id) as orders_count')
                )
                ->groupBy('categories.id', 'categories.name')
                ->orderByDesc('total_sales')
                ->get();

            $categorySalesMap = $categorySales->keyBy('category_id');

            $storeCategories = DB::table('categories')
                ->where('store_id', $storeId)
                ->orderBy('name')
                ->get();

            if ($storeCategories->isNotEmpty()) {
                $categoryChartData = $storeCategories->map(function($cat) use ($categorySalesMap) {
                    $item = $categorySalesMap->get($cat->id);
                    return [
                        'category' => $cat->name,
                        'sales' => $item ? (float) max(0, $item->total_sales) : 0.0,
                        'quantity' => $item ? (int) $item->total_quantity : 0,
                        'orders' => $item ? (int) $item->orders_count : 0,
                    ];
                })->sortByDesc('sales')->values()->toArray();
            } else {
                $categoryChartData = $categorySales->map(function($item) {
                    return [
                        'category' => $item->category_name,
                        'sales' => (float) max(0, $item->total_sales),
                        'quantity' => (int) $item->total_quantity,
                        'orders' => (int) $item->orders_count,
                    ];
                })->values()->toArray();

                if (empty($categoryChartData)) {
                    $fallbackCats = DB::table('categories')->distinct()->limit(5)->pluck('name')->toArray();
                    if (empty($fallbackCats)) {
                        $fallbackCats = ['Electronics', 'Fashion', 'Home & Living', 'Beauty', 'Sports'];
                    }
                    $categoryChartData = array_map(function($cName) {
                        return [
                            'category' => $cName,
                            'sales' => 0.0,
                            'quantity' => 0,
                            'orders' => 0,
                        ];
                    }, $fallbackCats);
                }
            }
        }
        
        return [
            'metrics' => [
                'orders' => $totalOrders,
                'completedOrders' => $completedOrders,
                'products' => $totalProducts,
                'customers' => $totalCustomers,
                'revenue' => $totalRevenue,
                'todaySales' => (float)$todaySales,
                'todayOrders' => $todayOrders,
                'monthlyGrowth' => $monthlyGrowth,
                'notificationsCount' => $notificationsCount,
            ],
            'recentOrders' => $recentOrders,
            'topProducts' => $topProducts,
            'recentShippingMethods' => $recentShippingMethods,
            'salesChartData' => $salesChartData,
            'salesYear' => $salesYear,
            'salesPeriod' => (string) $salesYear,
            'categoryChartData' => $categoryChartData,
            'categoryYear' => $categoryYear,
            'categoryMonth' => (string) $categoryMonth,
            'availableYears' => $availableYears,
        ];
    }
    
    private function getEmptyDashboard()
    {
        $isDemo = config('app.is_demo', false) || env('APP_IS_DEMO', false) || env('IS_DEMO', false);
        $currentYear = (int) Carbon::now()->year;
        $currentMonth = (int) Carbon::now()->month;
        $monthsLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        if ($isDemo) {
            $baseSales = [3200, 4100, 3800, 5200, 4600, 6100, 5800, 6700, 6200, 7400, 8100, 9300];
            $baseOrders = [12, 16, 14, 21, 18, 25, 23, 27, 24, 30, 33, 39];
            $demoChart = [];
            foreach ($monthsLabels as $idx => $mName) {
                $demoChart[] = [
                    'label' => $mName,
                    'month' => $idx + 1,
                    'sales' => (float) $baseSales[$idx],
                    'orders' => (int) $baseOrders[$idx],
                ];
            }

            $demoCategories = [
                ['category' => 'Electronics', 'sales' => 12450.00, 'quantity' => 114, 'orders' => 86],
                ['category' => 'Fashion & Apparel', 'sales' => 9820.00, 'quantity' => 165, 'orders' => 110],
                ['category' => 'Home & Living', 'sales' => 7640.00, 'quantity' => 72, 'orders' => 58],
                ['category' => 'Beauty & Care', 'sales' => 6150.00, 'quantity' => 128, 'orders' => 79],
                ['category' => 'Sports & Outdoors', 'sales' => 4920.00, 'quantity' => 54, 'orders' => 42],
                ['category' => 'Food & Groceries', 'sales' => 3850.00, 'quantity' => 92, 'orders' => 64],
                ['category' => 'Books & Media', 'sales' => 2480.00, 'quantity' => 46, 'orders' => 35],
            ];

            return [
                'metrics' => [
                    'orders' => 186,
                    'completedOrders' => 142,
                    'products' => 24,
                    'customers' => 89,
                    'revenue' => 17740.00,
                    'todaySales' => 3280.00,
                    'todayOrders' => 27,
                    'monthlyGrowth' => 18.5,
                    'notificationsCount' => 3,
                ],
                'recentOrders' => [],
                'topProducts' => [],
                'recentShippingMethods' => [],
                'salesChartData' => $demoChart,
                'salesYear' => $currentYear,
                'salesPeriod' => (string) $currentYear,
                'categoryChartData' => $demoCategories,
                'categoryYear' => $currentYear,
                'categoryMonth' => (string) $currentMonth,
                'availableYears' => [$currentYear, $currentYear - 1, $currentYear - 2],
            ];
        }

        $emptySalesChart = [];
        foreach ($monthsLabels as $idx => $mName) {
            $emptySalesChart[] = [
                'label' => $mName,
                'month' => $idx + 1,
                'sales' => 0.0,
                'orders' => 0,
            ];
        }

        return [
            'metrics' => [
                'orders' => 0,
                'completedOrders' => 0,
                'products' => 0,
                'customers' => 0,
                'revenue' => 0,
                'todaySales' => 0,
                'todayOrders' => 0,
                'monthlyGrowth' => 0,
                'notificationsCount' => 0,
            ],
            'recentOrders' => [],
            'topProducts' => [],
            'recentShippingMethods' => [],
            'salesChartData' => $emptySalesChart,
            'salesYear' => $currentYear,
            'salesPeriod' => (string) $currentYear,
            'categoryChartData' => array_map(function($c) {
                return ['category' => $c, 'sales' => 0.0, 'quantity' => 0, 'orders' => 0];
            }, ['Electronics', 'Fashion', 'Home & Living', 'Beauty', 'Sports']),
            'categoryYear' => $currentYear,
            'categoryMonth' => (string) $currentMonth,
            'availableYears' => [$currentYear, $currentYear - 1, $currentYear - 2],
        ];
    }
    
    public function export()
    {
        $user = auth()->user();
        
        if ($user->isSuperAdmin()) {
            return $this->exportSuperAdminDashboard();
        }
        
        $storeId = getCurrentStoreId($user);
        
        if (!$storeId) {
            return response()->json(['error' => 'No store selected'], 400);
        }
        
        $store = Store::find($storeId);
        $dashboardData = $this->getDashboardData($storeId);
        
        $csvData = [];
        $csvData[] = ['Dashboard Export - ' . $store->name];
        $csvData[] = ['Generated on: ' . now()->format('Y-m-d H:i:s')];
        $csvData[] = [];
        
        // Metrics
        $csvData[] = ['METRICS'];
        $csvData[] = ['Total Orders', $dashboardData['metrics']['orders']];
        $csvData[] = ['Total Products', $dashboardData['metrics']['products']];
        $csvData[] = ['Total Customers', $dashboardData['metrics']['customers']];
        $csvData[] = ['Total Revenue', formatStoreCurrency($dashboardData['metrics']['revenue'], $user->id, $storeId)];
        $csvData[] = [];
        
        // Recent Orders
        $csvData[] = ['RECENT ORDERS'];
        $csvData[] = ['Order Number', 'Customer', 'Amount', 'Status'];
        foreach ($dashboardData['recentOrders'] as $order) {
            $csvData[] = [$order['order_number'], $order['customer'], formatStoreCurrency($order['amount'], $user->id, $storeId), $order['status']];
        }
        $csvData[] = [];
        
        // Top Products
        $csvData[] = ['TOP PRODUCTS'];
        $csvData[] = ['Product Name', 'Units Sold', 'Price'];
        foreach ($dashboardData['topProducts'] as $product) {
            $csvData[] = [$product['name'], $product['sold'], formatStoreCurrency($product['price'], $user->id, $storeId)];
        }
        
        $filename = 'dashboard-export-' . $store->slug . '-' . now()->format('Y-m-d') . '.csv';
        
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
    
    private function exportSuperAdminDashboard()
    {
        $dashboardData = $this->getSuperAdminDashboardData();
        
        $csvData = [];
        $csvData[] = ['WhatsStore Super Admin Dashboard Export'];
        $csvData[] = ['Generated on: ' . now()->format('Y-m-d H:i:s')];
        $csvData[] = [];
        
        // System Metrics
        $csvData[] = ['SYSTEM OVERVIEW'];
        $csvData[] = ['Total Companies', $dashboardData['metrics']['totalCompanies']];
        $csvData[] = ['Total Stores', $dashboardData['metrics']['totalStores']];
        $csvData[] = ['Active Stores', $dashboardData['metrics']['activeStores']];
        $csvData[] = ['Total Revenue', '$' . number_format($dashboardData['metrics']['totalRevenue'], 2)];
        $csvData[] = ['Monthly Growth', $dashboardData['metrics']['monthlyGrowth'] . '%'];
        $csvData[] = ['Monthly Revenue', '$' . number_format($dashboardData['metrics']['monthlyRevenue'], 2)];
        $csvData[] = [];
        
        // Plan Management
        $csvData[] = ['PLAN MANAGEMENT'];
        $csvData[] = ['Active Plans', $dashboardData['metrics']['activePlans']];
        $csvData[] = ['Total Plans', $dashboardData['metrics']['totalPlans']];
        $csvData[] = ['Approved Orders', $dashboardData['metrics']['approvedOrders']];
        $csvData[] = ['Pending Orders', $dashboardData['metrics']['pendingOrders']];
        $csvData[] = ['Pending Requests', $dashboardData['metrics']['pendingRequests']];
        $csvData[] = [];
        
        // System Features
        $csvData[] = ['SYSTEM FEATURES'];
        $csvData[] = ['Active Coupons', $dashboardData['metrics']['activeCoupons']];
        $csvData[] = ['Total Coupons', $dashboardData['metrics']['totalCoupons']];
        $csvData[] = [];
        
        // Recent Orders
        $csvData[] = ['RECENT PLAN ORDERS'];
        $csvData[] = ['Order Number', 'Company', 'Plan', 'Amount', 'Status'];
        foreach ($dashboardData['recentOrders'] as $order) {
            $csvData[] = [$order['order_number'], $order['company'], $order['plan'], '$' . number_format($order['amount'], 2), $order['status']];
        }
        $csvData[] = [];
        
        // Top Plans
        if (!empty($dashboardData['topPlans'])) {
            $csvData[] = ['TOP PERFORMING PLANS'];
            $csvData[] = ['Plan Name', 'Orders', 'Revenue', 'Monthly Price'];
            foreach ($dashboardData['topPlans'] as $plan) {
                $csvData[] = [$plan['name'], $plan['orders'], '$' . number_format($plan['revenue'], 2), '$' . number_format($plan['price'], 2)];
            }
        }
        
        $filename = 'whatsstore-superadmin-dashboard-export-' . now()->format('Y-m-d') . '.csv';
        
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
    
    /**
     * Get recent system activity for super admin dashboard
     */
    private function getRecentSystemActivity()
    {
        $activities = [];
        
        // Recent company registrations
        $recentCompanies = User::where('type', 'company')
            ->latest()
            ->take(2)
            ->get();
            
        foreach ($recentCompanies as $company) {
            $activities[] = [
                'id' => 'company_' . $company->id,
                'type' => 'company_registered',
                'description' => 'New company "' . $company->name . '" registered',
                'company' => $company->name,
                'time' => $company->created_at->diffForHumans(),
                'date' => $company->created_at->format('M d, Y'),
                'status' => 'active',
                'created_at' => $company->created_at
            ];
        }
        
        // Recent store creations
        $recentStores = Store::with('user')
            ->latest()
            ->take(2)
            ->get();
            
        foreach ($recentStores as $store) {
            $activities[] = [
                'id' => 'store_' . $store->id,
                'type' => 'store_created',
                'description' => 'New store "' . $store->name . '" created by ' . ($store->user->name ?? 'Unknown'),
                'company' => $store->user->name ?? 'Unknown',
                'time' => $store->created_at->diffForHumans(),
                'date' => $store->created_at->format('M d, Y'),
                'status' => ($store->config_status ?? true) ? 'active' : 'inactive',
                'created_at' => $store->created_at
            ];
        }
        
        // Recent plan subscriptions (approved orders)
        $recentSubscriptions = PlanOrder::with(['user', 'plan'])
            ->where('status', 'approved')
            ->latest()
            ->take(2)
            ->get();
            
        foreach ($recentSubscriptions as $order) {
            $activities[] = [
                'id' => 'subscription_' . $order->id,
                'type' => 'plan_subscribed',
                'description' => ($order->user->name ?? 'Unknown') . ' subscribed to "' . ($order->plan->name ?? 'Unknown Plan') . '"',
                'company' => $order->user->name ?? 'Unknown',
                'time' => $order->created_at->diffForHumans(),
                'date' => $order->created_at->format('M d, Y'),
                'status' => 'approved',
                'created_at' => $order->created_at
            ];
        }
        
        // Recent plan requests
        $recentRequests = PlanRequest::with(['user', 'plan'])
            ->latest()
            ->take(1)
            ->get();
            
        foreach ($recentRequests as $request) {
            $activities[] = [
                'id' => 'request_' . $request->id,
                'type' => 'plan_requested',
                'description' => ($request->user->name ?? 'Unknown') . ' requested "' . ($request->plan->name ?? 'Unknown Plan') . '" upgrade',
                'company' => $request->user->name ?? 'Unknown',
                'time' => $request->created_at->diffForHumans(),
                'date' => $request->created_at->format('M d, Y'),
                'status' => $request->status,
                'created_at' => $request->created_at
            ];
        }
        
        // Sort by creation time (most recent first)
        usort($activities, function($a, $b) {
            return $b['created_at']->timestamp - $a['created_at']->timestamp;
        });
        
        // Remove created_at from final output and return top 5
        return collect(array_slice($activities, 0, 5))->map(function($activity) {
            unset($activity['created_at']);
            return $activity;
        })->toArray();
    }
}