<?php

namespace App\Http\Controllers;

use App\Models\Country;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CountryController extends Controller
{
    public function index(Request $request)
    {
        $query = Country::withCount('states');
        
        // Clone query for status counts calculation before applying the status filter
        $countQuery = clone $query;
        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $countQuery->where(function($q) use ($searchTerm) {
                $q->where('name', 'like', '%' . $searchTerm . '%')
                  ->orWhere('code', 'like', '%' . $searchTerm . '%');
            });
        }
        
        $statusCounts = [
            'all' => $countQuery->count(),
            'active' => (clone $countQuery)->where('status', true)->count(),
            'inactive' => (clone $countQuery)->where('status', false)->count(),
        ];
        
        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $query->where(function($q) use ($searchTerm) {
                $q->where('name', 'like', '%' . $searchTerm . '%')
                  ->orWhere('code', 'like', '%' . $searchTerm . '%');
            });
        }
        
        if ($request->filled('status') && $request->status !== 'all' && $request->status !== '_empty_') {
            $query->where('status', $request->status == '1');
        }
        
        // Dynamic sorting
        $allowedSortFields = ['name', 'code', 'states_count', 'status', 'created_at', 'id'];
        $sortField = $request->input('sort_field', 'name');
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'name';
        }
        
        $sortDirection = $request->input('sort_direction', 'asc');
        if (!in_array(strtolower($sortDirection), ['asc', 'desc'])) {
            $sortDirection = 'asc';
        }
        
        if ($sortField === 'states_count') {
            $query->orderBy('states_count', $sortDirection);
        } else {
            $query->orderBy($sortField, $sortDirection);
        }
        
        $countries = $query->paginate($request->get('per_page', 10))->withQueryString();
        
        return Inertia::render('countries/index', [
            'countries' => $countries,
            'filters' => $request->all(['search', 'status', 'per_page', 'sort_field', 'sort_direction']),
            'statusCounts' => $statusCounts
        ]);
    }

    public function create()
    {
        return Inertia::render('countries/create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:3|unique:countries',
            'status' => 'boolean'
        ]);

        Country::create($request->all());

        return redirect()->route('countries.index')->with('success', 'Country created successfully.');
    }

    public function show(Country $country)
    {
        $country->load(['states' => function($query) {
            $query->withCount('cities');
        }]);

        return Inertia::render('countries/show', [
            'country' => $country
        ]);
    }

    public function edit(Country $country)
    {
        return Inertia::render('countries/edit', [
            'country' => $country
        ]);
    }

    public function update(Request $request, Country $country)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:3|unique:countries,code,' . $country->id,
            'status' => 'boolean'
        ]);

        $country->update($request->all());

        return redirect()->route('countries.index')->with('success', 'Country updated successfully.');
    }

    public function destroy(Country $country)
    {
        $country->delete();

        return redirect()->route('countries.index')->with('success', 'Country deleted successfully.');
    }
}