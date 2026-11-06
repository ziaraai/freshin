<?php

use App\Events\OrderCreated;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\PaymentSetting;
use App\Models\Product;
use App\Models\Setting;
use App\Models\Store;
use App\Models\StoreConfiguration;
use App\Models\User;
use App\Services\OrderingSchedule;
use App\Services\OrderService;
use App\Services\WhatsAppService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Stripe\ApiRequestor;
use Stripe\Stripe;
use Tests\Fakes\StripeHttpClient;

uses(Tests\TestCase::class);

beforeEach(function () {
    // Force a fresh, isolated in-memory connection before running any migration.
    // These tests must never refresh the configured development database.
    config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => ':memory:']);
    DB::purge('sqlite');
    Artisan::call('migrate', ['--database' => 'sqlite', '--force' => true]);
    Cache::flush();
    $this->withoutMiddleware();
    Event::fake([OrderCreated::class]);
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-11-09 12:00:00', 'Europe/London'));

    $this->owner = User::withoutEvents(fn () => User::factory()->create(['type' => 'company']));
    $this->shop = Store::create([
        'name' => 'Freshin Test Kitchen',
        'slug' => 'freshin-test-kitchen',
        'user_id' => $this->owner->id,
    ]);
    $this->schedule = array_replace(OrderingSchedule::defaults(), ['enabled' => true]);
    StoreConfiguration::updateConfiguration($this->shop->id, ['ordering_schedule' => $this->schedule, 'default_currency' => 'gbp']);
    Setting::setSetting('defaultCurrency', 'GBP', $this->owner->id, $this->shop->id);
    foreach (['is_cod_enabled' => '1', 'is_stripe_enabled' => '1', 'stripe_key' => 'pk_test_local_fixture', 'stripe_secret' => 'sk_test_local_fixture'] as $key => $value) {
        PaymentSetting::create(['user_id' => $this->owner->id, 'store_id' => $this->shop->id, 'key' => $key, 'value' => $value]);
    }
    $this->originalStripeClient = ApiRequestor::httpClient();
    $this->stripeClient = new StripeHttpClient;
    ApiRequestor::setHttpClient($this->stripeClient);
    $this->dish = Product::create([
        'name' => 'Vegetable lunch',
        'price' => 8.50,
        'stock' => 10,
        'store_id' => $this->shop->id,
    ]);
    $this->cartItem = CartItem::create([
        'store_id' => $this->shop->id,
        'session_id' => session()->getId(),
        'product_id' => $this->dish->id,
        'quantity' => 2,
        'price' => 8.50,
    ]);
    $this->orderPayload = [
        'store_id' => $this->shop->id,
        'delivery_date' => '2026-11-10',
        'customer_first_name' => 'Test',
        'customer_last_name' => 'Customer',
        'customer_email' => 'customer@example.test',
        'customer_phone' => null,
        'shipping_address' => '1 Test Street',
        'shipping_city' => 'Greenwich',
        'shipping_state' => 'London',
        'shipping_postal_code' => 'SE10 9NN',
        'shipping_country' => 'United Kingdom',
        'billing_address' => '1 Test Street',
        'billing_city' => 'Greenwich',
        'billing_state' => 'London',
        'billing_postal_code' => 'SE10 9NN',
        'billing_country' => 'United Kingdom',
        'payment_method' => 'cod',
    ];
});

afterEach(function () {
    CarbonImmutable::setTestNow();
    ApiRequestor::setHttpClient($this->originalStripeClient);
    Stripe::setApiKey(null);
    DB::disconnect('sqlite');
});

test('the live ordering status endpoint reflects the current cutoff and cannot be cached', function () {
    $response = $this->getJson(route('store.ordering-status', $this->shop->slug))
        ->assertOk()->assertJsonPath('enabled', true)->assertJsonPath('is_open', true)
        ->assertJsonPath('timezone', 'Europe/London')
        ->assertJsonPath('delivery_dates.0.value', '2026-11-09');
    expect($response->headers->get('Cache-Control'))->toContain('no-store');

    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-11-09 17:00:00', 'Europe/London'));
    $this->getJson(route('store.ordering-status', $this->shop->slug))
        ->assertOk()->assertJsonPath('is_open', false);
});

