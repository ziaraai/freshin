<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Plan;
use App\Models\PlanOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class CompanyController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query()
            ->where('type', 'company');

        // Apply search filter
        if ($request->has('search') && !empty($request->search)) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('email', 'like', "%{$request->search}%");
            });
        }

        // Apply date filters
        if ($request->has('start_date') && !empty($request->start_date)) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->has('end_date') && !empty($request->end_date)) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        // Calculate status counts based on current filters (excluding status itself)
        $statusCounts = [
            'all' => (clone $query)->count(),
            'active' => (clone $query)->where('status', 'active')->count(),
            'inactive' => (clone $query)->where('status', 'inactive')->count(),
        ];

        // Apply status filter
        if ($request->has('status') && $request->status !== 'all' && $request->status !== '_empty_') {
            $query->where('status', $request->status);
        }

        // Eager load plan relationship
        $query->with('plan');

        // Apply sorting
        $allowedSortFields = ['name', 'email', 'status', 'created_at', 'plan_id', 'id'];
        $sortField = $request->input('sort_field', 'created_at');
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'created_at';
        }

        $sortDirection = $request->input('sort_direction', 'desc');
        if (!in_array(strtolower($sortDirection), ['asc', 'desc'])) {
            $sortDirection = 'desc';
        }

        // In demo mode, show demo account first
        if (config('app.is_demo')) {
            $query->orderByRaw("CASE WHEN email = 'company@example.com' THEN 0 ELSE 1 END ASC");
        }

        $query->orderBy($sortField, $sortDirection);

        // Get paginated results
        $view = $request->input('view') ?? $request->cookie('companies_view', 'list');
        $defaultPerPage = ($view === 'grid') ? 12 : 10;
        $perPage = $request->input('per_page', $defaultPerPage);
        $companies = $query->paginate($perPage)->withQueryString();

        // Transform data for frontend
        $companies->getCollection()->transform(function ($company) {
            return [
                'id' => $company->id,
                'name' => $company->name,
                'email' => $company->email,
                'status' => $company->status,
                'avatar' => $company->avatar,
                'created_at' => $company->created_at,
                'plan_name' => $company->plan ? $company->plan->name : __('No Plan'),
                'plan_expiry_date' => $company->plan_expire_date,
                'plan_duration' => $company->plan_duration ?? null,
            ];
        });

        // Get plans for dropdown
        $plans = Plan::all(['id', 'name']);

        return Inertia::render('companies/index', [
            'companies' => $companies,
            'plans' => $plans,
            'statusCounts' => $statusCounts,
            'filters' => array_merge(
                $request->only(['search', 'status', 'start_date', 'end_date', 'sort_field', 'sort_direction']),
                [
                    'per_page' => $perPage,
                    'view' => $view
                ]
            )
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'nullable|string|min:8',
            'status' => 'required|in:active,inactive',
        ]);

        $company = new User();
        $company->name = $validated['name'];
        $company->email = $validated['email'];

        // Only set password if provided
        if (isset($validated['password'])) {
            $company->password = Hash::make($validated['password']);
        }

        $company->type = 'company';
        $company->status = $validated['status'];

        // Set company language same as creator (superadmin)
        $creator = auth()->user();
        $superAdminSettings = settings();
        $userLang = $superAdminSettings['defaultLanguage'] ?? $creator->lang;
        $company->lang = $userLang ?? 'en';

        // Assign default plan
        $defaultPlan = Plan::where('is_default', true)->first();
        if ($defaultPlan) {
            $company->plan_id = $defaultPlan->id;
            $company->plan_duration = $defaultPlan->duration ?? 'monthly';

            // Set plan expiry date based on plan duration
            if ($defaultPlan->duration === 'yearly') {
                $company->plan_expire_date = now()->addYear();
            } else {
                $company->plan_expire_date = now()->addMonth();
            }

            // Set plan is active
            $company->plan_is_active = 1;
        }

        $company->save();

        // Assign role and settings to the user
        defaultRoleAndSetting($company);

        // Trigger email notification
        event(new \App\Events\UserCreated($company, $validated['password'] ?? ''));

        // Check for email errors
        if (session()->has('email_error')) {
            return redirect()->back()->with('warning', __('Company created successfully, but welcome email failed: ') . session('email_error'));
        }

        return redirect()->back()->with('success', __('Company created successfully'));
    }

    public function update(Request $request, User $company)
    {
        // Ensure this is a company type user
        if ($company->type !== 'company') {
            return redirect()->back()->with('error', __('Invalid company record'));
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $company->id,
            'status' => 'required|in:active,inactive',
        ]);

        $company->name = $validated['name'];
        $company->email = $validated['email'];
        $company->status = $validated['status'];

        $company->save();

        return redirect()->back()->with('success', __('Company updated successfully'));
    }

    public function destroy(User $company)
    {
        // Ensure this is a company type user
        if ($company->type !== 'company') {
            return redirect()->back()->with('error', __('Invalid company record'));
        }

        $company->delete();

        return redirect()->back()->with('success', __('Company deleted successfully'));
    }

    public function resetPassword(Request $request, User $company)
    {
        // Ensure this is a company type user
        if ($company->type !== 'company') {
            return redirect()->back()->with('error', __('Invalid company record'));
        }

        $validated = $request->validate([
            'password' => ['required', 'string', 'min:8'],
        ]);

        $company->password = Hash::make($validated['password']);
        $company->save();

        return redirect()->back()->with('success', __('Password reset successfully'));
    }

    public function toggleStatus(User $company)
    {
        // Ensure this is a company type user
        if ($company->type !== 'company') {
            return redirect()->back()->with('error', __('Invalid company record'));
        }

        $company->status = $company->status === 'active' ? 'inactive' : 'active';
        $company->save();

        return redirect()->back()->with('success', __('Company status updated successfully'));
    }

    /**
     * Get available plans for upgrade
     */
    public function getPlans(User $company)
    {
        // Ensure this is a company type user
        if ($company->type !== 'company') {
            return response()->json(['error' => __('Invalid company record')], 400);
        }

        $plans = Plan::where('is_plan_enable', 'on')->get();

        // Determine the company's current billing cycle from their latest approved plan order
        $latestPlanOrder = $company->planOrders()
            ->where('status', 'approved')
            ->where('plan_id', $company->plan_id)
            ->latest('processed_at')
            ->first();

        $currentBillingCycle = $latestPlanOrder ? $latestPlanOrder->billing_cycle : $company->plan_duration;
        if (empty($currentBillingCycle)) {
            $currentBillingCycle = 'monthly';
        }
        if ($company->is_trial) {
            $currentBillingCycle = 'monthly';
        }

        $formattedPlans = [];

        foreach ($plans as $plan) {
            // Format features
            $features = [];
            if ($plan->enable_custdomain === 'on') $features[] = __('Custom Domain');
            if ($plan->enable_custsubdomain === 'on') $features[] = __('Subdomain');
            if ($plan->enable_chatgpt === 'on') $features[] = __('AI Integration');

            // Monthly plan
            $formattedPlans[] = [
                'id' => $plan->id,
                'name' => $plan->name,
                'price' => $plan->price,
                'duration' => 'Monthly',
                'description' => $plan->description,
                'features' => $features,
                'max_stores' => $plan->max_stores,
                'max_users_per_store' => $plan->max_users_per_store,
                'max_products_per_store' => $plan->max_products_per_store,
                'storage_limit' => $plan->storage_limit . ' ' . __('GB'),
                'is_current' => $company->plan_id === $plan->id && ($currentBillingCycle === 'monthly' || $currentBillingCycle === null),
                'is_default' => $plan->is_default,
            ];

            // Yearly plan (create a separate entry)
            $yearlyPrice = $plan->yearly_price ?? ($plan->price * 12 * 0.8);
            $formattedPlans[] = [
                'id' => $plan->id,
                'name' => $plan->name,
                'price' => $yearlyPrice,
                'duration' => 'Yearly',
                'description' => $plan->description,
                'features' => $features,
                'max_stores' => $plan->max_stores,
                'max_users_per_store' => $plan->max_users_per_store,
                'max_products_per_store' => $plan->max_products_per_store,
                'storage_limit' => $plan->storage_limit . ' ' . __('GB'),
                'is_current' => $company->plan_id === $plan->id && $currentBillingCycle === 'yearly',
                'is_default' => $plan->is_default,
            ];
        }

        return response()->json([
            'plans' => $formattedPlans,
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
                'current_plan_id' => $company->plan_id,
            ]
        ]);
    }

    /**
     * Upgrade company plan
     */
    public function upgradePlan(Request $request, User $company)
    {
        // Ensure this is a company type user
        if ($company->type !== 'company') {
            return back()->with('error', __('Invalid company record'));
        }

        $validated = $request->validate([
            'plan_id' => 'required|exists:plans,id',
            'duration' => 'required|in:yearly,monthly',
        ]);

        $plan = Plan::find($validated['plan_id']);
        if (!$plan) {
            return back()->with('error', __('Plan not found'));
        }

        // Create plan order entry for tracking
        $planOrder = new PlanOrder();
        $planOrder->user_id = $company->id;
        $planOrder->plan_id = $plan->id;
        $planOrder->billing_cycle = $validated['duration'];
        $planOrder->original_price = $validated['duration'] === 'yearly' ? ($plan->yearly_price ?? 0) : $plan->price;
        $planOrder->discount_amount = 0;
        $planOrder->final_price = $planOrder->original_price;
        $planOrder->payment_method = 'admin_upgrade';
        $planOrder->status = 'approved';
        $planOrder->ordered_at = now();
        $planOrder->processed_at = now();
        $planOrder->processed_by = auth()->id();
        $planOrder->notes = 'Plan upgraded by super admin';
        $planOrder->save();

        // Assign plan to user using helper
        assignPlanToUser($company, $plan, $validated['duration']);

        return back()->with('success', __('Plan upgraded successfully'));
    }
}
