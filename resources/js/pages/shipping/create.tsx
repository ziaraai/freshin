import React, { useState, useEffect } from 'react';
import { PageTemplate } from '@/components/page-template';
import { 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  Check, 
  Truck, 
  DollarSign, 
  Globe, 
  SlidersHorizontal, 
  Clock, 
  ShieldCheck, 
  Box, 
  Scale, 
  MapPin, 
  Percent, 
  Gift, 
  Sparkles,
  Info
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import BadgeUI from '@/components/badge-ui';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { hasPermission } from '@/utils/permissions';
import { toast } from '@/components/custom-toast';

export default function CreateShipping() {
  const { t } = useTranslation();
  const { errors } = usePage().props as any;

  // Permission check at component level (never call hooks inside callbacks)
  const canCreate = hasPermission('create-shipping');

  const [currentStep, setCurrentStep] = useState(0);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);

  // Sync controller-side errors from props
  useEffect(() => {
    if (errors && Object.keys(errors).length > 0) {
      setFormErrors(errors);
    }
  }, [errors]);

  const activeErrors: Record<string, string> = { ...errors, ...formErrors };

  // All 18 original dynamic variables preserved
  const [formData, setFormData] = useState({
    name: '',
    type: 'flat_rate',
    description: '',
    cost: 9.99,
    min_order_amount: 0,
    delivery_time: '',
    sort_order: 0,
    is_active: true,
    zone_type: 'domestic',
    countries: '',
    postal_codes: '',
    max_distance: null as number | null,
    max_weight: null as number | null,
    max_dimensions: '',
    require_signature: false,
    insurance_required: false,
    tracking_available: true,
    handling_fee: 0
  });

  const [shippingType, setShippingType] = useState('flat_rate');

  // Stepper structure
  const steps = [
    {
      id: 'general',
      title: t('General Details'),
      shortDesc: t('Method name, type & status'),
      description: t('Configure the core identity, calculation type, and status of this shipping method'),
      icon: <Truck className="h-5 w-5" />
    },
    {
      id: 'pricing',
      title: t('Pricing & Rates'),
      shortDesc: t('Cost, threshold & fees'),
      description: t('Define the base cost or percentage rate, minimum qualifying cart amount, and handling fee'),
      icon: <DollarSign className="h-5 w-5" />
    },
    {
      id: 'zones',
      title: t('Shipping Zones'),
      shortDesc: t('Regional coverage & speed'),
      description: t('Set geographic delivery zones, country/postal rules, and estimated delivery timeline'),
      icon: <Globe className="h-5 w-5" />
    },
    {
      id: 'advanced',
      title: t('Fulfillment & Limits'),
      shortDesc: t('Parcel limits & security'),
      description: t('Set maximum package weight/dimensions and customer delivery security options'),
      icon: <SlidersHorizontal className="h-5 w-5" />
    }
  ];

  // Helper to determine if a step has validation errors
  const getStepHasError = (stepIndex: number) => {
    if (!activeErrors || Object.keys(activeErrors).length === 0) return false;
    switch (stepIndex) {
      case 0:
        return !!(activeErrors.name || activeErrors.type || activeErrors.description || activeErrors.sort_order || activeErrors.is_active);
      case 1:
        return !!(activeErrors.cost || activeErrors.min_order_amount || activeErrors.handling_fee);
      case 2:
        return !!(activeErrors.zone_type || activeErrors.countries || activeErrors.postal_codes || activeErrors.max_distance || activeErrors.delivery_time);
      case 3:
        return !!(activeErrors.max_weight || activeErrors.max_dimensions || activeErrors.require_signature || activeErrors.insurance_required || activeErrors.tracking_available);
      default:
        return false;
    }
  };

  // Automatically navigate to first step with errors if validation fails
  useEffect(() => {
    if (activeErrors && Object.keys(activeErrors).length > 0) {
      for (let i = 0; i < steps.length; i++) {
        if (getStepHasError(i)) {
          setCurrentStep(i);
          break;
        }
      }
    }
  }, [errors, formErrors]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for field as user edits
    if (formErrors[name]) {
      setFormErrors(prev => {
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
    if (formErrors[name]) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'type') {
      setShippingType(value);
    }
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (formErrors[name]) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleTypeSelect = (typeValue: string) => {
    setShippingType(typeValue);
    setFormData(prev => ({
      ...prev,
      type: typeValue,
      cost: typeValue === 'free_shipping' ? 0 : prev.cost
    }));
    if (formErrors.type) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next.type;
        return next;
      });
    }
  };

  const handleZoneSelect = (zoneValue: string) => {
    setFormData(prev => ({
      ...prev,
      zone_type: zoneValue
    }));
    if (formErrors.zone_type) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next.zone_type;
        return next;
      });
    }
  };

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!canCreate || processing) {
      return;
    }

    setProcessing(true);
    router.post(route('shipping.store'), formData, {
      preserveScroll: true,
      onSuccess: (page: any) => {
        setProcessing(false);
        setFormErrors({});
        toast.dismiss();
        if (page?.props?.flash?.success) {
          toast.success(t(page.props.flash.success));
        } else if (page?.props?.flash?.error) {
          toast.error(t(page.props.flash.error));
        } else {
          toast.success(t('Shipping created successfully'));
        }
      },
      onError: (errs: any) => {
        setProcessing(false);
        if (errs && typeof errs === 'object') {
          setFormErrors(errs);
        }

        // Jump to first step with validation errors
        if (errs.name || errs.type || errs.description || errs.sort_order || errs.is_active) {
          setCurrentStep(0);
        } else if (errs.cost || errs.min_order_amount || errs.handling_fee) {
          setCurrentStep(1);
        } else if (errs.zone_type || errs.countries || errs.postal_codes || errs.max_distance || errs.delivery_time) {
          setCurrentStep(2);
        } else if (errs.max_weight || errs.max_dimensions || errs.require_signature || errs.insurance_required || errs.tracking_available) {
          setCurrentStep(3);
        }
      },
      onFinish: () => {
        setProcessing(false);
      }
    });
  };

  const pageActions = canCreate ? [
    {
      label: t('Save Shipping'),
      icon: <Save className="h-4 w-4" />,
      variant: 'default' as const,
      onClick: () => handleSubmit()
    }
  ] : [];

  const shippingTypes = [
    {
      value: 'flat_rate',
      label: t('Flat Rate'),
      description: t('Charge a fixed standard fee per order'),
      icon: <Truck className="h-4 w-4" />
    },
    {
      value: 'free_shipping',
      label: t('Free Shipping'),
      description: t('Free shipping for qualifying orders'),
      icon: <Gift className="h-4 w-4" />
    },
    {
      value: 'weight_based',
      label: t('Weight Based'),
      description: t('Scaled based on total cart weight'),
      icon: <Scale className="h-4 w-4" />
    },
    {
      value: 'distance_based',
      label: t('Distance Based'),
      description: t('Scaled based on delivery distance (km)'),
      icon: <MapPin className="h-4 w-4" />
    },
    {
      value: 'percentage_based',
      label: t('Percentage Based'),
      description: t('Percentage of order subtotal'),
      icon: <Percent className="h-4 w-4" />
    }
  ];

  const zoneTypes = [
    { value: 'domestic', label: t('Domestic'), desc: t('Inside domestic territory') },
    { value: 'international', label: t('International'), desc: t('Worldwide & cross-border') },
    { value: 'local', label: t('Local'), desc: t('Immediate city or radius') },
    { value: 'regional', label: t('Regional'), desc: t('Specific state or province') }
  ];

  return (
    <PageTemplate 
      title={t('Create Shipping Method')}
      description={t('Configure a new shipping method and delivery rules for your store')}
      url="/shipping/create"
      // actions={pageActions}
      backUrl={route('shipping.index')}
      breadcrumbs={[
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Shipping Management'), href: route('shipping.index') },
        { title: t('Create Shipping Method') }
      ]}
    >
      <form noValidate onSubmit={handleSubmit} className="space-y-6">
        {/* Stepper Card Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 bg-card text-card-foreground border border-border rounded-2xl shadow-sm overflow-hidden">
          
          {/* Left Vertical Stepper Rail (Inspired by the Stepper UI) */}
          <div className="lg:col-span-4 xl:col-span-3 border-b lg:border-b-0 lg:border-r rtl:lg:border-r-0 rtl:lg:border-l border-border bg-muted/20 p-5 sm:p-6 lg:p-7 flex flex-col justify-between">
            <div>
              {/* Stepper Header */}
              <div className="mb-6 lg:mb-8 text-start">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  {t('Step')} {currentStep + 1} {t('of')} {steps.length}
                </span>
                <h2 className="text-lg font-bold text-foreground mt-0.5">
                  {steps[currentStep].title}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {steps[currentStep].shortDesc}
                </p>
              </div>

              {/* Stepper Items List with Connecting Line */}
              <div className="relative space-y-4 lg:space-y-6">
                {steps.map((step, idx) => {
                  const isCompleted = currentStep > idx;
                  const isCurrent = currentStep === idx;
                  const hasError = getStepHasError(idx);

                  return (
                    <div key={step.id} className="relative flex items-center gap-3.5 group">
                      {/* Connecting vertical line */}
                      {idx < steps.length - 1 && (
                        <div
                          className={`hidden lg:block absolute left-[21px] rtl:left-auto rtl:right-[21px] top-[42px] w-[2px] h-[calc(100%+10px)] transition-colors duration-200 ${
                            currentStep > idx ? 'bg-primary' : 'bg-border'
                          }`}
                        />
                      )}

                      {/* Step Circle Button */}
                      <button
                        type="button"
                        onClick={() => setCurrentStep(idx)}
                        className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all duration-200 cursor-pointer ${
                          hasError
                            ? isCurrent
                              ? 'bg-destructive/10 text-destructive border-2 border-destructive ring-4 ring-destructive/20 scale-105'
                              : 'bg-destructive/10 text-destructive border-2 border-destructive hover:bg-destructive/20'
                            : isCurrent
                            ? 'bg-primary text-primary-foreground shadow-sm ring-4 ring-primary/20 scale-105'
                            : isCompleted
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                            : 'bg-background text-muted-foreground hover:text-foreground border border-border hover:border-muted-foreground/40'
                        }`}
                        aria-label={step.title}
                      >
                        {isCompleted && !hasError ? (
                          <Check className="h-5 w-5 stroke-[2.5]" />
                        ) : (
                          step.icon
                        )}
                      </button>

                      {/* Step Text Info */}
                      <div 
                        onClick={() => setCurrentStep(idx)}
                        className="cursor-pointer select-none min-w-0 flex-1 text-start"
                      >
                        <span
                          className={`text-sm font-semibold truncate block transition-colors ${
                            hasError
                              ? 'text-destructive font-semibold'
                              : isCurrent 
                              ? 'text-primary' 
                              : isCompleted 
                              ? 'text-foreground' 
                              : 'text-muted-foreground group-hover:text-foreground'
                          }`}
                        >
                          {step.title}
                        </span>
                        <span className="text-xs text-muted-foreground truncate block">
                          {step.shortDesc}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Step Form Content */}
          <div className="lg:col-span-8 xl:col-span-9 p-5 sm:p-7 lg:p-8 flex flex-col justify-between min-h-[520px]">
            <div>
              {/* Step Header */}
              <div className="border-b border-border pb-4 mb-6 flex flex-wrap items-center justify-between gap-2 text-start">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                    {steps[currentStep].title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {steps[currentStep].description}
                  </p>
                </div>
              </div>

              {/* STEP 1: GENERAL DETAILS */}
              {currentStep === 0 && (
                <div className="space-y-5">
                  {/* Method Name */}
                  <div className="grid gap-1.5">
                    <Label htmlFor="name" required className="font-semibold text-sm">
                      {t('Method Name')}
                    </Label>
                    <Input 
                      id="name" 
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder={t('Enter shipping method name (e.g., Standard Express Delivery)')} 
                      aria-invalid={!!activeErrors.name}
                      className="h-10"
                    />
                    <InputError message={activeErrors.name} />
                  </div>

                  {/* Shipping Type Selection */}
                  <div className="grid gap-2">
                    <Label htmlFor="type" required className="font-semibold text-sm">
                      {t('Shipping Type')}
                    </Label>
                    
                    {/* Visual Type Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
                      {shippingTypes.map((type) => {
                        const isSelected = formData.type === type.value;
                        return (
                          <div
                            key={type.value}
                            onClick={() => handleTypeSelect(type.value)}
                            className={`cursor-pointer rounded-xl p-3 border text-start transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-2xs'
                                : 'border-border bg-card hover:bg-muted/40 hover:border-muted-foreground/30'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                {type.icon}
                              </div>
                              <span className="font-semibold text-sm text-foreground">
                                {type.label}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                              {type.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                    <InputError message={activeErrors.type} />
                  </div>

                  {/* Description */}
                  <div className="grid gap-1.5">
                    <Label htmlFor="description" className="font-semibold text-sm">
                      {t('Description')}
                    </Label>
                    <Textarea 
                      id="description" 
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder={t('Optional description or customer guidelines regarding this shipping method')} 
                      rows={3}
                    />
                    <InputError message={activeErrors.description} />
                  </div>

                  {/* Sort Order & Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="grid gap-1.5">
                      <Label htmlFor="sort_order" className="font-semibold text-sm">
                        {t('Sort Order')}
                      </Label>
                      <Input 
                        id="sort_order" 
                        name="sort_order"
                        type="number" 
                        value={formData.sort_order}
                        onChange={handleInputChange}
                        placeholder={t('0')} 
                        className="h-10"
                      />
                      <p className="text-[11px] text-muted-foreground">{t('Display priority in checkout (lower numbers show first)')}</p>
                      <InputError message={activeErrors.sort_order} />
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20">
                      <div>
                        <Label className="font-semibold text-sm block">{t('Method Status')}</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formData.is_active ? t('Active and available for checkout') : t('Inactive and hidden from customers')}
                        </p>
                      </div>
                      <Switch 
                        checked={formData.is_active}
                        onCheckedChange={(checked) => handleSwitchChange('is_active', checked)}
                        aria-label={t('Method Status')}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: PRICING & RATES */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  {formData.type === 'free_shipping' ? (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 text-emerald-800 dark:text-emerald-300">
                      <div className="flex items-center gap-2 font-semibold text-sm">
                        <Gift className="h-4 w-4" />
                        <span>{t('Free Shipping Activated')}</span>
                      </div>
                      <p className="text-xs mt-1 text-emerald-700/90 dark:text-emerald-400 leading-relaxed">
                        {t('Base shipping cost is automatically set to 0. You can optionally require a minimum cart order amount below.')}
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-1.5">
                      <Label htmlFor="cost" className="font-semibold text-sm">
                        {formData.type === 'percentage_based' ? t('Percentage Rate (%)') : t('Shipping Cost')}
                      </Label>
                      <Input 
                        id="cost" 
                        name="cost"
                        type="number" 
                        step={formData.type === 'percentage_based' ? '0.1' : '0.01'} 
                        value={formData.cost}
                        onChange={handleInputChange}
                        placeholder={formData.type === 'percentage_based' ? t('5.0') : t('9.99')} 
                        className="h-10"
                        aria-invalid={!!activeErrors.cost}
                      />
                      <p className="text-[11px] text-muted-foreground">
                        {formData.type === 'percentage_based' 
                          ? t('Percentage calculated from order subtotal') 
                          : t('Standard base rate charged for this shipping method')}
                      </p>
                      <InputError message={activeErrors.cost} />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Minimum Order Amount */}
                    <div className="grid gap-1.5">
                      <Label htmlFor="min_order_amount" className="font-semibold text-sm">
                        {t('Minimum Order Amount')}
                      </Label>
                      <Input 
                        id="min_order_amount" 
                        name="min_order_amount"
                        type="number" 
                        step="0.01" 
                        value={formData.min_order_amount}
                        onChange={handleInputChange}
                        placeholder={t('0.00')} 
                        className="h-10"
                        aria-invalid={!!activeErrors.min_order_amount}
                      />
                      <p className="text-[11px] text-muted-foreground">
                        {t('Optional minimum cart subtotal required to qualify for this shipping method (0 for no limit)')}
                      </p>
                      <InputError message={activeErrors.min_order_amount} />
                    </div>

                    {/* Handling Fee */}
                    <div className="grid gap-1.5">
                      <Label htmlFor="handling_fee" className="font-semibold text-sm">
                        {t('Handling Fee')}
                      </Label>
                      <Input 
                        id="handling_fee" 
                        name="handling_fee"
                        type="number" 
                        step="0.01" 
                        value={formData.handling_fee}
                        onChange={handleInputChange}
                        placeholder={t('0.00')} 
                        className="h-10"
                        aria-invalid={!!activeErrors.handling_fee}
                      />
                      <p className="text-[11px] text-muted-foreground">
                        {t('Additional handling, packing, or processing surcharge applied to the order')}
                      </p>
                      <InputError message={activeErrors.handling_fee} />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: SHIPPING ZONES & COVERAGE */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  {/* Zone Type Selection */}
                  <div className="grid gap-2">
                    <Label htmlFor="zone_type" className="font-semibold text-sm">
                      {t('Zone Type')}
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {zoneTypes.map((zone) => {
                        const isSelected = formData.zone_type === zone.value;
                        return (
                          <div
                            key={zone.value}
                            onClick={() => handleZoneSelect(zone.value)}
                            className={`cursor-pointer rounded-xl p-3 border text-center transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-2xs font-semibold'
                                : 'border-border bg-card hover:bg-muted/40'
                            }`}
                          >
                            <span className="text-sm font-semibold text-foreground block">
                              {zone.label}
                            </span>
                            <span className="text-[11px] text-muted-foreground block mt-0.5">
                              {zone.desc}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <InputError message={activeErrors.zone_type} />
                  </div>

                  {/* Estimated Delivery Time */}
                  <div className="grid gap-1.5">
                    <Label htmlFor="delivery_time" className="font-semibold text-sm">
                      {t('Estimated Delivery Time')}
                    </Label>
                    <div className="relative">
                      <Clock className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input 
                        id="delivery_time" 
                        name="delivery_time"
                        value={formData.delivery_time}
                        onChange={handleInputChange}
                        placeholder={t('e.g., 3-5 business days or 24-48 hours')} 
                        className="pl-9 rtl:pl-3 rtl:pr-9 h-10"
                        aria-invalid={!!activeErrors.delivery_time}
                      />
                    </div>
                    <InputError message={activeErrors.delivery_time} />
                  </div>

                  {/* Countries / Regions */}
                  <div className="grid gap-1.5">
                    <Label htmlFor="countries" className="font-semibold text-sm">
                      {t('Countries / Regions')}
                    </Label>
                    <Textarea 
                      id="countries" 
                      name="countries"
                      value={formData.countries}
                      onChange={handleInputChange}
                      placeholder={t('Enter supported countries or regions (e.g., US, CA, UK or one per line)')} 
                      rows={3} 
                      aria-invalid={!!activeErrors.countries}
                    />
                    <InputError message={activeErrors.countries} />
                  </div>

                  {/* Postal Codes & Max Distance */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <Label htmlFor="postal_codes" className="font-semibold text-sm">
                        {t('Postal Codes')}
                      </Label>
                      <Input 
                        id="postal_codes" 
                        name="postal_codes"
                        value={formData.postal_codes}
                        onChange={handleInputChange}
                        placeholder={t('e.g., 10001-10299, 90210')} 
                        className="h-10"
                        aria-invalid={!!activeErrors.postal_codes}
                      />
                      <InputError message={activeErrors.postal_codes} />
                    </div>

                    <div className="grid gap-1.5">
                      <Label htmlFor="max_distance" className="font-semibold text-sm">
                        {t('Max Distance (km)')}
                      </Label>
                      <Input 
                        id="max_distance" 
                        name="max_distance"
                        type="number" 
                        value={formData.max_distance || ''}
                        onChange={handleInputChange}
                        placeholder={t('e.g., 50')} 
                        className="h-10"
                        aria-invalid={!!activeErrors.max_distance}
                      />
                      <InputError message={activeErrors.max_distance} />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: FULFILLMENT & LIMITS */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  {/* Maximum Weight & Dimensions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <Label htmlFor="max_weight" className="font-semibold text-sm">
                        {t('Maximum Weight (kg)')}
                      </Label>
                      <div className="relative">
                        <Scale className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input 
                          id="max_weight" 
                          name="max_weight"
                          type="number" 
                          step="0.1" 
                          value={formData.max_weight || ''}
                          onChange={handleInputChange}
                          placeholder={t('e.g., 10.0')} 
                          className="pl-9 rtl:pl-3 rtl:pr-9 h-10"
                          aria-invalid={!!activeErrors.max_weight}
                        />
                      </div>
                      <InputError message={activeErrors.max_weight} />
                    </div>

                    <div className="grid gap-1.5">
                      <Label htmlFor="max_dimensions" className="font-semibold text-sm">
                        {t('Maximum Dimensions (cm)')}
                      </Label>
                      <div className="relative">
                        <Box className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input 
                          id="max_dimensions" 
                          name="max_dimensions"
                          value={formData.max_dimensions}
                          onChange={handleInputChange}
                          placeholder={t('e.g., 50×50×50')} 
                          className="pl-9 rtl:pl-3 rtl:pr-9 h-10"
                          aria-invalid={!!activeErrors.max_dimensions}
                        />
                      </div>
                      <InputError message={activeErrors.max_dimensions} />
                    </div>
                  </div>

                  {/* Delivery & Security Options (Interactive Feature Cards) */}
                  <div className="grid gap-3 pt-2">
                    <Label className="font-semibold text-sm">{t('Delivery & Security Options')}</Label>

                    {/* Tracking Available */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <Truck className="h-4 w-4" />
                        </div>
                        <div className="text-start">
                          <Label className="font-semibold text-sm block">{t('Tracking Available')}</Label>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {t('Provide parcel shipment tracking codes to buyers')}
                          </p>
                        </div>
                      </div>
                      <Switch 
                        checked={formData.tracking_available}
                        onCheckedChange={(checked) => handleSwitchChange('tracking_available', checked)}
                      />
                    </div>

                    {/* Require Signature */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <div className="text-start">
                          <Label className="font-semibold text-sm block">{t('Require Signature')}</Label>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {t('Courier must collect recipient signature upon delivery')}
                          </p>
                        </div>
                      </div>
                      <Switch 
                        checked={formData.require_signature}
                        onCheckedChange={(checked) => handleSwitchChange('require_signature', checked)}
                      />
                    </div>

                    {/* Insurance Required */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <div className="text-start">
                          <Label className="font-semibold text-sm block">{t('Insurance Required')}</Label>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {t('Mandate transit insurance coverage against loss or damage')}
                          </p>
                        </div>
                      </div>
                      <Switch 
                        checked={formData.insurance_required}
                        onCheckedChange={(checked) => handleSwitchChange('insurance_required', checked)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step Navigation Footer */}
            <div className="flex items-center justify-between border-t border-border pt-6 mt-8">
              {currentStep !== 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  className="flex items-center gap-2 h-10 px-4"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>{t('Previous')}</span>
                </Button>
              ) : <div></div>}

              <div className="flex items-center gap-3">
                {currentStep < steps.length - 1 ? (
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="flex items-center gap-2 h-10 px-5"
                  >
                    <span>{t('Next')}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={!canCreate || processing}
                    className="flex items-center gap-2 h-10 px-6 shadow-sm"
                  >
                    <Save className="h-4 w-4" />
                    <span>{t('Save')}</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </PageTemplate>
  );
}