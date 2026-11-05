import MediaPicker from '@/components/MediaPicker';
import BadgeUI from '@/components/badge-ui';
import { toast } from '@/components/custom-toast';
import InputError from '@/components/input-error';
import { PageTemplate } from '@/components/page-template';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { router, usePage } from '@inertiajs/react';
import { FolderTree, GitFork, Image as ImageIcon, Layers, Save, SlidersHorizontal } from 'lucide-react';
import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function EditCategory() {
    const { t } = useTranslation();
    const { category, parentCategories = [], errors = {}, globalSettings } = usePage().props as any;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState(() => ({
        name: category?.name || '',
        description: category?.description || '',
        image: category?.image || '',
        parent_id: category?.parent_id ? String(category.parent_id) : 'none',
        sort_order: category?.sort_order ?? 0,
        is_active: category?.is_active !== undefined ? Boolean(category.is_active) : true,
    }));

    // Keep form data in sync if category changes
    useEffect(() => {
        if (category) {
            setFormData({
                name: category.name || '',
                description: category.description || '',
                image: category.image || '',
                parent_id: category.parent_id ? String(category.parent_id) : 'none',
                sort_order: category.sort_order ?? 0,
                is_active: category.is_active !== undefined ? Boolean(category.is_active) : true,
            });
        }
    }, [category?.id, category?.parent_id]);

    // Compute available parent categories safely
    const availableParents = useMemo(() => {
        const list = (parentCategories || []).filter((p: any) => Number(p.id) !== Number(category?.id));
        // If the category already has a parent that isn't in list (e.g. inactive parent), include it so select matches
        if (category?.parent && !list.some((p: any) => Number(p.id) === Number(category.parent_id))) {
            list.unshift(category.parent);
        }
        return list;
    }, [parentCategories, category]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSwitchChange = (checked: boolean) => {
        setFormData((prev) => ({ ...prev, is_active: checked }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (value: string) => {
        setFormData((prev) => ({ ...prev, image: value }));
    };

    const handleSubmit = (e?: FormEvent) => {
        if (e) e.preventDefault();
        if (isSubmitting) return;

        if (!formData.name.trim()) {
            toast.error(t('Please enter a category name'));
            return;
        }

        setIsSubmitting(true);
        if (!globalSettings?.is_demo) {
            toast.loading(t('Updating category...'));
        }

        router.put(route('categories.update', category.id), formData, {
            preserveScroll: true,
            onSuccess: (page: any) => {
                setIsSubmitting(false);
                if (!globalSettings?.is_demo) {
                    toast.dismiss();
                }
                if (page?.props?.flash?.success) {
                    toast.success(t(page.props.flash.success));
                } else if (page?.props?.flash?.error) {
                    toast.success(t(page?.props?.flash?.error));
                }
            },
            onError: (errs: any) => {
                setIsSubmitting(false);
                if (!globalSettings?.is_demo) {
                    toast.dismiss();
                }
                const firstErr = Object.values(errs)[0] as string;
                toast.error(t(firstErr || 'Failed to update category'));
            },
        });
    };

    const pageActions = [
        {
            label: isSubmitting ? t('Updating...') : t('Update Category'),
            icon: <Save className="h-4 w-4" />,
            variant: 'default' as const,
            disabled: isSubmitting,
            onClick: handleSubmit,
        },
    ];

    const isRootCategory = formData.parent_id === 'none';
    const selectedParentCategory = useMemo(() => {
        if (!formData.parent_id || formData.parent_id === 'none') return null;
        return availableParents.find((c: any) => String(c.id) === String(formData.parent_id)) || category?.parent;
    }, [availableParents, formData.parent_id, category]);

    return (
        <PageTemplate
            title={t('Edit Category')}
            description={t('Update category details, parent hierarchy, and storefront visibility.')}
            url="/categories/edit"
            backUrl={route('categories.index')}
            actions={pageActions}
            breadcrumbs={[
                { title: t('Dashboard'), href: route('dashboard') },
                { title: t('Product Management'), href: route('products.index') },
                { title: t('Categories'), href: route('categories.index') },
                { title: category?.name || t('Edit Category') },
            ]}
        >
            <form noValidate onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
                    {/* Main Content Column (Left) */}
                    <div className="space-y-6 lg:col-span-8">
                        {/* General Information Card */}
                        <Card className="border-border/80 border shadow-xs">
                            <CardHeader className="pb-3 sm:pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-lg">
                                            <FolderTree className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-semibold sm:text-lg">{t('Category Information')}</CardTitle>
                                            <CardDescription className="text-xs sm:text-sm">
                                                {t('Update category name, description and general properties')}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    {category?.slug && (
                                        <BadgeUI className="text-muted-foreground bg-muted/60 ring-border/50 hidden font-mono text-xs sm:inline-flex">
                                            /{category.slug}
                                        </BadgeUI>
                                    )}
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4 pt-1">
                                <div className="space-y-1.5">
                                    <Label htmlFor="name" required className="text-sm font-medium">
                                        {t('Category Name')}
                                    </Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder={t('Enter category name')}
                                        aria-invalid={!!errors.name}
                                        className="h-10 text-sm"
                                    />
                                    <InputError message={errors.name} />
                                    <p className="text-muted-foreground text-xs">
                                        {t('Changing the name will also regenerate the category slug if updated.')}
                                    </p>
                                </div>

                                <div className="space-y-1.5 pt-1">
                                    <Label htmlFor="description" className="text-sm font-medium">
                                        {t('Description')}
                                    </Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        rows={4}
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder={t('Category description')}
                                        aria-invalid={!!errors.description}
                                        className="resize-y text-sm"
                                    />
                                    <InputError message={errors.description} />
                                    <p className="text-muted-foreground text-xs">
                                        {t('Overview displayed on collection storefronts and category headers.')}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Media Card */}
                        <Card className="border-border/80 border shadow-xs">
                            <CardHeader className="pb-3 sm:pb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-lg">
                                        <ImageIcon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-semibold sm:text-lg">{t('Category Media')}</CardTitle>
                                        <CardDescription className="text-xs sm:text-sm">
                                            {t('Upload or replace category thumbnail or banner image')}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-3 pt-1">
                                <MediaPicker
                                    label={t('Category Image')}
                                    value={formData.image}
                                    onChange={handleImageChange}
                                    placeholder={t('Select category image...')}
                                />
                                <InputError message={errors.image} />
                                <p className="text-muted-foreground text-xs">
                                    {t('Recommended square or landscape aspect ratio (PNG, JPG, WebP) for crisp catalog display.')}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sticky Settings Sidebar (Right) */}
                    <div className="space-y-6 lg:sticky lg:top-6 lg:col-span-4">
                        {/* Hierarchy & Taxonomy Card */}
                        <Card className="border-border/80 border shadow-xs">
                            <CardHeader className="pb-3 sm:pb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-lg">
                                        <GitFork className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-semibold">{t('Hierarchy & Placement')}</CardTitle>
                                        <CardDescription className="text-xs">{t('Configure catalog structure')}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4 pt-1">
                                <div className="space-y-1.5">
                                    <Label htmlFor="parent_id" className="text-sm font-medium">
                                        {t('Parent Category')}
                                    </Label>
                                    <Select
                                        value={String(formData.parent_id || 'none')}
                                        onValueChange={(val) => handleSelectChange('parent_id', val)}
                                    >
                                        <SelectTrigger id="parent_id" className="h-10 text-sm" aria-invalid={!!errors.parent_id}>
                                            <SelectValue placeholder={t('Select parent category')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">
                                                <span className="text-foreground font-medium">{t('None (Root Category)')}</span>
                                            </SelectItem>
                                            {availableParents.map((pCat: any) => (
                                                <SelectItem key={pCat.id} value={String(pCat.id)}>
                                                    {pCat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.parent_id} />

                                    {/* Hierarchy indicator pill */}
                                    <div className="border-border/60 bg-muted/40 mt-2.5 rounded-lg border p-2.5">
                                        {isRootCategory ? (
                                            <div className="flex items-start gap-2">
                                                <Layers className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                                                <div>
                                                    <p className="text-foreground text-xs font-semibold">{t('Top-Level Root Category')}</p>
                                                    <p className="text-muted-foreground text-[11px]">
                                                        {t('Appears directly on the primary store navigation.')}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-start gap-2">
                                                <GitFork className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                                                <div>
                                                    <p className="text-foreground text-xs font-semibold">{t('Nested Subcategory')}</p>
                                                    <p className="text-muted-foreground text-[11px]">
                                                        {t('Belongs under')}{' '}
                                                        <span className="text-foreground font-medium">
                                                            {selectedParentCategory?.name || t('Parent Category')}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1.5 pt-1">
                                    <Label htmlFor="sort_order" className="text-sm font-medium">
                                        {t('Display Sort Order')}
                                    </Label>
                                    <Input
                                        id="sort_order"
                                        name="sort_order"
                                        type="number"
                                        value={formData.sort_order}
                                        onChange={handleChange}
                                        placeholder="0"
                                        aria-invalid={!!errors.sort_order}
                                        className="h-10 text-sm"
                                    />
                                    <InputError message={errors.sort_order} />
                                    <p className="text-muted-foreground text-xs">{t('Lower numbers appear earlier in catalog listings.')}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Visibility & Status Card */}
                        <Card className="border-border/80 border shadow-xs">
                            <CardHeader className="pb-3 sm:pb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-lg">
                                        <SlidersHorizontal className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-semibold">{t('Visibility & Publishing')}</CardTitle>
                                        <CardDescription className="text-xs">{t('Storefront availability')}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4 pt-1">
                                <div className="border-border/60 bg-muted/30 flex items-center justify-between gap-3 rounded-lg border p-3">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor="edit-category-status-switch" className="cursor-pointer text-sm font-medium">
                                                {t('Category Status')}
                                            </Label>
                                            <BadgeUI
                                                className={
                                                    formData.is_active
                                                        ? 'bg-emerald-50 text-xs font-medium text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400'
                                                        : 'bg-red-50 text-xs font-medium text-red-700 ring-red-600/10 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20'
                                                }
                                            >
                                                {formData.is_active ? t('Active') : t('Inactive')}
                                            </BadgeUI>
                                        </div>
                                        <p className="text-muted-foreground text-xs">
                                            {formData.is_active
                                                ? t('Visible to shoppers and active in catalog')
                                                : t('Hidden from storefront browsing')}
                                        </p>
                                    </div>
                                    <Switch id="edit-category-status-switch" checked={formData.is_active} onCheckedChange={handleSwitchChange} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </PageTemplate>
    );
}