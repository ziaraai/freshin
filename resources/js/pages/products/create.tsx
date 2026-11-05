import React, { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Save, 
  Plus, 
  Trash2, 
  Package, 
  DollarSign, 
  FileText, 
  Layers, 
  SlidersHorizontal, 
  FileDown, 
  X,
  Image as ImageIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import MediaPicker from '@/components/MediaPicker';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import InputError from '@/components/input-error';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/components/custom-toast';
import { useLayout } from '@/contexts/LayoutContext';

export default function CreateProduct() {
  const { t } = useTranslation();
  const { categories, taxes, errors = {} } = usePage().props as any;

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    specifications: '',
    details: '',
    price: '',
    sale_price: '',
    stock: 0,
    cover_image: '',
    images: '',
    category_id: '',
    tax_id: '',
    is_active: true,
    is_downloadable: false,
    downloadable_file: '',
  });

  const [customFields, setCustomFields] = useState([{ name: '', value: '' }]);
  const [variants, setVariants] = useState([{ name: '', values: [''] }]);
  const {position} = useLayout();
  

  const [currentStep, setCurrentStep] = useState(0);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const combinedErrors = { ...errors, ...localErrors };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value
    }));

    if (localErrors[name]) {
      setLocalErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (localErrors[name]) {
      setLocalErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!formData.name?.trim()) e.name = t('Product name is required');
      if (!formData.sku?.trim()) e.sku = t('SKU is required');
      if (!formData.category_id) e.category_id = t('Category is required');
      if (!formData.cover_image) e.cover_image = t('Cover image is required');
    }
    if (s === 1) {
      if (formData.price === '' || formData.price === null || formData.price === undefined || Number(formData.price) < 0) {
        e.price = t('Valid price is required');
      }
      if (formData.sale_price === '' || formData.sale_price === null || formData.sale_price === undefined || Number(formData.sale_price) < 0) {
        e.sale_price = t('Valid sale price is required');
      }
      if (formData.stock === '' || formData.stock === null || formData.stock === undefined || Number(formData.stock) < 0) {
        e.stock = t('Valid stock quantity is required');
      }
      if (formData.is_downloadable && !formData.downloadable_file) {
        e.downloadable_file = t('Downloadable file is required for digital products');
      }
    }
    setLocalErrors(e);
    return Object.keys(e).length === 0;
  };

  const STEP_FIELDS: Record<number, string[]> = {
    0: ['name', 'sku', 'category_id', 'cover_image', 'images'],
    1: ['price', 'sale_price', 'stock', 'downloadable_file'],
    2: ['description', 'specifications', 'details'],
    3: ['variants', 'custom_fields'],
  };

  const stepHasError = (i: number) => {
    const fields = STEP_FIELDS[i] || [];
    return fields.some(f => combinedErrors[f]);
  };

  const STEPS = [
    { key: 'general', label: t('General & Media') },
    { key: 'pricing', label: t('Pricing & Stock') },
    { key: 'content', label: t('Product Content') },
    { key: 'variants', label: t('Variants & Custom Fields') },
  ];

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!validateStep(currentStep)) return;
    if (!validateStep(0)) {
      setCurrentStep(0);
      return;
    }
    if (!validateStep(1)) {
      setCurrentStep(1);
      return;
    }

    const productData = {
      ...formData,
      variants: variants.filter((v: any) => v.name.trim() !== ''),
      custom_fields: customFields.filter((f: any) => f.name.trim() !== '')
    };

    router.post(route('products.store'), productData,{
      preserveScroll: true,
      onSuccess: (page: any) => {
        toast.dismiss();
        if (page?.props?.flash?.success) {
          toast.success(t(page.props.flash.success));
        } else if (page?.props?.flash?.error) {
          toast.error(t(page.props.flash.error));
        } else {
          toast.success(t('Product created successfully!'));
        }
      },
    });
  };

  const pageActions = [
    // {
    //   label: t('Save Product'),
    //   icon: <Save className="h-4 w-4" />,
    //   variant: 'default' as const,
    //   onClick: handleSubmit
    // }
  ];

  return (
    <PageTemplate
      title={t('Create Product')}
      url="/products/create"
      actions={pageActions}
      backUrl={route('products.index')}
      breadcrumbs={[
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Product Management'), href: route('products.index') },
        { title: t('Products'), href: route('products.index') },
        { title: t('Create Product') }
      ]}
      description={t('Create a new product and fill in the required details.')}
    >
      <div className="space-y-6">
        {/* Step Indicator Header */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center w-full overflow-x-auto pb-1 sm:pb-0">
            {STEPS.map((s, i) => {
              const done = i < currentStep;
              const active = i === currentStep;
              const hasErr = stepHasError(i);
              return (
                <div key={s.key} className="flex items-center flex-1 last:flex-none">
                  <button
                    type="button"
                    onClick={() => {
                      if (i < currentStep || validateStep(currentStep)) {
                        setCurrentStep(i);
                      }
                    }}
                    className="flex items-center gap-2 shrink-0 cursor-pointer text-left focus:outline-none"
                  >
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                      hasErr ? 'bg-red-50 border-red-500 text-red-600 dark:bg-red-950/40' :
                      done   ? 'bg-primary border-primary text-white' :
                      active ? 'border-primary text-primary bg-white dark:bg-zinc-900' :
                               'border-zinc-300 dark:border-zinc-600 text-zinc-400 bg-white dark:bg-zinc-900'
                    }`}>
                      {done && !hasErr ? <Check className="h-4 w-4" /> : i + 1}
                    </div>
                    <span className={`text-xs sm:text-sm font-medium whitespace-nowrap ${
                      hasErr ? 'text-red-600' :
                      active ? 'text-primary font-semibold' :
                      done   ? 'text-zinc-700 dark:text-zinc-300' :
                               'text-zinc-400 dark:text-zinc-500'
                    }`}>{s.label}</span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-px mx-3 min-w-[20px] transition-colors ${done && !hasErr ? 'bg-primary' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stepper Form Content */}
        <form noValidate onSubmit={handleSubmit} className="space-y-6">

          {/* STEP 0: GENERAL & MEDIA */}
          {currentStep === 0 && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              {/* Basic Information Card */}
              <Card className="shadow-xs border-zinc-200/80 dark:border-zinc-800">
                <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">{t('Product Information')}</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        {t('Core identification, category, and display settings')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="!pt-5 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="grid gap-1.5">
                      <Label htmlFor="name" required>{t('Product Name')}</Label>
                      <Input 
                        id="name" 
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder={t('Enter product name')} 
                        aria-invalid={!!combinedErrors.name}
                        className={combinedErrors.name ? 'border-red-500' : ''}
                      />
                      <InputError message={combinedErrors.name} />
                    </div>

                    <div className="grid gap-1.5">
                      <Label htmlFor="sku" required>{t('SKU')}</Label>
                      <Input 
                        id="sku" 
                        name="sku"
                        value={formData.sku}
                        onChange={handleChange}
                        placeholder={t('Product SKU')}
                        aria-invalid={!!combinedErrors.sku}
                        className={combinedErrors.sku ? 'border-red-500' : ''}
                      />
                      <InputError message={combinedErrors.sku} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="grid gap-1.5">
                      <Label htmlFor="category_id" required>{t('Category')}</Label>
                      <Select 
                        value={formData.category_id} 
                        onValueChange={(value) => handleSelectChange('category_id', value)}
                        dir={position === 'right' ? 'rtl' : 'ltr'}
                      >
                        <SelectTrigger aria-invalid={!!combinedErrors.category_id} className={combinedErrors.category_id ? 'border-red-500' : ''}>
                          <SelectValue placeholder={t('Select category')} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories?.map((category: any) => (
                            <SelectItem key={category.id} value={String(category.id)}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <InputError message={combinedErrors.category_id} />
                    </div>

                    <div className="grid gap-1.5">
                      <Label htmlFor="tax_id">{t('Product Tax')}</Label>
                      <Select 
                        value={formData.tax_id} 
                        onValueChange={(value) => handleSelectChange('tax_id', value)}
                        dir={position === 'right' ? 'rtl' : 'ltr'}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('Select tax class (optional)')} />
                        </SelectTrigger>
                        <SelectContent>
                          {taxes?.map((tax: any) => (
                            <SelectItem key={tax.id} value={String(tax.id)}>
                              {tax.name} ({tax.rate}%)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">{t('Product Display')}</Label>
                      <p className="text-xs text-muted-foreground">{t('Show product on your storefront')}</p>
                    </div>
                    <Switch 
                      checked={formData.is_active}
                      onCheckedChange={(checked) => handleSwitchChange('is_active', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Media Picker Card */}
              <Card className="shadow-xs border-zinc-200/80 dark:border-zinc-800">
                <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">{t('Product Images')}</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        {t('Primary cover thumbnail and storefront gallery pictures')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="!pt-5 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <MediaPicker
                        label={t('Cover Image')}
                        value={formData.cover_image}
                        onChange={(value) => handleSelectChange('cover_image', value)}
                        placeholder={t('Select cover image...')}
                        required={true}
                      />
                      <InputError message={combinedErrors.cover_image} />
                    </div>

                    <div className="space-y-1.5">
                      <MediaPicker
                        label={t('Product Gallery Images')}
                        value={formData.images}
                        onChange={(value) => handleSelectChange('images', value)}
                        multiple={true}
                        placeholder={t('Select product images...')}
                      />
                      <InputError message={combinedErrors.images} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* STEP 1: PRICING & STOCK */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <Card className="shadow-xs border-zinc-200/80 dark:border-zinc-800">
                <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">{t('Pricing & Stock')}</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        {t('Manage pricing, sale discounts, stock quantity, and digital download files')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="!pt-5 space-y-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="grid gap-1.5">
                      <Label htmlFor="price" required>{t('Price')}</Label>
                      <Input 
                        id="price" 
                        name="price"
                        type="number" 
                        step="0.01" 
                        min="0"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="0.00" 
                        aria-invalid={!!combinedErrors.price}
                        className={combinedErrors.price ? 'border-red-500' : ''}
                      />
                      <InputError message={combinedErrors.price} />
                    </div>

                    <div className="grid gap-1.5">
                      <Label htmlFor="sale_price" required>{t('Sale Price')}</Label>
                      <Input 
                        id="sale_price" 
                        name="sale_price"
                        type="number" 
                        step="0.01" 
                        min="0"
                        value={formData.sale_price}
                        onChange={handleChange}
                        placeholder="0.00" 
                        aria-invalid={!!combinedErrors.sale_price}
                      />
                      <InputError message={combinedErrors.sale_price} />
                    </div>

                    <div className="grid gap-1.5">
                      <Label htmlFor="stock" required>{t('Stock Quantity')}</Label>
                      <Input 
                        id="stock" 
                        name="stock"
                        type="number" 
                        min="0"
                        value={formData.stock}
                        onChange={handleChange}
                        placeholder="0" 
                        aria-invalid={!!combinedErrors.stock}
                        className={combinedErrors.stock ? 'border-red-500' : ''}
                      />
                      <InputError message={combinedErrors.stock} />
                    </div>
                  </div>

                  {/* Downloadable / Digital Delivery */}
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                      <div>
                        <Label className="text-sm font-medium cursor-pointer">{t('Downloadable Product')}</Label>
                        <p className="text-xs text-muted-foreground">{t('Is this a digital product delivered upon checkout?')}</p>
                      </div>
                      <Switch 
                        checked={formData.is_downloadable}
                        onCheckedChange={(checked) => handleSwitchChange('is_downloadable', checked)}
                      />
                    </div>

                    {formData.is_downloadable && (
                      <div className="p-3.5 rounded-lg border border-blue-200/80 bg-blue-50/40 dark:border-blue-900/40 dark:bg-blue-950/20 space-y-2 animate-in fade-in-50">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
                          <FileDown className="h-4 w-4" />
                          <span>{t('Digital Delivery File')}</span>
                        </div>
                        <MediaPicker
                          label={t('Downloadable File')}
                          value={formData.downloadable_file}
                          onChange={(value) => handleSelectChange('downloadable_file', value)}
                          placeholder={t('Select downloadable file...')}
                          required={formData.is_downloadable}
                        />
                        <InputError message={combinedErrors.downloadable_file} />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* STEP 2: PRODUCT CONTENT (Separate Input Boxes) */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <Card className="shadow-xs border-zinc-200/80 dark:border-zinc-800">
                <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">{t('Product Content')}</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        {t('Provide comprehensive product descriptions, specifications, and extra details')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="!pt-5 space-y-6">
                  {/* Product Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-xs font-semibold">{t('Product Description')}</Label>
                    <RichTextEditor
                      value={formData.description}
                      onChange={(value) => handleSelectChange('description', value)}
                      placeholder={t('Enter product description...')}
                    />
                    <InputError message={combinedErrors.description} />
                  </div>

                  {/* Product Specifications */}
                  <div className="space-y-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <Label htmlFor="specifications" className="text-xs font-semibold">{t('Product Specifications')}</Label>
                    <RichTextEditor
                      value={formData.specifications}
                      onChange={(value) => handleSelectChange('specifications', value)}
                      placeholder={t('Enter technical specifications, dimensions, materials...')}
                    />
                    <InputError message={combinedErrors.specifications} />
                  </div>

                  {/* Additional Product Details */}
                  <div className="space-y-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <Label htmlFor="details" className="text-xs font-semibold">{t('Additional Product Details')}</Label>
                    <RichTextEditor
                      value={formData.details}
                      onChange={(value) => handleSelectChange('details', value)}
                      placeholder={t('Enter additional product details, shipping information, warranty...')}
                    />
                    <InputError message={combinedErrors.details} />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* STEP 3: VARIANTS & CUSTOM FIELDS */}
          {currentStep === 3 && (
            <TooltipProvider delayDuration={150}>
              <div className="space-y-6 animate-in fade-in-50 duration-200">
                {/* Variants Card */}
                <Card className="shadow-xs border-zinc-200/80 dark:border-zinc-800">
                  <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                          <Layers className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold">{t('Product Variants')}</CardTitle>
                          <CardDescription className="text-xs text-muted-foreground">
                            {t('Add options like Color, Size, or Style with values')}
                          </CardDescription>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs cursor-pointer"
                        onClick={() => setVariants([...variants, { name: '', values: [''] }])}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        {t('Add Variant')}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="!pt-5 space-y-4">
                    {variants.map((variant: any, index: number) => (
                      <div key={index} className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 sm:p-4 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/40">
                        <div className="flex items-center justify-between gap-2">
                          <Input
                            placeholder={t('Variant name (e.g., Color, Size)')}
                            value={variant.name}
                            onChange={(e) => {
                              const newVariants = [...variants];
                              newVariants[index].name = e.target.value;
                              setVariants(newVariants);
                            }}
                            className="bg-white dark:bg-zinc-900 h-9"
                          />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0 cursor-pointer transition-colors"
                                onClick={() => setVariants(variants.filter((_: any, i: number) => i !== index))}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t('Remove')}</TooltipContent>
                          </Tooltip>
                        </div>

                        <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                          <div className="flex flex-wrap items-center gap-2">
                            {variant.values.map((value: string, valueIndex: number) => (
                              <div key={valueIndex} className="flex items-center gap-1 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 px-2 py-0.5">
                                <Input
                                  placeholder={t('Variant value')}
                                  value={value}
                                  onChange={(e) => {
                                    const newVariants = [...variants];
                                    newVariants[index].values[valueIndex] = e.target.value;
                                    setVariants(newVariants);
                                  }}
                                  className="w-28 sm:w-36 h-7 text-xs border-0 focus-visible:ring-0 p-0"
                                />
                                {variant.values.length > 1 && (
                                  // <Tooltip>
                                  //   <TooltipTrigger asChild>
                                      <button
                                        type="button"
                                        className="text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors p-0.5 rounded cursor-pointer"
                                        onClick={() => {
                                          const newVariants = [...variants];
                                          newVariants[index].values = newVariants[index].values.filter((_: any, vi: number) => vi !== valueIndex);
                                          setVariants(newVariants);
                                        }}
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </button>
                                  //   {/* </TooltipTrigger>
                                  //   <TooltipContent>{t('Remove')}</TooltipContent>
                                  // </Tooltip> */}
                                )}
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs cursor-pointer"
                              onClick={() => {
                                const newVariants = [...variants];
                                newVariants[index].values.push('');
                                setVariants(newVariants);
                              }}
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" />
                              {t('Add Value')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Custom Fields Card */}
                <Card className="shadow-xs border-zinc-200/80 dark:border-zinc-800">
                  <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                          <SlidersHorizontal className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold">{t('Custom Fields')}</CardTitle>
                          <CardDescription className="text-xs text-muted-foreground">
                            {t('Custom properties like Material, Warranty, or Dimensions')}
                          </CardDescription>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs cursor-pointer"
                        onClick={() => setCustomFields([...customFields, { name: '', value: '' }])}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        {t('Add Field')}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="!pt-5 space-y-3">
                    {customFields.map((field: any, index: number) => (
                      <div key={index} className="flex flex-wrap items-center gap-2 p-2 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
                        <Input
                          placeholder={t('Field name (e.g. Material)')}
                          value={field.name}
                          onChange={(e) => {
                            const newFields = [...customFields];
                            newFields[index].name = e.target.value;
                            setCustomFields(newFields);
                          }}
                          className="min-w-[140px] flex-1 bg-white dark:bg-zinc-900 h-9"
                        />
                        <Input
                          placeholder={t('Field value (e.g. Cotton)')}
                          value={field.value}
                          onChange={(e) => {
                            const newFields = [...customFields];
                            newFields[index].value = e.target.value;
                            setCustomFields(newFields);
                          }}
                          className="min-w-[140px] flex-1 bg-white dark:bg-zinc-900 h-9"
                        />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0 cursor-pointer transition-colors"
                              onClick={() => setCustomFields(customFields.filter((_: any, i: number) => i !== index))}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t('Remove')}</TooltipContent>
                        </Tooltip>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TooltipProvider>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-zinc-200 dark:border-zinc-800">
            {currentStep !== 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(s => s - 1)}
                className="cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('Previous')}
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              {currentStep < STEPS.length - 1 ? (
                <Button
                  type="button"
                  onClick={() => {
                    if (validateStep(currentStep)) {
                      setCurrentStep(s => s + 1);
                    }
                  }}
                  className="cursor-pointer"
                >
                  {t('Next')}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit} className="cursor-pointer">
                  <Save className="h-4 w-4 mr-2" />
                  {t('Save')}
                </Button>
              )}
            </div>
          </div>

        </form>
      </div>
    </PageTemplate>
  );
}
