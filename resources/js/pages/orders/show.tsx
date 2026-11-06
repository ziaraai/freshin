import { DeliveryDate } from '@/components/OrderingSchedule';
import React from 'react';
import { PageTemplate } from '@/components/page-template';
import {
  Edit,
  User,
  CreditCard,
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  ExternalLink,
  FileText,
  Receipt,
  ShoppingBag,
  DollarSign,
  Mail,
  Phone,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import BadgeUI from '@/components/badge-ui';
import UserInitials from '@/components/user-initials';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import { formatCurrency } from '@/utils/currency-helper';
import { getImageUrl } from '@/utils/image-helper';
import { hasPermission, checkPermission } from '@/utils/permissions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface OrderShowProps {
  order: {
    id: number;
    orderNumber: string;
    date: string;
    delivery_date?: string | null;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    bankTransferReceipt?: string | null;
    customer: {
      name: string;
      email: string;
      phone?: string;
      avatar?: string;
    };
    shippingAddress: {
      name: string;
      street: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
    items: Array<{
      id: number;
      name: string;
      sku: string;
      quantity: number;
      price: number;
      image: string;
    }>;
    summary: {
      subtotal: number;
      shipping: number;
      tax: number;
      discount: number;
      total: number;
    };
    shippingMethod: string;
    trackingNumber?: string;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
    stats?: {
      items_count: number;
      total_quantity: number;
      avg_item_price: number;
    };
    timeline?: Array<{
      status: string;
      date: string | null;
      completed: boolean;
      variant?: string;
    }>;
  };
}

export default function ShowOrder({ order }: OrderShowProps) {
  const { t } = useTranslation();
  const { auth } = usePage().props as any;

  const handleActionClick = (action: string, permission: string) => {
    if (!checkPermission(permission, auth)) {
      return;
    }

    switch (action) {
      case 'edit':
        router.visit(route('orders.edit', order.id));
        break;
    }
  };

  const formatDateTime = (dateStr?: string | Date | null, includeTime: boolean = false) => {
    if (!dateStr) return '';
    try {
      const fn = (window as any)?.appSettings?.formatDateTime;
      if (typeof fn === 'function') {
        const result = fn(dateStr, includeTime);
        if (result) return result;
      }
    } catch {
      // fallback
    }
    return String(dateStr);
  };

  const getOrderStatusBadge = (status?: string) => {
    if (!status) return null;
    const normalized = status.toLowerCase();

    let colorClasses = 'bg-zinc-100 text-zinc-700 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700';

    switch (normalized) {
      case 'delivered':
      case 'completed':
        colorClasses = 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-500/30';
        break;
      case 'shipped':
        colorClasses = 'bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-950/40 dark:text-sky-400 dark:ring-sky-500/30';
        break;
      case 'processing':
        colorClasses = 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/40 dark:text-blue-400 dark:ring-blue-500/30';
        break;
      case 'pending':
        colorClasses = 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-500/30';
        break;
      case 'cancelled':
        colorClasses = 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/40 dark:text-red-400 dark:ring-red-500/30';
        break;
      case 'refunded':
        colorClasses = 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/40 dark:text-blue-400 dark:ring-blue-500/30';
        break;
    }

    return (
      <BadgeUI className={cn("text-xs font-semibold px-2.5 py-1", colorClasses)}>
        {t(status)}
      </BadgeUI>
    );
  };

  const getPaymentStatusBadge = (status?: string) => {
    if (!status) return null;
    const normalized = status.toLowerCase().replace(/\s+/g, '_');

    let colorClasses = 'bg-zinc-100 text-zinc-700 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700';

    switch (normalized) {
      case 'paid':
        colorClasses = 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-500/30';
        break;
      case 'pending':
        colorClasses = 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-500/30';
        break;
      case 'failed':
        colorClasses = 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/40 dark:text-red-400 dark:ring-red-500/30';
        break;
      case 'refunded':
      case 'partially_refunded':
        colorClasses = 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-950/40 dark:text-purple-400 dark:ring-purple-500/30';
        break;
    }

    return (
      <BadgeUI className={cn("text-xs font-semibold px-2.5 py-1", colorClasses)}>
        {t(status)}
      </BadgeUI>
    );
  };

  const pageActions = [
    // ...(hasPermission('edit-orders') ? [{
    //   label: t('Edit Order'),
    //   icon: <Edit className="h-4 w-4" />,
    //   variant: 'default' as const,
    //   onClick: () => handleActionClick('edit', 'edit-orders')
    // }] : [])
  ];

  return (
    <PageTemplate 
      title={t('Order Details')}
      url="/orders/show"
      actions={pageActions}
      backUrl={route('orders.index')}
      breadcrumbs={[
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Order Management'), href: route('orders.index') },
        { title: order.orderNumber ? `#${order.orderNumber}` : t('Order Details') }
      ]}
      description={t('View complete order details.')}
      noPadding
    >
      <div className="space-y-6">
        {/* 2-Column Main Layout: Center Content (8-9 cols) + Right Sidebar (3-4 cols) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left / Center Column (8-9 cols): Items Table, Timeline, Notes, Receipt */}
          <div className="space-y-6 lg:col-span-8 xl:col-span-9">
            {/* Order Items Table Card */}
            <Card className="overflow-hidden rounded-lg border bg-white shadow dark:bg-gray-900">
              <CardHeader className="border-b border-zinc-200 !p-4 dark:border-zinc-800 dark:bg-gray-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg text-primary">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-zinc-900 dark:text-white">
                      {t('Order Items')}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {t('{{count}} item(s) in this order', { count: order.items.length })}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="!p-0 pt-4">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="border-b bg-[#F0F0F1] hover:!bg-[#F0F0F1] dark:bg-gray-800 dark:hover:!bg-gray-800">
                      <TableHead className="w-12 py-2.5 text-center font-semibold text-zinc-900 dark:text-zinc-100">#</TableHead>
                      <TableHead className="py-2.5 font-semibold text-zinc-900 dark:text-zinc-100">{t('Product')}</TableHead>
                      <TableHead className="py-2.5 text-right font-semibold text-zinc-900 dark:text-zinc-100">{t('Price')}</TableHead>
                      <TableHead className="py-2.5 text-center font-semibold text-zinc-900 dark:text-zinc-100">{t('Quantity')}</TableHead>
                      <TableHead className="py-2.5 text-right font-semibold text-zinc-900 dark:text-zinc-100">{t('Total')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item, index) => (
                      <TableRow key={item.id || index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <TableCell className="py-2.5 text-center font-medium text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell className="py-2.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white p-0.5 shadow-2xs dark:border-zinc-700 dark:bg-zinc-800">
                              <img
                                src={getImageUrl(item.image || '/storage/media/product/product.png')}
                                alt={item.name}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = getImageUrl('/storage/media/product/product.png');
                                }}
                                className="h-full w-full rounded-md object-contain cursor-pointer"
                                onClick={() => {window.open(getImageUrl(item.image), '_blank');}}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-zinc-900 dark:text-white truncate">
                                {item.name}
                              </p>
                              {item.sku && (
                                <p className="text-xs text-muted-foreground">
                                  {t('SKU')}: {item.sku}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 text-right font-medium text-zinc-700 dark:text-zinc-300 font-mono">
                          {formatCurrency(item.price)}
                        </TableCell>
                        <TableCell className="py-2.5 text-center font-medium text-zinc-900 dark:text-white">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="py-2.5 text-right font-bold text-zinc-900 dark:text-white font-mono">
                          {formatCurrency(item.price * item.quantity)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Order Totals Summary matching screenshot */}
                <div className="flex justify-end border-t border-zinc-200 p-4 sm:p-6 dark:border-zinc-800">
                  <div className="w-full max-w-[280px] sm:max-w-xs space-y-3">
                    <div className="flex items-center justify-between text-sm sm:text-base">
                      <span className="font-medium text-zinc-500 dark:text-zinc-400">{t('Subtotal')}</span>
                      <span className="font-bold text-zinc-900 dark:text-white font-mono">
                        {formatCurrency(order.summary.subtotal)}
                      </span>
                    </div>

                    {order.summary.discount > 0 && (
                      <div className="flex items-center justify-between text-sm sm:text-base">
                        <span className="font-medium text-zinc-500 dark:text-zinc-400">{t('Discount')}</span>
                        <span className="font-bold text-[#e11d48] dark:text-[#fb7185] font-mono">
                          -{formatCurrency(order.summary.discount)}
                        </span>
                      </div>
                    )}

                    {order.summary.shipping > 0 && (
                      <div className="flex items-center justify-between text-sm sm:text-base">
                        <span className="font-medium text-zinc-500 dark:text-zinc-400">{t('Shipping')}</span>
                        <span className="font-bold text-zinc-900 dark:text-white font-mono">
                          {formatCurrency(order.summary.shipping)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm sm:text-base">
                      <span className="font-medium text-zinc-500 dark:text-zinc-400">{t('Tax')}</span>
                      <span className="font-bold text-zinc-900 dark:text-white font-mono">
                        {formatCurrency(order.summary.tax)}
                      </span>
                    </div>

                    <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
                      <div className="flex items-center justify-between">
                        <span className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                          {t('Total Amount')}
                        </span>
                        <span className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white font-mono">
                          {formatCurrency(order.summary.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Timeline Card */}
            <Card className="overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-gray-900">
              <CardHeader className="border-b border-zinc-200 !p-4 dark:border-zinc-800 dark:bg-gray-800 sm:px-6">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg text-primary">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-zinc-900 dark:text-white">
                      {t('Order Timeline')}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {t('Track fulfillment progress and order milestones')}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {order.timeline && order.timeline.length > 0 ? (
                  <div className="relative space-y-6 pl-2 rtl:pl-0 rtl:pr-2">
                    {order.timeline.map((step, idx) => {
                      const isLast = idx === (order.timeline?.length ?? 0) - 1;
                      const isCompleted = step.completed;
                      const isCancelled = step.variant === 'danger' || step.status.toLowerCase().includes('cancelled');
                      const isRefunded = step.variant === 'blue' || step.variant === 'purple' || step.status.toLowerCase().includes('refunded');

                      return (
                        <div key={idx} className="relative flex items-start gap-4">
                          {/* Connector Line */}
                          {!isLast && (
                            <div
                              className={cn(
                                "absolute left-4 rtl:left-auto rtl:right-4 top-8 -ml-px rtl:-mr-px h-full w-0.5",
                                isCompleted ? "bg-primary" : "bg-zinc-200 dark:bg-zinc-800"
                              )}
                              style={{ height: 'calc(100% - 8px)' }}
                            />
                          )}

                          {/* Node Icon */}
                          <div
                            className={cn(
                              "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                              isCancelled
                                ? "border-red-500 bg-red-500 text-white shadow-xs"
                                : isRefunded
                                ? "border-blue-600 bg-blue-600 text-white shadow-xs dark:border-blue-500 dark:bg-blue-500"
                                : isCompleted
                                ? "border-primary bg-primary text-primary-foreground shadow-xs"
                                : "border-zinc-300 bg-zinc-50 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500"
                            )}
                          >
                            {isCancelled ? (
                              <XCircle className="h-4 w-4" />
                            ) : isRefunded ? (
                              <RotateCcw className="h-4 w-4" />
                            ) : isCompleted ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <span className="h-2 w-2 rounded-full bg-zinc-400 dark:bg-zinc-600" />
                            )}
                          </div>

                          {/* Step Content */}
                          <div className="flex-1 pt-0.5">
                            <div className="flex flex-wrap items-center justify-between gap-1">
                              <h4
                                className={cn(
                                  "text-sm font-semibold",
                                  isCancelled
                                    ? "text-red-600 dark:text-red-400"
                                    : isRefunded
                                    ? "text-blue-600 dark:text-blue-400"
                                    : isCompleted
                                    ? "text-zinc-900 dark:text-white"
                                    : "text-zinc-500 dark:text-zinc-400"
                                )}
                              >
                                {t(step.status)}
                              </h4>
                              {isCompleted && step.date && (
                                <span className="text-xs text-muted-foreground">
                                  {formatDateTime(step.date, true) || step.date}
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {isCancelled
                                ? t('Order has been cancelled')
                                : isRefunded
                                ? t('Order payment was refunded')
                                : isCompleted
                                ? t('Completed successfully')
                                : t('Pending fulfillment step')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    {t('No timeline data available')}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Order Notes Card (if present) */}
            {order.notes && (
              <Card className="overflow-hidden rounded-lg border bg-white shadow dark:bg-gray-900">
                <CardHeader className="border-b border-zinc-200 !p-4 dark:border-zinc-800 dark:bg-gray-800 sm:px-6">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg text-primary">
                      <FileText className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-base font-semibold text-zinc-900 dark:text-white">
                      {t('Order Notes')}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="text-sm text-zinc-700 h-20 max-h-30 overflow-scroll break-words whitespace-pre-line leading-relaxed">
                    {order.notes}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bank Transfer Receipt Card (if present) */}
            {order.bankTransferReceipt && (
              <Card className="overflow-hidden rounded-lg border bg-white shadow dark:bg-gray-900">
                <CardHeader className="border-b border-zinc-200 !p-4 dark:border-zinc-800 dark:bg-gray-800 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg text-primary">
                        <Receipt className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-base font-semibold text-zinc-900 dark:text-white">
                        {t('Payment Receipt')}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
                    <img
                      src={getImageUrl(order.bankTransferReceipt || '/storage/media/product/product.png')}
                      alt={t('Payment Receipt')}
                      className="max-h-72 w-full object-contain cursor-pointer transition-transform hover:scale-[1.01]"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getImageUrl('/storage/media/product/product.png');
                      }}
                      onClick={() => window.open(getImageUrl(order.bankTransferReceipt || '/storage/media/product/product.png'), '_blank')}
                    />
                  </div>
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    {t('Click image to view full resolution')}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Sidebar (3-4 cols): Order Summary, Shipping Info, Customer Details */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="space-y-6 lg:sticky lg:top-6">
              {/* 1. Order Financial Summary Card */}
              <Card className="overflow-hidden rounded-lg border bg-white shadow dark:bg-gray-900">
                <CardHeader className="border-b border-zinc-200 !p-4 dark:border-zinc-800 dark:bg-gray-800 sm:px-5">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base font-semibold text-zinc-900 dark:text-white">
                    {t('Order Summary')}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 p-4 sm:p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">{t('Order Date')}</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">
                    {formatDateTime(order.createdAt || order.date, false) || order.date}
                  </span>
                </div>

                {/* <div className="rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-zinc-900 dark:text-white">
                      {t('Total Amount')}
                    </span>
                    <span className="text-lg font-extrabold text-zinc-900 dark:text-white">
                      {formatCurrency(order.summary.total)}
                    </span>
                  </div>
                </div> */}

                {/* <Separator /> */}

                {/* Payment Breakdown Bar */}
                <div className="rounded-lg text-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">{t('Order Status')}</span>
                    {getOrderStatusBadge(order.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">{t('Payment Method')}</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {order.paymentMethod}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">{t('Payment Status')}</span>
                    {getPaymentStatusBadge(order.paymentStatus)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Shipping & Delivery Card (directly after Order Summary) */}
            <Card className="overflow-hidden rounded-lg border bg-white shadow dark:bg-gray-900">
              <CardHeader className="border-b border-zinc-200 !p-4 dark:border-zinc-800 dark:bg-gray-800 sm:px-5">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base font-semibold text-zinc-900 dark:text-white">
                    {t('Shipping & Delivery')}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-5">
                <DeliveryDate date={order.delivery_date} />
                {/* Method & Tracking */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">{t('Method')}:</span>
                    <BadgeUI className="bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-950/40 dark:text-sky-400 dark:ring-sky-500/30">
                      {order.shippingMethod || t('Standard Delivery')}
                    </BadgeUI>
                  </div>

                  {order.trackingNumber && (
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">{t('Tracking')}:</span>
                      <span className="font-mono font-medium text-zinc-900 dark:text-white">
                        #{order.trackingNumber}
                      </span>
                    </div>
                  )}

                  {/* <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">{t('Shipping Status')}:</span>
                    {getOrderStatusBadge(order.status)}
                  </div> */}
                </div>

                <Separator />

                {/* Delivery Address */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span>{t('Delivery Address')}</span>
                  </div>
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-3 text-xs sm:text-sm leading-relaxed text-zinc-600 dark:border-zinc-800/60 dark:bg-zinc-800/40 dark:text-zinc-300">
                    <p className="font-semibold text-zinc-900 dark:text-white">
                      {order.shippingAddress.name}
                    </p>
                    <p>{order.shippingAddress.street}</p>
                    <p>
                      {order.shippingAddress.city}
                      {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ''}
                      {order.shippingAddress.zip ? ` ${order.shippingAddress.zip}` : ''}
                    </p>
                    <p className="font-medium text-zinc-700 dark:text-zinc-300">
                      {order.shippingAddress.country}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3. Customer Details Card */}
            {hasPermission('manage-customers') && (
              <Card className="overflow-hidden rounded-lg border bg-white shadow dark:bg-gray-900">
                <CardHeader className="border-b border-zinc-200 !p-4 dark:border-zinc-800 dark:bg-gray-800 sm:px-5">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base font-semibold text-zinc-900 dark:text-white">
                      {t('Customer Details')}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3.5 p-4 sm:p-5">
                  {/* Customer Identity */}
                  <div className="flex items-center gap-3">
                    <div className="shrink-0">
                        <Avatar className="h-10 w-10 shrink-0 border border-zinc-200 dark:border-zinc-800">
                          <AvatarImage src={order.customer.avatar} alt={order.customer.name} className="object-cover" />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                            <img src={getImageUrl('/storage/media/avatars/avatar.png')} alt={order.customer.name} className="object-cover rounded-full" />
                          </AvatarFallback>
                        </Avatar>
                      {/* <UserInitials name={order.customer.name} /> */}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-zinc-900 dark:text-white text-sm sm:text-base leading-tight truncate">
                        {order.customer.name}
                      </p>
                      {order.customer.email && (
                        <div
                          className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 truncate"
                          title={order.customer.email}
                        >
                          <Mail className="h-3 w-3 shrink-0 text-muted-foreground" />
                          <span className="truncate">{order.customer.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Phone Number Display */}
                  {order.customer.phone && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-primary" />
                          {t('Phone Number')}
                        </span>
                        <span className="font-medium text-zinc-900 dark:text-white">
                          {order.customer.phone}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
            </div>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}