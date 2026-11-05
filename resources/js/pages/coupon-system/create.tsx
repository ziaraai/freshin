import React, { useState, useEffect } from 'react';
import { PageTemplate } from '@/components/page-template';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Check,
  Ticket,
  Sparkles,
  DollarSign,
  Percent,
  Users,
  RefreshCw,
  Calendar,
  Tag,
  Info
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import BadgeUI from '@/components/badge-ui';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { toast } from '@/components/custom-toast';
import { formatCurrency, getCurrencySymbol } from '@/utils/currency-helper';

export default function CreateCoupon() {
  const { t } = useTranslation();
  const { errors } = usePage().props as any;

  const [currentStep, setCurrentStep] = useState(0);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 10; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    type: 'percentage',
    discount_amount: '',
    minimum_spend: '',
    maximum_spend: '',
    start_date: '',
    expiry_date: '',
    use_limit_per_coupon: '',
    use_limit_per_user: '',
    status: true,
    code_type: 'manual',
  });

  // Sync server errors
  useEffect(() => {
    if (errors && Object.keys(errors).length > 0) {
      setFormErrors(errors);
    }
  }, [errors]);

  const activeErrors: Record<string, string> = { ...errors, ...formErrors };

  // Stepper structure
  const steps = [
    {
      id: 'general',
      title: t('General Details'),
      shortDesc: t('Name, description & status'),
      description: t('Configure coupon identity, promotional description, and active status'),
      icon: <Ticket className="h-5 w-5" />,
    },
    {
      id: 'code',
      title: t('Coupon Code'),
      shortDesc: t('Manual or auto code'),
      description: t('Choose custom code or automatic 10-character code generator'),
      icon: <Sparkles className="h-5 w-5" />,
    },
    {
      id: 'pricing',
      title: t('Discount & Timeline'),
      shortDesc: t('Rate, thresholds & dates'),
      description: t('Define discount amount, minimum/maximum spend thresholds, and start/expiry dates'),
      icon: <DollarSign className="h-5 w-5" />,
    },
    {
      id: 'limits',
      title: t('Usage & Redemptions'),
      shortDesc: t('Global & user limits'),
      description: t('Configure maximum redemption caps per coupon and per customer'),
      icon: <Users className="h-5 w-5" />,
    },
  ];

  const getStepHasError = (stepIndex: number) => {
    if (!activeErrors || Object.keys(activeErrors).length === 0) return false;
    switch (stepIndex) {
      case 0:
        return !!(activeErrors.name || activeErrors.description || activeErrors.status);
      case 1:
        return !!(activeErrors.code || activeErrors.code_type);
      case 2:
        return !!(
          activeErrors.type ||
          activeErrors.discount_amount ||
          activeErrors.minimum_spend ||
          activeErrors.maximum_spend ||
          activeErrors.start_date ||
          activeErrors.expiry_date
        );
      case 3:
        return !!(activeErrors.use_limit_per_coupon || activeErrors.use_limit_per_user);
      default:
        return false;
    }
  };

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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleCodeTypeChange = (type: 'manual' | 'auto') => {
    setFormData((prev) => ({
      ...prev,
      code_type: type,
      code: type === 'auto' ? (prev.code || generateRandomCode()) : prev.code,
    }));
  };

  const handleRegenerateCode = () => {
    setFormData((prev) => ({
      ...prev,
      code: generateRandomCode(),
    }));
  };

  const validateCurrentStep = (stepIdx: number): boolean => {
    const errs: Record<string, string> = {};

    if (stepIdx === 0) {
      if (!formData.name.trim()) errs.name = t('Coupon name is required.');
    } else if (stepIdx === 1) {
      if (formData.code_type === 'manual' && !formData.code.trim()) {
        errs.code = t('Coupon code is required.');
      }
    } else if (stepIdx === 2) {
      if (formData.discount_amount === '' || isNaN(parseFloat(formData.discount_amount)) || parseFloat(formData.discount_amount) < 0) {
        errs.discount_amount = t('Discount amount must be 0 or greater.');
      }
      if (formData.type === 'percentage' && parseFloat(formData.discount_amount) > 100) {
        errs.discount_amount = t('Discount percentage cannot exceed 100%.');
      }
      if (formData.start_date && formData.expiry_date) {
        if (new Date(formData.expiry_date) < new Date(formData.start_date)) {
          errs.expiry_date = t('Expiry date must be after or equal to start date.');
        }
      }
    }

    if (Object.keys(errs).length > 0) {
      setFormErrors((prev) => ({ ...prev, ...errs }));
      return false;
    }
    return true;
  };

  const handleNextStep = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (validateCurrentStep(currentStep)) {
      if (currentStep < steps.length - 1) {
        setCurrentStep((prev) => prev + 1);
      }
    }
  };

  const handlePrevStep = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    for (let i = 0; i < steps.length; i++) {
      if (!validateCurrentStep(i)) {
        setCurrentStep(i);
        return;
      }
    }

    setProcessing(true);
    toast.loading(t('Creating coupon...'));

    const submissionData = {
      ...formData,
      code: formData.code_type === 'auto' ? (formData.code || generateRandomCode()) : formData.code,
      discount_amount: formData.discount_amount !== '' && formData.discount_amount !== null ? parseFloat(formData.discount_amount) : 0,
      minimum_spend: formData.minimum_spend !== '' && formData.minimum_spend !== null ? parseFloat(formData.minimum_spend) : null,
      maximum_spend: formData.maximum_spend !== '' && formData.maximum_spend !== null ? parseFloat(formData.maximum_spend) : null,
      use_limit_per_coupon: formData.use_limit_per_coupon !== '' && formData.use_limit_per_coupon !== null ? parseInt(formData.use_limit_per_coupon) : null,
      use_limit_per_user: formData.use_limit_per_user !== '' && formData.use_limit_per_user !== null ? parseInt(formData.use_limit_per_user) : null,
      start_date: formData.start_date || null,
      expiry_date: formData.expiry_date || null,
    };

    router.post(route('coupon-system.store'), submissionData, {
      onSuccess: () => {
        toast.dismiss();
        setProcessing(false);
        toast.success(t('Coupon created successfully!'));
      },
      onError: (errs) => {
        toast.dismiss();
        setProcessing(false);
        setFormErrors(errs);
        toast.error(t('Please fix the errors in the form.'));
      },
      onFinish: () => {
        setProcessing(false);
      },
    });
  };

  return (
    <PageTemplate
      title={t('Create Coupon')}
      description={t('Configure a new promotional discount coupon and redemption rules for your store')}
      url="/coupon-system/create"
      backUrl={route('coupon-system.index')}
      breadcrumbs={[
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Coupon System'), href: route('coupon-system.index') },
        { title: t('Create Coupon') },
      ]}
    >
      <form noValidate onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }} className="space-y-6">
        {/* Stepper Card Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 bg-card text-card-foreground border border-border rounded-2xl shadow-sm overflow-hidden">
          
          {/* Left Vertical Stepper Rail */}
          <div className="lg:col-span-4 xl:col-span-3 border-b lg:border-b-0 lg:border-r rtl:lg:border-r-0 rtl:lg:border-l border-border bg-muted/20 p-5 sm:p-6 lg:p-7 flex flex-col justify-between">
            <div>
              {/* Stepper Header */}
              <div className="mb-6 lg:mb-8 text-start">
                <span className="text-[11px] font-bold capitalize tracking-wide text-primary">
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

            {/* Live Voucher Preview Card */}
            <div className="mt-8 pt-6 border-t border-border/80">
              <span className="text-[11px] font-bold capitalize tracking-wide text-muted-foreground block mb-3">
                {t('Live Preview')}
              </span>
              <div className="p-4 rounded-xl border border-dashed border-primary/30 bg-background/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground capitalize font-semibold">
                    {formData.type === 'percentage' ? t('Percentage Off') : t('Fixed Discount')}
                  </span>
                  <BadgeUI
                    className={
                      formData.status
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400 font-medium text-xs'
                        : 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-950/40 dark:text-rose-400 font-medium text-xs'
                    }
                  >
                    {formData.status ? t('Active') : t('Inactive')}
                  </BadgeUI>
                </div>
                <div className="text-xl font-black text-primary font-mono">
                  {formData.discount_amount
                    ? formData.type === 'percentage'
                      ? `${formData.discount_amount}% OFF`
                      : formatCurrency(formData.discount_amount)
                    : '0.00'}
                </div>
                <div className="font-mono text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded inline-block">
                  {formData.code || (formData.code_type === 'auto' ? t('AUTO-GENERATED') : 'SAVE20')}
                </div>
                {formData.name && (
                  <p className="text-xs text-muted-foreground truncate mt-1">{formData.name}</p>
                )}
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
                  {/* Coupon Name */}
                  <div className="grid gap-1.5">
                    <Label htmlFor="name" required className="font-semibold text-sm">
                      {t('Coupon Name')}
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder={t('e.g., Black Friday Super Sale')}
                      className="h-10"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('A recognizable name for identifying this promotion.')}
                    </p>
                    <InputError message={activeErrors.name} />
                  </div>

                  {/* Description */}
                  <div className="grid gap-1.5">
                    <Label htmlFor="description" className="font-semibold text-sm">
                      {t('Description')}
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      rows={3}
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder={t('Optional description of promotional terms or campaign notes')}
                      className="resize-none"
                    />
                    <InputError message={activeErrors.description} />
                  </div>

                  {/* Status Toggle */}
                  <div className="p-4 rounded-xl border border-border bg-muted/20 flex items-center justify-between">
                    <div>
                      <Label htmlFor="status" className="font-semibold text-sm cursor-pointer">
                        {t('Coupon Status')}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formData.status ? t('Coupon is active and ready for customers') : t('Coupon is inactive')}
                      </p>
                    </div>
                    <Switch
                      id="status"
                      checked={formData.status}
                      onCheckedChange={(checked) => handleSwitchChange('status', checked)}
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: COUPON CODE */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div className="grid gap-2">
                    <Label className="font-semibold text-sm">
                      {t('Code Generation Mode')} <span className="text-red-500">*</span>
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleCodeTypeChange('manual')}
                        className={`flex items-start gap-3 p-4 rounded-xl border text-start transition-all ${
                          formData.code_type === 'manual'
                            ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                            : 'border-border bg-background text-muted-foreground hover:bg-muted/40'
                        }`}
                      >
                        <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                          <Tag className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-foreground">{t('Manual Entry')}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {t('Type a custom code of your choice (e.g. SAVE20)')}
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCodeTypeChange('auto')}
                        className={`flex items-start gap-3 p-4 rounded-xl border text-start transition-all ${
                          formData.code_type === 'auto'
                            ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                            : 'border-border bg-background text-muted-foreground hover:bg-muted/40'
                        }`}
                      >
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-foreground">{t('Auto Generate')}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {t('Generate an uppercase 10-character unique promo code')}
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {formData.code_type === 'manual' ? (
                    <div className="grid gap-1.5">
                      <Label htmlFor="code" required className="font-semibold text-sm">
                        {t('Coupon Code')}
                      </Label>
                      <Input
                        id="code"
                        name="code"
                        type="text"
                        value={formData.code}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase().replace(/\s+/g, '');
                          setFormData((prev) => ({ ...prev, code: val }));
                          if (formErrors.code) {
                            setFormErrors((prev) => {
                              const next = { ...prev };
                              delete next.code;
                              return next;
                            });
                          }
                        }}
                        placeholder={t('e.g., SAVE20')}
                        className="h-10 uppercase font-mono tracking-wider"
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('Customers will enter this code at checkout to claim the discount.')}
                      </p>
                      <InputError message={activeErrors.code} />
                    </div>
                  ) : (
                    <div className="grid gap-1.5">
                      <Label className="font-semibold text-sm">
                        {t('Generated Code')}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          value={formData.code}
                          readOnly
                          className="h-10 uppercase font-mono tracking-widest bg-muted/60 font-semibold text-primary"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleRegenerateCode}
                          className="gap-1.5 h-10 border-border"
                        >
                          <RefreshCw className="h-4 w-4" />
                          <span>{t('Regenerate')}</span>
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('Click regenerate to randomize another code.')}
                      </p>
                      <InputError message={activeErrors.code} />
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: DISCOUNT & TIMELINE */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  {/* Discount Type Selector */}
                  <div className="grid gap-2">
                    <Label className="font-semibold text-sm">
                      {t('Discount Calculation Type')} <span className="text-red-500">*</span>
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, type: 'percentage' }))}
                        className={`flex items-start gap-3 p-4 rounded-xl border text-start transition-all ${
                          formData.type === 'percentage'
                            ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 ring-1 ring-emerald-600'
                            : 'border-border bg-background text-muted-foreground hover:bg-muted/40'
                        }`}
                      >
                        <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 shrink-0">
                          <Percent className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-foreground">{t('Percentage Discount')}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {t('Deduct a percentage (%) off checkout total')}
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, type: 'flat' }))}
                        className={`flex items-start gap-3 p-4 rounded-xl border text-start transition-all ${
                          formData.type === 'flat'
                            ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-300 ring-1 ring-blue-600'
                            : 'border-border bg-background text-muted-foreground hover:bg-muted/40'
                        }`}
                      >
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/40 shrink-0">
                          <DollarSign className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-foreground">{t('Fixed Amount')}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {t('Deduct a fixed currency amount off checkout')}
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Discount Amount */}
                  <div className="grid gap-1.5">
                    <Label htmlFor="discount_amount" required className="font-semibold text-sm">
                      {formData.type === 'percentage'
                        ? t('Discount Percentage (%)')
                        : t('Discount Amount ({{symbol}})', { symbol: getCurrencySymbol() })}
                    </Label>
                    <div className="relative">
                      <Input
                        id="discount_amount"
                        name="discount_amount"
                        type="number"
                        step={formData.type === 'percentage' ? '1' : '0.01'}
                        min="0"
                        max={formData.type === 'percentage' ? '100' : undefined}
                        value={formData.discount_amount}
                        onChange={handleInputChange}
                        placeholder={formData.type === 'percentage' ? '20' : '10.00'}
                        className="h-10 pe-10"
                      />
                      <div className="absolute inset-y-0 end-0 pe-3 flex items-center pointer-events-none text-muted-foreground text-sm font-medium">
                        {formData.type === 'percentage' ? '%' : ''}
                      </div>
                    </div>
                    <InputError message={activeErrors.discount_amount} />
                  </div>

                  {/* Spend Limits */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <Label htmlFor="minimum_spend" className="font-semibold text-sm">
                        {t('Minimum Spend Amount')}
                      </Label>
                      <Input
                        id="minimum_spend"
                        name="minimum_spend"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.minimum_spend}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        className="h-10"
                      />
                      <p className="text-xs text-muted-foreground">{t('Minimum cart total required.')}</p>
                      <InputError message={activeErrors.minimum_spend} />
                    </div>

                    <div className="grid gap-1.5">
                      <Label htmlFor="maximum_spend" className="font-semibold text-sm">
                        {t('Maximum Spend Amount')}
                      </Label>
                      <Input
                        id="maximum_spend"
                        name="maximum_spend"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.maximum_spend}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        className="h-10"
                      />
                      <p className="text-xs text-muted-foreground">{t('Maximum spend cap threshold.')}</p>
                      <InputError message={activeErrors.maximum_spend} />
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <Label htmlFor="start_date" className="font-semibold text-sm">
                        {t('Start Date')}
                      </Label>
                      <Input
                        id="start_date"
                        name="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={handleInputChange}
                        className="h-10"
                      />
                      <InputError message={activeErrors.start_date} />
                    </div>

                    <div className="grid gap-1.5">
                      <Label htmlFor="expiry_date" className="font-semibold text-sm">
                        {t('End / Expiry Date')}
                      </Label>
                      <Input
                        id="expiry_date"
                        name="expiry_date"
                        type="date"
                        value={formData.expiry_date}
                        onChange={handleInputChange}
                        className="h-10"
                      />
                      <InputError message={activeErrors.expiry_date} />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: USAGE LIMITS */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  <div className="p-3.5 rounded-xl border border-border bg-muted/20 text-xs text-muted-foreground flex items-start gap-2.5">
                    <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p>
                      {t('You can configure usage restrictions to prevent coupon abuse. Leave these fields blank for unlimited usage.')}
                    </p>
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="use_limit_per_coupon" className="font-semibold text-sm">
                      {t('Usage Limit per Coupon')}
                    </Label>
                    <Input
                      id="use_limit_per_coupon"
                      name="use_limit_per_coupon"
                      type="number"
                      min="1"
                      value={formData.use_limit_per_coupon}
                      onChange={handleInputChange}
                      placeholder={t('Unlimited')}
                      className="h-10"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('Total redemptions allowed across all customers.')}
                    </p>
                    <InputError message={activeErrors.use_limit_per_coupon} />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="use_limit_per_user" className="font-semibold text-sm">
                      {t('Usage Limit per User')}
                    </Label>
                    <Input
                      id="use_limit_per_user"
                      name="use_limit_per_user"
                      type="number"
                      min="1"
                      value={formData.use_limit_per_user}
                      onChange={handleInputChange}
                      placeholder={t('1')}
                      className="h-10"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('Maximum times an individual customer can use this coupon.')}
                    </p>
                    <InputError message={activeErrors.use_limit_per_user} />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Stepper Navigation Controls */}
            <div className="pt-6 mt-8 border-t border-border flex items-center justify-between gap-3">
              <div>
                {currentStep > 0 && (
                  <Button
                    key="btn-prev-step"
                    type="button"
                    variant="outline"
                    onClick={(e) => handlePrevStep(e)}
                    className="border-border text-xs sm:text-sm"
                  >
                    <ArrowLeft className="h-4 w-4 me-1.5" />
                    {t('Previous')}
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {currentStep < steps.length - 1 ? (
                  <Button
                    key="btn-next-step"
                    type="button"
                    onClick={(e) => handleNextStep(e)}
                    className="gap-1.5 text-xs sm:text-sm"
                  >
                    <span>{t('Next Step')}</span>
                    <ArrowRight className="h-4 w-4 ms-1" />
                  </Button>
                ) : (
                  <Button
                    key="btn-save-coupon"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleSubmit(e);
                    }}
                    disabled={processing}
                    className="gap-1.5 text-xs sm:text-sm font-semibold shadow-sm"
                  >
                    <Save className="h-4 w-4 me-1" />
                    <span>{processing ? t('Saving...') : t('Save Coupon')}</span>
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