test('an owner can save a schedule and receive the same typed configuration', function () {
    $this->actingAs($this->owner);
    Gate::before(fn () => true);
    $schedule = array_replace($this->schedule, [
        'open_days' => [2, 3, 4, 5, 6],
        'opens_at' => '08:30',
        'closes_at' => '15:15',
        'delivery_days' => [3, 5],
        'advance_days' => 14,
    ]);

    $this->putJson(route('stores.settings.update', $this->shop->id), [
        'settings' => ['ordering_schedule' => $schedule],
    ])->assertRedirect();

    expect(StoreConfiguration::getConfiguration($this->shop->id)['ordering_schedule'])->toBe($schedule);
});

test('an owner cannot edit another store schedule', function () {
    $otherOwner = User::withoutEvents(fn () => User::factory()->create(['type' => 'company']));
    $this->actingAs($otherOwner);
    Gate::before(fn () => true);

    $this->putJson(route('stores.settings.update', $this->shop->id), [
        'settings' => ['ordering_schedule' => array_replace($this->schedule, ['enabled' => false])],
    ])->assertNotFound();

    expect(StoreConfiguration::getConfiguration($this->shop->id)['ordering_schedule'])->toBe($this->schedule);
});

test('invalid schedule settings are rejected without replacing the existing schedule', function (array $override, string $error) {
    $this->actingAs($this->owner);
    Gate::before(fn () => true);

    $this->putJson(route('stores.settings.update', $this->shop->id), [
        'settings' => ['ordering_schedule' => array_replace($this->schedule, $override)],
    ])->assertUnprocessable()->assertJsonValidationErrors("settings.ordering_schedule.{$error}");

    expect(StoreConfiguration::getConfiguration($this->shop->id)['ordering_schedule'])->toBe($this->schedule);
})->with([
    'closing equals opening' => [['closes_at' => '09:00'], 'closes_at'],
    'overnight hours' => [['opens_at' => '22:00', 'closes_at' => '06:00'], 'closes_at'],
    'invalid time' => [['opens_at' => '25:00'], 'opens_at'],
    'no order weekdays' => [['open_days' => []], 'open_days'],
    'out of range weekday' => [['delivery_days' => [8]], 'delivery_days.0'],
    'duplicate weekdays' => [['open_days' => [1, 1]], 'open_days.0'],
    'unsupported timezone' => [['timezone' => 'UTC'], 'timezone'],
    'booking window too long' => [['advance_days' => 91], 'advance_days'],
]);

test('a forged store id cannot bypass the route store schedule', function () {
    $otherShop = Store::create(['name' => 'Other Test Kitchen', 'slug' => 'other-test-kitchen', 'user_id' => $this->owner->id]);

    $this->postJson(route('store.order.place', $this->shop->slug), array_replace($this->orderPayload, [
        'store_id' => $otherShop->id,
    ]))->assertUnprocessable()->assertJsonValidationErrors('store_id');

    expect(Order::count())->toBe(0)
        ->and($this->dish->fresh()->stock)->toBe(10)
        ->and(CartItem::find($this->cartItem->id)?->quantity)->toBe(2);
    Event::assertNotDispatched(OrderCreated::class);
});

test('submitting after closing preserves the cart and stock and creates no order', function () {
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-11-09 17:00:00', 'Europe/London'));

    $this->postJson(route('store.order.place', $this->shop->slug), $this->orderPayload)
        ->assertUnprocessable()->assertJsonValidationErrors('ordering_schedule');

    expect(Order::count())->toBe(0)
        ->and($this->dish->fresh()->stock)->toBe(10)
        ->and(CartItem::find($this->cartItem->id)?->quantity)->toBe(2);
    expect($this->stripeClient->requests)->toBeEmpty();
    Event::assertNotDispatched(OrderCreated::class);
});

test('the order service also enforces closing before any writes', function () {
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-11-09 17:00:00', 'Europe/London'));

    expect(fn () => app(OrderService::class)->createOrder($this->orderPayload, []))
        ->toThrow(ValidationException::class);
    expect(Order::count())->toBe(0)
        ->and($this->dish->fresh()->stock)->toBe(10)
        ->and(CartItem::find($this->cartItem->id)?->quantity)->toBe(2);
});

test('missing or unavailable delivery dates are rejected without changing the cart', function (mixed $date) {
    $payload = array_replace($this->orderPayload, ['delivery_date' => $date]);

    $this->postJson(route('store.order.place', $this->shop->slug), $payload)
        ->assertUnprocessable()->assertJsonValidationErrors('delivery_date');

    expect(Order::count())->toBe(0)
        ->and($this->dish->fresh()->stock)->toBe(10)
        ->and(CartItem::find($this->cartItem->id)?->quantity)->toBe(2);
})->with([
    'missing date' => [null],
    'closed delivery day' => ['2026-11-14'],
    'past date' => ['2026-11-06'],
    'beyond booking window' => ['2026-12-07'],
]);

