<?php

namespace App\Http\Controllers;

use App\Models\City;
use App\Models\State;
use App\Models\Country;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CityController extends Controller
{
    public function index(Request $request)
    {
        $query = City::with(['state.country']);
        
        // Clone query for status counts calculation before applying the status filter
        $countQuery = clone $query;
        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $countQuery->where('name', 'like', '%' . $searchTerm . '%');
        }
        
        $statusCounts = [
            'all' => $countQuery->count(),
            'active' => (clone $countQuery)->where('status', true)->count(),
            'inactive' => (clone $countQuery)->where('status', false)->count(),
        ];
        
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }
        
        if ($request->filled('status') && $request->status !== 'all' && $request->status !== '_empty_') {
            $query->where('status', $request->status == '1');
        }
        
        // Dynamic sorting
        $allowedSortFields = ['name', 'status', 'created_at', 'id'];
        $sortField = $request->input('sort_field', 'name');
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'name';
        }
        
        $sortDirection = $request->input('sort_direction', 'asc');
        if (!in_array(strtolower($sortDirection), ['asc', 'desc'])) {
            $sortDirection = 'asc';
        }
        
        $query->orderBy($sortField, $sortDirection);
        
        $cities = $query->paginate($request->get('per_page', 10))->withQueryString();
        $countries = Country::active()->orderBy('name')->get();
        
        return Inertia::render('cities/index', [
            'cities' => $cities,
            'countries' => $countries,
            'filters' => $request->all(['search', 'status', 'per_page', 'sort_field', 'sort_direction']),
            'statusCounts' => $statusCounts
        ]);
    }

    public function create()
    {
        $countries = Country::active()->orderBy('name')->get();
        
        return Inertia::render('cities/create', [
            'countries' => $countries
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'state_id' => 'required|exists:states,id',
            'name' => 'required|string|max:255',
            'status' => 'boolean'
        ], [], [
            'state_id' => __('State'),
            'name' => __('City Name'),
        ]);

        City::create($request->all());

        return redirect()->route('cities.index')->with('success', 'City created successfully.');
    }

    public function show(City $city)
    {
        $city->load(['state.country']);

        return Inertia::render('cities/show', [
            'city' => $city
        ]);
    }

    public function edit(City $city)
    {
        $countries = Country::active()->orderBy('name')->get();
        $states = State::where('country_id', $city->state->country_id)->active()->orderBy('name')->get();
        
        return Inertia::render('cities/edit', [
            'city' => $city,
            'countries' => $countries,
            'states' => $states
        ]);
    }

    public function update(Request $request, City $city)
    {
        $request->validate([
            'state_id' => 'required|exists:states,id',
            'name' => 'required|string|max:255',
            'status' => 'boolean'
        ], [], [
            'state_id' => __('State'),
            'name' => __('City Name'),
        ]);

        $city->update($request->all());

        return redirect()->route('cities.index')->with('success', 'City updated successfully.');
    }

    public function destroy(City $city)
    {
        $city->delete();

        return redirect()->route('cities.index')->with('success', 'City deleted successfully.');
    }
}