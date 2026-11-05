// pages/companies/index.tsx
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudTable } from '@/components/CrudTable';
import { toast } from '@/components/custom-toast';
import { PageTemplate } from '@/components/page-template';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { UpgradePlanModal } from '@/components/UpgradePlanModal';
import BadgeUI from '@/components/badge-ui';
import RandomBadgeUI from '@/components/random-badge-ui';
import { useInitials } from '@/hooks/use-initials';
import { router, usePage } from '@inertiajs/react';
import { ArrowUpRight, CheckCircle2, CreditCard, Edit, History, Info, KeyRound, LayoutGrid, Lock, Plus, Trash2, Unlock, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getImageUrl } from '@/utils/image-helper';
import { Dialog } from '@/components/ui/dialog';
import ViewPopup from './view';

export default function Companies() {
    const { t } = useTranslation();
    const { auth, companies, plans, filters: pageFilters = {}, globalSettings, statusCounts = {} } = usePage().props as any;
    const permissions = auth?.permissions || [];
    const getInitials = useInitials();

    // State
    const [activeView, setActiveView] = useState(() => {
        return pageFilters.view || 'list';
    });
    const handleViewChange = (view: string) => {
        setActiveView(view);
        document.cookie = `companies_view=${view}; path=/; max-age=31536000`; // 1 year
        
        const params: any = {
            page: 1,
            view: view,
            per_page: view === 'grid' ? 12 : 10
        };

        if (searchTerm) {
            params.search = searchTerm;
        }

        if (selectedStatus !== '_empty_') {
            params.status = selectedStatus;
        }

        if (startDate) {
            params.start_date = startDate instanceof Date ? startDate.toISOString().split('T')[0] : startDate;
        }

        if (endDate) {
            params.end_date = endDate instanceof Date ? endDate.toISOString().split('T')[0] : endDate;
        }

        if (pageFilters.sort_field) {
            params.sort_field = pageFilters.sort_field;
        }

        if (pageFilters.sort_direction) {
            params.sort_direction = pageFilters.sort_direction;
        }

        router.get(route('companies.index'), params, { preserveState: true, preserveScroll: true });
    };
    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [startDate, setStartDate] = useState<Date | undefined>(pageFilters.start_date ? new Date(pageFilters.start_date) : undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(pageFilters.end_date ? new Date(pageFilters.end_date) : undefined);
    const [selectedStatus, setSelectedStatus] = useState(pageFilters.status && pageFilters.status !== 'all' ? pageFilters.status : '_empty_');
    const [showFilters, setShowFilters] = useState(false);

    // Modal state
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
    const [isUpgradePlanModalOpen, setIsUpgradePlanModalOpen] = useState(false);
    const [currentCompany, setCurrentCompany] = useState<any>(null);
    const [availablePlans, setAvailablePlans] = useState<any[]>([]);
    const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');

    // Check if any filters are active
    const hasActiveFilters = () => {
        return selectedStatus !== '_empty_' || searchTerm !== '' || startDate !== undefined || endDate !== undefined;
    };

    // Count active filters
    const activeFilterCount = () => {
        return (selectedStatus !== '_empty_' ? 1 : 0) + (searchTerm ? 1 : 0) + (startDate ? 1 : 0) + (endDate ? 1 : 0);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters(searchTerm, selectedStatus, startDate, endDate);
    };

    const applyFilters = (newSearch = searchTerm, newStatus = selectedStatus, newStart = startDate, newEnd = endDate) => {
        const params: any = { page: 1 };

        if (newSearch) {
            params.search = newSearch;
        }

        if (newStatus !== '_empty_') {
            params.status = newStatus;
        }

        if (newStart) {
            params.start_date = newStart instanceof Date ? newStart.toISOString().split('T')[0] : newStart;
        }

        if (newEnd) {
            params.end_date = newEnd instanceof Date ? newEnd.toISOString().split('T')[0] : newEnd;
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

        router.get(route('companies.index'), params, { preserveState: true, preserveScroll: true });
    };

    const handleStatusFilter = (value: string) => {
        setSelectedStatus(value);
        applyFilters(searchTerm, value, startDate, endDate);
    };

    const handleStartDateChange = (date: Date | undefined) => {
        setStartDate(date);
        applyFilters(searchTerm, selectedStatus, date, endDate);
    };

    const handleEndDateChange = (date: Date | undefined) => {
        setEndDate(date);
        applyFilters(searchTerm, selectedStatus, startDate, date);
    };

    const handleSort = (field: string) => {
        const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';

        const params: any = {
            sort_field: field,
            sort_direction: direction,
            page: 1,
        };

        if (searchTerm) {
            params.search = searchTerm;
        }

        if (selectedStatus !== '_empty_') {
            params.status = selectedStatus;
        }

        if (startDate) {
            params.start_date = startDate instanceof Date ? startDate.toISOString().split('T')[0] : startDate;
        }

        if (endDate) {
            params.end_date = endDate instanceof Date ? endDate.toISOString().split('T')[0] : endDate;
        }

        if (pageFilters.per_page) {
            params.per_page = pageFilters.per_page;
        }

        params.view = activeView;

        router.get(route('companies.index'), params, { preserveState: true, preserveScroll: true });
    };

    const handleAction = (action: string, company: any) => {
        setCurrentCompany(company);

        switch (action) {
            case 'login-as':
                router.get(route('impersonate.start', company.id));
                break;
            case 'company-info':
                setIsViewModalOpen(true);
                break;
            case 'upgrade-plan':
                handleUpgradePlan(company);
                break;

            case 'reset-password':
                setIsResetPasswordModalOpen(true);
                break;
            case 'toggle-status':
                handleToggleStatus(company);
                break;
            case 'edit':
                setFormMode('edit');
                setIsFormModalOpen(true);
                break;
            case 'delete':
                setIsDeleteModalOpen(true);
                break;
            default:
                break;
        }
    };

    const handleAddNew = () => {
        setCurrentCompany(null);
        setFormMode('create');
        setIsFormModalOpen(true);
    };

    const handleFormSubmit = (formData: any) => {
        if (formMode === 'create') {
            router.post(route('companies.store'), formData, {
                onSuccess: (page) => {
                    setIsFormModalOpen(false);
                    // Don't show success toast - let backend handle the message
                    if (page.props.flash?.success) {
                        toast.success(t(page.props.flash.success));
                    } else if(page.props.flash?.error){
                        toast.error(t(page.props.flash.error));
                    }
                },
                onError: (errors) => {
                    toast.error(`Failed to create company: ${Object.values(errors).join(', ')}`);
                },
            });
        } else if (formMode === 'edit') {
            router.put(route('companies.update', currentCompany.id), formData, {
                onSuccess: (page) => {
                    setIsFormModalOpen(false);
                    // Don't show success toast - let backend handle the message
                    if (page.props.flash?.success) {
                        toast.success(t(page.props.flash.success));
                    } else if(page.props.flash?.error){
                        toast.error(t(page.props.flash.error));
                    }
                },
                onError: (errors) => {
                    toast.error(`Failed to update company: ${Object.values(errors).join(', ')}`);
                },
            });
        }
    };

    const handleDeleteConfirm = () => {
        router.delete(route('companies.destroy', currentCompany.id), {
            onSuccess: (page) => {
                setIsDeleteModalOpen(false);
                if (page.props.flash?.success) {
                    toast.success(t(page.props.flash.success));
                } else if (page.props.flash?.error) {
                    toast.error(t(page.props.flash.error));
                }
            },
            onError: (errors) => {
                toast.error(`Failed to delete company: ${Object.values(errors).join(', ')}`);
            },
        });
    };

    const handleResetPasswordConfirm = (data: { password: string }) => {
        router.put(route('companies.reset-password', currentCompany.id), data, {
            onSuccess: (page) => {
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

    const handleToggleStatus = (company: any) => {
        router.put(
            route('companies.toggle-status', company.id),
            {},
            {
                onSuccess: (page) => {
                    if (page.props.flash?.success) {
                        toast.success(t(page.props.flash.success));
                    } else if (page.props.flash?.error) {
                        toast.error(t(page.props.flash.error));
                    }
                },
                onError: (errors) => {
                    toast.error(`Failed to update status: ${Object.values(errors).join(', ')}`);
                },
            },
        );
    };

    const handleResetFilters = () => {
        setSelectedStatus('_empty_');
        setSearchTerm('');
        setStartDate(undefined);
        setEndDate(undefined);
        setShowFilters(false);

        router.get(
            route('companies.index'),
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

        if (selectedStatus !== '_empty_') {
            params.status = selectedStatus;
        }

        if (startDate) {
            params.start_date = startDate instanceof Date ? startDate.toISOString().split('T')[0] : startDate;
        }

        if (endDate) {
            params.end_date = endDate instanceof Date ? endDate.toISOString().split('T')[0] : endDate;
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

        router.get(route('companies.index'), params, { preserveState: true, preserveScroll: true });
    };

    const handleUpgradePlan = (company: any) => {
        setCurrentCompany(company);

        // Fetch available plans
        if (!globalSettings?.is_demo) {
            toast.loading(t('Loading plans...'));
        }

        fetch(route('companies.plans', company.id))
            .then((res) => res.json())
            .then((data) => {
                setAvailablePlans(data.plans);
                setIsUpgradePlanModalOpen(true);
                if (!globalSettings?.is_demo) {
                    toast.dismiss();
                }
            })
            .catch((err) => {
                if (!globalSettings?.is_demo) {
                    toast.dismiss();
                }
                toast.error(t('Failed to load plans'));
            });
    };

    const handleUpgradePlanConfirm = (planId: number, duration: string) => {
        if (!globalSettings?.is_demo) {
            toast.loading(t('Upgrading plan...'));
        }
        // Use Inertia router to handle the request
        router.put(
            route('companies.upgrade-plan', currentCompany.id),
            {
                plan_id: planId,
                duration: duration,
            },
            {
                onSuccess: (page) => {
                    setIsUpgradePlanModalOpen(false);
                    if (!globalSettings?.is_demo) {
                        toast.dismiss();
                    }
                    if (page.props.flash?.success) {
                        toast.success(t(page.props.flash.success));
                    } else {
                        toast.success(t('Plan upgraded successfully'));
                    }
                },
                onError: (errors) => {
                    if (!globalSettings?.is_demo) {
                        toast.dismiss();
                    }
                    if (typeof errors === 'string') {
                        toast.error(t(errors));
                    } else if (errors && Object.keys(errors).length > 0) {
                        const firstErrorKey = Object.keys(errors)[0];
                        toast.error(t(errors[firstErrorKey]));
                    } else {
                        toast.error(t('Failed to upgrade plan'));
                    }
                },
            },
        );
    };

    const statusTabs = [
        { value: '_empty_', label: t('All'), icon: <LayoutGrid className="h-4 w-4" />, count: statusCounts.all ?? 0 },
        { value: 'active', label: t('Active'), icon: <CheckCircle2 className="h-4 w-4" />, count: statusCounts.active ?? 0 },
        { value: 'inactive', label: t('Inactive'), icon: <XCircle className="h-4 w-4" />, count: statusCounts.inactive ?? 0 },
    ];

    // Define page actions
    const pageActions = [
        ...(permissions.includes('manage-login-history') || auth?.user?.type === 'superadmin' ? [{
            icon: <History className="h-4 w-4 mx-auto" />,
            variant: 'outline',
            tooltip: t('Login History'),
            onClick: () => router.get(route('users.all-logs'))
        }] : []),
        {
            label: 'Add Company',
            icon: <Plus className="h-4 w-4" />,
            variant: 'default',
            onClick: () => handleAddNew(),
        },
    ];

    const breadcrumbs = [{ title: t('Dashboard'), href: route('dashboard') }, { title: t('Companies') }];

    // Define table columns for list view
    const columns = [
        {
            key: 'name',
            label: t('Name'),
            sortable: true,
            render: (value: any, row: any) => {
                return (
                    <div className="flex items-center gap-3">
                        {row.avatar ? (
                            <img src={row.avatar} alt={row.name} className="h-10 w-10 rounded-full object-cover" onError={(e) => {
                            (e.target as HTMLImageElement).src = getImageUrl('/storage/media/avatars/avatar.png');
                          }} />
                        ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full text-white">
                                <img src={getImageUrl('/storage/media/avatars/avatar.png')} alt={row.name} className="h-10 w-10 rounded-full object-cover" onError={(e) => {
                            (e.target as HTMLImageElement).src = getImageUrl('/storage/media/avatars/avatar.png');
                          }} />
                            </div>
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
            key: 'plan_name',
            label: t('Plan'),
            render: (value: string) => <RandomBadgeUI name={value} className="capitalize" />,
        },
        {
            key: 'status',
            label: t('Status'),
            render: (value: string) => (
                <BadgeUI
                    className={
                        value === 'active'
                            ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/15 dark:text-green-400 dark:ring-green-500/35'
                            : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/15 dark:text-red-400 dark:ring-red-500/35'
                    }
                >
                    {value === 'active' ? t('Active') : t('Inactive')}
                </BadgeUI>
            ),
        },
        {
            key: 'created_at',
            label: t('Created At'),
            sortable: true,
            type: 'date',
            // render: (value: string) => window.appSettings?.formatDateTime(value, false) || new Date(value).toLocaleDateString(),
        },
    ];

    // Define table actions
    const actions = [
        {
            label: t('Login as Company'),
            icon: 'ArrowUpRight',
            action: 'login-as',
            className: 'text-blue-500 hover:text-blue-700',
        },
        {
            label: t('Company Info'),
            icon: 'Info',
            action: 'company-info',
            className: 'text-blue-500 hover:text-blue-700',
        },
        {
            label: t('Upgrade Plan'),
            icon: 'CreditCard',
            action: 'upgrade-plan',
            className: 'text-amber-500 hover:text-amber-700',
        },
        {
            label: t('Reset Password'),
            icon: 'KeyRound',
            action: 'reset-password',
            className: 'text-blue-500 hover:text-blue-700',
        },
        {
            label: t('Toggle Status'),
            icon: (row: any) => (row.status === 'active' ? 'Lock' : 'Unlock'),
            action: 'toggle-status',
            className: 'text-amber-500 hover:text-amber-700',
        },
        {
            label: t('Edit'),
            icon: 'Edit',
            action: 'edit',
            className: 'text-amber-500 hover:text-amber-700',
        },
        {
            label: t('Delete'),
            icon: 'Trash2',
            action: 'delete',
            className: 'text-red-500 hover:text-red-700',
        },
    ];

    return (
        <PageTemplate title={t('Companies')} url="/companies" actions={pageActions} breadcrumbs={breadcrumbs} noPadding description={t('Manage your companies.')}>
            {/* Search and filters section */}
            <div className="mb-4 rounded-lg border bg-white shadow dark:bg-gray-900">
                <SearchAndFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onSearch={handleSearch}
                    searchPlaceholder={t('Search companies...')}
                    statusTabs={statusTabs}
                    activeStatusTab={selectedStatus}
                    onStatusTabChange={handleStatusFilter}
                    filters={[
                        {
                            name: 'start_date',
                            label: t('Start Date'),
                            type: 'date',
                            value: startDate,
                            onChange: handleStartDateChange,
                        },
                        {
                            name: 'end_date',
                            label: t('End Date'),
                            type: 'date',
                            value: endDate,
                            onChange: handleEndDateChange,
                        },
                    ]}
                    hasActiveFilters={hasActiveFilters}
                    activeFilterCount={activeFilterCount}
                    onResetFilters={handleResetFilters}
                    showViewToggle={true}
                    activeView={activeView}
                    onViewChange={handleViewChange}
                />
            </div>

            {/* Content section */}
            {activeView === 'list' ? (
                <div className="overflow-hidden rounded-lg bg-white shadow">
                    <CrudTable
                        columns={columns}
                        actions={actions}
                        data={companies?.data || []}
                        from={companies?.from || 1}
                        onAction={handleAction}
                        sortField={pageFilters.sort_field}
                        sortDirection={pageFilters.sort_direction}
                        onSort={handleSort}
                        permissions={permissions}
                    />

                    {/* Pagination section */}
                    <Pagination
                        from={companies?.from || 0}
                        to={companies?.to || 0}
                        total={companies?.total || 0}
                        links={companies?.links}
                        entityName={t('companies')}
                        currentPerPage={pageFilters.per_page?.toString() || '10'}
                        onPerPageChange={(value) => {
                            const params: any = {
                                page: 1,
                                per_page: parseInt(value),
                            };

                            if (searchTerm) {
                                params.search = searchTerm;
                            }

                            if (selectedStatus !== '_empty_') {
                                params.status = selectedStatus;
                            }

                            if (startDate) {
                                params.start_date = startDate instanceof Date ? startDate.toISOString().split('T')[0] : startDate;
                            }

                            if (endDate) {
                                params.end_date = endDate instanceof Date ? endDate.toISOString().split('T')[0] : endDate;
                            }

                            if (pageFilters.sort_field) {
                                params.sort_field = pageFilters.sort_field;
                            }

                            if (pageFilters.sort_direction) {
                                params.sort_direction = pageFilters.sort_direction;
                            }

                            params.view = activeView;

                            router.get(route('companies.index'), params, { preserveState: true, preserveScroll: true });
                        }}
                        onPageChange={handlePageChange}
                    />
                </div>
            ) : (
                <div>
                    {/* Grid View */}
                    <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {companies?.data?.map((company: any) => (
                            <Card
                                key={company.id}
                                className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm transition-all duration-300 hover:shadow-lg dark:border-gray-700 dark:bg-gray-900"
                            >
                                <div>
                                    {/* Card Header with border */}
                                    <CardHeader className="border-b border-gray-200 p-4 dark:border-gray-700 sm:p-5">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                                                <div className="relative shrink-0">
                                                    {company.avatar ? (
                                                        <img
                                                            src={company.avatar || getImageUrl('/storage/media/avatars/avatar.png')}
                                                            alt={company.name}
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = getImageUrl('/storage/media/avatars/avatar.png');
                                                            }}
                                                            className="h-12 w-12 rounded-full border border-gray-200 object-cover shadow-sm dark:border-gray-700"
                                                        />
                                                    ) : (
                                                        <img
                                                            src={company.avatar || getImageUrl('/storage/media/avatars/avatar.png')}
                                                            alt={company.name}
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = getImageUrl('/storage/media/avatars/avatar.png');
                                                            }}
                                                            className="h-12 w-12 rounded-full border border-gray-200 object-cover shadow-sm dark:border-gray-700"
                                                        />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="truncate text-base font-bold text-gray-900 dark:text-white">{company.name}</h3>
                                                    <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{company.email}</p>
                                                </div>
                                            </div>
                                            {/* Status Badge */}
                                            <BadgeUI
                                                className={
                                                    'shrink-0 ' +
                                                    (company.status === 'active'
                                                        ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/15 dark:text-green-400 dark:ring-green-500/35'
                                                        : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/15 dark:text-red-400 dark:ring-red-500/35')
                                                }
                                            >
                                                {company.status === 'active' ? t('Active') : t('Inactive')}
                                            </BadgeUI>
                                        </div>
                                    </CardHeader>

                                    {/* Card Content containing Plan section */}
                                    <CardContent className="p-4 sm:p-5">
                                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700/60 dark:bg-gray-800/40 sm:p-4">
                                            <div className="mb-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                                                <div className="flex min-w-0 items-center overflow-hidden gap-2">
                                                    <CreditCard className="text-primary h-4 w-4 shrink-0" />
                                                    <span className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                                                        {company.plan_name}
                                                    </span>
                                                    {company.plan_duration && (
                                                        <BadgeUI
                                                            className="shrink-0 bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/15 dark:text-blue-400 dark:ring-blue-500/35 capitalize"
                                                        >
                                                            {company.plan_duration === 'yearly' ? t('Yearly') : t('Monthly')}
                                                        </BadgeUI>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleAction('upgrade-plan', company)}
                                                    className="text-primary hover:text-primary hover:bg-primary/10 h-6 shrink-0 rounded-md px-2.5 text-xs font-semibold"
                                                >
                                                    {t('Upgrade')}
                                                </Button>
                                            </div>

                                            {company.plan_expiry_date && (
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                    <span className="font-medium text-gray-400">{t('Expires')}:</span>
                                                    <span>
                                                        {window.appSettings?.formatDateTime(company.plan_expiry_date, false) ||
                                                            new Date(company.plan_expiry_date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </div>

                                {/* Card Footer with border */}
                                <CardFooter className="flex items-center justify-between border-t border-gray-200 bg-gray-50/50 px-4 py-3 dark:border-gray-700 dark:bg-gray-950/20 sm:px-5 sm:py-3">
                                    <div className="flex space-x-1">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleAction('login-as', company)}
                                                    className="hover:text-primary h-8 w-8 rounded-lg p-0 text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                                                >
                                                    <ArrowUpRight className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>{t('Login as Company')}</TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleAction('company-info', company)}
                                                    className="hover:text-primary h-8 w-8 rounded-lg p-0 text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                                                >
                                                    <Info className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>{t('Company Info')}</TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleAction('edit', company)}
                                                    className="hover:text-primary h-8 w-8 rounded-lg p-0 text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>{t('Edit')}</TooltipContent>
                                        </Tooltip>
                                    </div>

                                    {/* More Actions Dropdown */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 rounded-lg p-0 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="16"
                                                    height="16"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <circle cx="12" cy="12" r="1"></circle>
                                                    <circle cx="12" cy="5" r="1"></circle>
                                                    <circle cx="12" cy="19" r="1"></circle>
                                                </svg>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="z-50 w-48" sideOffset={5}>
                                            <DropdownMenuItem onClick={() => handleAction('reset-password', company)}>
                                                <KeyRound className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                                                <span>{t('Reset Password')}</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleAction('toggle-status', company)}>
                                                {company.status === 'active' ? (
                                                    <Lock className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                                                ) : (
                                                    <Unlock className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                                                )}
                                                <span>{company.status === 'active' ? t('Disable Login') : t('Enable Login')}</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => handleAction('delete', company)}
                                                className="text-red-600 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950/20"
                                            >
                                                <Trash2 className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                                                <span>{t('Delete')}</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </CardFooter>
                            </Card>
                        ))}

                        {(!companies?.data || companies.data.length === 0) && (
                            <div className="col-span-full p-6 text-center text-gray-500 sm:p-8">{t('No companies found')}</div>
                        )}
                    </div>

                    {/* Pagination for grid view */}
                    <div className="mt-6 overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
                        <Pagination
                            from={companies?.from || 0}
                            to={companies?.to || 0}
                            total={companies?.total || 0}
                            links={companies?.links}
                            entityName={t('companies')}
                            currentPerPage={pageFilters.per_page?.toString() || '12'}
                            perPageOptions={[12, 24, 48, 96]}
                            onPerPageChange={(value) => {
                                const params: any = {
                                    page: 1,
                                    per_page: parseInt(value),
                                };

                                if (searchTerm) {
                                    params.search = searchTerm;
                                }

                                if (selectedStatus !== '_empty_') {
                                    params.status = selectedStatus;
                                }

                                if (startDate) {
                                    params.start_date = startDate instanceof Date ? startDate.toISOString().split('T')[0] : startDate;
                                }

                                if (endDate) {
                                    params.end_date = endDate instanceof Date ? endDate.toISOString().split('T')[0] : endDate;
                                }

                                if (pageFilters.sort_field) {
                                    params.sort_field = pageFilters.sort_field;
                                }

                                if (pageFilters.sort_direction) {
                                    params.sort_direction = pageFilters.sort_direction;
                                }

                                params.view = activeView;

                                router.get(route('companies.index'), params, { preserveState: true, preserveScroll: true });
                            }}
                            onPageChange={handlePageChange}
                        />
                    </div>
                </div>
            )}

            {/* View Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                {currentCompany && <ViewPopup record={currentCompany} />}
            </Dialog>

            {/* Form Modal */}
            <CrudFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={(data) => {
                    // If login_enabled is false, remove password field
                    if (data.login_enabled === false) {
                        delete data.password;
                    }
                    // Set status based on login_enabled
                    data.status = data.login_enabled ? 'active' : 'inactive';

                    // Remove login_enabled field as it's not needed in the backend
                    delete data.login_enabled;
                    handleFormSubmit(data);
                }}
                formConfig={{
                    fields: [
                        { name: 'name', label: t('Company Name'), type: 'text', required: true, placeholder: t('e.g. Company') },
                        { name: 'email', label: t('Email'), type: 'email', required: true, placeholder: t('e.g. company@example.com') },
                        {
                            name: 'login_enabled',
                            label: t('Enable Login'),
                            placeholder: '', // Empty placeholder to prevent duplicate label
                            type: 'switch',
                            defaultValue: true,
                            conditional: (mode, data) => {
                                return mode !== 'edit';
                            },
                        },
                        {
                            name: 'password',
                            label: t('Password'),
                            type: 'password',
                            required: true,
                            placeholder: '********',
                            conditional: (mode, data) => {
                                // edit mode i want to hide password input
                                if (mode === 'edit') {
                                    return false;
                                }
                                return data?.login_enabled === true;
                            },
                        },
                    ],
                    modalSize: 'lg',
                }}
                initialData={{
                    ...currentCompany,
                    login_enabled: currentCompany?.status === 'active',
                }}
                title={formMode === 'create' ? t('Add New Company') : formMode === 'edit' ? t('Edit Company') : t('View Company')}
                mode={formMode}
            />

            {/* Delete Modal */}
            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={currentCompany?.name || ''}
                entityName="company"
            />

            {/* Reset Password Modal */}
            <CrudFormModal
                isOpen={isResetPasswordModalOpen}
                onClose={() => setIsResetPasswordModalOpen(false)}
                onSubmit={handleResetPasswordConfirm}
                formConfig={{
                    fields: [{ name: 'password', label: t('New Password'), type: 'password', required: true, placeholder: '********' }],
                    modalSize: 'sm',
                }}
                initialData={{}}
                title={`Reset Password for ${currentCompany?.name || 'Company'}`}
                mode="edit"
            />

            {/* Upgrade Plan Modal */}
            <UpgradePlanModal
                isOpen={isUpgradePlanModalOpen}
                onClose={() => setIsUpgradePlanModalOpen(false)}
                onConfirm={handleUpgradePlanConfirm}
                plans={availablePlans}
                currentPlanId={currentCompany?.plan_id}
                companyCurrentPlanDuration={currentCompany?.plan_duration}
                companyName={currentCompany?.name || ''}
            />
        </PageTemplate>
    );
}