test('an accepted order persists the selected delivery date as a calendar date', function () {
    $this->postJson(route('store.order.place', $this->shop->slug), $this->orderPayload)
        ->assertOk()->assertJsonPath('success', true);

    $order = Order::sole();
    expect($order->getRawOriginal('delivery_date'))->toBe('2026-11-10')
        ->and($order->toArray()['delivery_date'])->toBe('2026-11-10')
        ->and($this->dish->fresh()->stock)->toBe(8)
        ->and(CartItem::count())->toBe(0)
        ->and($order->payment_method)->toBe('cod')
        ->and($order->payment_status)->toBe('pending')
        ->and($this->stripeClient->requests)->toBeEmpty();
    Event::assertDispatched(OrderCreated::class);
});

test('removed payment methods cannot create customer orders', function (string $method) {
    $this->postJson(route('store.order.place', $this->shop->slug), array_replace($this->orderPayload, [
        'payment_method' => $method,
    ]))->assertUnprocessable()->assertJsonValidationErrors('payment_method');

    expect(Order::count())->toBe(0)
        ->and($this->dish->fresh()->stock)->toBe(10)
        ->and(CartItem::find($this->cartItem->id)?->quantity)->toBe(2)
        ->and($this->stripeClient->requests)->toBeEmpty();
    Event::assertNotDispatched(OrderCreated::class);
})->with(['bank', 'whatsapp', 'telegram', 'paypal', 'razorpay', 'yookassa', 'made-up-provider']);

test('the order service rejects removed payment methods before any writes', function () {
    expect(fn () => app(OrderService::class)->createOrder(
        array_replace($this->orderPayload, ['payment_method' => 'paypal']),
        [],
    ))->toThrow(ValidationException::class);

    expect(Order::count())->toBe(0)
        ->and($this->dish->fresh()->stock)->toBe(10)
        ->and(CartItem::find($this->cartItem->id)?->quantity)->toBe(2)
        ->and($this->stripeClient->requests)->toBeEmpty();
});

test('Stripe must be available before the order cart or inventory changes', function (string $setting, ?string $value) {
    $query = PaymentSetting::where('store_id', $this->shop->id)->where('key', $setting);
    if ($value === null) {
        $query->delete();
    } else {
        $query->update(['value' => $value]);
    }

    $this->postJson(route('store.order.place', $this->shop->slug), array_replace($this->orderPayload, ['payment_method' => 'stripe']))
        ->assertUnprocessable()->assertJsonValidationErrors('payment_method');

    expect(Order::count())->toBe(0)
        ->and($this->dish->fresh()->stock)->toBe(10)
        ->and(CartItem::find($this->cartItem->id)?->quantity)->toBe(2)
        ->and($this->stripeClient->requests)->toBeEmpty();
    Event::assertNotDispatched(OrderCreated::class);
})->with([
    'disabled' => ['is_stripe_enabled', '0'],
    'missing public key' => ['stripe_key', null],
    'missing secret' => ['stripe_secret', null],
]);

test('Stripe Checkout receives the order total in pounds and the chosen delivery date', function () {
    $this->postJson(route('store.order.place', $this->shop->slug), array_replace($this->orderPayload, ['payment_method' => 'stripe']))
        ->assertOk()->assertJsonPath('success', true)
        ->assertJsonPath('redirect_url', 'https://checkout.stripe.com/c/pay/cs_test_freshin_local');

    expect($this->stripeClient->requests)->toHaveCount(1);
    $params = $this->stripeClient->requests[0]['params'];
    $order = Order::sole();
    expect($params['line_items'][0]['price_data']['currency'])->toBe('gbp')
        ->and($params['line_items'][0]['price_data']['unit_amount'])->toBe(1700)
        ->and($params['metadata']['delivery_date'])->toBe('2026-11-10')
        ->and((string) $params['metadata']['order_id'])->toBe((string) $order->id)
        ->and($order->payment_details['checkout_session_id'])->toBe('cs_test_freshin_local')
        ->and($order->payment_status)->toBe('pending');
});

