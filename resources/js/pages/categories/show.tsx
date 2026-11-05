import BadgeUI from '@/components/badge-ui';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';
import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency } from '@/utils/currency-helper';
import { getImageUrl } from '@/utils/image-helper';
import { router, usePage } from '@inertiajs/react';
import {
    ArrowUpRight,
    Calendar,
    Check,
    CheckCircle2,
    Clock,
    Copy,
    CornerDownRight,
    DollarSign,
    FolderTree,
    GitFork,
    Info,
    Layers,
    Package,
    SlidersHorizontal,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function ShowCategory() {
    const { t } = useTranslation();
    const { category, subcategories = [], productCount = 0, stats, auth, globalSettings } = usePage().props as any;

    const permissions = auth?.permissions || [];
    const isSuperAdmin = auth?.user?.type === 'super admin' || auth?.user?.type === 'superadmin';
    const hasPermission = (permission: string): boolean => {
        if (isSuperAdmin) return true;
        return permissions.includes(permission);
    };

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [copiedSlug, setCopiedSlug] = useState(false);

    const canEdit =
        hasPermission('edit-categories') || auth?.user?.type === 'super admin' || auth?.user?.type === 'admin' || auth?.user?.type === 'store';
    const canDelete =
        hasPermission('delete-categories') || auth?.user?.type === 'super admin' || auth?.user?.type === 'admin' || auth?.user?.type === 'store';

    const handleCopySlug = () => {
        if (category?.slug) {
            navigator.clipboard.writeText(`/${category.slug}`);
            setCopiedSlug(true);
            toast.success(t('Slug copied to clipboard'));
            setTimeout(() => setCopiedSlug(false), 2000);
        }
    };

    const handleDelete = () => {
        if (isDeleting) return;
        setIsDeleting(true);

        if (!globalSettings?.is_demo) {
            toast.loading(t('Deleting category...'));
        }

        router.delete(route('categories.destroy', category.id), {
            preserveScroll: true,
            onSuccess: (page: any) => {
                setIsDeleting(false);
                setDeleteDialogOpen(false);
                if (!globalSettings?.is_demo) {
                    toast.dismiss();
                }
                if (page?.props?.flash?.success) {
                    toast.success(t(page.props.flash.success));
                } else if (page?.props?.flash?.error) {
                    toast.error(t(page.props.flash.error));
                } else {
                    toast.success(t('Category deleted successfully'));
                }
            },
            onError: (errs: any) => {
                setIsDeleting(false);
                setDeleteDialogOpen(false);
                if (!globalSettings?.is_demo) {
                    toast.dismiss();
                }
                const firstErr = Object.values(errs)[0] as string;
                toast.error(t(firstErr || 'Failed to delete category'));
            },
        });
    };

    const isRootCategory = !category?.parent_id;

    // Format revenue for display
    const formattedRevenue = stats?.formatted_revenue || formatCurrency(stats?.total_revenue || 0);

    const formatDate = (dateString?: string | null) => {
        if (!dateString) return '-';
        if (typeof window !== 'undefined' && window.appSettings?.formatDateTime) {
            return window.appSettings.formatDateTime(dateString, false);
        }
        try {
            return new Date(dateString).toLocaleDateString();
        } catch {
            return String(dateString);
        }
    };

    return (
        <PageTemplate
            title={category?.name || t('Category Details')}
            description={t('Detailed overview, hierarchy structure, and assigned products for this category.')}
            url="/categories/show"
            backUrl={route('categories.index')}
            actions={[]}
            breadcrumbs={[
                { title: t('Dashboard'), href: route('dashboard') },
                { title: t('Product Management'), href: route('products.index') },
                { title: t('Categories'), href: route('categories.index') },
                { title: category?.name || t('Category Details') },
            ]}
        >
            <div className="space-y-6">
                {/* 1. HERO SHOWCASE CARD */}
                <div className="border-border/80 from-card via-card to-primary/5 relative overflow-hidden rounded-2xl border bg-gradient-to-r p-5 shadow-xs sm:p-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-start gap-4 sm:items-center">
                            {/* Category Image / Avatar */}
                            <div className="border-border/80 bg-muted/40 relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border shadow-xs sm:h-24 sm:w-24">
                                {category?.image ? (
                                    <img
                                        src={getImageUrl(category.image)}
                                        alt={category.name}
                                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = getImageUrl('/storage/media/product/product.png');
                                        }}
                                    />
                                ) : (
                                    <div className="bg-primary/10 text-primary flex h-full w-full items-center justify-center">
                                        <FolderTree className="h-10 w-10" />
                                    </div>
                                )}
                            </div>

                            {/* Category Details Header */}
                            <div className="min-w-0 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-foreground truncate text-xl font-bold tracking-tight sm:text-2xl">{category?.name}</h1>

                                    <BadgeUI
                                        className={
                                            category?.is_active
                                                ? 'bg-emerald-50 font-medium text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400'
                                                : 'bg-red-50 font-medium text-red-700 ring-red-600/20 dark:bg-red-950/30 dark:text-red-400'
                                        }
                                    >
                                        {category?.is_active ? t('Active') : t('Inactive')}
                                    </BadgeUI>

                                    {isRootCategory ? (
                                        <BadgeUI className="gap-1.5 bg-sky-50 font-medium text-sky-700 ring-sky-600/20 dark:bg-sky-950/30 dark:text-sky-300">
                                            <Layers className="h-3.5 w-3.5" />
                                            {t('Root Category')}
                                        </BadgeUI>
                                    ) : (
                                        <BadgeUI className="gap-1.5 bg-amber-50 font-medium text-amber-700 ring-amber-600/20 dark:bg-amber-950/30 dark:text-amber-400">
                                            <GitFork className="h-3 w-3" />
                                            {t('Subcategory')}
                                        </BadgeUI>
                                    )}
                                </div>

                                <div className="text-muted-foreground flex flex-wrap items-center gap-2.5 text-xs">
                                    {/* Slug Badge with Copy */}
                                    <div className="flex items-center gap-1">
                                        <BadgeUI className="bg-zinc-100 font-mono text-zinc-600 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-400">
                                            /{category?.slug}
                                        </BadgeUI>
                                        <button
                                            type="button"
                                            onClick={handleCopySlug}
                                            className="text-muted-foreground hover:text-foreground hover:bg-muted rounded p-1 transition-colors"
                                            title={t('Copy slug')}
                                        >
                                            {copiedSlug ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                                        </button>
                                    </div>

                                    {category?.parent && (
                                        <div className="flex items-center gap-1.5 text-xs">
                                            <CornerDownRight className="text-muted-foreground/60 h-3.5 w-3.5" />
                                            <span>{t('Parent')}:</span>
                                            <button
                                                type="button"
                                                onClick={() => router.visit(route('categories.show', category.parent.id))}
                                                className="text-primary font-medium hover:underline"
                                            >
                                                {category.parent.name}
                                            </button>
                                        </div>
                                    )}

                                    <BadgeUI
                                        className="bg-zinc-100 font-mono text-zinc-600 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-400"
                                        title={t('Display sort order')}
                                    >
                                        #{category?.sort_order ?? 0}
                                    </BadgeUI>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. TOP KPI STATS CARDS */}
                <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Card 1: Total Products */}
                    <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 shadow-xs transition-shadow duration-200 hover:shadow-md sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-blue-50 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none dark:bg-blue-900/20" />
                        <div className="relative flex items-start justify-between">
                            <div>
                                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Total Products')}</p>
                                <p className="text-xl font-bold text-zinc-900 sm:text-2xl dark:text-white">
                                    {stats?.total_products ?? productCount ?? 0}
                                </p>
                                <div className="mt-2 flex items-center gap-1.5">
                                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{t('Assigned to this category')}</span>
                                </div>
                            </div>
                            <div className="relative z-10 rounded-xl bg-blue-100 p-2.5 sm:p-3 dark:bg-blue-900/40">
                                <Package className="h-6 w-6 text-blue-600 sm:h-7 sm:w-7 dark:text-blue-400" />
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Active Products */}
                    <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 shadow-xs transition-shadow duration-200 hover:shadow-md sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-emerald-50 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none dark:bg-emerald-950/20" />
                        <div className="relative flex items-start justify-between">
                            <div>
                                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Active Products')}</p>
                                <p className="text-xl font-bold text-zinc-900 sm:text-2xl dark:text-white">{stats?.active_products ?? 0}</p>
                                <div className="mt-2 flex items-center gap-1.5">
                                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{t('Live & purchasable')}</span>
                                </div>
                            </div>
                            <div className="relative z-10 rounded-xl bg-emerald-100 p-2.5 sm:p-3 dark:bg-emerald-900/40">
                                <CheckCircle2 className="h-6 w-6 text-emerald-600 sm:h-7 sm:w-7 dark:text-emerald-400" />
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Subcategories */}
                    <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 shadow-xs transition-shadow duration-200 hover:shadow-md sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-amber-50 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none dark:bg-amber-950/20" />
                        <div className="relative flex items-start justify-between">
                            <div>
                                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Subcategories')}</p>
                                <p className="text-xl font-bold text-zinc-900 sm:text-2xl dark:text-white">
                                    {stats?.subcategories_count ?? subcategories?.length ?? 0}
                                </p>
                                <div className="mt-2 flex items-center gap-1.5">
                                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                                        {isRootCategory ? t('Nested child categories') : t('Secondary children')}
                                    </span>
                                </div>
                            </div>
                            <div className="relative z-10 rounded-xl bg-amber-100 p-2.5 sm:p-3 dark:bg-amber-900/40">
                                <GitFork className="h-6 w-6 text-amber-600 sm:h-7 sm:w-7 dark:text-amber-400" />
                            </div>
                        </div>
                    </div>

                    {/* Card 4: Category Revenue */}
                    <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 shadow-xs transition-shadow duration-200 hover:shadow-md sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-purple-50 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none dark:bg-purple-950/20" />
                        <div className="relative flex items-start justify-between">
                            <div>
                                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Category Revenue')}</p>
                                <p className="text-xl font-bold text-zinc-900 sm:text-2xl dark:text-white">{formattedRevenue}</p>
                                <div className="mt-2 flex items-center gap-1.5">
                                    <span className="text-xs font-medium text-purple-600 dark:text-purple-400">{t('Lifetime orders revenue')}</span>
                                </div>
                            </div>
                            <div className="relative z-10 rounded-xl bg-purple-100 p-2.5 sm:p-3 dark:bg-purple-900/40">
                                <DollarSign className="h-6 w-6 text-purple-600 sm:h-7 sm:w-7 dark:text-purple-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. DETAILED CONTENT LAYOUT */}
                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
                    {/* Main Content Column (Left) */}
                    <div className="space-y-6 lg:col-span-8">
                        {/* Description Card */}
                        <Card className="border-border/80 border shadow-xs">
                            <CardHeader className="pb-3 sm:pb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-lg">
                                        <Info className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-semibold">{t('Description & Overview')}</CardTitle>
                                        <CardDescription className="text-xs">{t('General information displayed on the storefront')}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-1">
                                {category?.description ? (
                                    <p className="text-sm leading-relaxed whitespace-pre-line text-zinc-700 dark:text-zinc-300">
                                        {category.description}
                                    </p>
                                ) : (
                                    <div className="border-border/80 bg-muted/20 rounded-xl border border-dashed p-6 text-center">
                                        <p className="text-muted-foreground text-sm">{t('No description has been added for this category yet.')}</p>
                                        {canEdit && (
                                            <Button
                                                variant="link"
                                                size="sm"
                                                onClick={() => router.visit(route('categories.edit', category.id))}
                                                className="text-primary mt-1 text-xs"
                                            >
                                                {t('Add description in Edit mode')}
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Nested Subcategories Section */}
                        <Card className="border-border/80 border shadow-xs">
                            <CardHeader className="flex flex-row items-center justify-between pb-3 sm:pb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-lg">
                                        <GitFork className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-semibold">{t('Nested Subcategories')}</CardTitle>
                                        <CardDescription className="text-xs">
                                            {subcategories && subcategories.length > 0
                                                ? t('{{count}} subcategories directly under this category', { count: subcategories.length })
                                                : t('Child categories organized under this category')}
                                        </CardDescription>
                                    </div>
                                </div>

                                {subcategories && subcategories.length > 0 && (
                                    <BadgeUI className="bg-purple-50 font-medium text-purple-700 ring-purple-600/20 dark:bg-purple-950/30 dark:text-purple-300">
                                        {t('{{count}} Total', { count: subcategories.length })}
                                    </BadgeUI>
                                )}
                            </CardHeader>

                            <CardContent className="pt-1">
                                {subcategories && subcategories.length > 0 ? (
                                    <div className="space-y-3">
                                        {subcategories.map((sub: any) => (
                                            <div
                                                key={sub.id}
                                                className="group border-border/80 bg-card hover:border-primary/40 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 transition-all duration-200 hover:shadow-xs sm:p-3.5"
                                            >
                                                {/* Left: Category Image & Identity */}
                                                <div className="flex min-w-0 items-center gap-3">
                                                    {/* Real Subcategory Image */}
                                                    <div className="border-border/80 bg-muted/40 relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border shadow-2xs">
                                                        {sub.image ? (
                                                            <img
                                                                src={getImageUrl(sub.image)}
                                                                alt={sub.name}
                                                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = getImageUrl('/storage/media/product/product.png');
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                                                <GitFork className="h-5 w-5" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="min-w-0 space-y-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => router.visit(route('categories.show', sub.id))}
                                                                className="text-foreground hover:text-primary block truncate text-left text-sm font-semibold transition-colors rtl:text-right"
                                                            >
                                                                {sub.name}
                                                            </button>

                                                            <BadgeUI className="gap-1 bg-amber-50 text-[11px] font-medium text-amber-700 ring-amber-600/20 dark:bg-amber-950/30 dark:text-amber-400">
                                                                <GitFork className="h-2.5 w-2.5" />
                                                                {t('Subcategory')}
                                                            </BadgeUI>
                                                        </div>

                                                        <div className="text-muted-foreground flex items-center gap-2 text-xs">
                                                            <BadgeUI className="bg-zinc-100 font-mono text-[11px] text-zinc-600 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-400">
                                                                /{sub.slug}
                                                            </BadgeUI>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right: Metrics, Status & Action */}
                                                <div className="ms-auto flex items-center gap-2.5 sm:gap-3">
                                                    <BadgeUI className="gap-1.5 bg-zinc-100 font-medium text-zinc-700 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-300">
                                                        <Package className="text-muted-foreground h-3.5 w-3.5" />
                                                        <span>{t('{{count}} Products', { count: sub.products_count ?? 0 })}</span>
                                                    </BadgeUI>

                                                    <BadgeUI
                                                        className={
                                                            sub.is_active
                                                                ? 'bg-emerald-50 font-medium text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400'
                                                                : 'bg-red-50 font-medium text-red-700 ring-red-600/20 dark:bg-red-950/30 dark:text-red-400'
                                                        }
                                                    >
                                                        {sub.is_active ? t('Active') : t('Inactive')}
                                                    </BadgeUI>

                                                    <div className="border-border/70 flex items-center border-l pl-2 rtl:border-r rtl:border-l-0 rtl:pr-2 rtl:pl-0">
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                                                                        onClick={() => router.visit(route('categories.show', sub.id))}
                                                                    >
                                                                        <ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>{t('View Subcategory')}</TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="border-border/80 bg-muted/20 rounded-xl border border-dashed p-8 text-center">
                                        <GitFork className="text-muted-foreground/50 mx-auto mb-2 h-8 w-8" />
                                        <p className="text-foreground text-sm font-medium">{t('No nested subcategories')}</p>
                                        <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-xs">
                                            {isRootCategory
                                                ? t(
                                                      'This root category has no children. You can assign subcategories to it during category creation.',
                                                  )
                                                : t('This is a secondary child category in the catalog taxonomy.')}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar Column (Right) */}
                    <div className="space-y-6 lg:col-span-4">
                        {/* Taxonomy / Hierarchy Visualizer Card */}
                        <Card className="border-border/80 border shadow-xs">
                            <CardHeader className="pb-3 sm:pb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-lg">
                                        <Layers className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-semibold">{t('Taxonomy Structure')}</CardTitle>
                                        <CardDescription className="text-xs">{t('Position in catalog hierarchy')}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-1">
                                <div className="border-border/70 bg-muted/30 space-y-3 rounded-xl border p-4">
                                    {category?.parent ? (
                                        <>
                                            {/* Parent node */}
                                            <div className="flex items-center gap-3">
                                                <div className="border-border/80 bg-muted/40 relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border shadow-2xs">
                                                    {category.parent?.image ? (
                                                        <img
                                                            src={getImageUrl(category.parent.image)}
                                                            alt={category.parent.name}
                                                            className="h-full w-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = getImageUrl('/storage/media/product/product.png');
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center bg-sky-500/10 text-sky-600 dark:text-sky-400">
                                                            <Layers className="h-5 w-5" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-muted-foreground text-[11px] font-medium">{t('Parent (Root)')}</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => router.visit(route('categories.show', category.parent.id))}
                                                        className="text-primary block truncate text-xs font-semibold hover:underline"
                                                    >
                                                        {category.parent.name}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Tree connector line */}
                                            <div className="border-primary/40 ms-5 h-5 w-px border-l-2 border-dashed rtl:border-r-2 rtl:border-l-0" />

                                            {/* Current node */}
                                            <div className="flex items-center gap-3">
                                                <div className="border-primary bg-primary/5 relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 shadow-xs">
                                                    {category?.image ? (
                                                        <img
                                                            src={getImageUrl(category.image)}
                                                            alt={category.name}
                                                            className="h-full w-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = getImageUrl('/storage/media/product/product.png');
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                                            <GitFork className="h-5 w-5" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-muted-foreground text-[11px] font-medium">{t('Current Subcategory')}</p>
                                                    <p className="text-foreground truncate text-xs font-semibold">{category.name}</p>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {/* Root node */}
                                            <div className="flex items-center gap-3">
                                                <div className="border-primary bg-primary/5 relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 shadow-xs">
                                                    {category?.image ? (
                                                        <img
                                                            src={getImageUrl(category.image)}
                                                            alt={category.name}
                                                            className="h-full w-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = getImageUrl('/storage/media/product/product.png');
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="bg-primary/10 text-primary flex h-full w-full items-center justify-center">
                                                            <Layers className="h-5 w-5" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-muted-foreground text-[11px] font-medium">{t('Root Category')}</p>
                                                    <p className="text-foreground truncate text-xs font-semibold">{category.name}</p>
                                                </div>
                                            </div>

                                            {/* Tree connector line */}
                                            <div className="border-primary/40 ms-5 h-5 w-px border-l-2 border-dashed rtl:border-r-2 rtl:border-l-0" />

                                            {/* Subcategories count node */}
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 text-purple-600 shadow-2xs dark:text-purple-400">
                                                    <GitFork className="h-5 w-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-muted-foreground text-[11px] font-medium">{t('Child Elements')}</p>
                                                    <p className="text-foreground text-xs font-semibold">
                                                        {t('{{count}} subcategories', { count: subcategories?.length || 0 })}
                                                    </p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Category Metadata Card */}
                        <Card className="border-border/80 border shadow-xs">
                            <CardHeader className="pb-3 sm:pb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-lg">
                                        <SlidersHorizontal className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-semibold">{t('Metadata & Details')}</CardTitle>
                                        <CardDescription className="text-xs">{t('Catalog identification and timestamp audit')}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-1 text-xs">
                                <div className="border-border/50 flex items-center justify-between border-b py-1.5">
                                    <span className="text-muted-foreground">{t('Status')}</span>
                                    <BadgeUI
                                        className={
                                            category?.is_active
                                                ? 'bg-emerald-50 font-medium text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400'
                                                : 'bg-red-50 font-medium text-red-700 ring-red-600/20 dark:bg-red-950/30 dark:text-red-400'
                                        }
                                    >
                                        {category?.is_active ? t('Active') : t('Inactive')}
                                    </BadgeUI>
                                </div>

                                <div className="border-border/50 flex items-center justify-between border-b py-1.5">
                                    <span className="text-muted-foreground">{t('Hierarchy Level')}</span>
                                    <BadgeUI
                                        className={
                                            isRootCategory
                                                ? 'bg-sky-50 font-medium text-sky-700 ring-sky-600/20 dark:bg-sky-950/30 dark:text-sky-300'
                                                : 'bg-amber-50 font-medium text-amber-700 ring-amber-600/20 dark:bg-amber-950/30 dark:text-amber-400'
                                        }
                                    >
                                        {isRootCategory ? t('Root Category') : t('Subcategory')}
                                    </BadgeUI>
                                </div>

                                <div className="border-border/50 flex items-center justify-between border-b py-1.5">
                                    <span className="text-muted-foreground">{t('Sort Order')}</span>
                                    <BadgeUI className="bg-zinc-100 font-mono text-zinc-600 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-400">
                                        #{category?.sort_order ?? 0}
                                    </BadgeUI>
                                </div>

                                {category?.created_at && (
                                    <div className="border-border/50 flex items-center justify-between border-b py-1.5">
                                        <span className="text-muted-foreground flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {t('Created')}
                                        </span>
                                        <span className="text-foreground font-medium">{formatDate(category.created_at)}</span>
                                    </div>
                                )}

                                {category?.updated_at && (
                                    <div className="flex items-center justify-between py-1.5">
                                        <span className="text-muted-foreground flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5" />
                                            {t('Last Updated')}
                                        </span>
                                        <span className="text-foreground font-medium">{formatDate(category.updated_at)}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal using CrudDeleteModal */}
            <CrudDeleteModal
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDelete}
                itemName={category?.name || ''}
                entityName={t('Category')}
            />
        </PageTemplate>
    );
}