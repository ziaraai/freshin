<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Models\PlanRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PlanRequestController extends BaseController
{
    public function index(Request $request)
    {
        $user = Auth::user();

        // Check permissions - use permission-based access
        if (!$user->hasPermissionTo('manage-plan-requests')) {
            abort(403, 'Unauthorized Access Prevented');
        }

        $query = PlanRequest::with(['user', 'plan', 'approver', 'rejector']);

        // Filter by company data if not superadmin
        if (!$user->hasPermissionTo('approve-plan-requests')) {
            // Get company ID - either current user if company, or creator if company user
            $companyId = $user->type === 'company' ? $user->id : $user->created_by;

            // Get all users in this company (company + company users)
            $companyUserIds = \App\Models\User::where(function ($q) use ($companyId) {
                $q->where('id', $companyId) // Company user
                    ->orWhere('created_by', $companyId); // Company's users
            })->pluck('id');

            $query->whereIn('plan_requests.user_id', $companyUserIds);
        }

        // Apply search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', function ($userQuery) use ($search) {
                    $userQuery->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                })
                    ->orWhereHas('plan', function ($planQuery) use ($search) {
                        $planQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Calculate status counts based on current search filters
        $statusCounts = [
            'all' => (clone $query)->count(),
            'pending' => (clone $query)->where('plan_requests.status', 'pending')->count(),
            'approved' => (clone $query)->where('plan_requests.status', 'approved')->count(),
            'rejected' => (clone $query)->where('plan_requests.status', 'rejected')->count(),
        ];

        // Apply filters
        if ($request->has('status') && $request->status !== 'all' && $request->status !== '_empty_') {
            $query->where('plan_requests.status', $request->status);
        }

        // Apply sorting
        $sortField = $request->input('sort_field', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');
        if (!in_array(strtolower($sortDirection), ['asc', 'desc'])) {
            $sortDirection = 'desc';
        }

        if ($sortField === 'user.name') {
            $query->join('users', 'plan_requests.user_id', '=', 'users.id')
                ->orderBy('users.name', $sortDirection)
                ->select('plan_requests.*');
        } elseif ($sortField === 'user.email') {
            $query->join('users', 'plan_requests.user_id', '=', 'users.id')
                ->orderBy('users.email', $sortDirection)
                ->select('plan_requests.*');
        } elseif ($sortField === 'plan.name') {
            $query->join('plans', 'plan_requests.plan_id', '=', 'plans.id')
                ->orderBy('plans.name', $sortDirection)
                ->select('plan_requests.*');
        } elseif ($sortField === 'duration') {
            $query->orderBy('plan_requests.duration', $sortDirection);
        } elseif ($sortField === 'status') {
            $query->orderBy('plan_requests.status', $sortDirection);
        } else {
            $query->orderBy('plan_requests.created_at', $sortDirection);
        }

        $perPage = $request->get('per_page', 10);
        $planRequests = $query->paginate($perPage)->withQueryString();

        // Add formatted prices using superadmin currency settings
        $planRequests->getCollection()->transform(function ($request) {
            $price = $request->duration === 'yearly' ? $request->plan->yearly_price : $request->plan->price;
            $request->formatted_price = formatCurrencyAmount($price);
            return $request;
        });

        return Inertia::render('plans/plan-request', [
            'planRequests' => $planRequests,
            'statusCounts' => $statusCounts,
            'filters' => $request->only(['search', 'status', 'per_page', 'sort_field', 'sort_direction'])
        ]);
    }

    // public function approve(PlanRequest $planRequest)
    // {
    //     $planRequest->update([
    //         'status' => 'approved',
    //         'approved_at' => now(),
    //         'approved_by' => Auth::id(),
    //     ]);

    //     // Assign plan to the user
    //     $user = $planRequest->user;
    //     $plan = $planRequest->plan;

    //     $expireDate = $planRequest->duration === 'yearly' 
    //         ? now()->addYear() 
    //         : now()->addMonth();

    //     $user->update([
    //         'plan_id' => $plan->id,
    //         'plan_is_active' => 1,
    //         'plan_expire_date' => $expireDate,
    //         'is_trial' => 0,
    //         'trial_expire_date' => null
    //     ]);

    //     return redirect()->route('plan-requests.index')->with('success', __('Plan request approved and assigned successfully!'));
    // }


    public function approve(PlanRequest $planRequest)
    {
        // Guard: only pending requests can be approved
        if ($planRequest->status !== 'pending') {
            return redirect()->route('plan-requests.index')
                ->with('error', __('This plan request has already been :status.', ['status' => $planRequest->status]));
        }

        // Guard: plan must still exist
        $plan = Plan::find($planRequest->plan_id);
        if (! $plan) {
            return redirect()->route('plan-requests.index')
                ->with('error', __('The requested plan no longer exists.'));
        }

        // Guard: user must still exist
        $user = $planRequest->user;
        if (! $user) {
            return redirect()->route('plan-requests.index')
                ->with('error', __('The requesting user no longer exists.'));
        }

        // Determine billing cycle (fallback to monthly if null)
        $billingCycle = $planRequest->duration ?? 'monthly';

        DB::transaction(function () use ($planRequest, $plan, $user, $billingCycle) {
            $planRequest->update([
                'status' => 'approved',
                'approved_at' => now(),
                'approved_by' => Auth::id(),
            ]);

            assignPlanToUser($user, $plan, $billingCycle);

            $planOrderData = [
                'user_id' => $user->id,
                'plan_id' => $plan->id,
                'billing_cycle' => $billingCycle,
                'payment_method' => 'Plan Request',
                'coupon_code' => null,
                'payment_id' => null,
                'status' => 'approved',
                'processed_at' => now(),
            ];

            createPlanOrder($planOrderData);
        });

        return redirect()->route('plan-requests.index')
            ->with('success', __('Plan request approved successfully!'));
    }

    public function reject(PlanRequest $planRequest)
    {
        $planRequest->update([
            'status' => 'rejected',
            'rejected_at' => now(),
            'rejected_by' => Auth::id(),
        ]);

        return redirect()->route('plan-requests.index')->with('success', __('Plan request rejected successfully!'));
    }
}
