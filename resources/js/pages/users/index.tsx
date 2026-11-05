// pages/users/index.tsx
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudTable } from '@/components/CrudTable';
import BadgeUI from '@/components/badge-ui';
import { toast } from '@/components/custom-toast';
import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useInitials } from '@/hooks/use-initials';
import { hasPermission } from '@/utils/authorization';
import { getImageUrl } from '@/utils/image-helper';
import { checkPermission } from '@/utils/permissions';
import { router, usePage } from '@inertiajs/react';
import { Edit, Eye, History, KeyRound, Lock, Plus, Trash2, Unlock } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog } from '@/components/ui/dialog';
import ViewPopup from './view';

export default function Users() {
    const { t } = useTranslation();
    const { auth, users, roles, planLimits, filters: pageFilters = {} } = usePage().props as any;
    const permissions = auth?.permissions || [];
    const getInitials = useInitials();

    // State
    const [activeView, setActiveView] = useState('list');
    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [selectedRole, setSelectedRole] = useState(pageFilters.role && pageFilters.role !== 'all' ? pageFilters.role.toString() : '_empty_');
    const [showFilters, setShowFilters] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');

    // Check if any filters are active
    const hasActiveFilters = () => {
        return selectedRole !== '_empty_' || searchTerm !== '';
    };

    // Count active filters
    const activeFilterCount = () => {
        return (selectedRole !== '_empty_' ? 1 : 0) + (searchTerm ? 1 : 0);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = () => {
        const params: any = { page: 1 };

        if (searchTerm) {
            params.search = searchTerm;
        }

        if (selectedRole !== '_empty_') {
            params.role = selectedRole;
        }

        // Add per_page if it exists
        if (pageFilters.per_page) {
            params.per_page = pageFilters.per_page;
        }

        if (pageFilters.sort_field) {
            params.sort_field = pageFilters.sort_field;
        }

        if (pageFilters.sort_direction) {
            params.sort_direction = pageFilters.sort_direction;
        }

        params.view = activeView;

        router.get(route('users.index'), params, { preserveState: true, preserveScroll: true });
    };

    const handleRoleFilter = (value: string) => {
        setSelectedRole(value);

        const params: any = { page: 1 };

        if (searchTerm) {
            params.search = searchTerm;
        }

        if (value !== '_empty_') {
            params.role = value;
        }

        // Add per_page if it exists
        if (pageFilters.per_page) {
            params.per_page = pageFilters.per_page;
        }

        if (pageFilters.sort_field) {
            params.sort_field = pageFilters.sort_field;
        }

        if (pageFilters.sort_direction) {
            params.sort_direction = pageFilters.sort_direction;
        }

        params.view = activeView;

        router.get(route('users.index'), params, { preserveState: true, preserveScroll: true });
    };

    const handleSort = (field: string) => {
        const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';

        const params: any = {
            sort_field: field,
            sort_direction: direction,
            page: 1,
        };

        // Add search and filters
        if (searchTerm) {
            params.search = searchTerm;
        }

        if (selectedRole !== '_empty_') {
            params.role = selectedRole;
        }

        // Add per_page if it exists
        if (pageFilters.per_page) {
            params.per_page = pageFilters.per_page;
        }

        params.view = activeView;

        router.get(route('users.index'), params, { preserveState: true, preserveScroll: true });
    };

    const handleAction = (action: string, item: any) => {
        const permissionMap = {
            view: 'view-users',
            edit: 'edit-users',
            delete: 'delete-users',
            'reset-password': 'reset-password-users',
            'toggle-status': 'toggle-status-users',
        };

        if (!checkPermission(permissionMap[action], auth)) {
            return;
        }

        setCurrentItem(item);

        switch (action) {
            case 'view':
                setIsViewModalOpen(true);
                break;
            case 'edit':
                setFormMode('edit');
                setIsFormModalOpen(true);
                break;
            case 'delete':
                setIsDeleteModalOpen(true);
                break;
            case 'reset-password':
                setIsResetPasswordModalOpen(true);
                break;
            case 'toggle-status':
                handleToggleStatus(item);
                break;
            default:
                break;
        }
    };

    const handleAddNew = () => {
        if (!checkPermission('create-users', auth)) {
            return;
        }

        setCurrentItem(null);
        setFormMode('create');
        setIsFormModalOpen(true);
    };

    const handleFormSubmit = (formData: any) => {
        // Keep roles as single string value, not array
        if (formData.roles && Array.isArray(formData.roles)) {
            formData.roles = formData.roles[0];
        }

        if (formMode === 'create') {
            router.post(route('users.store'), formData, {
                onSuccess: (page: any) => {
                    setIsFormModalOpen(false);
                    if (page.props.flash?.success) {
                        toast.success(t(page.props.flash.success));
                    } else if (page.props.flash?.error) {
                        toast.error(t(page.props.flash.error));
                    }
                },
                onError: (errors) => {
                    toast.error(`Failed to create user: ${Object.values(errors).join(', ')}`);
                },
            });
        } else if (formMode === 'edit') {
            router.put(route('users.update', currentItem.id), formData, {
                onSuccess: (page: any) => {
                    setIsFormModalOpen(false);
                    if (page.props.flash?.success) {
                        toast.success(t(page.props.flash.success));
                    } else if (page.props.flash?.error) {
                        toast.error(t(page.props.flash.error));
                    }
                },
                onError: (errors) => {
                    toast.error(`Failed to update user: ${Object.values(errors).join(', ')}`);
                },
            });
        }
    };

    const handleDeleteConfirm = () => {
        router.delete(route('users.destroy', currentItem.id), {
            onSuccess: (page: any) => {
                setIsDeleteModalOpen(false);
                if (page.props.flash?.success) {
                    toast.success(t(page.props.flash.success));
                } else if (page.props.flash?.error) {
                    toast.error(t(page.props.flash.error));
                }
            },
            onError: (errors) => {
                toast.error(`Failed to delete user: ${Object.values(errors).join(', ')}`);
            },
        });
    };

    const handleResetPasswordConfirm = (data: { password: string; password_confirmation: string }) => {
        router.put(route('users.reset-password', currentItem.id), data, {
            onSuccess: (page: any) => {
                setIsResetPasswordModalOpen(false);
                if (page.props.flash?.success) {
                    toast.success(t(page.props.flash.success));
                } else if (page.props.flash?.error) {
                    toast.error(t(page.props.flash.error));
                }
            },
            onError: (errors) => {
                toast.error(`Failed to reset password: ${Object.values(errors).join(', ')}`);
            },
        });
    };

    const handleToggleStatus = (user: any) => {
        router.put(
            route('users.toggle-status', user.id),
            {},
            {
                onSuccess: (page: any) => {
                    if (page.props.flash?.success) {
                        toast.success(t(page.props.flash.success));
                    } else if (page.props.flash?.error) {
                        toast.error(t(page.props.flash.error));
                    }
                },
                onError: (errors) => {
                    toast.error(`Failed to update user status: ${Object.values(errors).join(', ')}`);
                },
            },
        );
    };

    const handleResetFilters = () => {
        setSelectedRole('_empty_');
        setSearchTerm('');
        setShowFilters(false);

        router.get(
            route('users.index'),
            {
                page: 1,
                per_page: pageFilters.per_page,
                view: activeView,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handlePageChange = (url: string) => {
        const pageNum = new URL(url).searchParams.get('page') || '1';
        const params: any = {
            page: pageNum,
            view: activeView,
        };

        if (searchTerm) {
            params.search = searchTerm;
        }

        if (selectedRole !== '_empty_') {
            params.role = selectedRole;
        }

        if (pageFilters.per_page) {
            params.per_page = pageFilters.per_page;
        }

        if (pageFilters.sort_field) {
            params.sort_field = pageFilters.sort_field;
        }

        if (pageFilters.sort_direction) {
            params.sort_direction = pageFilters.sort_direction;
        }

        router.get(route('users.index'), params, { preserveState: true, preserveScroll: true });
    };

    // Define page actions
    const pageActions = [];

    // Add User Logs button
    if (hasPermission(permissions, 'manage-login-history') || auth?.user?.type === 'company') {
        pageActions.push({
            icon: <History className="h-4 w-4" />,
            variant: 'outline',
            iconOnly: true,
            tooltip: t('Login History'),
            onClick: () => router.get(route('users.all-logs')),
        });
    }

    // Add the "Add New User" button if user has permission and within limits
    if (hasPermission(permissions, 'create-users')) {
        const canCreate = !planLimits || planLimits.can_create;
        pageActions.push({
            label:
                planLimits && !canCreate
                    ? t('User Limit Reached ({{current}}/{{max}})', { current: planLimits.current_users, max: planLimits.max_users })
                    : t('Add User'),
            icon: <Plus className="h-4 w-4" />,
            variant: canCreate ? 'default' : 'outline',
            onClick: canCreate
                ? () => handleAddNew()
                : () =>
                      toast.error(
                          t('User limit exceeded. Your plan allows maximum {{max}} users. Please upgrade your plan.', { max: planLimits.max_users }),
                      ),
            disabled: !canCreate,
        });
    }

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Staff Management'), href: route('users.index') },
        { title: t('Users') },
    ];

    // Define table columns
    const columns = [
        {
            key: 'name',
            label: t('Name'),
            sortable: true,
            render: (value: any, row: any) => {
                return (
                    <div className="flex items-center gap-3">
                        {row.avatar ? (
                            <img src={row.avatar} alt={row.name} className="h-10 w-10 rounded-full border object-cover" onError={(e) => {
                            (e.target as HTMLImageElement).src = getImageUrl('/storage/media/avatars/avatar.png');
                          }} />
                        ) : (
                            <img src={getImageUrl('/storage/media/avatars/avatar.png')} alt={row.name} className="h-10 w-10 rounded-full border object-cover" onError={(e) => {
                            (e.target as HTMLImageElement).src = getImageUrl('/storage/media/avatars/avatar.png');
                          }} />
                        )}
                        <div>
                            <div className="font-medium">{row.name}</div>
                            <div className="text-muted-foreground text-sm">{row.email}</div>
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'roles',
            label: t('Roles'),
            render: (value: any) => {
                if (!value || !value.length) return <span className="text-muted-foreground">No roles assigned</span>;

                return value.map((role: any) => {
                    return (
                        <BadgeUI
                            key={role.id}
                            className="bg-primary/10 text-primary ring-primary/30 dark:bg-primary/15 dark:text-primary dark:ring-primary/35 mr-1 capitalize whitespace-nowrap"
                        >
                            {role.label || role.name}
                        </BadgeUI>
                    );
                });
            },
        },
        {
            key: 'created_at',
            label: t('Joined'),
            sortable: true,
            type: 'date',
            // render: (value: string) => window.appSettings?.formatDateTime(value, false) || new Date(value).toLocaleDateString(),
        },
    ];

    // Define table actions
    const actions = [
        {
            label: t('View'),
            icon: 'Eye',
            action: 'view',
            className: 'text-blue-500',
            requiredPermission: 'view-users',
        },
        {
            label: t('Edit'),
            icon: 'Edit',
            action: 'edit',
            className: 'text-amber-500',
            requiredPermission: 'edit-users',
        },
        {
            label: t('Reset Password'),
            icon: 'KeyRound',
            action: 'reset-password',
            className: 'text-blue-500',
            requiredPermission: 'reset-password-users',
        },
        {
            label: t('Toggle Status'),
            icon: 'Lock',
            action: 'toggle-status',
            className: 'text-amber-500',
            requiredPermission: 'toggle-status-users',
        },
        {
            label: t('Delete'),
            icon: 'Trash2',
            action: 'delete',
            className: 'text-red-500',
            requiredPermission: 'delete-users',
        },
    ];

    return (
        <PageTemplate title={t('Users')} url="/users" actions={pageActions} breadcrumbs={breadcrumbs} noPadding description={t('Manage your application users.')}>
            {/* Search and filters section */}
            <div className="mb-4 rounded-lg border bg-white shadow dark:bg-gray-900">
                <SearchAndFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onSearch={handleSearch}
                    searchPlaceholder={t('Search users...')}
                    filters={[
                        {
                            name: 'role',
                            label: t('Role'),
                            type: 'select',
                            value: selectedRole,
                            onChange: handleRoleFilter,
                            options: [
                                { value: '_empty_', label: t('All Roles') },
                                ...(roles || []).map((role: any) => ({
                                    value: role.id.toString(),
                                    label: role.label || role.name,
                                })),
                            ],
                            searchable: true,
                        },
                    ]}
                    hasActiveFilters={hasActiveFilters}
                    activeFilterCount={activeFilterCount}
                    onResetFilters={handleResetFilters}
                    showViewToggle={true}
                    activeView={activeView}
                    onViewChange={setActiveView}
                />
            </div>

            {/* Content section */}
            {activeView === 'list' ? (
                <div className="overflow-hidden rounded-lg bg-white shadow">
                    <CrudTable
                        columns={columns}
                        actions={actions}
                        data={users?.data || []}
                        from={users?.from || 1}
                        onAction={handleAction}
                        sortField={pageFilters.sort_field}
                        sortDirection={pageFilters.sort_direction}
                        onSort={handleSort}
                        permissions={permissions}
                        entityPermissions={{
                            view: 'view-users',
                            create: 'create-users',
                            edit: 'edit-users',
                            delete: 'delete-users',
                        }}
                    />

                    {/* Pagination section */}
                    <Pagination
                        from={users?.from || 0}
                        to={users?.to || 0}
                        total={users?.total || 0}
                        links={users?.links}
                        entityName={t('users')}
                        currentPerPage={pageFilters.per_page?.toString() || '10'}
                        onPerPageChange={(value) => {
                            const params: any = {
                                page: 1,
                                per_page: parseInt(value),
                            };

                            if (searchTerm) {
                                params.search = searchTerm;
                            }

                            if (selectedRole !== '_empty_') {
                                params.role = selectedRole;
                            }

                            if (pageFilters.sort_field) {
                                params.sort_field = pageFilters.sort_field;
                            }

                            if (pageFilters.sort_direction) {
                                params.sort_direction = pageFilters.sort_direction;
                            }

                            params.view = activeView;

                            router.get(route('users.index'), params, { preserveState: true, preserveScroll: true });
                        }}
                        onPageChange={handlePageChange}
                    />
                </div>
            ) : (
                <div>
                    {/* Grid View */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {users?.data?.map((user: any) => (
                            <Card key={user.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between">
                                {/* Top: Avatar + Name + Email + Role badge */}
                                <div className="p-4 flex items-start gap-3">
                                    <div className="flex-shrink-0">
                                        {user.avatar ? (
                                            <img
                                                src={user.avatar}
                                                alt={user.name}
                                                className="h-12 w-12 rounded-lg object-cover"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                    (target.nextElementSibling as HTMLElement)?.classList.remove('hidden');
                                                }}
                                            />
                                        ) : null}
                                        <div className={`h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold ${
                                            user.avatar ? 'hidden' : ''
                                        }`}>
                                            {getInitials(user.name)}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate text-start">{user.name}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate text-start mb-2">{user.email}</p>
                                        <div className="flex items-center">
                                            {user.roles && user.roles.length > 0 ? (
                                                <BadgeUI className="bg-primary/10 text-primary ring-primary/30 dark:bg-primary/15 dark:text-primary dark:ring-primary/35 capitalize">
                                                    {user.roles[0].label || user.roles[0].name}
                                                </BadgeUI>
                                            ) : (
                                                <BadgeUI className="bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 ring-gray-600/10 dark:ring-gray-600/20 capitalize">
                                                    {t('No role')}
                                                </BadgeUI>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="border-t border-gray-100 dark:border-gray-700" />

                                {/* Bottom: Action icons */}
                                <div className="px-4 py-2.5 flex items-center justify-end">
                                    <div className="flex items-center gap-1">
                                        {hasPermission(permissions, 'view-users') && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="sm" onClick={() => handleAction('view', user)}
                                                        className="h-8 w-8 p-0 text-gray-500">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>{t('View')}</TooltipContent>
                                            </Tooltip>
                                        )}
                                        {hasPermission(permissions, 'edit-users') && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="sm" onClick={() => handleAction('edit', user)}
                                                        className="h-8 w-8 p-0 text-gray-500">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>{t('Edit')}</TooltipContent>
                                            </Tooltip>
                                        )}
                                        {hasPermission(permissions, 'reset-password-users') && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="sm" onClick={() => handleAction('reset-password', user)}
                                                        className="h-8 w-8 p-0 text-gray-500">
                                                        <KeyRound className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>{t('Reset Password')}</TooltipContent>
                                            </Tooltip>
                                        )}
                                        {hasPermission(permissions, 'toggle-status-users') && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="sm" onClick={() => handleAction('toggle-status', user)}
                                                        className="h-8 w-8 p-0 text-gray-500">
                                                        {user.status === 'active' ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>{user.status === 'active' ? t('Disable User') : t('Enable User')}</TooltipContent>
                                            </Tooltip>
                                        )}
                                        {hasPermission(permissions, 'delete-users') && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="sm" onClick={() => handleAction('delete', user)}
                                                        className="h-8 w-8 p-0 text-gray-500">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>{t('Delete')}</TooltipContent>
                                            </Tooltip>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}

                        {(!users?.data || users.data.length === 0) && (
                            <div className="col-span-full text-center py-16">
                                <div className="mx-auto h-20 w-20 text-gray-300 dark:text-gray-600 mb-4">
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('No users found')}</h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-6">{t('Get started by creating your first user')}</p>
                                {hasPermission(permissions, 'create-users') && (
                                    <Button onClick={handleAddNew}><Plus className="h-4 w-4 mr-2" />{t('Add User')}</Button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    <div className="mt-6">
                        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <Pagination
                                from={users?.from || 0}
                                to={users?.to || 0}
                                total={users?.total || 0}
                                links={users?.links}
                                entityName={t('users')}
                                onPageChange={handlePageChange}
                                currentPerPage={pageFilters.per_page?.toString() || "10"}
                                onPerPageChange={(value) => {
                                    const params: any = {
                                        page: 1,
                                        per_page: parseInt(value),
                                    };

                                    if (searchTerm) {
                                        params.search = searchTerm;
                                    }

                                    if (selectedRole !== '_empty_') {
                                        params.role = selectedRole;
                                    }

                                    if (pageFilters.sort_field) {
                                        params.sort_field = pageFilters.sort_field;
                                    }

                                    if (pageFilters.sort_direction) {
                                        params.sort_direction = pageFilters.sort_direction;
                                    }

                                    params.view = activeView;

                                    router.get(route('users.index'), params, { preserveState: true, preserveScroll: true });
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* View Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                {currentItem && <ViewPopup record={currentItem} />}
            </Dialog>

            {/* Form Modal */}
            <CrudFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={handleFormSubmit}
                formConfig={{
                    fields: [
                        { name: 'name', label: t('Name'), type: 'text', required: true, placeholder: t('Enter Name') },
                        { name: 'email', label: t('Email'), type: 'email', required: true, placeholder: t('Enter Email') },
                        {
                            name: 'password',
                            label: t('Password'),
                            type: 'password',
                            required: true,
                            placeholder: t('********'),
                            conditional: (mode) => mode === 'create',
                        },
                        {
                            name: 'password_confirmation',
                            label: t('Confirm Password'),
                            type: 'password',
                            required: true,
                            placeholder: t('********'),
                            conditional: (mode) => mode === 'create',
                        },
                        {
                            name: 'roles',
                            label: t('Role'),
                            type: 'select',
                            options: roles
                                ? roles.map((role: any) => ({
                                      value: role.id.toString(),
                                      label: role.label || role.name,
                                  }))
                                : [],
                            required: true,
                            placeholder: t('Select Role'),
                        },
                    ],
                    modalSize: 'lg',
                }}
                initialData={
                    currentItem
                        ? {
                              ...currentItem,
                              roles: currentItem.roles && currentItem.roles.length > 0 ? currentItem.roles[0].id.toString() : '',
                          }
                        : null
                }
                title={formMode === 'create' ? t('Add New User') : formMode === 'edit' ? t('Edit User') : t('View User')}
                mode={formMode}
            />

            {/* Delete Modal */}
            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={currentItem?.name || ''}
                entityName="user"
            />

            {/* Reset Password Modal */}
            <CrudFormModal
                isOpen={isResetPasswordModalOpen}
                onClose={() => setIsResetPasswordModalOpen(false)}
                onSubmit={handleResetPasswordConfirm}
                formConfig={{
                    fields: [
                        { name: 'password', label: t('New Password'), type: 'password', required: true, placeholder: t('********') },
                        { name: 'password_confirmation', label: t('Confirm Password'), type: 'password', required: true, placeholder: t('********') },
                    ],
                    modalSize: 'sm',
                }}
                initialData={{}}
                title={`Reset Password for ${currentItem?.name || 'User'}`}
                mode="edit"
            />
        </PageTemplate>
    );
}
