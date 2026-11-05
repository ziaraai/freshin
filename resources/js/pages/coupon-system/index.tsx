import React, { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { CrudTable } from '@/components/CrudTable';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Pagination } from '@/components/ui/pagination';
import BadgeUI from '@/components/badge-ui';
import RandomBadgeUI from '@/components/random-badge-ui';
import { Switch } from '@/components/ui/switch';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';
import {
  Plus,
  Download,
  Ticket,
  Percent,
  DollarSign,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import { formatCurrency } from '@/utils/currency-helper';
import { TableColumn, TableAction } from '@/types/crud';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const CopyableCodeBadge = ({ code }: { code: string }) => {
  const { t } = useTranslation();

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      toast.success(t('Coupon code copied!'));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors cursor-pointer group"
          >
            <span>{code}</span>
            <Copy className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('Click to copy code')}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default function CouponSystem() {
  const { t } = useTranslation();
  const {
    coupons = { data: [] },
    stats = { total: 0, active: 0, percentage: 0, flat: 0 },
    filters: pageFilters = {},
    auth
  } = usePage().props as any;

  const permissions = auth?.permissions || [];
  const hasAccess = (perm: string) => permissions.includes(perm);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [selectedStatus, setSelectedStatus] = useState(
    pageFilters.status && pageFilters.status !== 'all' ? pageFilters.status : '_empty_'
  );
  const [selectedType, setSelectedType] = useState(pageFilters.type || '_empty_');

  // Modal and toggle states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const hasActiveFilters = () => {
    return (
      selectedStatus !== '_empty_' ||
      searchTerm !== '' ||
      selectedType !== '_empty_'
    );
  };

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

    router.get(route('coupon-system.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(searchTerm, selectedStatus, selectedType);
  };

  const handleStatusFilter = (value: string) => {
    setSelectedStatus(value);
    applyFilters(searchTerm, value, selectedType);
  };

  const handleTypeFilter = (value: string) => {
    setSelectedType(value);
    applyFilters(searchTerm, selectedStatus, value);
  };

  const handleResetFilters = () => {
    setSelectedStatus('_empty_');
    setSearchTerm('');
    setSelectedType('_empty_');

    router.get(
      route('coupon-system.index'),
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

    router.get(route('coupon-system.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleToggleStatus = (couponId: number) => {
    if (!hasAccess('toggle-status-coupon-system')) {
      return;
    }

    setTogglingId(couponId);
    toast.loading(t('Updating status...'));

    router.post(
      route('store-coupons.toggle-status', couponId),
      {},
      {
        preserveState: true,
        preserveScroll: true,
        onSuccess: (page) => {
          toast.dismiss();
          if (page.props.flash?.success)
          {
            toast.success(t(page.props.flash?.success));
          } else if (page.props.flash?.error)
          {
            toast.error(t(page.props.flash?.error));
          }
        },
        onError: () => {
          toast.dismiss();
          toast.error(t('Failed to update status'));
        },
        onFinish: () => {
          setTogglingId(null);
        },
      }
    );
  };

  const handleDeleteConfirm = () => {
    if (selectedCoupon && hasAccess('delete-coupon-system')) {
      toast.loading(t('Deleting coupon...'));
      router.delete(route('store-coupons.destroy', selectedCoupon.id), {
        onSuccess: () => {
          toast.dismiss();
          setIsDeleteDialogOpen(false);
          setSelectedCoupon(null);
          toast.success(t('Coupon deleted successfully!'));
        },
        onError: (errors) => {
          toast.dismiss();
          toast.error(t(`Failed to delete coupon: ${Object.values(errors).join(', ')}`));
        },
      });
    }
  };

  // Status Tabs
  const statusTabs = [
    {
      value: '_empty_',
      label: t('All'),
      icon: <LayoutGrid className="h-4 w-4" />,
      count: stats.total || 0,
    },
    {
      value: '1',
      label: t('Active'),
      icon: <CheckCircle2 className="h-4 w-4" />,
      count: stats.active || 0,
    },
    {
      value: '0',
      label: t('Inactive'),
      icon: <XCircle className="h-4 w-4" />,
      count: (stats.total || 0) - (stats.active || 0),
    },
  ];

  // Filter dropdown
  const filterOptions = [
    {
      name: 'type',
      label: t('Type'),
      type: 'select' as const,
      options: [
        { value: '_empty_', label: t('All Types') },
        { value: 'percentage', label: t('Percentage') },
        { value: 'flat', label: t('Fixed Amount') },
      ],
      value: selectedType,
      onChange: handleTypeFilter,
    },
  ];

  // Columns definition (matching shipping standard)
  const columns: TableColumn[] = [
    {
      key: 'name',
      label: t('Coupon Name'),
      sortable: false,
      render: (value: string, row: any) => {
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Ticket className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-zinc-900 dark:text-white truncate block">
                {value}
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <CopyableCodeBadge code={row.code} />
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'type',
      label: t('Type'),
      sortable: false,
      render: (value: string) => (
        <RandomBadgeUI name={value === 'percentage' ? t('Percentage') : t('Fixed Amount')} />
      ),
    },
    {
      key: 'discount_amount',
      label: t('Discount'),
      sortable: false,
      render: (value: any, row: any) => (
        <span className="text-sm font-semibold text-zinc-900 dark:text-white font-mono">
          {row.type === 'percentage' ? `${value}%` : formatCurrency(value)}
        </span>
      ),
    },
    {
      key: 'minimum_spend',
      label: t('Min / Max Spend'),
      sortable: false,
      render: (_: any, row: any) => (
        <div className="text-sm">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">{t('Min:')}</span>
            <span className="font-medium text-zinc-900 dark:text-white font-mono">
              {row.minimum_spend ? formatCurrency(row.minimum_spend) : '-'}
            </span>
          </div>
          {row.maximum_spend && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">{t('Max:')}</span>
              <span className="font-medium text-zinc-900 dark:text-white font-mono">
                {formatCurrency(row.maximum_spend)}
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'used_count',
      label: t('Usage Limits'),
      sortable: false,
      render: (value: any, row: any) => (
        <div className="text-sm">
          <span className="font-medium text-zinc-900 dark:text-white">{value || 0}</span>
          <span className="mx-1 text-muted-foreground">/</span>
          <span className="text-muted-foreground">{row.use_limit_per_coupon || t('Unlimited')}</span>
        </div>
      ),
    },
    {
      key: 'expiry_date',
      label: t('Expiry Date'),
      sortable: false,
      render: (value: string) => {
        if (!value) {
          return <span className="text-sm text-muted-foreground">{t('Never Expires')}</span>;
        }

        const isExpired = new Date(value) < new Date(new Date().setHours(0, 0, 0, 0));

        return (
          <div className="flex items-center gap-2">
            {/* <span className="text-sm font-medium text-zinc-900 dark:text-white">
              {window.appSettings?.formatDateTime(value,false)}
            </span> */}
            <div className="flex items-left gap-2 whitespace-nowrap overflow-hidden text-ellipsis text-gray-500">
              {(value) && <Calendar className="h-4 w-4" />}
              <span>{window.appSettings?.formatDateTime(value, false)}</span>
            </div>
            {isExpired && (
              <BadgeUI className="bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-950/40 dark:text-rose-400 font-medium">
                {t('Expired')}
              </BadgeUI>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      label: t('Status'),
      sortable: false,
      render: (value: boolean, row: any) => {
        const canEdit = hasAccess('toggle-status-coupon-system');

        if (!canEdit) {
          return (
            <BadgeUI
              className={
                value
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400 font-medium'
                  : 'bg-zinc-100 text-zinc-600 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-400 font-medium'
              }
            >
              {value ? t('Active') : t('Inactive')}
            </BadgeUI>
          );
        }

        const isUpdating = togglingId === row.id;

        return (
          <div className="flex items-center">
            <Switch
              checked={!!value}
              // disabled={isUpdating}
              onCheckedChange={() => handleToggleStatus(row.id)}
              aria-label={t('Toggle Status')}
            />
          </div>
        );
      },
    },
  ];

  // Table Actions
  const tableActions: TableAction[] = [
    {
      action: 'view',
      label: t('View'),
      icon: 'Eye',
      requiredPermission: 'view-coupon-system',
    },
    {
      action: 'edit',
      label: t('Edit'),
      icon: 'Edit',
      requiredPermission: 'edit-coupon-system',
    },
    {
      action: 'delete',
      label: t('Delete'),
      icon: 'Trash2',
      className: 'text-red-600',
      requiredPermission: 'delete-coupon-system',
    },
  ];

  const handleTableAction = (action: string, row: any) => {
    switch (action) {
      case 'view':
        router.visit(route('coupon-system.show', row.id));
        break;
      case 'edit':
        router.visit(route('coupon-system.edit', row.id));
        break;
      case 'delete':
        setSelectedCoupon(row);
        setIsDeleteDialogOpen(true);
        break;
    }
  };

  // Top Page Actions
  const pageActions = [];

  if (hasAccess('export-coupon-system')) {
    pageActions.push({
      label: t('Export'),
      icon: <Download className="h-4 w-4" />,
      variant: 'outline' as const,
      onClick: () => window.open(route('coupon-system.export'), '_blank'),
    });
  }

  if (hasAccess('create-coupon-system')) {
    pageActions.push({
      label: t('Create Coupon'),
      icon: <Plus className="h-4 w-4" />,
      variant: 'default' as const,
      onClick: () => router.visit(route('coupon-system.create')),
    });
  }

  return (
    <PageTemplate
      title={t('Coupon System')}
      description={t('Manage store promotional discount coupons and customer vouchers')}
      url="/coupon-system"
      actions={pageActions}
      noPadding
      breadcrumbs={[
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Coupon System') },
      ]}
    >
      <div className="space-y-4">
        {/* KPI Metrics Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Coupons */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-primary/5 dark:bg-primary/10 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Total Coupons')}</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl">{stats.total || 0}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-primary">{t('All created store coupons')}</span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-primary/10 p-2.5 text-primary sm:p-3">
                <Ticket className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
            </div>
          </div>

          {/* Card 2: Active Coupons */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-emerald-50 dark:bg-emerald-950/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Active Coupons')}</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 sm:text-2xl">{stats.active || 0}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {stats.total > 0 ? Math.round(((stats.active || 0) / stats.total) * 100) : 0}% {t('active rate')}
                  </span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-emerald-100 p-2.5 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 sm:p-3">
                <CheckCircle2 className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
            </div>
          </div>

          {/* Card 3: Percentage Discounts */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-blue-50 dark:bg-blue-900/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Percentage')}</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400 sm:text-2xl">{stats.percentage || 0}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{t('Percentage discount rates')}</span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-blue-100 p-2.5 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 sm:p-3">
                <Percent className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
            </div>
          </div>

          {/* Card 4: Fixed Amount Coupons */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-amber-50 dark:bg-amber-950/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Fixed Amount')}</p>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400 sm:text-2xl">{stats.flat || 0}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">{t('Fixed cash off discounts')}</span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-amber-100 p-2.5 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400 sm:p-3">
                <DollarSign className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="rounded-lg border bg-white shadow-sm dark:bg-gray-900">
          <SearchAndFilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onSearch={handleSearch}
            searchPlaceholder={t('Search coupons by name or code...')}
            statusTabs={statusTabs}
            activeStatusTab={selectedStatus}
            onStatusTabChange={handleStatusFilter}
            filters={filterOptions}
            hasActiveFilters={hasActiveFilters}
            activeFilterCount={activeFilterCount}
            onResetFilters={handleResetFilters}
          />
        </div>

        {/* List Table Section */}
        <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden dark:bg-gray-900">
          <CrudTable
            columns={columns}
            actions={tableActions}
            data={coupons?.data || []}
            from={coupons?.from || 1}
            onAction={handleTableAction}
            sortField={pageFilters.sort_field}
            sortDirection={pageFilters.sort_direction}
            permissions={permissions}
            entityPermissions={{
              view: 'view-coupon-system',
              create: 'create-coupon-system',
              edit: 'edit-coupon-system',
              delete: 'delete-coupon-system',
            }}
          />

          {/* Pagination */}
          <Pagination
            from={coupons?.from || 0}
            to={coupons?.to || 0}
            total={coupons?.total || 0}
            links={coupons?.links}
            entityName={t('coupons')}
            currentPerPage={pageFilters.per_page?.toString() || '10'}
            onPerPageChange={(value) => {
              const params: any = {
                page: 1,
                per_page: parseInt(value),
              };

              if (searchTerm) params.search = searchTerm;
              if (selectedStatus !== '_empty_') params.status = selectedStatus;
              if (selectedType !== '_empty_') params.type = selectedType;

              router.get(route('coupon-system.index'), params, { preserveState: true, preserveScroll: true });
            }}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <CrudDeleteModal
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedCoupon(null);
        }}
        onConfirm={handleDeleteConfirm}
        itemName={selectedCoupon?.name || ''}
        entityName={t('coupon')}
      />
    </PageTemplate>
  );
}
