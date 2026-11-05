<?php

namespace App\Http\Controllers\LandingPage;

use App\Http\Controllers\Controller;
use App\Models\LandingPageCustomPage;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomPageController extends Controller
{
    public function index(Request $request)
    {
        $query = LandingPageCustomPage::query();

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('content', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        // Sorting
        $allowedSortFields = ['title', 'slug', 'content', 'is_active', 'created_at', 'sort_order', 'id'];
        $sortField = $request->get('sort_field', 'sort_order');
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'sort_order';
        }
        
        $sortDirection = $request->get('sort_direction', 'asc');
        if (!in_array(strtolower($sortDirection), ['asc', 'desc'])) {
            $sortDirection = 'asc';
        }
        
        if ($sortField === 'sort_order' && $sortDirection === 'asc' && !in_array($request->get('sort_field'), $allowedSortFields)) {
             $query->ordered();
        } else {
             $query->orderBy($sortField, $sortDirection);
        }

        $pages = $query->paginate($request->get('per_page', 10))
                      ->withQueryString();

        return Inertia::render('landing-page/custom-pages/index', [
            'pages' => $pages,
            'filters' => $request->only(['search', 'sort_field', 'sort_direction', 'per_page'])
        ]);
    }

    public function create()
    {
        return Inertia::render('landing-page/custom-pages/create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255',
            'content' => 'required|string',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer'
        ]);

        // Generate unique slug if not provided
        if (empty($validated['slug'])) {
            $validated['slug'] = LandingPageCustomPage::generateUniqueSlug($validated['title']);
        } else {
            // Ensure provided slug is unique
            $validated['slug'] = LandingPageCustomPage::generateUniqueSlug($validated['slug']);
        }

        LandingPageCustomPage::create($validated);

        return redirect()->route('landing-page.custom-pages.index')->with('success', __('Custom page created successfully!'));
    }

    public function edit(LandingPageCustomPage $landingCustomPage)
    {
        return Inertia::render('landing-page/custom-pages/edit', [
            'page' => $landingCustomPage
        ]);
    }

    public function update(Request $request, LandingPageCustomPage $landingCustomPage)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255',
            'content' => 'required|string',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer'
        ]);

        // Generate unique slug if slug is provided and different
        if (!empty($validated['slug']) && $validated['slug'] !== $landingCustomPage->slug) {
            $validated['slug'] = LandingPageCustomPage::generateUniqueSlug($validated['slug'], $landingCustomPage->id);
        } elseif (empty($validated['slug']) && $validated['title'] !== $landingCustomPage->title) {
            // Regenerate slug if title changed but no slug provided
            $validated['slug'] = LandingPageCustomPage::generateUniqueSlug($validated['title'], $landingCustomPage->id);
        }

        $landingCustomPage->update($validated);

        return redirect()->route('landing-page.custom-pages.index')->with('success', __('Custom page updated successfully!'));
    }

    public function destroy(LandingPageCustomPage $landingCustomPage)
    {
        $landingCustomPage->delete();
        return back()->with('success', __('Custom page deleted successfully!'));
    }

    public function show($slug)
    {
        $page = LandingPageCustomPage::where('slug', $slug)->where('is_active', true)->firstOrFail();
        $landingSettings = \App\Models\LandingPageSetting::getSettings();
        
        // Get superadmin brand settings for logos
        $superAdmin = \App\Models\User::where('type', 'superadmin')->first();
        $brandSettings = [];
        if ($superAdmin) {
            $brandSettings = \App\Models\Setting::where('user_id', $superAdmin->id)
                ->whereNull('store_id')
                ->whereIn('key', ['logoDark', 'logoLight'])
                ->pluck('value', 'key')
                ->toArray();
        }
        
        $metaImage = getSetting('metaImage') ?: \App\Models\Setting::getSetting('metaImage', getSuperadminId(), null);
        $metaImageUrl = $metaImage ? (function_exists('getAssetUrl') ? getAssetUrl($metaImage) : (function_exists('get_file') ? get_file($metaImage) : (str_starts_with($metaImage, 'http') ? $metaImage : rtrim(config('app.url'), '/') . '/' . ltrim($metaImage, '/')))) : null;

        $seoData = [
            "meta_title" => $page['meta_title'] ?? getSetting('metaTitle'),
            "meta_description" => $page['meta_description'] ?? getSetting('metaDescription'),
        ];

        return Inertia::render('landing-page/custom-page', [
            'page' => $page,
            'customPages' => LandingPageCustomPage::active()->ordered()->get(),
            'settings' => $landingSettings,
            'superadminLogoDark' => $brandSettings['logoDark'] ?? null,
            'superadminLogoLight' => $brandSettings['logoLight'] ?? null,
            'seo_data' => $seoData,
        ]);
    }

    public function checkSlug(Request $request)
    {
        $request->validate([
            'slug' => 'required|string|max:255',
            'exclude_id' => 'nullable|integer'
        ]);

        $exists = LandingPageCustomPage::slugExists($request->slug, $request->exclude_id);
        
        return response()->json([
            'available' => !$exists,
            'exists' => $exists
        ]);
    }

    public function generateSlug(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'exclude_id' => 'nullable|integer'
        ]);

        $slug = LandingPageCustomPage::generateUniqueSlug($request->title, $request->exclude_id);
        
        return response()->json([
            'slug' => $slug
        ]);
    }
}