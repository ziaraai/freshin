<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use Illuminate\Validation\ValidationException;

class OrderingSchedule
{
    public static function defaults(): array
    {
        return [
            'enabled' => false,
            'timezone' => 'Europe/London',
            'open_days' => [1, 2, 3, 4, 5],
            'opens_at' => '09:00',
            'closes_at' => '17:00',
            'delivery_days' => [1, 2, 3, 4, 5],
            'advance_days' => 7,
        ];
    }

    public function status(array $schedule, ?CarbonImmutable $now = null): array
    {
        $schedule = array_replace(self::defaults(), $schedule);
        // Store hours are London local time, including British Summer Time.
        $schedule['timezone'] = 'Europe/London';
        $now = ($now ?? CarbonImmutable::now())->setTimezone($schedule['timezone']);
        $enabled = (bool) $schedule['enabled'];
        $opening = $now->setTimeFromTimeString($schedule['opens_at']);
        $closing = $now->setTimeFromTimeString($schedule['closes_at']);
        $isOpen = !$enabled || (in_array($now->dayOfWeekIso, $schedule['open_days'])
            && $now->greaterThanOrEqualTo($opening) && $now->lessThan($closing));

        $nextOpening = null;
        if ($enabled && !$isOpen) {
            for ($offset = 0; $offset <= 7; $offset++) {
                $candidate = $now->addDays($offset)->setTimeFromTimeString($schedule['opens_at']);
                if (in_array($candidate->dayOfWeekIso, $schedule['open_days']) && $candidate->greaterThan($now)) {
                    $nextOpening = $candidate;
                    break;
                }
            }
        }

        $dates = [];
        if ($enabled) {
            for ($offset = 0; $offset < (int) $schedule['advance_days']; $offset++) {
                $date = $now->startOfDay()->addDays($offset);
                if (in_array($date->dayOfWeekIso, $schedule['delivery_days'])) {
                    $dates[] = ['value' => $date->format('Y-m-d'), 'label' => $date->format('D, j M Y')];
                }
            }
        }

        $message = '';
        if ($enabled) {
            $message = $isOpen
                ? 'Orders accepted until '.$schedule['closes_at'].' today (London time).'
                : 'Ordering is closed.'.($nextOpening ? ' Next opens '.$nextOpening->format('l, j M \a\t H:i').' (London time).' : '');
        }

        return array_merge($schedule, [
            'enabled' => $enabled,
            'is_open' => $isOpen,
            'server_now' => $now->toIso8601String(),
            'next_change_at' => ($enabled ? ($isOpen ? $closing : $nextOpening) : null)?->toIso8601String(),
            'message' => $message,
            'delivery_dates' => $dates,
        ]);
    }

    public function validateOrder(array $schedule, mixed $deliveryDate, ?CarbonImmutable $now = null): ?string
    {
        $status = $this->status($schedule, $now);
        if (!$status['enabled']) {
            return null;
        }
        if (!$status['is_open']) {
            throw ValidationException::withMessages(['ordering_schedule' => $status['message']]);
        }
        if (!is_string($deliveryDate) || !in_array($deliveryDate, array_column($status['delivery_dates'], 'value'), true)) {
            throw ValidationException::withMessages(['delivery_date' => 'Please choose an available delivery date.']);
        }

        return $deliveryDate;
    }
}
