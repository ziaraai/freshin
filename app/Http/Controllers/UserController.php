<?php

namespace App\Http\Controllers;

use App\Http\Requests\UserRequest;
use App\Models\LoginHistory;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UserController extends BaseController
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $authUser     = Auth::user();
        $authUserRole = $authUser->roles->first()?->name;
        // Allow superadmin, admin, product-manager, contact-manager, viewer
        if (!$authUser->hasPermissionTo('manage-users')) {
            abort(403, 'Unauthorized Access Prevented');
        }

        $userQuery = User::withPermissionCheck()->with(['roles', 'creator']);
        # Superadmin should not see other superadmins
        if ($authUserRole === 'superadmin') {
            $userQuery->whereDoesntHave('roles', function ($q) {
                $q->where('name', 'superadmin');
            });
        }

        // Filter by current store for company users
        $currentStoreId = getCurrentStoreId($authUser);
        if ($authUserRole === 'company' && $currentStoreId) {
            $userQuery->where('created_by', $authUser->id)->where('current_store', $currentStoreId);
        } elseif ($authUser->type !== 'superadmin' && $currentStoreId) {
            $userQuery->where('created_by', $authUser->created_by)->where('current_store', $currentStoreId);
        }

        // Handle search
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $userQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Handle role filter
        if ($request->has('role') && $request->role !== 'all') {
            $userQuery->whereHas('roles', function ($q) use ($request) {
                $q->where('roles.id', $request->role);
            });
        }

        // Handle sorting
        $allowedSortFields = ['name', 'email', 'created_at', 'status', 'id'];
        $sortField = $request->input('sort_field', 'created_at');
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'created_at';
        }

        $sortDirection = $request->input('sort_direction', 'desc');
        if (!in_array(strtolower($sortDirection), ['asc', 'desc'])) {
            $sortDirection = 'desc';
        }

        $userQuery->orderBy($sortField, $sortDirection);

        // Handle pagination
        $perPage = $request->has('per_page') ? (int)$request->per_page : 10;
        $users = $userQuery->paginate($perPage)->withQueryString();

        # Roles listing - Filter roles based on user type
        if ($authUserRole == 'company') {
            // Company users can only see roles they created (exclude system roles)
            $roles = Role::where('created_by', $authUser->id)
                ->whereNotIn('name', ['superadmin', 'company'])
                ->get();
        } elseif ($authUser->type !== 'superadmin') {
            // Non-company, non-superadmin users can only see roles created by their creator
            $roles = Role::where('created_by', $authUser->created_by)
                ->whereNotIn('name', ['superadmin', 'company'])
                ->get();
        } else {
            $roles = Role::get();
        }

        // Get plan limits for current store
        $planLimits = null;
        $currentStoreId = getCurrentStoreId($authUser);
        if ($currentStoreId && $authUser->plan) {
            $currentUserCount = User::where('current_store', $currentStoreId)
                ->where('type', '!=', 'company')
                ->count();
            $maxUsers = $authUser->plan->max_users_per_store ?? $authUser->plan->max_users ?? 0;
            $planLimits = [
                'current_users' => $currentUserCount,
                'max_users' => $maxUsers,
                'can_create' => $currentUserCount < $maxUsers
            ];
        }

        return Inertia::render('users/index', [
            'users' => $users,
            'roles' => $roles,
            'planLimits' => $planLimits,
            'filters' => [
                'search' => $request->search ?? '',
                'role' => $request->role ?? 'all',
                'per_page' => $perPage,
                'sort_field' => $request->sort_field ?? 'created_at',
                'sort_direction' => $request->sort_direction ?? 'desc',
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(UserRequest $request)
    {
        // Set user language same as creator (company)
        $authUser = Auth::user();

        $companySettings = settings();
        $userLang = $companySettings['defaultLanguage'] ?? $authUser->lang;
        // Check if user can add more users to current store
        $currentStoreId = getCurrentStoreId($authUser);
        if ($currentStoreId) {
            $userCheck = $authUser->canAddUserToStore($currentStoreId);
            if (!$userCheck['allowed']) {
                return redirect()->back()->with('error', $userCheck['message']);
            }
        }

        if (!in_array(auth()->user()->type, ['superadmin', 'company'])) {
            $created_by = auth()->user()->created_by;
        } else {
            $created_by = auth()->id();
        }

        $user = User::create([
            'name'       => $request->name,
            'email'      => $request->email,
            'password'   => Hash::make($request->password),
            'created_by' => $created_by,
            'lang'       => $userLang ?? 'en',
            'current_store' => getCurrentStoreId($authUser),
        ]);

        if ($user && $request->roles) {
            // Convert role names to IDs for syncing - validate role access
            $roleQuery = Role::where('id', $request->roles);

            if ($authUser->type === 'company') {
                // Company users can only assign roles they created
                $roleQuery->where('created_by', $authUser->id);
            } elseif ($authUser->type !== 'superadmin' && $authUser->type !== 'company') {
                // Sub-users can only assign roles created by their creator
                $roleQuery->where('created_by', $authUser->created_by);
            }

            $role = $roleQuery->first();

            $user->roles()->sync([$role->id]);
            $user->type = $role->name;
            $user->save();

            // Trigger email notification
            event(new \App\Events\UserCreated($user, $request->password));

            // Check for email errors
            if (session()->has('email_error')) {
                return redirect()->route('users.index')->with('warning', __('User created successfully, but welcome email failed: ') . session('email_error'));
            }

            return redirect()->route('users.index')->with('success', __('User created with roles'));
        }
        return redirect()->back()->with('error', __('Unable to create User. Please try again!'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UserRequest $request, User $user)
    {
        if ($user) {
            $user->name  = $request->name;
            $user->email = $request->email;

            // find and syncing role
            if ($request->roles) {
                if (!in_array(auth()->user()->type, ['superadmin', 'company'])) {
                    $created_by = auth()->user()->created_by;
                } else {
                    $created_by = auth()->id();
                }
                $roleQuery = Role::where('id', $request->roles);

                if (auth()->user()->type === 'company') {
                    // Company users can only assign roles they created
                    $roleQuery->where('created_by', auth()->id());
                } elseif (auth()->user()->type !== 'superadmin' && auth()->user()->type !== 'company') {
                    // Sub-users can only assign roles created by their creator
                    $roleQuery->where('created_by', auth()->user()->created_by);
                }

                $role = $roleQuery->first();

                $user->roles()->sync([$role->id]);
                $user->type = $role->name;
            }

            $user->save();
            return redirect()->route('users.index')->with('success', __('User updated with roles'));
        }
        return redirect()->back()->with('error', __('Unable to update User. Please try again!'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        if ($user) {
            $user->delete();
            return redirect()->route('users.index')->with('success', __('User deleted with roles'));
        }
        return redirect()->back()->with('error', __('Unable to delete User. Please try again!'));
    }

    /**
     * Reset user password
     */
    public function resetPassword(Request $request, User $user)
    {
        $request->validate([
            'password' => 'required|min:8|confirmed',
        ]);

        $user->password = Hash::make($request->password);
        $user->save();

        return redirect()->route('users.index')->with('success', __('Password reset successfully'));
    }

    /**
     * Toggle user status
     */
    public function toggleStatus(User $user)
    {
        $user->status = $user->status === 'active' ? 'inactive' : 'active';
        $user->save();

        return redirect()->route('users.index')->with('success', __('User status updated successfully'));
    }

    /**
     * Display login history logs
     */
    public function allUserLogs(Request $request)
    {
        if (Auth::user()->can('manage-login-history')) {
            $authUser = Auth::user();

            $allowedSortFields = ['ip', 'created_at'];
            $sortField = $request->input('sort_field', 'created_at');
            $sortDirection = $request->input('sort_direction', 'desc');
            if (!in_array($sortField, $allowedSortFields)) {
                $sortField = 'created_at';
            }
            $sortDirection = in_array($sortDirection, ['asc', 'desc']) ? $sortDirection : 'desc';

            if ($authUser->type === 'superadmin') {
                // For superadmin: show superadmin's own logs + company role logs only
                $loginHistoriesQuery = LoginHistory::where(function ($q) use ($authUser) {
                    $q->where('user_id', $authUser->id)
                        ->orWhereHas('user', function ($userQuery) {
                            $userQuery->where('type', 'company');
                        });
                })
                    ->with('user')
                    ->orderBy($sortField, $sortDirection);
            } else {
                // For company/sub-user: current company user and staff current store wise
                $currentStoreId = getCurrentStoreId($authUser);
                $companyId = $authUser->type === 'company' ? $authUser->id : $authUser->created_by;

                $loginHistoriesQuery = LoginHistory::where(function ($q) use ($companyId) {
                    $q->where('user_id', $companyId)
                        ->orWhere('created_by', $companyId);
                });

                if ($currentStoreId) {
                    $loginHistoriesQuery->where('store_id', $currentStoreId);
                }

                $loginHistoriesQuery->with('user')->orderBy($sortField, $sortDirection);
            }

            // Handle search
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $loginHistoriesQuery->where(function ($q) use ($search) {
                    $q->where('ip', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($userQuery) use ($search) {
                            $userQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                });
            }

            // Handle user_type filter
            if ($request->has('user_type') && $request->user_type !== 'all' && $request->user_type !== '_empty_') {
                $userType = $request->user_type;
                $loginHistoriesQuery->whereHas('user', function ($q) use ($userType) {
                    $q->where('type', $userType);
                });
            }

            // Handle pagination
            $perPage = $request->has('per_page') ? (int) $request->per_page : 10;
            $loginHistories = $loginHistoriesQuery->paginate($perPage)->withQueryString();

            $loginHistories->getCollection()->transform(function ($history) {
                return [
                    'id' => $history->id,
                    'ip' => $history->ip,
                    'created_at' => $history->created_at,
                    'details' => $history->details,
                    'user' => $history->user ? [
                        'id' => $history->user->id,
                        'name' => $history->user->name,
                        'email' => $history->user->email,
                        'type' => $history->user->type,
                        'avatar' => $history->user->avatar,
                    ] : null,
                ];
            });

            if ($authUser->type === 'superadmin') {
                $userTypes = User::where(function ($q) use ($authUser) {
                    $q->where('id', $authUser->id)->orWhere('type', 'company');
                })->select('type')->distinct()->pluck('type');
            } else {
                $companyId = $authUser->type === 'company' ? $authUser->id : $authUser->created_by;
                $currentStoreId = getCurrentStoreId($authUser);
                $userTypes = User::where(function ($q) use ($companyId, $currentStoreId) {
                    $q->where('id', $companyId)->orWhere(function ($sub) use ($companyId, $currentStoreId) {
                        $sub->where('created_by', $companyId);
                        if ($currentStoreId) {
                            $sub->where('current_store', $currentStoreId);
                        }
                    });
                })->select('type')->distinct()->pluck('type');
            }

            return Inertia::render('users/all-logs', [
                'loginHistories' => $loginHistories,
                'userTypes' => $userTypes,
                'filters' => [
                    'search' => $request->search ?? '',
                    'per_page' => $perPage,
                    'sort_field' => $sortField,
                    'sort_direction' => $sortDirection,
                    'user_type' => ($request->user_type && $request->user_type !== 'all' && $request->user_type !== '_empty_') ? $request->user_type : '_empty_',
                ],
            ]);
        } else {
            return redirect()->back()->with('error', __('Permission Denied.'));
        }
    }

    public function destroyLoginHistory(LoginHistory $loginHistory)
    {
        if (Auth::user()->can('delete-login-history')) {
            $authUser = Auth::user();
            if ($authUser->type !== 'superadmin' && $authUser->type !== 'company' && !$authUser->hasPermissionTo('delete-login-history')) {
                return redirect()->back()->with('error', __('Permission Denied.'));
            }
            $loginHistory->delete();
            return redirect()->back()->with('success', __('Login history deleted successfully.'));
        } else {
            return redirect()->back()->with('error', __('Permission Denied.'));
        }
    }
}
