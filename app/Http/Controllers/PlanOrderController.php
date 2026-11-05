<?php

namespace App\Http\Controllers;

use App\Models\PlanOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PlanOrderController extends BaseController
{
    public function index(Request $request)
    {
        $user = Auth::user();
        
        // Check permissions - use permission-based access
        if (!$user->hasPermissionTo('manage-plan-orders')) {
            abort(403, 'Unauthorized Access Prevented');
        }
        
        $query = PlanOrder::with(['user', 'plan', 'coupon', 'processedBy']);
        
        // Filter by company data if not superadmin
        if (!$user->hasPermissionTo('approve-plan-orders')) {
            // Get company ID - either current user if company, or creator if company user
            $companyId = $user->type === 'company' ? $user->id : $user->created_by;
            
            // Get all users in this company (company + company users)
            $companyUserIds = \App\Models\User::where(function($q) use ($companyId) {
                $q->where('id', $companyId) // Company user
                  ->orWhere('created_by', $companyId); // Company's users
            })->pluck('id');
            
            $query->whereIn('plan_orders.user_id', $companyUserIds);
        }

        // Apply search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%");
                  })
                  ->orWhereHas('plan', function ($planQuery) use ($search) {
                      $planQuery->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Calculate status counts based on current search filters
        $statusCounts = [
            'all' => (clone $query)->count(),
            'pending' => (clone $query)->where('plan_orders.status', 'pending')->count(),
            'approved' => (clone $query)->where('plan_orders.status', 'approved')->count(),
            'rejected' => (clone $query)->where('plan_orders.status', 'rejected')->count(),
        ];

        // Apply filters
        if ($request->has('status') && $request->status !== 'all' && $request->status !== '_empty_') {
            $query->where('plan_orders.status', $request->status);
        }

        // Apply sorting
        $sortField = $request->input('sort_field', 'ordered_at');
        $sortDirection = $request->input('sort_direction', 'desc');
        if (!in_array(strtolower($sortDirection), ['asc', 'desc'])) {
            $sortDirection = 'desc';
        }

        if ($sortField === 'user.name') {
            $query->join('users', 'plan_orders.user_id', '=', 'users.id')
                  ->orderBy('users.name', $sortDirection)
                  ->select('plan_orders.*');
        } elseif ($sortField === 'plan.name') {
            $query->join('plans', 'plan_orders.plan_id', '=', 'plans.id')
                  ->orderBy('plans.name', $sortDirection)
                  ->select('plan_orders.*');
        } else {
            // Validate sort field
            if (!in_array($sortField, ['order_number', 'payment_type', 'final_price', 'status', 'ordered_at'])) {
                $sortField = 'ordered_at';
            }
            $query->orderBy('plan_orders.' . $sortField, $sortDirection);
        }

        $perPage = $request->get('per_page', 10);
        $planOrders = $query->paginate($perPage)->withQueryString();
        
        // Add formatted prices using superadmin currency settings
        $planOrders->getCollection()->transform(function ($order) {
            $order->formatted_original_price = formatCurrencyAmount($order->original_price);
            $order->formatted_discount_amount = formatCurrencyAmount($order->discount_amount);
            $order->formatted_final_price = formatCurrencyAmount($order->final_price);
            return $order;
        });

        return Inertia::render('plans/plan-orders', [
            'planOrders' => $planOrders,
            'statusCounts' => $statusCounts,
            'filters' => $request->only(['search', 'status', 'sort_field', 'sort_direction', 'per_page'])
        ]);
    }

    public function approve(PlanOrder $planOrder)
    {
        try {
            $planOrder->approve(Auth::id());
            
            return redirect()->route('plan-orders.index')
                ->with('success', __('Plan order approved successfully!'));
        } catch (\Exception $e) {
            return redirect()->route('plan-orders.index')
                ->with('error', __('Failed to approve plan order: ') . $e->getMessage());
        }
    }

    public function reject(Request $request, PlanOrder $planOrder)
    {
        try {
            $request->validate([
                'notes' => 'nullable|string|max:500'
            ]);

            $planOrder->reject(Auth::id(), $request->notes);
            
            return redirect()->route('plan-orders.index')
                ->with('success', __('Plan order rejected successfully!'));
        } catch (\Exception $e) {
            return redirect()->route('plan-orders.index')
                ->with('error', __('Failed to reject plan order: ') . $e->getMessage());
        }
    }
}
