import React, { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { CrudTable } from '@/components/CrudTable';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Pagination } from '@/components/ui/pagination';
import BadgeUI from '@/components/badge-ui';
import RandomBadgeUI from '@/components/random-badge-ui';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Plus, 
  Download, 
  Package, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  LayoutGrid, 
  DollarSign, 
  AlertTriangle,
  Layers,
  Tag,
  ShoppingCart
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import { getImageUrl } from '@/utils/image-helper';
import { formatCurrency } from '@/utils/currency-helper';
import { hasPermission, checkPermission } from '@/utils/permissions';
import { TableColumn, TableAction } from '@/types/crud';
import { toast } from '@/components/custom-toast';

export default function Products() {
  const { t } = useTranslation();
  const { 
    products, 
    stats = {}, 
    statusCounts = {}, 
    categories = [], 
    filters: pageFilters = {}, 
    auth 
  } = usePage().props as any;
  const permissions = auth?.permissions || [];

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [selectedStatus, setSelectedStatus] = useState(
    pageFilters.status && pageFilters.status !== 'all' ? pageFilters.status : '_empty_'
  );
  const [selectedCategory, setSelectedCategory] = useState(
    pageFilters.category_id ? pageFilters.category_id.toString() : '_empty_'
  );
  const [activeView, setActiveView] = useState<'list' | 'grid'>(pageFilters.view || 'list');
  const [productToDelete, setProductToDelete] = useState<number | null>(null);

  // Safely extract product list whether paginated or plain array
  const productList = products?.data || (Array.isArray(products) ? products : []);

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      selectedStatus !== '_empty_' ||
      searchTerm !== '' ||
      selectedCategory !== '_empty_'
    );
  };

  // Count active filters
  const activeFilterCount = () => {
    return (
      (selectedStatus !== '_empty_' ? 1 : 0) +
      (searchTerm ? 1 : 0) +
      (selectedCategory !== '_empty_' ? 1 : 0)
    );
  };

  const applyFilters = (
    newSearch = searchTerm,
    newStatus = selectedStatus,
    newCategory = selectedCategory,
    newView = activeView
  ) => {
    const params: any = { 
      page: 1,
      view: newView,
      per_page: pageFilters.per_page || 10,
    };

    if (newSearch) params.search = newSearch;
    if (newStatus !== '_empty_') params.status = newStatus;
    if (newCategory !== '_empty_') params.category_id = newCategory;

    if (pageFilters.sort_field) params.sort_field = pageFilters.sort_field;
    if (pageFilters.sort_direction) params.sort_direction = pageFilters.sort_direction;

    router.get(route('products.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(searchTerm, selectedStatus, selectedCategory, activeView);
  };

  const handleStatusFilter = (value: string) => {
    setSelectedStatus(value);
    applyFilters(searchTerm, value, selectedCategory, activeView);
  };

  const handleCategoryFilter = (value: string) => {
    setSelectedCategory(value);
    applyFilters(searchTerm, selectedStatus, value, activeView);
  };

  const handleViewChange = (newView: string) => {
    const viewType = newView as 'list' | 'grid';
    setActiveView(viewType);

    const params: any = {
      page: 1,
      view: viewType,
      per_page: pageFilters.per_page || 10,
    };

    if (searchTerm) params.search = searchTerm;
    if (selectedStatus !== '_empty_') params.status = selectedStatus;
    if (selectedCategory !== '_empty_') params.category_id = selectedCategory;
    if (pageFilters.sort_field) params.sort_field = pageFilters.sort_field;
    if (pageFilters.sort_direction) params.sort_direction = pageFilters.sort_direction;

    router.get(route('products.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedStatus('_empty_');
    setSelectedCategory('_empty_');
    router.get(route('products.index'), { view: activeView, per_page: 10 }, { preserveState: true, preserveScroll: true });
  };

  const handleSort = (field: string) => {
    let direction = 'asc';
    if (pageFilters.sort_field === field && pageFilters.sort_direction === 'asc') {
      direction = 'desc';
    }

    const params: any = {
      page: 1,
      view: activeView,
      sort_field: field,
      sort_direction: direction,
      per_page: pageFilters.per_page || 10,
    };

    if (searchTerm) params.search = searchTerm;
    if (selectedStatus !== '_empty_') params.status = selectedStatus;
    if (selectedCategory !== '_empty_') params.category_id = selectedCategory;

    router.get(route('products.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handlePageChange = (url: string) => {
    if (url) {
      router.visit(url, { preserveState: true, preserveScroll: true });
    }
  };

  const handleActionClick = (action: string, permission: string, productId?: number) => {
    if (!checkPermission(permission, auth)) {
      return;
    }

    switch (action) {
      case 'view':
        router.visit(route('products.show', productId));
        break;
      case 'edit':
        router.visit(route('products.edit', productId));
        break;
      case 'delete':
        setProductToDelete(productId!);
        break;
      case 'create':
        router.visit(route('products.create'));
        break;
      case 'export':
        window.open(route('products.export'), '_blank');
        break;
    }
  };

  const handleDelete = () => {
    if (productToDelete && checkPermission('delete-products', auth)) {
      router.delete(route('products.destroy', productToDelete), {
        preserveScroll: true,
        onSuccess: (page: any) => {
          toast.dismiss();
          if (page?.props?.flash?.success) {
            toast.success(t(page.props.flash.success));
          } else if (page?.props?.flash?.error) {
            toast.error(t(page.props.flash.error));
          } else {
            toast.success(t('Product deleted successfully!'));
          }
          setProductToDelete(null);
        },
        onError: (errors: any) => {
          toast.dismiss();
          const firstError = Object.values(errors)[0] as string;
          toast.error(t(firstError || 'Failed to delete product'));
        }
      });
    }
  };

  // Status tabs: all, active, inactive (strictly as requested)
  const statusTabs = [
    {
      value: '_empty_',
      label: t('All'),
      icon: <LayoutGrid className="h-4 w-4" />,
      count: statusCounts.all ?? stats.total ?? 0,
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
      count: statusCounts.inactive ?? 0,
    },
  ];

  // Category filter options
  const categoryOptions = [
    { value: '_empty_', label: t('All Categories') },
    ...(Array.isArray(categories)
      ? categories.map((cat: any) => ({
          value: cat.id.toString(),
          label: cat.name,
        }))
      : []),
  ];

  // Table columns definition
  const columns: TableColumn[] = [
    {
      key: 'name',
      label: t('Product'),
      sortable: true,
      className: 'max-w-[280px] sm:max-w-sm md:max-w-md lg:max-w-lg',
      render: (value: string, row: any) => {
        const canView = hasPermission('view-products');
        return (
          <div className="flex items-center gap-3 max-w-[260px] sm:max-w-xs md:max-w-sm lg:max-w-md min-w-0">
            <div className="w-10 h-10 shrink-0 rounded-lg overflow-hidden border border-border/80 bg-muted/20 flex items-center justify-center">
              {row.cover_image ? (
                <img
                  src={getImageUrl(row.cover_image)}
                  alt={value}
                  className="w-full h-full object-cover cursor-pointer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getImageUrl('/storage/media/product/product.png');
                  }}
                  onClick={() => {window.open(getImageUrl(row.cover_image || '/storage/media/product/product.png'), '_blank');}}
                />
              ) : (
                <Package className="h-5 w-5 text-muted-foreground opacity-60" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              {canView ? (
                <a
                  href={route('products.show', row.id)}
                  onClick={(e) => {
                    e.preventDefault();
                    handleActionClick('view', 'view-products', row.id);
                  }}
                  className="font-semibold text-primary no-underline hover:no-underline hover:text-primary/80 transition-colors cursor-pointer truncate block max-w-[200px] sm:max-w-[240px] md:max-w-[320px] lg:max-w-[380px]"
                  title={value}
                >
                  {value}
                </a>
              ) : (
                <span
                  className="font-semibold text-zinc-900 dark:text-white truncate block max-w-[200px] sm:max-w-[240px] md:max-w-[320px] lg:max-w-[380px]"
                  title={value}
                >
                  {value}
                </span>
              )}
              {row.sku && (
                <p className="text-xs text-muted-foreground truncate" title={row.sku}>
                  {t('SKU: {{sku}}', { sku: row.sku })}
                </p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'category',
      label: t('Category'),
      sortable: false,
      render: (_: any, row: any) => {
        return row.category?.name ? (
          <RandomBadgeUI name={row.category.name} />
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        );
      },
    },
    {
      key: 'price',
      label: t('Price'),
      sortable: true,
      render: (value: number, row: any) => {
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-zinc-900 dark:text-white text-sm font-mono">
              {formatCurrency(row.sale_price || value || 0)}
            </span>
            {/* {row.sale_price && (
              <span className="text-xs line-through text-muted-foreground">
                {formatCurrency(value || 0)}
              </span>
            )} */}
          </div>
        );
      },
    },
    {
      key: 'stock',
      label: t('Stock'),
      sortable: true,
      render: (value: number) => {
        return (
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {value ?? 0}
          </span>
        );
      },
    },
    {
      key: 'is_active',
      label: t('Status'),
      sortable: true,
      render: (value: boolean) => {
        return (
          <BadgeUI 
            className={value 
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 font-medium text-xs' 
              : 'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20'
            }
          >
            {value ? t('Active') : t('Inactive')}
          </BadgeUI>
        );
      },
    },
  ];

  // Table actions definition
  const tableActions: TableAction[] = [
    ...(hasPermission('view-products') ? [{
      action: 'view',
      label: t('View'),
      icon: 'Eye',
      requiredPermission: 'view-products',
    }] : []),
    ...(hasPermission('edit-products') ? [{
      action: 'edit',
      label: t('Edit'),
      icon: 'Edit',
      requiredPermission: 'edit-products',
    }] : []),
    ...(hasPermission('delete-products') ? [{
      action: 'delete',
      label: t('Delete'),
      icon: 'Trash2',
      className: 'text-red-600',
      requiredPermission: 'delete-products',
    }] : []),
  ];

  const handleTableAction = (action: string, row: any) => {
    switch (action) {
      case 'view':
        handleActionClick('view', 'view-products', row.id);
        break;
      case 'edit':
        handleActionClick('edit', 'edit-products', row.id);
        break;
      case 'delete':
        handleActionClick('delete', 'delete-products', row.id);
        break;
    }
  };

  const pageActions = [
    ...(hasPermission('export-products') ? [{
      label: t('Export'),
      icon: <Download className="h-4 w-4" />,
      variant: 'outline' as const,
      onClick: () => handleActionClick('export', 'export-products'),
    }] : []),
    ...(hasPermission('create-products') ? [{
      label: t('Create Product'),
      icon: <Plus className="h-4 w-4" />,
      variant: 'default' as const,
      onClick: () => handleActionClick('create', 'create-products'),
    }] : []),
  ];

  return (
    <PageTemplate 
      title={t('Products')}
      url="/products"
      actions={pageActions}
      breadcrumbs={[
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Product Management'), href: route('products.index') },
        { title: t('Products') }
      ]}
      noPadding
      description={t('Manage your product catalog, pricing, categories, and inventory levels.')}
    >
      <div className="space-y-4 sm:space-y-6">

        {/* 1. TOP KPI STATS CARDS */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
          
          {/* Card 1: Total Products */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-blue-50 dark:bg-blue-900/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {t('Total Products')}
                </p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl">
                  {stats.total ?? 0}
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {t('All product catalog')}
                  </span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-blue-100 p-2.5 dark:bg-blue-900/40 sm:p-3">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400 sm:h-7 sm:w-7" />
              </div>
            </div>
          </div>

          {/* Card 2: Active Products */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-emerald-50 dark:bg-emerald-950/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {t('Active Products')}
                </p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl">
                  {stats.active ?? 0}
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {t('{{percent}}% active rate', {
                      percent: stats.total > 0 ? Math.round(((stats.active || 0) / stats.total) * 100) : 0,
                    })}
                  </span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-emerald-100 p-2.5 dark:bg-emerald-900/40 sm:p-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 sm:h-7 sm:w-7" />
              </div>
            </div>
          </div>

          {/* Card 3: Low Stock Alert */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-amber-50 dark:bg-amber-950/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {t('Low Stock')}
                </p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl">
                  {stats.lowStock ?? 0}
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    {t('Need restocking')}
                  </span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-amber-100 p-2.5 dark:bg-amber-900/40 sm:p-3">
                <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400 sm:h-7 sm:w-7" />
              </div>
            </div>
          </div>

          {/* Card 4: Total Inventory Value */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-purple-50 dark:bg-purple-950/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {t('Total Value')}
                </p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl font-mono">
                  {formatCurrency(stats.totalValue ?? 0)}
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                    {t('Inventory valuation')}
                  </span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-purple-100 p-2.5 dark:bg-purple-900/40 sm:p-3">
                <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400 sm:h-7 sm:w-7" />
              </div>
            </div>
          </div>

        </div>

        {/* 2. SEARCH, STATUS TABS & FILTER BAR WITH VIEW TOGGLE */}
        <div className="mb-4 rounded-lg border bg-white shadow dark:bg-gray-900">
          <SearchAndFilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onSearch={handleSearch}
            searchPlaceholder={t('Search products by name, SKU...')}
            statusTabs={statusTabs}
            activeStatusTab={selectedStatus}
            onStatusTabChange={handleStatusFilter}
            filters={[
              {
                name: 'category_id',
                label: t('Category'),
                type: 'select',
                value: selectedCategory,
                onChange: handleCategoryFilter,
                options: categoryOptions,
              },
            ]}
            hasActiveFilters={hasActiveFilters}
            activeFilterCount={activeFilterCount}
            onResetFilters={handleResetFilters}
            showViewToggle={true}
            activeView={activeView}
            onViewChange={handleViewChange}
            viewOptions={[
              { value: 'list', label: t('List View'), icon: 'List' },
              { value: 'grid', label: t('Grid View'), icon: 'Grid3X3' },
            ]}
          />
        </div>

        {/* 3. PRODUCTS DATA CONTENT (TABLE VIEW OR GRID VIEW) */}
        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
          
          {activeView === 'list' ? (
            /* LIST / TABLE VIEW */
            <CrudTable
              columns={columns}
              actions={tableActions}
              data={productList}
              from={products?.from || 1}
              onAction={handleTableAction}
              sortField={pageFilters.sort_field}
              sortDirection={pageFilters.sort_direction}
              onSort={handleSort}
              permissions={permissions}
              entityPermissions={{
                view: 'view-products',
                edit: 'edit-products',
                delete: 'delete-products',
              }}
            />
          ) : (
            /* GRID VIEW */
            <div>
              {productList.length === 0 ? (
                <div className="p-8 sm:p-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground opacity-40 mb-3" />
                  <h4 className="text-base font-semibold text-foreground">{t('No products found')}</h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    {t('Try adjusting your search query, status tab, or category filters.')}
                  </p>
                  {hasPermission('create-products') && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => handleActionClick('create', 'create-products')}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t('Create your first product')}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="p-4 sm:p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4">
                    {productList.map((product: any) => {
                      const canView = hasPermission('view-products');

                      return (
                        <div
                          key={product.id}
                          className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xs transition-all duration-200 hover:shadow-md hover:border-primary/40 dark:border-zinc-800 dark:bg-zinc-900"
                        >
                          {/* Image Cover Container */}
                          <div className="relative h-40 sm:h-44 w-full flex items-center justify-center bg-zinc-50/60 dark:bg-zinc-800/20 p-2.5 sm:p-3 border-b border-zinc-100 dark:border-zinc-800/60">
                            {product.cover_image ? (
                              <img
                                src={getImageUrl(product.cover_image)}
                                alt={product.name}
                                className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105 cursor-pointer" 
                                onClick={() => {window.open(getImageUrl(product.cover_image), '_blank');}}
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-zinc-300 dark:text-zinc-600">
                                <Package className="h-12 w-12 stroke-1" />
                              </div>
                            )}
                          </div>

                          {/* Product Details Body */}
                          <div className="flex-1 p-3 sm:p-3.5 flex flex-col justify-between space-y-3">
                            <div className="space-y-2">
                              {/* Category (Above Title with Category Icon) & Status Badge */}
                              <div className="flex items-center justify-between gap-2">
                                {product.category?.name ? (
                                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground min-w-0">
                                    <Tag className="h-3.5 w-3.5 text-primary shrink-0" />
                                    <span className="truncate">{product.category.name}</span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">
                                    {t('Uncategorized')}
                                  </span>
                                )}

                                <BadgeUI
                                  className={
                                    product.is_active
                                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-400 font-medium text-xs shrink-0'
                                      : 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/15 dark:text-rose-400 font-medium text-xs shrink-0'
                                  }
                                >
                                  {product.is_active ? t('Active') : t('Inactive')}
                                </BadgeUI>
                              </div>

                              {/* Product Title & SKU */}
                              <div>
                                {canView ? (
                                  <a
                                    href={route('products.show', product.id)}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleActionClick('view', 'view-products', product.id);
                                    }}
                                    className="font-bold text-sm text-zinc-900 dark:text-white hover:text-primary no-underline hover:no-underline transition-colors block truncate"
                                    title={product.name}
                                  >
                                    {product.name}
                                  </a>
                                ) : (
                                  <span
                                    className="font-bold text-sm text-zinc-900 dark:text-white block truncate"
                                    title={product.name}
                                  >
                                    {product.name}
                                  </span>
                                )}

                                {product.sku && (
                                  <p
                                    className="text-[11px] text-muted-foreground truncate font-mono mt-0.5"
                                    title={product.sku}
                                  >
                                    {t('SKU: {{sku}}', { sku: product.sku })}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Pricing & Stock Card (Themed with primary color) */}
                            <div className="flex items-center justify-between rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/30 py-2 px-3">
                              <div className="flex flex-col min-w-0">
                                <span className="text-[10px] font-medium text-muted-foreground leading-none mb-1">
                                  {product.sale_price ? t('Sale Price') : t('Price')}
                                </span>
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-sm sm:text-base font-bold text-primary truncate leading-tight font-mono">
                                    {formatCurrency(product.sale_price ? product.sale_price : product.price)}
                                  </span>
                                  {product.sale_price && product.price && (
                                    <span className="text-[11px] text-muted-foreground line-through font-mono">
                                      {formatCurrency(product.price)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col items-end shrink-0 pl-2">
                                <span className="text-[10px] font-medium text-muted-foreground leading-none mb-1">
                                  {t('Stock')}
                                </span>
                                <span
                                  className={`text-xs font-semibold flex items-center gap-1 ${
                                    (product.stock ?? 0) <= 0
                                      ? 'text-rose-600 dark:text-rose-400'
                                      : (product.stock ?? 0) < 10
                                      ? 'text-amber-600 dark:text-amber-400'
                                      : 'text-zinc-700 dark:text-zinc-300'
                                  }`}
                                >
                                  <ShoppingCart className="h-3 w-3" />
                                  <span>{t('{{stock}} units', { stock: product.stock ?? 0 })}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Product Card Actions Footer - Neutral Colored Icons with Tooltips */}
                          <div className="py-2.5 px-3.5 min-h-[44px] border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-1.5">
                            <TooltipProvider delayDuration={150}>
                              {hasPermission('view-products') && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={() => handleActionClick('view', 'view-products', product.id)}
                                      className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>{t('View')}</TooltipContent>
                                </Tooltip>
                              )}
                              {hasPermission('edit-products') && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={() => handleActionClick('edit', 'edit-products', product.id)}
                                      className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>{t('Edit')}</TooltipContent>
                                </Tooltip>
                              )}
                              {hasPermission('delete-products') && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={() => handleActionClick('delete', 'delete-products', product.id)}
                                      className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>{t('Delete')}</TooltipContent>
                                </Tooltip>
                              )}
                            </TooltipProvider>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. PAGINATION COMPONENT */}
          <Pagination
            from={products?.from || 0}
            to={products?.to || 0}
            total={products?.total || 0}
            links={products?.links}
            entityName={t('products')}
            perPageOptions={[10, 25, 50, 100]}
            currentPerPage={pageFilters.per_page?.toString() || '10'}
            onPerPageChange={(value) => {
              const params: any = {
                page: 1,
                view: activeView,
                per_page: parseInt(value),
              };

              if (searchTerm) params.search = searchTerm;
              if (selectedStatus !== '_empty_') params.status = selectedStatus;
              if (selectedCategory !== '_empty_') params.category_id = selectedCategory;
              if (pageFilters.sort_field) params.sort_field = pageFilters.sort_field;
              if (pageFilters.sort_direction) params.sort_direction = pageFilters.sort_direction;

              router.get(route('products.index'), params, { preserveState: true, preserveScroll: true });
            }}
            onPageChange={handlePageChange}
          />
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      <CrudDeleteModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleDelete}
        itemName={productList.find((p: any) => p.id === productToDelete)?.name || ''}
        entityName={t('product')}
      />
    </PageTemplate>
  );
}