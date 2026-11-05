import React, { useState } from 'react';
import BadgeUI from '@/components/badge-ui';
import { toast } from '@/components/custom-toast';
import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import UserInitials from '@/components/user-initials';
import { formatCurrency } from '@/utils/currency-helper';
import { router, usePage } from '@inertiajs/react';
import {
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  DollarSign,
  Edit,
  Info,
  Percent,
  ShieldCheck,
  ShoppingCart,
  Ticket,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getImageUrl } from '@/utils/image-helper';

export default function ShowCoupon() {
  const { t } = useTranslation();
  const { coupon, stats, recentOrders, auth } = usePage().props as any;

  const [copied, setCopied] = useState(false);
  const currentStatus = Boolean(coupon?.status);

  const handleCopyCode = () => {
    if (!coupon?.code) return;
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    toast.success(t('Coupon code copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    if (typeof window !== 'undefined' && window.appSettings?.formatDateTime) {
      return window.appSettings.formatDateTime(dateString, false) || '-';
    }
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return String(dateString);
    }
  };

  // Usage percentage calculation
  const usagePct =
    stats?.usage_percentage !== undefined
      ? Math.min(Math.round(stats.usage_percentage), 100)
      : coupon?.use_limit_per_coupon
      ? Math.min(Math.round(((coupon.used_count || 0) / coupon.use_limit_per_coupon) * 100), 100)
      : null;

  const permissions = auth?.permissions || [];
  const pageActions: any[] = [];

  // if (permissions.includes('edit-coupon-system')) {
  //   pageActions.push({
  //     label: t('Edit Coupon'),
  //     icon: <Edit className="h-4 w-4" />,
  //     variant: 'default' as const,
  //     onClick: () => router.visit(route('coupon-system.edit', coupon.id)),
  //   });
  // }

  return (
    <PageTemplate
      title={coupon?.name || t('Coupon Details')}
      description={t('Detailed performance metrics, redemption restrictions, and customer history.')}
      url={`/coupon-system/${coupon.id}`}
      backUrl={route('coupon-system.index')}
      actions={pageActions}
      breadcrumbs={[
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Coupon System'), href: route('coupon-system.index') },
        { title: coupon?.name || t('Coupon Details') },
      ]}
    >
      <div className="space-y-6">
        {/* 1. TOP KPI METRICS (4 Columns) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Total Redemptions */}
          <div className="border-border/80 bg-card relative overflow-hidden rounded-xl border p-4 shadow-xs transition-shadow duration-200 hover:shadow-md sm:p-5 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-emerald-50 dark:bg-emerald-950/20  rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-muted-foreground mb-1 text-sm font-medium">{t('Total Redemptions')}</p>
                <p className="text-foreground text-xl font-bold sm:text-2xl">{stats?.total_usage || coupon.used_count || 0}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {stats?.recent_usage ? `${stats.recent_usage} ${t('in last 30 days')}` : t('All-time coupon uses')}
                  </span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-emerald-100 p-2.5 sm:p-3 dark:bg-emerald-900/40">
                <Ticket className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Card 2: Total Savings */}
          <div className="border-border/80 bg-card relative overflow-hidden rounded-xl border p-4 shadow-xs transition-shadow duration-200 hover:shadow-md sm:p-5 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-blue-50 dark:bg-blue-900/20  rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-muted-foreground mb-1 text-sm font-medium">{t('Total Savings')}</p>
                <p className="text-foreground text-xl font-bold sm:text-2xl font-mono">{formatCurrency(stats?.total_savings || 0)}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{t('Saved by customers')}</span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-blue-100 p-2.5 sm:p-3 dark:bg-blue-900/40">
                <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Card 3: Unique Customers */}
          <div className="border-border/80 bg-card relative overflow-hidden rounded-xl border p-4 shadow-xs transition-shadow duration-200 hover:shadow-md sm:p-5 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-indigo-50 dark:bg-indigo-950/20  rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-muted-foreground mb-1 text-sm font-medium">{t('Unique Customers')}</p>
                <p className="text-foreground text-xl font-bold sm:text-2xl">{stats?.unique_users || 0}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">{t('Shoppers redeemed')}</span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-indigo-100 p-2.5 sm:p-3 dark:bg-indigo-900/40">
                <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>

          {/* Card 4: Avg Savings Per Use */}
          <div className="border-border/80 bg-card relative overflow-hidden rounded-xl border p-4 shadow-xs transition-shadow duration-200 hover:shadow-md sm:p-5 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-purple-50 dark:bg-purple-950/20  rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-muted-foreground mb-1 text-sm font-medium">{t('Avg. Savings / Use')}</p>
                <p className="text-foreground text-xl font-bold sm:text-2xl font-mono">{formatCurrency(stats?.avg_savings_per_use || 0)}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                    {stats?.is_expired
                      ? t('Coupon expired')
                      : stats?.days_until_expiry !== null && stats?.days_until_expiry !== undefined
                      ? `${Math.round(stats.days_until_expiry)} ${t('days remaining')}`
                      : t('Per order redemption')}
                  </span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-purple-100 p-2.5 sm:p-3 dark:bg-purple-900/40">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* 2. TWO-COLUMN DASHBOARD (8 Cols Left, 4 Cols Right) */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* LEFT COLUMN: PRIMARY CONFIGURATION & RECENT ORDERS (8 Cols) */}
          <div className="space-y-6 lg:col-span-8">
            {/* Pricing & Calculation Rules */}
            <Card className="border-border/80 bg-card overflow-hidden rounded-2xl border shadow-xs dark:bg-zinc-900">
              <CardHeader className="border-border/60 flex flex-row items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="bg-primary/10 text-primary rounded-xl p-2">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-foreground text-base font-bold">{t('Pricing & Calculation Rules')}</CardTitle>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {t('Discount amount, threshold requirements, and promotional details')}
                    </p>
                  </div>
                </div>
                <BadgeUI
                  className={
                    currentStatus
                      ? 'bg-emerald-50 text-xs font-medium text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'bg-rose-50 text-xs font-medium text-rose-700 ring-rose-600/20 dark:bg-rose-950/40 dark:text-rose-400'
                  }
                >
                  {currentStatus ? t('Active') : t('Inactive')}
                </BadgeUI>
              </CardHeader>

              <CardContent className="space-y-5 p-5 sm:p-6">
                {coupon.description && (
                  <div className="border-border/80 bg-muted/20 text-muted-foreground flex items-start gap-2.5 rounded-xl border p-3.5 text-xs leading-relaxed sm:text-sm">
                    <Info className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <span className="text-foreground mb-0.5 block text-xs font-semibold">{t('Campaign Description')}</span>
                      <p>{coupon.description}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {/* Calculation Type */}
                  <div className="border-border/80 bg-muted/20 rounded-xl border p-3.5">
                    <span className="text-muted-foreground block text-xs font-medium">{t('Discount Type')}</span>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="bg-primary/10 text-primary rounded-md p-1">
                        {coupon.type === 'percentage' ? <Percent className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
                      </div>
                      <span className="text-foreground text-sm font-semibold">
                        {coupon.type === 'percentage' ? t('Percentage Off') : t('Fixed Flat Discount')}
                      </span>
                    </div>
                  </div>

                  {/* Discount Amount */}
                  <div className="border-border/80 bg-muted/20 rounded-xl border p-3.5">
                    <span className="text-muted-foreground block text-xs font-medium">{t('Discount Value')}</span>
                    <p className="mt-1 text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {coupon.type === 'percentage' ? `${coupon.discount_amount}%` : formatCurrency(coupon.discount_amount)}
                    </p>
                  </div>

                  {/* Minimum Spend */}
                  <div className="border-border/80 bg-muted/20 rounded-xl border p-3.5">
                    <span className="text-muted-foreground block text-xs font-medium">{t('Minimum Spend')}</span>
                    <p className="text-foreground mt-1 text-sm font-semibold font-mono">
                      {coupon.minimum_spend ? formatCurrency(coupon.minimum_spend) : t('No minimum')}
                    </p>
                  </div>

                  {/* Maximum Spend */}
                  <div className="border-border/80 bg-muted/20 rounded-xl border p-3.5">
                    <span className="text-muted-foreground block text-xs font-medium">{t('Maximum Spend')}</span>
                    <p className="text-foreground mt-1 text-sm font-semibold font-mono">
                      {coupon.maximum_spend ? formatCurrency(coupon.maximum_spend) : t('No maximum')}
                    </p>
                  </div>

                  {/* Start Date */}
                  <div className="border-border/80 bg-muted/20 rounded-xl border p-3.5">
                    <span className="text-muted-foreground block text-xs font-medium">{t('Start Date')}</span>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Calendar className="text-muted-foreground h-4 w-4" />
                      <span className="text-foreground text-sm font-semibold">
                        {coupon.start_date ? formatDate(coupon.start_date) : t('Immediate')}
                      </span>
                    </div>
                  </div>

                  {/* Expiry Date */}
                  <div className="border-border/80 bg-muted/20 rounded-xl border p-3.5">
                    <span className="text-muted-foreground block text-xs font-medium">{t('Expiry Date')}</span>
                    <div className="mt-1 flex items-center gap-1.5">
                      <CalendarDays className="text-muted-foreground h-4 w-4" />
                      <span className="text-foreground text-sm font-semibold">
                        {coupon.expiry_date ? formatDate(coupon.expiry_date) : t('Never expires')}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Restrictions & Limits */}
            <Card className="border-border/80 bg-card overflow-hidden rounded-2xl border shadow-xs dark:bg-zinc-900">
              <CardHeader className="border-border/60 flex flex-row items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="bg-primary/10 text-primary rounded-xl p-2">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-foreground text-base font-bold">{t('Usage Limits & Redemptions')}</CardTitle>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {t('Capacity restrictions and per-customer throttle settings')}
                    </p>
                  </div>
                </div>
                {coupon.use_limit_per_coupon && (
                  <BadgeUI className="bg-primary/10 text-primary border-primary/20 text-xs">
                    {usagePct !== null ? `${usagePct}% ${t('claimed')}` : ''}
                  </BadgeUI>
                )}
              </CardHeader>

              <CardContent className="space-y-5 p-5 sm:p-6">
                {/* Visual Progress Bar (if limit is defined) */}
                {coupon.use_limit_per_coupon ? (
                  <div className="border-border/80 bg-muted/20 space-y-2 rounded-xl border p-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-foreground font-semibold">{t('Redemption Capacity Progress')}</span>
                      <span className="text-primary font-bold">
                        {coupon.used_count || 0} / {coupon.use_limit_per_coupon} {t('used')}
                      </span>
                    </div>
                    <div className="bg-muted h-2.5 w-full overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-500"
                        style={{ width: `${usagePct || 0}%` }}
                      />
                    </div>
                    <div className="text-muted-foreground flex justify-between pt-1 text-[11px]">
                      <span>0</span>
                      <span>
                        {Math.max(0, coupon.use_limit_per_coupon - (coupon.used_count || 0))} {t('remaining')}
                      </span>
                      <span>
                        {coupon.use_limit_per_coupon} {t('cap')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-emerald-700 sm:text-sm dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{t('Uncapped: This coupon has no global limit and can be redeemed indefinitely.')}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {/* Limit per coupon */}
                  <div className="border-border/80 bg-muted/20 rounded-xl border p-3.5">
                    <span className="text-muted-foreground block text-xs font-medium">{t('Overall Limit (Per Coupon)')}</span>
                    <p className="text-foreground mt-1 text-base font-bold">{coupon.use_limit_per_coupon || t('Unlimited')}</p>
                  </div>

                  {/* Limit per user */}
                  <div className="border-border/80 bg-muted/20 rounded-xl border p-3.5">
                    <span className="text-muted-foreground block text-xs font-medium">{t('Limit Per User')}</span>
                    <p className="text-foreground mt-1 text-base font-bold">{coupon.use_limit_per_user || t('Unlimited')}</p>
                  </div>

                  {/* Used Count */}
                  <div className="border-border/80 bg-muted/20 rounded-xl border p-3.5">
                    <span className="text-muted-foreground block text-xs font-medium">{t('Total Times Redeemed')}</span>
                    <p className="text-primary mt-1 text-base font-bold">
                      {coupon.used_count || 0} {t('times')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Orders Using This Coupon */}
            <Card className="border-border/80 bg-card overflow-hidden rounded-2xl border shadow-xs dark:bg-zinc-900">
              <CardHeader className="border-border/60 flex flex-row items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="bg-primary/10 text-primary rounded-xl p-2">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-foreground text-base font-bold">{t('Recent Orders Redeemed')}</CardTitle>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {t('Latest customer purchases applying this voucher code')}
                    </p>
                  </div>
                </div>
                <BadgeUI className="bg-primary/10 text-primary border-primary/20 text-xs">
                  {recentOrders?.length || 0} {t('Orders')}
                </BadgeUI>
              </CardHeader>

              <CardContent className="p-0">
                {recentOrders && recentOrders.length > 0 ? (
                  <div className="scrollbar-thin max-h-[300px] overflow-x-auto overflow-y-auto">
                    <Table>
                      <TableHeader className="bg-card sticky top-0 z-10 shadow-2xs dark:bg-zinc-900">
                        <TableRow className="bg-muted/30">
                          <TableHead className="text-muted-foreground text-xs font-semibold">{t('Order')}</TableHead>
                          <TableHead className="text-muted-foreground text-xs font-semibold">{t('Customer')}</TableHead>
                          <TableHead className="text-muted-foreground text-xs font-semibold">{t('Date')}</TableHead>
                          <TableHead className="text-muted-foreground text-right text-xs font-semibold">
                            {t('Order Total')}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentOrders.map((order: any) => (
                          <TableRow key={order.id} className="hover:bg-muted/40 transition-colors">
                            <TableCell className="text-foreground font-mono text-xs font-bold">
                              <span className="bg-muted/60 border-border/60 rounded-md border px-2 py-1">
                                {order.order_number}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2.5">
                                <Avatar className="h-10 w-10 shrink-0 border border-zinc-200 dark:border-zinc-800">
                                  <AvatarImage src={order.customer_avatar} alt={order.customer_name} className="object-cover" />
                                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                                    <img src={getImageUrl('/storage/media/avatars/avatar.png')} alt={order.customer_name} className="object-cover rounded-full" />
                                  </AvatarFallback>
                                </Avatar>
                                {/* <span className="text-foreground text-sm font-medium">
                                  {order.customer_name || t('Guest Customer')}
                                </span> */}
                                <div className="min-w-0">
                                  <div className="font-medium text-zinc-900 dark:text-white truncate">{order.customer_name}</div>
                                  <div className="text-xs text-muted-foreground truncate">{order.customer_email}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{window.appSettings.formatDateTime(order.date,false)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-foreground text-sm font-bold font-mono">{formatCurrency(order.total)}</span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="space-y-2 p-8 text-center">
                    <div className="bg-muted/60 text-muted-foreground inline-flex rounded-2xl p-3">
                      <ShoppingCart className="h-6 w-6" />
                    </div>
                    <p className="text-foreground text-sm font-semibold">{t('No Redemptions Yet')}</p>
                    <p className="text-muted-foreground mx-auto max-w-sm text-xs">
                      {t('This coupon has not been used on any checkout orders yet. Share the promo code to get started!')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: PROMO CARD & LIFECYCLE (4 Cols - Sticky) */}
          <div className="space-y-6 self-start lg:sticky lg:top-20 lg:col-span-4">
            {/* Interactive Promo Voucher Card */}
            <Card className="border-border/80 bg-card overflow-hidden rounded-2xl border shadow-xs dark:bg-zinc-900">
              <div className="border-border/60 bg-muted/20 flex items-center justify-between border-b p-4">
                <span className="text-foreground flex max-w-[220px] items-center gap-1.5 truncate text-xs font-semibold tracking-wide capitalize">
                  <Ticket className="text-primary h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{coupon?.name || t('Coupon Voucher')}</span>
                </span>
                <BadgeUI
                  className={
                    currentStatus
                      ? 'bg-emerald-50 text-xs font-medium text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'bg-rose-50 text-xs font-medium text-rose-700 ring-rose-600/20 dark:bg-rose-950/40 dark:text-rose-400'
                  }
                >
                  {currentStatus ? t('Active') : t('Inactive')}
                </BadgeUI>
              </div>

              <div className="p-4">
                <div className="border-primary/30 from-primary/5 via-background to-primary/10 relative overflow-hidden rounded-xl border-2 border-dashed bg-gradient-to-br p-5 transition-all">
                  {/* Decorative cutouts */}
                  <div className="border-border bg-card absolute top-1/2 -left-3 -mt-3 h-6 w-6 rounded-full border-r dark:bg-zinc-900" />
                  <div className="border-border bg-card absolute top-1/2 -right-3 -mt-3 h-6 w-6 rounded-full border-l dark:bg-zinc-900" />

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-muted-foreground text-xs font-semibold tracking-wide capitalize">
                        {coupon.type === 'percentage' ? t('Percentage Off') : t('Fixed Discount')}
                      </p>
                      <h4 className="text-foreground mt-0.5 text-2xl font-black tracking-tight font-mono">
                        {coupon.type === 'percentage'
                          ? `${coupon.discount_amount}% OFF`
                          : `${formatCurrency(coupon.discount_amount)} OFF`}
                      </h4>
                    </div>

                    <div className="bg-primary/10 text-primary rounded-xl p-2.5">
                      {coupon.type === 'percentage' ? <Percent className="h-5 w-5" /> : <DollarSign className="h-5 w-5" />}
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-foreground truncate text-sm font-bold">{coupon.name}</p>
                    {coupon.description && (
                      <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">{coupon.description}</p>
                    )}
                  </div>

                  <div className="border-border/80 mt-4 flex items-center justify-between border-t pt-3">
                    <div>
                      <span className="text-muted-foreground block text-[10px] font-semibold capitalize">
                        {t('Voucher Code')}
                      </span>
                      <span className="text-primary font-mono text-sm font-bold tracking-wider">{coupon.code}</span>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleCopyCode}
                      className="border-primary/30 hover:bg-primary/10 text-primary h-8 gap-1 rounded-lg px-2.5 text-xs"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          <span>{t('Copied!')}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>{t('Copy')}</span>
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="border-border/60 text-muted-foreground mt-3 flex items-center justify-between border-t pt-2 text-[11px]">
                    <span>{t('Expires:')}</span>
                    <span className="text-foreground font-semibold">
                      {coupon.expiry_date ? formatDate(coupon.expiry_date) : t('Never')}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Lifecycle & System Information (Read-only) */}
            <Card className="border-border/80 bg-card overflow-hidden rounded-2xl border shadow-xs dark:bg-zinc-900">
              <CardHeader className="border-border/60 border-b pb-3">
                <CardTitle className="text-foreground text-sm font-bold">{t('Lifecycle')}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5">
                <div className="space-y-3 text-xs">
                  <div className="border-border/60 flex justify-between border-b py-1">
                    <span className="text-muted-foreground">{t('Created At')}</span>
                    <span className="text-foreground font-medium">{formatDate(coupon.created_at)}</span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">{t('30-Day Activity')}</span>
                    <span className="text-foreground font-bold">
                      {stats?.recent_usage || 0} {t('redemptions')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}
