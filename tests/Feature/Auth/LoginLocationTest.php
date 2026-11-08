<?php

use App\Http\Middleware\CheckInstallation;
use App\Models\LoginHistory;
use App\Models\User;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    $this->withoutMiddleware(CheckInstallation::class);
    $this->withServerVariables(['REMOTE_ADDR' => '81.2.69.142']);
});

test('login records the visitor location after the response', function () {
    Http::fake(['ip-api.com/*' => Http::response(['country' => 'United Kingdom', 'city' => 'London', 'query' => '81.2.69.142'])]);
    $user = User::factory()->create();

    $this->post('/login', ['email' => $user->email, 'password' => 'password']);

    $this->assertAuthenticatedAs($user);
    $history = LoginHistory::where('user_id', $user->id)->sole();
    expect($history->details['country'])->toBe('United Kingdom')
        ->and($history->details['city'])->toBe('London')
        ->and($history->details['status'])->toBe('success');
});

test('an unreachable location service does not block login', function () {
    Http::fake(fn () => throw new ConnectionException('timed out'));
    $user = User::factory()->create();

    $this->post('/login', ['email' => $user->email, 'password' => 'password']);

    $this->assertAuthenticatedAs($user);
    $history = LoginHistory::where('user_id', $user->id)->sole();
    expect($history->details['query'])->toBe('81.2.69.142')
        ->and($history->details)->not->toHaveKey('country');
});