test('disabled cash on delivery cannot create an order', function () {
    PaymentSetting::where('store_id', $this->shop->id)->where('key', 'is_cod_enabled')->update(['value' => '0']);

    $this->postJson(route('store.order.place', $this->shop->slug), $this->orderPayload)
        ->assertUnprocessable()->assertJsonValidationErrors('payment_method');

    expect(Order::count())->toBe(0)
        ->and($this->dish->fresh()->stock)->toBe(10)
        ->and(CartItem::find($this->cartItem->id)?->quantity)->toBe(2)
        ->and($this->stripeClient->requests)->toBeEmpty();
    Event::assertNotDispatched(OrderCreated::class);
});

test('a failed Stripe Checkout request rolls back the order and preserves stock and cart', function () {
    $this->stripeClient->failCheckout = true;

    $this->postJson(route('store.order.place', $this->shop->slug), array_replace($this->orderPayload, ['payment_method' => 'stripe']))
        ->assertUnprocessable()->assertJsonPath('success', false)->assertJsonValidationErrors('payment_method');

    expect($this->stripeClient->requests)->toHaveCount(1)
        ->and(Order::count())->toBe(0)
        ->and($this->dish->fresh()->stock)->toBe(10)
        ->and(CartItem::find($this->cartItem->id)?->quantity)->toBe(2);
    Event::assertNotDispatched(OrderCreated::class);
});

test('WhatsApp order messages include the delivery date with both existing and new templates', function (string $template) {
    $this->postJson(route('store.order.place', $this->shop->slug), $this->orderPayload)
        ->assertOk()->assertJsonPath('success', true);
    foreach (['whatsapp_number' => '+447700900000', 'messaging_message_template' => $template] as $key => $value) {
        PaymentSetting::create(['user_id' => $this->owner->id, 'store_id' => $this->shop->id, 'key' => $key, 'value' => $value]);
    }

    // This method only prepares the customer's WhatsApp link; it sends no external message.
    expect((new WhatsAppService)->sendOrderConfirmation(Order::sole(), '+447700900001'))->toBeTrue();
    parse_str(parse_url(WhatsAppService::getWhatsAppRedirectUrl(), PHP_URL_QUERY), $query);
    expect($query['text'])->toContain('Tue, 10 Nov 2026')
        ->and(substr_count($query['text'], 'Tue, 10 Nov 2026'))->toBe(1);
})->with([
    'existing template without a date placeholder' => ['Order {order_no} for {customer_name}'],
    'template with a date placeholder' => ['Delivery date: {delivery_date}'],
]);

test('public customer payment methods expose Stripe and COD without credentials', function () {
    PaymentSetting::create(['user_id' => $this->owner->id, 'store_id' => $this->shop->id, 'key' => 'is_paypal_enabled', 'value' => '1']);
    $response = $this->getJson(route('api.payment.methods', ['store_id' => $this->shop->id]))->assertOk();
    expect(array_column($response->json('payment_methods'), 'name'))->toBe(['stripe', 'cod'])
        ->and($response->getContent())->not->toContain('sk_test_local_fixture', 'stripe_secret', 'paypal');
});

test('SaaS payment configuration uses only the superadmin and never exposes the secret', function () {
    $admin = User::withoutEvents(fn () => User::factory()->create(['type' => 'superadmin']));
    foreach (['is_stripe_enabled' => '1', 'stripe_key' => 'pk_test_saas_fixture', 'stripe_secret' => 'sk_test_saas_fixture', 'is_cod_enabled' => '1'] as $key => $value) {
        PaymentSetting::create(['user_id' => $admin->id, 'key' => $key, 'value' => $value]);
    }
    $this->actingAs($this->owner);
    $response = $this->getJson(route('payment.methods'))->assertOk()
        ->assertJsonPath('is_stripe_enabled', true)->assertJsonPath('stripe_key', 'pk_test_saas_fixture');
    expect($response->getContent())->not->toContain('sk_test_saas_fixture', 'stripe_secret', 'is_cod_enabled');
    expect(array_keys(getEnabledPaymentMethods($admin->id)))->toBe(['stripe']);
});

test('owner display masks saved secrets and omits retired gateway credentials', function () {
    PaymentSetting::create(['user_id' => $this->owner->id, 'store_id' => $this->shop->id, 'key' => 'paypal_secret_key', 'value' => 'retired-test-secret']);
    $settings = PaymentSetting::settingsForDisplay($this->owner->id, $this->shop->id);
    expect($settings['stripe_secret'])->toBe('********')
        ->and($settings['is_cod_enabled'])->toBeTrue()
        ->and($settings)->not->toHaveKey('paypal_secret_key');
});

