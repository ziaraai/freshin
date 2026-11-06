<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\PlanController;
use App\Http\Controllers\PlanOrderController;
use App\Http\Controllers\PlanRequestController;
use App\Http\Controllers\RoleController;

use App\Http\Controllers\ReferralController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CompanyController;


use App\Http\Controllers\CouponController;

use App\Http\Controllers\CurrencyController;
use App\Http\Controllers\ImpersonateController;
use App\Http\Controllers\TranslationController;
use App\Http\Controllers\LandingPageController;

use App\Http\Controllers\LandingPage\CustomPageController;
use App\Http\Controllers\LandingPage\ContactController;
use App\Http\Controllers\LanguageController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\StripePaymentController;
use App\Http\Controllers\ThemeController;


use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Main landing page
Route::get('/', [LandingPageController::class, 'show'])->name('home');

// Cart API routes
Route::get('api/cart', [\App\Http\Controllers\Api\CartController::class, 'index'])->name('api.cart.index');
Route::post('api/cart/add', [\App\Http\Controllers\Api\CartController::class, 'add'])->name('api.cart.add');
Route::put('api/cart/{id}', [\App\Http\Controllers\Api\CartController::class, 'update'])->name('api.cart.update');
Route::delete('api/cart/{id}', [\App\Http\Controllers\Api\CartController::class, 'remove'])->name('api.cart.remove');
Route::post('api/cart/sync', [\App\Http\Controllers\Api\CartController::class, 'sync'])->name('api.cart.sync');

// Coupon API routes
Route::prefix('api/coupon')->name('api.coupon.')->group(function () {
    Route::post('/validate', [\App\Http\Controllers\Api\CouponController::class, 'validate'])->name('validate');
});

// Shipping API routes
Route::get('api/shipping-methods', [\App\Http\Controllers\Api\ShippingController::class, 'getMethods'])->name('api.shipping.methods');

// Payment API routes
Route::get('api/payment-methods', [\App\Http\Controllers\Api\PaymentController::class, 'getMethods'])->name('api.payment.methods');

// Orders API routes
Route::prefix('api/orders')->name('api.orders.')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\OrderController::class, 'index'])->name('index');
    Route::get('/{orderNumber}', [\App\Http\Controllers\Api\OrderController::class, 'show'])->name('show');
});

// Wishlist API routes
Route::prefix('api/wishlist')->name('api.wishlist.')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\WishlistController::class, 'index'])->name('index');
    Route::post('/add', [\App\Http\Controllers\Api\WishlistController::class, 'add'])->name('add');
    Route::delete('/{id}', [\App\Http\Controllers\Api\WishlistController::class, 'remove'])->name('remove');
    Route::post('/toggle', [\App\Http\Controllers\Api\WishlistController::class, 'toggle'])->name('toggle');
});


Route::prefix('api/locations')->group(function () {
    Route::get('countries', [\App\Http\Controllers\Api\LocationController::class, 'getCountries'])->name('api.locations.countries');
    Route::get('states/{countryId}', [\App\Http\Controllers\Api\LocationController::class, 'getStatesByCountry'])->name('api.locations.states');
    Route::get('cities/{stateId}', [\App\Http\Controllers\Api\LocationController::class, 'getCitiesByState'])->name('api.locations.cities');
});

// PWA routes (outside middleware to avoid conflicts)
Route::get('store/{storeSlug}/manifest.json', [\App\Http\Controllers\PWAController::class, 'manifest'])->name('store.pwa.manifest');
Route::get('store/{storeSlug}/service-worker', [\App\Http\Controllers\PWAController::class, 'serviceWorker'])->name('store.pwa.sw');
Route::get('store/{storeSlug}/pwa-icon/{size}', [\App\Http\Controllers\PWAController::class, 'icon'])->name('store.pwa.icon');

// Store frontend routes with store prefix
Route::prefix('store/{storeSlug}')->middleware('store.status')->group(function () {
    // Main store routes
    Route::get('/', [ThemeController::class, 'home'])->name('store.home');
    Route::get('/order/{orderNumber}', [ThemeController::class, 'orderDetail'])->name('store.order-detail');

    // Auth routes
    Route::post('/login', [\App\Http\Controllers\Store\AuthController::class, 'login'])->name('store.login');
    Route::post('/register', [\App\Http\Controllers\Store\AuthController::class, 'register'])->name('store.register');
    Route::post('/logout', [\App\Http\Controllers\Store\AuthController::class, 'logout'])->name('store.logout');

    // Profile routes
    Route::post('/profile/update', [\App\Http\Controllers\Store\ProfileController::class, 'updateProfile'])->name('store.profile.update');
    Route::post('/profile/password', [\App\Http\Controllers\Store\ProfileController::class, 'updatePassword'])->name('store.profile.password');

    // Password reset routes
    Route::post('/forgot-password', [\App\Http\Controllers\Store\AuthController::class, 'forgotPassword'])->name('store.forgot-password');
    Route::get('/reset-password/{token}', [\App\Http\Controllers\Store\AuthController::class, 'showResetForm'])->name('store.reset-password');
    Route::post('/reset-password', [\App\Http\Controllers\Store\AuthController::class, 'resetPassword'])->name('store.reset-password.update');

    // Order routes
    Route::get('/ordering-status', [\App\Http\Controllers\Store\OrderingScheduleController::class, 'show'])->name('store.ordering-status');
    Route::post('/order/place', [\App\Http\Controllers\Store\OrderController::class, 'placeOrder'])->name('store.order.place');
    Route::get('/stripe/success/{orderNumber}', [\App\Http\Controllers\Store\StripeController::class, 'success'])->name('store.stripe.success');
    // Route::get('/forgot-password', [ThemeController::class, 'forgotPassword'])->name('store.forgot-password');
    // Route::get('/reset-password/{token}', [ThemeController::class, 'resetPassword'])->name('store.reset-password');

    // Checkout routes
    Route::get('/order-confirmation/{orderNumber?}', [ThemeController::class, 'orderConfirmation'])->name('store.order-confirmation');


});


