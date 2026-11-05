import React, { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { CrudTable } from '@/components/CrudTable';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Pagination } from '@/components/ui/pagination';
import BadgeUI from '@/components/badge-ui';
import { Switch } from '@/components/ui/switch';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';
import {
  Plus,
  Download,
  Truck,
  Eye,
  Edit,
  Trash2,
  Globe,
  Clock,
  DollarSign,
  CheckCircle2,
  XCircle,
  LayoutGrid
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import { formatCurrency } from '@/utils/currency-helper';
import { hasPermission, checkPermission } from '@/utils/permissions';
import { TableColumn, TableAction } from '@/types/crud';

export default function Shipping() {
  const { t } = useTranslation();
  const {
    shippings,
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
  const [selectedZone, setSelectedZone] = useState(pageFilters.zone_type || '_empty_');

  // Modal state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState<any>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      selectedStatus !== '_empty_' ||
      searchTerm !== '' ||
      selectedType !== '_empty_' ||
      selectedZone !== '_empty_'
    );
  };

  // Count active filters
  const activeFilterCount = () => {
    return (
      (selectedStatus !== '_empty_' ? 1 : 0) +
      (searchTerm ? 1 : 0) +
      (selectedType !== '_empty_' ? 1 : 0) +
      (selectedZone !== '_empty_' ? 1 : 0)
    );
  };

  const applyFilters = (
    newSearch = searchTerm,
    newStatus = selectedStatus,
    newType = selectedType,
    newZone = selectedZone
  ) => {
    const params: any = { page: 1 };

    if (newSearch) params.search = newSearch;
    if (newStatus !== '_empty_') params.status = newStatus;
    if (newType !== '_empty_') params.type = newType;
    if (newZone !== '_empty_') params.zone_type = newZone;

    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    if (pageFilters.sort_field) params.sort_field = pageFilters.sort_field;
    if (pageFilters.sort_direction) params.sort_direction = pageFilters.sort_direction;

    router.get(route('shipping.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(searchTerm, selectedStatus, selectedType, selectedZone);
  };

  const handleStatusFilter = (value: string) => {
    setSelectedStatus(value);
    applyFilters(searchTerm, value, selectedType, selectedZone);
  };

  const handleTypeFilter = (value: string) => {
    setSelectedType(value);
    applyFilters(searchTerm, selectedStatus, value, selectedZone);
  };

  const handleZoneFilter = (value: string) => {
    setSelectedZone(value);
    applyFilters(searchTerm, selectedStatus, selectedType, value);
  };

  const handleResetFilters = () => {
    setSelectedStatus('_empty_');
    setSearchTerm('');
    setSelectedType('_empty_');
    setSelectedZone('_empty_');

    router.get(
      route('shipping.index'),
      {
        page: 1,
        per_page: pageFilters.per_page,
      },
      { preserveState: true, preserveScroll: true }
    );
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
    if (selectedZone !== '_empty_') params.zone_type = selectedZone;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;

    router.get(route('shipping.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handlePageChange = (url: string) => {
    const pageNum = new URL(url, window.location.origin).searchParams.get('page') || '1';
    const params: any = {
      page: pageNum,
    };

    if (searchTerm) params.search = searchTerm;
    if (selectedStatus !== '_empty_') params.status = selectedStatus;
    if (selectedType !== '_empty_') params.type = selectedType;
    if (selectedZone !== '_empty_') params.zone_type = selectedZone;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    if (pageFilters.sort_field) params.sort_field = pageFilters.sort_field;
    if (pageFilters.sort_direction) params.sort_direction = pageFilters.sort_direction;

    router.get(route('shipping.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleActionClick = (action: string, permission: string, shippingId?: number) => {
    if (!checkPermission(permission, auth)) {
      return;
    }

    switch (action) {
      case 'view':
        router.visit(route('shipping.show', shippingId));
        break;
      case 'edit':
        router.visit(route('shipping.edit', shippingId));
        break;
      case 'delete':
        const found = (shippings?.data || []).find((s: any) => s.id === shippingId);
        setSelectedShipping(found);
        setIsDeleteDialogOpen(true);
        break;
      case 'create':
        router.visit(route('shipping.create'));
        break;
      case 'export':
        window.open(route('shipping.export'), '_blank');
        break;
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedShipping && checkPermission('delete-shipping', auth)) {
      router.delete(route('shipping.destroy', selectedShipping.id), {
        onSuccess: (page: any) => {
          toast.dismiss();
          setIsDeleteDialogOpen(false);
          setSelectedShipping(null);
          if (page?.props?.flash?.success) {
            toast.success(t(page.props.flash.success));
          } else if (page?.props?.flash?.error) {
            toast.error(t(page.props.flash.error));
          }
        },
        onError: (errors) => {
          toast.dismiss();
          toast.error(t('Failed to delete shipping method'));
        }
      });
    }
  };

  const handleToggleStatus = (shippingId: number, currentStatus: boolean) => {
    if (!checkPermission('edit-shipping', auth)) {
      return;
    }

    setTogglingId(shippingId);
    toast.loading(t('Updating status...'));

    router.put(
      route('shipping.update', shippingId),
      {
        is_active: !currentStatus,
      },
      {
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => {
          toast.dismiss();
          toast.success(t('Shipping status updated successfully'));
        },
        onError: () => {
          toast.dismiss();
          toast.error(t('Failed to update shipping status'));
        },
        onFinish: () => {
          setTogglingId(null);
        },
      }
    );
  };

  // Status tabs: All, Active, Inactive only
  const statusTabs = [
    {
      value: '_empty_',
      label: t('All'),
      icon: <LayoutGrid className="h-4 w-4" />,
      count: statusCounts.all ?? stats.totalShippings ?? 0,
    },
    {
      value: 'active',
      label: t('Active'),
      icon: <CheckCircle2 className="h-4 w-4" />,
      count: statusCounts.active ?? stats.activeShippings ?? 0,
    },
    {
      value: 'inactive',
      label: t('Inactive'),
      icon: <XCircle className="h-4 w-4" />,
      count: statusCounts.inactive ?? 0,
    },
  ];

  // Table columns definition
  const columns: TableColumn[] = [
    {
      key: 'name',
      label: t('Method Name'),
      sortable: true,
      render: (value: string, row: any) => {
        const canView = hasPermission('view-shipping');
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Truck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              {canView ? (
                <a
                  href={route('shipping.show', row.id)}
                  onClick={(e) => {
                    e.preventDefault();
                    handleActionClick('view', 'view-shipping', row.id);
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
      render: (value: string) => {
        const formatType = (tStr: string) => {
          if (!tStr) return t('Standard');
          return tStr
            .split('_')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
        };
        return (
          <BadgeUI className="bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-950/40 dark:text-sky-400 dark:ring-sky-500/30 font-medium">
            {formatType(value)}
          </BadgeUI>
        );
      },
    },
    {
      key: 'zone_type',
      label: t('Zone'),
      sortable: true,
      render: (value: string) => {
        const formatZone = (zStr: string) => {
          if (!zStr) return t('Any');
          return zStr.charAt(0).toUpperCase() + zStr.slice(1);
        };
        return (
          <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            {/* <Globe className="h-3.5 w-3.5 text-muted-foreground" /> */}
            <span>{formatZone(value)}</span>
          </div>
        );
      },
    },
    {
      key: 'cost',
      label: t('Cost'),
      sortable: true,
      render: (value: number, row: any) => {
        if (row.type === 'free_shipping') {
          return (
            <BadgeUI className="bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400 font-medium">
              {t('Free')}
            </BadgeUI>
          );
        }
        if (row.type === 'percentage_based') {
          return (
            <span className="font-semibold text-zinc-900 dark:text-white">
              {value}%
            </span>
          );
        }
        return (
          <div>
            <span className="font-semibold text-zinc-900 dark:text-white font-mono">
              {formatCurrency(value || 0)}
            </span>
            {row.min_order_amount > 0 && (
              <p className="text-[11px] text-muted-foreground">
                {t('Min:')} <span className="font-mono">{formatCurrency(row.min_order_amount)}</span>
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: 'delivery_time',
      label: t('Delivery Time'),
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
          {/* <Clock className="h-3.5 w-3.5 text-muted-foreground" /> */}
          <span>{value || t('Not specified')}</span>
        </div>
      ),
    },
    {
      key: 'is_active',
      label: t('Status'),
      sortable: true,
      render: (value: boolean, row: any) => {
        const canEdit = hasPermission('edit-shipping') || auth?.permissions?.includes('edit-shipping');

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

  // Table actions
  const tableActions: TableAction[] = [
    ...(hasPermission('view-shipping') ? [{
      action: 'view',
      label: t('View'),
      icon: 'Eye',
      requiredPermission: 'view-shipping',
    }] : []),
    ...(hasPermission('edit-shipping') ? [{
      action: 'edit',
      label: t('Edit'),
      icon: 'Edit',
      requiredPermission: 'edit-shipping',
    }] : []),
    ...(hasPermission('delete-shipping') ? [{
      action: 'delete',
      label: t('Delete'),
      icon: 'Trash2',
      className: 'text-red-600',
      requiredPermission: 'delete-shipping',
    }] : [])
  ];

  const handleTableAction = (action: string, row: any) => {
    switch (action) {
      case 'view':
        handleActionClick('view', 'view-shipping', row.id);
        break;
      case 'edit':
        handleActionClick('edit', 'edit-shipping', row.id);
        break;
      case 'delete':
        handleActionClick('delete', 'delete-shipping', row.id);
        break;
    }
  };

  const pageActions = [
    ...(hasPermission('export-shipping')
      ? [
          {
            label: t('Export'),
            icon: <Download className="h-4 w-4" />,
            variant: 'outline' as const,
            onClick: () => handleActionClick('export', 'export-shipping'),
          },
        ]
      : []),
    ...(hasPermission('create-shipping')
      ? [
          {
            label: t('Create Shipping'),
            icon: <Plus className="h-4 w-4" />,
            variant: 'default' as const,
            onClick: () => handleActionClick('create', 'create-shipping'),
          },
        ]
      : []),
  ];

  return (
    <>
      <PageTemplate
        title={t('Shipping Management')}
        description={t('Configure and manage shipping methods, zones, and delivery rates.')}
        url="/shipping"
        actions={pageActions}
        breadcrumbs={[
          { title: t('Dashboard'), href: route('dashboard') },
          { title: t('Shipping Management') },
        ]}
        noPadding
      >
        <div className="space-y-4 sm:space-y-6">
          {/* Top KPI Stats Cards */}
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Total Methods */}
            <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
              <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-blue-50 dark:bg-blue-950/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    {t('Shipping Methods')}
                  </p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl">
                    {stats.totalShippings ?? 0}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      {t('All shipping methods')}
                    </span>
                  </div>
                </div>
                <div className="relative z-10 rounded-xl bg-blue-100 p-2.5 dark:bg-blue-900/40 sm:p-3">
                  <Truck className="h-6 w-6 text-blue-600 dark:text-blue-400 sm:h-7 sm:w-7" />
                </div>
              </div>
            </div>

            {/* Card 2: Active Methods */}
            <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
              <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-emerald-50 dark:bg-emerald-950/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    {t('Active Methods')}
                  </p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl">
                    {stats.activeShippings ?? 0}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {t('{{percent}}% active rate', {
                        percent:
                          stats.totalShippings > 0
                            ? Math.round((stats.activeShippings / stats.totalShippings) * 100)
                            : 0,
                      })}
                    </span>
                  </div>
                </div>
                <div className="relative z-10 rounded-xl bg-emerald-100 p-2.5 dark:bg-emerald-900/40 sm:p-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 sm:h-7 sm:w-7" />
                </div>
              </div>
            </div>

            {/* Card 3: Shipping Zones */}
            <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
              <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-purple-50 dark:bg-purple-950/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    {t('Shipping Zones')}
                  </p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl">
                    {stats.shippingZones ?? 0}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                      {t('Coverage areas')}
                    </span>
                  </div>
                </div>
                <div className="relative z-10 rounded-xl bg-purple-100 p-2.5 dark:bg-purple-900/40 sm:p-3">
                  <Globe className="h-6 w-6 text-purple-600 dark:text-purple-400 sm:h-7 sm:w-7" />
                </div>
              </div>
            </div>

            {/* Card 4: Avg. Shipping Cost */}
            <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
              <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-amber-50 dark:bg-amber-950/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    {t('Avg. Shipping Cost')}
                  </p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl font-mono">
                    {formatCurrency(stats.avgShippingCost ?? 0)}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                      {t('Per order')}
                    </span>
                  </div>
                </div>
                <div className="relative z-10 rounded-xl bg-amber-100 p-2.5 dark:bg-amber-900/40 sm:p-3">
                  <DollarSign className="h-6 w-6 text-amber-600 dark:text-amber-400 sm:h-7 sm:w-7" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Search and Status Filters Section (All, Active, Inactive tabs only) */}
          <div className="mb-4 rounded-lg border bg-white shadow dark:bg-gray-900">
            <SearchAndFilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onSearch={handleSearch}
              searchPlaceholder={t('Search shipping methods...')}
              statusTabs={statusTabs}
              activeStatusTab={selectedStatus}
              onStatusTabChange={handleStatusFilter}
              filters={[
                {
                  name: 'type',
                  label: t('Shipping Type'),
                  type: 'select',
                  value: selectedType,
                  onChange: handleTypeFilter,
                  options: [
                    { value: '_empty_', label: t('All Types') },
                    { value: 'flat_rate', label: t('Flat Rate') },
                    { value: 'free_shipping', label: t('Free Shipping') },
                    { value: 'weight_based', label: t('Weight Based') },
                    { value: 'distance_based', label: t('Distance Based') },
                    { value: 'percentage_based', label: t('Percentage Based') },
                  ],
                },
                {
                  name: 'zone_type',
                  label: t('Zone'),
                  type: 'select',
                  value: selectedZone,
                  onChange: handleZoneFilter,
                  options: [
                    { value: '_empty_', label: t('All Zones') },
                    { value: 'domestic', label: t('Domestic') },
                    { value: 'international', label: t('International') },
                    { value: 'local', label: t('Local') },
                    { value: 'regional', label: t('Regional') },
                  ],
                },
              ]}
              hasActiveFilters={hasActiveFilters}
              activeFilterCount={activeFilterCount}
              onResetFilters={handleResetFilters}
            />
          </div>

          {/* Table Content Section */}
          <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
            <CrudTable
              columns={columns}
              actions={tableActions}
              data={shippings?.data || []}
              from={shippings?.from || 1}
              onAction={handleTableAction}
              sortField={pageFilters.sort_field}
              sortDirection={pageFilters.sort_direction}
              onSort={handleSort}
              permissions={permissions}
              entityPermissions={{
                view: 'view-shipping',
                edit: 'edit-shipping',
                delete: 'delete-shipping',
              }}
            />

            {/* Pagination Component */}
            <Pagination
              from={shippings?.from || 0}
              to={shippings?.to || 0}
              total={shippings?.total || 0}
              links={shippings?.links}
              entityName={t('shipping methods')}
              currentPerPage={pageFilters.per_page?.toString() || '10'}
              onPerPageChange={(value) => {
                const params: any = {
                  page: 1,
                  per_page: parseInt(value),
                };

                if (searchTerm) params.search = searchTerm;
                if (selectedStatus !== '_empty_') params.status = selectedStatus;
                if (selectedType !== '_empty_') params.type = selectedType;
                if (selectedZone !== '_empty_') params.zone_type = selectedZone;
                if (pageFilters.sort_field) params.sort_field = pageFilters.sort_field;
                if (pageFilters.sort_direction) params.sort_direction = pageFilters.sort_direction;

                router.get(route('shipping.index'), params, { preserveState: true, preserveScroll: true });
              }}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </PageTemplate>

      {/* Delete Confirmation Modal */}
      <CrudDeleteModal
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={selectedShipping?.name || ''}
        entityName={t('shipping method')}
      />
    </>
  );
}