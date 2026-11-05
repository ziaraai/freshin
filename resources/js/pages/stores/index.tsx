import BadgeUI from '@/components/badge-ui';
import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/currency-helper';
import { getImageUrl } from '@/utils/image-helper';
import { checkPermission, hasPermission } from '@/utils/permissions';
import { Link, router, usePage } from '@inertiajs/react';
import { toast } from '@/components/custom-toast';
import {
    ArrowUpRight,
    BarChart,
    Building2,
    Calendar,
    CheckCircle2,
    Download,
    Edit,
    Eye,
    Globe,
    LayoutGrid,
    MoreVertical,
    Plus,
    Settings,
    Trash2,
    Users,
    XCircle,
} from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PageAction {
    label: string;
    icon: React.ReactNode;
    variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    onClick: () => void;
}

interface StoreManagementProps {
    stores?: any[];
    storeStats?: any;
}

export default function StoreManagement({ stores = [], storeStats = {} }: StoreManagementProps) {
    const { t } = useTranslation();
    const { auth } = usePage().props as any;
    const [storeToDelete, setStoreToDelete] = useState<number | null>(null);

    // Helper to get URL query parameter with default value
    const getUrlParam = (param: string, defaultValue: string) => {
        if (typeof window === 'undefined') return defaultValue;
        const params = new URLSearchParams(window.location.search);
        return params.get(param) || defaultValue;
    };

    // Client side search, filter, and sorting states (initialized from URL parameters)
    const [searchTerm, setSearchTerm] = useState(() => getUrlParam('search', ''));
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(() => getUrlParam('status', 'all') as any);
    const [sortBy, setSortBy] = useState<'trending' | 'name' | 'newest'>(() => getUrlParam('sort', 'newest') as any);
    const [currentPage, setCurrentPage] = useState(() => parseInt(getUrlParam('page', '1'), 10));
    const [perPage, setPerPage] = useState(() => parseInt(getUrlParam('per_page', '6'), 10));
    const [showFilters, setShowFilters] = useState(false);

    // Sync state to URL parameters
    React.useEffect(() => {
        const params = new URLSearchParams();
        if (searchTerm) params.set('search', searchTerm);
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (sortBy !== 'newest') params.set('sort', sortBy);
        if (currentPage !== 1) params.set('page', currentPage.toString());
        if (perPage !== 6) params.set('per_page', perPage.toString());

        const newSearch = params.toString();
        const currentSearch = window.location.search.replace(/^\?/, '');
        if (newSearch !== currentSearch) {
            const newUrl = `${window.location.pathname}${newSearch ? '?' + newSearch : ''}`;
            window.history.replaceState({ ...window.history.state, path: newUrl }, '', newUrl);
        }
    }, [searchTerm, statusFilter, sortBy, currentPage, perPage]);

    // Reset page when search, status, or sorting changes
    const isFirstRender = React.useRef(true);
    React.useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        setCurrentPage(1);
    }, [searchTerm, statusFilter, sortBy]);

    // Pre-filter stores based on search query first (so tab counts reflect searches)
    const searchedStores = React.useMemo(() => {
        let result = [...stores];
        if (searchTerm) {
            const query = searchTerm.toLowerCase();
            result = result.filter(
                (store) =>
                    store.name?.toLowerCase().includes(query) ||
                    store.slug?.toLowerCase().includes(query) ||
                    (store.custom_domain && store.custom_domain.toLowerCase().includes(query)) ||
                    (store.custom_subdomain && store.custom_subdomain.toLowerCase().includes(query)),
            );
        }
        return result;
    }, [stores, searchTerm]);

    const statusTabs = React.useMemo(
        () => [
            { value: 'all', label: t('All'), icon: <LayoutGrid className="h-4 w-4" />, count: searchedStores.length },
            {
                value: 'active',
                label: t('Active'),
                icon: <CheckCircle2 className="h-4 w-4" />,
                count: searchedStores.filter((s) => s.config_status).length,
            },
            {
                value: 'inactive',
                label: t('Inactive'),
                icon: <XCircle className="h-4 w-4" />,
                count: searchedStores.filter((s) => !s.config_status).length,
            },
        ],
        [searchedStores, t],
    );

    const filterOptions = [
        {
            name: 'sort_by',
            label: t('Sort By'),
            type: 'select' as const,
            value: sortBy,
            onChange: (value: any) => setSortBy(value === '_empty_' ? 'newest' : value),
            options: [
                { value: 'trending', label: t('Trending') },
                { value: 'name', label: t('Name') },
                { value: 'newest', label: t('Newest') },
            ],
            hideBadgeCancelButton: sortBy === 'newest',
        },
    ];

    const hasActiveFilters = () => {
        return searchTerm !== '' || statusFilter !== 'all' || sortBy !== 'newest';
    };

    const activeFilterCount = () => {
        return (searchTerm ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (sortBy !== 'newest' ? 1 : 0);
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setSortBy('newest');
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
    };

    const handleActionClick = (action: string, permission: string, storeId?: number) => {
        if (!checkPermission(permission, auth)) {
            return;
        }

        switch (action) {
            case 'view':
                router.visit(route('stores.show', storeId));
                break;
            case 'edit':
                router.visit(route('stores.edit', storeId));
                break;
            case 'settings':
                router.visit(route('stores.settings', storeId));
                break;
            case 'delete':
                if (stores.length <= 1) {
                    return; // Prevent deletion of last store
                }
                setStoreToDelete(storeId!);
                break;
            case 'create':
                router.visit(route('stores.create'));
                break;
            case 'export':
                window.open(route('stores.export'), '_blank');
                break;
        }
    };

    const handleDelete = () => {
        if (storeToDelete && checkPermission('delete-stores', auth)) {
            toast.loading(t('Deleting store...'));
            router.delete(route('stores.destroy', storeToDelete), {
                onSuccess: (page: any) => {
                    toast.dismiss();
                    if (page?.props?.flash?.success) {
                        toast.success(t(page.props.flash.success));
                    } else if (page?.props?.flash?.error) {
                        toast.error(t(page.props.flash.error));
                    }
                },
                onError: (errors) => {
                    toast.dismiss();
                    toast.error(t('Failed to delete store'));
                }
            });
            setStoreToDelete(null);
        }
    };

    const pageActions: PageAction[] = [
        ...(hasPermission('export-stores')
            ? [
                  {
                      label: t('Export'),
                      icon: <Download className="h-4 w-4" />,
                      variant: 'outline' as const,
                      onClick: () => handleActionClick('export', 'export-stores'),
                  },
              ]
            : []),
        ...(hasPermission('create-stores')
            ? [
                  {
                      label: t('Create Store'),
                      icon: <Plus className="h-4 w-4" />,
                      variant: 'default' as const,
                      onClick: () => handleActionClick('create', 'create-stores'),
                  },
              ]
            : []),
    ];

    // Helper to construct logo initials
    const getInitials = (name: string) => {
        return name
            ? name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase()
            : 'ST';
    };

    // Helper to color logo blocks dynamically
    const getStoreLogoColor = (id: number) => {
        const gradients = [
            'from-indigo-600 to-blue-500 text-white dark:from-indigo-500 dark:to-blue-400',
            'from-amber-500 to-orange-400 text-white dark:from-amber-600 dark:to-orange-500',
            'from-emerald-500 to-teal-400 text-white dark:from-emerald-600 dark:to-teal-500',
            'from-pink-500 to-rose-400 text-white dark:from-pink-600 dark:to-rose-500',
            'from-purple-500 to-indigo-400 text-white dark:from-purple-600 dark:to-indigo-500',
            'from-cyan-500 to-blue-400 text-white dark:from-cyan-600 dark:to-blue-500',
            'from-lime-500 to-emerald-400 text-white dark:from-lime-600 dark:to-emerald-500',
        ];
        return gradients[id % gradients.length];
    };

    // Deterministic seed generation for mock trend/growth metrics
    const getStoreTrend = (id: number, type: 'revenue' | 'orders' | 'customers') => {
        const seed = ((id * 7 + (type === 'revenue' ? 3 : type === 'orders' ? 5 : 9)) % 25) + 3;
        return `${seed}%`;
    };

    // Processed stores with search, filter, and sorting applied
    const filteredAndSortedStores = React.useMemo(() => {
        let result = [...searchedStores];

        if (statusFilter !== 'all') {
            const isActive = statusFilter === 'active';
            result = result.filter((store) => !!store.config_status === isActive);
        }

        if (sortBy === 'trending') {
            result.sort((a, b) => {
                const revA = Number(a.revenue || 0);
                const revB = Number(b.revenue || 0);
                if (revB !== revA) return revB - revA;
                const ordA = Number(a.orders_count || 0);
                const ordB = Number(b.orders_count || 0);
                return ordB - ordA;
            });
        } else if (sortBy === 'name') {
            result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        } else if (sortBy === 'newest') {
            result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }

        return result;
    }, [searchedStores, statusFilter, sortBy]);

    // Client pagination metrics
    const total = filteredAndSortedStores.length;
    const lastPage = Math.ceil(total / perPage);
    const from = total > 0 ? (currentPage - 1) * perPage + 1 : 0;
    const to = Math.min(currentPage * perPage, total);

    const paginatedStores = React.useMemo(() => {
        return filteredAndSortedStores.slice((currentPage - 1) * perPage, currentPage * perPage);
    }, [filteredAndSortedStores, currentPage, perPage]);

    // Adjust page if current page exceeds last page after filtering
    React.useEffect(() => {
        if (currentPage > 1 && currentPage > lastPage) {
            setCurrentPage(Math.max(1, lastPage));
        }
    }, [lastPage, currentPage]);

    const handlePageChangeLocal = (url: string) => {
        const match = url.match(/page=(\d+)/);
        if (match) {
            setCurrentPage(parseInt(match[1]));
        }
    };

    const paginationLinks = React.useMemo(() => {
        const links = [];
        links.push({
            label: '&laquo; Previous',
            url: currentPage > 1 ? `?page=${currentPage - 1}` : null,
            active: false,
        });
        for (let i = 1; i <= lastPage; i++) {
            links.push({
                label: i.toString(),
                url: `?page=${i}`,
                active: i === currentPage,
            });
        }
        links.push({
            label: 'Next &raquo;',
            url: currentPage < lastPage ? `?page=${currentPage + 1}` : null,
            active: false,
        });
        return links;
    }, [currentPage, lastPage]);

    return (
        <PageTemplate
            title={t('Stores')}
            description={t('Manage your online stores')}
            url="/stores"
            actions={pageActions}
            breadcrumbs={[
                { title: t('Dashboard'), href: route('dashboard') },
                { title: t('Store Management'), href: route('stores.index') },
                { title: t('Stores') },
            ]}
            noPadding
        >
            <div className="space-y-4 sm:space-y-6">
                {/* Stats Cards Section */}
                <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Card 1: Total Stores */}
                    <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-emerald-50 dark:bg-emerald-950/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
                        <div className="relative flex items-start justify-between">
                            <div>
                                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Total Stores')}</p>
                                <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl">{stores.length}</p>
                                <div className="mt-2 flex items-center gap-1.5">
                                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t('Your store count')}</span>
                                </div>
                            </div>
                            <div className="relative z-10 rounded-xl bg-emerald-100 p-2.5 dark:bg-emerald-900/40 sm:p-3">
                                <Building2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 sm:h-7 sm:w-7" />
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Active Stores */}
                    <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-purple-50 dark:bg-purple-950/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
                        <div className="relative flex items-start justify-between">
                            <div>
                                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Active Stores')}</p>
                                <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl">
                                    {stores.filter((store) => store.config_status).length}
                                </p>
                                <div className="mt-2 flex items-center gap-1.5">
                                    <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                                        {stores.length > 0
                                            ? t('{{percent}}% active rate', {
                                                  percent: Math.round((stores.filter((store) => store.config_status).length / stores.length) * 100),
                                              })
                                            : t('No stores yet')}
                                    </span>
                                </div>
                            </div>
                            <div className="relative z-10 rounded-xl bg-purple-100 p-2.5 dark:bg-purple-900/40 sm:p-3">
                                <Globe className="h-6 w-6 text-purple-600 dark:text-purple-400 sm:h-7 sm:w-7" />
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Total Customers */}
                    <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-blue-50 dark:bg-blue-900/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
                        <div className="relative flex items-start justify-between">
                            <div>
                                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Total Customers')}</p>
                                <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl">{storeStats.totalCustomers || 0}</p>
                                <div className="mt-2 flex items-center gap-1.5">
                                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                        {storeStats.customerGrowth >= 0 ? '+' : ''}
                                        {storeStats.customerGrowth || 0}% {t('from last month')}
                                    </span>
                                </div>
                            </div>
                            <div className="relative z-10 rounded-xl bg-blue-100 p-2.5 dark:bg-blue-900/40 sm:p-3">
                                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400 sm:h-7 sm:w-7" />
                            </div>
                        </div>
                    </div>

                    {/* Card 4: Revenue */}
                    <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-orange-50 dark:bg-orange-950/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
                        <div className="relative flex items-start justify-between">
                            <div>
                                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Revenue')}</p>
                                <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl font-mono">{formatCurrency(storeStats.totalRevenue || 0)}</p>
                                <div className="mt-2 flex items-center gap-1.5">
                                    <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                                        {storeStats.revenueGrowth >= 0 ? '+' : ''}
                                        {storeStats.revenueGrowth || 0}% {t('from last month')}
                                    </span>
                                </div>
                            </div>
                            <div className="relative z-10 rounded-xl bg-orange-100 p-2.5 dark:bg-orange-900/40 sm:p-3">
                                <BarChart className="h-6 w-6 text-orange-600 dark:text-orange-400 sm:h-7 sm:w-7" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search and filters section */}
                <div className="mb-4 rounded-xl border border-zinc-200 bg-white shadow dark:border-zinc-800 dark:bg-zinc-900">
                    <SearchAndFilterBar
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        onSearch={handleSearch}
                        searchPlaceholder={t('Search stores...')}
                        filters={filterOptions}
                        statusTabs={statusTabs}
                        activeStatusTab={statusFilter}
                        onStatusTabChange={(value: any) => setStatusFilter(value)}
                        hasActiveFilters={hasActiveFilters}
                        activeFilterCount={activeFilterCount}
                        onResetFilters={handleResetFilters}
                    />
                </div>

                {/* Stores List Grid */}
                {filteredAndSortedStores.length === 0 ? (
                    <div className="rounded-2xl border border-zinc-300 bg-white px-4 py-10 text-center dark:border-zinc-700 dark:bg-zinc-900 sm:py-16">
                        <Building2 className="mx-auto mb-4 h-12 w-12 text-zinc-300 dark:text-zinc-700" />
                        <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-white">{t('No stores found')}</h3>
                        <p className="mx-auto mb-6 max-w-sm text-zinc-500 dark:text-zinc-400">
                            {t("We couldn't find any stores matching your search query or status filter.")}
                        </p>
                        {hasPermission('create-stores') && (
                            <Button onClick={() => handleActionClick('create', 'create-stores')} className="rounded-xl">
                                <Plus className="mr-2 h-4 w-4" /> {t('Create Store')}
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {paginatedStores.map((store) => (
                            <div
                                key={store.id}
                                className="flex flex-col justify-between gap-4 rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900 sm:gap-5 sm:p-5"
                            >
                                {/* Top Section: Logo & Name & Actions */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                                        {/* Logo/Icon Block */}
                                        <a
                                            href={store.store_url || `/store/${store.slug}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 hover:opacity-85 transition-opacity"
                                        >
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
                                        </a>

                                        {/* Info */}
                                        <div className="min-w-0 flex-1 space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                {hasPermission('view-stores') ? (
                                                    <Link
                                                        href={route('stores.show', store.id)}
                                                        className="max-w-full truncate text-base font-bold text-zinc-950 hover:text-primary dark:text-white dark:hover:text-primary transition-colors"
                                                    >
                                                        {store.name}
                                                    </Link>
                                                ) : (
                                                    <h3 className="max-w-full truncate text-base font-bold text-zinc-950 dark:text-white">{store.name}</h3>
                                                )}
                                                <BadgeUI
                                                    className={cn(
                                                        store.config_status
                                                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20'
                                                            : 'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20',
                                                    )}
                                                >
                                                    {store.config_status ? t('Active') : t('Inactive')}
                                                </BadgeUI>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 dark:text-zinc-500">
                                                <span className="font-medium">
                                                    {t('Theme: {{theme}}', {
                                                        theme: store.theme
                                                            ? store.theme
                                                                  .split('-')
                                                                  .map((word: any) => word.charAt(0).toUpperCase() + word.slice(1))
                                                                  .join(' ')
                                                            : '',
                                                    })}
                                                </span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {window.appSettings.formatDateTime(store.created_at,false)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions Dropdown Menu */}
                                    <div className="-mt-0.5 flex shrink-0 items-center">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg p-0 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                                                    title={t('Actions')}
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                    <span className="sr-only">{t('Actions')}</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg">
                                                <DropdownMenuItem
                                                    onClick={() => window.open(store.store_url || `/store/${store.slug}`, '_blank')}
                                                    className="cursor-pointer gap-2 py-2"
                                                >
                                                    <Globe className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                                                    <span>{t('Visit Store')}</span>
                                                </DropdownMenuItem>

                                                {hasPermission('view-stores') && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleActionClick('view', 'view-stores', store.id)}
                                                        className="cursor-pointer gap-2 py-2"
                                                    >
                                                        <Eye className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                                                        <span>{t('View Store')}</span>
                                                    </DropdownMenuItem>
                                                )}

                                                {hasPermission('edit-stores') && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleActionClick('edit', 'edit-stores', store.id)}
                                                        className="cursor-pointer gap-2 py-2"
                                                    >
                                                        <Edit className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                                                        <span>{t('Edit Store')}</span>
                                                    </DropdownMenuItem>
                                                )}

                                                {hasPermission('settings-stores') && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleActionClick('settings', 'settings-stores', store.id)}
                                                        className="cursor-pointer gap-2 py-2"
                                                    >
                                                        <Settings className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                                                        <span>{t('Store Settings')}</span>
                                                    </DropdownMenuItem>
                                                )}

                                                {hasPermission('delete-stores') && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                if (stores.length <= 1) {
                                                                    toast.error(t('Cannot delete the last store'));
                                                                    return;
                                                                }
                                                                handleActionClick('delete', 'delete-stores', store.id);
                                                            }}
                                                            disabled={stores.length <= 1}
                                                            className={cn(
                                                                'cursor-pointer gap-2 py-2 text-rose-600 focus:text-rose-600 dark:text-rose-400 dark:focus:text-rose-400',
                                                                stores.length <= 1 && 'cursor-not-allowed text-zinc-400 opacity-50',
                                                            )}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                                                            <span>{t('Delete Store')}</span>
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {/* Sub Domain Details */}
                                <div className="truncate rounded-xl border border-zinc-100/50 bg-zinc-50 px-4 py-2 font-mono text-xs text-zinc-500 dark:border-zinc-800/30 dark:bg-zinc-950/50 dark:text-zinc-400">
                                    {store.custom_domain || store.custom_subdomain || t('No domain configured')}
                                </div>

                                {/* Divider */}
                                <div className="border-t border-zinc-200 dark:border-zinc-700" />

                                {/* Bottom Section: Numerical Statistics Grid */}
                                <div className="grid grid-cols-3 gap-2">
                                    {/* Revenue column */}
                                    <div className="space-y-1">
                                        <span className="block text-[10px] font-bold tracking-wider text-zinc-400 capitalize">{t('Revenue')}</span>
                                        <div className="flex flex-wrap items-baseline gap-1.5">
                                            <span className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200 font-mono">
                                                {formatCurrency(store.revenue || 0)}
                                            </span>
                                            <span className="flex items-center text-[10px] font-bold text-emerald-500">
                                                <ArrowUpRight className="mr-0.5 h-2.5 w-2.5" />
                                                {getStoreTrend(store.id, 'revenue')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Orders column */}
                                    <div className="space-y-1 border-l rtl:border-l-0 rtl:border-r border-zinc-200 pl-2 rtl:pl-0 rtl:pr-2 dark:border-zinc-700 sm:pl-4 rtl:sm:pl-0 rtl:sm:pr-4">
                                        <span className="block text-[10px] font-bold tracking-wider text-zinc-400 capitalize">{t('Orders')}</span>
                                        <div className="flex flex-wrap items-baseline gap-1.5">
                                            <span className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200">{store.orders_count || 0}</span>
                                            <span className="flex items-center text-[10px] font-bold text-emerald-500">
                                                <ArrowUpRight className="mr-0.5 h-2.5 w-2.5" />
                                                {getStoreTrend(store.id, 'orders')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Customers column */}
                                    <div className="space-y-1 border-l rtl:border-l-0 rtl:border-r border-zinc-200 pl-2 rtl:pl-0 rtl:pr-2 dark:border-zinc-700 sm:pl-4 rtl:sm:pl-0 rtl:sm:pr-4">
                                        <span className="block text-[10px] font-bold tracking-wider text-zinc-400 capitalize">{t('Customers')}</span>
                                        <div className="flex flex-wrap items-baseline gap-1.5">
                                            <span className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200">
                                                {store.customers_count || 0}
                                            </span>
                                            <span className="flex items-center text-[10px] font-bold text-emerald-500">
                                                <ArrowUpRight className="mr-0.5 h-2.5 w-2.5" />
                                                {getStoreTrend(store.id, 'customers')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Local Pagination Wrapper */}
                {total > 0 && (
                    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow dark:border-zinc-800 dark:bg-zinc-900">
                        <Pagination
                            from={from}
                            to={to}
                            total={total}
                            currentPage={currentPage}
                            lastPage={lastPage}
                            entityName={t('stores')}
                            links={paginationLinks}
                            onPageChange={handlePageChangeLocal}
                            perPageOptions={[6, 12, 24, 48]}
                            currentPerPage={perPage.toString()}
                            onPerPageChange={(value) => {
                                setPerPage(parseInt(value));
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <CrudDeleteModal
                isOpen={!!storeToDelete}
                onClose={() => setStoreToDelete(null)}
                onConfirm={handleDelete}
                itemName={stores.find((s: any) => s.id === storeToDelete)?.name || ''}
                entityName={t('store')}
            />
        </PageTemplate>
    );
}
