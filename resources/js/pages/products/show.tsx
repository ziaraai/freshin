import React, { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import {
  Package,
  DollarSign,
  ShoppingCart,
  Layers,
  FileText,
  Calendar,
  Download,
  Image as ImageIcon,
  Edit,
  Tag,
  Receipt,
  Percent,
  FolderTree,
  List,
  Info,
  CheckCircle2,
  XCircle,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import { getImageUrl } from '@/utils/image-helper';
import { formatCurrency } from '@/utils/currency-helper';
import { hasPermission } from '@/utils/permissions';
import RandomBadgeUI from '@/components/random-badge-ui';
import BadgeUI from '@/components/badge-ui';

export default function ShowProduct() {
  const { t } = useTranslation();
  const { product, stats = {} } = usePage().props as any;

  // Parse all product images cleanly
  const rawImages: string[] = product?.images
    ? (Array.isArray(product.images)
        ? product.images
        : String(product.images).split(','))
        .map((img: string) => img.trim())
        .filter(Boolean)
    : [];

  const allImages: string[] = [];
  if (product?.cover_image && String(product.cover_image).trim()) {
    allImages.push(String(product.cover_image).trim());
  }
  rawImages.forEach((img) => {
    if (img && !allImages.includes(img)) {
      allImages.push(img);
    }
  });

  const [selectedImage, setSelectedImage] = useState<string>(
    allImages[0] || product?.cover_image || ''
  );

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    if (typeof window !== 'undefined' && window.appSettings?.formatDateTime) {
      return window.appSettings.formatDateTime(dateString, false);
    }
    return new Date(dateString).toLocaleDateString();
  };

  // Calculate discount percentage if sale price is set
  const regularPrice = Number(product?.price || 0);
  const salePrice = product?.sale_price ? Number(product.sale_price) : null;
  const discountPercent =
    regularPrice > 0 && salePrice !== null && regularPrice > salePrice
      ? Math.round(((regularPrice - salePrice) / regularPrice) * 100)
      : null;

  // Determine available content tabs
  const hasDescription = Boolean(product?.description);
  const hasSpecifications = Boolean(product?.specifications);
  const hasDetails = Boolean(product?.details);

  const defaultContentTab = hasDescription
    ? 'description'
    : hasSpecifications
    ? 'specifications'
    : hasDetails
    ? 'details'
    : 'description';

  const pageActions = [
    // ...(hasPermission('edit-products')
    //   ? [
    //       {
    //         label: t('Edit Product'),
    //         icon: <Edit className="h-4 w-4" />,
    //         variant: 'default' as const,
    //         onClick: () => router.visit(route('products.edit', product?.id)),
    //       },
    //     ]
    //   : []),
  ];

  return (
    <PageTemplate
      title={t('Product Details')}
      description={t('Comprehensive overview, image showcase, and inventory details')}
      url="/products/show"
      actions={[]} // Explicitly no edit action
      backUrl={route('products.index')}
      breadcrumbs={[
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Product Management'), href: route('products.index') },
        { title: t('Products'), href: route('products.index') },
        {
          title: product?.name
            ? product.name.length > 35
              ? product.name.substring(0, 35) + '...'
              : product.name
            : t('Product Details'),
        },
      ]}
    >
      <div className="space-y-6 pb-8">
        {/* 1. TOP KPI METRIC CARDS */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Total Revenue */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-xs transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-emerald-50 dark:bg-emerald-950/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Total Revenue')}</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl font-mono">{formatCurrency(stats?.revenue || 0)}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{t('Total earnings from product')}</span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-emerald-100 p-2.5 dark:bg-emerald-900/40 sm:p-3">
                <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400 sm:h-7 sm:w-7" />
              </div>
            </div>
          </div>

          {/* Card 2: Units Sold */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-xs transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-blue-50 dark:bg-blue-900/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Units Sold')}</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl">{(stats?.total_sold || 0).toLocaleString()}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{t('Total quantity ordered')}</span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-blue-100 p-2.5 dark:bg-blue-900/40 sm:p-3">
                <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400 sm:h-7 sm:w-7" />
              </div>
            </div>
          </div>

          {/* Card 3: Orders Placed */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-xs transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-purple-50 dark:bg-purple-950/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Orders Placed')}</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl">{(stats?.total_orders || 0).toLocaleString()}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-purple-600 dark:text-purple-400">{t('Customer order count')}</span>
                </div>
              </div>
              <div className="relative z-10 rounded-xl bg-purple-100 p-2.5 dark:bg-purple-900/40 sm:p-3">
                <Receipt className="h-6 w-6 text-purple-600 dark:text-purple-400 sm:h-7 sm:w-7" />
              </div>
            </div>
          </div>

          {/* Card 4: Stock Inventory */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-xs transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-amber-50 dark:bg-amber-950/20 rtl:right-auto rtl:left-0 rtl:rounded-br-full rtl:rounded-bl-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('Stock Inventory')}</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl">
                  {t('{{stock}} units', { stock: product?.stock ?? 0 })}
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className={`text-xs font-medium ${
                    (product?.stock ?? 0) <= 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : (product?.stock ?? 0) < 5
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {(product?.stock ?? 0) <= 0
                      ? t('Out of stock')
                      : (product?.stock ?? 0) < 5
                      ? t('Low stock warning')
                      : t('Adequate stock available')}
                  </span>
                </div>
              </div>
              <div className={`relative z-10 rounded-xl p-2.5 sm:p-3 ${
                (product?.stock ?? 0) <= 0
                  ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400'
                  : (product?.stock ?? 0) <= 5
                  ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
                  : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
              }`}>
                <Layers className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
            </div>
          </div>
        </div>

        {/* 2. MAIN 2-COLUMN SHOWCASE LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Visual Showcase Gallery, Content & Variants */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6 min-w-0">
            {/* Interactive Image Gallery Showcase Card */}
            <Card className="border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden">
              <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground break-words" title={product?.name}>
                      {product?.name}
                    </CardTitle>

                    {/* Meta Badges Row */}
                    <div className="flex flex-wrap items-center gap-2 mt-2.5">
                      {product?.sku && (
                        <BadgeUI className="font-mono bg-zinc-100 text-zinc-700 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-300">
                          {t('SKU: {{sku}}', { sku: product.sku })}
                        </BadgeUI>
                      )}

                      <BadgeUI
                        className={
                          product?.is_active
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 font-medium text-xs'
                            : 'bg-zinc-100 text-zinc-700 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-300 font-medium text-xs'
                        }
                      >
                        {product?.is_active ? t('Active') : t('Inactive')}
                      </BadgeUI>

                      {/* Stock Status Badge */}
                      {product?.stock <= 0 ? (
                        <BadgeUI className="bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-950/30 dark:text-rose-400 font-medium text-xs">
                          {t('Out of Stock')}
                        </BadgeUI>
                      ) : product?.stock < 10 ? (
                        <BadgeUI className="bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/30 dark:text-amber-400 font-medium text-xs">
                          {t('Low Stock')}
                        </BadgeUI>
                      ) : (
                        <BadgeUI className="bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 font-medium text-xs">
                          {t('In Stock')}
                        </BadgeUI>
                      )}

                      {/* Discount Percentage Badge */}
                      {discountPercent && (
                        <BadgeUI className="bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/15 dark:text-rose-400 font-medium text-xs">
                          {t('Save {{percent}}%', { percent: discountPercent })}
                        </BadgeUI>
                      )}

                      {product?.category?.name && (
                        <RandomBadgeUI
                          name={product.category.name}
                          icon={<Tag className="h-3 w-3 shrink-0" />}
                        />
                      )}
                    </div>
                  </div>

                  {allImages.length > 1 && (
                    <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-white dark:bg-zinc-900 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-2xs shrink-0 self-start sm:self-auto">
                      <ImageIcon className="h-3.5 w-3.5" />
                      <span>{t('{{count}} Images', { count: allImages.length })}</span>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 space-y-4">
                {/* Main Hero Showcase Window (Clean window without floating overlay badges) */}
                <div className="relative w-full aspect-square sm:aspect-[4/3] max-h-[460px] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/10 flex items-center justify-center group">
                  {selectedImage ? (
                    <img
                      src={getImageUrl(selectedImage)}
                      alt={product?.name || 'Product'}
                      className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                      onClick={() => {
                        window.open(getImageUrl(selectedImage), '_blank');
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const defaultFallback = getImageUrl('/storage/media/product/product.png');
                        if (target.src !== defaultFallback) {
                          target.src = defaultFallback;
                        }
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                      <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                        <Package className="h-8 w-8 opacity-60" />
                      </div>
                      <p className="text-sm font-medium">{t('No product image available')}</p>
                    </div>
                  )}
                </div>

                {/* Multiple Images Thumbnail Gallery Strip */}
                {allImages.length > 1 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-semibold tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5" />
                      {t('Product Image Gallery')}
                    </p>
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
                      {allImages.map((image: string, index: number) => {
                        const isSelected = selectedImage === image;
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setSelectedImage(image)}
                            className={`relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all p-1 bg-white dark:bg-zinc-900 cursor-pointer focus:outline-none ${
                              isSelected
                                ? 'border-primary ring-2 ring-primary/30 shadow-xs scale-102'
                                : 'border-zinc-200 dark:border-zinc-800 hover:border-primary/50 opacity-80 hover:opacity-100'
                            }`}
                            title={t('View image {{number}}', { number: index + 1 })}
                          >
                            <img
                              src={getImageUrl(image)}
                              alt={t('Thumbnail {{number}}', { number: index + 1 })}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                const defaultFallback = getImageUrl('/storage/media/product/product.png');
                                if (target.src !== defaultFallback) {
                                  target.src = defaultFallback;
                                }
                              }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Product Content & Details (Enhanced presentation with clean tabs and rich styled container) */}
            <Card className="border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden">
              <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  {t('Product Content & Details')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <Tabs defaultValue={defaultContentTab} className="w-full space-y-4">
                  {/* Segmented responsive tabs list */}
                  <TabsList className="w-full grid grid-cols-3 max-w-lg mx-auto h-10 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl">
                    <TabsTrigger
                      value="description"
                      className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>{t('Description')}</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="specifications"
                      className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs"
                    >
                      <List className="h-3.5 w-3.5" />
                      <span>{t('Specifications')}</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="details"
                      className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs"
                    >
                      <Info className="h-3.5 w-3.5" />
                      <span>{t('Additional Details')}</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Styled content panel container */}
                  <div className="bg-zinc-50/50 dark:bg-zinc-800/30 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-5 sm:p-6 min-h-[160px]">
                    <TabsContent value="description" className="mt-0 focus-visible:outline-none">
                      {product?.description ? (
                        <div
                          className="prose prose-sm sm:prose max-w-none text-muted-foreground dark:text-zinc-300 dark:prose-invert leading-relaxed [&_ul]:list-disc [&_ul]:ps-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:ps-6 [&_ol]:my-2 [&_li]:my-1 [&_blockquote]:border-s-4 [&_blockquote]:border-primary/60 [&_blockquote]:ps-4 [&_blockquote]:italic [&_p]:my-2"
                          dangerouslySetInnerHTML={{ __html: product.description }}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground italic py-6 text-center">
                          {t('No description provided for this product.')}
                        </p>
                      )}
                    </TabsContent>

                    <TabsContent value="specifications" className="mt-0 focus-visible:outline-none">
                      {product?.specifications ? (
                        <div
                          className="prose prose-sm sm:prose max-w-none text-muted-foreground dark:text-zinc-300 dark:prose-invert leading-relaxed [&_ul]:list-disc [&_ul]:ps-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:ps-6 [&_ol]:my-2 [&_li]:my-1 [&_blockquote]:border-s-4 [&_blockquote]:border-primary/60 [&_blockquote]:ps-4 [&_blockquote]:italic [&_p]:my-2"
                          dangerouslySetInnerHTML={{ __html: product.specifications }}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground italic py-6 text-center">
                          {t('No specifications provided for this product.')}
                        </p>
                      )}
                    </TabsContent>

                    <TabsContent value="details" className="mt-0 focus-visible:outline-none">
                      {product?.details ? (
                        <div
                          className="prose prose-sm sm:prose max-w-none text-muted-foreground dark:text-zinc-300 dark:prose-invert leading-relaxed [&_ul]:list-disc [&_ul]:ps-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:ps-6 [&_ol]:my-2 [&_li]:my-1 [&_blockquote]:border-s-4 [&_blockquote]:border-primary/60 [&_blockquote]:ps-4 [&_blockquote]:italic [&_p]:my-2"
                          dangerouslySetInnerHTML={{ __html: product.details }}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground italic py-6 text-center">
                          {t('No additional details provided for this product.')}
                        </p>
                      )}
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>

            {/* Product Variants & Pricing Matrix */}
            {product?.variants && Array.isArray(product.variants) && product.variants.length > 0 && (
              <Card className="border border-zinc-200 dark:border-zinc-800 shadow-xs">
                <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    {t('Product Variants')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="space-y-3">
                    {product.variants.map((v: any, idx: number) => {
                      const vals: string[] = Array.isArray(v.values)
                        ? v.values
                        : Array.isArray(v.options)
                        ? v.options
                        : [];
                      return (
                        <div key={idx} className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-muted-foreground w-28">
                            {v.name}:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {vals.map((val: string, vi: number) => (
                              <BadgeUI
                                key={vi}
                                className="bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 text-xs px-2.5 py-0.5"
                              >
                                {val}
                              </BadgeUI>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Variant Pricing Matrix */}
                  {product?.variant_options && Array.isArray(product.variant_options) && product.variant_options.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2 mb-2.5">
                        <SlidersHorizontal className="h-4 w-4 text-primary" />
                        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                          {t('Variant Pricing Breakdown')}
                        </h4>
                      </div>
                      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                        <table className="w-full text-xs text-start">
                          <thead className="bg-zinc-50 dark:bg-zinc-800/60 font-semibold text-muted-foreground uppercase border-b border-zinc-200 dark:border-zinc-800">
                            <tr>
                              <th className="px-3.5 py-2.5">{t('Variant')}</th>
                              <th className="px-3.5 py-2.5">{t('Price')}</th>
                              <th className="px-3.5 py-2.5">{t('Sale Price')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                            {product.variant_options.map((opt: any, index: number) => (
                              <tr key={index} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                                <td className="px-3.5 py-2 font-medium text-foreground">
                                  {opt.name || opt.variant}
                                </td>
                                <td className="px-3.5 py-2 font-semibold font-mono">
                                  {formatCurrency(opt.price || 0)}
                                </td>
                                <td className="px-3.5 py-2">
                                  {opt.sale_price ? (
                                    <span className="text-primary font-semibold font-mono">
                                      {formatCurrency(opt.sale_price)}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Sticky Pricing, Inventory & Metadata */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-6 self-start">
            {/* Card 1: Pricing & Stock Card */}
            <Card className="border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden">
              <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 pb-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  {t('Pricing & Inventory')}
                </CardTitle>
              </CardHeader>
              <CardContent className="!p-5 space-y-5">
                {/* Price Display */}
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/20 p-4 space-y-2">
                  <span className="text-xs font-semibold tracking-wider text-muted-foreground">
                    {t('Current Price')}
                  </span>
                  <div className="flex flex-wrap items-baseline gap-2.5">
                    <span className="text-3xl font-extrabold text-primary font-mono">
                      {formatCurrency(product?.sale_price || product?.price || 0)}
                    </span>
                    {product?.sale_price && product?.price && (
                      <span className="text-base text-muted-foreground line-through font-mono">
                        {formatCurrency(product.price)}
                      </span>
                    )}
                  </div>
                  {discountPercent && (
                    <div className="pt-1">
                      <BadgeUI className="bg-primary/10 text-primary ring-primary/20 gap-1 font-medium text-xs">
                        <Percent className="h-3 w-3" />
                        {t('Save {{percent}}% off regular price', { percent: discountPercent })}
                      </BadgeUI>
                    </div>
                  )}
                </div>

                {/* Stock Level Details */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-medium">{t('Stock Status')}</span>
                    {product?.stock <= 0 ? (
                      <BadgeUI className="bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-950/30 dark:text-rose-400 font-medium text-xs">
                        {t('Out of Stock')}
                      </BadgeUI>
                    ) : product?.stock < 10 ? (
                      <BadgeUI className="bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/30 dark:text-amber-400 font-medium text-xs">
                        {t('Low Stock')}
                      </BadgeUI>
                    ) : (
                      <BadgeUI className="bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 font-medium text-xs">
                        {t('In Stock')}
                      </BadgeUI>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-medium">{t('Available Quantity')}</span>
                    <span className="font-semibold text-foreground">
                      {t('{{stock}} units', { stock: product?.stock ?? 0 })}
                    </span>
                  </div>

                  {/* Stock Progress Bar */}
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        (product?.stock ?? 0) <= 0
                          ? 'bg-rose-500 w-0'
                          : (product?.stock ?? 0) < 10
                          ? 'bg-amber-500 w-1/4'
                          : 'bg-primary w-full'
                      }`}
                    />
                  </div>
                </div>

                {/* {hasPermission('edit-products') && (
                  <Button
                    type="button"
                    className="w-full mt-2 cursor-pointer"
                    onClick={() => router.visit(route('products.edit', product?.id))}
                  >
                    <Edit className="h-4 w-4 me-2" />
                    {t('Edit Product Details')}
                  </Button>
                )} */}
              </CardContent>
            </Card>

            {/* Card 2: Product Organization & Metadata Card */}
            <Card className="border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 pb-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FolderTree className="h-4 w-4 text-primary" />
                  {t('Product Details & Meta')}
                </CardTitle>
              </CardHeader>
              <CardContent className="!p-5 space-y-4">
                {/* Category */}
                <div className="flex items-center justify-between py-1 border-b border-dashed border-zinc-200 dark:border-zinc-800 pb-3 text-sm">
                  <span className="text-muted-foreground font-medium flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    {t('Category')}
                  </span>
                  <span>
                    {product?.category?.name ? (
                      <RandomBadgeUI
                        name={product.category.name}
                        icon={<Tag className="h-3 w-3 shrink-0" />}
                      />
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </span>
                </div>

                {/* Tax */}
                <div className="flex items-center justify-between py-1 border-b border-dashed border-zinc-200 dark:border-zinc-800 pb-3 text-sm">
                  <span className="text-muted-foreground font-medium flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    {t('Product Tax')}
                  </span>
                  <span className="font-medium text-foreground">
                    {product?.tax?.name ? `${product.tax.name} (${product.tax.rate}%)` : (product?.tax?.name || '-')}
                  </span>
                </div>

                {/* Display Status */}
                <div className="flex items-center justify-between py-1 border-b border-dashed border-zinc-200 dark:border-zinc-800 pb-3 text-sm">
                  <span className="text-muted-foreground font-medium flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    {t('Display Status')}
                  </span>
                  <BadgeUI
                    className={
                      product?.is_active
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 font-medium text-xs'
                        : 'bg-zinc-100 text-zinc-700 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-300 font-medium text-xs'
                    }
                  >
                    {product?.is_active ? t('Active') : t('Inactive')}
                  </BadgeUI>
                </div>

                {/* Downloadable / Digital */}
                <div className="flex items-center justify-between py-1 border-b border-dashed border-zinc-200 dark:border-zinc-800 pb-3 text-sm">
                  <span className="text-muted-foreground font-medium flex items-center gap-2">
                    <Download className="h-4 w-4 text-muted-foreground" />
                    {t('Downloadable')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {product?.is_downloadable ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                        <CheckCircle2 className="h-4 w-4" />
                        {t('Yes')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
                        <XCircle className="h-4 w-4" />
                        {t('No')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Downloadable file details if applicable */}
                {product?.is_downloadable && product?.downloadable_file && (
                  <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground tracking-wider block">
                      {t('Attached Digital File')}
                    </span>
                    <a
                      href={product.downloadable_file}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-xs text-primary hover:underline font-mono truncate"
                    >
                      <Download className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{product.downloadable_file.split('/').pop()}</span>
                    </a>
                  </div>
                )}

                {/* Created & Updated Timestamps */}
                <div className="pt-2 space-y-2 text-xs text-muted-foreground">
                  {product?.created_at && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {t('Created')}
                      </span>
                      <span>{formatDate(product.created_at)}</span>
                    </div>
                  )}

                  {product?.updated_at && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {t('Last Updated')}
                      </span>
                      <span>{formatDate(product.updated_at)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Custom Fields Card (if custom fields exist) */}
            {product?.custom_fields && Array.isArray(product.custom_fields) && product.custom_fields.length > 0 && (
              <Card className="border border-zinc-200 dark:border-zinc-800 shadow-xs">
                <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 pb-4">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    {t('Custom Fields & Attributes')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="!p-5 space-y-2.5">
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    {product.custom_fields.map((field: any, index: number) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 text-xs gap-1 sm:gap-4 odd:bg-zinc-50/40 even:bg-white dark:odd:bg-zinc-800/20 dark:even:bg-zinc-900"
                      >
                        <span className="font-semibold text-foreground">{field.name}</span>
                        <span className="text-muted-foreground font-mono sm:text-end">
                          {field.value || '-'}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}
