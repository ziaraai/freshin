import React from 'react';
import { PageTemplate } from '@/components/page-template';
import {
    ArrowLeft,
    Edit,
    Settings,
    Globe,
    Building2,
    Calendar,
    Users,
    BarChart3,
    ShoppingBag,
    Package,
    ExternalLink,
    ChevronRight,
    Mail,
    Palette,
    Layers,
    Copy,
    Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import BadgeUI from '@/components/badge-ui';
import { useTranslation } from 'react-i18next';
import { router, usePage, Link } from '@inertiajs/react';
import { formatCurrency } from '@/utils/currency-helper';
import { getImageUrl } from '@/utils/image-helper';
import { checkPermission, hasPermission } from '@/utils/permissions';
import { cn } from '@/lib/utils';
import { toast } from '@/components/custom-toast';

export default function ViewStore({ store, stats }) {
    const { t } = useTranslation();
    const { auth } = usePage().props as any;
    const [copied, setCopied] = React.useState(false);

    // Get permissions directly
    const userPermissions = typeof auth?.permissions === 'function' ? auth.permissions() : (auth?.permissions || []);
    const hasEditPermission = userPermissions.includes('edit-stores');
    const hasSettingsPermission = userPermissions.includes('settings-stores');

    // Construct storefront URL
    const storefrontUrl = store.store_url || (() => {
        const protocol = window.location.protocol;
        if (store.enable_custom_domain && store.custom_domain) {
            return `${protocol}//${store.custom_domain}`;
        }
        if (store.enable_custom_subdomain && store.custom_subdomain) {
            const currentHost = window.location.hostname;
            const baseDomain = currentHost.includes('localhost') 
                ? 'localhost' 
                : currentHost.split('.').slice(-2).join('.');
            return `${protocol}//${store.custom_subdomain}.${baseDomain}`;
        }
        try {
            return route('store.home', store.slug);
        } catch (e) {
            return `/store/${store.slug}`;
        }
    })();

    const handleCopyUrl = () => {
        navigator.clipboard.writeText(storefrontUrl);
        setCopied(true);
        toast.success(t('URL copied to clipboard!'));
        setTimeout(() => setCopied(false), 2000);
    };

    const pageActions = [
        {
            label: t('Visit Store'),
            icon: <Globe className="h-4 w-4" />,
            variant: 'outline' as const,
            onClick: () => window.open(storefrontUrl, '_blank')
        },
        ...(hasSettingsPermission ? [{
            label: t('Store Settings'),
            icon: <Settings className="h-4 w-4" />,
            variant: 'outline' as const,
            onClick: () => router.visit(route('stores.settings', store.id))
        }] : []),
        // ...(hasEditPermission ? [{
        //     label: t('Edit Store'),
        //     icon: <Edit className="h-4 w-4" />,
        //     variant: 'default' as const,
        //     onClick: () => router.visit(route('stores.edit', store.id))
        // }] : [])
    ];

    // Format Theme Name for display
    const formattedThemeName = store.theme
        ? store.theme
              .split('-')
              .map((word: any) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
        : 'Default';

    return (
        <PageTemplate 
            title={t('Store Details')}
            url={`/stores/${store.id}`}
            actions={pageActions}
            backUrl={route('stores.index')}
            breadcrumbs={[
                { title: t('Dashboard'), href: route('dashboard') },
                { title: t('Stores'), href: route('stores.index') },
                { title: t('Store Details') }
            ]}
            description={t('View store details, statistics, and configuration.')}
        >
            <div className="space-y-4 sm:space-y-6">
                
                {/* Modern Hero/Header Panel */}
                <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 transition-all duration-300">
                    <div className="absolute top-0 right-0 rtl:right-auto rtl:left-0 h-40 w-40 rounded-bl-full rtl:rounded-bl-none rtl:rounded-br-full bg-primary/5 dark:bg-primary/10 -z-10 pointer-events-none" />
                    
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 sm:gap-6">
                        <div className="flex items-center sm:items-start gap-4 sm:gap-5 min-w-0 text-start">
                            {/* Logo Wrapper */}
                            <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 shadow-sm dark:border-zinc-800 dark:bg-zinc-800/50">
                                {store.logo ? (
                                    <img
                                        src={getImageUrl(store.favicon)}
                                        alt={store.name}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            const defaultFallback = getImageUrl('/storage/media/product/product.png');
                                            if (target.src !== defaultFallback) {
                                                target.src = defaultFallback;
                                            }
                                        }}
                                    />
                                ) : store.favicon ? (
                                    <img
                                        src={getImageUrl(store.favicon)}
                                        alt={store.name}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            const defaultFallback = getImageUrl('/storage/media/product/product.png');
                                            if (target.src !== defaultFallback) {
                                                target.src = defaultFallback;
                                            }
                                        }}
                                    />
                                ) : (
                                    <img
                                        src={getImageUrl('/storage/media/product/product.png')}
                                        alt={store.name}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            const defaultFallback = getImageUrl('/storage/media/product/product.png');
                                            if (target.src !== defaultFallback) {
                                                target.src = defaultFallback;
                                            }
                                        }}
                                    />
                                )}
                            </div>

                            {/* Store Meta Info */}
                            <div className="space-y-1.5 sm:space-y-2 min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                                    <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight truncate max-w-full">{store.name}</h2>
                                    <BadgeUI
                                        className={cn(
                                            "shrink-0",
                                            store.config_status
                                                ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20'
                                                : 'bg-rose-50 text-rose-700 ring-rose-600/10 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20'
                                        )}
                                    >
                                        {store.config_status ? t('Active') : t('Inactive')}
                                    </BadgeUI>
                                    {store.maintenance_mode && (
                                        <BadgeUI className="bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20 shrink-0">
                                            {t('Maintenance Mode')}
                                        </BadgeUI>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                                    <span className="flex items-center gap-1.5 shrink-0">
                                        <Palette className="h-3.5 w-3.5 opacity-70 shrink-0" />
                                        {t('Theme: {{theme}}', { theme: formattedThemeName })}
                                    </span>
                                    <span className="opacity-40">•</span>
                                    <span className="flex items-center gap-1.5 shrink-0">
                                        <Calendar className="h-3.5 w-3.5 opacity-70 shrink-0" />
                                        {t('Created: {{date}}', { date: new Date(store.created_at).toLocaleDateString() })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Top quick access link preview */}
                        <div className="w-full lg:w-auto flex flex-col items-start lg:items-end gap-1.5 pt-3 lg:pt-0 border-t border-zinc-100 dark:border-zinc-800/80 lg:border-t-0">
                            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t('Store URL')}</span>
                            <div className="flex items-center gap-2 w-full sm:w-auto max-w-full">
                                <div className="rounded-xl border border-zinc-200/80 bg-zinc-50 px-3.5 py-2 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400 truncate flex-1 sm:flex-initial sm:max-w-xs md:max-w-sm lg:max-w-md font-mono" title={storefrontUrl}>
                                    {storefrontUrl}
                                </div>
                                <button
                                    onClick={handleCopyUrl}
                                    className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors shrink-0"
                                    title={t('Copy URL')}
                                >
                                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                                </button>
                                <a
                                    href={storefrontUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors shrink-0"
                                    title={t('Visit Live Store')}
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards Section */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Card 1: Total Revenue */}
                    <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-orange-50 dark:bg-orange-950/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
                        <div className="relative flex items-start justify-between">
                            <div>
                                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Total Revenue')}</p>
                                <p className="text-2xl font-bold text-zinc-900 dark:text-white font-mono">
                                    {stats?.formatted_revenue || formatCurrency(stats?.total_revenue || 0)}
                                </p>
                                <div className="mt-2 flex items-center gap-1.5">
                                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t('All-time store earnings')}</span>
                                </div>
                            </div>
                            <div className="relative z-10 rounded-xl bg-orange-100 p-3 dark:bg-orange-900/40">
                                <BarChart3 className="h-7 w-7 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Total Orders */}
                    <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-blue-50 dark:bg-blue-900/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
                        <div className="relative flex items-start justify-between">
                            <div>
                                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Total Orders')}</p>
                                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats?.total_orders || 0}</p>
                                <div className="mt-2 flex items-center gap-1.5">
                                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t('Completed transactions')}</span>
                                </div>
                            </div>
                            <div className="relative z-10 rounded-xl bg-blue-100 p-3 dark:bg-blue-900/40">
                                <ShoppingBag className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Total Products */}
                    <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-emerald-50 dark:bg-emerald-950/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
                        <div className="relative flex items-start justify-between">
                            <div>
                                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Total Products')}</p>
                                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats?.total_products || 0}</p>
                                <div className="mt-2 flex items-center gap-1.5">
                                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t('Active products in catalog')}</span>
                                </div>
                            </div>
                            <div className="relative z-10 rounded-xl bg-emerald-100 p-3 dark:bg-emerald-900/40">
                                <Package className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                    </div>

                    {/* Card 4: Total Customers */}
                    <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-purple-50 dark:bg-purple-950/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
                        <div className="relative flex items-start justify-between">
                            <div>
                                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Total Customers')}</p>
                                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats?.total_customers || 0}</p>
                                <div className="mt-2 flex items-center gap-1.5">
                                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t('Registered shopper profiles')}</span>
                                </div>
                            </div>
                            <div className="relative z-10 rounded-xl bg-purple-100 p-3 dark:bg-purple-900/40">
                                <Users className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Details and Actions Section */}
                <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
                    
                    {/* Domain & Settings Information */}
                    <Card className="border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm bg-white dark:bg-zinc-900 overflow-hidden">
                        <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/60 pb-4">
                            <CardTitle className="text-base font-extrabold text-zinc-900 dark:text-white">{t('System & Domain Info')}</CardTitle>
                            <CardDescription className="text-xs">{t('Verify store routing and configuration status.')}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {/* Domain Type row */}
                            <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800/40">
                                <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{t('Domain Mode')}</span>
                                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                                    {store.enable_custom_domain 
                                        ? t('Custom Domain') 
                                        : store.enable_custom_subdomain 
                                            ? t('Custom Subdomain') 
                                            : t('Default Domain')}
                                </span>
                            </div>
                            
                            {/* Custom Domain Info */}
                            <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800/40">
                                <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{t('Custom Domain')}</span>
                                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                                    {store.custom_domain || t('Not Configured')}
                                </span>
                            </div>

                            {/* Custom Subdomain Info */}
                            <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800/40">
                                <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{t('Custom Subdomain')}</span>
                                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                                    {store.custom_subdomain || t('Not Configured')}
                                </span>
                            </div>

                            {/* Store Email info */}
                            <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800/40">
                                <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                                    <Mail className="h-4 w-4 text-zinc-400" />
                                    {t('Contact Email')}
                                </span>
                                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                                    {store.email || t('No email set')}
                                </span>
                            </div>

                            {/* Status Reason Info */}
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{t('Visibility')}</span>
                                <span className="text-sm font-medium">
                                    {store.config_status ? (
                                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{t('Online & Discoverable')}</span>
                                    ) : (
                                        <span className="text-rose-600 dark:text-rose-400 font-semibold">{t('Offline / Private')}</span>
                                    )}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Shortcuts / Actions Card */}
                    <Card className="border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm bg-white dark:bg-zinc-900 overflow-hidden">
                        <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/60 pb-4">
                            <CardTitle className="text-base font-extrabold text-zinc-900 dark:text-white">{t('Quick Shortcuts')}</CardTitle>
                            <CardDescription className="text-xs">{t('Direct access links to manage store assets.')}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-3">
                            
                            {/* Shortcut 1: Manage Products */}
                            {hasPermission('manage-products') && (
                                <Link 
                                    href={route('products.index')}
                                    className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary/10 text-primary p-2 rounded-lg dark:bg-primary/20">
                                            <Package className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <span className="block text-sm font-bold text-zinc-800 dark:text-zinc-200">{t('Product Catalog')}</span>
                                            <span className="block text-[11px] text-zinc-400 dark:text-zinc-500">{t('Add and edit items in this store')}</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-primary group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-all" />
                                </Link>
                            )}

                            {/* Shortcut 2: Manage Orders */}
                            {hasPermission('manage-orders') && (
                                <Link 
                                    href={route('orders.index')}
                                    className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary/10 text-primary p-2 rounded-lg dark:bg-primary/20">
                                            <ShoppingBag className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <span className="block text-sm font-bold text-zinc-800 dark:text-zinc-200">{t('Orders History')}</span>
                                            <span className="block text-[11px] text-zinc-400 dark:text-zinc-500">{t('View and fulfill customer orders')}</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-primary group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-all" />
                                </Link>
                            )}

                            {/* Shortcut 3: Store Settings */}
                            {hasSettingsPermission && (
                                <Link 
                                    href={route('stores.settings', store.id)}
                                    className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary/10 text-primary p-2 rounded-lg dark:bg-primary/20">
                                            <Settings className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <span className="block text-sm font-bold text-zinc-800 dark:text-zinc-200">{t('Store Configuration')}</span>
                                            <span className="block text-[11px] text-zinc-400 dark:text-zinc-500">{t('Payment gateway, widgets and style settings')}</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-primary group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-all" />
                                </Link>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageTemplate>
    );
}