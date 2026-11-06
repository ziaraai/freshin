<?php

namespace Tests\Feature;

use App\Models\PaymentSetting;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StripePaymentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware();
    }

    public function test_stripe_configuration_never_exposes_the_secret(): void
    {
        $admin = User::withoutEvents(fn () => User::factory()->create(['type' => 'superadmin']));
        foreach (['stripe_key' => 'pk_test_fixture', 'stripe_secret' => 'sk_test_fixture', 'is_stripe_enabled' => '1'] as $key => $value) {
            PaymentSetting::create(['user_id' => $admin->id, 'key' => $key, 'value' => $value]);
        }

        $this->getJson(route('payment.methods'))->assertOk()
            ->assertJsonPath('stripe_key', 'pk_test_fixture')
            ->assertJsonPath('is_stripe_enabled', true)
            ->assertJsonMissingPath('stripe_secret')
            ->assertDontSee('sk_test_fixture');
    }

    public function test_stripe_payment_requires_a_payment_method(): void
    {
        $user = User::withoutEvents(fn () => User::factory()->create(['type' => 'company']));
        $plan = Plan::withoutEvents(fn () => Plan::create(['name' => 'Validation Plan', 'price' => 10, 'duration' => 'Monthly']));
        $this->actingAs($user)->post(route('stripe.payment'), [
            'plan_id' => $plan->id, 'billing_cycle' => 'monthly', 'cardholder_name' => 'Test Customer',
        ])->assertSessionHasErrors('payment_method_id');
    }

    public function test_missing_stripe_configuration_does_not_activate_a_plan(): void
    {
        $user = User::withoutEvents(fn () => User::factory()->create(['type' => 'company']));
        $plan = Plan::withoutEvents(fn () => Plan::create(['name' => 'Unavailable Plan', 'price' => 10, 'duration' => 'Monthly']));
        $this->actingAs($user)->post(route('stripe.payment'), [
            'payment_method_id' => 'pm_test_fixture', 'plan_id' => $plan->id,
            'billing_cycle' => 'monthly', 'cardholder_name' => 'Test Customer',
        ])->assertSessionHasErrors('error');

        $this->assertNull($user->fresh()->plan_id);
        $this->assertDatabaseCount('plan_orders', 0);
    }
}
