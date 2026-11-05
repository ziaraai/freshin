import { CrudTable } from '@/components/CrudTable';
import BadgeUI from '@/components/badge-ui';
import { PageTemplate } from '@/components/page-template';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { planRequestsConfig } from '@/config/crud/plan-requests';
import { router, usePage } from '@inertiajs/react';
import { CheckCircle2, Clock, LayoutGrid, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/custom-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getImageUrl } from '@/utils/image-helper';

export default function PlanRequestsPage() {
    const { t } = useTranslation();
    const { planRequests, filters: pageFilters = {}, auth, globalSettings, statusCounts = {} } = usePage().props as any;
    const permissions = auth?.permissions || [];

    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(pageFilters.status && pageFilters.status !== 'all' ? pageFilters.status : '_empty_');

    const applyFilters = (newSearch = searchTerm, newStatus = selectedStatus) => {
        const params: any = { page: 1 };

        if (newSearch) {
            params.search = newSearch;
        }

        if (newStatus !== '_empty_') {
            params.status = newStatus;
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

        router.get(route('plan-requests.index'), params, { preserveState: true, preserveScroll: true });
    };

    const handleAction = (action: string, item: any) => {
        if (action === 'approve') {
            if (!globalSettings?.is_demo) {
                toast.loading(t('Approving plan request...'));
            }
            router.post(route('plan-requests.approve', item.id), {}, {
                onSuccess: (page) => {
                    if (!globalSettings?.is_demo) {
                        toast.dismiss();
                    }
                    if (page.props.flash.success) {
                        toast.success(t(page.props.flash.success));
                    } else if (page.props.flash.error) {
                        toast.error(t(page.props.flash.error));
                    }
                },
                onError: (errors) => {
                    if (!globalSettings?.is_demo) {
                        toast.dismiss();
                    }
                    if (typeof errors === 'string') {
                        toast.error(t(errors));
                    } else {
                        toast.error(t('Failed to approve plan request: {{errors}}', { errors: Object.values(errors).join(', ') }));
                    }
                }
            });
        } else if (action === 'reject') {
            if (!globalSettings?.is_demo) {
                toast.loading(t('Rejecting plan request...'));
            }
            router.post(route('plan-requests.reject', item.id), {}, {
                onSuccess: (page) => {
                    if (!globalSettings?.is_demo) {
                        toast.dismiss();
                    }
                    if (page.props.flash.success) {
                        toast.success(t(page.props.flash.success));
                    } else if (page.props.flash.error) {
                        toast.error(t(page.props.flash.error));
                    }
                },
                onError: (errors) => {
                    if (!globalSettings?.is_demo) {
                        toast.dismiss();
                    }
                    if (typeof errors === 'string') {
                        toast.error(t(errors));
                    } else {
                        toast.error(t('Failed to reject plan request: {{errors}}', { errors: Object.values(errors).join(', ') }));
                    }
                }
            });
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters(searchTerm, selectedStatus);
    };

    const handleStatusFilter = (value: string) => {
        setSelectedStatus(value);
        applyFilters(searchTerm, value);
    };

    const handleResetFilters = () => {
        setSelectedStatus('_empty_');
        setSearchTerm('');

        const params: any = {
            page: 1,
            per_page: pageFilters.per_page,
        };

        if (pageFilters.sort_field) {
            params.sort_field = pageFilters.sort_field;
        }

        if (pageFilters.sort_direction) {
            params.sort_direction = pageFilters.sort_direction;
        }

        router.get(route('plan-requests.index'), params, { preserveState: true, preserveScroll: true });
    };

    const handlePageChange = (url: string) => {
        const pageNum = new URL(url).searchParams.get('page') || '1';
        const params: any = {
            page: pageNum,
        };

        if (searchTerm) {
            params.search = searchTerm;
        }

        if (selectedStatus !== '_empty_') {
            params.status = selectedStatus;
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

        router.get(route('plan-requests.index'), params, { preserveState: true, preserveScroll: true });
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

        if (pageFilters.per_page) {
            params.per_page = pageFilters.per_page;
        }

        router.get(route('plan-requests.index'), params, { preserveState: true, preserveScroll: true });
    };

    const hasActiveFilters = () => {
        return selectedStatus !== '_empty_' || searchTerm !== '';
    };

    const activeFilterCount = () => {
        return (selectedStatus !== '_empty_' ? 1 : 0) + (searchTerm ? 1 : 0);
    };

    const statusTabs = [
        { value: '_empty_', label: t('All'), icon: <LayoutGrid className="h-4 w-4" />, count: statusCounts.all ?? 0 },
        { value: 'pending', label: t('Pending'), icon: <Clock className="h-4 w-4" />, count: statusCounts.pending ?? 0 },
        { value: 'approved', label: t('Approved'), icon: <CheckCircle2 className="h-4 w-4" />, count: statusCounts.approved ?? 0 },
        { value: 'rejected', label: t('Rejected'), icon: <XCircle className="h-4 w-4" />, count: statusCounts.rejected ?? 0 },
    ];

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Plans'), href: route('plans.index') },
        { title: t('Plan Requests') },
    ];

    const customColumns = planRequestsConfig.table.columns
        .map(col => {
            if (col.key === 'user.name') {
                return {
                    ...col,
                    label: t('Company'),
                    render: (_, row) => {
                        return (
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={row.user?.avatar} />
                                    <AvatarFallback><img src={getImageUrl('/storage/media/avatars/avatar.png')} alt={row.user?.name} className="object-cover rounded-full" /></AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-medium">{row.user?.name || '-'}</div>
                                    <div className="text-xs text-gray-500">{row.user?.email || ''}</div>
                                </div>
                            </div>
                        );
                    }
                };
            } else if (col.key === 'plan.name') {
                return {
                    ...col,
                    label: t(col.label),
                    render: (_, row) => {
                        const planName = row.plan?.name;
                        if (!planName) return '-';
                        return (
                            <BadgeUI className="bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/15 dark:text-blue-400 dark:ring-blue-500/35 capitalize">
                                {planName}
                            </BadgeUI>
                        );
                    }
                };
            } else if (col.key === 'status') {
                return {
                    ...col,
                    label: t(col.label),
                    render: (value) => {
                        const statusColors: Record<string, string> = {
                            pending: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20 dark:bg-yellow-500/15 dark:text-yellow-400 dark:ring-yellow-500/35',
                            approved: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/15 dark:text-green-400 dark:ring-green-500/35',
                            rejected: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/15 dark:text-red-400 dark:ring-red-500/35'
                        };
                        return (
                            <BadgeUI className={`capitalize ${statusColors[value] || 'bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-gray-900/10 dark:text-gray-400 dark:ring-gray-400/20'}`}>
                                {t(value)}
                            </BadgeUI>
                        );
                    }
                };
            } else {
                return {
                    ...col,
                    label: t(col.label)
                };
            }
        });

    return (
        <PageTemplate title={t('Plan Requests')} description={("View and manage all plan requests from companies.")} url="/plan-requests" breadcrumbs={breadcrumbs} noPadding>
            {/* Search and filters section */}
            <div className="mb-4 rounded-lg border bg-white shadow dark:bg-gray-900">
                <SearchAndFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onSearch={handleSearch}
                    searchPlaceholder={t('Search plan requests...')}
                    statusTabs={statusTabs}
                    activeStatusTab={selectedStatus}
                    onStatusTabChange={handleStatusFilter}
                    filters={[]}
                    hasActiveFilters={hasActiveFilters}
                    activeFilterCount={activeFilterCount}
                    onResetFilters={handleResetFilters}
                />
            </div>

            <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
                <CrudTable
                    columns={customColumns}
                    actions={(auth?.user?.type === 'superadmin' || auth?.user?.type === 'super admin')
                        ? (planRequestsConfig.table.actions?.map((action) => ({
                              ...action,
                              label: t(action.label),
                          })) || [])
                        : []}
                    data={planRequests?.data || []}
                    from={planRequests?.from || 1}
                    onAction={handleAction}
                    permissions={permissions}
                    entityPermissions={planRequestsConfig.entity.permissions}
                    onSort={handleSort}
                    sortField={pageFilters.sort_field}
                    sortDirection={pageFilters.sort_direction}
                />

                {/* Pagination section */}
                <Pagination
                    from={planRequests?.from || 0}
                    to={planRequests?.to || 0}
                    total={planRequests?.total || 0}
                    links={planRequests?.links}
                    entityName={t('plan requests')}
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

                        if (pageFilters.sort_field) {
                            params.sort_field = pageFilters.sort_field;
                        }

                        if (pageFilters.sort_direction) {
                            params.sort_direction = pageFilters.sort_direction;
                        }

                        router.get(route('plan-requests.index'), params, { preserveState: true, preserveScroll: true });
                    }}
                    onPageChange={handlePageChange}
                />
            </div>
        </PageTemplate>
    );
}
