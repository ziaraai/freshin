import React from 'react';
import { PageTemplate } from '@/components/page-template';
import { 
  ArrowLeft, 
  Edit, 
  MapPin, 
  Clock, 
  Package, 
  Truck, 
  DollarSign, 
  Globe, 
  SlidersHorizontal, 
  ShieldCheck, 
  Box, 
  Scale, 
  Percent, 
  Gift, 
  CheckCircle2, 
  TrendingUp, 
  Eye, 
  Calendar, 
  ArrowUpRight, 
  Info 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import { formatCurrency } from '@/utils/currency-helper';
import { hasPermission, checkPermission } from '@/utils/permissions';
import BadgeUI from '@/components/badge-ui';
import UserInitials from '@/components/user-initials';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getImageUrl } from '@/utils/image-helper';

export default function ShowShipping() {
  const { t } = useTranslation();
  const { shipping, stats, recentOrders, auth } = usePage().props as any;

  const canEdit = hasPermission('edit-shipping');
  const canManageOrders = hasPermission('manage-orders');
  const canViewOrders = hasPermission('view-orders');

  const handleActionClick = (action: string, callback: () => void) => {
    if (checkPermission(action, auth)) {
      callback();
    }
  };

  const pageActions = [
    // ...(canEdit ? [{
    //   label: t('Edit Shipping'),
    //   icon: <Edit className="h-4 w-4" />,
    //   variant: 'default' as const,
    //   onClick: () => handleActionClick('edit-shipping', () => router.visit(route('shipping.edit', shipping.id)))
    // }] : [])
  ];

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      if (typeof window !== 'undefined' && (window as any).appSettings?.formatDateTime) {
        const formatted = (window as any).appSettings.formatDateTime(dateString, false);
        if (formatted) return formatted;
      }
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return String(dateString);
    }
  };

  const getTypeLabel = (type: string) => {
    if (!type) return '';
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getMethodIcon = () => {
    switch (shipping.type) {
      case 'free_shipping':
        return <Gift className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case 'weight_based':
        return <Scale className="h-4 w-4 text-primary" />;
      case 'distance_based':
        return <MapPin className="h-4 w-4 text-primary" />;
      case 'percentage_based':
        return <Percent className="h-4 w-4 text-primary" />;
      default:
        return <Truck className="h-4 w-4 text-primary" />;
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return <BadgeUI className="bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 font-medium">{t('Delivered')}</BadgeUI>;
      case 'processing':
        return <BadgeUI className="bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/30 dark:text-blue-400 font-medium">{t('Processing')}</BadgeUI>;
      case 'pending':
        return <BadgeUI className="bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/30 dark:text-amber-400 font-medium">{t('Pending')}</BadgeUI>;
      case 'cancelled':
        return <BadgeUI className="bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-950/30 dark:text-rose-400 font-medium">{t('Cancelled')}</BadgeUI>;
      default:
        return <BadgeUI className="bg-zinc-50 text-zinc-700 ring-zinc-600/20 dark:bg-zinc-800 dark:text-zinc-300 font-medium">{status}</BadgeUI>;
    }
  };

  return (
    <PageTemplate 
      title={shipping?.name || t('Shipping Method Details')}
      url="/shipping/show"
      actions={pageActions}
      backUrl={route('shipping.index')}
      breadcrumbs={[
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Shipping Management'), href: route('shipping.index') },
        { title: t('Shipping Method Details') }
      ]}
      description={t('View and manage shipping details.')}
    >
      <div className="space-y-6">

        {/* 1. UNIFIED TOP KPI METRICS (3 Columns - Project Standard Style) */}
        <div className="grid grid-cols-1 gap-4 sm:gap-4 md:grid-cols-4">
          {/* Card 1: Total Revenue */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-emerald-50 dark:bg-emerald-950/20  rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Total Revenue')}</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl font-mono">{formatCurrency(stats?.total_revenue || 0)}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{t('From shipping charges')}</span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-emerald-100 p-2.5 dark:bg-emerald-900/40 sm:p-3">
                <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400 sm:h-7 sm:w-7" />
              </div>
            </div>
          </div>

          {/* Card 2: Total Orders */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-blue-50 dark:bg-blue-900/20  rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Total Orders')}</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl">{stats?.total_orders || 0}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {stats?.recent_orders ? `${stats.recent_orders} ${t('in last 30 days')}` : t('All-time order count')}
                  </span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-blue-100 p-2.5 dark:bg-blue-900/40 sm:p-3">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400 sm:h-7 sm:w-7" />
              </div>
            </div>
          </div>

          {/* Card 3: Delivery Rate */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-indigo-50 dark:bg-indigo-950/20  rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Delivery Rate')}</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl">{Math.round(stats?.delivery_rate || 0)}%</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    {stats?.delivered_orders || 0} {t('orders delivered')}
                  </span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-indigo-100 p-2.5 dark:bg-indigo-900/40 sm:p-3">
                <CheckCircle2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400 sm:h-7 sm:w-7" />
              </div>
            </div>
          </div>

          {/* Avg. Delivery Days */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-indigo-50 dark:bg-indigo-950/20  rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Avg. Delivery Days')}</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl">{Math.round(stats?.avg_delivery_days || 0)}%</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    {t('Average delivery days')}
                  </span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-indigo-100 p-2.5 dark:bg-indigo-900/40 sm:p-3">
                <CheckCircle2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400 sm:h-7 sm:w-7" />
              </div>
            </div>
          </div>

        </div>

        {/* 2. TWO-COLUMN BALANCED DASHBOARD (8 Cols Left, 4 Cols Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: PRIMARY CONFIGURATION & RECENT ORDERS (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">

            {/* Pricing & Order Qualification Rules */}
            <Card className="border-border shadow-2xs">
              <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">{t('Pricing & Calculation Rules')}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('Cost models, threshold minimums, and service fees')}</p>
                  </div>
                </div>
                <BadgeUI 
                  className={shipping.is_active 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-medium text-xs' 
                    : 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20 font-medium text-xs'
                  }
                >
                  {shipping.is_active ? t('Active') : t('Inactive')}
                </BadgeUI>
              </CardHeader>
              <CardContent className="!pt-5">
                {shipping.description && (
                  <div className="mb-4 p-3.5 rounded-xl border border-border bg-muted/20 text-xs sm:text-sm text-muted-foreground leading-relaxed flex items-start gap-2.5">
                    <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground text-xs block mb-0.5">{t('Description')}</span>
                      <p>{shipping.description}</p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Calculation Type */}
                  <div className="p-3.5 rounded-xl border border-border bg-muted/20">
                    <span className="text-xs font-medium text-muted-foreground block">{t('Calculation Type')}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="p-1 rounded-md bg-primary/10 text-primary">
                        {getMethodIcon()}
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {getTypeLabel(shipping.type)}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground mt-1 block">
                      {shipping.type === 'free_shipping' 
                        ? t('Zero base shipping fee') 
                        : shipping.type === 'percentage_based'
                        ? t('Calculated from cart subtotal')
                        : t('Standard fixed or scaled formula')}
                    </span>
                  </div>

                  {/* Base Cost / Rate */}
                  <div className="p-3.5 rounded-xl border border-border bg-muted/20">
                    <span className="text-xs font-medium text-muted-foreground block">
                      {shipping.type === 'percentage_based' ? t('Percentage Rate') : t('Shipping Cost')}
                    </span>
                    <span className="text-base font-bold text-foreground mt-1 block">
                      {shipping.type === 'free_shipping' ? (
                        <span className="text-emerald-600 dark:text-emerald-400">{t('Free')}</span>
                      ) : shipping.type === 'percentage_based' ? (
                        `${shipping.cost}%`
                      ) : (
                        <span className="font-mono">{formatCurrency(shipping.cost || 0)}</span>
                      )}
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5 block">
                      {t('Base delivery charge per checkout')}
                    </span>
                  </div>

                  {/* Minimum Order */}
                  <div className="p-3.5 rounded-xl border border-border bg-muted/20">
                    <span className="text-xs font-medium text-muted-foreground block">{t('Minimum Order')}</span>
                    <span className="text-sm font-semibold text-foreground mt-1 block">
                      {shipping.min_order_amount > 0 ? (
                        <span className="font-mono">{formatCurrency(shipping.min_order_amount)}</span>
                      ) : '-'}
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5 block">
                      {shipping.min_order_amount > 0 ? t('Cart subtotal required') : t('Applies to all order sizes')}
                    </span>
                  </div>

                  {/* Handling Fee */}
                  <div className="p-3.5 rounded-xl border border-border bg-muted/20">
                    <span className="text-xs font-medium text-muted-foreground block">{t('Handling Fee')}</span>
                    <span className="text-sm font-semibold text-foreground mt-1 block">
                      {shipping.handling_fee > 0 ? (
                        <span className="font-mono">{formatCurrency(shipping.handling_fee)}</span>
                      ) : '-'}
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5 block">
                      {t('Packaging or surcharge fee')}
                    </span>
                  </div>

                  {/* Estimated Delivery Time */}
                  <div className="p-3.5 rounded-xl border border-border bg-muted/20 sm:col-span-2">
                    <span className="text-xs font-medium text-muted-foreground block">{t('Estimated Delivery Time')}</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-semibold text-foreground">
                        {shipping.delivery_time || t('Not specified')}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground mt-0.5 block">
                      {t('Expected transit turnaround shown to buyer')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery & Security Options + Parcel Limits */}
            <Card className="border-border shadow-2xs">
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <SlidersHorizontal className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">{t('Fulfillment, Security & Limits')}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('Parcel restrictions and package safety options')}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="!pt-5 space-y-4">
                
                {/* 3 Interactive Feature Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Tracking Available */}
                  <div className="p-3.5 rounded-xl border border-border bg-card flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <Truck className="h-4 w-4" />
                      </div>
                      <BadgeUI 
                        className={shipping.tracking_available 
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' 
                          : 'bg-zinc-50 text-zinc-700 ring-zinc-600/20'
                        }
                      >
                        {shipping.tracking_available ? t('Enabled') : t('Disabled')}
                      </BadgeUI>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-foreground block">{t('Tracking Available')}</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {t('Parcel tracking codes sent to buyers')}
                      </p>
                    </div>
                  </div>

                  {/* Require Signature */}
                  <div className="p-3.5 rounded-xl border border-border bg-card flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <BadgeUI 
                        className={shipping.require_signature 
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' 
                          : 'bg-zinc-50 text-zinc-700 ring-zinc-600/20'
                        }
                      >
                        {shipping.require_signature ? t('Required') : t('Optional')}
                      </BadgeUI>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-foreground block">{t('Require Signature')}</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {t('Recipient signature collected on drop')}
                      </p>
                    </div>
                  </div>

                  {/* Insurance Required */}
                  <div className="p-3.5 rounded-xl border border-border bg-card flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <BadgeUI 
                        className={shipping.insurance_required 
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' 
                          : 'bg-zinc-50 text-zinc-700 ring-zinc-600/20'
                        }
                      >
                        {shipping.insurance_required ? t('Mandatory') : t('None')}
                      </BadgeUI>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-foreground block">{t('Insurance Required')}</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {t('Coverage against loss or transit damage')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Parcel Limitations (Weight & Dimensions) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="p-3.5 rounded-xl border border-border bg-muted/20 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-background border border-border text-muted-foreground shrink-0">
                      <Scale className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground block">{t('Maximum Weight')}</span>
                      <span className="text-sm font-semibold text-foreground">
                        {shipping.max_weight ? `${shipping.max_weight} kg` : t('Unlimited')}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-border bg-muted/20 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-background border border-border text-muted-foreground shrink-0">
                      <Box className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground block">{t('Maximum Dimensions')}</span>
                      <span className="text-sm font-semibold text-foreground">
                        {shipping.max_dimensions || t('Unlimited')}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Orders Using This Shipping Method */}
            {canManageOrders && (
              <Card className="border-border shadow-2xs">
                <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-foreground">
                        {t('Recent Orders Using This Method')}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t('Latest transactions fulfilled with this shipping profile')}
                      </p>
                    </div>
                  </div>
                  {recentOrders && recentOrders.length > 0 && (
                    <BadgeUI className="text-xs font-semibold">
                      {recentOrders.length} {t('Recent')}
                    </BadgeUI>
                  )}
                </CardHeader>
                <CardContent className="!p-0">
                  {recentOrders && recentOrders.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table className="w-full">
                        <TableHeader>
                          <TableRow className="border-b bg-[#F0F0F1] hover:!bg-[#F0F0F1] dark:bg-gray-800 dark:hover:!bg-gray-800">
                            <TableHead className="py-2.5 px-4 text-start font-semibold text-zinc-900 dark:text-zinc-100">{t('Order Number')}</TableHead>
                            <TableHead className="py-2.5 px-4 text-start font-semibold text-zinc-900 dark:text-zinc-100">{t('Customer')}</TableHead>
                            <TableHead className="py-2.5 px-4 text-start font-semibold text-zinc-900 dark:text-zinc-100">{t('Date')}</TableHead>
                            <TableHead className="py-2.5 px-4 text-end font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">{t('Shipping Cost')}</TableHead>
                            <TableHead className="py-2.5 px-4 text-center font-semibold text-zinc-900 dark:text-zinc-100">{t('Status')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentOrders.map((order: any) => (
                            <TableRow key={order.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                              <TableCell className="py-3 px-4 text-start whitespace-nowrap">
                                {canViewOrders ? (
                                  <a
                                    href={route('orders.show', order.id)}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      router.visit(route('orders.show', order.id));
                                    }}
                                    className="font-semibold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    {order.order_number}
                                    <ArrowUpRight className="h-3.5 w-3.5 opacity-70 rtl:rotate-[-90deg]" />
                                  </a>
                                ) : (
                                  <span className="font-semibold text-foreground">
                                    {order.order_number}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="py-3 px-4 text-start">
                                <div className="flex items-center gap-3">
                                  <div className="shrink-0">
                                    {/* <UserInitials name={order.customer_name} /> */}
                                    <Avatar className="h-10 w-10 shrink-0 border border-zinc-200 dark:border-zinc-800">
                                      <AvatarImage src={getImageUrl(order.customer_avatar || '/storage/media/avatars/avatar.png')} alt={order.customer_name} className="object-cover" />
                                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                                        <img src={getImageUrl(order.customer_avatar || '/storage/media/avatars/avatar.png')} alt={order.customer_name} className="object-cover rounded-full" />
                                      </AvatarFallback>
                                    </Avatar>
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-sm font-semibold text-foreground block truncate">
                                      {order.customer_name || '-'}
                                    </span>
                                    {order.customer_email && (
                                      <span className="text-xs text-muted-foreground block truncate">
                                        {order.customer_email}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-3 px-4 text-start text-xs text-muted-foreground whitespace-nowrap">
                                <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden text-ellipsis text-gray-500">
                                  {(order.created_at || order.date) && <Calendar className="h-4 w-4 shrink-0" />}
                                  <span>{window.appSettings?.formatDateTime(order.created_at || order.date, false) || formatDate(order.created_at || order.date)}</span>
                                </div>
                              </TableCell>
                              <TableCell className="py-3 px-4 text-end font-bold text-foreground text-sm font-mono">
                                {formatCurrency(order.shipping_cost || 0)}
                              </TableCell>
                              <TableCell className="py-3 px-4 text-center">
                                {getOrderStatusBadge(order.status)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="h-10 w-10 mx-auto rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
                        <Package className="h-5 w-5" />
                      </div>
                      <h4 className="text-sm font-semibold text-foreground">{t('No Orders Yet')}</h4>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                        {t('No customers have placed orders using this shipping method yet.')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT COLUMN: COVERAGE, PERFORMANCE & METADATA (4 Cols) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6 self-start">

            {/* Shipping Zones & Geographic Coverage */}
            <Card className="border-border shadow-2xs">
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">{t('Geographic Coverage')}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('Target regional boundary rules')}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="!pt-4 space-y-3.5">
                <div className="flex items-center justify-between py-1 border-b border-border/60">
                  <span className="text-xs font-medium text-muted-foreground">{t('Zone Type')}</span>
                  <span className="text-xs font-semibold text-foreground">
                    {shipping.zone_type ? getTypeLabel(shipping.zone_type) : '-'}
                  </span>
                </div>

                <div className="space-y-1.5 py-1 border-b border-border/60">
                  <span className="text-xs font-medium text-muted-foreground block">{t('Supported Countries')}</span>
                  <p className="text-xs font-medium text-foreground bg-muted/30 p-2 rounded-lg break-words leading-relaxed">
                    {shipping.countries || '-'}
                  </p>
                </div>

                <div className="space-y-1.5 py-1 border-b border-border/60">
                  <span className="text-xs font-medium text-muted-foreground block">{t('Postal Codes / ZIPs')}</span>
                  <p className="text-xs font-medium text-foreground bg-muted/30 p-2 rounded-lg break-words leading-relaxed">
                    {shipping.postal_codes || t('All')}
                  </p>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-xs font-medium text-muted-foreground">{t('Max Distance')}</span>
                  <span className="text-xs font-semibold text-foreground">
                    {shipping.max_distance ? `${shipping.max_distance} km` : t('Unlimited')}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Performance Analytics Summary */}
            <Card className="border-border shadow-2xs">
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">{t('Performance Metrics')}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('Shipping method engagement & stats')}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="!pt-4 space-y-3">
                <div className="flex items-center justify-between py-1 border-b border-border/60">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    {t('Method Page Views')}
                  </span>
                  <span className="text-xs font-bold text-foreground">{stats?.views ?? shipping.views ?? 0}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-border/60">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-muted-foreground" />
                    {t('Orders (Last 30 Days)')}
                  </span>
                  <span className="text-xs font-bold text-foreground">{stats?.recent_orders || 0}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-border/60">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                    {t('Average Shipping Cost')}
                  </span>
                  <span className="text-xs font-bold text-foreground font-mono">
                    {formatCurrency(stats?.avg_shipping_cost || 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    {t('Delivered Orders')}
                  </span>
                  <span className="text-xs font-bold text-foreground">{stats?.delivered_orders || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Audit & System Metadata */}
            <Card className="border-border shadow-2xs">
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <Info className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">{t('System Information')}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('Configuration audit logs')}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="!pt-4 space-y-3">
                <div className="flex items-center justify-between py-1 border-b border-border/60">
                  <span className="text-xs font-medium text-muted-foreground">{t('Sort Order')}</span>
                  <span className="text-xs font-semibold text-foreground">{shipping.sort_order ?? 0}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-border/60">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {t('Created Date')}
                  </span>
                  <span className="text-xs font-medium text-foreground">{formatDate(shipping.created_at)}</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {t('Last Modified')}
                  </span>
                  <span className="text-xs font-medium text-foreground">{formatDate(shipping.updated_at)}</span>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

      </div>
    </PageTemplate>
  );
}