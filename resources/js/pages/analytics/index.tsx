import React, { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import {
  Download,
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  Eye,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileDown,
  ArrowRight,
  Package,
  ShieldCheck,
  ExternalLink,
  ArrowLeftRight,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  BarChart3,
  Info,
  Clock,
  Mail,
  Phone,
  Crown,
  Briefcase,
  User,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getImageUrl } from '@/utils/image-helper';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/utils/currency-helper';
import { hasPermission, checkPermission } from '@/utils/permissions';
import { Link, router, usePage } from '@inertiajs/react';
import BadgeUI from '@/components/badge-ui';
import { useLayout } from '@/contexts/LayoutContext';

interface Props {
  analytics: {
    metrics: any;
    topProducts?: any[];
    topCustomers?: any[];
    recentActivity?: any[];
    revenueChart?: any[];
    salesChart?: any[];
    inventoryHealth?: {
      totalProducts: number;
      inStock: number;
      lowStock: number;
      outOfStock: number;
      digital: number;
      totalStockUnits: number;
      totalStockValue: number;
      lowStockItems?: Array<{
        id: number;
        name: string;
        stock: number;
        price: number;
        cover_image?: string;
      }>;
    };
    comparative?: {
      period: string;
      preset_label: string;
      days_count: number;
      current_range_text: string;
      previous_range_text: string;
      metrics: {
        revenue: { current: number; previous: number; difference: number; growth: number };
        orders: { current: number; previous: number; difference: number; growth: number };
        aov: { current: number; previous: number; difference: number; growth: number };
      };
      categories: Array<{
        category: string;
        current_sales: number;
        previous_sales: number;
        sales_growth: number;
        current_orders: number;
        previous_orders: number;
        orders_growth: number;
      }>;
      timeline: Array<{
        label: string;
        current_date?: string;
        previous_date?: string;
        current_sales: number;
        previous_sales: number;
        current_orders: number;
        previous_orders: number;
      }>;
    };
  };
  selectedPeriod?: string;
  startDate?: string;
  endDate?: string;
}

export default function Analytics({ analytics, selectedPeriod, startDate, endDate }: Props) {
  const { t } = useTranslation();
  const { auth } = usePage().props as any;
  const { position } = useLayout();
  const [isRtl, setIsRtl] = useState(() => {
    return position === 'right' || (typeof document !== 'undefined' && document.documentElement.dir === 'rtl');
  });

  React.useEffect(() => {
    const checkRtl = () => {
      const currentRtl = position === 'right' || (typeof document !== 'undefined' && document.documentElement.dir === 'rtl');
      setIsRtl(currentRtl);
    };
    checkRtl();

    if (typeof document !== 'undefined') {
      const observer = new MutationObserver(() => {
        checkRtl();
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['dir'] });
      return () => observer.disconnect();
    }
  }, [position]);

  // Comparative Filter States
  const [period, setPeriod] = useState<string>(selectedPeriod || analytics?.comparative?.period || 'last_30_days');
  const [customStart, setCustomStart] = useState<string>(startDate || '');
  const [customEnd, setCustomEnd] = useState<string>(endDate || '');
  const [activeChartMetric, setActiveChartMetric] = useState<'revenue' | 'orders'>('revenue');
  const [comparisonTab, setComparisonTab] = useState<'timeline' | 'categories'>('timeline');

  const renderCustomerGroupBadge = (group: string) => {
    const normalized = (group || 'regular').toLowerCase();
    switch (normalized) {
      case 'vip':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
            <Crown className="h-2.5 w-2.5" />
            {t('VIP')}
          </span>
        );
      case 'wholesale':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
            <Briefcase className="h-2.5 w-2.5" />
            {t('Wholesale')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700">
            <User className="h-2.5 w-2.5" />
            {t('Regular')}
          </span>
        );
    }
  };

  // Format date using window.appSettings.formatDateTime with fallback
  const formatDateTime = (dateStr?: string | Date | null, includeTime: boolean = false): string => {
    if (!dateStr) return '';
    try {
      if (typeof window !== 'undefined' && window.appSettings?.formatDateTime) {
        const formatted = window.appSettings.formatDateTime(dateStr, includeTime);
        if (formatted) return formatted;
      }
      const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
      if (!isNaN(d.getTime())) {
        return includeTime ? d.toLocaleString() : d.toLocaleDateString();
      }
      return String(dateStr);
    } catch {
      return String(dateStr);
    }
  };

  const handleActionClick = (action: string, permission: string) => {
    if (!checkPermission(permission, auth)) {
      return;
    }

    switch (action) {
      case 'export':
        window.open(route('analytics.export'), '_blank');
        break;
    }
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    if (newPeriod !== 'custom') {
      router.get(
        route('analytics.index'),
        { period: newPeriod },
        { preserveState: true, preserveScroll: true, only: ['analytics', 'selectedPeriod', 'startDate', 'endDate'] }
      );
    }
  };

  const handleApplyCustom = () => {
    if (!customStart || !customEnd) return;
    router.get(
      route('analytics.index'),
      { period: 'custom', start_date: customStart, end_date: customEnd },
      { preserveState: true, preserveScroll: true, only: ['analytics', 'selectedPeriod', 'startDate', 'endDate'] }
    );
  };

  const pageActions = [
    ...(hasPermission('export-analytics') ? [{
      label: t('Export Report'),
      icon: <Download className="h-4 w-4" />,
      variant: 'default' as const,
      onClick: () => handleActionClick('export', 'export-analytics')
    }] : [])
  ];

  // Fallback comparative data in case backend comparative object is loading or empty
  const fallbackComparative = {
    period: period || 'last_30_days',
    preset_label: t('Last 30 Days (Default / Recommended)'),
    days_count: 30,
    current_range_text: 'Sep 08, 2024 – Oct 07, 2024',
    previous_range_text: 'Aug 09, 2024 – Sep 07, 2024',
    metrics: {
      revenue: { current: 28450.0, previous: 24100.0, difference: 4350.0, growth: 18.0 },
      orders: { current: 164, previous: 142, difference: 22, growth: 15.5 },
      aov: { current: 173.48, previous: 169.72, difference: 3.76, growth: 2.2 },
    },
    categories: [
      { category: 'Electronics', current_sales: 10811.0, previous_sales: 7712.0, sales_growth: 40.2, current_orders: 62, previous_orders: 45, orders_growth: 37.8 },
      { category: 'Fashion & Apparel', current_sales: 7966.0, previous_sales: 7230.0, sales_growth: 10.2, current_orders: 46, previous_orders: 43, orders_growth: 7.0 },
      { category: 'Home & Living', current_sales: 4552.0, previous_sales: 4338.0, sales_growth: 4.9, current_orders: 26, previous_orders: 26, orders_growth: 0.0 },
      { category: 'Beauty & Care', current_sales: 3129.5, previous_sales: 2892.0, sales_growth: 8.2, current_orders: 18, previous_orders: 17, orders_growth: 5.9 },
      { category: 'Accessories', current_sales: 1991.5, previous_sales: 1928.0, sales_growth: 3.3, current_orders: 12, previous_orders: 11, orders_growth: 9.1 },
    ],
    timeline: [
      { label: 'Sep 08', current_date: 'Sep 08, 2024', previous_date: 'Aug 09, 2024', current_sales: 980, previous_sales: 780, current_orders: 5, previous_orders: 4 },
      { label: 'Sep 13', current_date: 'Sep 13, 2024', previous_date: 'Aug 14, 2024', current_sales: 1120, previous_sales: 890, current_orders: 6, previous_orders: 5 },
      { label: 'Sep 18', current_date: 'Sep 18, 2024', previous_date: 'Aug 19, 2024', current_sales: 850, previous_sales: 790, current_orders: 5, previous_orders: 4 },
      { label: 'Sep 23', current_date: 'Sep 23, 2024', previous_date: 'Aug 24, 2024', current_sales: 1450, previous_sales: 1100, current_orders: 8, previous_orders: 6 },
      { label: 'Sep 28', current_date: 'Sep 28, 2024', previous_date: 'Aug 29, 2024', current_sales: 1300, previous_sales: 980, current_orders: 7, previous_orders: 6 },
      { label: 'Oct 03', current_date: 'Oct 03, 2024', previous_date: 'Sep 03, 2024', current_sales: 1250, previous_sales: 1050, current_orders: 7, previous_orders: 6 },
      { label: 'Oct 07', current_date: 'Oct 07, 2024', previous_date: 'Sep 07, 2024', current_sales: 1550, previous_sales: 1210, current_orders: 9, previous_orders: 7 },
    ],
  };

  const compData = analytics?.comparative || fallbackComparative;

  // Helper for rendering Delta badges with accurate calculations
  const renderDeltaBadge = (growth: number, diffFormatted?: string) => {
    const isPositive = growth > 0;
    const isZero = growth === 0;

    if (isZero) {
      return (
        <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5 shrink-0 whitespace-nowrap border-slate-200 text-slate-600 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          0.0%
        </Badge>
      );
    }

    return (
      <Badge
        variant="outline"
        className={`text-xs font-semibold px-2 py-0.5 inline-flex items-center gap-1 shrink-0 whitespace-nowrap ${
          isPositive
            ? 'border-emerald-300 text-emerald-700 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
            : 'border-rose-300 text-rose-700 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-400'
        }`}
      >
        {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
        {isPositive ? '+' : ''}{growth.toFixed(1)}%
      </Badge>
    );
  };

  const formatDifference = (diff: number, isCurrency: boolean = true) => {
    if (isCurrency) {
      if (diff === 0) return formatCurrency(0);
      const absFormatted = formatCurrency(Math.abs(diff));
      return diff > 0 ? `+${absFormatted}` : `-${absFormatted}`;
    }
    if (diff === 0) return `0 ${t('orders')}`;
    return diff > 0 ? `+${diff} ${t('orders')}` : `${diff} ${t('orders')}`;
  };

  // Default fallback inventory health if not provided by backend
  const fallbackInventory = {
    totalProducts: 45,
    inStock: 31,
    lowStock: 8,
    outOfStock: 4,
    digital: 2,
    totalStockUnits: 1240,
    totalStockValue: 38950,
    lowStockItems: [
      { id: 1, name: 'Wireless Headphones Pro', stock: 2, price: 199.99 },
      { id: 2, name: 'Smart Fitness Watch Series 5', stock: 0, price: 149.50 },
      { id: 3, name: 'Organic Cotton Crewneck T-Shirt', stock: 4, price: 29.00 },
      { id: 4, name: 'Ceramic Pour-Over Coffee Dripper', stock: 0, price: 34.00 },
    ],
  };

  const inventoryHealth = analytics.inventoryHealth || fallbackInventory;
  const totalItems = inventoryHealth.totalProducts || (inventoryHealth.inStock + inventoryHealth.lowStock + inventoryHealth.outOfStock + inventoryHealth.digital);
  const healthRate = totalItems > 0 ? Math.round((inventoryHealth.inStock / totalItems) * 100) : 100;

  const stockBreakdown = [
    {
      name: t('In Stock'),
      key: 'in_stock',
      value: inventoryHealth.inStock,
      color: '#10b981', // Emerald
      textColor: 'text-emerald-700 dark:text-emerald-400',
      bgColor: 'bg-emerald-50/70 dark:bg-emerald-950/20',
      borderColor: 'border-emerald-200/80 dark:border-emerald-900/50',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
      description: t('Healthy inventory (> 5 units)'),
      icon: CheckCircle2,
    },
    {
      name: t('Low Stock'),
      key: 'low_stock',
      value: inventoryHealth.lowStock,
      color: '#f59e0b', // Amber
      textColor: 'text-amber-700 dark:text-amber-400',
      bgColor: 'bg-amber-50/70 dark:bg-amber-950/20',
      borderColor: 'border-amber-200/80 dark:border-amber-900/50',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
      description: t('Urgent attention (≤ 5 units)'),
      icon: AlertTriangle,
    },
    {
      name: t('Out of Stock'),
      key: 'out_of_stock',
      value: inventoryHealth.outOfStock,
      color: '#ef4444', // Red
      textColor: 'text-rose-700 dark:text-rose-400',
      bgColor: 'bg-rose-50/70 dark:bg-rose-950/20',
      borderColor: 'border-rose-200/80 dark:border-rose-900/50',
      badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300',
      description: t('Depleted (0 units, lost sales risk)'),
      icon: XCircle,
    },
    {
      name: t('Digital / Downloadable'),
      key: 'digital',
      value: inventoryHealth.digital,
      color: '#6366f1', // Indigo
      textColor: 'text-indigo-700 dark:text-indigo-400',
      bgColor: 'bg-indigo-50/70 dark:bg-indigo-950/20',
      borderColor: 'border-indigo-200/80 dark:border-indigo-900/50',
      badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
      description: t('Unlimited stock (digital files)'),
      icon: FileDown,
    },
  ];

  return (
    <PageTemplate
      title={t('Analytics & Reporting')}
      url="/analytics"
      actions={pageActions}
      breadcrumbs={[
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Analytics & Reporting') }
      ]}
      description={t('Comprehensive insights into your store performance, sales trends, and customer behavior.')}
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Total Revenue */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-emerald-50 dark:bg-emerald-950/20  rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Total Revenue')}</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl font-mono">{formatCurrency(analytics?.metrics?.revenue?.current || 0)}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className={`text-xs font-medium ${(analytics?.metrics?.revenue?.change ?? 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {(analytics?.metrics?.revenue?.change ?? 0) >= 0 ? '+' : ''}{Number(analytics?.metrics?.revenue?.change ?? 0).toFixed(1)}% {t('from last month')}
                  </span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-emerald-100 p-2.5 dark:bg-emerald-900/40 sm:p-3">
                <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400 sm:h-7 sm:w-7" />
              </div>
            </div>
          </div>

          {/* Card 2: Total Orders */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-purple-50 dark:bg-purple-950/20  rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Total Orders')}</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl">{Number(analytics?.metrics?.orders?.current || 0).toLocaleString()}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className={`text-xs font-medium ${(analytics?.metrics?.orders?.change ?? 0) >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {(analytics?.metrics?.orders?.change ?? 0) >= 0 ? '+' : ''}{analytics?.metrics?.orders?.change ?? 0} {t('from last month')}
                  </span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-purple-100 p-2.5 dark:bg-purple-900/40 sm:p-3">
                <ShoppingCart className="h-6 w-6 text-purple-600 dark:text-purple-400 sm:h-7 sm:w-7" />
              </div>
            </div>
          </div>

          {/* Card 3: Total Customers */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-blue-50 dark:bg-blue-900/20  rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Total Customers')}</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl">{Number(analytics?.metrics?.customers?.total || 0).toLocaleString()}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    +{analytics?.metrics?.customers?.new || 0} {t('new this month')}
                  </span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-blue-100 p-2.5 dark:bg-blue-900/40 sm:p-3">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400 sm:h-7 sm:w-7" />
              </div>
            </div>
          </div>

          {/* Card 4: Conversion Rate */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-orange-50 dark:bg-orange-950/20  rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Conversion Rate')}</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl">
                  {analytics?.metrics?.conversion?.rate !== undefined ? `${analytics.metrics.conversion.rate}%` : '3.2%'}
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                    {(analytics?.metrics?.conversion?.change ?? 0.5) >= 0 ? '+' : ''}{analytics?.metrics?.conversion?.change ?? 0.5}% {t('from last month')}
                  </span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-orange-100 p-2.5 dark:bg-orange-900/40 sm:p-3">
                <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400 sm:h-7 sm:w-7" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Comparative Analytics Module ── */}
        <Card className="border border-border shadow-sm dark:bg-zinc-900 overflow-hidden">
          <CardHeader className="pb-3 pt-5 px-4 sm:px-6 border-b border-border/80">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left: Title & Subtitle */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
                  <ArrowLeftRight className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-semibold text-foreground">
                      {t('Comparative Analytics')}
                    </CardTitle>
                    <Badge variant="outline" className="font-semibold text-xs border-primary/30 text-primary bg-primary/5">
                      {compData.preset_label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('Period-over-period performance analysis across orders, sales, and category revenue')}
                  </p>
                </div>
              </div>

              {/* Right: Date Range Presets Dropdown & Custom Inputs */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="w-[230px] sm:w-[250px]">
                  <Select value={period} onValueChange={handlePeriodChange}>
                    <SelectTrigger className="h-8 text-xs font-medium cursor-pointer border-border/80 bg-background hover:bg-muted/50 focus:ring-1 focus:ring-primary">
                      <SelectValue placeholder={t('Select Date Range')} />
                    </SelectTrigger>
                    <SelectContent dir={isRtl ? 'rtl' : 'ltr'}>
                      <SelectItem value="today" className="text-xs cursor-pointer">{t('Today')}</SelectItem>
                      <SelectItem value="last_7_days" className="text-xs cursor-pointer">{t('Last 7 Days')}</SelectItem>
                      <SelectItem value="last_30_days" className="text-xs cursor-pointer">{t('Last 30 Days (Default / Recommended)')}</SelectItem>
                      <SelectItem value="last_90_days" className="text-xs cursor-pointer">{t('Last 90 Days (3 Months)')}</SelectItem>
                      <SelectItem value="last_6_months" className="text-xs cursor-pointer">{t('Last 6 Months')}</SelectItem>
                      <SelectItem value="this_year" className="text-xs cursor-pointer">{t('This Year (12 Months)')}</SelectItem>
                      <SelectItem value="custom" className="text-xs cursor-pointer">{t('Custom Range (Pick From & To Date)')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {period === 'custom' && (
                  <div className="flex items-center gap-2 flex-wrap bg-muted/40 p-1 rounded-lg border border-border/70">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-medium text-muted-foreground pl-1.5">{t('From')}:</span>
                      <Input
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="h-8 text-xs w-[150px] sm:w-[155px] bg-background border-border/80 px-2.5 font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-medium text-muted-foreground">{t('To')}:</span>
                      <Input
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="h-8 text-xs w-[150px] sm:w-[155px] bg-background border-border/80 px-2.5 font-mono"
                      />
                    </div>
                    <Button
                      size="sm"
                      className="h-8 text-xs px-3.5 font-medium cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={handleApplyCustom}
                      disabled={!customStart || !customEnd}
                    >
                      {t('Apply')}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 space-y-5">
            {/* 1. Explanatory Note & Comparison Range Banner */}
            <div className="rounded-xl border border-blue-200/80 bg-blue-50/70 dark:border-blue-900/50 dark:bg-blue-950/20 p-3.5 sm:p-4 text-xs text-blue-950 dark:text-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <div className="flex flex-wrap items-center gap-2 font-medium">
                    <span>{t('Selected Range')}: <strong className="text-foreground">{compData.preset_label}</strong></span>
                    <span className="text-blue-300 dark:text-blue-700">•</span>
                    <span>{t('Analyzing')}: <strong className="text-foreground">{compData.days_count} {t('Days')}</strong></span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                    {t('Current Period')}: <strong className="text-foreground">{compData.current_range_text}</strong> ({compData.days_count} {t('days')}) {t('compared with Previous Period')}: <strong className="text-foreground">{compData.previous_range_text}</strong> ({compData.days_count} {t('days')}).
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-100/60 dark:border-blue-800 dark:text-blue-300 dark:bg-blue-900/40 text-[11px] font-semibold self-start sm:self-auto shrink-0">
                {compData.days_count} {t('Days Comparison')}
              </Badge>
            </div>

            {/* 2. Three Core Comparative KPI Cards (Revenue, Orders, AOV) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
              {/* Card A: Revenue Comparison */}
              <div className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card hover:border-border transition-all shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-border/60">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <DollarSign className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-foreground truncate">{t('Revenue Comparison')}</h4>
                        <span className="text-[10px] text-muted-foreground block truncate">{t('Total sales performance')}</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {renderDeltaBadge(
                        compData.metrics.revenue.growth,
                        formatDifference(compData.metrics.revenue.difference, true)
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-muted/30 border border-border/50 mb-3">
                    <div className="space-y-1 min-w-0 overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-xs font-semibold text-foreground truncate">
                          {t('Current Period')}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono block truncate" title={compData.current_range_text}>
                        {compData.current_range_text}
                      </span>
                      <p className="text-base sm:text-lg 2xl:text-xl font-bold font-mono text-foreground tracking-tight pt-0.5 truncate" title={formatCurrency(compData.metrics.revenue.current)}>
                        {formatCurrency(compData.metrics.revenue.current)}
                      </p>
                    </div>

                    <div className="space-y-1 pl-2.5 rtl:pl-0 rtl:pr-2.5 border-l rtl:border-l-0 rtl:border-r border-border/60 min-w-0 overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                        <span className="text-xs font-semibold text-foreground truncate">
                          {t('Previous Period')}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono block truncate" title={compData.previous_range_text}>
                        {compData.previous_range_text}
                      </span>
                      <p className="text-base sm:text-lg 2xl:text-xl font-semibold font-mono text-muted-foreground tracking-tight pt-0.5 truncate" title={formatCurrency(compData.metrics.revenue.previous)}>
                        {formatCurrency(compData.metrics.revenue.previous)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-border/40">
                  <span className="text-muted-foreground">{t('Net Difference')}:</span>
                  <span className={`font-mono font-semibold ${compData.metrics.revenue.difference >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {formatDifference(compData.metrics.revenue.difference, true)}
                  </span>
                </div>
              </div>

              {/* Card B: Orders Comparison */}
              <div className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card hover:border-border transition-all shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-border/60">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <ShoppingCart className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-foreground truncate">{t('Orders Comparison')}</h4>
                        <span className="text-[10px] text-muted-foreground block truncate">{t('Order volume & demand')}</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {renderDeltaBadge(
                        compData.metrics.orders.growth,
                        formatDifference(compData.metrics.orders.difference, false)
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-muted/30 border border-border/50 mb-3">
                    <div className="space-y-1 min-w-0 overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-xs font-semibold text-foreground truncate">
                          {t('Current Period')}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono block truncate" title={compData.current_range_text}>
                        {compData.current_range_text}
                      </span>
                      <p className="text-base sm:text-lg 2xl:text-xl font-bold font-mono text-foreground tracking-tight pt-0.5 truncate" title={`${compData.metrics.orders.current.toLocaleString()} orders`}>
                        {compData.metrics.orders.current.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{t('orders')}</span>
                      </p>
                    </div>

                    <div className="space-y-1 pl-2.5 rtl:pl-0 rtl:pr-2.5 border-l rtl:border-l-0 rtl:border-r border-border/60 min-w-0 overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                        <span className="text-xs font-semibold text-foreground truncate">
                          {t('Previous Period')}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono block truncate" title={compData.previous_range_text}>
                        {compData.previous_range_text}
                      </span>
                      <p className="text-base sm:text-lg 2xl:text-xl font-semibold font-mono text-muted-foreground tracking-tight pt-0.5 truncate" title={`${compData.metrics.orders.previous.toLocaleString()} orders`}>
                        {compData.metrics.orders.previous.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{t('orders')}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-border/40">
                  <span className="text-muted-foreground">{t('Net Difference')}:</span>
                  <span className={`font-mono font-semibold ${compData.metrics.orders.difference >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {formatDifference(compData.metrics.orders.difference, false)}
                  </span>
                </div>
              </div>

              {/* Card C: Average Order Value (AOV) Comparison */}
              <div className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card hover:border-border transition-all shadow-xs flex flex-col justify-between md:col-span-2 xl:col-span-1">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-border/60">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-foreground truncate">{t('Average Order Value (AOV)')}</h4>
                        <span className="text-[10px] text-muted-foreground block truncate">{t('Average basket size')}</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {renderDeltaBadge(
                        compData.metrics.aov.growth,
                        formatDifference(compData.metrics.aov.difference, true)
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-muted/30 border border-border/50 mb-3">
                    <div className="space-y-1 min-w-0 overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-xs font-semibold text-foreground truncate">
                          {t('Current Period')}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono block truncate" title={compData.current_range_text}>
                        {compData.current_range_text}
                      </span>
                      <p className="text-base sm:text-lg 2xl:text-xl font-bold font-mono text-foreground tracking-tight pt-0.5 truncate" title={formatCurrency(compData.metrics.aov.current)}>
                        {formatCurrency(compData.metrics.aov.current)}
                      </p>
                    </div>

                    <div className="space-y-1 pl-2.5 rtl:pl-0 rtl:pr-2.5 border-l rtl:border-l-0 rtl:border-r border-border/60 min-w-0 overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                        <span className="text-xs font-semibold text-foreground truncate">
                          {t('Previous Period')}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono block truncate" title={compData.previous_range_text}>
                        {compData.previous_range_text}
                      </span>
                      <p className="text-base sm:text-lg 2xl:text-xl font-semibold font-mono text-muted-foreground tracking-tight pt-0.5 truncate" title={formatCurrency(compData.metrics.aov.previous)}>
                        {formatCurrency(compData.metrics.aov.previous)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-border/40">
                  <span className="text-muted-foreground">{t('Net Difference')}:</span>
                  <span className={`font-mono font-semibold ${compData.metrics.aov.difference >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {formatDifference(compData.metrics.aov.difference, true)}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Comparative Visuals: Tab Switcher (Timeline Curve vs Category Breakdown) */}
            <div className="rounded-xl border border-border/80 p-4 sm:p-5 bg-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-border/70">
                {/* View Switcher Tabs */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/70 border border-border/60 self-start sm:self-auto">
                  <button
                    onClick={() => setComparisonTab('timeline')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs rounded-lg transition-all cursor-pointer ${
                      comparisonTab === 'timeline'
                        ? 'bg-background text-foreground shadow-xs border border-border/70 font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50 font-medium'
                    }`}
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>{t('Timeline Overlay')}</span>
                  </button>
                  <button
                    onClick={() => setComparisonTab('categories')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs rounded-lg transition-all cursor-pointer ${
                      comparisonTab === 'categories'
                        ? 'bg-background text-foreground shadow-xs border border-border/70 font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50 font-medium'
                    }`}
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    <span>{t('Category Breakdown')}</span>
                  </button>
                </div>

                {/* Metric Switcher Tabs (Revenue vs Orders) */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/70 border border-border/60 self-start sm:self-auto">
                  <button
                    onClick={() => setActiveChartMetric('revenue')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs rounded-lg transition-all cursor-pointer ${
                      activeChartMetric === 'revenue'
                        ? 'bg-background text-foreground shadow-xs border border-border/70 font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50 font-medium'
                    }`}
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>{t('Revenue ($)')}</span>
                  </button>
                  <button
                    onClick={() => setActiveChartMetric('orders')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs rounded-lg transition-all cursor-pointer ${
                      activeChartMetric === 'orders'
                        ? 'bg-background text-foreground shadow-xs border border-border/70 font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50 font-medium'
                    }`}
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span>{t('Orders Count')}</span>
                  </button>
                </div>
              </div>

              {/* View 1: Timeline Curve Overlay Chart */}
              {comparisonTab === 'timeline' && (
                <div>
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-1 rounded-full bg-emerald-500 inline-block" />
                        <span className="font-semibold text-foreground">{t('Current Period')} ({compData.current_range_text})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-0.5 border-t-2 border-dashed border-slate-400 inline-block" />
                        <span className="text-muted-foreground">{t('Previous Period')} ({compData.previous_range_text})</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-[270px] sm:h-[300px]" dir="ltr" style={{ direction: 'ltr' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={compData.timeline}
                        margin={{ top: 10, right: isRtl ? 10 : 10, left: isRtl ? 10 : -5, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="currentPeriodGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} vertical={false} />
                        <XAxis
                          dataKey="label"
                          reversed={isRtl}
                          tick={{ fontSize: 11, fill: 'currentColor' }}
                          className="text-muted-foreground"
                          axisLine={{ stroke: 'currentColor', strokeOpacity: 0.15 }}
                          tickLine={false}
                        />
                        <YAxis
                          orientation={isRtl ? 'right' : 'left'}
                          tick={{ fontSize: 10, fill: 'currentColor' }}
                          className="text-muted-foreground font-mono"
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => {
                            if (activeChartMetric === 'revenue') {
                              if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
                              if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
                              return `$${v}`;
                            }
                            return `${v}`;
                          }}
                          width={48}
                        />
                        <RechartsTooltip
                          cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                          wrapperStyle={{ zIndex: 100, outline: 'none', pointerEvents: 'none' }}
                          content={({ active, payload, label }: any) => {
                            if (!active || !payload || !payload.length) return null;
                            const curItem = payload.find((p: any) => p.dataKey === (activeChartMetric === 'revenue' ? 'current_sales' : 'current_orders'));
                            const prevItem = payload.find((p: any) => p.dataKey === (activeChartMetric === 'revenue' ? 'previous_sales' : 'previous_orders'));
                            const curVal = Number(curItem?.value || 0);
                            const prevVal = Number(prevItem?.value || 0);
                            const itemData = curItem?.payload || prevItem?.payload || {};
                            const curDate = itemData.current_date;
                            const prevDate = itemData.previous_date;
                            const diff = curVal - prevVal;
                            const growth = prevVal > 0 ? ((diff / prevVal) * 100).toFixed(1) : (curVal > 0 ? '100.0' : '0.0');

                            return (
                              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xl min-w-[230px] pointer-events-none select-none text-start" dir={isRtl ? 'rtl' : 'ltr'}>
                                <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                  <div>
                                    <span className="font-semibold text-foreground">{formatDateTime(curDate, false) || curDate || label}</span>
                                    {prevDate && (
                                      <span className="block text-[10px] font-normal text-muted-foreground mt-0.5">
                                        {t('vs')} {formatDateTime(prevDate, false) || prevDate}
                                      </span>
                                    )}
                                  </div>
                                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${diff >= 0 ? 'text-emerald-600 border-emerald-300' : 'text-rose-600 border-rose-300'}`}>
                                    {diff >= 0 ? '+' : ''}{growth}%
                                  </Badge>
                                </div>
                                <div className="space-y-1.5 text-xs">
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                                      {t('Current')}:
                                    </span>
                                    <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                                      {activeChartMetric === 'revenue' ? formatCurrency(curVal) : `${curVal} ${t('orders')}`}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
                                      {t('Previous')}:
                                    </span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                                      {activeChartMetric === 'revenue' ? formatCurrency(prevVal) : `${prevVal} ${t('orders')}`}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }}
                        />
                        {/* Current Period Line (Solid Emerald) */}
                        <Area
                          type="monotone"
                          dataKey={activeChartMetric === 'revenue' ? 'current_sales' : 'current_orders'}
                          name={t('Current Period')}
                          stroke="#10b981"
                          strokeWidth={2.5}
                          fill="url(#currentPeriodGrad)"
                          dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                          activeDot={{ r: 5, fill: '#10b981', strokeWidth: 0 }}
                        />
                        {/* Previous Period Line (Dashed Slate) */}
                        <Area
                          type="monotone"
                          dataKey={activeChartMetric === 'revenue' ? 'previous_sales' : 'previous_orders'}
                          name={t('Previous Period')}
                          stroke="#94a3b8"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          fill="none"
                          dot={{ r: 2.5, fill: '#94a3b8', strokeWidth: 0 }}
                          activeDot={{ r: 4.5, fill: '#94a3b8', strokeWidth: 0 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* View 2: Category Breakdown Grouped Bar Chart & Comparative Table */}
              {comparisonTab === 'categories' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs pb-1">
                    <span className="text-muted-foreground">{t('Compare sales performance across product categories')}</span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 text-xs font-medium">
                        <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                        {t('Current Period')}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-medium">
                        <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
                        {t('Previous Period')}
                      </span>
                    </div>
                  </div>

                  {/* Grouped Bar Chart */}
                  <div className="w-full h-[250px] sm:h-[280px]" dir="ltr" style={{ direction: 'ltr' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={compData.categories}
                        margin={{ top: 10, right: isRtl ? 10 : 10, left: isRtl ? 10 : -5, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} vertical={false} />
                        <XAxis
                          dataKey="category"
                          reversed={isRtl}
                          tick={{ fontSize: 11, fill: 'currentColor' }}
                          className="text-muted-foreground"
                          axisLine={{ stroke: 'currentColor', strokeOpacity: 0.15 }}
                          tickLine={false}
                          interval={0}
                          angle={isRtl ? 10 : -10}
                          textAnchor={isRtl ? 'start' : 'end'}
                          height={40}
                        />
                        <YAxis
                          orientation={isRtl ? 'right' : 'left'}
                          tick={{ fontSize: 10, fill: 'currentColor' }}
                          className="text-muted-foreground font-mono"
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => {
                            if (activeChartMetric === 'revenue') {
                              if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
                              return `$${v}`;
                            }
                            return `${v}`;
                          }}
                          width={48}
                        />
                        <RechartsTooltip
                          cursor={{ fill: 'currentColor', fillOpacity: 0.05 }}
                          wrapperStyle={{ zIndex: 100, outline: 'none', pointerEvents: 'none' }}
                          content={({ active, payload, label }: any) => {
                            if (!active || !payload || !payload.length) return null;
                            const curVal = Number(payload.find((p: any) => p.dataKey === (activeChartMetric === 'revenue' ? 'current_sales' : 'current_orders'))?.value || 0);
                            const prevVal = Number(payload.find((p: any) => p.dataKey === (activeChartMetric === 'revenue' ? 'previous_sales' : 'previous_orders'))?.value || 0);
                            const diff = curVal - prevVal;
                            const growth = prevVal > 0 ? ((diff / prevVal) * 100).toFixed(1) : (curVal > 0 ? '100.0' : '0.0');

                            return (
                              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xl min-w-[210px] pointer-events-none select-none text-start" dir={isRtl ? 'rtl' : 'ltr'}>
                                <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                  <span>{label}</span>
                                  <Badge variant="outline" className={`text-[10px] px-1 py-0 ${diff >= 0 ? 'text-emerald-600 border-emerald-300' : 'text-rose-600 border-rose-300'}`}>
                                    {diff >= 0 ? '+' : ''}{growth}%
                                  </Badge>
                                </div>
                                <div className="space-y-1.5 text-xs">
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shrink-0" />
                                      {t('Current')}:
                                    </span>
                                    <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                                      {activeChartMetric === 'revenue' ? formatCurrency(curVal) : `${curVal} ${t('orders')}`}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                      <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 shrink-0" />
                                      {t('Previous')}:
                                    </span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                                      {activeChartMetric === 'revenue' ? formatCurrency(prevVal) : `${prevVal} ${t('orders')}`}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }}
                        />
                        <Bar
                          dataKey={activeChartMetric === 'revenue' ? 'current_sales' : 'current_orders'}
                          name={t('Current Period')}
                          fill="#10b981"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey={activeChartMetric === 'revenue' ? 'previous_sales' : 'previous_orders'}
                          name={t('Previous Period')}
                          fill="#6366f1"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Category Breakdown Comparison Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                    {compData.categories.map((cat, idx) => {
                      const isSalesPos = cat.sales_growth >= 0;
                      const salesDiff = cat.current_sales - cat.previous_sales;
                      return (
                        <div
                          key={idx}
                          className="p-3.5 sm:p-4 rounded-xl border border-border/80 bg-card hover:border-border hover:shadow-xs transition-all flex flex-col justify-between"
                        >
                          {/* Top: Category name + growth badge */}
                          <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-border/60">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <Layers className="h-3.5 w-3.5" />
                              </div>
                              <span className="text-xs font-semibold text-foreground truncate">{cat.category}</span>
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-semibold px-2 py-0.5 shrink-0 inline-flex items-center gap-1 ${
                                isSalesPos
                                  ? 'border-emerald-300 text-emerald-700 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                                  : 'border-rose-300 text-rose-700 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-400'
                              }`}
                            >
                              {isSalesPos ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                              {isSalesPos ? '+' : ''}{cat.sales_growth.toFixed(1)}%
                            </Badge>
                          </div>

                          {/* Middle: 2-column comparison box */}
                          <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/50 mb-2.5">
                            {/* Current Period */}
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                <span className="text-[11px] font-semibold text-foreground">{t('Current')}</span>
                              </div>
                              <p className="text-sm font-bold font-mono text-foreground tracking-tight truncate">
                                {formatCurrency(cat.current_sales)}
                              </p>
                              <span className="text-[10px] text-muted-foreground block font-mono truncate">
                                {cat.current_orders} {t('orders')}
                              </span>
                            </div>

                            {/* Previous Period */}
                            <div className="space-y-1 pl-2.5 rtl:pl-0 rtl:pr-2.5 border-l rtl:border-l-0 rtl:border-r border-border/60 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                                <span className="text-[11px] font-semibold text-foreground">{t('Previous')}</span>
                              </div>
                              <p className="text-sm font-semibold font-mono text-muted-foreground tracking-tight truncate">
                                {formatCurrency(cat.previous_sales)}
                              </p>
                              <span className="text-[10px] text-muted-foreground block font-mono truncate">
                                {cat.previous_orders} {t('orders')}
                              </span>
                            </div>
                          </div>

                          {/* Bottom: Net Difference row */}
                          <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-border/40">
                            <span className="text-muted-foreground">{t('Net Difference')}:</span>
                            <span className={`font-mono font-semibold ${salesDiff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {formatDifference(salesDiff, true)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Inventory Health & Stock Status Module ── */}
        <Card className="border border-border shadow-sm dark:bg-zinc-900 overflow-hidden">
          <CardHeader className="pb-3 pt-5 px-4 sm:px-6 border-b border-border/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0 ring-4 ring-primary/5">
                  <Boxes className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-base sm:text-lg font-semibold text-foreground">
                      {t('Inventory Health & Stock Status')}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={`font-semibold text-xs px-2.5 py-0.5 rounded-full ${
                        healthRate >= 70
                          ? 'border-emerald-300 text-emerald-700 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                          : healthRate >= 40
                          ? 'border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400'
                          : 'border-rose-300 text-rose-700 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400'
                      }`}
                    >
                      {healthRate}% {t('Healthy')}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('Real-time product stock level tracking and threshold alerts')}
                  </p>
                </div>
              </div>

              {hasPermission('view-products') && (
                <Link
                  href={route('products.index')}
                  className="inline-flex items-center gap-1 text-xs text-primary font-medium shrink-0 px-2.5 py-1.5 rounded-lg hover:gap-1.5 transition-all duration-150"
                >
                  {t('View all')} <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Donut Chart & Breakdown Category Cards */}
              <div className="lg:col-span-6 flex flex-col items-center">
                <div className="relative w-full h-[230px] sm:h-[250px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <RechartsTooltip
                        wrapperStyle={{ zIndex: 100, outline: 'none', pointerEvents: 'none' }}
                        content={({ active, payload }: any) => {
                          if (!active || !payload || !payload.length) return null;
                          const data = payload[0];
                          const pct = totalItems > 0 ? ((data.value / totalItems) * 100).toFixed(1) : '0';
                          return (
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xl min-w-[200px] pointer-events-none select-none text-start" dir={isRtl ? 'rtl' : 'ltr'}>
                              <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: data.payload.color }} />
                                <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">{data.name}</span>
                              </div>
                              <div className="space-y-1 text-xs">
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-muted-foreground">{t('Products')}:</span>
                                  <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                                    {data.value} {t('items')}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-muted-foreground">{t('Share')}:</span>
                                  <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                                    {pct}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Pie
                        data={stockBreakdown.filter((d) => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={92}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={2}
                        stroke="hsl(var(--card))"
                      >
                        {stockBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Centered Donut Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-extrabold text-foreground font-mono tracking-tight">
                      {totalItems}
                    </span>
                    <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                      {t('Total Products')}
                    </span>
                  </div>
                </div>

                {/* 4 Category Breakdown Cards */}
                <div className="grid grid-cols-2 gap-2.5 w-full mt-2">
                  {stockBreakdown.map((item) => {
                    const Icon = item.icon;
                    const pct = totalItems > 0 ? Math.round((item.value / totalItems) * 100) : 0;
                    return (
                      <div
                        key={item.key}
                        className={`p-2.5 rounded-xl border ${item.bgColor} ${item.borderColor} flex items-center justify-between gap-2 transition-all hover:shadow-xs`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon className={`h-4 w-4 shrink-0 ${item.textColor}`} />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">{item.name}</p>
                            <p className="text-[10px] text-muted-foreground">{pct}% {t('of catalog')}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full shrink-0 ${item.badgeClass}`}>
                          {item.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Inventory Valuation & Threshold Markers */}
              <div className="lg:col-span-6 space-y-4">
                {/* 2 Top Metric Highlights */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative overflow-hidden p-3.5 sm:p-4 rounded-xl border  transition-all duration-200 hover:shadow-xs">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <p className="text-xs text-muted-foreground font-medium">{t('Total Units in Stock')}</p>
                      <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                        <Package className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold font-mono text-foreground tracking-tight">
                      {Number(inventoryHealth.totalStockUnits || 0).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5 font-medium">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      {t('Physical warehouse inventory')}
                    </p>
                  </div>
                  <div className="relative overflow-hidden p-3.5 sm:p-4 rounded-xl border border-border/80 bg-muted/30 dark:bg-muted/20 transition-all duration-200 hover:shadow-xs">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <p className="text-xs text-muted-foreground font-medium">{t('Total Stock Valuation')}</p>
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <DollarSign className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold font-mono tracking-tight">
                      {formatCurrency(inventoryHealth.totalStockValue || 0)}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5 font-medium">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      {t('Estimated asset value')}
                    </p>
                  </div>
                </div>

                {/* Urgent Threshold Alerts / Items Requiring Attention */}
                <div className="rounded-xl border border-border/80 p-3.5 sm:p-4 bg-card flex flex-col">
                  <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-border/60 shrink-0">
                    <div className="flex items-center gap-2">
                      {(inventoryHealth.outOfStock > 0 || inventoryHealth.lowStock > 0) ? (
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                          <AlertTriangle className="h-3.5 w-3.5" />
                        </span>
                      ) : (
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                          <ShieldCheck className="h-3.5 w-3.5" />
                        </span>
                      )}
                      <span className="text-xs font-semibold text-foreground">
                        {(inventoryHealth.outOfStock > 0 || inventoryHealth.lowStock > 0)
                          ? t('Critical Stock Alerts (≤ 5 units)')
                          : t('All Products Well Stocked')}
                      </span>
                    </div>
                    {inventoryHealth.lowStockItems && inventoryHealth.lowStockItems.length > 0 && (
                      <Badge variant="outline" className="text-[10px] font-semibold border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400 px-1.5 py-0.5">
                        {inventoryHealth.lowStockItems.length} {t('items')}
                      </Badge>
                    )}
                  </div>

                  {inventoryHealth.lowStockItems && inventoryHealth.lowStockItems.length > 0 ? (
                    <div className="space-y-2 max-h-[230px] overflow-y-auto pr-1.5 scrollbar-thin">
                      {inventoryHealth.lowStockItems.map((prod) => (
                        <div
                          key={prod.id}
                          className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/50 hover:border-border transition-all duration-150 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ring-4 ${
                                prod.stock === 0
                                  ? 'bg-rose-500 ring-rose-500/20'
                                  : 'bg-amber-500 ring-amber-500/20'
                              }`}
                            />
                            <span className="font-medium text-foreground truncate" title={prod.name}>
                              {prod.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className="text-muted-foreground font-mono font-medium">
                              {formatCurrency(prod.price)}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                                prod.stock === 0
                                  ? 'border-rose-300 text-rose-700 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-400'
                                  : 'border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                              }`}
                            >
                              {prod.stock === 0 ? t('Out of Stock') : `${prod.stock} ${t('left')}`}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center">
                      <ShieldCheck className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                      <p className="text-xs text-muted-foreground font-medium">
                        {t('No products are currently low or out of stock. Inventory levels are healthy!')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Top Customers & Recent Activity ── */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 items-stretch">
          {/* Top Customers (Enhanced with Customer Module data) */}
          <Card className="border border-border shadow-sm dark:bg-zinc-900 flex flex-col h-[580px] sm:h-[620px]">
            <CardHeader className="pb-3 pt-5 px-4 sm:px-6 border-b border-border/80 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">{t('Top Customers')}</CardTitle>
                    <p className="text-xs text-muted-foreground">{t('Highest spending customer leaderboard')}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5">
                  {(analytics.topCustomers || []).length} {t('Customers')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 flex-1 overflow-y-auto pr-2 sm:pr-3 scrollbar-thin min-h-0">
              <div className="space-y-3.5">
                {(analytics.topCustomers && analytics.topCustomers.length > 0) ? (
                  analytics.topCustomers.map((customer, index) => {
                    const initials = customer.name
                      ? customer.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
                      : 'CU';
                    const rankBadges = [
                      'bg-amber-500 text-white',
                      'bg-slate-400 text-white',
                      'bg-amber-700 text-white',
                      'bg-muted text-muted-foreground border border-border'
                    ];
                    const rankClass = rankBadges[index] || 'bg-muted text-muted-foreground border border-border';

                    return (
                      <div
                        key={customer.id || index}
                        className="p-3.5 rounded-xl border border-border/80 bg-card hover:bg-muted/20 hover:border-border transition-all space-y-3"
                      >
                        {/* Top Section: Avatar, Identity, Group, Status, Contact, Spent */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            {/* Avatar with Rank Badge */}
                            <div className="relative shrink-0">
                              <Avatar className="h-10 w-10 border border-border/80">
                                <AvatarImage src={getImageUrl(customer.avatar)} alt={customer.name} />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                                  <img src={getImageUrl('/storage/media/avatars/avatar.png')} alt={customer.name} className="object-cover rounded-full" />
                                </AvatarFallback>
                              </Avatar>
                            </div>

                            {/* Customer Info */}
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-semibold text-xs sm:text-sm text-foreground truncate">
                                  {customer.name}
                                </p>
                                {customer.customer_group && renderCustomerGroupBadge(customer.customer_group)}
                                {customer.is_active !== undefined && (
                                  <BadgeUI className={`${customer.is_active ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 font-medium text-xs' : 'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20 font-medium text-xs'}`}>
                                    {customer.is_active ? t('Active') : t('Inactive')}
                                  </BadgeUI>
                                )}
                              </div>

                              {/* Contact Details */}
                              <div className="flex items-center gap-2.5 text-xs text-muted-foreground flex-wrap">
                                <div className="flex items-center gap-1 min-w-0">
                                  <Mail className="h-3 w-3 shrink-0 opacity-60" />
                                  <span className="truncate text-[11px] font-mono">
                                    {customer.email || `--`}
                                  </span>
                                </div>
                                {customer.phone && (
                                  <div className="flex items-center gap-1 shrink-0">
                                    <Phone className="h-3 w-3 shrink-0 opacity-60" />
                                    <span className="text-[11px] font-mono">{customer.phone}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Lifetime Spent Amount */}
                          <div className="shrink-0 text-right space-y-0.5">
                            <p className="font-bold text-sm sm:text-base text-emerald-600 dark:text-emerald-400 font-mono">
                              {customer.spent}
                            </p>
                            <span className="text-[10px] text-muted-foreground block">{t('Total Spent')}</span>
                          </div>
                        </div>

                        {/* Bottom Metrics Bar (Orders, Avg Order, Member Since) */}
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50 text-[11px] bg-muted/20 -mx-3.5 -mb-3.5 px-3.5 py-2 rounded-b-xl">
                          <div>
                            <span className="block text-[10px] font-semibold text-muted-foreground/70">{t('Orders')}</span>
                            <span className="font-semibold text-foreground">{customer.orders ?? 0} {t('completed')}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-semibold text-muted-foreground/70">{t('Avg Order')}</span>
                            <span className="font-semibold text-foreground font-mono">{customer.avg_order_value || '—'}</span>
                          </div>
                          <div className="text-right">
                            <span className="block text-[10px] font-semibold text-muted-foreground/70">{t('Joined')}</span>
                            <span className="font-semibold text-foreground">{formatDateTime(customer.created_at || customer.joined, false) || customer.joined || '—'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground py-6 text-center">
                    {t('No customer data available yet')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity (Alternating Vertical Timeline matching Screenshot 2) */}
          <Card className="border border-border shadow-sm dark:bg-zinc-900 flex flex-col h-[580px] sm:h-[620px]">
            <CardHeader className="pb-3 pt-5 px-4 sm:px-6 border-b border-border/80 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">{t('Recent Activity')}</CardTitle>
                    <p className="text-xs text-muted-foreground">{t('Real-time timeline of store events')}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5">
                  {t('Live Feed')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 flex-1 overflow-y-auto pr-2 sm:pr-3 scrollbar-thin min-h-0">
              {(analytics.recentActivity && analytics.recentActivity.length > 0) ? (
                <div className="relative py-2">
                  {/* Center Vertical Timeline Line */}
                  <div className="absolute left-1/2 top-4 bottom-4 w-0.5 -translate-x-1/2 bg-zinc-200 dark:bg-zinc-800" />

                  {/* Alternating Timeline Items */}
                  <div className="space-y-6">
                    {analytics.recentActivity.map((activity, index) => {
                      const isLeft = index % 2 === 0;
                      const initials = activity.customer_name
                        ? activity.customer_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
                        : 'CU';
                      const rawDate = activity.date || activity.created_at || '';
                      const displayDate = formatDateTime(rawDate, false) || rawDate;

                      return (
                        <div key={index} className="relative flex items-center w-full">
                          {/* Center Green Dot */}
                          <div className="absolute left-1/2 top-6 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-background z-10" />

                          {isLeft ? (
                            /* Card on Left (Screenshot 2 style: Name + Date on left, Avatar on right) */
                            <div className="w-[calc(50%-1.25rem)] mr-auto">
                              <div className="p-3 sm:p-3.5 rounded-xl border border-border/80 bg-card hover:bg-muted/20 hover:border-border transition-all shadow-xs overflow-hidden">
                                {/* Header: Name, Date on left; Avatar on right */}
                                <div className="flex items-center justify-end gap-2 text-right">
                                  <div className="min-w-0">
                                    <p className="font-semibold text-xs sm:text-sm text-foreground truncate">
                                      {activity.customer_name || 'Customer'}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground font-mono">
                                      {displayDate}
                                    </p>
                                  </div>
                                  <Avatar className="h-8 w-8 shrink-0 border border-border/80">
                                    <AvatarImage src={getImageUrl(activity.avatar)} alt={activity.customer_name} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                                      <img src={getImageUrl('/storage/media/avatars/avatar.png')} alt={activity.customer_name} className="object-cover rounded-full" />
                                    </AvatarFallback>
                                  </Avatar>
                                </div>

                                {/* Description */}
                                <p className="text-xs text-muted-foreground mt-2 text-right">
                                  {activity.description}
                                </p>

                                {/* Badges / Order details if available */}
                                {(activity.order_number || activity.amount) && (
                                  <div className="flex flex-wrap items-center justify-between gap-1.5 mt-2 pt-2 border-t border-border/50 min-w-0">
                                    {activity.order_number && (
                                      <BadgeUI className="border-primary/30 text-primary bg-primary/5 text-[10px] max-w-full truncate font-mono">
                                        #{activity.order_number}
                                      </BadgeUI>
                                    )}
                                    {activity.amount && (
                                      <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                                        {activity.amount}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            /* Card on Right (Screenshot 2 style: Avatar on left, Name + Date on right) */
                            <div className="w-[calc(50%-1.25rem)] ml-auto">
                              <div className="p-3 sm:p-3.5 rounded-xl border border-border/80 bg-card hover:bg-muted/20 hover:border-border transition-all shadow-xs overflow-hidden">
                                {/* Header: Avatar on left; Name, Date on right */}
                                <div className="flex items-center justify-start gap-2 text-left">
                                  <Avatar className="h-8 w-8 shrink-0 border border-border/80">
                                      <AvatarImage src={getImageUrl(activity.avatar)} alt={activity.customer_name} />
                                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                                        <img src={getImageUrl('/storage/media/avatars/avatar.png')} alt={activity.customer_name} className="object-cover rounded-full" />
                                      </AvatarFallback>
                                    </Avatar>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-xs sm:text-sm text-foreground truncate">
                                      {activity.customer_name || 'Customer'}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground font-mono">
                                      {displayDate}
                                    </p>
                                  </div>
                                </div>

                                {/* Description */}
                                <p className="text-xs text-muted-foreground mt-2 text-left">
                                  {activity.description}
                                </p>

                                {/* Badges / Order details if available */}
                                {(activity.order_number || activity.amount) && (
                                  <div className="flex flex-wrap items-center justify-between gap-1.5 mt-2 pt-2 border-t border-border/50 min-w-0">
                                    {activity.order_number && (
                                      <BadgeUI className="border-primary/30 text-primary bg-primary/5 text-[10px] max-w-full truncate font-mono">
                                        #{activity.order_number}
                                      </BadgeUI>
                                    )}
                                    {activity.amount && (
                                      <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                                        {activity.amount}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-6 text-center">
                  {t('No recent activity recorded yet')}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTemplate>
  );
}