// WhatsApp Store Theme Demo Routes
Route::get('/whatsapp-demo', function () {
    return Inertia::render('store/whatsapp-demo');
})->name('whatsapp.demo');

Route::get('/whatsapp-food-demo', function () {
    return Inertia::render('store/whatsapp-food-demo');
})->name('whatsapp.food.demo');

Route::get('/whatsapp-fashion-demo', function () {
    return Inertia::render('store/whatsapp-fashion-demo');
})->name('whatsapp.fashion.demo');

// Order invoice demo route
Route::get('/demo-order/{orderNumber}', function ($orderNumber) {
    return Inertia::render('store/order-invoice', [
        'orderNumber' => $orderNumber,
        'order' => [
            'id' => $orderNumber,
            'date' => now()->toISOString(),
            'status' => 'confirmed',
            'total' => 299.99,
            'subtotal' => 249.99,
            'tax' => 25.00,
            'shipping' => 25.00,
            'discount' => 25.00,
            'coupon' => 'SAVE10',
            'payment_method' => 'Credit Card',
            'currency' => '$',
            'shipping_address' => [
                'name' => 'John Doe',
                'address' => '123 Main Street',
                'city' => 'New York',
                'state' => 'NY',
                'postal_code' => '10001',
                'country' => 'United States'
            ],
            'customer' => [
                'name' => 'John Doe',
                'email' => 'john@example.com',
                'phone' => '+1234567890'
            ],
            'items' => [
                [
                    'name' => 'iPhone 15 Pro Max 256GB',
                    'quantity' => 1,
                    'price' => 249.99,
                    'image' => 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=100&h=100&fit=crop'
                ],
                [
                    'name' => 'Samsung Pro Max',
                    'quantity' => 1,
                    'price' => 99.99,
                    'image' => 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=400&fit=crop'
                ]
            ]
        ]
    ]);
})->name('order.invoice');


// Public form submission routes


Route::get('/landing-page', [LandingPageController::class, 'settings'])->middleware(['auth'])->name('landing-page');

Route::post('/landing-page/subscribe', [LandingPageController::class, 'subscribe'])->name('landing-page.subscribe');
Route::post('/landing-page/contact', [LandingPageController::class, 'submitContact'])->name('landing-page.contact');
Route::get('/page/{slug}', [CustomPageController::class, 'show'])->name('custom-page.show');

// Cookie consent routes
Route::post('/cookie-consent/store', [\App\Http\Controllers\CookieConsentController::class, 'store'])->name('cookie.consent.store');
Route::get('/cookie-consent/download', [\App\Http\Controllers\CookieConsentController::class, 'download'])->name('cookie.consent.download');

Route::get('/translations/{locale}', [TranslationController::class, 'getTranslations'])->name('translations');


// Email Templates routes - moved inside authenticated middleware
Route::middleware(['auth'])->group(function () {
    Route::get('email-templates', [\App\Http\Controllers\EmailTemplateController::class, 'index'])->name('email-templates.index');
    Route::get('email-templates/{emailTemplate}', [\App\Http\Controllers\EmailTemplateController::class, 'show'])->name('email-templates.show');
    Route::put('email-templates/{emailTemplate}/settings', [\App\Http\Controllers\EmailTemplateController::class, 'updateSettings'])->name('email-templates.update-settings');
    Route::put('email-templates/{emailTemplate}/content', [\App\Http\Controllers\EmailTemplateController::class, 'updateContent'])->name('email-templates.update-content');
    Route::get('email-templates/{emailTemplate}/preview', [\App\Http\Controllers\EmailTemplateController::class, 'preview'])->name('email-templates.preview');
    Route::get('email-templates/{emailTemplate}/variables', [\App\Http\Controllers\EmailTemplateController::class, 'getVariables'])->name('email-templates.variables');
});

// Notification Templates routes
Route::middleware(['auth'])->group(function () {
    Route::get('notification-templates', [\App\Http\Controllers\NotificationTemplateController::class, 'index'])->name('notification-templates.index');
    Route::get('notification-templates/{id}', [\App\Http\Controllers\NotificationTemplateController::class, 'show'])->name('notification-templates.show');
    Route::put('notification-templates/{id}', [\App\Http\Controllers\NotificationTemplateController::class, 'update'])->name('notification-templates.update');
});