test('saving store payment settings preserves a blank secret and changes COD independently', function () {
    $this->owner->update(['current_store' => $this->shop->id]);
    \Spatie\Permission\Models\Permission::findOrCreate('manage-settings', 'web');
    $this->owner->givePermissionTo('manage-settings');
    $this->actingAs($this->owner);
    $this->postJson(route('payment.settings'), [
        'is_stripe_enabled' => true,
        'stripe_key' => 'pk_test_local_fixture',
        'stripe_secret' => '',
        'is_cod_enabled' => false,
        'is_paypal_enabled' => true,
    ])->assertRedirect();
    $settings = PaymentSetting::getUserSettings($this->owner->id, $this->shop->id);
    expect($settings['stripe_secret'])->toBe('sk_test_local_fixture')
        ->and(filter_var($settings['is_cod_enabled'], FILTER_VALIDATE_BOOLEAN))->toBeFalse()
        ->and($settings)->not->toHaveKey('is_paypal_enabled');
});

test('the custom-domain status and ordering paths enforce the same schedule', function () {
    $this->shop->update(['custom_domain' => 'freshin.example.test', 'enable_custom_domain' => true]);
    $marker = storage_path('installed');
    $existed = file_exists($marker);
    if (!$existed) touch($marker);
    try {
        $this->withMiddleware();
        $this->getJson('https://freshin.example.test/ordering-status')->assertOk()->assertJsonPath('is_open', true);
        $this->getJson('https://freshin.example.test/order/place?'.http_build_query($this->orderPayload))
            ->assertStatus(405);
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-11-09 17:00:00', 'Europe/London'));
        $this->postJson('https://freshin.example.test/order/place', $this->orderPayload)
            ->assertUnprocessable()->assertJsonValidationErrors('ordering_schedule');
        expect(Order::count())->toBe(0)
            ->and($this->dish->fresh()->stock)->toBe(10)
            ->and(CartItem::find($this->cartItem->id)?->quantity)->toBe(2)
            ->and($this->stripeClient->requests)->toBeEmpty();
    } finally {
        if (!$existed) unlink($marker);
    }
});

test('SaaS Stripe payments use the actual superadmin settings and configured currency', function () {
    $admin = User::withoutEvents(fn () => User::factory()->create(['type' => 'superadmin']));
    foreach (['is_stripe_enabled' => '1', 'stripe_key' => 'pk_test_saas_fixture', 'stripe_secret' => 'sk_test_saas_fixture'] as $key => $value) {
        PaymentSetting::create(['user_id' => $admin->id, 'key' => $key, 'value' => $value]);
    }
    Setting::setSetting('defaultCurrency', 'GBP', $admin->id);
    $plan = \App\Models\Plan::withoutEvents(fn () => \App\Models\Plan::create([
        'name' => 'Freshin Test Plan', 'price' => 12.50, 'yearly_price' => 120, 'duration' => 'Monthly',
        'max_stores' => 3, 'max_users_per_store' => 5, 'max_products_per_store' => 100,
    ]));
    $this->actingAs($this->owner);
    $this->post(route('stripe.payment'), [
        'plan_id' => $plan->id, 'billing_cycle' => 'monthly',
        'payment_method_id' => 'pm_test_fixture', 'cardholder_name' => 'Test Customer',
    ])->assertRedirect()->assertSessionHasNoErrors()->assertSessionHas('success');
    expect($this->stripeClient->requests)->toHaveCount(1);
    $params = $this->stripeClient->requests[0]['params'];
    expect($params['currency'])->toBe('gbp')->and($params['amount'])->toBe(1250)
        ->and($this->owner->fresh()->plan_id)->toBe($plan->id)
        ->and(\App\Models\PlanOrder::sole()->payment_method)->toBe('stripe');
});

test('public presentation settings use an allowlist instead of serializing credentials', function () {
    $settings = Setting::publicSettings([
        'titleText' => 'Freshin', 'defaultCurrency' => 'GBP',
        'stripe_secret' => 'sk_test_fixture', 'aws_secret_access_key' => 'test-storage-secret',
        'mail_password' => 'test-mail-secret', 'recaptchaSecretKey' => 'test-captcha-secret',
        'recaptchaSiteKey' => 'public-site-key',
    ]);
    expect($settings)->toBe([
        'titleText' => 'Freshin', 'defaultCurrency' => 'GBP', 'recaptchaSiteKey' => 'public-site-key',
    ]);
});
