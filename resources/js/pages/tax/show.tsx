import React from 'react';
import { PageTemplate } from '@/components/page-template';
import { 
  ArrowLeft, 
  ArrowUpDown, 
  Calculator, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Edit, 
  Layers, 
  Package, 
  Percent, 
  Receipt, 
  Tag, 
  TrendingUp, 
  XCircle 
} from 'lucide-react';
import BadgeUI from '@/components/badge-ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTranslation } from 'react-i18next';
import { Head, router, usePage } from '@inertiajs/react';
import { getImageUrl } from '@/utils/image-helper';
import { formatCurrency } from '@/utils/currency-helper';
import { hasPermission, checkPermission } from '@/utils/permissions';

export default function ShowTax() {
  const { t } = useTranslation();
  const { tax, stats = {}, products = [], auth, currencySymbol } = usePage().props as any;

  const handleActionClick = (action: string, permission: string) => {
    if (!checkPermission(permission, auth)) {
      return;
    }
    
    switch (action) {
      case 'edit':
        router.visit(route('tax.edit', tax.id));
        break;
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    return window.appSettings?.formatDateTime(dateString, false);
  };

  const pageActions = [
    // ...(hasPermission('edit-tax', auth) ? [{
    //   label: t('Edit Tax'),
    //   icon: <Edit className="h-4 w-4" />,
    //   variant: 'default' as const,
    //   onClick: () => handleActionClick('edit', 'edit-tax')
    // }] : [])
  ];

  return (
    <PageTemplate 
      title={tax?.name || t('Tax Details')}
      description={t('View detailed tax rule parameters, performance metrics, and linked products.')}
      url="/tax/show"
      actions={pageActions}
      backUrl={route('tax.index')}
      breadcrumbs={[
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Product Management'), href: route('products.index') },
        { title: t('Tax'), href: route('tax.index') },
        { title: tax?.name || t('Tax Details') }
      ]}
      noPadding
    >
      <Head title={`${tax?.name || t('Tax Details')} - ${t('Tax Details')}`} />

      <div className="space-y-6">
        {/* 1. TOP KPI METRICS (4 Columns matching signature app layout) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Tax Collected This Month */}
          <div className="border-border/80 bg-card relative overflow-hidden rounded-xl border p-4 shadow-xs transition-shadow duration-200 hover:shadow-md sm:p-5 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-emerald-50 dark:bg-emerald-950/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-muted-foreground mb-1 text-sm font-medium">{t('Collected This Month')}</p>
                <p className="text-foreground text-xl font-bold sm:text-2xl font-mono">{formatCurrency(stats?.collected || 0)}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {t('Current billing cycle')}
                  </span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-emerald-100 p-2.5 sm:p-3 dark:bg-emerald-900/40">
                <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Card 2: Orders Applied */}
          <div className="border-border/80 bg-card relative overflow-hidden rounded-xl border p-4 shadow-xs transition-shadow duration-200 hover:shadow-md sm:p-5 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-blue-50 dark:bg-blue-950/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-muted-foreground mb-1 text-sm font-medium">{t('Orders Applied')}</p>
                <p className="text-foreground text-xl font-bold sm:text-2xl">{stats?.orders || 0}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {t('Total orders processed')}
                  </span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-blue-100 p-2.5 sm:p-3 dark:bg-blue-900/40">
                <Receipt className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Card 3: Total Tax Collected */}
          <div className="border-border/80 bg-card relative overflow-hidden rounded-xl border p-4 shadow-xs transition-shadow duration-200 hover:shadow-md sm:p-5 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-purple-50 dark:bg-purple-950/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-muted-foreground mb-1 text-sm font-medium">{t('Total Tax Collected')}</p>
                <p className="text-foreground text-xl font-bold sm:text-2xl font-mono">{formatCurrency(stats?.total || 0)}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                    {t('Lifetime rule revenue')}
                  </span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-purple-100 p-2.5 sm:p-3 dark:bg-purple-900/40">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          {/* Card 4: Products Using Tax */}
          <div className="border-border/80 bg-card relative overflow-hidden rounded-xl border p-4 shadow-xs transition-shadow duration-200 hover:shadow-md sm:p-5 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-amber-50 dark:bg-amber-950/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-muted-foreground mb-1 text-sm font-medium">{t('Products Linked')}</p>
                <p className="text-foreground text-xl font-bold sm:text-2xl">{stats?.products_count || products?.length || 0}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    {t('Catalog products assigned')}
                  </span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-amber-100 p-2.5 sm:p-3 dark:bg-amber-900/40">
                <Package className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>
        </div>

        {/* 2. MIDDLE SECTION (2 Columns: Tax Rule Information & Configuration Timeline) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Tax Rule Information */}
          <div className="lg:col-span-8 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#00a86b] dark:text-emerald-400">
                  <Calculator className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {t('Tax Rule Information')}
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Tax Name */}
                <div className="flex items-start gap-4">
                  <Tag className="h-5 w-5 text-muted-foreground/70 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">{t('Tax Name')}</p>
                    <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{tax?.name}</p>
                  </div>
                </div>

                {/* Tax Rate & Type */}
                <div className="flex items-start gap-4">
                  <Percent className="h-5 w-5 text-muted-foreground/70 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">{t('Tax Rate & Calculation Type')}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                        {tax?.type === 'fixed' ? currencySymbol : ''}{tax?.rate}{tax?.type === 'percentage' ? '%' : ''}
                      </span>
                      <BadgeUI
                        className={tax?.type === 'percentage'
                          ? 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/40 dark:text-blue-400 capitalize'
                          : 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-950/40 dark:text-purple-400 capitalize'
                        }
                      >
                        {tax?.type === 'percentage' ? t('Percentage') : t('Fixed Amount')}
                      </BadgeUI>
                    </div>
                  </div>
                </div>

                {/* Status using BadgeUI */}
                <div className="flex items-start gap-4">
                  <Clock className="h-5 w-5 text-muted-foreground/70 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">{t('Status')}</p>
                    <div className="mt-1">
                      <BadgeUI
                        className={tax?.is_active
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-500/10 dark:text-red-400'
                        }
                      >
                        {tax?.is_active ? (
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600 dark:text-emerald-400 inline" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 mr-1 text-red-500 inline" />
                        )}
                        {tax?.is_active ? t('Active') : t('Inactive')}
                      </BadgeUI>
                    </div>
                  </div>
                </div>

                {/* Priority */}
                <div className="flex items-start gap-4">
                  <ArrowUpDown className="h-5 w-5 text-muted-foreground/70 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">{t('Calculation Priority')}</p>
                    <div className="mt-1">
                      <BadgeUI className="bg-gray-100 text-gray-700 ring-gray-500/20 dark:bg-gray-800 dark:text-gray-300 font-mono">
                        {t('Priority')} {tax?.priority ?? 1}
                      </BadgeUI>
                    </div>
                  </div>
                </div>

                {/* Compound Tax */}
                <div className="flex items-start gap-4">
                  <Layers className="h-5 w-5 text-muted-foreground/70 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">{t('Compound Tax')}</p>
                    <div className="mt-1">
                      <BadgeUI className={tax?.compound 
                        ? 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-400' 
                        : 'bg-zinc-100 text-zinc-700 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-300'
                      }>
                        {tax?.compound ? t('Yes (Compound Rule)') : t('No (Standard Calculation)')}
                      </BadgeUI>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Configuration & Timeline Metadata */}
          <div className="lg:col-span-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#00a86b] dark:text-emerald-400">
                  <Calendar className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {t('Configuration & Dates')}
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Method Summary Banner */}
                <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/50">
                  <p className="text-xs font-medium text-muted-foreground mb-1">{t('Application Logic')}</p>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal">
                    {tax?.type === 'percentage'
                      ? t('Applied as {{rate}}% calculation on taxable product subtotal.', { rate: tax?.rate })
                      : t('Applied as a flat {{rate}} fee per taxable product transaction.', { rate: `${currencySymbol}${tax?.rate}` })}
                  </p>
                </div>

                {/* Created Date */}
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center justify-center shrink-0">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{t('Created Date')}</p>
                    <p className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {formatDate(tax?.created_at)}
                    </p>
                  </div>
                </div>

                {/* Updated Date */}
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{t('Last Updated')}</p>
                    <p className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {formatDate(tax?.updated_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. PRODUCTS USING THIS TAX RULE (Table Format) */}
        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#00a86b] dark:text-emerald-400">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {t('Products Using This Tax')}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {t('Catalog products associated with this tax rule')}
                </p>
              </div>
            </div>
            <div>
              <BadgeUI className="bg-zinc-100 text-zinc-700 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-300 font-medium">
                {t('{{count}} Products', { count: products?.length || 0 })}
              </BadgeUI>
            </div>
          </div>

          <div>
            {products && products.length > 0 ? (
              <div className="max-h-[400px] overflow-x-auto overflow-y-auto scrollbar-thin">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-[#F0F0F1] dark:bg-zinc-800 shadow-2xs">
                    <TableRow className="bg-[#F0F0F1] hover:bg-[#F0F0F1] dark:border-zinc-800 dark:bg-zinc-800 border-t border-b border-zinc-200 dark:border-zinc-800">
                      <TableHead className="px-6 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                        {t('Product')}
                      </TableHead>
                      <TableHead className="px-4 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                        {t('Price')}
                      </TableHead>
                      <TableHead className="px-6 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                        {t('Status')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product: any) => (
                      <TableRow key={product.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                        {/* Product Image + Name & SKU */}
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-3.5">
                            <img
                              src={product.cover_image ? getImageUrl(product.cover_image) : getImageUrl('/storage/media/product/product.png')}
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover border border-zinc-200/80 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = getImageUrl('/storage/media/product/product.png');
                              }}
                            />
                            <div className="min-w-0">
                              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 block truncate max-w-xs sm:max-w-md">
                                {product.name}
                              </span>
                              {product.sku && (
                                <p className="text-xs text-muted-foreground truncate mt-0.5" title={product.sku}>
                                  {t('SKU: {{sku}}', { sku: product.sku })}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Price */}
                        <TableCell className="px-4 py-4">
                          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
                            {product.formatted_price || formatCurrency(product.price)}
                          </span>
                        </TableCell>

                        {/* Status */}
                        <TableCell className="px-6 py-4">
                          <BadgeUI
                            className={product.is_active
                              ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400 font-medium text-xs'
                              : 'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-500/10 dark:text-red-400 font-medium text-xs'
                            }
                          >
                            {product.is_active ? t('Active') : t('Inactive')}
                          </BadgeUI>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 p-6">
                <div className="mx-auto w-14 h-14 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-3 text-muted-foreground">
                  <Package className="h-7 w-7 opacity-60" />
                </div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                  {t('No Products Linked')}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  {t('There are currently no products in your catalog using this tax rule.')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}