// Trial route with only auth middleware
Route::middleware(['auth'])->group(function () {
    Route::post('plans/trial', [PlanController::class, 'startTrial'])->name('plans.trial');
});

Route::middleware(['auth', 'verified'])->group(function () {
    // Plans routes - accessible without plan check
    Route::get('plans', [PlanController::class, 'index'])->middleware('permission:manage-plans')->name('plans.index');
    Route::post('plans/request', [PlanController::class, 'requestPlan'])->middleware('permission:request-plans')->name('plans.request');
    Route::post('plans/subscribe', [PlanController::class, 'subscribe'])->middleware('permission:subscribe-plans')->name('plans.subscribe');
    Route::post('plans/coupons/validate', [CouponController::class, 'validate'])->name('coupons.validate');

    // Payment routes - accessible without plan check
    Route::post('payments/stripe', [StripePaymentController::class, 'processPayment'])->name('stripe.payment');


    // Payment gateway specific routes

    // Other payment creation routes

    // Payment success/callback routes


    // Plan Requests and Orders - accessible to company users
    Route::get('plan-requests', [PlanRequestController::class, 'index'])->name('plan-requests.index');
    Route::get('plan-orders', [PlanOrderController::class, 'index'])->name('plan-orders.index');

    // All other routes require plan access check
    Route::middleware('plan.access')->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
        Route::get('dashboard/redirect', [DashboardController::class, 'redirectToFirstAvailablePage'])->name('dashboard.redirect');
        Route::get('dashboard/export', [DashboardController::class, 'export'])->name('dashboard.export');

        // Store Management routes with permissions
        Route::get('stores', [\App\Http\Controllers\StoreController::class, 'index'])->middleware('permission:manage-stores')->name('stores.index');
        Route::get('stores/export', [\App\Http\Controllers\StoreController::class, 'export'])->middleware('permission:export-stores')->name('stores.export');
        Route::get('stores/create', [\App\Http\Controllers\StoreController::class, 'create'])->middleware('permission:create-stores')->name('stores.create');
        Route::post('stores', [\App\Http\Controllers\StoreController::class, 'store'])->middleware('permission:create-stores')->name('stores.store');
        Route::get('stores/{id}/edit', [\App\Http\Controllers\StoreController::class, 'edit'])->middleware('permission:edit-stores')->name('stores.edit');
        Route::put('stores/{id}', [\App\Http\Controllers\StoreController::class, 'update'])->middleware('permission:edit-stores')->name('stores.update');
        Route::delete('stores/{id}', [\App\Http\Controllers\StoreController::class, 'destroy'])->middleware('permission:delete-stores')->name('stores.destroy');
        Route::get('stores/{id}', [\App\Http\Controllers\StoreController::class, 'show'])->middleware('permission:view-stores')->name('stores.show');
        Route::post('stores/{id}/toggle-status', [\App\Http\Controllers\StoreController::class, 'toggleStatus'])->middleware('permission:edit-stores')->name('stores.toggle-status');
        Route::get('stores/{id}/settings', [\App\Http\Controllers\StoreSettingsController::class, 'show'])->middleware('permission:settings-stores')->name('stores.settings');
        Route::put('stores/{id}/settings', [\App\Http\Controllers\StoreSettingsController::class, 'update'])->middleware('permission:settings-stores')->name('stores.settings.update');

        // Product Management routes with permissions
        Route::get('products', [\App\Http\Controllers\ProductController::class, 'index'])->middleware('permission:manage-products')->name('products.index');
        Route::get('products/export', [\App\Http\Controllers\ProductController::class, 'export'])->middleware('permission:export-products')->name('products.export');
        Route::get('products/create', [\App\Http\Controllers\ProductController::class, 'create'])->middleware('permission:create-products')->name('products.create');
        Route::post('products', [\App\Http\Controllers\ProductController::class, 'store'])->middleware('permission:create-products')->name('products.store');
        Route::get('products/{id}/edit', [\App\Http\Controllers\ProductController::class, 'edit'])->middleware('permission:edit-products')->name('products.edit');
        Route::put('products/{id}', [\App\Http\Controllers\ProductController::class, 'update'])->middleware('permission:edit-products')->name('products.update');
        Route::delete('products/{id}', [\App\Http\Controllers\ProductController::class, 'destroy'])->middleware('permission:delete-products')->name('products.destroy');
        Route::get('products/{id}', [\App\Http\Controllers\ProductController::class, 'show'])->middleware('permission:view-products')->name('products.show');

        // Categories Management routes with permissions
        Route::get('categories', [\App\Http\Controllers\CategoryController::class, 'index'])->middleware('permission:manage-categories')->name('categories.index');
        Route::get('categories/export', [\App\Http\Controllers\CategoryController::class, 'export'])->middleware('permission:export-categories')->name('categories.export');
        Route::get('categories/create', [\App\Http\Controllers\CategoryController::class, 'create'])->middleware('permission:create-categories')->name('categories.create');
        Route::post('categories', [\App\Http\Controllers\CategoryController::class, 'store'])->middleware('permission:create-categories')->name('categories.store');
        Route::get('categories/{id}/edit', [\App\Http\Controllers\CategoryController::class, 'edit'])->middleware('permission:edit-categories')->name('categories.edit');
        Route::put('categories/{id}', [\App\Http\Controllers\CategoryController::class, 'update'])->middleware('permission:edit-categories')->name('categories.update');
        Route::delete('categories/{id}', [\App\Http\Controllers\CategoryController::class, 'destroy'])->middleware('permission:delete-categories')->name('categories.destroy');
        Route::put('categories/{id}/toggle-status', [\App\Http\Controllers\CategoryController::class, 'toggleStatus'])->middleware('permission:edit-categories')->name('categories.toggle-status');
        Route::get('categories/{id}', [\App\Http\Controllers\CategoryController::class, 'show'])->middleware('permission:view-categories')->name('categories.show');

        // Tax Management routes with permissions
        Route::get('tax', [\App\Http\Controllers\TaxController::class, 'index'])->middleware('permission:manage-tax')->name('tax.index');
        Route::get('tax/export', [\App\Http\Controllers\TaxController::class, 'export'])->middleware('permission:export-tax')->name('tax.export');
        Route::get('tax/create', [\App\Http\Controllers\TaxController::class, 'create'])->middleware('permission:create-tax')->name('tax.create');
        Route::post('tax', [\App\Http\Controllers\TaxController::class, 'store'])->middleware('permission:create-tax')->name('tax.store');
        Route::get('tax/{id}/edit', [\App\Http\Controllers\TaxController::class, 'edit'])->middleware('permission:edit-tax')->name('tax.edit');
        Route::put('tax/{id}', [\App\Http\Controllers\TaxController::class, 'update'])->middleware('permission:edit-tax')->name('tax.update');
        Route::delete('tax/{id}', [\App\Http\Controllers\TaxController::class, 'destroy'])->middleware('permission:delete-tax')->name('tax.destroy');
        Route::put('tax/{id}/toggle-status', [\App\Http\Controllers\TaxController::class, 'toggleStatus'])->middleware('permission:edit-tax')->name('tax.toggle-status');
        Route::get('tax/{id}', [\App\Http\Controllers\TaxController::class, 'show'])->middleware('permission:view-tax')->name('tax.show');

        // Coupon System routes with permissions
        Route::get('coupon-system', [\App\Http\Controllers\StoreCouponController::class, 'index'])->middleware('permission:manage-coupon-system')->name('coupon-system.index');
        Route::get('coupon-system/export', [\App\Http\Controllers\StoreCouponController::class, 'export'])->middleware('permission:export-coupon-system')->name('coupon-system.export');
        Route::get('coupon-system/create', function () {
            return Inertia::render('coupon-system/create');
        })->middleware('permission:create-coupon-system')->name('coupon-system.create');
        Route::get('coupon-system/{id}/edit', function ($id) {
            $user = Auth::user();
            $currentStoreId = $user->current_store;
            $coupon = \App\Models\StoreCoupon::where('store_id', $currentStoreId)->findOrFail($id);
            return Inertia::render('coupon-system/edit', [
                'coupon' => $coupon
            ]);
        })->middleware('permission:edit-coupon-system')->name('coupon-system.edit');
        // Route::get('coupon-system/{id}', function ($id) {
        //     $user = Auth::user();
        //     $currentStoreId = $user->current_store;
        //     $coupon = \App\Models\StoreCoupon::where('store_id', $currentStoreId)->findOrFail($id);
        //     return Inertia::render('coupon-system/show', [
        //         'coupon' => $coupon
        //     ]);
        // })->middleware('permission:view-coupon-system')->name('coupon-system.show');
        Route::post('coupon-system', [\App\Http\Controllers\StoreCouponController::class, 'store'])->middleware('permission:create-coupon-system')->name('coupon-system.store');
        Route::get('coupon-system/{storeCoupon}', [\App\Http\Controllers\StoreCouponController::class, 'show'])->middleware('permission:view-coupon-system')->name('coupon-system.show');
        Route::put('coupon-system/{storeCoupon}', [\App\Http\Controllers\StoreCouponController::class, 'update'])->middleware('permission:edit-coupon-system')->name('coupon-system.update');
        Route::delete('store-coupons/{storeCoupon}', [\App\Http\Controllers\StoreCouponController::class, 'destroy'])->middleware('permission:delete-coupon-system')->name('store-coupons.destroy');
        Route::post('store-coupons/{storeCoupon}/toggle-status', [\App\Http\Controllers\StoreCouponController::class, 'toggleStatus'])->middleware('permission:toggle-status-coupon-system')->name('store-coupons.toggle-status');
        Route::post('store-coupons/validate', [\App\Http\Controllers\StoreCouponController::class, 'validate'])->name('store-coupons.validate');

        // Shipping Management routes with permissions
        Route::get('shipping', [\App\Http\Controllers\ShippingController::class, 'index'])->middleware('permission:manage-shipping')->name('shipping.index');
        Route::get('shipping/export', [\App\Http\Controllers\ShippingController::class, 'export'])->middleware('permission:export-shipping')->name('shipping.export');
        Route::get('shipping/create', [\App\Http\Controllers\ShippingController::class, 'create'])->middleware('permission:create-shipping')->name('shipping.create');
        Route::post('shipping', [\App\Http\Controllers\ShippingController::class, 'store'])->middleware('permission:create-shipping')->name('shipping.store');
        Route::get('shipping/{id}/edit', [\App\Http\Controllers\ShippingController::class, 'edit'])->middleware('permission:edit-shipping')->name('shipping.edit');
        Route::put('shipping/{id}', [\App\Http\Controllers\ShippingController::class, 'update'])->middleware('permission:edit-shipping')->name('shipping.update');
        Route::delete('shipping/{id}', [\App\Http\Controllers\ShippingController::class, 'destroy'])->middleware('permission:delete-shipping')->name('shipping.destroy');
        Route::get('shipping/{id}', [\App\Http\Controllers\ShippingController::class, 'show'])->middleware('permission:view-shipping')->name('shipping.show');

        // Customer Management routes with permissions
        Route::get('customers', [\App\Http\Controllers\CustomerController::class, 'index'])->middleware('permission:manage-customers')->name('customers.index');
        Route::get('customers/export', [\App\Http\Controllers\CustomerController::class, 'export'])->middleware('permission:export-customers')->name('customers.export');
        Route::get('customers/create', [\App\Http\Controllers\CustomerController::class, 'create'])->middleware('permission:create-customers')->name('customers.create');
        Route::post('customers', [\App\Http\Controllers\CustomerController::class, 'store'])->middleware('permission:create-customers')->name('customers.store');
        Route::get('customers/{id}/edit', [\App\Http\Controllers\CustomerController::class, 'edit'])->middleware('permission:edit-customers')->name('customers.edit');
        Route::put('customers/{id}', [\App\Http\Controllers\CustomerController::class, 'update'])->middleware('permission:edit-customers')->name('customers.update');
        Route::delete('customers/{id}', [\App\Http\Controllers\CustomerController::class, 'destroy'])->middleware('permission:delete-customers')->name('customers.destroy');
        Route::get('customers/{id}', [\App\Http\Controllers\CustomerController::class, 'show'])->middleware('permission:view-customers')->name('customers.show');

        // Order Management routes with permissions
        Route::get('orders', [\App\Http\Controllers\OrderController::class, 'index'])->middleware('permission:manage-orders')->name('orders.index');
        Route::get('orders/export', [\App\Http\Controllers\OrderController::class, 'export'])->middleware('permission:export-orders')->name('orders.export');
        Route::get('orders/create', [\App\Http\Controllers\OrderController::class, 'create'])->middleware('permission:create-orders')->name('orders.create');
        Route::get('orders/{id}/edit', [\App\Http\Controllers\OrderController::class, 'edit'])->middleware('permission:edit-orders')->name('orders.edit');
        Route::put('orders/{id}', [\App\Http\Controllers\OrderController::class, 'update'])->middleware('permission:edit-orders')->name('orders.update');
        Route::delete('orders/{id}', [\App\Http\Controllers\OrderController::class, 'destroy'])->middleware('permission:delete-orders')->name('orders.destroy');
        Route::get('orders/{id}', [\App\Http\Controllers\OrderController::class, 'show'])->middleware('permission:view-orders')->name('orders.show');


        // Express Checkout routes with permissions
        Route::get('express-checkout', [\App\Http\Controllers\ExpressCheckoutController::class, 'index'])->middleware('permission:manage-express-checkout')->name('express-checkout.index');
        Route::get('express-checkout/create', [\App\Http\Controllers\ExpressCheckoutController::class, 'create'])->middleware('permission:create-express-checkout')->name('express-checkout.create');
        Route::post('express-checkout', [\App\Http\Controllers\ExpressCheckoutController::class, 'store'])->middleware('permission:create-express-checkout')->name('express-checkout.store');
        Route::get('express-checkout/{id}/edit', [\App\Http\Controllers\ExpressCheckoutController::class, 'edit'])->middleware('permission:edit-express-checkout')->name('express-checkout.edit');
        Route::put('express-checkout/{id}', [\App\Http\Controllers\ExpressCheckoutController::class, 'update'])->middleware('permission:edit-express-checkout')->name('express-checkout.update');
        Route::delete('express-checkout/{id}', [\App\Http\Controllers\ExpressCheckoutController::class, 'destroy'])->middleware('permission:delete-express-checkout')->name('express-checkout.destroy');
        Route::get('express-checkout/{id}', [\App\Http\Controllers\ExpressCheckoutController::class, 'show'])->middleware('permission:view-express-checkout')->name('express-checkout.show');

        // Analytics & Reporting routes
        Route::get('analytics', [\App\Http\Controllers\AnalyticsController::class, 'index'])->middleware('permission:manage-analytics')->name('analytics.index');
        Route::get('analytics/export', [\App\Http\Controllers\AnalyticsController::class, 'export'])->middleware('permission:export-analytics')->name('analytics.export');

        // Payment Gateway routes
        Route::get('payment-gateways', function () {
            return Inertia::render('payment-gateways/index');
        })->name('payment-gateways.index');


        // AI Templates routes
        Route::get('ai-templates', function () {
            return Inertia::render('ai-templates/index');
        })->name('ai-templates.index');

        // Webhook System routes
        Route::get('webhooks', function () {
            return Inertia::render('webhooks/index');
        })->name('webhooks.index');

        // AI Templates routes
        Route::get('ai-templates', function () {
            return Inertia::render('ai-templates/index');
        })->name('ai-templates.index');

        // Webhook System routes
        Route::get('webhooks', function () {
            return Inertia::render('webhooks/index');
        })->name('webhooks.index');

        Route::get('media-library', function () {
            return Inertia::render('media-library-demo');
        })->middleware('permission:manage-media')->name('media-library');

        Route::get('examples/chatgpt-demo', function () {
            return Inertia::render('examples/chatgpt-demo');
        })->name('examples.chatgpt-demo');

        // Media Library API routes
        Route::get('api/media', [MediaController::class, 'index'])->middleware('permission:manage-media')->name('api.media.index');
        Route::post('api/media/batch', [MediaController::class, 'batchStore'])->middleware('permission:upload-media')->name('api.media.batch');
        Route::get('api/media/{id}/download', [MediaController::class, 'download'])->middleware('permission:download-media')->name('api.media.download');
        Route::delete('api/media/{id}', [MediaController::class, 'destroy'])->middleware('permission:delete-media')->name('api.media.destroy');

        // Permissions routes with granular permissions
        Route::middleware('permission:manage-permissions')->group(function () {
            Route::get('permissions', [PermissionController::class, 'index'])->middleware('permission:manage-permissions')->name('permissions.index');
            Route::get('permissions/create', [PermissionController::class, 'create'])->middleware('permission:create-permissions')->name('permissions.create');
            Route::post('permissions', [PermissionController::class, 'store'])->middleware('permission:create-permissions')->name('permissions.store');
            Route::get('permissions/{permission}', [PermissionController::class, 'show'])->middleware('permission:view-permissions')->name('permissions.show');
            Route::get('permissions/{permission}/edit', [PermissionController::class, 'edit'])->middleware('permission:edit-permissions')->name('permissions.edit');
            Route::put('permissions/{permission}', [PermissionController::class, 'update'])->middleware('permission:edit-permissions')->name('permissions.update');
            Route::patch('permissions/{permission}', [PermissionController::class, 'update'])->middleware('permission:edit-permissions');
            Route::delete('permissions/{permission}', [PermissionController::class, 'destroy'])->middleware('permission:delete-permissions')->name('permissions.destroy');
        });

        // Roles routes with granular permissions
        Route::middleware('permission:manage-roles')->group(function () {
            Route::get('roles', [RoleController::class, 'index'])->middleware('permission:manage-roles')->name('roles.index');
            Route::get('roles/create', [RoleController::class, 'create'])->middleware('permission:create-roles')->name('roles.create');
            Route::post('roles', [RoleController::class, 'store'])->middleware('permission:create-roles')->name('roles.store');
            Route::get('roles/{role}', [RoleController::class, 'show'])->middleware('permission:view-roles')->name('roles.show');
            Route::get('roles/{role}/edit', [RoleController::class, 'edit'])->middleware('permission:edit-roles')->name('roles.edit');
            Route::put('roles/{role}', [RoleController::class, 'update'])->middleware('permission:edit-roles')->name('roles.update');
            Route::patch('roles/{role}', [RoleController::class, 'update'])->middleware('permission:edit-roles');
            Route::delete('roles/{role}', [RoleController::class, 'destroy'])->middleware('permission:delete-roles')->name('roles.destroy');
        });

        // Users routes with granular permissions
        Route::middleware('permission:manage-users')->group(function () {
            Route::get('users', [UserController::class, 'index'])->middleware('permission:manage-users')->name('users.index');
            Route::get('users/create', [UserController::class, 'create'])->middleware('permission:create-users')->name('users.create');
            Route::post('users', [UserController::class, 'store'])->middleware('permission:create-users')->name('users.store');
            Route::get('users/{user}', [UserController::class, 'show'])->middleware('permission:view-users')->name('users.show');
            Route::get('users/{user}/edit', [UserController::class, 'edit'])->middleware('permission:edit-users')->name('users.edit');
            Route::put('users/{user}', [UserController::class, 'update'])->middleware('permission:edit-users')->name('users.update');
            Route::patch('users/{user}', [UserController::class, 'update'])->middleware('permission:edit-users');
            Route::delete('users/{user}', [UserController::class, 'destroy'])->middleware('permission:delete-users')->name('users.destroy');

            // Additional user routes
            Route::put('users/{user}/reset-password', [UserController::class, 'resetPassword'])->middleware('permission:reset-password-users')->name('users.reset-password');
            Route::put('users/{user}/toggle-status', [UserController::class, 'toggleStatus'])->middleware('permission:toggle-status-users')->name('users.toggle-status');
        });

        // Login History routes
        Route::get('login-history', [UserController::class, 'allUserLogs'])->name('users.all-logs');
        Route::delete('login-history/{loginHistory}', [UserController::class, 'destroyLoginHistory'])->name('login-history.destroy');

        // Plans management routes (admin only)
        Route::middleware('permission:manage-plans')->group(function () {
            Route::get('plans/create', [PlanController::class, 'create'])->middleware('permission:create-plans')->name('plans.create');
            Route::post('plans', [PlanController::class, 'store'])->middleware('permission:create-plans')->name('plans.store');
            Route::get('plans/{plan}/edit', [PlanController::class, 'edit'])->middleware('permission:edit-plans')->name('plans.edit');
            Route::put('plans/{plan}', [PlanController::class, 'update'])->middleware('permission:edit-plans')->name('plans.update');
            Route::delete('plans/{plan}', [PlanController::class, 'destroy'])->middleware('permission:delete-plans')->name('plans.destroy');
            Route::post('plans/{plan}/toggle-status', [PlanController::class, 'toggleStatus'])->name('plans.toggle-status');
        });

        // Plan Orders routes
        Route::get('plan-orders', [PlanOrderController::class, 'index'])->middleware('permission:manage-plan-orders')->name('plan-orders.index');
        Route::post('plan-orders/{planOrder}/approve', [PlanOrderController::class, 'approve'])->middleware('permission:approve-plan-orders')->name('plan-orders.approve');
        Route::post('plan-orders/{planOrder}/reject', [PlanOrderController::class, 'reject'])->middleware('permission:reject-plan-orders')->name('plan-orders.reject');


        // Companies routes
        Route::middleware('permission:manage-companies')->group(function () {
            Route::get('companies', [CompanyController::class, 'index'])->middleware('permission:manage-companies')->name('companies.index');
            Route::post('companies', [CompanyController::class, 'store'])->middleware('permission:create-companies')->name('companies.store');
            Route::put('companies/{company}', [CompanyController::class, 'update'])->middleware('permission:edit-companies')->name('companies.update');
            Route::delete('companies/{company}', [CompanyController::class, 'destroy'])->middleware('permission:delete-companies')->name('companies.destroy');
            Route::put('companies/{company}/reset-password', [CompanyController::class, 'resetPassword'])->middleware('permission:reset-password-companies')->name('companies.reset-password');
            Route::put('companies/{company}/toggle-status', [CompanyController::class, 'toggleStatus'])->middleware('permission:toggle-status-companies')->name('companies.toggle-status');
            Route::get('companies/{company}/plans', [CompanyController::class, 'getPlans'])->middleware('permission:manage-plans-companies')->name('companies.plans');
            Route::put('companies/{company}/upgrade-plan', [CompanyController::class, 'upgradePlan'])->middleware('permission:upgrade-plan-companies')->name('companies.upgrade-plan');
        });


        // Coupons routes
        Route::middleware('permission:manage-coupons')->group(function () {
            Route::get('coupons', [CouponController::class, 'index'])->middleware('permission:manage-coupons')->name('coupons.index');
            Route::post('coupons', [CouponController::class, 'store'])->middleware('permission:create-coupons')->name('coupons.store');
            Route::get('coupons/{coupon}', [CouponController::class, 'show'])->middleware('permission:view-coupons')->name('coupons.show');
            Route::put('coupons/{coupon}', [CouponController::class, 'update'])->middleware('permission:edit-coupons')->name('coupons.update');
            Route::put('coupons/{coupon}/toggle-status', [CouponController::class, 'toggleStatus'])->middleware('permission:toggle-status-coupons')->name('coupons.toggle-status');
            Route::delete('coupons/{coupon}', [CouponController::class, 'destroy'])->middleware('permission:delete-coupons')->name('coupons.destroy');
        });

        // Plan Requests routes
        Route::get('plan-requests', [PlanRequestController::class, 'index'])->middleware('permission:manage-plan-requests')->name('plan-requests.index');
        Route::post('plan-requests/{planRequest}/approve', [PlanRequestController::class, 'approve'])->middleware('permission:approve-plan-requests')->name('plan-requests.approve');
        Route::post('plan-requests/{planRequest}/reject', [PlanRequestController::class, 'reject'])->middleware('permission:reject-plan-requests')->name('plan-requests.reject');


        // Referral routes
        Route::middleware('permission:manage-referral')->group(function () {
            Route::get('referral', [ReferralController::class, 'index'])->middleware('permission:manage-referral')->name('referral.index');
            Route::get('referral/referred-users', [ReferralController::class, 'getReferredUsers'])->middleware('permission:manage-referral')->name('referral.referred-users');
            Route::post('referral/settings', [ReferralController::class, 'updateSettings'])->middleware('permission:manage-setting-referral')->name('referral.settings.update');
            Route::post('referral/payout-request', [ReferralController::class, 'createPayoutRequest'])->middleware('permission:manage-payout-referral')->name('referral.payout-request.create');
            Route::post('referral/payout-request/{payoutRequest}/approve', [ReferralController::class, 'approvePayoutRequest'])->middleware('permission:approve-payout-referral')->name('referral.payout-request.approve');
            Route::post('referral/payout-request/{payoutRequest}/reject', [ReferralController::class, 'rejectPayoutRequest'])->middleware('permission:reject-payout-referral')->name('referral.payout-request.reject');
        });


        // Currencies routes
        Route::middleware('permission:manage-currencies')->group(function () {
            Route::get('currencies', [CurrencyController::class, 'index'])->middleware('permission:manage-currencies')->name('currencies.index');
            Route::post('currencies', [CurrencyController::class, 'store'])->middleware('permission:create-currencies')->name('currencies.store');
            Route::put('currencies/{currency}', [CurrencyController::class, 'update'])->middleware('permission:edit-currencies')->name('currencies.update');
            Route::delete('currencies/{currency}', [CurrencyController::class, 'destroy'])->middleware('permission:delete-currencies')->name('currencies.destroy');
        });

        // ChatGPT routes
        Route::post('api/chatgpt/generate', [\App\Http\Controllers\ChatGptController::class, 'generate'])->name('chatgpt.generate');


        // Language management
        Route::get('manage-language/{lang?}', [LanguageController::class, 'managePage'])->middleware('permission:manage-language')->name('manage-language');
        Route::get('language/load', [LanguageController::class, 'load'])->name('language.load');
        Route::match(['POST', 'PATCH'], 'language/save', [LanguageController::class, 'save'])->middleware('permission:edit-language')->name('language.update');

        // Landing Page content management (Super Admin only)
        Route::middleware('App\Http\Middleware\SuperAdminMiddleware')->group(function () {
            Route::get('landing-page/settings', [LandingPageController::class, 'settings'])->name('landing-page.settings');
            Route::post('landing-page/settings', [LandingPageController::class, 'updateSettings'])->name('landing-page.settings.update');

            Route::resource('landing-custom-pages', CustomPageController::class)->names([
                'index' => 'landing-page.custom-pages.index',
                'create' => 'landing-page.custom-pages.create',
                'store' => 'landing-page.custom-pages.store',
                'show' => 'landing-page.custom-pages.show',
                'edit' => 'landing-page.custom-pages.edit',
                'update' => 'landing-page.custom-pages.update',
                'destroy' => 'landing-page.custom-pages.destroy'
            ]);

            // Custom Pages API routes
            Route::post('api/custom-pages/generate-slug', [CustomPageController::class, 'generateSlug'])->name('api.custom-pages.generate-slug');
            Route::post('api/custom-pages/check-slug', [CustomPageController::class, 'checkSlug'])->name('api.custom-pages.check-slug');

            // Newsletter Management
            Route::get('landing-subscribers', [\App\Http\Controllers\LandingPage\NewsletterController::class, 'index'])->name('landing-page.subscribers.index');
            Route::get('landing-subscribers/export', [\App\Http\Controllers\LandingPage\NewsletterController::class, 'export'])->name('landing-page.subscribers.export');
            Route::delete('landing-subscribers/{newsletter}', [\App\Http\Controllers\LandingPage\NewsletterController::class, 'destroy'])->name('landing-page.subscribers.destroy');
            Route::put('landing-subscribers/{newsletter}', [\App\Http\Controllers\LandingPage\NewsletterController::class, 'update'])->name('landing-page.subscribers.update');

            // Contact Management
            Route::get('landing-contacts', [\App\Http\Controllers\LandingPage\ContactController::class, 'index'])->name('landing-page.contacts.index');
            Route::get('landing-contacts/export', [\App\Http\Controllers\LandingPage\ContactController::class, 'export'])->name('landing-page.contacts.export');
            Route::delete('landing-contacts/{contact}', [\App\Http\Controllers\LandingPage\ContactController::class, 'destroy'])->name('landing-page.contacts.destroy');

            // Location Management (Countries, States, Cities)
            Route::resource('countries', \App\Http\Controllers\CountryController::class);
            Route::resource('states', \App\Http\Controllers\StateController::class);
            Route::resource('cities', \App\Http\Controllers\CityController::class);
        });

        // Impersonation routes
        Route::middleware('App\Http\Middleware\SuperAdminMiddleware')->group(function () {
            Route::get('impersonate/{userId}', [ImpersonateController::class, 'start'])->name('impersonate.start');
        });

        Route::post('impersonate/leave', [ImpersonateController::class, 'leave'])->name('impersonate.leave');


        // Store switching route
        Route::post('switch-store', [\App\Http\Controllers\StoreSwitcherController::class, 'switchStore'])->name('switch-store');

        // User language update route
        Route::post('user/language', [\App\Http\Controllers\UserLanguageController::class, 'update'])->name('user.language.update');
        Route::patch('/languages/{languageCode}/toggle', [LanguageController::class, 'toggleLanguageStatus'])->name('languages.toggle-status');
        Route::post('/languages/create', [LanguageController::class, 'createLanguage'])->name('languages.create');
        Route::delete('/languages/{languageCode}', [LanguageController::class, 'deleteLanguage'])->name('languages.destroy');
    }); // End plan.access middleware group
});


require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';


// Catch-all route for custom domains/subdomains
// This ensures that any request not matched above still enters the 'web' middleware group,
// where DomainResolver can handle it.
Route::any('{any}', function () {
    abort(404);
})->where('any', '.*');
