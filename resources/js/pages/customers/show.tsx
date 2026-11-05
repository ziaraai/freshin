import React, { useState, useMemo } from 'react';
import { PageTemplate } from '@/components/page-template';
import {
  Edit,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Calendar,
  Crown,
  Briefcase,
  User,
  Globe,
  Clock,
  DollarSign,
  TrendingUp,
  FileText,
  Bell,
  ExternalLink,
  Truck,
  Search,
  RotateCcw,
  Package,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import { getImageUrl } from '@/utils/image-helper';
import { formatCurrency } from '@/utils/currency-helper';
import { hasPermission, checkPermission } from '@/utils/permissions';
import BadgeUI from '@/components/badge-ui';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function ShowCustomer() {
  const { t } = useTranslation();
  const { customer, billingAddress, shippingAddress, recentOrders = [], auth } = usePage().props as any;

  // Filter States for Orders Section
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const months = [
    { value: '1', label: t('January') },
    { value: '2', label: t('February') },
    { value: '3', label: t('March') },
    { value: '4', label: t('April') },
    { value: '5', label: t('May') },
    { value: '6', label: t('June') },
    { value: '7', label: t('July') },
    { value: '8', label: t('August') },
    { value: '9', label: t('September') },
    { value: '10', label: t('October') },
    { value: '11', label: t('November') },
    { value: '12', label: t('December') },
  ];

  // Extract unique years from customer orders
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    recentOrders.forEach((o: any) => {
      if (o.year) {
        yearsSet.add(String(o.year));
      } else if (o.date || o.created_at) {
        const d = new Date(o.created_at || o.date);
        if (!isNaN(d.getFullYear())) {
          yearsSet.add(String(d.getFullYear()));
        }
      }
    });

    const currentYear = String(new Date().getFullYear());
    yearsSet.add(currentYear);

    return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
  }, [recentOrders]);

  // Filter orders based on search, year, month, and status
  const filteredOrders = useMemo(() => {
    return recentOrders.filter((order: any) => {
      // Order search
      if (orderSearch.trim()) {
        const query = orderSearch.toLowerCase().trim();
        const matchesNumber = order.order_number?.toLowerCase().includes(query);
        const matchesItems = order.items?.some((it: any) => it.name?.toLowerCase().includes(query));
        if (!matchesNumber && !matchesItems) return false;
      }

      // Year filter
      if (selectedYear !== 'all') {
        const orderYear = order.year
          ? String(order.year)
          : String(new Date(order.created_at || order.date).getFullYear());
        if (orderYear !== selectedYear) return false;
      }

      // Month filter
      if (selectedMonth !== 'all') {
        const orderMonth = order.month
          ? String(order.month)
          : String(new Date(order.created_at || order.date).getMonth() + 1);
        if (orderMonth !== selectedMonth) return false;
      }

      // Status filter
      if (selectedStatus !== 'all') {
        if (order.status?.toLowerCase() !== selectedStatus.toLowerCase()) return false;
      }

      return true;
    });
  }, [recentOrders, orderSearch, selectedYear, selectedMonth, selectedStatus]);

  const hasActiveOrderFilters = orderSearch !== '' || selectedYear !== 'all' || selectedMonth !== 'all' || selectedStatus !== 'all';

  const resetOrderFilters = () => {
    setOrderSearch('');
    setSelectedYear('all');
    setSelectedMonth('all');
    setSelectedStatus('all');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t('Not specified');
    if (typeof window !== 'undefined' && window.appSettings?.formatDateTime) {
      return window.appSettings.formatDateTime(dateString, false) || t('Not specified');
    }
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCountryName = (code: string) => {
    switch (code?.toLowerCase()) {
      case 'us': return t('United States');
      case 'ca': return t('Canada');
      case 'uk': return t('United Kingdom');
      case 'au': return t('Australia');
      case 'in': return t('India');
      case 'de': return t('Germany');
      case 'fr': return t('France');
      default: return code || t('Not specified');
    }
  };

  const renderCustomerGroupBadge = (group: string) => {
    const normalized = (group || 'regular').toLowerCase();
    switch (normalized) {
      case 'vip':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
            <Crown className="h-3.5 w-3.5" />
            {t('VIP Customer')}
          </span>
        );
      case 'wholesale':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
            <Briefcase className="h-3.5 w-3.5" />
            {t('Wholesale Customer')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700">
            <User className="h-3.5 w-3.5" />
            {t('Regular Customer')}
          </span>
        );
    }
  };

  const renderOrderStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    let badgeClass = 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300';

    if (s === 'delivered' || s === 'completed' || s === 'paid') {
      badgeClass = 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400';
    } else if (s === 'pending' || s === 'processing') {
      badgeClass = 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-400';
    } else if (s === 'shipped') {
      badgeClass = 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/40 dark:text-blue-400';
    } else if (s === 'cancelled' || s === 'failed') {
      badgeClass = 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/40 dark:text-red-400';
    }

    return (
      <BadgeUI className={`capitalize text-xs font-medium ${badgeClass}`}>
        {status}
      </BadgeUI>
    );
  };

  const customerFullName = customer.full_name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || t('Customer');
  const initials = customer.initials || (customerFullName.charAt(0) || 'C').toUpperCase();
  const avatarSrc = customer.avatar ? getImageUrl(customer.avatar) : getImageUrl('/storage/media/avatars/avatar.png');

  const pageActions = [
    {
      label: t('Back'),
      icon: <ArrowLeft className="h-4 w-4" />,
      variant: 'outline' as const,
      onClick: () => router.visit(route('customers.index'))
    }
  ];

  // if (hasPermission('edit-customers')) {
  //   pageActions.push({
  //     label: t('Edit Customer'),
  //     icon: <Edit className="h-4 w-4" />,
  //     variant: 'default' as const,
  //     onClick: () => router.visit(route('customers.edit', customer.id)),
  //   });
  // }

  return (
    <PageTemplate
      title={customerFullName}
      url="/customers/show"
      // backUrl={route("customers.index")}
      actions={pageActions}
      breadcrumbs={[
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Customer Management'), href: route('customers.index') },
        { title: customerFullName },
      ]}
      description={t('Detailed customer profile, addresses, order history, and account metrics.')}
    >
      <div className="space-y-6">
        {/* 1. CUSTOMER PROFILE HEADER CARD */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <div className="h-24 sm:h-32 bg-gradient-to-r from-primary/15 via-primary/25 to-primary/10 dark:from-primary/20 dark:via-primary/30 dark:to-primary/15" />
          <div className="p-4 sm:p-6 sm:pt-0">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-16">
              <div className="flex items-start sm:items-end gap-4">
                <Avatar className="h-20 w-20 sm:h-28 sm:w-28 rounded-full border-4 border-white dark:border-zinc-900 shadow-md bg-white dark:bg-zinc-800 shrink-0 ring-2 ring-primary/20">
                  <AvatarImage src={avatarSrc} alt={customerFullName} className="object-cover rounded-full" />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl sm:text-3xl rounded-full">
                    <img src={getImageUrl('/storage/media/avatars/avatar.png')} alt={customerFullName} className="object-cover rounded-full" />
                  </AvatarFallback>
                </Avatar>
                <div className="pt-2 sm:pb-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
                      {customerFullName}
                    </h1>
                    <BadgeUI
                      className={
                        customer.is_active
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400 font-medium text-xs'
                          : 'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20 font-medium text-xs'
                      }
                    >
                      {customer.is_active ? t('Active') : t('Inactive')}
                    </BadgeUI>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {renderCustomerGroupBadge(customer.customer_group)}
                  </div>
                </div>
              </div>

              {/* Quick Contact & Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
                {customer.email && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg text-xs"
                    onClick={() => window.open(`mailto:${customer.email}`, '_blank')}
                  >
                    <Mail className="h-3.5 w-3.5 mr-1.5 rtl:mr-0 rtl:ml-1.5 text-muted-foreground" />
                    {customer.email}
                  </Button>
                )}
                {customer.phone && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg text-xs"
                    onClick={() => window.open(`tel:${customer.phone}`, '_blank')}
                  >
                    <Phone className="h-3.5 w-3.5 mr-1.5 rtl:mr-0 rtl:ml-1.5 text-muted-foreground" />
                    <span dir="ltr">{customer.phone}</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Sub-header metadata */}
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{t('Customer since {{date}}', { date: formatDate(customer.created_at) })}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span>{t('Language')}: <strong className="text-zinc-800 dark:text-zinc-200 uppercase">{customer.preferred_language || 'EN'}</strong></span>
              </div>
              {customer.last_order_date && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{t('Last order')}: <strong className="text-zinc-800 dark:text-zinc-200">{formatDate(customer.last_order_date)}</strong></span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. TOP KPI STATS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Orders */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-blue-50 dark:bg-blue-900/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {t('Total Orders')}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white mt-1">
                  {customer.total_orders || 0}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {t('Lifetime purchases')}
                </p>
              </div>
              <div className="rounded-xl bg-blue-100 p-2.5 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </div>
          </div>

          {/* Card 2: Total Spent */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-emerald-50 dark:bg-emerald-950/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {t('Total Spent')}
                </p>
                <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatCurrency(customer.total_spent || 0)}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  {t('Net revenue')}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-100 p-2.5 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </div>
          </div>

          {/* Card 3: Avg. Order Value */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-purple-50 dark:bg-purple-950/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {t('Avg. Order Value')}
                </p>
                <p className="text-xl sm:text-2xl font-bold font-mono text-zinc-900 dark:text-white mt-1">
                  {formatCurrency(customer.avg_order_value || 0)}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  {t('Per checkout average')}
                </p>
              </div>
              <div className="rounded-xl bg-purple-100 p-2.5 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </div>
          </div>

          {/* Card 4: Pending Orders */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-amber-50 dark:bg-amber-950/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {t('Pending Orders')}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {customer.pending_orders || 0}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  {customer.pending_orders > 0 ? t('Awaiting fulfillment') : t('All orders fulfilled')}
                </p>
              </div>
              <div className="rounded-xl bg-amber-100 p-2.5 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* 3. MAIN CONTENT: 2-COLUMN GRID (LEFT ORDERS & NOTES, RIGHT SIDEBAR) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* LEFT 2 COLUMNS: ENHANCED ORDERS LIST & NOTES */}
          <div className="lg:col-span-2 space-y-6">
            {/* Orders Section Card */}
            <Card className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
              <CardHeader className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <ShoppingBag className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-bold text-zinc-900 dark:text-white">{t('Order History')}</CardTitle>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {filteredOrders.length}
                        </span>
                      </div>
                      <CardDescription className="text-xs mt-0.5">
                        {t('Browse past purchases, status, and product items')}
                      </CardDescription>
                    </div>
                  </div>

                  {(hasPermission('view-orders') || hasPermission('manage-orders')) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-primary hover:text-primary hover:bg-primary/5 h-8 gap-1 self-start sm:self-auto"
                      onClick={() => router.visit(route('orders.index'))}
                    >
                      <span>{t('View All Orders')}</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                {/* Filter Toolbar: Search, Year, Month, Status */}
                <div className="mt-4 pt-3.5 border-t border-zinc-100 dark:border-zinc-800/80">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                    {/* Search by Order # */}
                    <div className="relative">
                      <Input
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        placeholder={t('Search order # or product...')}
                        className="h-9 text-xs rounded-lg pl-8 rtl:pl-3 rtl:pr-8"
                      />
                      <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 rtl:left-auto rtl:right-2.5 top-2.5 pointer-events-none" />
                    </div>

                    {/* Year Filter */}
                    <div>
                      <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="h-9 text-xs rounded-lg">
                          <SelectValue placeholder={t('Filter Year')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('All Years')}</SelectItem>
                          {availableYears.map((yr) => (
                            <SelectItem key={yr} value={yr}>
                              {yr}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Month Filter */}
                    <div>
                      <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="h-9 text-xs rounded-lg">
                          <SelectValue placeholder={t('Filter Month')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('All Months')}</SelectItem>
                          {months.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="h-9 text-xs rounded-lg">
                          <SelectValue placeholder={t('Filter Status')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('All Statuses')}</SelectItem>
                          <SelectItem value="pending">{t('Pending')}</SelectItem>
                          <SelectItem value="processing">{t('Processing')}</SelectItem>
                          <SelectItem value="shipped">{t('Shipped')}</SelectItem>
                          <SelectItem value="delivered">{t('Delivered')}</SelectItem>
                          <SelectItem value="cancelled">{t('Cancelled')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Active Filter Clear Bar */}
                  {hasActiveOrderFilters && (
                    <div className="flex items-center justify-between mt-2.5 pt-2 text-xs text-muted-foreground">
                      <span>{t('Filtered {{count}} of {{total}} orders', { count: filteredOrders.length, total: recentOrders.length })}</span>
                      <button
                        type="button"
                        onClick={resetOrderFilters}
                        className="flex items-center gap-1 text-primary hover:underline font-medium cursor-pointer"
                      >
                        <RotateCcw className="h-3 w-3" />
                        {t('Reset Filters')}
                      </button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-5">
                {filteredOrders.length === 0 ? (
                  <div className="py-12 px-4 text-center">
                    <div className="h-14 w-14 rounded-full bg-zinc-100 dark:bg-zinc-800 text-muted-foreground flex items-center justify-center mx-auto mb-3">
                      <Package className="h-7 w-7 text-muted-foreground/60" />
                    </div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                      {hasActiveOrderFilters ? t('No orders match your filter criteria') : t('No orders placed yet')}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1.5 max-w-sm mx-auto leading-relaxed">
                      {hasActiveOrderFilters
                        ? t('Try adjusting or clearing the month, year, or search filters.')
                        : t('When this customer completes a checkout, their order details will appear here.')}
                    </p>
                    {hasActiveOrderFilters && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetOrderFilters}
                        className="mt-4 text-xs rounded-lg gap-1.5 shadow-xs"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        {t('Clear Filters')}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="max-h-[540px] overflow-y-auto pr-1 space-y-3.5">
                    {filteredOrders.map((order: any) => {
                      const itemsList = order.items || [];
                      const imagesList = order.item_images || [];

                      return (
                        <div
                          key={order.id}
                          className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-600 p-4 transition-all duration-150 space-y-3 shadow-xs"
                        >
                          {/* Order Card Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                <ShoppingBag className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  {(hasPermission('view-orders') || hasPermission('manage-orders')) ? (
                                    <a
                                      href={route('orders.show', order.id)}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        router.visit(route('orders.show', order.id));
                                      }}
                                      className="font-bold text-sm text-zinc-900 hover:text-primary dark:text-white dark:hover:text-primary transition-colors flex items-center gap-1.5"
                                    >
                                      <span>{order.order_number}</span>
                                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                                    </a>
                                  ) : (
                                    <span className="font-bold text-sm text-zinc-900 dark:text-white">
                                      {order.order_number}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                  <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                                  <span>{order.date}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 self-end sm:self-center">
                              {renderOrderStatusBadge(order.status)}
                              {order.payment_status && (
                                <BadgeUI className={`capitalize text-xs font-medium ${order.payment_status === 'paid'
                                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400'
                                    : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                                  }`}>
                                  {order.payment_status}
                                </BadgeUI>
                              )}
                              <span className="font-bold font-mono text-base text-zinc-900 dark:text-white min-w-[70px] text-right">
                                {formatCurrency(order.total || 0)}
                              </span>
                            </div>
                          </div>

                          {/* Order Products Preview Row (Thumbnails & Item Names) */}
                          <div className="flex flex-wrap items-center gap-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
                            <TooltipProvider delayDuration={150}>
                              <div className="flex items-center -space-x-2 rtl:space-x-reverse overflow-hidden">
                                {imagesList.slice(0, 4).map((itemImg: any, idx: number) => {
                                  const imgSrc = itemImg.image || '';
                                  return (
                                    <Tooltip key={idx}>
                                      <TooltipTrigger asChild>
                                        <div className="relative h-10 w-10 rounded-lg border-2 border-white dark:border-zinc-800 overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 shadow-xs cursor-pointer">
                                          {imgSrc ? (
                                            <img
                                              src={
                                                imgSrc
                                                  ? getImageUrl(imgSrc)
                                                  : getImageUrl('/storage/media/product/product.png')
                                              }
                                              alt={itemImg.name || 'Product'}
                                              className="h-full w-full object-cover"
                                              onError={(e) => {
                                                (e.target as HTMLImageElement).src = getImageUrl('/storage/media/product/product.png');
                                              }}
                                            />
                                          ) : (
                                            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                                              <Package className="h-4 w-4" />
                                            </div>
                                          )}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent className="text-xs">
                                        {itemImg.name}
                                      </TooltipContent>
                                    </Tooltip>
                                  );
                                })}

                                {imagesList.length > 4 && (
                                  <div className="relative h-10 w-10 rounded-lg border-2 border-white dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-300 shrink-0 shadow-xs">
                                    +{imagesList.length - 4}
                                  </div>
                                )}
                              </div>
                            </TooltipProvider>

                            {/* Item Summary Text */}
                            <div className="text-xs text-muted-foreground flex-1 min-w-[200px] truncate">
                              {itemsList.length > 0 ? (
                                <span>
                                  {itemsList.map((it: any) => `${it.name} (x${it.quantity})`).join(', ')}
                                </span>
                              ) : (
                                <span>{t('{{count}} items purchased', { count: order.items_count || 1 })}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Notes Card */}
            {customer.notes && (
              <Card className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
                <CardHeader className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-zinc-100 dark:border-zinc-800">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <FileText className="h-4.5 w-4.5 text-amber-500" />
                    <span className="text-zinc-900 dark:text-white">{t('Customer Notes')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-5">
                  <div className="rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 p-4 text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed shadow-xs">
                    {customer.notes}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT 1 COLUMN: STICKY SIDEBAR (ADDRESSES & PREFERENCES) */}
          <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            {/* Saved Addresses Card */}
            <Card className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
              <CardHeader className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-zinc-100 dark:border-zinc-800">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <MapPin className="h-4.5 w-4.5 text-primary" />
                  <span className="text-zinc-900 dark:text-white">{t('Saved Addresses')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 space-y-3.5">
                {/* Billing Address Block */}
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/60 dark:bg-zinc-800/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold capitalize text-zinc-900 dark:text-zinc-100">
                      {t('Billing Address')}
                    </span>
                  </div>
                  {billingAddress ? (
                    <div className="text-xs space-y-1 text-zinc-700 dark:text-zinc-300">
                      <p className="font-semibold text-zinc-900 dark:text-white">{billingAddress.address || '-'}</p>
                      <p>{[billingAddress.city, billingAddress.state, billingAddress.postal_code].filter(Boolean).join(', ')}</p>
                      <p className="font-medium text-muted-foreground">{getCountryName(billingAddress.country)}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">{t('No billing address provided')}</p>
                  )}
                </div>

                {/* Shipping Address Block */}
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/60 dark:bg-zinc-800/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold capitalize text-zinc-900 dark:text-zinc-100">
                      {t('Shipping Address')}
                    </span>
                  </div>
                  {shippingAddress ? (
                    <div className="text-xs space-y-1 text-zinc-700 dark:text-zinc-300">
                      <p className="font-semibold text-zinc-900 dark:text-white">{shippingAddress.address || '-'}</p>
                      <p>{[shippingAddress.city, shippingAddress.state, shippingAddress.postal_code].filter(Boolean).join(', ')}</p>
                      <p className="font-medium text-muted-foreground">{getCountryName(shippingAddress.country)}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">{t('No shipping address provided')}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Profile Details Card */}
            <Card className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
              <CardHeader className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-zinc-100 dark:border-zinc-800">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <User className="h-4.5 w-4.5 text-primary" />
                  <span className="text-zinc-900 dark:text-white">{t('Profile Details')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 space-y-2 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800/80">
                  <span className="text-muted-foreground">{t('Date of Birth')}</span>
                  <span className="font-medium text-zinc-900 dark:text-white">{formatDate(customer.date_of_birth)}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800/80">
                  <span className="text-muted-foreground">{t('Gender')}</span>
                  <span className="font-medium capitalize text-zinc-900 dark:text-white">
                    {customer.gender ? customer.gender.replace('_', ' ') : t('Not specified')}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800/80">
                  <span className="text-muted-foreground">{t('Customer Group')}</span>
                  <span className="font-semibold text-zinc-900 dark:text-white capitalize">
                    {customer.customer_group || t('Regular')}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-muted-foreground">{t('Preferred Language')}</span>
                  <span className="font-semibold uppercase text-zinc-900 dark:text-white">
                    {customer.preferred_language || 'EN'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Communication Preferences Card */}
            <Card className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
              <CardHeader className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-zinc-100 dark:border-zinc-800">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Bell className="h-4.5 w-4.5 text-primary" />
                  <span className="text-zinc-900 dark:text-white">{t('Subscriptions & Alerts')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 space-y-2.5">
                <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-700/70 bg-zinc-50/60 dark:bg-zinc-800/30">
                  <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{t('Email Marketing')}</span>
                  <BadgeUI
                    className={customer.email_marketing
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400 text-[11px]'
                      : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 text-[11px]'}
                  >
                    {customer.email_marketing ? t('Subscribed') : t('Opted out')}
                  </BadgeUI>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-700/70 bg-zinc-50/60 dark:bg-zinc-800/30">
                  <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{t('SMS Notifications')}</span>
                  <BadgeUI
                    className={customer.sms_notifications
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400 text-[11px]'
                      : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 text-[11px]'}
                  >
                    {customer.sms_notifications ? t('Enabled') : t('Disabled')}
                  </BadgeUI>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-700/70 bg-zinc-50/60 dark:bg-zinc-800/30">
                  <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{t('Order Updates')}</span>
                  <BadgeUI
                    className={customer.order_updates
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400 text-[11px]'
                      : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 text-[11px]'}
                  >
                    {customer.order_updates ? t('Active') : t('Muted')}
                  </BadgeUI>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}