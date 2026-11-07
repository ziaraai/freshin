<?php

use App\Services\OrderingSchedule;
use Carbon\CarbonImmutable;
use Illuminate\Validation\ValidationException;

uses(Tests\TestCase::class);

function freshinSchedule(array $overrides = []): array
{
    return array_replace((new OrderingSchedule)->defaults(), [
        'enabled' => true,
        'timezone' => 'Europe/London',
        'open_days' => [1, 2, 3, 4, 5],
        'opens_at' => '09:00',
        'closes_at' => '17:00',
        'delivery_days' => [1, 2, 3, 4, 5],
        'advance_days' => 28,
    ], $overrides);
}

function expectFreshinScheduleError(Closure $action, string $field): void
{
    try {
        $action();
    } catch (ValidationException $exception) {
        expect($exception->errors())->toHaveKey($field);

        return;
    }

    test()->fail("Expected a validation error for {$field}.");
}

test('existing stores remain unrestricted until scheduling is enabled', function () {
    $service = new OrderingSchedule;
    $schedule = $service->defaults();
    $sundayNight = CarbonImmutable::parse('2026-11-08 23:00:00', 'UTC');

    expect($schedule['enabled'])->toBeFalse()
        ->and($schedule['timezone'])->toBe('Europe/London')
        ->and($service->status($schedule, $sundayNight)['is_open'])->toBeTrue()
        ->and($service->validateOrder($schedule, null, $sundayNight))->toBeNull();
});

test('opening is inclusive and closing is exclusive', function (string $clock, bool $isOpen) {
    $service = new OrderingSchedule;
    $now = CarbonImmutable::parse("2026-11-09 {$clock}", 'Europe/London');

    expect($service->status(freshinSchedule(), $now)['is_open'])->toBe($isOpen);

    if ($isOpen) {
        expect($service->validateOrder(freshinSchedule(), '2026-11-10', $now))->toBe('2026-11-10');
    } else {
        // Choosing a future date must not bypass the current ordering cutoff.
        expectFreshinScheduleError(
            fn () => $service->validateOrder(freshinSchedule(), '2026-11-10', $now),
            'ordering_schedule',
        );
    }
})->with([
    'before opening' => ['08:59:59', false],
    'at opening' => ['09:00:00', true],
    'just before closing' => ['16:59:59', true],
    'at closing' => ['17:00:00', false],
    'after closing' => ['17:00:01', false],
]);

test('orders are blocked on a closed weekday even for an available future delivery date', function () {
    $service = new OrderingSchedule;
    $saturday = CarbonImmutable::parse('2026-11-07 12:00:00', 'Europe/London');

    expect($service->status(freshinSchedule(), $saturday)['is_open'])->toBeFalse();

    expectFreshinScheduleError(
        fn () => $service->validateOrder(freshinSchedule(), '2026-11-09', $saturday),
        'ordering_schedule',
    );
});

test('ordering hours use London time in both GMT and BST', function (string $utcTime, bool $isOpen) {
    $service = new OrderingSchedule;

    expect($service->status(freshinSchedule(), CarbonImmutable::parse($utcTime, 'UTC'))['is_open'])
        ->toBe($isOpen);
})->with([
    'winter 08 UTC is before opening' => ['2026-11-09 08:00:00', false],
    'winter 09 UTC is opening' => ['2026-11-09 09:00:00', true],
    'summer 08 UTC is opening' => ['2026-07-06 08:00:00', true],
    'summer 16 UTC is closing' => ['2026-07-06 16:00:00', false],
]);

test('the next cutoff follows London daylight saving changes', function (string $date, string $utcCutoff) {
    $service = new OrderingSchedule;
    $schedule = freshinSchedule([
        'open_days' => [7],
        'opens_at' => '00:00',
        'closes_at' => '04:00',
    ]);
    $now = CarbonImmutable::parse("{$date} 00:30:00", 'UTC');
    $status = $service->status($schedule, $now);

    expect($status['is_open'])->toBeTrue()
        ->and(CarbonImmutable::parse($status['next_change_at'])->utc()->format('Y-m-d H:i:s'))->toBe($utcCutoff)
        ->and($service->status($schedule, CarbonImmutable::parse($utcCutoff, 'UTC'))['is_open'])->toBeFalse();
})->with([
    'spring forward' => ['2026-03-29', '2026-03-29 03:00:00'],
    'autumn back' => ['2026-10-25', '2026-10-25 04:00:00'],
]);

test('delivery dates are filtered by delivery weekdays independently of order weekdays', function () {
    $service = new OrderingSchedule;
    $schedule = freshinSchedule(['delivery_days' => [2, 4], 'advance_days' => 7]);
    $now = CarbonImmutable::parse('2026-11-09 12:00:00', 'Europe/London');
    $dates = $service->status($schedule, $now)['delivery_dates'];

    expect(array_column($dates, 'value'))->toBe(['2026-11-10', '2026-11-12'])
        ->and($dates[0]['label'])->toBeString()->not->toBeEmpty()
        ->and($service->validateOrder($schedule, '2026-11-10', $now))->toBe('2026-11-10');

    expectFreshinScheduleError(
        fn () => $service->validateOrder($schedule, '2026-11-09', $now),
        'delivery_date',
    );
});

test('the booking window starts tomorrow, excludes today, and ends after the window', function () {
    $service = new OrderingSchedule;
    $schedule = freshinSchedule(['advance_days' => 2]);
    $now = CarbonImmutable::parse('2026-11-09 12:00:00', 'Europe/London');

    expect(array_column($service->status($schedule, $now)['delivery_dates'], 'value'))
        ->toBe(['2026-11-10', '2026-11-11'])
        ->and($service->validateOrder($schedule, '2026-11-10', $now))->toBe('2026-11-10')
        ->and($service->validateOrder($schedule, '2026-11-11', $now))->toBe('2026-11-11');

    foreach (['2026-11-09', '2026-11-12'] as $outside) {
        expectFreshinScheduleError(
            fn () => $service->validateOrder($schedule, $outside, $now),
            'delivery_date',
        );
    }
});

test('missing malformed past and unavailable dates are rejected', function (mixed $deliveryDate) {
    $service = new OrderingSchedule;
    $now = CarbonImmutable::parse('2026-11-09 12:00:00', 'Europe/London');

    expectFreshinScheduleError(
        fn () => $service->validateOrder(freshinSchedule(), $deliveryDate, $now),
        'delivery_date',
    );
})->with([
    'missing' => [null],
    'empty' => [''],
    'invalid calendar day' => ['2026-11-31'],
    'ambiguous locale format' => ['09/11/2026'],
    'timestamp instead of date' => ['2026-11-09T12:00:00Z'],
    'relative date' => ['tomorrow'],
    'non string' => [123],
    'array injection' => [['2026-11-09']],
    'past day' => ['2026-11-06'],
    'closed delivery weekday' => ['2026-11-14'],
    'same day' => ['2026-11-09'],
    'beyond the booking window' => ['2026-12-08'],
]);
