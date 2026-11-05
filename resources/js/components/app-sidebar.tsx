import { NavMain } from '@/components/nav-main';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar';
import { useBrand } from '@/contexts/BrandContext';
import { useLayout } from '@/contexts/LayoutContext';
import { useSidebarSettings } from '@/contexts/SidebarContext';
import { type NavItem } from '@/types';
import { getImageUrl } from '@/utils/image-helper';
import { hasPermission } from '@/utils/permissions';
import { Link, router, usePage } from '@inertiajs/react';
import {
    BarChart,
    Briefcase,
    Building2,
    ChevronDown,
    ChevronRight,
    CreditCard,
    DollarSign,
    Gift,
    Globe2,
    Image,
    LayoutGrid,
    LogOut,
    Mail,
    MessageSquare,
    Package,
    Palette,
    Percent,
    Search,
    Settings,
    ShoppingCart,
    Smartphone,
    Truck,
    UserCheck,
    Users,
    X,
    Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function AppSidebar() {
    const { t } = useTranslation();
    const { auth, globalSettings } = usePage().props as any;
    const isSaas = globalSettings?.is_saas !== false;
    const { position: layoutPosition } = useLayout();

    const userRole = auth.user?.type || auth.user?.role;
    const permissions = auth?.permissions || [];
    const businesses = auth.user?.businesses || [];
    const currentBusiness = businesses.find((b: any) => b.id === auth.user?.current_store) || businesses[0];

    const handleBusinessSwitch = (businessId: number) => {
        router.post(route('switch-business'), { business_id: businessId });
    };

    const getSuperAdminNavItems = (): NavItem[] => [
        {
            title: t('Dashboard'),
            href: route('dashboard'),
            icon: LayoutGrid,
            group: t('Overview'),
        },

        {
            title: t('Companies'),
            href: route('companies.index'),
            icon: Briefcase,
            group: t('Overview'),
        },
        {
            title: t('Media Library'),
            href: route('media-library'),
            icon: Image,
            group: t('Content Management'),
        },

        {
            title: t('Plans'),
            icon: CreditCard,
            group: t('Billing & Plans'),
            children: [
                {
                    title: t('Plan'),
                    href: route('plans.index'),
                },
                {
                    title: t('Plan Request'),
                    href: route('plan-requests.index'),
                },
                {
                    title: t('Plan Orders'),
                    href: route('plan-orders.index'),
                },
            ],
        },
        {
            title: t('Coupons'),
            href: route('coupons.index'),
            icon: Settings,
            group: t('Billing & Plans'),
        },

        {
            title: t('Currency'),
            href: route('currencies.index'),
            icon: DollarSign,
            group: t('System Control'),
        },
        {
            title: t('Location Management'),
            icon: Globe2,
            group: t('System Control'),
            children: [
                {
                    title: t('Countries'),
                    href: route('countries.index'),
                },
                {
                    title: t('States'),
                    href: route('states.index'),
                },
                {
                    title: t('Cities'),
                    href: route('cities.index'),
                },
            ],
        },
        {
            title: t('Referral Program'),
            href: route('referral.index'),
            icon: Gift,
            group: t('System Control'),
        },
        {
            title: t('Landing Page'),
            icon: Palette,
            group: t('Content Management'),
            children: [
                {
                    title: t('Landing Page'),
                    href: route('landing-page'),
                },
                {
                    title: t('Custom Pages'),
                    href: route('landing-page.custom-pages.index'),
                },
                {
                    title: t('Subscribers'),
                    href: route('landing-page.subscribers.index'),
                },
                {
                    title: t('Contact Inquiries'),
                    href: route('landing-page.contacts.index'),
                },
            ],
        },
        {
            title: t('Email Templates'),
            href: route('email-templates.index'),
            icon: Mail,
            group: t('System Control'),
        },
        {
            title: t('Notification Templates'),
            href: route('notification-templates.index'),
            icon: MessageSquare,
            group: t('System Control'),
        },
        {
            title: t('Settings'),
            href: route('settings'),
            icon: Settings,
            group: t('System Control'),
        },
    ];

    const getCompanyNavItems = (): NavItem[] => {
        const items: NavItem[] = [];
        const user = auth.user;
        const plan = user?.plan;

        // Helper function to check feature access
        const hasFeatureAccess = (feature: string) => {
            // Always allow for superadmin
            if (userRole === 'superadmin') return true;

            // If no plan, allow by default (for backward compatibility)
            if (!plan) return true;

            const featureMap: { [key: string]: string } = {
                shipping_method: 'enable_shipping_method',
            };
            const planFeature = featureMap[feature];
            return planFeature ? plan[planFeature] === 'on' : true;
        };

        // Dashboard
        items.push({
            title: t('Dashboard'),
            href: route('dashboard'),
            icon: LayoutGrid,
            group: t('Overview'),
        });

        // Store Management
        if (hasPermission('manage-stores')) {
            items.push({
                title: t('Store Management'),
                icon: Building2,
                group: t('Store Operations'),
                children: [
                    {
                        title: t('Stores'),
                        href: route('stores.index'),
                    },
                ],
            });
        }

        // Product Management
        const productChildren = [];
        if (hasPermission('manage-products')) {
            productChildren.push({
                title: t('Products'),
                href: route('products.index'),
            });
        }
        if (hasPermission('manage-categories')) {
            productChildren.push({
                title: t('Categories'),
                href: route('categories.index'),
            });
        }
        if (hasPermission('manage-tax')) {
            productChildren.push({
                title: t('Tax'),
                href: route('tax.index'),
            });
        }
        if (productChildren.length > 0) {
            items.push({
                title: t('Product Management'),
                icon: Package,
                group: t('Product Catalog'),
                children: productChildren,
            });
        }

        // Order Management
        if (hasPermission('manage-orders')) {
            items.push({
                title: t('Order Management'),
                href: route('orders.index'),
                icon: ShoppingCart,
                group: t('Store Operations'),
            });
        }

        // Customer Management
        if (hasPermission('manage-customers')) {
            items.push({
                title: t('Customer Management'),
                href: route('customers.index'),
                icon: UserCheck,
                group: t('Marketing & Growth'),
            });
        }

        // Coupon System
        if (hasPermission('manage-coupon-system')) {
            items.push({
                title: t('Coupon System'),
                href: route('coupon-system.index'),
                icon: Percent,
                group: t('Marketing & Growth'),
            });
        }

        // Shipping Management - Check plan feature access
        if (hasPermission('manage-shipping') && hasFeatureAccess('shipping_method')) {
            items.push({
                title: t('Shipping Management'),
                href: route('shipping.index'),
                icon: Truck,
                group: t('Store Operations'),
            });
        }

        // Analytics & Reporting
        if (hasPermission('manage-analytics')) {
            items.push({
                title: t('Analytics & Reporting'),
                href: route('analytics.index'),
                icon: BarChart,
                group: t('Overview'),
            });
        }

        // Express Checkout
        if (hasPermission('manage-express-checkout')) {
            items.push({
                title: t('Express Checkout'),
                href: route('express-checkout.index'),
                icon: Zap,
                group: t('Store Operations'),
            });
        }

        // POS System
        if (hasPermission('manage-pos')) {
            items.push({
                title: t('POS System'),
                href: route('pos.index'),
                icon: Smartphone,
                group: t('Store Operations'),
            });
        }

        // Staff Management
        if (hasPermission('manage-users') || hasPermission('manage-roles')) {
            const staffChildren = [];
            if (hasPermission('manage-users')) {
                staffChildren.push({
                    title: t('Users'),
                    href: route('users.index'),
                });
            }
            if (hasPermission('manage-roles')) {
                staffChildren.push({
                    title: t('Roles'),
                    href: route('roles.index'),
                });
            }
            if (staffChildren.length > 0) {
                items.push({
                    title: t('Staff Management'),
                    icon: Users,
                    group: t('System Control'),
                    children: staffChildren,
                });
            }
        }

        // Media Library
        if (hasPermission('manage-media')) {
            items.push({
                title: t('Media Library'),
                href: route('media-library'),
                icon: Image,
                group: t('Product Catalog'),
            });
        }

        // Plans
        const planChildren = [];
        if (hasPermission('manage-plans')) {
            planChildren.push({
                title: t('Plan'),
                href: route('plans.index'),
            });
        }
        if (hasPermission('manage-plan-requests')) {
            planChildren.push({
                title: t('Plan Request'),
                href: route('plan-requests.index'),
            });
        }
        if (hasPermission('manage-plan-orders')) {
            planChildren.push({
                title: t('Plan Orders'),
                href: route('plan-orders.index'),
            });
        }
        if (planChildren.length > 0) {
            items.push({
                title: t('Plans'),
                icon: CreditCard,
                group: t('System Control'),
                children: planChildren,
            });
        }

        // Referral Program
        if (hasPermission('manage-referral')) {
            items.push({
                title: t('Referral Program'),
                href: route('referral.index'),
                icon: Gift,
                group: t('Marketing & Growth'),
            });
        }

        // Settings - Only show if user has settings permission
        if (hasPermission('manage-settings')) {
            items.push({
                title: t('Settings'),
                href: route('settings'),
                icon: Settings,
                group: t('System Control'),
            });
        }

        return items;
    };

    const mainNavItems = userRole === 'superadmin' ? getSuperAdminNavItems() : getCompanyNavItems();

    const { position, effectivePosition } = useLayout();
    const { variant, collapsible, style } = useSidebarSettings();
    const { logoLight, logoDark, favicon, titleText, updateBrandSettings } = useBrand();
    const [sidebarStyle, setSidebarStyle] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        // Apply styles based on sidebar style
        if (style === 'colored') {
            setSidebarStyle({ backgroundColor: 'var(--primary)', color: 'white' });
        } else if (style === 'gradient') {
            setSidebarStyle({
                background: 'linear-gradient(to bottom, var(--primary), color-mix(in srgb, var(--primary), transparent 20%))',
                color: 'white',
            });
        } else {
            setSidebarStyle({});
        }
    }, [style]);

    const filterNavItems = (items: NavItem[], query: string): NavItem[] => {
        if (!query.trim()) return items;
        const q = query.toLowerCase();
        const result: NavItem[] = [];
        items.forEach((item) => {
            if (item.children) {
                const matchedChildren = item.children.filter((child) => child.title.toLowerCase().includes(q));
                if (item.title.toLowerCase().includes(q)) {
                    result.push(item);
                } else if (matchedChildren.length > 0) {
                    result.push({ ...item, children: matchedChildren, defaultOpen: true });
                }
            } else {
                if (item.title.toLowerCase().includes(q)) {
                    result.push(item);
                }
            }
        });
        return result;
    };

    const filteredNavItems = filterNavItems(mainNavItems, searchQuery);

    // Get the first available menu item's href for logo link
    const getFirstAvailableHref = () => {
        if (filteredNavItems.length === 0) return route('dashboard');

        const firstItem = filteredNavItems[0];
        if (firstItem.href) {
            return firstItem.href;
        } else if (firstItem.children && firstItem.children.length > 0) {
            return firstItem.children[0].href || route('dashboard');
        }
        return route('dashboard');
    };

    return (
        <Sidebar
            side={effectivePosition}
            collapsible={collapsible}
            variant={variant}
            className={style !== 'plain' ? 'sidebar-custom-style' : ''}
            data-sidebar-style={style}
        >
            <SidebarHeader className={style !== 'plain' ? 'sidebar-styled' : ''} style={sidebarStyle}>
                <div className="flex items-center justify-center py-2">
                    <Link href={getFirstAvailableHref()} prefetch className="flex items-center justify-center">
                        {/* Logo for expanded sidebar */}
                        <div className="flex items-center group-data-[collapsible=icon]:hidden">
                            {(() => {
                                const isDark = document.documentElement.classList.contains('dark');
                                const currentLogo = isDark ? logoLight : logoDark;

                                return currentLogo ? (
                                    <img
                                        key={currentLogo}
                                        src={getImageUrl(currentLogo)}
                                        alt="Logo"
                                        className="h-6 w-auto object-contain transition-all duration-200"
                                        onError={() => updateBrandSettings({ [isDark ? 'logoLight' : 'logoDark']: '' })}
                                    />
                                ) : (
                                    <div className="flex h-8 items-center text-lg font-semibold tracking-tight text-inherit">
                                        {titleText || 'WhatsStore'}
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Icon for collapsed sidebar */}
                        <div className="hidden h-8 w-8 group-data-[collapsible=icon]:block">
                            {(() => {
                                return favicon ? (
                                    <img
                                        key={favicon}
                                        src={getImageUrl(favicon)}
                                        alt="Icon"
                                        className="h-8 w-8 transition-all duration-200"
                                        onError={() => updateBrandSettings({ favicon: '' })}
                                    />
                                ) : (
                                    <div className="bg-primary flex h-8 w-8 items-center justify-center rounded font-bold text-white shadow-sm">
                                        W
                                    </div>
                                );
                            })()}
                        </div>
                    </Link>
                </div>

                {/* Search Input */}
                <div className="px-2 pb-2 group-data-[collapsible=icon]:hidden">
                    <div className="relative" dir={position === 'right' ? 'rtl' : 'ltr'}>
                        <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 rtl:right-2.5" />
                        <input
                            type="text"
                            data-sidebar="input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('Search menu...')}
                            className="focus:border-primary focus:ring-primary w-full rounded-md border border-gray-300 bg-gray-50 py-1.5 pr-7 pl-8 text-sm text-gray-700 placeholder-gray-400 transition-all outline-none focus:ring-1 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:placeholder-gray-500"
                            style={{ color: style !== 'plain' ? 'inherit' : undefined }}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Business Switcher - Only show for company users */}
                {userRole !== 'superadmin' && businesses.length > 0 && (
                    <div className="px-2 pb-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="h-8 w-full justify-between px-2 text-xs group-data-[collapsible=icon]:hidden"
                                    style={{ color: style !== 'plain' ? 'inherit' : undefined }}
                                >
                                    <div className="flex min-w-0 items-center gap-2">
                                        <Building2 className="h-3 w-3 flex-shrink-0" />
                                        <span className="truncate">{currentBusiness?.name || t('Select Business')}</span>
                                    </div>
                                    <ChevronDown className="h-3 w-3 flex-shrink-0" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-56">
                                {businesses.length > 0 ? (
                                    businesses.map((business: any) => (
                                        <DropdownMenuItem
                                            key={business.id}
                                            onClick={() => handleBusinessSwitch(business.id)}
                                            className={business.id === auth.user?.current_store ? 'bg-accent' : ''}
                                        >
                                            <Building2 className="mr-2 h-4 w-4" />
                                            <span className="truncate">{business.name}</span>
                                            {business.id === auth.user?.current_store && (
                                                <span className="text-muted-foreground ml-auto text-xs">Current</span>
                                            )}
                                        </DropdownMenuItem>
                                    ))
                                ) : (
                                    <DropdownMenuItem disabled>
                                        <span className="text-muted-foreground">No businesses found</span>
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </SidebarHeader>

            <SidebarContent>
                <div style={sidebarStyle} className={`h-full ${style !== 'plain' ? 'sidebar-styled' : ''}`}>
                    <NavMain items={filteredNavItems} position={effectivePosition} searchQuery={searchQuery} />
                </div>
            </SidebarContent>

            <SidebarFooter className={isSaas && userRole === 'company' ? 'border-t' : ''}>
                {/* Plan Active UI — SaaS + Company only */}
                {isSaas &&
                    userRole === 'company' &&
                    (() => {
                        const user = auth.user;
                        const plan = user?.plan;
                        const isActive = user?.plan_is_active === 1;
                        const isTrial = user?.is_trial == 1;

                        const expireDate = isTrial == 1 ? user?.trial_expire_date : user?.plan_expire_date || globalSettings?.planExirationDate;

                        const daysLeft = expireDate ? Math.ceil((new Date(expireDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                        const isExpired = daysLeft == null || daysLeft <= 0;

                        let subText = '';
                        if (isExpired) subText = t('Plan expired');
                        else if (!plan) subText = t('No Plan');
                        else if (isTrial) subText = daysLeft !== null ? t('Trial · {{n}} days left', { n: daysLeft }) : t('Trial');
                        else if (daysLeft !== null && daysLeft <= 7) subText = t('Expires in {{n}} days', { n: daysLeft });
                        else subText = plan.name;

                        return (
                            <div ref={userMenuRef} className="relative group-data-[collapsible=icon]:hidden" dir={layoutPosition === 'right' ? 'rtl' : 'ltr'}>
                                {/* Popup panel — expands above */}
                                {userMenuOpen && (
                                    <div className="absolute right-0 bottom-full left-0 z-50 mb-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
                                        {/* User info row */}
                                        <Link
                                            href={route('profile')}
                                            onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-3 border-b border-gray-100 px-3 py-3 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
                                        >
                                            <div className="relative shrink-0">
                                                {auth.user?.avatar ? (
                                                    <img src={auth.user.avatar} alt={auth.user.name} className="h-9 w-9 rounded-full object-cover" onError={(e) => {
                                                        (e.target as HTMLImageElement).src = getImageUrl('/storage/media/avatars/avatar.png');
                                                    }} />
                                                ) : (
                                                    <div className="bg-primary line-clamp-1 flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white">
                                                        {auth.user?.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="line-clamp-1 truncate text-sm font-semibold text-gray-900 dark:text-white">
                                                    {auth.user?.name}
                                                </p>
                                                <p className="line-clamp-1 truncate text-xs text-gray-500 dark:text-gray-400">{auth.user?.email}</p>
                                            </div>
                                            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                                        </Link>

                                        {/* Actions */}
                                        <div className="py-1">
                                            <Link
                                                href={route('referral.index')}
                                                onClick={() => setUserMenuOpen(false)}
                                                className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                                            >
                                                <Gift className="h-4 w-4 text-gray-400" />
                                                {t('Referral Program')}
                                            </Link>
                                            <Link
                                                href={route('plans.index')}
                                                onClick={() => setUserMenuOpen(false)}
                                                className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                                            >
                                                <CreditCard className="h-4 w-4 text-gray-400" />
                                                {t('Plans')}
                                            </Link>
                                            <Link
                                                href={route('settings')}
                                                onClick={() => setUserMenuOpen(false)}
                                                className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                                            >
                                                <Settings className="h-4 w-4 text-gray-400" />
                                                {t('Settings')}
                                            </Link>
                                        </div>

                                        <div className="border-t border-gray-100 py-1 dark:border-gray-800">
                                            <Link
                                                href={route('logout')}
                                                method="post"
                                                as="button"
                                                onClick={() => setUserMenuOpen(false)}
                                                className="flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                                            >
                                                <LogOut className="h-4 w-4 text-gray-400" />
                                                {t('Log out')}
                                            </Link>
                                        </div>
                                    </div>
                                )}

                                {/* Trigger card */}
                                <button
                                    type="button"
                                    onClick={() => setUserMenuOpen((v) => !v)}
                                    className="flex w-full cursor-pointer items-center gap-3 rounded-xl bg-black/10 px-3 py-2.5 transition-colors dark:bg-white/10"
                                >
                                    <div className="shrink-0">
                                        {auth.user?.avatar ? (
                                            <img src={auth.user.avatar} alt={auth.user.name} className="h-8 w-8 rounded-full object-cover" onError={(e) => {
                                                (e.target as HTMLImageElement).src = getImageUrl('/storage/media/avatars/avatar.png');
                                            }} />
                                        ) : (
                                            <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white">
                                                <img src={getImageUrl('/storage/media/avatars/avatar.png')} alt={auth.user.name} className="h-8 w-8 rounded-full object-cover" onError={(e) => {
                                                (e.target as HTMLImageElement).src = getImageUrl('/storage/media/avatars/avatar.png');
                                            }} />
                                            </div>
                                        )}
                                    </div>
                                    <div className={`min-w-0 flex-1 ${layoutPosition === 'right' ? 'text-right' : 'text-left'}`}>
                                        <p className="text-sidebar-foreground line-clamp-1 truncate text-sm font-medium">{auth.user?.name}</p>
                                        <p
                                            className={`line-clamp-1 truncate text-xs ${isExpired ? 'text-red-400' : daysLeft !== null && daysLeft <= 7 ? 'text-orange-500' : 'text-sidebar-foreground/60'}`}
                                        >
                                            {subText}
                                        </p>
                                    </div>
                                    <Link
                                        href={route('plans.index')}
                                        onClick={(e) => e.stopPropagation()}
                                        className="shrink-0 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-900 hover:bg-gray-100 hover:!text-gray-900"
                                    >
                                        {t('Upgrade')}
                                    </Link>
                                </button>
                            </div>
                        );
                    })()}
            </SidebarFooter>
        </Sidebar>
    );
}
