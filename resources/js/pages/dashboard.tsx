import React, { useState, useEffect } from 'react';
import { PageTemplate, type PageAction } from '@/components/page-template';
import { RefreshCw, BarChart3, Download, Building2, ShoppingCart, Users, DollarSign, Package, TrendingUp, QrCode, Copy, Check, CreditCard, FileText, Tag, Activity, ArrowRight, Sparkles, Store, Bell, Monitor, Layers, Briefcase, CheckCircle, CheckCircle2, Truck, Clock, Eye, ExternalLink, ArrowUpRight, ChevronRight, Trophy, Flame, Zap, Banknote, AlertCircle, Gift, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import BadgeUI from '@/components/badge-ui';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from 'react-i18next';
import { Link, router, usePage } from '@inertiajs/react';
import QRCode from 'react-qr-code';
import { AreaChart, Area, BarChart, Bar, Cell, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, LabelList } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/utils/currency-helper';
import { getImageUrl } from '@/utils/image-helper';
import { useBrand } from '@/contexts/BrandContext';
import { useLayout } from '@/contexts/LayoutContext';
import { THEME_COLORS } from '@/hooks/use-appearance';
import { DashboardOverview } from '@/components/dashboard/dashboard-overview';
import { hasPermission, checkPermission } from '@/utils/permissions';
import UserInitials from '@/components/user-initials';

interface Props {
  dashboardData: {
    metrics: {
      orders?: number;
      completedOrders?: number;
      products?: number;
      customers?: number;
      revenue?: number;
      todaySales?: number;
      todayOrders?: number;
      notificationsCount?: number;
      totalCompanies?: number;
      totalActivePlanCompanies?: number;
      totalStores?: number;
      activeStores?: number;
      totalPlans?: number;
      activePlans?: number;
      totalRevenue?: number;
      monthlyRevenue?: number;
      monthlyGrowth?: number;
      pendingRequests?: number;
      pendingOrders?: number;
      approvedOrders?: number;
      totalOrders?: number;
      activeCoupons?: number;
      totalCoupons?: number;
    };
    recentOrders: any[];
    recentActivity?: any[];
    topProducts?: any[];
    recentShippingMethods?: any[];
    topPlans?: any[];
    monthlyRevenue?: Array<{ month: string; short: string; revenue: number }>;
    revenueYear?: number;
    monthlyCompanies?: Array<{ month: string; short: string; count: number }>;
    companiesYear?: number;
    availableCompanyYears?: number[];
    salesChartData?: Array<{ label: string; sales: number; orders?: number; month?: number }>;
    salesYear?: number;
    salesPeriod?: string;
    categoryChartData?: Array<{ category: string; sales: number; quantity?: number; orders?: number }>;
    categoryYear?: number;
    categoryMonth?: string | number;
    availableYears?: number[];
  };
  currentStore?: any;
  storeUrl?: string;
  isSuperAdmin: boolean;
}

export default function Dashboard({ dashboardData, currentStore, storeUrl, isSuperAdmin }: Props) {
  const { t } = useTranslation();
  const { auth } = usePage().props as any;
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedSalesYear, setSelectedSalesYear] = useState<string>(
    String(dashboardData?.salesYear || new Date().getFullYear())
  );
  const [selectedCategoryYear, setSelectedCategoryYear] = useState<string>(
    String(dashboardData?.categoryYear || new Date().getFullYear())
  );
  const [selectedCategoryMonth, setSelectedCategoryMonth] = useState<string>(
    String(dashboardData?.categoryMonth || (new Date().getMonth() + 1))
  );

  useEffect(() => {
    if (dashboardData?.salesYear) {
      setSelectedSalesYear(String(dashboardData.salesYear));
    }
  }, [dashboardData?.salesYear]);

  useEffect(() => {
    if (dashboardData?.categoryYear) {
      setSelectedCategoryYear(String(dashboardData.categoryYear));
    }
    if (dashboardData?.categoryMonth) {
      setSelectedCategoryMonth(String(dashboardData.categoryMonth));
    }
  }, [dashboardData?.categoryYear, dashboardData?.categoryMonth]);

  const handleSalesYearChange = (year: string) => {
    setSelectedSalesYear(year);
    router.get(
      route('dashboard'),
      {
        salesYear: year,
        categoryYear: selectedCategoryYear,
        categoryMonth: selectedCategoryMonth,
      },
      { preserveState: true, preserveScroll: true, only: ['dashboardData'] }
    );
  };

  const handleCategoryFilterChange = (year: string, month: string) => {
    setSelectedCategoryYear(year);
    setSelectedCategoryMonth(month);
    router.get(
      route('dashboard'),
      {
        salesYear: selectedSalesYear,
        categoryYear: year,
        categoryMonth: month,
      },
      { preserveState: true, preserveScroll: true, only: ['dashboardData'] }
    );
  };

  const MONTHS = [
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

  const currentYearNum = new Date().getFullYear();
  const availableYearsList = dashboardData?.availableYears && dashboardData.availableYears.length > 0
    ? dashboardData.availableYears
    : [currentYearNum, currentYearNum - 1, currentYearNum - 2];

  const selectedMonthObj = MONTHS.find((m) => m.value === String(Number(selectedCategoryMonth))) || MONTHS[0];

  const totalCategorySales = (dashboardData.categoryChartData || []).reduce(
    (sum, item) => sum + (Number(item.sales) || 0),
    0
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const fadeUp = (delay = 0) =>
    `transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}` +
    (delay ? ` delay-[${delay}ms]` : '');

  const breadcrumbs = [
    { title: t('Dashboard') }
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('Good morning');
    if (hour < 18) return t('Good afternoon');
    return t('Good evening');
  };

  const { themeColor, customColor } = useBrand();

  const userHasPermission = (permission: string) => {
    return isSuperAdmin || hasPermission(permission);
  };

  const handleCardClick = (routeName: string, requiredPermission: string, id?: any) => {
    if (!checkPermission(requiredPermission)) {
      return;
    }

    if (id) {
      router.visit(route(routeName, id));
    } else {
      router.visit(route(routeName));
    }
  };

  const getThemeColorValue = () => {
    return themeColor === 'custom' ? customColor : THEME_COLORS[themeColor];
  };

  const copyToClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(storeUrl!);
      } else {
        // Fallback for browsers without clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = storeUrl!;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const [isRefreshing, setIsRefreshing] = useState(false);
  const { position } = useLayout();
  const [isRtl, setIsRtl] = useState(() => {
    return position === 'right' || (typeof document !== 'undefined' && document.documentElement.dir === 'rtl');
  });

  useEffect(() => {
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

  const [selectedRevenueYear, setSelectedRevenueYear] = useState<number>(
    () => dashboardData?.revenueYear ?? new Date().getFullYear()
  );
  const [selectedCompaniesYear, setSelectedCompaniesYear] = useState<number>(
    () => dashboardData?.companiesYear ?? new Date().getFullYear()
  );

  useEffect(() => {
    if (dashboardData?.revenueYear) {
      setSelectedRevenueYear(dashboardData.revenueYear);
    }
  }, [dashboardData?.revenueYear]);

  useEffect(() => {
    if (dashboardData?.companiesYear) {
      setSelectedCompaniesYear(dashboardData.companiesYear);
    }
  }, [dashboardData?.companiesYear]);

  const handleRevenueYearChange = (year: number) => {
    setSelectedRevenueYear(year);
    router.reload({
      data: { revenueYear: year, companiesYear: selectedCompaniesYear },
      only: ['dashboardData'],
      preserveState: true,
      preserveScroll: true
    });
  };

  const handleCompaniesYearChange = (year: number) => {
    setSelectedCompaniesYear(year);
    router.reload({
      data: { revenueYear: selectedRevenueYear, companiesYear: year },
      only: ['dashboardData'],
      preserveState: true,
      preserveScroll: true
    });
  };

  const handleSuperAdminRefresh = () => {
    setIsRefreshing(true);
    router.reload({ only: ['dashboardData'] });
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const [primaryColor, setPrimaryColor] = useState('#3b82f6');

  useEffect(() => {
    const themeVal = getThemeColorValue();
    if (themeVal) {
      setPrimaryColor(themeVal);
    } else {
      const raw = getComputedStyle(document.documentElement).getPropertyValue('--theme-color').trim()
        || getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
      if (raw) setPrimaryColor(raw);
    }
  }, [themeColor, customColor]);

  const pageActions: PageAction[] = isSuperAdmin ? [
    {
      label: t('Refresh'),
      icon: <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />,
      variant: 'outline',
      onClick: handleSuperAdminRefresh
    }
  ] : [
    // ...(userHasPermission('manage-analytics') ? [{
    //   label: t('Analytics'),
    //   icon: <BarChart3 className="h-4 w-4" />,
    //   variant: 'outline',
    //   onClick: () => router.visit(route('analytics.index'))
    // }] : []),
    ...(userHasPermission('export-dashboard') ? [{
      label: t('Export'),
      icon: <Download className="h-4 w-4" />,
      variant: 'default',
      onClick: () => window.open(route('dashboard.export'), '_blank')
    }] : [])
  ];

  if (isSuperAdmin) {
    return (
      <PageTemplate title={t('Dashboard')} description={t('System overview — companies, revenue, plans and recent activity.')} url="/dashboard" actions={pageActions} breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <style>{`
            @keyframes waterWave {
              0%   { transform: translateX(0); }
              50%  { transform: translateX(-25%); }
              100% { transform: translateX(0); }
            }
            .animate-water-wave-1 { animation: waterWave 4s ease-in-out infinite; will-change: transform; }
            .animate-water-wave-2 { animation: waterWave 6s ease-in-out infinite reverse; will-change: transform; }
            .animate-water-wave-3 { animation: waterWave 8s ease-in-out infinite; will-change: transform; }
            @keyframes handWave {
              0%   { transform: rotate(0deg); }
              10%  { transform: rotate(18deg); }
              20%  { transform: rotate(-8deg); }
              30%  { transform: rotate(18deg); }
              40%  { transform: rotate(-4deg); }
              50%  { transform: rotate(12deg); }
              60%  { transform: rotate(0deg); }
              100% { transform: rotate(0deg); }
            }
            .animate-hand-wave { animation: handWave 2.2s ease-in-out infinite; transform-origin: 70% 70%; display: inline-block; }
          `}</style>

          {/* ── Greeting Banner ── */}
          <div className={`group relative overflow-hidden rounded-2xl bg-slate-800 dark:bg-slate-900 p-4 sm:p-5 xl:p-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between ${fadeUp(0)}`}>
            {/* flowing gradient orbs */}
            <span className="pointer-events-none absolute -top-10 -left-10 w-48 h-48 rounded-full bg-emerald-500/10 blur-2xl animate-pulse" style={{ animationDuration: '4s' }} />
            <span className="pointer-events-none absolute -bottom-10 right-0 w-56 h-56 rounded-full bg-blue-500/10 blur-2xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1.5s' }} />
            <span className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-violet-500/5 blur-2xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '0.8s' }} />
            {/* crisp glowing dots */}
            <span className="pointer-events-none absolute top-4 left-1/3 w-1.5 h-1.5 rounded-full bg-emerald-400/80 shadow-[0_0_6px_2px_rgba(52,211,153,0.6)] animate-ping" style={{ animationDuration: '3s' }} />
            <span className="pointer-events-none absolute bottom-4 left-1/4 w-1 h-1 rounded-full bg-blue-400/70 shadow-[0_0_4px_2px_rgba(96,165,250,0.5)] animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }} />
            <span className="pointer-events-none absolute top-3 right-1/4 w-1.5 h-1.5 rounded-full bg-violet-400/70 shadow-[0_0_6px_2px_rgba(167,139,250,0.5)] animate-ping" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }} />
            <span className="pointer-events-none absolute bottom-3 right-1/3 w-1 h-1 rounded-full bg-emerald-300/80 shadow-[0_0_4px_2px_rgba(110,231,183,0.5)] animate-ping" style={{ animationDuration: '2.8s', animationDelay: '1.8s' }} />
            {/* water wave layers at bottom */}
            <div className="pointer-events-none absolute bottom-0 left-0 w-full overflow-hidden" style={{ height: '40px' }}>
              <div className="absolute bottom-0 left-0 w-[200%] animate-water-wave-1">
                <svg viewBox="0 0 2400 40" preserveAspectRatio="none" className="w-full h-[40px]"><path fill="rgba(52,211,153,0.12)" d="M0,20 C150,38 350,0 600,20 C850,38 1050,0 1200,20 C1350,38 1550,0 1800,20 C2050,38 2250,0 2400,20 L2400,40 L0,40 Z" /></svg>
              </div>
              <div className="absolute bottom-0 left-0 w-[200%] animate-water-wave-2">
                <svg viewBox="0 0 2400 40" preserveAspectRatio="none" className="w-full h-[40px]"><path fill="rgba(96,165,250,0.09)" d="M0,26 C200,10 400,38 600,22 C800,8 1000,36 1200,24 C1400,10 1600,38 1800,22 C2000,8 2200,36 2400,24 L2400,40 L0,40 Z" /></svg>
              </div>
              <div className="absolute bottom-0 left-0 w-[200%] animate-water-wave-3">
                <svg viewBox="0 0 2400 40" preserveAspectRatio="none" className="w-full h-[40px]"><path fill="rgba(167,139,250,0.07)" d="M0,30 C300,14 500,38 700,28 C900,16 1100,38 1200,28 C1400,14 1600,38 1900,28 C2100,16 2300,38 2400,28 L2400,40 L0,40 Z" /></svg>
              </div>
            </div>
            <div className="group-hover:translate-x-1 sm:group-hover:translate-x-2 transition-transform duration-300 min-w-0">
              <p className="text-slate-400 text-xs sm:text-sm mb-0.5 transition-colors duration-300">{getGreeting()},</p>
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <h2 className="text-white text-lg sm:text-xl md:text-2xl font-bold truncate group-hover:text-primary transition-colors duration-300">
                  {auth?.user?.name ?? 'Super Admin'}
                </h2>
                <span className="animate-hand-wave text-xl sm:text-2xl md:text-3xl select-none">👋</span>
              </div>
              <p className="text-slate-400 text-xs mt-1 transition-colors duration-300">
                {t("Here's what's happening across your platform today.")}
              </p>
              <div className="flex items-center gap-2.5 sm:gap-3 mt-2.5 sm:mt-3">
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-2 h-2 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1.2s' }} />
                  <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1.2s' }} />
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1.2s' }} />
                </div>
                <span className="text-primary font-semibold text-xs sm:text-sm group-hover:scale-105 transition-transform duration-200">
                  {(dashboardData.metrics.totalActivePlanCompanies ?? 0).toLocaleString()} {t('active plan companies')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0 justify-between xl:justify-end w-full xl:w-auto pt-3 xl:pt-0 border-t border-slate-700/50 xl:border-t-0">
              <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                <div className="rounded-xl bg-white/10 px-3.5 sm:px-4 py-2 sm:py-2.5 text-center flex-1 sm:flex-none min-w-[70px] sm:min-w-[80px] hover:bg-white/15 hover:scale-105 transition-all duration-300">
                  <p className="text-white text-base sm:text-lg font-bold leading-tight">{dashboardData.metrics.totalCompanies ?? 0}</p>
                  <p className="text-slate-400 text-[10px] sm:text-[11px]">{t('Companies')}</p>
                </div>
                <div className="rounded-xl bg-white/10 px-3.5 sm:px-4 py-2 sm:py-2.5 text-center flex-1 sm:flex-none min-w-[70px] sm:min-w-[80px] hover:bg-white/15 hover:scale-105 transition-all duration-300">
                  <p className="text-emerald-400 text-base sm:text-lg font-bold leading-tight">{dashboardData.metrics.monthlyGrowth ?? 0}%</p>
                  <p className="text-slate-400 text-[10px] sm:text-[11px]">{t('Growth')}</p>
                </div>
              </div>
              <div className="w-px h-10 bg-white/10 hidden sm:block" />
              <div className="flex items-center justify-around sm:justify-start gap-1 sm:gap-2">
                {[
                  { icon: Tag, label: t('Coupons'), href: route('coupons.index'), color: 'text-rose-300 hover:text-rose-200', bg: 'hover:bg-rose-400/10' },
                  { icon: Gift, label: t('Referral'), href: route('referral.index'), color: 'text-violet-300 hover:text-violet-200', bg: 'hover:bg-violet-400/10' },
                  { icon: Settings, label: t('Settings'), href: route('settings'), color: 'text-slate-300 hover:text-slate-200', bg: 'hover:bg-white/10' },
                ].map(({ icon: Icon, label, href, color, bg }) => (
                  <Link key={label} href={href} className={`flex flex-col items-center gap-1 rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 transition-all duration-200 ${bg} group/qa`}>
                    <Icon className={`h-4 sm:h-5 w-4 sm:w-5 transition-all duration-200 ${color} group-hover/qa:-translate-y-0.5`} />
                    <span className="text-slate-400 text-[10px] sm:text-xs group-hover/qa:text-slate-300 transition-colors duration-200">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ── KPI Row ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">

            {/* Total Revenue */}
            <Link href={route('plan-orders.index')} className={`group ${fadeUp(100)}`}>
              <Card className="h-full border border-emerald-300 dark:border-emerald-800 shadow-sm bg-emerald-50 dark:bg-emerald-950/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                <CardContent className="relative overflow-hidden p-4 sm:p-5">
                  <span className="pointer-events-none absolute -top-3 right-4 w-10 h-10 rounded-full bg-emerald-300/40 dark:bg-emerald-500/10 animate-ping" style={{ animationDuration: '6s' }} />
                  <span className="pointer-events-none absolute top-1 right-1 w-14 h-14 rounded-full bg-emerald-200/30 dark:bg-emerald-600/10 animate-pulse" style={{ animationDuration: '7s' }} />
                  <span className="pointer-events-none absolute bottom-1 right-8 w-7 h-7 rounded-full bg-emerald-400/30 dark:bg-emerald-400/10 animate-ping" style={{ animationDuration: '5s', animationDelay: '2s' }} />
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="rounded-xl bg-emerald-100 dark:bg-emerald-900/60 p-2 sm:p-2.5">
                      <Banknote className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-emerald-300 group-hover:text-emerald-600 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-200" />
                  </div>
                  <p className="text-emerald-700 dark:text-emerald-400 text-xs mb-1 truncate">{t('Total Revenue')}</p>
                  <p className="text-emerald-900 dark:text-emerald-100 text-xl sm:text-2xl font-bold tracking-tight font-mono truncate" title={formatCurrency(dashboardData.metrics.totalRevenue || 0)}>{formatCurrency(dashboardData.metrics.totalRevenue || 0)}</p>
                  <p className="text-emerald-600 dark:text-emerald-500 text-[11px] mt-1.5 truncate">{t('from approved orders')}</p>
                </CardContent>
              </Card>
            </Link>

            {/* Total Companies */}
            <Link href={route('companies.index')} className={`group ${fadeUp(150)}`}>
              <Card className="h-full border border-blue-200 dark:border-blue-900/50 shadow-sm bg-blue-50 dark:bg-blue-950/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer dark:bg-slate-900">
                <CardContent className="relative overflow-hidden p-4 sm:p-5">
                  <span className="pointer-events-none absolute -top-3 right-4 w-10 h-10 rounded-full bg-blue-300/40 dark:bg-blue-500/10 animate-ping" style={{ animationDuration: '7s' }} />
                  <span className="pointer-events-none absolute top-1 right-1 w-14 h-14 rounded-full bg-blue-200/30 dark:bg-blue-600/10 animate-pulse" style={{ animationDuration: '8s' }} />
                  <span className="pointer-events-none absolute bottom-1 right-8 w-7 h-7 rounded-full bg-blue-400/30 dark:bg-blue-400/10 animate-ping" style={{ animationDuration: '6s', animationDelay: '1.5s' }} />
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="rounded-xl bg-blue-100 dark:bg-blue-900/50 p-2 sm:p-2.5">
                      <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-blue-200 group-hover:text-blue-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-200" />
                  </div>
                  <p className="text-blue-700 dark:text-blue-400 text-xs mb-1 truncate">{t('Total Companies')}</p>
                  <p className="text-blue-900 dark:text-blue-100 text-xl sm:text-2xl font-bold tracking-tight truncate">{(dashboardData.metrics.totalCompanies || 0).toLocaleString()}</p>
                  <p className="text-emerald-600 text-[11px] mt-1.5 flex items-center gap-0.5 truncate">
                    <TrendingUp className="h-3 w-3 shrink-0" /> {dashboardData.metrics.monthlyGrowth || 0}% {t('this month')}
                  </p>
                </CardContent>
              </Card>
            </Link>

            {/* Total Stores */}
            <div className={`group ${fadeUp(200)}`}>
              <Card className="h-full border border-indigo-200 dark:border-indigo-900/50 shadow-sm bg-indigo-50 dark:bg-indigo-950/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <CardContent className="relative overflow-hidden p-4 sm:p-5">
                  <span className="pointer-events-none absolute -top-3 right-4 w-10 h-10 rounded-full bg-indigo-300/40 dark:bg-indigo-500/10 animate-ping" style={{ animationDuration: '7s' }} />
                  <span className="pointer-events-none absolute top-1 right-1 w-14 h-14 rounded-full bg-indigo-200/30 dark:bg-indigo-600/10 animate-pulse" style={{ animationDuration: '8s' }} />
                  <span className="pointer-events-none absolute bottom-1 right-8 w-7 h-7 rounded-full bg-indigo-400/30 dark:bg-indigo-400/10 animate-ping" style={{ animationDuration: '6s', animationDelay: '1s' }} />
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="rounded-xl bg-indigo-100 dark:bg-indigo-900/50 p-2 sm:p-2.5">
                      <Store className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-indigo-200 group-hover:text-indigo-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-200" />
                  </div>
                  <p className="text-indigo-700 dark:text-indigo-400 text-xs mb-1 truncate">{t('Total Stores')}</p>
                  <p className="text-indigo-900 dark:text-indigo-100 text-xl sm:text-2xl font-bold tracking-tight truncate">{(dashboardData.metrics.totalStores || 0).toLocaleString()}</p>
                  <p className="text-indigo-500 dark:text-indigo-400 text-[11px] mt-1.5 truncate">{(dashboardData.metrics.activeStores || 0).toLocaleString()} {t('active stores')}</p>
                </CardContent>
              </Card>
            </div>

            {/* Active Plans */}
            <Link href={route('plans.index')} className={`group ${fadeUp(250)}`}>
              <Card className="h-full border border-violet-200 dark:border-violet-900/50 shadow-sm bg-violet-50 dark:bg-violet-950/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                <CardContent className="relative overflow-hidden p-4 sm:p-5">
                  <span className="pointer-events-none absolute -top-3 right-4 w-10 h-10 rounded-full bg-violet-300/40 dark:bg-violet-500/10 animate-ping" style={{ animationDuration: '8s' }} />
                  <span className="pointer-events-none absolute top-1 right-1 w-14 h-14 rounded-full bg-violet-200/30 dark:bg-violet-600/10 animate-pulse" style={{ animationDuration: '6s' }} />
                  <span className="pointer-events-none absolute bottom-1 right-8 w-7 h-7 rounded-full bg-violet-400/30 dark:bg-violet-400/10 animate-ping" style={{ animationDuration: '5s', animationDelay: '2.5s' }} />
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="rounded-xl bg-violet-100 dark:bg-violet-900/50 p-2 sm:p-2.5">
                      <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-violet-200 group-hover:text-violet-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-200" />
                  </div>
                  <p className="text-violet-700 dark:text-violet-400 text-xs mb-1 truncate">{t('Active Plans')}</p>
                  <p className="text-violet-900 dark:text-violet-100 text-xl sm:text-2xl font-bold tracking-tight truncate">{(dashboardData.metrics.activePlans || 0).toLocaleString()}</p>
                  <p className="text-violet-500 dark:text-violet-400 text-[11px] mt-1.5 truncate">{t('subscription plans')}</p>
                </CardContent>
              </Card>
            </Link>

            {/* Pending Requests (instent of Monthly Growth as requested) */}
            <Link href={route('plan-requests.index')} className={`group ${fadeUp(300)}`}>
              <Card className={`h-full border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer ${
                (dashboardData.metrics.pendingRequests || 0) > 0
                  ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'
              }`}>
                <CardContent className="relative overflow-hidden p-4 sm:p-5">
                  <span className="pointer-events-none absolute -top-3 right-4 w-10 h-10 rounded-full bg-amber-300/40 dark:bg-amber-500/10 animate-ping" style={{ animationDuration: '7s' }} />
                  <span className="pointer-events-none absolute top-1 right-1 w-14 h-14 rounded-full bg-amber-200/30 dark:bg-amber-600/10 animate-pulse" style={{ animationDuration: '9s' }} />
                  <span className="pointer-events-none absolute bottom-1 right-8 w-7 h-7 rounded-full bg-amber-400/30 dark:bg-amber-400/10 animate-ping" style={{ animationDuration: '6s', animationDelay: '3s' }} />
                  <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                    <div className={`rounded-xl p-2 sm:p-2.5 shrink-0 ${(dashboardData.metrics.pendingRequests || 0) > 0 ? 'bg-amber-100 dark:bg-amber-900/50' : 'bg-muted'}`}>
                      <AlertCircle className={`h-4 w-4 sm:h-5 sm:w-5 ${(dashboardData.metrics.pendingRequests || 0) > 0 ? 'text-amber-600 dark:text-amber-400 animate-pulse' : 'text-muted-foreground'}`} />
                    </div>
                    {(dashboardData.metrics.pendingRequests || 0) > 0 && (
                      <BadgeUI className="bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-400 dark:ring-amber-500/35 animate-bounce whitespace-nowrap shrink-0">
                        {t('Action needed')}
                      </BadgeUI>
                    )}
                  </div>
                  <p className="text-amber-700 dark:text-amber-400 text-xs mb-1 truncate">{t('Pending Requests')}</p>
                  <p className={`text-xl sm:text-2xl font-bold tracking-tight truncate ${(dashboardData.metrics.pendingRequests || 0) > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    {(dashboardData.metrics.pendingRequests || 0).toLocaleString()}
                  </p>
                  <p className="text-amber-500 dark:text-amber-500 text-[11px] mt-1.5 truncate">{t('awaiting approval')}</p>
                </CardContent>
              </Card>
            </Link>

          </div>

          {/* ── Main Content: System Activity & Subscription Plans Performance ── */}
          <div className={`grid grid-cols-1 gap-4 xl:grid-cols-5 ${fadeUp(300)}`}>

            {/* System Activity */}
            <Card className="xl:col-span-3 border border-blue-100 dark:border-blue-900/40 shadow-sm dark:bg-slate-900 overflow-hidden">
              <CardHeader className="pb-3 pt-5 px-5 border-b">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-semibold">{t('System Activity')}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('Latest activities across your platform')}</p>
                  </div>
                  <Link href={route('companies.index')} className="flex items-center gap-1 text-xs text-primary font-medium shrink-0 hover:gap-1.5 transition-all duration-150">
                    {t('View all')} <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="!p-0">
                {((dashboardData.recentActivity && dashboardData.recentActivity.length > 0) || (dashboardData.recentOrders && dashboardData.recentOrders.length > 0)) ? (
                  <div>
                    {(dashboardData.recentActivity && dashboardData.recentActivity.length > 0
                      ? dashboardData.recentActivity
                      : dashboardData.recentOrders
                    ).map((item: any, i: number) => {
                      const avatarUrl = item.avatar ? getImageUrl(item.avatar) : null;
                      const displayName = item.name || item.company || item.description || 'System Activity';
                      const subtitle = item.email || item.description || item.company || '';
                      const timeAgo = item.registered_at || item.time || item.date || '';
                      const statusLabel = item.status || (item.type ? item.type.replace('_', ' ') : 'active');

                      return (
                        <div
                          key={item.id || i}
                          className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/50 dark:hover:bg-slate-800/60 transition-colors duration-150 group/row"
                          style={{ animationDelay: `${i * 60}ms` }}
                        >
                          <div className="relative w-9 h-9 shrink-0">
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt={displayName}
                                className="w-9 h-9 rounded-full object-cover shadow-sm group-hover/row:scale-105 transition-transform duration-150"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = getImageUrl('/storage/media/avatars/avatar.png');
                                }}
                              />
                            ) : (
                              <img
                                src={getImageUrl('/storage/media/avatars/avatar.png')}
                                alt={displayName}
                                className="w-9 h-9 rounded-full object-cover shadow-sm group-hover/row:scale-105 transition-transform duration-150"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = getImageUrl('/storage/media/avatars/avatar.png');
                                }}
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate leading-tight">{displayName}</p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <BadgeUI className="bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/15 dark:text-green-400 dark:ring-green-500/35 capitalize">
                              {t(statusLabel)}
                            </BadgeUI>
                            <span className="text-[11px] text-muted-foreground">{timeAgo}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 gap-3">
                    <div className="rounded-full bg-muted p-4 animate-pulse">
                      <Building2 className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm text-muted-foreground">{t('No recent system activity')}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subscription Plans Performance */}
            <Card className="xl:col-span-2 border border-violet-100 dark:border-violet-900/40 shadow-sm dark:bg-slate-900 overflow-hidden">
              <CardHeader className="pb-3 pt-5 px-5 border-b">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-semibold">{t('Subscription Plans Performance')}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('By revenue generated')}</p>
                  </div>
                  <Link href={route('plans.index')} className="flex items-center gap-1 text-xs text-primary font-medium shrink-0 hover:gap-1.5 transition-all duration-150">
                    {t('View all')} <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="!p-0">
                {dashboardData.topPlans && dashboardData.topPlans.length > 0 ? (
                  <div>
                    {(() => {
                      const maxRevenue = Math.max(...dashboardData.topPlans.map((p: any) => Number(p.revenue) || 0), 1);
                      return dashboardData.topPlans.map((plan: any, index: number) => {
                        const barPct = maxRevenue > 0 ? Math.round(((Number(plan.revenue) || 0) / maxRevenue) * 100) : 0;
                        return (
                          <div key={plan.id || plan.name || index} className="flex items-center gap-3 px-5 py-4 hover:bg-muted/50 dark:hover:bg-slate-800/60 transition-colors duration-150 group/plan">
                            <UserInitials name={`${index + 1}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <p className="text-sm font-semibold truncate">{plan.name}</p>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-muted dark:bg-slate-700 overflow-hidden">
                                <div
                                  className="h-1.5 rounded-full bg-primary transition-all duration-1000 ease-out"
                                  style={{ width: mounted ? `${barPct}%` : '0%' }}
                                />
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-1">
                                {plan.subscribers || plan.orders || 0} {t('subscribers')}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold font-mono">{formatCurrency(plan.revenue || 0)}</p>
                              <p className="text-[11px] text-muted-foreground">{t('revenue')}</p>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 gap-3">
                    <div className="rounded-full bg-muted p-4 animate-pulse">
                      <CreditCard className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm text-muted-foreground">{t('No subscription data available')}</p>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* ── Monthly Companies Chart ── */}
          <div className={fadeUp(375)}>
            <Card className="border border-border shadow-sm dark:bg-slate-900 overflow-hidden">
              <CardHeader className="pb-3 pt-5 px-5 border-b">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <CardTitle className="text-base font-semibold">{t('New Companies Registered')}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('Companies joined per month')} — {selectedCompaniesYear}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-500/30">
                      {(dashboardData.monthlyCompanies || []).reduce((s, m) => s + m.count, 0)} {t('total')}
                    </span>
                    <Select value={String(selectedCompaniesYear)} onValueChange={(v) => handleCompaniesYearChange(Number(v))}>
                      <SelectTrigger className="h-7 w-24 text-xs focus:ring-0 focus:ring-offset-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableYearsList.map((yr) => (
                          <SelectItem key={yr} value={String(yr)} className="text-xs">{yr}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-5">
                {(dashboardData.monthlyCompanies && dashboardData.monthlyCompanies.length > 0) ? (
                  <div dir="ltr" className="w-full">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={dashboardData.monthlyCompanies}
                        margin={{ top: 20, right: isRtl ? 16 : 8, left: isRtl ? 8 : 0, bottom: 0 }}
                        accessibilityLayer={false}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={primaryColor} strokeOpacity={0.3} vertical={false} />
                        <XAxis
                          dataKey="short"
                          reversed={isRtl}
                          tick={{ fontSize: 11, fill: 'currentColor' }}
                          className="text-muted-foreground"
                          axisLine={{ stroke: primaryColor }}
                          tickLine={{ stroke: primaryColor }}
                        />
                        <YAxis
                          orientation={isRtl ? 'right' : 'left'}
                          tick={{ fontSize: 11, fill: 'currentColor' }}
                          className="text-muted-foreground"
                          axisLine={{ stroke: primaryColor }}
                          tickLine={{ stroke: primaryColor }}
                          allowDecimals={false}
                          width={36}
                        />
                        <RechartsTooltip
                          contentStyle={{
                            fontSize: 12,
                            borderRadius: 8,
                            border: `1px solid ${primaryColor}30`,
                            backgroundColor: "rgba(255, 255, 255, 0.7)",
                            color: primaryColor,
                            direction: isRtl ? 'rtl' : 'ltr',
                            textAlign: isRtl ? 'right' : 'left',
                          }}
                          formatter={(value: number) => [value, t('Companies')]}
                          labelFormatter={(label, payload) => payload?.[0]?.payload?.month ?? label}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={30} isAnimationActive={false}>
                          <LabelList dataKey="count" position="top" style={{ fontSize: 11, fill: primaryColor, fontWeight: 600 }} formatter={(v: number) => v > 0 ? v : ''} />
                          {(dashboardData.monthlyCompanies || []).map((_, i) => (
                            <Cell key={i} fill={primaryColor} fillOpacity={0.7} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 gap-3">
                    <div className="rounded-full bg-muted p-4 animate-pulse">
                      <Building2 className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm text-muted-foreground">{t('No company data available')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Monthly Revenue Chart ── */}
          <div className={fadeUp(350)}>
            <Card className="border border-border shadow-sm dark:bg-slate-900 overflow-hidden">
              <CardHeader className="pb-3 pt-5 px-5 border-b">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <CardTitle className="text-base font-semibold">{t('Monthly Revenue')}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('Approved plan orders')} — {selectedRevenueYear}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium font-mono bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-500/30">
                      {formatCurrency((dashboardData.monthlyRevenue || []).reduce((s, m) => s + m.revenue, 0))}
                    </span>
                    <Select value={String(selectedRevenueYear)} onValueChange={(v) => handleRevenueYearChange(Number(v))}>
                      <SelectTrigger className="h-7 w-24 text-xs focus:ring-0 focus:ring-offset-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableYearsList.map((yr) => (
                          <SelectItem key={yr} value={String(yr)} className="text-xs">{yr}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 !pt-5">
                {(dashboardData.monthlyRevenue && dashboardData.monthlyRevenue.length > 0) ? (
                  <div dir="ltr" className="w-full">
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={dashboardData.monthlyRevenue} margin={{ top: 4, right: isRtl ? 20 : 8, left: isRtl ? 8 : 0, bottom: 0 }} accessibilityLayer={false}>
                        <defs>
                          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={primaryColor} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={primaryColor} strokeOpacity={0.3} vertical={false} />
                        <XAxis
                          dataKey="short"
                          reversed={isRtl}
                          tick={{ fontSize: 11, fill: 'currentColor' }}
                          className="text-muted-foreground"
                          axisLine={{ stroke: primaryColor }}
                          tickLine={{ stroke: primaryColor }}
                        />
                        <YAxis
                          orientation={isRtl ? 'right' : 'left'}
                          tick={{ fontSize: 11, fill: 'currentColor' }}
                          className="text-muted-foreground"
                          axisLine={{ stroke: primaryColor }}
                          tickLine={{ stroke: primaryColor }}
                          tickFormatter={(v) => formatCurrency(v)}
                          width={85}
                        />
                        <RechartsTooltip
                          contentStyle={{
                            fontSize: 12,
                            borderRadius: 8,
                            border: `1px solid ${primaryColor}30`,
                            background: 'hsl(var(--popover))',
                            color: 'hsl(var(--popover-foreground))',
                            direction: isRtl ? 'rtl' : 'ltr',
                            textAlign: isRtl ? 'right' : 'left',
                          }}
                          formatter={(value: number) => [formatCurrency(value), t('Revenue')]}
                          labelFormatter={(label, payload) => payload?.[0]?.payload?.month ?? label}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke={primaryColor}
                          strokeWidth={2}
                          fill="url(#revenueGrad)"
                          dot={{ r: 3, fill: primaryColor, strokeWidth: 0 }}
                          activeDot={{ r: 5, fill: primaryColor, strokeWidth: 0 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 gap-3">
                    <div className="rounded-full bg-muted p-4 animate-pulse">
                      <DollarSign className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm text-muted-foreground">{t('No revenue data available')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* <DashboardOverview
            userType="superadmin"
            stats={{
              totalCompanies: dashboardData.metrics.totalCompanies,
              totalStores: dashboardData.metrics.totalStores,
              activeStores: dashboardData.metrics.activeStores,
              totalPlans: dashboardData.metrics.totalPlans,
              activePlans: dashboardData.metrics.activePlans,
              totalRevenue: dashboardData.metrics.totalRevenue
            }}
          /> */}
        </div>
      </PageTemplate>
    );
  }

  if (!currentStore) {
    return (
      <PageTemplate title={t('Dashboard')} description={t('Please select a store to view dashboard')} url="/dashboard" breadcrumbs={breadcrumbs}>
        <div className="text-center py-12">
          <p className="text-gray-500">{t('Please select a store to view dashboard')}</p>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title={t('Dashboard')}
      description={t('Store dashboard and analytics')}
      url="/dashboard"
      actions={pageActions}
      breadcrumbs={breadcrumbs}
    >
      <div className="space-y-4 sm:space-y-6">
        <style>{`
          @keyframes waterWave {
            0%   { transform: translateX(0); }
            50%  { transform: translateX(-25%); }
            100% { transform: translateX(0); }
          }
          .animate-water-wave-1 { animation: waterWave 4s ease-in-out infinite; will-change: transform; }
          .animate-water-wave-2 { animation: waterWave 6s ease-in-out infinite reverse; will-change: transform; }
          .animate-water-wave-3 { animation: waterWave 8s ease-in-out infinite; will-change: transform; }
          @keyframes handWave {
            0%,100% { transform: rotate(0deg); }
            10%  { transform: rotate(18deg); }
            20%  { transform: rotate(-8deg); }
            30%  { transform: rotate(18deg); }
            40%  { transform: rotate(-4deg); }
            50%  { transform: rotate(12deg); }
            60%  { transform: rotate(0deg); }
          }
          .animate-hand-wave { animation: handWave 2.2s ease-in-out infinite; transform-origin: 70% 70%; display: inline-block; }
          .scrollbar-none { scrollbar-width: none; -ms-overflow-style: none; }
          .scrollbar-none::-webkit-scrollbar { display: none; }
          @keyframes qrScanBeam {
            0%, 100% { top: 8px; opacity: 0; }
            15%, 85% { opacity: 0.95; }
            50% { top: calc(100% - 10px); }
          }
          .animate-qr-scan {
            animation: qrScanBeam 2.8s ease-in-out infinite;
            will-change: top, opacity;
          }
        `}</style>

        {/* ── Greeting Banner (Fully Animated matching reference) ── */}
        <div className={`group relative overflow-hidden rounded-2xl bg-slate-800 dark:bg-slate-900 px-4 sm:px-6 py-5 ${fadeUp(0)}`}>
          {/* gradient orbs */}
          <span className="pointer-events-none absolute -top-10 -left-10 w-48 h-48 rounded-full bg-emerald-500/10 blur-2xl animate-pulse" style={{ animationDuration: '4s' }} />
          <span className="pointer-events-none absolute -bottom-10 right-0 w-56 h-56 rounded-full bg-blue-500/10 blur-2xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1.5s' }} />
          <span className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-violet-500/5 blur-2xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '0.8s' }} />

          {/* glowing dots */}
          <span className="pointer-events-none absolute top-4 left-1/3 w-1.5 h-1.5 rounded-full bg-emerald-400/80 shadow-[0_0_6px_2px_rgba(52,211,153,0.6)] animate-ping" style={{ animationDuration: '3s' }} />
          <span className="pointer-events-none absolute bottom-4 left-1/4 w-1 h-1 rounded-full bg-blue-400/70 shadow-[0_0_4px_2px_rgba(96,165,250,0.5)] animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }} />
          <span className="pointer-events-none absolute top-3 right-1/4 w-1.5 h-1.5 rounded-full bg-violet-400/70 shadow-[0_0_6px_2px_rgba(167,139,250,0.5)] animate-ping" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }} />
          <span className="pointer-events-none absolute bottom-3 right-1/3 w-1 h-1 rounded-full bg-emerald-300/80 shadow-[0_0_4px_2px_rgba(110,231,183,0.5)] animate-ping" style={{ animationDuration: '2.8s', animationDelay: '1.8s' }} />

          {/* water wave layers */}
          <div className="pointer-events-none absolute bottom-0 left-0 w-full overflow-hidden" style={{ height: '40px' }}>
            <div className="absolute bottom-0 left-0 w-[200%] animate-water-wave-1">
              <svg viewBox="0 0 2400 40" preserveAspectRatio="none" className="w-full h-[40px]"><path fill="rgba(52,211,153,0.12)" d="M0,20 C150,38 350,0 600,20 C850,38 1050,0 1200,20 C1350,38 1550,0 1800,20 C2050,38 2250,0 2400,20 L2400,40 L0,40 Z" /></svg>
            </div>
            <div className="absolute bottom-0 left-0 w-[200%] animate-water-wave-2">
              <svg viewBox="0 0 2400 40" preserveAspectRatio="none" className="w-full h-[40px]"><path fill="rgba(96,165,250,0.09)" d="M0,26 C200,10 400,38 600,22 C800,8 1000,36 1200,24 C1400,10 1600,38 1800,22 C2000,8 2200,36 2400,24 L2400,40 L0,40 Z" /></svg>
            </div>
            <div className="absolute bottom-0 left-0 w-[200%] animate-water-wave-3">
              <svg viewBox="0 0 2400 40" preserveAspectRatio="none" className="w-full h-[40px]"><path fill="rgba(167,139,250,0.07)" d="M0,30 C300,14 500,38 700,28 C900,16 1100,38 1200,28 C1400,14 1600,38 1900,28 C2100,16 2300,38 2400,28 L2400,40 L0,40 Z" /></svg>
            </div>
          </div>

          {/* top row */}
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* left: greeting */}
            <div className="group-hover:translate-x-1 transition-transform duration-300 min-w-0">
              <p className="text-slate-400 text-sm mb-0.5">{getGreeting()},</p>
              <div className="flex items-center gap-2">
                <h2 className="text-white text-xl sm:text-2xl font-bold truncate group-hover:text-emerald-400 transition-colors duration-300">
                  {currentStore?.name} - {auth?.user?.name || t('Company')}
                </h2>
                <span className="animate-hand-wave text-2xl sm:text-3xl select-none">👋</span>
              </div>
              <p className="text-slate-400 text-xs mt-1 group-hover:text-slate-300 transition-colors duration-300">
                {t("Here's your WhatsApp store performance and summary today.")}
              </p>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-emerald-400/70 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1.2s' }} />
                  <div className="w-2 h-2 bg-emerald-400/50 rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1.2s' }} />
                  <div className="w-2 h-2 bg-emerald-400/40 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1.2s' }} />
                </div>
                <span className="text-emerald-400 font-semibold text-sm font-mono">
                  {dashboardData.metrics.todayOrders || 0} {t("orders today")}
                </span>
              </div>
            </div>

            {/* right: stat pills + quick links */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 hover:bg-white/15 transition-all duration-200">
                <div className="relative shrink-0">
                  <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                    <Briefcase className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full flex items-center justify-center">
                    <div className="w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDuration: '2s' }} />
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-white text-[11px] font-semibold leading-tight">{t('Store Front')}</p>
                  <p className="text-primary text-[10px] font-medium">{t('View your Store Front')}</p>
                </div>
                <div className="flex gap-1 ml-1">
                  <button onClick={copyToClipboard} className="rounded-md bg-white/10 hover:bg-white/20 p-1.5 transition-colors duration-150 cursor-pointer">
                    {copied ? <CheckCircle className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-slate-300" />}
                  </button>
                  <button onClick={() => window.open(storeUrl, '_blank')} className="rounded-md bg-primary/80 hover:bg-primary p-1.5 transition-colors duration-150 cursor-pointer">
                    <ExternalLink className="h-3 w-3 text-primary-foreground" />
                  </button>
                </div>
              </div>
              <div className="w-px h-10 bg-white/10 hidden sm:block" />
              {[
                // {
                //   icon: Store,
                //   label: t('Storefront'),
                //   href: storeUrl || '#',
                //   isExternal: true,
                //   color: 'text-emerald-300 hover:text-emerald-200',
                //   bg: 'hover:bg-emerald-400/10',
                //   show: !!storeUrl,
                //   badge: null,
                // },
                {
                  icon: ShoppingCart,
                  label: t('Orders'),
                  href: route('orders.index'),
                  isExternal: false,
                  color: 'text-amber-300 hover:text-amber-200',
                  bg: 'hover:bg-amber-400/10',
                  show: userHasPermission('view-orders'),
                },
                {
                  icon: Package,
                  label: t('Products'),
                  href: route('products.index'),
                  isExternal: false,
                  color: 'text-blue-300 hover:text-blue-200',
                  bg: 'hover:bg-blue-400/10',
                  show: userHasPermission('view-products'),
                  badge: null,
                },
                {
                  icon: BarChart3,
                  label: t('Analytics'),
                  href: route('analytics.index'),
                  isExternal: false,
                  color: 'text-teal-300 hover:text-teal-200',
                  bg: 'hover:bg-teal-400/10',
                  show: userHasPermission('manage-analytics'),
                  badge: null,
                },
              ].filter(item => item.show).map(({ icon: Icon, label, href, isExternal, color, bg, badge }) => (
                isExternal ? (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`relative flex flex-col items-center gap-1 rounded-xl px-2.5 py-2 transition-all duration-200 ${bg} group/qa`}
                    title={label}
                  >
                    <div className="relative">
                      <Icon className={`h-5 w-5 transition-all duration-200 ${color} group-hover/qa:-translate-y-0.5`} />
                      {badge && (
                        <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5 leading-none shadow-xs">
                          {badge}
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400 text-[10px] whitespace-nowrap group-hover/qa:text-slate-300 transition-colors duration-200">{label}</span>
                  </a>
                ) : (
                  <Link
                    key={label}
                    href={href}
                    className={`relative flex flex-col items-center gap-1 rounded-xl px-2.5 py-2 transition-all duration-200 ${bg} group/qa`}
                    title={label}
                  >
                    <div className="relative">
                      <Icon className={`h-5 w-5 transition-all duration-200 ${color} group-hover/qa:-translate-y-0.5`} />
                      {badge && (
                        <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5 leading-none shadow-xs">
                          {badge}
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400 text-[10px] whitespace-nowrap group-hover/qa:text-slate-300 transition-colors duration-200">{label}</span>
                  </Link>
                )
              ))}
            </div>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className={`grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5 ${fadeUp(100)}`}>

          {/* Total Orders */}
          {userHasPermission('view-orders') && (
            <Link href={route('orders.index')} className="group">
              <Card className="h-full border border-blue-200 dark:border-blue-900/50 shadow-sm bg-blue-50 dark:bg-blue-950/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                <CardContent className="relative overflow-hidden p-3 sm:p-5">
                  <span className="pointer-events-none absolute -top-3 right-4 w-10 h-10 rounded-full bg-blue-300/40 dark:bg-blue-500/10 animate-ping" style={{ animationDuration: '7s' }} />
                  <span className="pointer-events-none absolute top-1 right-1 w-14 h-14 rounded-full bg-blue-200/30 dark:bg-blue-600/10 animate-pulse" style={{ animationDuration: '8s' }} />
                  <span className="pointer-events-none absolute bottom-1 right-8 w-7 h-7 rounded-full bg-blue-400/30 dark:bg-blue-400/10 animate-ping" style={{ animationDuration: '6s', animationDelay: '1.5s' }} />
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="rounded-xl bg-blue-100 dark:bg-blue-900/50 p-2 sm:p-2.5">
                      <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-blue-200 group-hover:text-blue-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-200" />
                  </div>
                  <p className="text-blue-700 dark:text-blue-400 text-xs mb-1 truncate">{t('Total Orders')}</p>
                  <p className="text-blue-900 dark:text-blue-100 text-lg xl:text-2xl font-mono tracking-tight truncate">{dashboardData.metrics.orders?.toLocaleString() || 0}</p>
                  <p className="text-blue-600 dark:text-blue-500 text-[11px] mt-1.5 truncate">{currentStore?.name}</p>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Completed Orders */}
          {userHasPermission('view-orders') && (
            <Link href={route('orders.index')} className="group">
              <Card className="h-full border border-teal-200 dark:border-teal-900/50 shadow-sm bg-teal-50 dark:bg-teal-950/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                <CardContent className="relative overflow-hidden p-3 sm:p-5">
                  <span className="pointer-events-none absolute -top-3 right-4 w-10 h-10 rounded-full bg-teal-300/40 dark:bg-teal-500/10 animate-ping" style={{ animationDuration: '7s' }} />
                  <span className="pointer-events-none absolute top-1 right-1 w-14 h-14 rounded-full bg-teal-200/30 dark:bg-teal-600/10 animate-pulse" style={{ animationDuration: '8s' }} />
                  <span className="pointer-events-none absolute bottom-1 right-8 w-7 h-7 rounded-full bg-teal-400/30 dark:bg-teal-400/10 animate-ping" style={{ animationDuration: '6s', animationDelay: '1.2s' }} />
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="rounded-xl bg-teal-100 dark:bg-teal-900/50 p-2 sm:p-2.5">
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-teal-200 group-hover:text-teal-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-200" />
                  </div>
                  <p className="text-teal-700 dark:text-teal-400 text-xs mb-1 truncate">{t('Completed Orders')}</p>
                  <p className="text-teal-900 dark:text-teal-100 text-lg xl:text-2xl font-mono tracking-tight truncate">{dashboardData.metrics.completedOrders?.toLocaleString() || 0}</p>
                  <p className="text-teal-600 dark:text-teal-500 text-[11px] mt-1.5 truncate">{t('Successfully fulfilled')}</p>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Total Products */}
          {userHasPermission('view-products') && (
            <Link href={route('products.index')} className="group">
              <Card className="h-full border border-violet-200 dark:border-violet-900/50 shadow-sm bg-violet-50 dark:bg-violet-950/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                <CardContent className="relative overflow-hidden p-3 sm:p-5">
                  <span className="pointer-events-none absolute -top-3 right-4 w-10 h-10 rounded-full bg-violet-300/40 dark:bg-violet-500/10 animate-ping" style={{ animationDuration: '7s' }} />
                  <span className="pointer-events-none absolute top-1 right-1 w-14 h-14 rounded-full bg-violet-200/30 dark:bg-violet-600/10 animate-pulse" style={{ animationDuration: '8s' }} />
                  <span className="pointer-events-none absolute bottom-1 right-8 w-7 h-7 rounded-full bg-violet-400/30 dark:bg-violet-400/10 animate-ping" style={{ animationDuration: '6s', animationDelay: '1s' }} />
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="rounded-xl bg-violet-100 dark:bg-violet-900/50 p-2 sm:p-2.5">
                      <Package className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-violet-200 group-hover:text-violet-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-200" />
                  </div>
                  <p className="text-violet-700 dark:text-violet-400 text-xs mb-1 truncate">{t('Total Products')}</p>
                  <p className="text-violet-900 dark:text-violet-100 text-lg xl:text-2xl font-mono tracking-tight truncate">{dashboardData.metrics.products?.toLocaleString() || 0}</p>
                  <p className="text-violet-600 dark:text-violet-400 text-[11px] mt-1.5 truncate">{t('Active products')}</p>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Total Customers */}
          {userHasPermission('view-customers') && (
            <Link href={route('customers.index')} className="group">
              <Card className="h-full border border-rose-200 dark:border-rose-900/50 shadow-sm bg-rose-50 dark:bg-rose-950/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                <CardContent className="relative overflow-hidden p-3 sm:p-5">
                  <span className="pointer-events-none absolute -top-3 right-4 w-10 h-10 rounded-full bg-rose-300/40 dark:bg-rose-500/10 animate-ping" style={{ animationDuration: '8s' }} />
                  <span className="pointer-events-none absolute top-1 right-1 w-14 h-14 rounded-full bg-rose-200/30 dark:bg-rose-600/10 animate-pulse" style={{ animationDuration: '6s' }} />
                  <span className="pointer-events-none absolute bottom-1 right-8 w-7 h-7 rounded-full bg-rose-400/30 dark:bg-rose-400/10 animate-ping" style={{ animationDuration: '5s', animationDelay: '2.5s' }} />
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="rounded-xl bg-rose-100 dark:bg-rose-900/50 p-2 sm:p-2.5">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-rose-200 group-hover:text-rose-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-200" />
                  </div>
                  <p className="text-rose-700 dark:text-rose-400 text-xs mb-1 truncate">{t('Total Customers')}</p>
                  <p className="text-rose-900 dark:text-rose-100 text-lg xl:text-2xl font-mono tracking-tight truncate">{dashboardData.metrics.customers?.toLocaleString() || 0}</p>
                  <p className="text-rose-600 dark:text-rose-500 text-[11px] mt-1.5 truncate">{t('Registered customers')}</p>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Total Revenue */}
          {userHasPermission('manage-analytics') && (
            <Link href={route('analytics.index')} className="group">
              <Card className="h-full border border-emerald-300 dark:border-emerald-800 shadow-sm bg-emerald-50 dark:bg-emerald-950/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                <CardContent className="relative overflow-hidden p-3 sm:p-5">
                  <span className="pointer-events-none absolute -top-3 right-4 w-10 h-10 rounded-full bg-emerald-300/40 dark:bg-emerald-500/10 animate-ping" style={{ animationDuration: '6s' }} />
                  <span className="pointer-events-none absolute top-1 right-1 w-14 h-14 rounded-full bg-emerald-200/30 dark:bg-emerald-600/10 animate-pulse" style={{ animationDuration: '7s' }} />
                  <span className="pointer-events-none absolute bottom-1 right-8 w-7 h-7 rounded-full bg-emerald-400/30 dark:bg-emerald-400/10 animate-ping" style={{ animationDuration: '5s', animationDelay: '2s' }} />
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="rounded-xl bg-emerald-100 dark:bg-emerald-900/60 p-2 sm:p-2.5">
                      <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-emerald-300 group-hover:text-emerald-600 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-200" />
                  </div>
                  <p className="text-emerald-700 dark:text-emerald-400 text-xs mb-1 truncate">{t('Total Revenue')}</p>
                  <p className="text-emerald-900 dark:text-emerald-100 text-lg xl:text-2xl font-mono tracking-tight truncate">{formatCurrency(dashboardData.metrics.revenue || 0)}</p>
                  <p className="text-emerald-600 dark:text-emerald-500 text-[11px] mt-1.5 truncate">{t('All time revenue')}</p>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>


        {/* ── Top Products, Recent Shipping Methods & Animated Store QR Code ── */}
        <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 ${fadeUp(180)}`}>
          {/* Top Products - Unique Leaderboard Showcase */}
          {userHasPermission('view-products') && (() => {
            const topProductsList = dashboardData.topProducts || [];
            const maxSold = Math.max(...topProductsList.map((p: any) => Number(p.sold) || 1), 1);

            return (
              <div className="relative rounded-2xl border border-border bg-card shadow-xs overflow-hidden flex flex-col h-full group">
                {/* Header */}
                <div className="pb-3 pt-5 px-5 border-b border-border/60 shrink-0 relative flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shadow-xs shrink-0">
                      <Trophy className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="text-base font-semibold text-foreground tracking-tight whitespace-nowrap">{t('Top Products')}</h3>
                        <BadgeUI className="bg-primary/10 text-primary ring-primary/20 dark:bg-primary/20 dark:text-primary dark:ring-primary/30 font-semibold gap-1 whitespace-nowrap">
                          <Flame className="w-3 h-3 text-primary fill-primary" />
                          {t('Leaderboard')}
                        </BadgeUI>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{t('Best selling products by quantity')}</p>
                    </div>
                  </div>
                  <Link
                    href={route('products.index')}
                    className="flex items-center gap-1 text-xs text-primary font-medium shrink-0 whitespace-nowrap hover:gap-1.5 transition-all duration-150"
                  >
                    {t('View all')} <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* Content */}
                <div className="p-3 sm:p-4 flex-1">
                  {topProductsList.length > 0 ? (
                    <div className="space-y-2.5">
                      {topProductsList.map((product: any, i: number) => {
                        const isChampion = i === 0;
                        const rankLabel = i === 0 ? '🥇 #1' : i === 1 ? '🥈 #2' : i === 2 ? '🥉 #3' : `#${i + 1}`;
                        const percentage = Math.max(12, Math.round(((Number(product.sold) || 0) / maxSold) * 100));

                        return (
                          <div
                            key={product.id || i}
                            className={`p-2.5 rounded-xl border transition-all duration-200 group/item ${isChampion
                              ? 'border-primary/30 bg-primary/5 dark:bg-primary/10 shadow-2xs'
                              : 'border-border/60 hover:border-primary/40 bg-background/60 hover:bg-muted/40'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              {/* Product Image */}
                              <div className="relative shrink-0 w-11 h-11 rounded-lg overflow-hidden bg-muted/70 border border-border/60 flex items-center justify-center">
                                {product.image ? (
                                  <img
                                    src={getImageUrl(product.image)}
                                    alt={product.name}
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = getImageUrl('/storage/media/product/product.png');
                                    }}
                                    className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-200"
                                  />
                                ) : (
                                  <Package className="h-5 w-5 text-muted-foreground/60" />
                                )}
                              </div>

                              {/* Product Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <BadgeUI className={`shrink-0 font-semibold ${i === 0
                                        ? 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-500/30'
                                        : i === 1
                                          ? 'bg-zinc-100 text-zinc-700 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700'
                                          : i === 2
                                            ? 'bg-amber-50/60 text-amber-800 ring-amber-700/20 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-500/30'
                                            : 'bg-zinc-50 text-zinc-600 ring-zinc-600/10 dark:bg-zinc-800/60 dark:text-zinc-400'
                                        }`}>
                                        {rankLabel}
                                      </BadgeUI>
                                      <Link
                                        href={route('products.show', product.id)}
                                        className="text-xs sm:text-sm font-semibold text-foreground truncate hover:text-primary transition-colors block min-w-0"
                                        title={product.name}
                                      >
                                        {product.name}
                                      </Link>
                                    </div>
                                  </div>
                                  <div className="shrink-0 text-right space-y-1">
                                    <div className="space-y-0.5">
                                      <span className="text-xs font-mono font-semibold text-foreground whitespace-nowrap block">
                                        {formatCurrency(product.sale_price || product.price)}
                                      </span>
                                      {product.sale_price && (
                                        <span className="text-[10px] font-mono line-through text-muted-foreground block whitespace-nowrap">
                                          {formatCurrency(product.price)}
                                        </span>
                                      )}
                                    </div>
                                    <BadgeUI className="bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-500/30 font-medium whitespace-nowrap">
                                      {product.sold} {t('sold')}
                                    </BadgeUI>
                                  </div>
                                </div>

                                {/* Light Progress bar visualizing sales volume */}
                                <div className="mt-2 w-full h-1.5 bg-muted/60 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${i === 0
                                      ? 'bg-amber-400/60'
                                      : 'bg-primary/35'
                                      }`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 gap-3">
                      <div className="rounded-full bg-muted p-4">
                        <Package className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                      <p className="text-sm text-muted-foreground">{t('No products available')}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Recent Shipping Methods - Unique Logistics & Dispatch Hub */}
          {userHasPermission('manage-shipping') && (() => {
            const shippingList = dashboardData.recentShippingMethods || [];

            return (
              <div className="relative rounded-2xl border border-border bg-card shadow-xs overflow-hidden flex flex-col h-full group">
                {/* Header */}
                <div className="pb-3 pt-5 px-5 border-b border-border/60 shrink-0 relative flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shadow-xs shrink-0">
                      <Truck className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="text-base font-semibold text-foreground tracking-tight whitespace-nowrap">{t('Recent Shipping Methods')}</h3>
                        <BadgeUI className="bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-950/40 dark:text-sky-400 dark:ring-sky-500/30 font-semibold gap-1 whitespace-nowrap">
                          <Activity className="w-3 h-3 text-sky-500" />
                          {t('Fulfillment')}
                        </BadgeUI>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{t('Delivery and dispatch methods')}</p>
                    </div>
                  </div>
                  {userHasPermission('manage-shipping') && (
                    <Link
                      href={route('shipping.index')}
                      className="flex items-center gap-1 text-xs text-primary font-medium shrink-0 whitespace-nowrap hover:gap-1.5 transition-all duration-150"
                    >
                      {t('View all')} <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>

                {/* Content */}
                <div className="p-3 sm:p-4 flex-1">
                  {shippingList.length > 0 ? (
                    <div className="space-y-2.5">
                      {shippingList.map((method: any, idx: number) => {
                        const isFree = Number(method.cost) === 0;
                        const isExpress = method.type === 'express';
                        const isPickup = method.type === 'local_pickup';

                        return (
                          <div
                            key={method.id || idx}
                            className="p-2.5 rounded-xl border border-border/60 hover:border-sky-300/70 dark:hover:border-sky-800/50 bg-background/60 hover:bg-sky-50/30 dark:hover:bg-sky-950/20 transition-all duration-200 group/item"
                          >
                            <div className="flex items-center gap-3">
                              {/* Dispatch Type Icon */}
                              <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${isExpress
                                ? 'bg-amber-50 text-amber-600 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40'
                                : isPickup
                                  ? 'bg-purple-50 text-purple-600 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/40'
                                  : isFree
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40'
                                    : 'bg-sky-50 text-sky-600 border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800/40'
                                }`}>
                                {isExpress ? (
                                  <Zap className="h-4 w-4" />
                                ) : isPickup ? (
                                  <Store className="h-4 w-4" />
                                ) : isFree ? (
                                  <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                  <Truck className="h-4 w-4" />
                                )}
                              </div>

                              {/* Method details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs sm:text-sm font-semibold text-foreground truncate block" title={method.name}>
                                    {method.name}
                                  </p>
                                  <div className="shrink-0 text-right">
                                    {isFree ? (
                                      <BadgeUI className="bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-500/30 font-medium whitespace-nowrap">
                                        {t('Free Delivery')}
                                      </BadgeUI>
                                    ) : (
                                      <span className="text-xs font-mono font-semibold text-foreground whitespace-nowrap block">
                                        {formatCurrency(method.cost)}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-1.5 mt-2">
                                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                                    {method.delivery_time && (
                                      <span className="text-xs text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                                        <Clock className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                                        {method.delivery_time}
                                      </span>
                                    )}
                                    {method.type && (
                                      <BadgeUI className="bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-950/40 dark:text-sky-400 dark:ring-sky-500/30 font-medium capitalize shrink-0 whitespace-nowrap">
                                        {method.type.replace(/_/g, ' ')}
                                      </BadgeUI>
                                    )}
                                  </div>

                                  {method.is_active !== undefined && (
                                    <BadgeUI className={`shrink-0 whitespace-nowrap font-medium ${method.is_active
                                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-500/30'
                                      : 'bg-zinc-100 text-zinc-600 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-400'
                                    }`}>
                                      {method.is_active ? t('Active') : t('Inactive')}
                                    </BadgeUI>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 gap-3">
                      <div className="rounded-full bg-muted p-4">
                        <Truck className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                      <p className="text-sm text-muted-foreground">{t('No shipping methods available')}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Store QR Code - Uniquely styled with laser scanner animation */}
          <Card className="border border-border shadow-sm dark:bg-slate-900 overflow-hidden flex flex-col h-full relative group md:col-span-2 xl:col-span-1">

            <CardHeader className="pb-3 pt-5 px-5 border-b shrink-0 relative">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
                    <QrCode className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">{t('Store QR Code')}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('Instant store access')}</p>
                  </div>
                </div>
                <BadgeUI className="bg-primary/10 text-primary ring-primary/30 dark:bg-primary/15 dark:text-primary dark:ring-primary/35 capitalize font-medium whitespace-nowrap">
                  {t('Live')}
                </BadgeUI>
              </div>
            </CardHeader>

            <CardContent className="!p-5 flex-1 flex flex-col sm:flex-row xl:flex-col items-center justify-center gap-6 relative">
              {/* Outer Animated Gradient Ring */}
              <div className="relative p-1 rounded-2xl bg-gradient-to-tr from-emerald-500/30 via-primary/40 to-blue-500/30 shadow-lg shadow-emerald-500/5 transition-all duration-300 group-hover:shadow-primary/20 group-hover:scale-[1.02] shrink-0">
                {/* QR Code Container with Scanner Brackets */}
                <div className="relative p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-inner overflow-hidden flex flex-col items-center justify-center">
                  {/* Viewfinder Target Brackets */}
                  <span className="absolute top-1.5 left-1.5 w-3.5 h-3.5 border-t-2 border-l-2 border-primary rounded-tl-sm pointer-events-none" />
                  <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 border-t-2 border-r-2 border-primary rounded-tr-sm pointer-events-none" />
                  <span className="absolute bottom-1.5 left-1.5 w-3.5 h-3.5 border-b-2 border-l-2 border-primary rounded-bl-sm pointer-events-none" />
                  <span className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 border-b-2 border-r-2 border-primary rounded-br-sm pointer-events-none" />

                  {/* Animated Laser Scanner Line */}
                  <div className="pointer-events-none absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_8px_2px_rgba(var(--primary),0.7)] animate-qr-scan z-10" />

                  {/* Actual QR Code */}
                  <div className="transition-transform duration-300 group-hover:scale-105">
                    <QRCode value={storeUrl || ''} size={125} />
                  </div>
                </div>
              </div>

              {/* Store details and action buttons */}
              <div className="text-center sm:text-left xl:text-center w-full max-w-sm space-y-3">
                <div>
                  <p className="text-base sm:text-lg font-bold text-foreground truncate">{currentStore?.name}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t('Scan with phone to open WhatsApp store')}</p>
                </div>
                <div className="flex items-center justify-center sm:justify-start xl:justify-center gap-2.5 pt-1 flex-wrap">
                  <Button
                    variant="outline"
                    size="default"
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 text-xs sm:text-sm h-9 sm:h-10 px-3.5 sm:px-4 cursor-pointer whitespace-nowrap"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                    {copied ? t('Copied!') : t('Copy Link')}
                  </Button>
                  {storeUrl && (
                    <Button
                      variant="default"
                      size="default"
                      onClick={() => window.open(storeUrl, '_blank')}
                      className="flex items-center gap-2 text-xs sm:text-sm h-9 sm:h-10 px-3.5 sm:px-4 cursor-pointer whitespace-nowrap"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {t('Visit Store')}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>


        {/* ── Sales Overview Area & Line Chart ── */}
        {userHasPermission('view-orders') && (
          <Card className={`border border-border shadow-sm dark:bg-slate-900 overflow-hidden ${fadeUp(140)}`}>
            <CardHeader className="pb-3 pt-5 px-4 sm:px-5 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-start">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
                      <TrendingUp className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">{t('Sales Overview')}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t('Monthly sales & orders for {{year}}', { year: selectedSalesYear })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                  {/* Legend distinguishing Revenue & Orders */}
                  <div className="flex items-center gap-3 text-xs bg-muted/40 px-3 py-1.5 rounded-lg border border-border/40">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                      <span className="font-medium text-foreground">{t('Revenue')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.5)]" />
                      <span className="font-medium text-foreground">{t('Orders')}</span>
                    </div>
                  </div>

                  {/* Year Dropdown only */}
                  <div className="w-[95px] sm:w-[105px]">
                    <Select
                      dir={isRtl ? 'rtl' : 'ltr'}
                      value={String(selectedSalesYear)}
                      onValueChange={handleSalesYearChange}
                    >
                      <SelectTrigger className="h-8 text-xs font-medium cursor-pointer border-border/80 bg-background hover:bg-muted/50 focus:ring-1 focus:ring-primary">
                        <SelectValue placeholder={t('Select Year')} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableYearsList.map((yr) => (
                          <SelectItem key={yr} value={String(yr)} className="text-xs cursor-pointer">
                            {yr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-4 pt-4 sm:pt-5">
              {(() => {
                const default12Months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => ({
                  label: m,
                  month: i + 1,
                  sales: 0,
                  orders: 0,
                }));
                const chartList = (dashboardData.salesChartData && dashboardData.salesChartData.length > 0)
                  ? dashboardData.salesChartData.map((item) => ({
                    ...item,
                    sales: Number(item.sales) || 0,
                    orders: item.orders !== undefined ? Number(item.orders) : 0,
                  }))
                  : default12Months;
                const hasSalesData = chartList.some((d) => d.sales > 0 || d.orders > 0);
                const maxSales = Math.max(...chartList.map((d) => d.sales), 100);
                const maxOrders = Math.max(...chartList.map((d) => d.orders), 10);

                return (
                  <div className="relative w-full h-[270px] sm:h-[310px]" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartList}
                        margin={{ top: 10, right: isRtl ? 0 : 10, left: isRtl ? 10 : -5, bottom: 0 }}
                        accessibilityLayer={false}
                      >
                        <defs>
                          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} vertical={false} />
                        <XAxis
                          dataKey="label"
                          reversed={isRtl}
                          tick={{ fontSize: 10, fill: 'currentColor' }}
                          className="text-muted-foreground"
                          axisLine={{ stroke: 'currentColor', strokeOpacity: 0.15 }}
                          tickLine={false}
                          interval={0}
                          minTickGap={6}
                        />
                        {/* Revenue YAxis */}
                        <YAxis
                          yAxisId="revenue"
                          orientation={isRtl ? 'right' : 'left'}
                          domain={[0, Math.ceil(maxSales * 1.15)]}
                          tick={{ fontSize: 10, fill: '#10b981' }}
                          className="text-emerald-600 dark:text-emerald-400 font-mono"
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => {
                            if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
                            if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
                            return `$${v}`;
                          }}
                          width={48}
                        />
                        {/* Orders count YAxis */}
                        <YAxis
                          yAxisId="orders"
                          orientation={isRtl ? 'left' : 'right'}
                          domain={[0, Math.ceil(maxOrders * 3.3)]}
                          allowDecimals={false}
                          tick={{ fontSize: 10, fill: '#6366f1' }}
                          className="text-indigo-600 dark:text-indigo-400 font-mono"
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => `${v}`}
                          width={28}
                        />
                        <RechartsTooltip
                          cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                          wrapperStyle={{ zIndex: 100, outline: 'none', pointerEvents: 'none' }}
                          content={({ active, payload, label }: any) => {
                            if (!active || !payload || !payload.length) return null;
                            return (
                              <div
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xl min-w-[210px] pointer-events-none select-none text-start"
                                dir={isRtl ? 'rtl' : 'ltr'}
                              >
                                <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                  <span>{label}</span>
                                  <span className="text-[11px] text-muted-foreground font-normal">{selectedSalesYear}</span>
                                </div>
                                <div className="space-y-1.5 text-xs">
                                  {payload.map((entry: any, index: number) => {
                                    const isOrders = entry.dataKey === 'orders';
                                    const dotColor = isOrders ? '#6366f1' : '#10b981';
                                    const labelText = isOrders ? t('Orders') : t('Revenue (Completed)');
                                    const displayValue = isOrders
                                      ? `${entry.value ?? 0} ${t('orders')}`
                                      : formatCurrency(Number(entry.value) || 0);

                                    return (
                                      <div key={`overview-item-${index}`} className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-1.5">
                                          <span
                                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                                            style={{ backgroundColor: dotColor }}
                                          />
                                          <span className="text-slate-600 dark:text-slate-300 font-medium">
                                            {labelText}:
                                          </span>
                                        </div>
                                        <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                                          {displayValue}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          }}
                        />
                        {/* Revenue Line / Area */}
                        <Area
                          yAxisId="revenue"
                          type="monotone"
                          dataKey="sales"
                          name={t('Revenue')}
                          stroke="#10b981"
                          strokeWidth={2.5}
                          fill="url(#revenueGrad)"
                          dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                          activeDot={{ r: 5, fill: '#10b981', strokeWidth: 0 }}
                        />
                        {/* Orders Line / Area */}
                        <Area
                          yAxisId="orders"
                          type="monotone"
                          dataKey="orders"
                          name={t('Orders')}
                          stroke="#6366f1"
                          strokeWidth={2.5}
                          fill="url(#ordersGrad)"
                          dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
                          activeDot={{ r: 5, fill: '#6366f1', strokeWidth: 0 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>

                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* ── Sales by Category Bar Chart (Full Width) ── */}
        {(userHasPermission('view-orders') || userHasPermission('view-products') || userHasPermission('manage-categories')) && (
          <Card className={`border border-border shadow-sm dark:bg-slate-900 overflow-hidden ${fadeUp(160)}`}>
            <CardHeader className="pb-3 pt-5 px-4 sm:px-5 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-start">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <BarChart3 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-semibold">{t('Sales by Category')}</CardTitle>
                        {totalCategorySales > 0 && (
                          <BadgeUI className="bg-primary/10 text-primary ring-primary/20 text-xs font-semibold px-2 py-0.5 font-mono">
                            {formatCurrency(totalCategorySales)}
                          </BadgeUI>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t('Category revenue performance for {{month}} {{year}}', {
                          month: selectedMonthObj.label,
                          year: selectedCategoryYear,
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right side: Month & Year Dropdowns */}
                <div className="flex items-center gap-2 sm:gap-2.5 self-start sm:self-auto">
                  {/* Month Dropdown */}
                  <div className="w-[130px] sm:w-[140px]">
                    <Select
                      dir={isRtl ? 'rtl' : 'ltr'}
                      value={String(Number(selectedCategoryMonth))}
                      onValueChange={(val) => handleCategoryFilterChange(selectedCategoryYear, val)}
                    >
                      <SelectTrigger className="h-8 text-xs font-medium cursor-pointer border-border/80 bg-background hover:bg-muted/50 focus:ring-1 focus:ring-primary">
                        <SelectValue placeholder={t('Select Month')} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[260px]">
                        {MONTHS.map((m) => (
                          <SelectItem key={m.value} value={m.value} className="text-xs cursor-pointer">
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Year Dropdown */}
                  <div className="w-[95px] sm:w-[105px]">
                    <Select
                      dir={isRtl ? 'rtl' : 'ltr'}
                      value={String(selectedCategoryYear)}
                      onValueChange={(val) => handleCategoryFilterChange(val, selectedCategoryMonth)}
                    >
                      <SelectTrigger className="h-8 text-xs font-medium cursor-pointer border-border/80 bg-background hover:bg-muted/50 focus:ring-1 focus:ring-primary">
                        <SelectValue placeholder={t('Select Year')} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableYearsList.map((yr) => (
                          <SelectItem key={yr} value={String(yr)} className="text-xs cursor-pointer">
                            {yr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-4 pt-4 sm:pt-5">
              {(() => {
                const defaultFallbackCategories = [
                  'Electronics', 'Fashion', 'Home & Living', 'Beauty', 'Sports'
                ].map((c) => ({
                  category: c,
                  sales: 0,
                  quantity: 0,
                  orders: 0,
                }));
                const rawList = dashboardData.categoryChartData || [];
                const categoryList = (rawList.length > 0)
                  ? rawList.map((item) => ({
                    ...item,
                    sales: Number(item.sales) || 0,
                    quantity: item.quantity !== undefined ? Number(item.quantity) : 0,
                  }))
                  : defaultFallbackCategories;
                const maxCategorySales = Math.max(...categoryList.map((d: any) => Number(d.sales) || 0), 100);
                const primaryColor = getThemeColorValue() || '#10b981';

                return (
                  <div className="w-full h-[280px] sm:h-[320px]" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={categoryList}
                        margin={{ top: 15, right: isRtl ? 10 : 15, left: isRtl ? 15 : -5, bottom: 25 }}
                        accessibilityLayer={false}
                      >
                        <defs>
                          <linearGradient id="categoryPrimaryGrad" x1="0" y1="0" x2="0" y2="1">
                            {/* <stop offset="0%" stopColor={primaryColor} stopOpacity={0.95} /> */}
                            <stop offset="100%" stopColor={primaryColor} stopOpacity={0.75} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} vertical={false} />
                        <XAxis
                          dataKey="category"
                          reversed={isRtl}
                          tick={{ fontSize: 11, fill: 'currentColor' }}
                          className="text-muted-foreground"
                          axisLine={{ stroke: 'currentColor', strokeOpacity: 0.15 }}
                          tickLine={false}
                          interval={0}
                          angle={isRtl ? 15 : -15}
                          textAnchor={isRtl ? 'start' : 'end'}
                          height={45}
                        />
                        <YAxis
                          orientation={isRtl ? 'right' : 'left'}
                          domain={[0, Math.ceil(maxCategorySales * 1.15)]}
                          tick={{ fontSize: 10, fill: primaryColor }}
                          className="text-primary font-mono"
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => {
                            if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
                            if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
                            return `$${v}`;
                          }}
                          width={48}
                        />
                        <RechartsTooltip
                          cursor={{ fill: 'currentColor', fillOpacity: 0.05 }}
                          wrapperStyle={{ zIndex: 100, outline: 'none', pointerEvents: 'none' }}
                          content={({ active, payload, label }: any) => {
                            if (!active || !payload || !payload.length) return null;
                            const item = payload[0];
                            const categoryName = item?.payload?.category || label;
                            const salesVal = Number(item?.value ?? item?.payload?.sales ?? 0);
                            const qty = item?.payload?.quantity !== undefined ? Number(item?.payload?.quantity) : 0;

                            return (
                              <div
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xl min-w-[200px] pointer-events-none select-none text-start"
                                dir={isRtl ? 'rtl' : 'ltr'}
                              >
                                <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                  <span>{categoryName}</span>
                                  <span className="text-[11px] text-muted-foreground font-normal">{t('Category')}</span>
                                </div>
                                <div className="space-y-1.5 text-xs">
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                                        style={{ backgroundColor: primaryColor }}
                                      />
                                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                                        {t('Revenue')}:
                                      </span>
                                    </div>
                                    <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                                      {formatCurrency(salesVal)}
                                    </span>
                                  </div>
                                  {qty > 0 && (
                                    <div className="flex items-center justify-between gap-4 pt-0.5">
                                      <span className={`text-slate-500 dark:text-slate-400 font-medium ${isRtl ? 'pr-4' : 'pl-4'}`}>
                                        {t('Sold')}:
                                      </span>
                                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                                        {qty} {t('units')}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }}
                        />
                        <Bar
                          dataKey="sales"
                          name={t('Sales')}
                          fill="url(#categoryPrimaryGrad)"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={48}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* ── Recent Orders (Full Width) ── */}
        {userHasPermission('view-orders') && (
          <Card className={`border border-border shadow-sm dark:bg-slate-900 overflow-hidden ${fadeUp(220)}`}>
            <CardHeader className="pb-3 pt-5 px-5 border-b">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
                    <ShoppingCart className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">{t('Recent Orders')}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('Latest store transactions and customer orders')}</p>
                  </div>
                </div>
                <Link
                  href={route('orders.index')}
                  className="flex items-center gap-1 text-xs text-primary font-medium shrink-0 hover:gap-1.5 transition-all duration-150"
                >
                  {t('View all orders')} <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="!p-0">
              {dashboardData.recentOrders && dashboardData.recentOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[720px]">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/40 text-[11px] font-semibold text-muted-foreground tracking-wider">
                        <th className="py-3 px-5">{t('Order Number')}</th>
                        <th className="py-3 px-5">{t('Customer')}</th>
                        <th className="py-3 px-5">{t('Products')}</th>
                        <th className="py-3 px-5">{t('Total Amount')}</th>
                        <th className="py-3 px-5">{t('Payment Status')}</th>
                        <th className="py-3 px-5">{t('Status')}</th>
                        <th className="py-3 px-5 text-right">{t('Action')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {dashboardData.recentOrders.map((order, index) => {
                        const initials = order.customer
                          ? order.customer.split(' ').map((n: string) => n[0]).filter(Boolean).join('').substring(0, 2).toUpperCase()
                          : 'OR';
                        const itemImages: Array<{ id?: number; name?: string; image?: string }> = order.itemImages || [];
                        const totalItems = order.items_count ?? itemImages.length;
                        const visibleImages = itemImages.slice(0, 2);
                        const remainingCount = totalItems > 2 ? totalItems - 2 : 0;

                        return (
                          <tr
                            key={order.id || index}
                            className="hover:bg-muted/40 dark:hover:bg-slate-800/50 transition-colors duration-150 group"
                          >
                            <td className="py-3.5 px-5">
                              <Link
                                href={route('orders.show', order.id)}
                                className="text-sm font-semibold text-foreground hover:text-primary transition-colors block font-mono"
                              >
                                {order.order_number}
                              </Link>
                              {order.payment_method && (
                                <div className="mt-1">
                                  <BadgeUI className="bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/15 dark:text-blue-400 dark:ring-blue-500/35 capitalize">
                                  {order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method.replace(/_/g, ' ')}
                                  </BadgeUI>
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Avatar className="h-8 w-8 shrink-0">
                                  <AvatarImage src={order.customer_photo} alt={order.customer} />
                                  <AvatarFallback className="text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <span className="text-sm font-medium text-foreground truncate block max-w-[160px]">
                                    {order.customer}
                                  </span>
                                  {order.customer_email && (
                                    <span className="text-xs text-muted-foreground truncate block max-w-[160px]" title={order.customer_email}>
                                      {order.customer_email}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-1.5">
                                {visibleImages.length > 0 ? (
                                  <>
                                    {visibleImages.map((item, idx) => (
                                      <div
                                        key={item.id || idx}
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-background p-0.5 shadow-2xs dark:border-zinc-700 dark:bg-zinc-800 overflow-hidden"
                                        title={item.name || 'Product'}
                                      >
                                        <img
                                          src={getImageUrl(item.image || '/storage/media/product/product.png')}
                                          alt={item.name || 'Product'}
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src = getImageUrl('/storage/media/product/product.png');
                                          }}
                                          className="h-full w-full rounded-md object-contain"
                                        />
                                      </div>
                                    ))}
                                    {remainingCount > 0 && (
                                      <BadgeUI
                                        className="h-9 px-2 text-xs font-semibold rounded-lg flex items-center justify-center shrink-0 bg-muted text-muted-foreground ring-border/50"
                                        title={t('+{{count}} more products', { count: remainingCount })}
                                      >
                                        +{remainingCount}
                                      </BadgeUI>
                                    )}
                                    <span className="text-xs text-muted-foreground ml-1 hidden sm:inline-block">
                                      ({totalItems} {totalItems === 1 ? t('item') : t('items')})
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    {totalItems > 0 ? `${totalItems} ${t('items')}` : '—'}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-5">
                              <span className="text-sm font-mono font-semibold text-foreground">
                                {formatCurrency(order.amount)}
                              </span>
                            </td>
                            <td className="py-3.5 px-5">
                              {order.payment_status ? (
                                <BadgeUI className={`whitespace-nowrap capitalize ${order.payment_status === 'paid'
                                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-500/30'
                                  : order.payment_status === 'pending'
                                    ? 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-500/30'
                                    : order.payment_status === 'partial'
                                      ? 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/40 dark:text-blue-400 dark:ring-blue-500/30'
                                      : order.payment_status === 'failed' || order.payment_status === 'unpaid'
                                        ? 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/40 dark:text-red-400 dark:ring-red-500/30'
                                        : 'bg-zinc-100 text-zinc-700 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700'
                                  }`}>
                                  {t(order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1))}
                                </BadgeUI>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="py-3.5 px-5">
                              <BadgeUI className={`whitespace-nowrap capitalize ${order.status === 'completed' || order.status === 'delivered' || order.status === 'paid'
                                ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-500/30'
                                : order.status === 'pending'
                                  ? 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-500/30'
                                  : order.status === 'processing'
                                    ? 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/40 dark:text-blue-400 dark:ring-blue-500/30'
                                    : order.status === 'cancelled'
                                      ? 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/40 dark:text-red-400 dark:ring-red-500/30'
                                      : 'bg-zinc-100 text-zinc-700 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700'
                                }`}>
                                {order.status ? t(order.status.charAt(0).toUpperCase() + order.status.slice(1)) : ''}
                              </BadgeUI>
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              <Link
                                href={route('orders.show', order.id)}
                                className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground  cursor-pointer"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="rounded-full bg-muted p-4">
                    <ShoppingCart className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm text-muted-foreground">{t('No recent orders')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <DashboardOverview
          userType="company"
          stats={{
            orders: dashboardData.metrics.orders,
            products: dashboardData.metrics.products,
            customers: dashboardData.metrics.customers,
            revenue: dashboardData.metrics.revenue
          }}
        />
      </div>
    </PageTemplate>
  );
}