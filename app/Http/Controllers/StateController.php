<?php

namespace App\Http\Controllers;

use App\Models\State;
use App\Models\Country;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StateController extends Controller
{
    public function index(Request $request)
    {
        $query = State::with('country')->withCount('cities');
        
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
        $allowedSortFields = ['name', 'cities_count', 'status', 'created_at', 'id'];
        $sortField = $request->input('sort_field', 'name');
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'name';
        }
        
        $sortDirection = $request->input('sort_direction', 'asc');
        if (!in_array(strtolower($sortDirection), ['asc', 'desc'])) {
            $sortDirection = 'asc';
        }
        
        if ($sortField === 'cities_count') {
            $query->orderBy('cities_count', $sortDirection);
        } else {
            $query->orderBy($sortField, $sortDirection);
        }
        
        $states = $query->paginate($request->get('per_page', 10))->withQueryString();
        $countries = Country::active()->orderBy('name')->get();
        
        return Inertia::render('states/index', [
            'states' => $states,
            'countries' => $countries,
            'filters' => $request->all(['search', 'status', 'per_page', 'sort_field', 'sort_direction']),
            'statusCounts' => $statusCounts
        ]);
    }

    public function create()
    {
        $countries = Country::active()->orderBy('name')->get();
        
        return Inertia::render('states/create', [
            'countries' => $countries
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'country_id' => 'required|exists:countries,id',
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:10',
            'status' => 'boolean'
        ]);

        State::create($request->all());

        return redirect()->route('states.index')->with('success', 'State created successfully.');
    }

    public function show(State $state)
    {
        $state->load(['country', 'cities']);

        return Inertia::render('states/show', [
            'state' => $state
        ]);
    }

    public function edit(State $state)
    {
        $countries = Country::active()->orderBy('name')->get();
        
        return Inertia::render('states/edit', [
            'state' => $state,
            'countries' => $countries
        ]);
    }

    public function update(Request $request, State $state)
    {
        $request->validate([
            'country_id' => 'required|exists:countries,id',
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:10',
            'status' => 'boolean'
        ]);

        $state->update($request->all());

        return redirect()->route('states.index')->with('success', 'State updated successfully.');
    }

    public function destroy(State $state)
    {
        $state->delete();

        return redirect()->route('states.index')->with('success', 'State deleted successfully.');
    }
}