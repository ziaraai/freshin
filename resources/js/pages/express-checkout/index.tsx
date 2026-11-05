import React, { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { CrudTable } from '@/components/CrudTable';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Pagination } from '@/components/ui/pagination';
import BadgeUI from '@/components/badge-ui';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/custom-toast';
import {
  Plus,
  Zap,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  TrendingUp,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  Settings,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import { formatCurrency } from '@/utils/currency-helper';
import { hasPermission, checkPermission } from '@/utils/permissions';
import { TableColumn, TableAction } from '@/types/crud';
import RandomBadgeUI from '@/components/random-badge-ui';

export default function ExpressCheckout() {
  const { t } = useTranslation();
  const {
    checkouts,
    stats = {},
    auth,
    filters: pageFilters = {},
    statusCounts = {},
  } = usePage().props as any;
  const permissions = auth?.permissions || [];

  // Filter & Search states from server filters
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [selectedStatus, setSelectedStatus] = useState(
    pageFilters.status && pageFilters.status !== 'all' ? pageFilters.status : '_empty_'
  );
  const [selectedType, setSelectedType] = useState(pageFilters.type || '_empty_');

  // Modal states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [selectedCheckout, setSelectedCheckout] = useState<any>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Normalize checkouts paginated object or array
  const checkoutsData = Array.isArray(checkouts) ? checkouts : checkouts?.data || [];
  const checkoutsTotal = Array.isArray(checkouts) ? checkouts.length : checkouts?.total || 0;
  const checkoutsFrom = Array.isArray(checkouts) ? (checkouts.length > 0 ? 1 : 0) : checkouts?.from || 0;
  const checkoutsTo = Array.isArray(checkouts) ? checkouts.length : checkouts?.to || 0;
  const checkoutsLinks = Array.isArray(checkouts) ? [] : checkouts?.links || [];

  // Check if any filters are active
  const hasActiveFilters = () => {
    return selectedStatus !== '_empty_' || searchTerm !== '' || selectedType !== '_empty_';
  };

  // Count active filters
  const activeFilterCount = () => {
    return (
      (selectedStatus !== '_empty_' ? 1 : 0) +
      (searchTerm ? 1 : 0) +
      (selectedType !== '_empty_' ? 1 : 0)
    );
  };

  const applyFilters = (
    newSearch = searchTerm,
    newStatus = selectedStatus,
    newType = selectedType
  ) => {
    const params: any = { page: 1 };

    if (newSearch) params.search = newSearch;
    if (newStatus !== '_empty_') params.status = newStatus;
    if (newType !== '_empty_') params.type = newType;

    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    if (pageFilters.sort_field) params.sort_field = pageFilters.sort_field;
    if (pageFilters.sort_direction) params.sort_direction = pageFilters.sort_direction;

    router.get(route('express-checkout.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(searchTerm, selectedStatus, selectedType);
  };

  const handleStatusFilter = (value: string) => {
    setSelectedStatus(value);
    applyFilters(searchTerm, value, selectedType);
  };

  const handleSort = (field: string) => {
    const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';

    const params: any = {
      sort_field: field,
      sort_direction: direction,
      page: 1,
    };

    if (searchTerm) params.search = searchTerm;
    if (selectedStatus !== '_empty_') params.status = selectedStatus;
    if (selectedType !== '_empty_') params.type = selectedType;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;

    router.get(route('express-checkout.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleResetFilters = () => {
    setSelectedStatus('_empty_');
    setSelectedType('_empty_');
    setSearchTerm('');

    router.get(
      route('express-checkout.index'),
      {
        page: 1,
        per_page: pageFilters.per_page,
      },
      { preserveState: true, preserveScroll: true }
    );
  };

  const handlePageChange = (url: string) => {
    const pageNum = new URL(url, window.location.origin).searchParams.get('page') || '1';
    const params: any = {
      page: pageNum,
    };

    if (searchTerm) params.search = searchTerm;
    if (selectedStatus !== '_empty_') params.status = selectedStatus;
    if (selectedType !== '_empty_') params.type = selectedType;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    if (pageFilters.sort_field) params.sort_field = pageFilters.sort_field;
    if (pageFilters.sort_direction) params.sort_direction = pageFilters.sort_direction;

    router.get(route('express-checkout.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handlePerPageChange = (value: string) => {
    const params: any = {
      page: 1,
      per_page: parseInt(value),
    };

    if (searchTerm) params.search = searchTerm;
    if (selectedStatus !== '_empty_') params.status = selectedStatus;
    if (selectedType !== '_empty_') params.type = selectedType;
    if (pageFilters.sort_field) params.sort_field = pageFilters.sort_field;
    if (pageFilters.sort_direction) params.sort_direction = pageFilters.sort_direction;

    router.get(route('express-checkout.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleActionClick = (action: string, permission: string, checkout?: any) => {
    if (!checkPermission(permission, auth)) {
      return;
    }

    switch (action) {
      case 'view':
        router.visit(route('express-checkout.show', checkout.id));
        break;
      case 'edit':
        router.visit(route('express-checkout.edit', checkout.id));
        break;
      case 'delete':
        setSelectedCheckout(checkout);
        setIsDeleteDialogOpen(true);
        break;
      case 'settings':
        setSelectedCheckout(checkout);
        setIsSettingsDialogOpen(true);
        break;
      case 'create':
        router.visit(route('express-checkout.create'));
        break;
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedCheckout && checkPermission('delete-express-checkout', auth)) {
      router.delete(route('express-checkout.destroy', selectedCheckout.id), {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setSelectedCheckout(null);
          toast.success(t('Express checkout deleted successfully'));
        },
        onError: () => {
          toast.error(t('Failed to delete express checkout'));
        },
      });
    }
  };

  const handleToggleStatus = (checkoutId: number, currentStatus: boolean) => {
    if (!checkPermission('edit-express-checkout', auth)) {
      toast.error(t('You do not have permission to edit express checkouts'));
      return;
    }

    setTogglingId(checkoutId);
    toast.loading(t('Updating status...'));

    router.put(
      route('express-checkout.update', checkoutId),
      {
        is_active: !currentStatus,
      },
      {
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => {
          toast.dismiss();
          toast.success(t('Express checkout status updated successfully'));
        },
        onError: () => {
          toast.dismiss();
          toast.error(t('Failed to update express checkout status'));
        },
        onFinish: () => {
          setTogglingId(null);
        },
      }
    );
  };

  // Status tabs: All, Active, Inactive
  const statusTabs = [
    {
      value: '_empty_',
      label: t('All'),
      icon: <LayoutGrid className="h-4 w-4" />,
      count: statusCounts.all ?? stats.total ?? checkoutsTotal ?? 0,
    },
    {
      value: 'active',
      label: t('Active'),
      icon: <CheckCircle2 className="h-4 w-4" />,
      count: statusCounts.active ?? stats.active ?? 0,
    },
    {
      value: 'inactive',
      label: t('Inactive'),
      icon: <XCircle className="h-4 w-4" />,
      count:
        statusCounts.inactive ??
        (stats.total && stats.active !== undefined ? Math.max(0, stats.total - stats.active) : 0),
    },
  ];

  // Type filter options
  const typeFilterOptions = [
    { value: '_empty_', label: t('All Types') },
    { value: 'buy_now', label: t('Buy Now') },
    { value: 'express_cart', label: t('Express Cart') },
    { value: 'guest_checkout', label: t('Guest Checkout') },
    { value: 'mobile_optimized', label: t('Mobile Optimized') },
  ];

  const pageActions = [
    ...(hasPermission('create-express-checkout')
      ? [
          {
            label: t('Create Checkout'),
            icon: <Plus className="h-4 w-4" />,
            variant: 'default' as const,
            onClick: () => handleActionClick('create', 'create-express-checkout'),
          },
        ]
      : []),
  ];

  // CrudTable Columns Definition
  const columns: TableColumn[] = [
    {
      key: 'name',
      label: t('Checkout Name'),
      sortable: true,
      render: (value: string, row: any) => {
        const canView = hasPermission('view-express-checkout');
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Zap className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              {canView ? (
                <a
                  href={route('express-checkout.show', row.id)}
                  onClick={(e) => {
                    e.preventDefault();
                    handleActionClick('view', 'view-express-checkout', row);
                  }}
                  className="font-semibold text-primary cursor-pointer truncate block"
                >
                  {value}
                </a>
              ) : (
                <span className="font-semibold text-zinc-900 dark:text-white truncate block">{value}</span>
              )}
              {row.description && (
                <p className="text-xs text-muted-foreground truncate max-w-[240px]" title={row.description}>
                  {row.description}
                </p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'type',
      label: t('Type'),
      sortable: true,
      render: (value: string, row: any) => {
        const displayType =
          row.type_display ||
          (value ? value.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : t('Standard'));
        return <RandomBadgeUI name={displayType} className='whitespace-nowrap' />;
      },
    },
    {
      key: 'payment_methods',
      label: t('Payment Methods'),
      sortable: false,
      render: (_: any, row: any) => {
        const methods: string[] =
          row.payment_methods_display ||
          (Array.isArray(row.payment_methods)
            ? row.payment_methods.map((m: string) => m.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()))
            : []);

        if (!methods || methods.length === 0) {
          return <span className="text-xs text-muted-foreground whitespace-nowrap">{t('None configured')}</span>;
        }

        const visibleMethods = methods.slice(0, 2);
        const remainingCount = methods.length - visibleMethods.length;

        return (
          <div className="flex flex-wrap items-center gap-1.5 whitespace-nowrap">
            {visibleMethods.map((method, index) => (
              <RandomBadgeUI key={index} name={method} />
            ))}
            {remainingCount > 0 && (
              <BadgeUI className="bg-zinc-100 text-zinc-600 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-400 text-xs py-0.5 px-1.5 font-semibold">
                +{remainingCount}
              </BadgeUI>
            )}
          </div>
        );
      },
    },
    {
      key: 'conversions',
      label: t('Conversions'),
      sortable: true,
      render: (value: number, row: any) => (
        <div>
          <span className="font-semibold text-zinc-900 dark:text-white">
            {value || 0}
          </span>
          <p className="text-[11px] text-muted-foreground">
            {row.conversion_rate ?? 0}% {t('rate')}
          </p>
        </div>
      ),
    },
    {
      key: 'revenue',
      label: t('Revenue'),
      sortable: true,
      render: (value: number) => (
        <span className="font-bold text-zinc-900 dark:text-white font-mono">
          {formatCurrency(value || 0)}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: t('Status'),
      sortable: true,
      render: (value: boolean, row: any) => {
        const canEdit = hasPermission('edit-express-checkout');

        if (!canEdit) {
          return (
            <BadgeUI
              className={
                value
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-500/30 font-medium'
                  : 'bg-zinc-100 text-zinc-600 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-400 font-medium'
              }
            >
              {value ? t('Active') : t('Inactive')}
            </BadgeUI>
          );
        }

        const isUpdating = togglingId === row.id;

        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={!!value}
              // disabled={isUpdating}
              onCheckedChange={() => handleToggleStatus(row.id, value)}
              aria-label={t('Toggle Status')}
            />
            <span
              className={`text-xs font-medium ${
                value ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              {value ? t('Active') : t('Inactive')}
            </span>
          </div>
        );
      },
    },
  ];

  // CrudTable Actions
  const actions: TableAction[] = [
    ...(hasPermission('view-express-checkout')
      ? [
          {
            label: t('View'),
            icon: 'Eye',
            action: 'view',
            requiredPermission: 'view-express-checkout',
          },
        ]
      : []),
    ...(hasPermission('edit-express-checkout')
      ? [
          {
            label: t('Edit'),
            icon: 'Edit',
            action: 'edit',
            requiredPermission: 'edit-express-checkout',
          },
        ]
      : []),
    ...(hasPermission('settings-express-checkout')
      ? [
          {
            label: t('Settings'),
            icon: 'Settings',
            action: 'settings',
            requiredPermission: 'settings-express-checkout',
          },
        ]
      : []),
    ...(hasPermission('delete-express-checkout')
      ? [
          {
            label: t('Delete'),
            icon: 'Trash2',
            action: 'delete',
            requiredPermission: 'delete-express-checkout',
          },
        ]
      : []),
  ];

  const handleTableAction = (action: string, row: any) => {
    switch (action) {
      case 'view':
        handleActionClick('view', 'view-express-checkout', row);
        break;
      case 'edit':
        handleActionClick('edit', 'edit-express-checkout', row);
        break;
      case 'settings':
        handleActionClick('settings', 'settings-express-checkout', row);
        break;
      case 'delete':
        handleActionClick('delete', 'delete-express-checkout', row);
        break;
    }
  };

  const totalCheckoutsCount = stats?.totalCheckouts ?? stats?.total ?? 0;
  const activeCheckoutsCount = stats?.activeCheckouts ?? stats?.active ?? 0;
  const conversionRateValue = stats?.conversionRate ?? 0;
  const totalRevenueValue = stats?.totalRevenue ?? 0;

  return (
    <PageTemplate
      title={t('Express Checkout')}
      description={t('Manage your express checkout methods and high-conversion payment triggers')}
      url="/express-checkout"
      actions={pageActions}
      breadcrumbs={[
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Express Checkout') },
      ]}
      noPadding
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Order Management / Stores-Style KPI Cards */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Total Checkouts */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-emerald-50 dark:bg-emerald-950/20  rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Total Checkouts')}</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl">{totalCheckoutsCount}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {totalCheckoutsCount > 0
                      ? t('{{count}} checkouts configured', { count: totalCheckoutsCount })
                      : t('No checkouts')}
                  </span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-emerald-100 p-2.5 dark:bg-emerald-900/40 sm:p-3">
                <Zap className="h-6 w-6 text-emerald-600 dark:text-emerald-400 sm:h-7 sm:w-7" />
              </div>
            </div>
          </div>

          {/* Card 2: Active Checkouts */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-blue-50 dark:bg-blue-900/20  rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Active Checkouts')}</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl">{activeCheckoutsCount}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {t('{{percent}}% active rate', {
                      percent: totalCheckoutsCount > 0 ? Math.round((activeCheckoutsCount / totalCheckoutsCount) * 100) : 0,
                    })}
                  </span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-blue-100 p-2.5 dark:bg-blue-900/40 sm:p-3">
                <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400 sm:h-7 sm:w-7" />
              </div>
            </div>
          </div>

          {/* Card 3: Conversion Rate */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-amber-50 dark:bg-amber-950/20  rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Conversion Rate')}</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl">{conversionRateValue}%</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">{t('Average conversion rate')}</span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-amber-100 p-2.5 dark:bg-amber-900/40 sm:p-3">
                <TrendingUp className="h-6 w-6 text-amber-600 dark:text-amber-400 sm:h-7 sm:w-7" />
              </div>
            </div>
          </div>

          {/* Card 4: Total Revenue */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-violet-50 dark:bg-violet-950/20  rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Total Revenue')}</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl font-mono">{formatCurrency(totalRevenueValue)}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-violet-600 dark:text-violet-400">{t('From express checkouts')}</span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-violet-100 p-2.5 dark:bg-violet-900/40 sm:p-3">
                <DollarSign className="h-6 w-6 text-violet-600 dark:text-violet-400 sm:h-7 sm:w-7" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters Section */}
        <div className="mb-4 rounded-lg border bg-white shadow dark:bg-gray-900">
          <SearchAndFilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onSearch={handleSearch}
            searchPlaceholder={t('Search express checkouts...')}
            statusTabs={statusTabs}
            activeStatusTab={selectedStatus}
            onStatusTabChange={handleStatusFilter}
            filters={[
              {
                name: 'type',
                label: t('Type'),
                type: 'select',
                value: selectedType,
                options: typeFilterOptions,
                onChange: (value) => {
                  setSelectedType(value);
                  applyFilters(searchTerm, selectedStatus, value);
                },
              },
            ]}
            hasActiveFilters={hasActiveFilters}
            activeFilterCount={activeFilterCount}
            onResetFilters={handleResetFilters}
          />
        </div>

        {/* Content Section: Table View */}
        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-zinc-900">
          <CrudTable
            columns={columns}
            actions={actions}
            data={checkoutsData}
            from={checkoutsFrom}
            onAction={handleTableAction}
            sortField={pageFilters.sort_field}
            sortDirection={pageFilters.sort_direction}
            onSort={handleSort}
            permissions={permissions}
          />

          {/* Pagination Component */}
          <Pagination
            from={checkoutsFrom}
            to={checkoutsTo}
            total={checkoutsTotal}
            links={checkoutsLinks}
            entityName={t('checkouts')}
            currentPerPage={pageFilters.per_page?.toString() || '10'}
            onPerPageChange={handlePerPageChange}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <CrudDeleteModal
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={selectedCheckout?.name || ''}
        entityName={t('express checkout')}
      />

      {/* Settings Dialog */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl">
          <DialogHeader className="!mb-0">
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              {t('Checkout Settings')}
            </DialogTitle>
            {/* <DialogDescription>{selectedCheckout?.name}</DialogDescription> */}
          </DialogHeader>
          <div className="">
            {selectedCheckout && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                  <div>
                    <h4 className="text-sm font-medium text-zinc-900 dark:text-white">{t('Status')}</h4>
                    <p className="text-xs text-muted-foreground">{t('Enable or disable this checkout')}</p>
                  </div>
                  <BadgeUI
                    className={
                      selectedCheckout.is_active
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-500/30 font-medium'
                        : 'bg-zinc-100 text-zinc-600 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-400 font-medium'
                    }
                  >
                    {selectedCheckout.is_active ? t('Active') : t('Inactive')}
                  </BadgeUI>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                  <div>
                    <h4 className="text-sm font-medium text-zinc-900 dark:text-white">{t('Payment Methods')}</h4>
                    <p className="text-xs text-muted-foreground">{t('Configured payment options')}</p>
                  </div>
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    {t('{{count}} methods', {
                      count: selectedCheckout.payment_methods?.length || 0,
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                  <div>
                    <h4 className="text-sm font-medium text-zinc-900 dark:text-white">{t('Performance')}</h4>
                    <p className="text-xs text-muted-foreground">{t('Conversion metrics')}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-white block">
                      {t('{{count}} conversions', { count: selectedCheckout.conversions || 0 })}
                    </span>
                    {/* <span className="text-[11px] text-muted-foreground">
                      {formatCurrency(selectedCheckout.revenue || 0)}
                    </span> */}
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)} className="rounded-xl">
              {t('Close')}
            </Button>
            {hasPermission('edit-express-checkout') && (
              <Button
                onClick={() => {
                  setIsSettingsDialogOpen(false);
                  handleActionClick('edit', 'edit-express-checkout', selectedCheckout);
                }}
                className="rounded-xl"
              >
                {t('Edit Settings')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTemplate>
  );
}