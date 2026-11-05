import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useLayout } from '@/contexts/LayoutContext';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { ProfileMenu } from '@/components/profile-menu';
import { LanguageSwitcher } from '@/components/language-switcher';
import { usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { StoreSwitcher } from '@/components/store-switcher';
import { LogOut, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

const setCookie = (name: string, value: string, days = 365) => {
    if (typeof document === 'undefined') return;
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${maxAge};SameSite=Lax`;
};

const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        const cookieValue = parts.pop()?.split(';').shift();
        return cookieValue ? decodeURIComponent(cookieValue) : null;
    }
    return null;
};

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const { t } = useTranslation();
    const { position } = useLayout();
    const { globalSettings } = usePage().props as any;
    const isDemo = globalSettings?.is_demo || false;

    const getCurrentMode = (): 'light' | 'dark' => {
        if (isDemo) {
            try {
                const cookie = getCookie('themeSettings');
                if (cookie) {
                    const parsed = JSON.parse(cookie);
                    return parsed.appearance === 'dark' ? 'dark' : 'light';
                }
            } catch {}
            return 'light';
        }
        return (globalSettings?.themeMode === 'dark') ? 'dark' : 'light';
    };

    const [isDark, setIsDark] = useState(() => getCurrentMode() === 'dark');

    useEffect(() => {
        setIsDark(getCurrentMode() === 'dark');
    }, [globalSettings?.themeMode]);

    useEffect(() => {
        if (!isDemo) return;
        const observer = new MutationObserver(() => {
            const domIsDark = document.documentElement.classList.contains('dark');
            setIsDark(domIsDark);
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, [isDemo]);

    const handleToggle = () => {
        const newMode = isDark ? 'light' : 'dark';
        setIsDark(!isDark);

        document.documentElement.classList.toggle('dark', newMode === 'dark');
        document.body.classList.toggle('dark', newMode === 'dark');

        if (isDemo) {
            try {
                const existing = getCookie('themeSettings');
                const parsed = existing ? JSON.parse(existing) : {};
                const updated = { ...parsed, appearance: newMode };
                setCookie('themeSettings', JSON.stringify(updated));
            } catch {
                setCookie('themeSettings', JSON.stringify({ appearance: newMode }));
            }
        } else {
            router.post(route('settings.brand.update'), {
                settings: {
                    themeMode: newMode,
                }
            }, { preserveScroll: true, preserveState: true });
        }
    };

    return (
        <>
            <header className="border-sidebar-border/50 flex h-14 shrink-0 items-center gap-2 border-b px-[10px] lg:px-[50px] transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                <div className="flex w-full min-w-0 items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                        <SidebarTrigger className="-ml-1 shrink-0" />
                        <div className="text-sm font-medium">
                            <Breadcrumbs breadcrumbs={breadcrumbs} />
                        </div>
                    </div>
                    <div className="flex min-w-0 items-center gap-1.5 sm:gap-2 md:gap-3">
                        {/* Store Switcher - Hide for superadmin */}
                        {(usePage().props as any).auth?.user?.type !== 'superadmin' && (usePage().props as any).auth?.user?.type !== 'super admin' && (
                            <div className="shrink-0">
                                <StoreSwitcher
                                    items={(usePage().props as any).stores || []}
                                    currentStore={((usePage().props as any).stores || []).find(store => String(store.id) === String((usePage().props as any).auth?.user?.current_store)) || ((usePage().props as any).stores?.length > 0 ? (usePage().props as any).stores[0] : null)}
                                />
                            </div>
                        )}

                        {(usePage().props as any).isImpersonating && (
                            <button
                                onClick={() => router.post(route('impersonate.leave'))}
                                className="flex shrink-0 items-center gap-1 rounded bg-red-500 px-1.5 py-1 text-xs text-white hover:bg-red-600 sm:px-2"
                                title={t("Return Back")}
                            >
                                <LogOut className="h-3.5 w-3.5" />
                                <span className="hidden lg:inline">{t("Return Back")}</span>
                            </button>
                        )}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={handleToggle}
                                    className="flex items-center justify-center h-9 w-9 rounded-md border shadow-sm bg-white dark:bg-gray-900 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                                >
                                    {isDark
                                        ? <Sun className="h-4 w-4 text-yellow-500" />
                                        : <Moon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                    }
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{isDark ? t('Switch to Light Mode') : t('Switch to Dark Mode')}</TooltipContent>
                        </Tooltip>
                        <div className="shrink-0">
                            <LanguageSwitcher />
                        </div>
                        <div className="shrink-0">
                            <ProfileMenu />
                        </div>
                        {/* {position === 'right' && <SidebarTrigger className="-mr-1 shrink-0" />} */}
                    </div>
                </div>
            </header>
        </>
    );
}
