<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\StoreConfiguration;
use App\Services\OrderingSchedule;
use Illuminate\Http\Request;

class OrderingScheduleController extends Controller
{
    public function show(Request $request, string $storeSlug, OrderingSchedule $schedule)
    {
        $store = $request->attributes->get('resolved_store') ?? Store::where('slug', $storeSlug)->firstOrFail();
        $configuration = StoreConfiguration::getConfiguration($store->id);

        return response()->json($schedule->status($configuration['ordering_schedule']))
            ->header('Cache-Control', 'no-store, private');
    }
}
