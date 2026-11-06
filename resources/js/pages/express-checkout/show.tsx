import React from 'react';
import { PageTemplate } from '@/components/page-template';
import { 
  Edit, 
  Zap, 
  CreditCard, 
  Settings, 
  TrendingUp, 
  DollarSign, 
  Percent, 
  Info, 
  Calendar, 
  Clock,
  Package,
  UserCheck,
  Globe,
  Smartphone,
  ShieldCheck,
  Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import RandomBadgeUI from '@/components/random-badge-ui';
import UserInitials from '@/components/user-initials';

export default function ShowExpressCheckout() {
  const { t } = useTranslation();
  const { checkout, recentTransactions, auth } = usePage().props as any;

  const handleActionClick = (action: string, permission: string) => {
    if (!checkPermission(permission, auth)) {
      return;
    }

    switch (action) {
      case 'edit':
        router.visit(route('express-checkout.edit', checkout.id));
        break;
    }
  };

  const pageActions = [
    // ...(hasPermission('edit-express-checkout') ? [{
    //   label: t('Edit Checkout'),
    //   icon: <Edit className="h-4 w-4" />,
    //   variant: 'default' as const,
    //   onClick: () => handleActionClick('edit', 'edit-express-checkout')
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

  const formatCheckoutType = (type: string, typeDisplay?: string) => {
    if (typeDisplay && !typeDisplay.includes('_')) {
      return typeDisplay;
    }
    const val = typeDisplay || type || '';
    if (!val) return t('Standard');
    return val
      .replace(/[_-]+/g, ' ')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getDefaultPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'credit_card':
        return t('Credit Cards');
      case 'paypal':
        return t('PayPal');
      case 'apple_pay':
        return t('Apple Pay');
      case 'google_pay':
        return t('Google Pay');
      case 'samsung_pay':
        return t('Samsung Pay');
      default:
        return method || '-';
    }
  };

  const enabledPaymentCount = (checkout?.payment_methods && Array.isArray(checkout.payment_methods))
    ? checkout.payment_methods.length
    : 0;

  const activeSettingsCount = [
    checkout?.skip_cart,
    checkout?.auto_fill_customer_data,
    checkout?.guest_checkout_allowed,
    checkout?.mobile_optimized,
    checkout?.save_payment_methods
  ].filter(Boolean).length;

  const paymentMethodsList = [
    { id: 'stripe', name: t('Stripe'), desc: t('Pay securely by card with Stripe.'), icon: <CreditCard className="h-4 w-4" />, colorClass: 'bg-blue-50 text-blue-600' },
    { id: 'cod', name: t('Cash on Delivery'), desc: t('Pay when your meals are delivered.'), icon: <DollarSign className="h-4 w-4" />, colorClass: 'bg-emerald-50 text-emerald-600' },
  ];

  const checkoutSettingsList = [
    { 
      key: 'skip_cart', 
      name: t('Skip Cart Page'), 
      desc: t('Direct bypass from product page straight to checkout step'),
      value: checkout?.skip_cart, 
      icon: <Zap className="h-4 w-4" />,
      colorClass: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-900/40'
    },
    { 
      key: 'auto_fill', 
      name: t('Auto-fill Customer Data'), 
      desc: t('Pre-populate customer name, email, and shipping address'),
      value: checkout?.auto_fill_customer_data, 
      icon: <UserCheck className="h-4 w-4" />,
      colorClass: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-900/40'
    },
    { 
      key: 'guest_checkout', 
      name: t('Guest Checkout'), 
      desc: t('Permit instant orders without mandatory account registration'),
      value: checkout?.guest_checkout_allowed, 
      icon: <Globe className="h-4 w-4" />,
      colorClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-900/40'
    },
    { 
      key: 'mobile_optimized', 
      name: t('Mobile Optimized'), 
      desc: t('Touch-friendly, high-speed layout adapted for mobile screens'),
      value: checkout?.mobile_optimized, 
      icon: <Smartphone className="h-4 w-4" />,
      colorClass: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 border-purple-200/60 dark:border-purple-900/40'
    },
    { 
      key: 'save_payment', 
      name: t('Save Payment Methods'), 
      desc: t('Tokenize payment credentials for fast repeat purchases'),
      value: checkout?.save_payment_methods, 
      icon: <ShieldCheck className="h-4 w-4" />,
      colorClass: 'bg-teal-50 text-teal-600 dark:bg-teal-950/40 border-teal-200/60 dark:border-teal-900/40'
    }
  ];

  const enrichedPaymentMethods = paymentMethodsList.map((method) => ({
    ...method,
    isEnabled: Array.isArray(checkout?.payment_methods)
      ? checkout.payment_methods.includes(method.id)
      : false,
    isDefault: checkout?.default_payment_method === method.id
  }));

  const defaultMethod = enrichedPaymentMethods.find((m) => m.isDefault) || enrichedPaymentMethods[0];
  const otherGateways = enrichedPaymentMethods.filter((m) => m.id !== defaultMethod.id);

  const featuredSetting = checkoutSettingsList[0];
  const otherSettings = checkoutSettingsList.slice(1);

  return (
    <PageTemplate
      title={t('Express Checkout Details')}
      url="/express-checkout/show"
      actions={pageActions}
      backUrl={route('express-checkout.index')}
      breadcrumbs={[
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Express Checkout'), href: route('express-checkout.index') },
        { title: checkout?.name || t('Express Checkout Details') }
      ]}
      description={t('View Express Checkout details and performance metrics.')}
    >
      <div className="space-y-6">
        {/* 2. TOP KPI METRICS: PERFORMANCE STATS */}
        <div className="grid grid-cols-1 gap-4 sm:gap-4 md:grid-cols-3">
          
          {/* KPI 1: Total Revenue */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-emerald-50 dark:bg-emerald-950/20  rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Total Revenue')}</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl font-mono">{formatCurrency(checkout?.revenue || 0)}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{t('Revenue generated')}</span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-emerald-100 p-2.5 dark:bg-emerald-900/40 sm:p-3">
                <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400 sm:h-7 sm:w-7" />
              </div>
            </div>
          </div>

          {/* KPI 2: Total Conversions */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-blue-50 dark:bg-blue-900/20  rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Total Conversions')}</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl">{checkout?.conversions || 0}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{t('Completed checkouts')}</span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-blue-100 p-2.5 dark:bg-blue-900/40 sm:p-3">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400 sm:h-7 sm:w-7" />
              </div>
            </div>
          </div>

          {/* KPI 3: Conversion Rate */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-indigo-50 dark:bg-indigo-950/20  rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Conversion Rate')}</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl">{checkout?.conversion_rate || 0}%</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">{t('Completion efficiency')}</span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-indigo-100 p-2.5 dark:bg-indigo-900/40 sm:p-3">
                <Percent className="h-6 w-6 text-indigo-600 dark:text-indigo-400 sm:h-7 sm:w-7" />
              </div>
            </div>
          </div>

        </div>

        {/* 1. HERO PROFILE SUMMARY CARD */}
        <Card className="border-border shadow-2xs overflow-hidden">
          <div className="p-5 sm:p-6 bg-gradient-to-r from-primary/5 via-transparent to-transparent">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary shrink-0 ring-1 ring-primary/20">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground">{checkout?.name}</h2>
                    <BadgeUI 
                      className={checkout?.is_active 
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-medium text-xs' 
                        : 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20 font-medium text-xs'
                      }
                    >
                      {checkout?.is_active ? t('Active') : t('Inactive')}
                    </BadgeUI>
                  </div>
                  
                  {/* Metadata Pills */}
                  <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                    <RandomBadgeUI name={formatCheckoutType(checkout?.type, checkout?.type_display)} />
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-lg border border-border/60">
                      <span className="font-semibold text-foreground">{t('Button Text')}:</span> {checkout?.button_text || t('Express Checkout')}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-lg border border-border/60">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium text-foreground">{formatDate(checkout?.created_at)}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-lg border border-border/60">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium text-foreground">{formatDate(checkout?.updated_at)}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Section with Scroll Support */}
            {checkout?.description ? (
              <div className="mt-4 pt-4 border-t border-border/60 flex items-start gap-2.5">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-foreground text-xs block mb-1">{t('Description')}</span>
                  <div className="max-h-24 overflow-y-auto pr-1.5">
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed break-words whitespace-pre-line">
                      {checkout.description}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-3 pt-3 border-t border-border/60">
                <p className="text-xs text-muted-foreground italic">{t('No description provided.')}</p>
              </div>
            )}
          </div>
        </Card>

        

        {/* 3. PAYMENT METHODS & CHECKOUT SETTINGS (MODERN SPOTLIGHT & FEATURE GRID) */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          
          {/* Card: Payment Methods */}
          <Card className="border-border shadow-2xs h-full flex flex-col">
            <CardHeader className="!p-4 border-b border-border flex flex-row items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-foreground">{t('Payment Gateways')}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('Configured payment gateway channels')}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-lg border border-border/60">
                  {enabledPaymentCount} / {paymentMethodsList.length} {t('Active')}
                </span>
              </div>
            </CardHeader>
            <CardContent className="!p-4 flex-1 flex flex-col justify-between gap-3.5">
              
              {/* Highlight Spotlight: Default Gateway */}
              <div className="p-3.5 sm:p-4 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/[0.02] to-transparent relative overflow-hidden flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                      <Star className="h-3 w-3 fill-primary" />
                      {t('Default Gateway')}
                    </span>
                    {/* {defaultMethod.isEnabled && (
                      <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        {t('Primary at Checkout')}
                      </span>
                    )} */}
                  </div>
                  <BadgeUI 
                    className={defaultMethod.isEnabled 
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 font-medium text-xs' 
                      : 'bg-zinc-50 text-zinc-700 ring-zinc-600/20 dark:bg-zinc-800 dark:text-zinc-400 font-medium text-xs'
                    }
                  >
                    {defaultMethod.isEnabled ? t('Enabled') : t('Disabled')}
                  </BadgeUI>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border shrink-0 ${defaultMethod.colorClass}`}>
                    {defaultMethod.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-bold text-foreground block truncate">{defaultMethod.name}</span>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{defaultMethod.desc}</p>
                  </div>
                </div>
              </div>

              {/* 2x2 Feature Grid: Other Supported Gateways */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                {otherGateways.map((method) => (
                  <div 
                    key={method.id} 
                    className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                      method.isEnabled 
                        ? 'border-border bg-card shadow-2xs hover:border-primary/40' 
                        : 'border-border bg-muted/15'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className={`p-2 rounded-xl border shrink-0 ${method.colorClass}`}>
                        {method.icon}
                      </div>
                      <BadgeUI 
                        className={method.isEnabled 
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 font-medium text-xs' 
                          : 'bg-zinc-50 text-zinc-700 ring-zinc-600/20 dark:bg-zinc-800 dark:text-zinc-400 font-medium text-xs'
                        }
                      >
                        {method.isEnabled ? t('Enabled') : t('Disabled')}
                      </BadgeUI>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-foreground block truncate">{method.name}</span>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{method.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

            </CardContent>
          </Card>

          {/* Card: Checkout Settings */}
          <Card className="border-border shadow-2xs h-full flex flex-col">
            <CardHeader className="!p-4 border-b border-border flex flex-row items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Settings className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-foreground">{t('Checkout Settings')}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('Flow rules and buyer preferences')}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-lg border border-border/60">
                  {activeSettingsCount} / {checkoutSettingsList.length} {t('Enabled')}
                </span>
              </div>
            </CardHeader>
            <CardContent className="!p-4 flex-1 flex flex-col justify-between gap-3.5">
              
              {/* Highlight Spotlight: Core Direct Checkout Rule (Skip Cart) */}
              <div className="p-3.5 sm:p-4 rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-amber-500/[0.02] to-transparent relative overflow-hidden flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-semibold">
                      <Zap className="h-3 w-3 fill-amber-500 text-amber-500" />
                      {t('Express Funnel')}
                    </span>
                    {/* {featuredSetting.value && (
                      <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        {t('Instant Direct Flow')}
                      </span>
                    )} */}
                  </div>
                  <BadgeUI 
                    className={featuredSetting.value 
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 font-medium text-xs' 
                      : 'bg-zinc-50 text-zinc-700 ring-zinc-600/20 dark:bg-zinc-800 dark:text-zinc-400 font-medium text-xs'
                    }
                  >
                    {featuredSetting.value ? t('Enabled') : t('Disabled')}
                  </BadgeUI>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border shrink-0 ${featuredSetting.colorClass}`}>
                    {featuredSetting.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-bold text-foreground block truncate">{featuredSetting.name}</span>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{featuredSetting.desc}</p>
                  </div>
                </div>
              </div>

              {/* 2x2 Feature Grid: Other Checkout Flow Rules */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                {otherSettings.map((setting) => (
                  <div 
                    key={setting.key} 
                    className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                      setting.value 
                        ? 'border-border bg-card shadow-2xs hover:border-primary/40' 
                        : 'border-border/60 bg-muted/15 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className={`p-2 rounded-xl border shrink-0 ${setting.colorClass}`}>
                        {setting.icon}
                      </div>
                      <BadgeUI 
                        className={setting.value 
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 font-medium text-xs' 
                          : 'bg-zinc-50 text-zinc-700 ring-zinc-600/20 dark:bg-zinc-800 dark:text-zinc-400 font-medium text-xs'
                        }
                      >
                        {setting.value ? t('Enabled') : t('Disabled')}
                      </BadgeUI>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-foreground block truncate">{setting.name}</span>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{setting.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

            </CardContent>
          </Card>
        </div>

        {/* 4. RECENT TRANSACTIONS TABLE */}
        {/* <Card className="border-border shadow-2xs">
          <CardHeader className="!p-4 border-b border-border flex flex-row items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Package className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-foreground">{t('Recent Transactions')}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('Latest checkouts processed through this express profile')}
                </p>
              </div>
            </div>
            {recentTransactions && recentTransactions.length > 0 && (
              <BadgeUI className="text-xs font-semibold">
                {recentTransactions.length} {t('Recent')}
              </BadgeUI>
            )}
          </CardHeader>
          <CardContent className="!p-0">
            {recentTransactions && recentTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="border-b bg-[#F0F0F1] hover:!bg-[#F0F0F1] dark:bg-gray-800 dark:hover:!bg-gray-800">
                      <TableHead className="py-2.5 px-4 font-semibold text-zinc-900 dark:text-zinc-100">{t('Transaction ID')}</TableHead>
                      <TableHead className="py-2.5 px-4 font-semibold text-zinc-900 dark:text-zinc-100">{t('Customer')}</TableHead>
                      <TableHead className="py-2.5 px-4 font-semibold text-zinc-900 dark:text-zinc-100">{t('Payment Method')}</TableHead>
                      <TableHead className="py-2.5 px-4 text-right font-semibold text-zinc-900 dark:text-zinc-100">{t('Amount')}</TableHead>
                      <TableHead className="py-2.5 px-4 text-center font-semibold text-zinc-900 dark:text-zinc-100">{t('Date')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.map((transaction: any, index: number) => (
                      <TableRow key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <TableCell className="py-3 px-4 font-medium text-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <Zap className="h-3.5 w-3.5 text-primary opacity-80" />
                            {transaction.id}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="shrink-0">
                              <UserInitials name={transaction.customer} />
                            </div>
                            <div className="min-w-0">
                              <span className="text-sm font-semibold text-foreground block truncate">
                                {transaction.customer || '-'}
                              </span>
                              {(transaction.email || transaction.customer_email) && (
                                <span className="text-xs text-muted-foreground block truncate">
                                  {transaction.email || transaction.customer_email}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <RandomBadgeUI name={transaction.method} />
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right font-bold text-foreground text-sm font-mono">
                          {transaction.formatted_amount || formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-center text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(transaction.date)}
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
                <h4 className="text-sm font-semibold text-foreground">{t('No Transactions Yet')}</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  {t('No recent transactions')}
                </p>
              </div>
            )}
          </CardContent>
        </Card> */}

      </div>
    </PageTemplate>
  );
}