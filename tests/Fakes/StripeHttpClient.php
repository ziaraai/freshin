<?php

namespace Tests\Fakes;

use Stripe\HttpClient\ClientInterface;

class StripeHttpClient implements ClientInterface
{
    public array $requests = [];

    public bool $failCheckout = false;

    public function request($method, $absUrl, $headers, $params, $hasFile, $apiMode = 'v1', $maxNetworkRetries = null)
    {
        $this->requests[] = ['method' => $method, 'url' => $absUrl, 'params' => $params];

        if ($method === 'post' && str_ends_with($absUrl, '/v1/payment_intents')) {
            return [json_encode([
                'id' => 'pi_test_freshin_saas', 'object' => 'payment_intent', 'status' => 'succeeded',
            ], JSON_THROW_ON_ERROR), 200, []];
        }

        if ($method !== 'post' || !str_ends_with($absUrl, '/v1/checkout/sessions')) {
            throw new \RuntimeException('Unexpected Stripe request in test.');
        }

        if ($this->failCheckout) {
            return [json_encode(['error' => [
                'type' => 'invalid_request_error',
                'message' => 'Checkout session could not be created.',
            ]], JSON_THROW_ON_ERROR), 400, []];
        }

        return [json_encode([
            'id' => 'cs_test_freshin_local',
            'object' => 'checkout.session',
            'url' => 'https://checkout.stripe.com/c/pay/cs_test_freshin_local',
            'payment_status' => 'unpaid',
        ], JSON_THROW_ON_ERROR), 200, []];
    }
}
