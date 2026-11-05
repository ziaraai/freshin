import React, { useState, useEffect } from 'react';
import { PageTemplate } from '@/components/page-template';
import { CrudTable } from '@/components/CrudTable';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Pagination } from '@/components/ui/pagination';
import BadgeUI from '@/components/badge-ui';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/custom-toast';
import { useInitials } from '@/hooks/use-initials';
import {
  Download,
  ShoppingCart,
  Package,
  DollarSign,
  TrendingUp,
  LayoutGrid,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock
} from 'lucide-react';

import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import { formatCurrency } from '@/utils/currency-helper';
import { getImageUrl } from '@/utils/image-helper';
import { hasPermission, checkPermission } from '@/utils/permissions';
import UserInitials from '@/components/user-initials';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Orders() {
  const { t } = useTranslation();
  const { auth, orders, stats, filters: pageFilters = {}, statusCounts = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];
  const getInitials = useInitials();

  // State
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [startDate, setStartDate] = useState<Date | undefined>(pageFilters.start_date ? new Date(pageFilters.start_date) : undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(pageFilters.end_date ? new Date(pageFilters.end_date) : undefined);
  const [selectedStatus, setSelectedStatus] = useState(pageFilters.status && pageFilters.status !== 'all' ? pageFilters.status : '_empty_');

  // Modal state
  const [orderToDelete, setOrderToDelete] = useState<number | null>(null);

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

    if (newSearch) params.search = newSearch;
    if (newStatus !== '_empty_') params.status = newStatus;
    if (newStart) params.start_date = newStart instanceof Date ? newStart.toISOString().split('T')[0] : newStart;
    if (newEnd) params.end_date = newEnd instanceof Date ? newEnd.toISOString().split('T')[0] : newEnd;

    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    if (pageFilters.sort_field) params.sort_field = pageFilters.sort_field;
    if (pageFilters.sort_direction) params.sort_direction = pageFilters.sort_direction;

    router.get(route('orders.index'), params, { preserveState: true, preserveScroll: true });
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

    if (searchTerm) params.search = searchTerm;
    if (selectedStatus !== '_empty_') params.status = selectedStatus;
    if (startDate) params.start_date = startDate instanceof Date ? startDate.toISOString().split('T')[0] : startDate;
    if (endDate) params.end_date = endDate instanceof Date ? endDate.toISOString().split('T')[0] : endDate;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;

    router.get(route('orders.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleResetFilters = () => {
    setSelectedStatus('_empty_');
    setSearchTerm('');
    setStartDate(undefined);
    setEndDate(undefined);

    router.get(
      route('orders.index'),
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
    if (startDate) params.start_date = startDate instanceof Date ? startDate.toISOString().split('T')[0] : startDate;
    if (endDate) params.end_date = endDate instanceof Date ? endDate.toISOString().split('T')[0] : endDate;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    if (pageFilters.sort_field) params.sort_field = pageFilters.sort_field;
    if (pageFilters.sort_direction) params.sort_direction = pageFilters.sort_direction;

    router.get(route('orders.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleActionClick = (action: string, permission: string, orderId?: number) => {
    if (!checkPermission(permission, auth)) {
      return;
    }

    switch (action) {
      case 'view':
        router.visit(route('orders.show', orderId));
        break;
      case 'edit':
        router.visit(route('orders.edit', orderId));
        break;
      case 'delete':
        setOrderToDelete(orderId!);
        break;
      case 'export':
        window.open(route('orders.export'), '_blank');
        break;
    }
  };

  const handleDelete = () => {
    if (orderToDelete && checkPermission('delete-orders', auth)) {
      router.delete(route('orders.destroy', orderToDelete), {
          onSuccess: (page: any) => {
              toast.dismiss();
              if (page?.props?.flash?.success) {
                  toast.success(t(page.props.flash.success));
              } else if (page?.props?.flash?.error) {
                  toast.error(t(page.props.flash.error));
              }
          },
          onError: (errors) => {
              toast.dismiss();
              toast.error(t('Failed to delete order'));
          }
      });

      setOrderToDelete(null);
    }
  };

  const handleStatusUpdate = (orderId: number, newStatus: string) => {
    if (!checkPermission('edit-orders', auth)) {
      toast.error(t('You do not have permission to edit orders'));
      return;
    }

    toast.loading(t('Updating status...'));
    router.put(
      route('orders.update', orderId),
      { status: newStatus },
      {
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => {
          toast.dismiss();
          toast.success(t('Order status updated successfully'));
        },
        onError: () => {
          toast.dismiss();
          toast.error(t('Failed to update order status'));
        },
      }
    );
  };

  const statusTabs = [
    { value: '_empty_', label: t('All'), icon: <LayoutGrid className="h-4 w-4" />, count: statusCounts.all ?? 0 },
    { value: 'pending', label: t('Pending'), icon: <Clock className="h-4 w-4" />, count: statusCounts.pending ?? 0 },
    { value: 'processing', label: t('Processing'), icon: <RefreshCw className="h-4 w-4" />, count: statusCounts.processing ?? 0 },
    { value: 'shipped', label: t('Shipped'), icon: <Package className="h-4 w-4" />, count: statusCounts.shipped ?? 0 },
    { value: 'delivered', label: t('Delivered'), icon: <CheckCircle2 className="h-4 w-4" />, count: statusCounts.delivered ?? 0 },
    { value: 'completed', label: t('Completed'), icon: <CheckCircle2 className="h-4 w-4" />, count: statusCounts.completed ?? 0 },
    { value: 'cancelled', label: t('Cancelled'), icon: <XCircle className="h-4 w-4" />, count: statusCounts.cancelled ?? 0 },
  ];

  const pageActions = [
    ...(hasPermission('export-orders') ? [{
      label: t('Export'),
      icon: <Download className="h-4 w-4" />,
      variant: 'outline' as const,
      onClick: () => handleActionClick('export', 'export-orders')
    }] : [])
  ];

  const renderStatusDropdown = (orderId: number, currentStatus: string) => {
    const canEdit = hasPermission('edit-orders');

    const availableStatuses = [
      { value: 'pending', label: t('Pending') },
      { value: 'confirmed', label: t('Confirmed') },
      { value: 'processing', label: t('Processing') },
      { value: 'shipped', label: t('Shipped') },
      { value: 'delivered', label: t('Delivered') },
      { value: 'completed', label: t('Completed') },
      { value: 'cancelled', label: t('Cancelled') },
      { value: 'refunded', label: t('Refunded') },
    ];

    const normalizedStatus = currentStatus?.toLowerCase() || 'pending';
    const isKnown = availableStatuses.some((s) => s.value === normalizedStatus);
    const statusesToRender = isKnown
      ? availableStatuses
      : [...availableStatuses, { value: normalizedStatus, label: t(currentStatus) }];

    if (!canEdit) {
      return (
        // <Select value={normalizedStatus} disabled>
        //   <SelectTrigger className="h-8 w-[130px] rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400 opacity-70 cursor-not-allowed">
        //     <SelectValue placeholder={t('Select status')} />
        //   </SelectTrigger>
        // </Select>
        // if the edit permission is not assign so show only the badge style
        <BadgeUI>
          {normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1)}
        </BadgeUI>
      );
    }

    return (
      <Select
        value={normalizedStatus}
        onValueChange={(val) => {
          if (val && val !== normalizedStatus) {
            handleStatusUpdate(orderId, val);
          }
        }}
      >
        <SelectTrigger className="h-8 w-[130px] rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-750 focus:ring-1 focus:ring-primary shadow-xs">
          <SelectValue placeholder={t('Select status')} />
        </SelectTrigger>
        <SelectContent align="end" className="z-50 min-w-[130px]">
          {statusesToRender.map((st) => (
            <SelectItem key={st.value} value={st.value} className="text-xs cursor-pointer font-medium">
              {st.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  // Define columns for CrudTable list view
  const columns = [
    {
      key: 'orderNumber',
      label: t('Order ID'),
      sortable: true,
      render: (value: string, row: any) => {
        const canView = hasPermission('view-orders');
        return canView ? (
          <a
            href={route('orders.show', row.id)}
            onClick={(e) => {
              e.preventDefault();
              handleActionClick('view', 'view-orders', row.id);
            }}
            className="font-semibold text-primary cursor-pointer whitespace-nowrap"
          >
            {value}
          </a>
        ) : (
          <span className="font-semibold text-zinc-900 dark:text-white">{value}</span>
        );
      },
    },
    {
      key: 'customer',
      label: t('Customer'),
      sortable: true,
      render: (value: string, row: any) => (
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <Avatar className="h-10 w-10 shrink-0 border border-zinc-200 dark:border-zinc-800">
              <AvatarImage src={row.avatar} alt={row.customer} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                <img src={getImageUrl('/storage/media/avatars/avatar.png')} alt={row.customer} className="object-cover rounded-full" />
              </AvatarFallback>
            </Avatar>
            {/* <UserInitials name={row.customer} /> */}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-zinc-900 dark:text-white truncate">{row.customer}</div>
            <div className="text-xs text-muted-foreground truncate">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'items',
      label: t('Items'),
      render: (value: number, row: any) => {
        const itemImages: Array<{ id?: number; name?: string; image?: string }> = row.itemImages || [];
        const totalItems = typeof value === 'number' ? value : itemImages.length;
        const visibleImages = itemImages.slice(0, 2);
        const remainingCount = totalItems > 2 ? totalItems - 2 : 0;

        return (
          <div className="flex flex-col gap-1.5 py-1">
            {visibleImages.length > 0 && (
              <div className="flex items-center gap-1.5">
                {visibleImages.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white p-0.5 shadow-2xs dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    <img
                      src={getImageUrl(item.image || '/storage/media/product/product.png')}
                      alt={item.name || 'Product'}
                      title={item.name || 'Product'}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getImageUrl('/storage/media/product/product.png');
                      }}
                      className="h-full w-full rounded-md object-contain"
                    />
                  </div>
                ))}
                {remainingCount > 0 && (
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-300"
                    title={t('+{{count}} more items', { count: remainingCount })}
                  >
                    +{remainingCount}
                  </div>
                )}
              </div>
            )}
            <span className="text-xs text-muted-foreground dark:text-zinc-400">
              {t('{{items}} items', { items: totalItems })}
            </span>
          </div>
        );
      },
    },
    {
      key: 'date',
      label: t('Date'),
      sortable: true,
      type: 'date',
      // render: (value: string) => (
      //   <span className="text-sm text-zinc-600 dark:text-zinc-400">{value}</span>
      // ),
    },
    {
      key: 'paymentMethod',
      label: t('Payment'),
      render: (value: string) => (
        <BadgeUI className="bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/15 dark:text-blue-400 dark:ring-blue-500/35 whitespace-nowrap">
          {value}
        </BadgeUI>
      ),
    },
    {
      key: 'total',
      label: t('Total'),
      sortable: true,
      render: (value: number) => (
        <span className="font-bold text-zinc-900 dark:text-white font-mono">{formatCurrency(value)}</span>
      ),
    },
    {
      key: 'status',
      label: t('Status'),
      render: (value: string, row: any) => renderStatusDropdown(row.id, value),
    },
  ];

  // Define table actions
  const actions = [
    ...(hasPermission('view-orders') ? [{
      label: t('View'),
      icon: 'Eye',
      action: 'view',
      requiredPermission: 'view-orders'
    }] : []),
    ...(hasPermission('edit-orders') ? [{
      label: t('Edit'),
      icon: 'Edit',
      action: 'edit',
      requiredPermission: 'edit-orders'
    }] : []),
    ...(hasPermission('delete-orders') ? [{
      label: t('Delete'),
      icon: 'Trash2',
      action: 'delete',
      requiredPermission: 'delete-orders'
    }] : [])
  ];

  const handleTableAction = (action: string, row: any) => {
    switch (action) {
      case 'view':
        handleActionClick('view', 'view-orders', row.id);
        break;
      case 'edit':
        handleActionClick('edit', 'edit-orders', row.id);
        break;
      case 'delete':
        handleActionClick('delete', 'delete-orders', row.id);
        break;
    }
  };

  return (
    <PageTemplate 
      title={t('Order Management')}
      description={t('Manage your store orders')}
      url="/orders"
      actions={pageActions}
      breadcrumbs={[
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Order Management') }
      ]}
      noPadding
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Stores-Style KPI Cards */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Total Orders */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-emerald-50 dark:bg-emerald-950/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Total Orders')}</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl">{stats?.totalOrders || 0}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t('Total orders in store')}</span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-emerald-100 p-2.5 dark:bg-emerald-900/40 sm:p-3">
                <ShoppingCart className="h-6 w-6 text-emerald-600 dark:text-emerald-400 sm:h-7 sm:w-7" />
              </div>
            </div>
          </div>

          {/* Card 2: Pending Orders */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-amber-50 dark:bg-amber-950/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Pending Orders')}</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl">{stats?.pendingOrders || 0}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">{t('Need attention')}</span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-amber-100 p-2.5 dark:bg-amber-900/40 sm:p-3">
                <Package className="h-6 w-6 text-amber-600 dark:text-amber-400 sm:h-7 sm:w-7" />
              </div>
            </div>
          </div>

          {/* Card 3: Total Revenue */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-blue-50 dark:bg-blue-900/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Total Revenue')}</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl font-mono">{formatCurrency(stats?.totalRevenue || 0)}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{t('Total revenue')}</span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-blue-100 p-2.5 dark:bg-blue-900/40 sm:p-3">
                <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400 sm:h-7 sm:w-7" />
              </div>
            </div>
          </div>

          {/* Card 4: Avg. Order Value */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-orange-50 dark:bg-orange-950/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Avg. Order Value')}</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl font-mono">{formatCurrency(stats?.avgOrderValue || 0)}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-orange-600 dark:text-orange-400">{t('Average order value')}</span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-orange-100 p-2.5 dark:bg-orange-900/40 sm:p-3">
                <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400 sm:h-7 sm:w-7" />
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
            searchPlaceholder={t('Search orders...')}
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
          />
        </div>

        {/* Content Section: List View */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <CrudTable
            columns={columns}
            actions={actions}
            data={orders?.data || []}
            from={orders?.from || 1}
            onAction={handleTableAction}
            sortField={pageFilters.sort_field}
            sortDirection={pageFilters.sort_direction}
            onSort={handleSort}
            permissions={permissions}
          />

          {/* Pagination Component */}
          <Pagination
            from={orders?.from || 0}
            to={orders?.to || 0}
            total={orders?.total || 0}
            links={orders?.links}
            entityName={t('orders')}
            currentPerPage={pageFilters.per_page?.toString() || '10'}
            onPerPageChange={(value) => {
              const params: any = {
                page: 1,
                per_page: parseInt(value),
              };

              if (searchTerm) params.search = searchTerm;
              if (selectedStatus !== '_empty_') params.status = selectedStatus;
              if (startDate) params.start_date = startDate instanceof Date ? startDate.toISOString().split('T')[0] : startDate;
              if (endDate) params.end_date = endDate instanceof Date ? endDate.toISOString().split('T')[0] : endDate;
              if (pageFilters.sort_field) params.sort_field = pageFilters.sort_field;
              if (pageFilters.sort_direction) params.sort_direction = pageFilters.sort_direction;

              router.get(route('orders.index'), params, { preserveState: true, preserveScroll: true });
            }}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <CrudDeleteModal
        isOpen={!!orderToDelete}
        onClose={() => setOrderToDelete(null)}
        onConfirm={handleDelete}
        itemName={orders?.data?.find((o: any) => o.id === orderToDelete)?.orderNumber || ''}
        entityName={t('order')}
      />
    </PageTemplate>
  );
}