import React, { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { ArrowLeft, ArrowRight, Check, Save, CreditCard, Wallet, Smartphone, ShieldCheck, ShoppingCart, Zap, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import BadgeUI from '@/components/badge-ui';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { toast } from '@/components/custom-toast';
import { useLayout } from '@/contexts/LayoutContext';

export default function EditExpressCheckout() {
  const { t } = useTranslation();
  const { checkout, errors } = usePage().props as any;
  const [checkoutType, setCheckoutType] = useState(checkout?.type || 'buy_now');
  const [currentStep, setCurrentStep] = useState(0);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const {position} = useLayout();

  const [formData, setFormData] = useState({
    name: checkout?.name || '',
    type: checkout?.type || 'buy_now',
    description: checkout?.description || '',
    button_text: checkout?.button_text || 'Buy Now',
    button_color: checkout?.button_color || '#000000',
    is_active: checkout?.is_active !== undefined ? checkout.is_active : true,
    payment_methods: checkout?.payment_methods?.filter((method: string) => ['stripe', 'cod'].includes(method)) || ['stripe', 'cod'],
    default_payment_method: (['stripe', 'cod'].includes(checkout?.default_payment_method) ? checkout.default_payment_method : 'stripe'),
    skip_cart: checkout?.skip_cart !== undefined ? checkout.skip_cart : true,
    auto_fill_customer_data: checkout?.auto_fill_customer_data !== undefined ? checkout.auto_fill_customer_data : true,
    guest_checkout_allowed: checkout?.guest_checkout_allowed !== undefined ? checkout.guest_checkout_allowed : false,
    mobile_optimized: checkout?.mobile_optimized !== undefined ? checkout.mobile_optimized : true,
    save_payment_methods: checkout?.save_payment_methods !== undefined ? checkout.save_payment_methods : false,
    success_redirect_url: checkout?.success_redirect_url || '',
    cancel_redirect_url: checkout?.cancel_redirect_url || ''
  });

  const combinedErrors = { ...errors, ...localErrors };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
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

  const handleTypeChange = (value: string) => {
    setCheckoutType(value);
    setFormData(prev => ({
      ...prev,
      type: value
    }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handlePaymentMethodChange = (method: string, checked: boolean | string) => {
    setFormData(prev => {
      let methods = [...(prev.payment_methods || [])];
      
      if (checked && !methods.includes(method)) {
        methods.push(method);
      } else if (!checked && methods.includes(method)) {
        methods = methods.filter(m => m !== method);
      }

      let newDefault = prev.default_payment_method;
      if (!checked && prev.default_payment_method === method) {
        newDefault = methods.length > 0 ? methods[0] : '';
      } else if (checked && !newDefault) {
        newDefault = method;
      }
      
      return {
        ...prev,
        payment_methods: methods,
        default_payment_method: newDefault,
      };
    });

    if (localErrors.payment_methods) {
      setLocalErrors(prev => {
        const next = { ...prev };
        delete next.payment_methods;
        return next;
      });
    }
  };

  const handleDefaultPaymentChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      default_payment_method: value
    }));
  };

  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!formData.name?.trim()) {
        e.name = t('Checkout name is required');
      }
    }
    if (s === 1) {
      if (!formData.payment_methods || formData.payment_methods.length === 0) {
        e.payment_methods = t('Please select at least one payment method');
      }
    }
    setLocalErrors(e);
    return Object.keys(e).length === 0;
  };

  const STEP_FIELDS: Record<number, string[]> = {
    0: ['name', 'type', 'description', 'button_text', 'button_color'],
    1: ['payment_methods', 'default_payment_method'],
    2: ['success_redirect_url', 'cancel_redirect_url'],
  };

  const stepHasError = (i: number) => {
    const fields = STEP_FIELDS[i] || [];
    return fields.some(f => combinedErrors[f]);
  };

  const STEPS = [
    { key: 'info', label: t('General Information') },
    { key: 'payment', label: t('Payment Methods') },
    { key: 'settings', label: t('Checkout Settings') },
  ];

  const handleSubmit = () => {
    if (!validateStep(currentStep)) return;
    toast.loading(t('Updating express checkout...'));
    router.put(route('express-checkout.update', checkout.id), formData, {
      onSuccess: (page: any) => {
        toast.dismiss();
        if (page?.props?.flash?.success) {
          toast.success(t(page.props.flash.success));
        } else if (page?.props?.flash?.error) {
          toast.error(t(page.props.flash.error));
        }
      },
      onError: () => {
        toast.dismiss();
        toast.error(t('Please correct the errors in the form'));
      }
    });
  };

  const pageActions = [
    {
      label: t('Back'),
      icon: <ArrowLeft className="h-4 w-4" />,
      variant: 'outline' as const,
      onClick: () => router.get(route('express-checkout.index'))
    }
  ];

  const PAYMENT_OPTIONS = [
    { id: 'stripe', name: t('Stripe'), description: t('Pay securely by card with Stripe.'), icon: CreditCard, badge: t('Cards') },
    { id: 'cod', name: t('Cash on Delivery'), description: t('Pay when your meals are delivered.'), icon: Wallet, badge: t('Cash') },
  ];

  return (
    <PageTemplate 
      title={t('Edit Express Checkout')}
      description={t('Configure a seamless one-click express checkout flow for your store.')}
      url="/express-checkout/edit"
      actions={pageActions}
      breadcrumbs={[
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Express Checkout'), href: route('express-checkout.index') },
        { title: t('Edit Express Checkout') }
      ]}
    >
      <div className="space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center w-full">
          {STEPS.map((s, i) => {
            const done = i < currentStep;
            const active = i === currentStep;
            const hasErr = stepHasError(i);

            return (
              <div key={s.key} className="flex items-center flex-1 last:flex-none">
                <div 
                  className={`flex items-center gap-2 shrink-0 ${done ? 'cursor-pointer' : ''}`}
                  onClick={() => {
                    if (done) setCurrentStep(i);
                  }}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                    hasErr ? 'bg-red-50 border-red-500 text-red-600 dark:bg-red-950/40 dark:border-red-600' :
                    done   ? 'bg-primary border-primary text-white' :
                    active ? 'border-primary text-primary bg-white dark:bg-gray-900' :
                             'border-gray-300 dark:border-gray-600 text-gray-400 bg-white dark:bg-gray-900'
                  }`}>
                    {done && !hasErr ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className={`text-sm font-medium hidden sm:block ${
                    hasErr ? 'text-red-600 dark:text-red-400' :
                    active ? 'text-primary' :
                    done   ? 'text-gray-700 dark:text-gray-300' :
                             'text-gray-400 dark:text-gray-500'
                  }`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-3 transition-colors ${done && !hasErr ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`} />
                )}
              </div>
            );
          })}
        </div>

        <form noValidate onSubmit={(e) => e.preventDefault()} className="space-y-6">
          {/* Step 0: General Information */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('Checkout Information')}</CardTitle>
                  <CardDescription>
                    {t('Set up basic details and personalize the checkout button appearance.')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-1 mb-2">
                      <Label htmlFor="name" required>{t('Checkout Name')}</Label>
                      <Input 
                        id="name" 
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder={t('Enter checkout name')}
                        className={combinedErrors.name ? 'border-red-500 focus-visible:ring-red-400' : ''}
                        aria-invalid={!!combinedErrors.name}
                      />
                      <InputError message={combinedErrors.name} />
                    </div>

                    <div className="grid gap-1 mb-2">
                      <Label htmlFor="type" required>{t('Checkout Type')}</Label>
                      <Select value={checkoutType} onValueChange={handleTypeChange} dir={position === 'right' ? 'rtl' : 'ltr'}>
                        <SelectTrigger id="type">
                          <SelectValue placeholder={t('Select Type')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="buy_now">{t('Buy Now')}</SelectItem>
                          <SelectItem value="express_cart">{t('Express Cart')}</SelectItem>
                          <SelectItem value="guest_checkout">{t('Guest Checkout')}</SelectItem>
                          <SelectItem value="mobile_optimized">{t('Mobile Optimized')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-1">
                    <Label htmlFor="description">{t('Description')}</Label>
                    <Textarea 
                      id="description" 
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder={t('Describe this checkout method')} 
                      rows={3}
                    />
                  </div>

                  {/* Button Appearance */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-1 mb-2">
                      <Label htmlFor="button_text">{t('Button Text')}</Label>
                      <Input 
                        id="button_text" 
                        name="button_text"
                        value={formData.button_text}
                        onChange={handleInputChange}
                        placeholder={t('Buy Now')} 
                      />
                    </div>

                    <div className="grid gap-1 mb-2">
                      <Label htmlFor="button_color">{t('Button Color')}</Label>
                      <div className="flex items-center gap-3">
                        <Input 
                          id="button_color" 
                          name="button_color"
                          type="color" 
                          value={formData.button_color}
                          onChange={handleInputChange}
                          className="h-10 w-16 p-1 cursor-pointer shrink-0"
                        />
                        <Input 
                          value={formData.button_color}
                          onChange={handleInputChange}
                          name="button_color"
                          placeholder="#000000"
                          className="font-mono text-sm uppercase max-w-[120px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Checkout Status */}
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="space-y-0.5">
                      <Label htmlFor="is_active" className="text-sm font-medium cursor-pointer">
                        {t('Checkout Status')}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t('Enable or disable this checkout')}
                      </p>
                    </div>
                    <Switch 
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => handleSwitchChange('is_active', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 1: Payment Methods */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('Payment Methods')}</CardTitle>
                  <CardDescription>
                    {t('Select which payment options customers can use and configure the default payment method.')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-sm font-semibold">{t('Enabled Payment Gateways')}</Label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-3">
                      {PAYMENT_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        const isSelected = formData.payment_methods.includes(opt.id);
                        return (
                          <div
                            key={opt.id}
                            onClick={() => handlePaymentMethodChange(opt.id, !isSelected)}
                            className={`relative flex items-start gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                              isSelected
                                ? 'border-primary bg-primary/[0.03] shadow-sm'
                                : 'border-border/60 hover:border-border hover:bg-muted/30'
                            }`}
                          >
                            <div onClick={(e) => e.stopPropagation()} className="mt-0.5 shrink-0">
                              <Checkbox 
                                id={opt.id}
                                checked={isSelected}
                                onCheckedChange={(checked) => handlePaymentMethodChange(opt.id, !!checked)}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold flex items-center gap-1.5 select-none">
                                  <Icon className="h-4 w-4 text-primary shrink-0" />
                                  <span>{opt.name}</span>
                                </span>
                                <BadgeUI className={isSelected ? 'bg-primary/10 text-primary ring-primary/20 dark:bg-primary/20 dark:text-primary dark:ring-primary/30' : 'bg-muted text-muted-foreground ring-border'}>
                                  {opt.badge}
                                </BadgeUI>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 select-none">
                                {opt.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <InputError message={combinedErrors.payment_methods} />
                  </div>

                  {/* Default Payment Method */}
                  <div className="grid gap-1.5 pt-2">
                    <Label htmlFor="default_payment" className="text-sm font-semibold">
                      {t('Default Payment Method')}
                    </Label>
                    <Select 
                      value={formData.default_payment_method}
                      onValueChange={handleDefaultPaymentChange}
                    >
                      <SelectTrigger id="default_payment" className="w-full">
                        <SelectValue placeholder={t('Select default payment')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stripe">{t('Stripe')}</SelectItem>
                        <SelectItem value="cod">{t('Cash on Delivery')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Checkout Settings */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('Checkout Settings & Behavior')}</CardTitle>
                  <CardDescription>
                    {t('Fine-tune checkout features, customer automation, and redirect endpoints.')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Experience Toggles */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">{t('Customer Experience Options')}</Label>
                    
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between p-3.5 rounded-lg border bg-card hover:bg-muted/10 transition-colors">
                        <div className="flex items-start gap-3">
                          <ShoppingCart className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                          <div>
                            <Label htmlFor="skip_cart" className="text-sm font-medium cursor-pointer">
                              {t('Skip Cart Page')}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {t('Go directly to checkout')}
                            </p>
                          </div>
                        </div>
                        <Switch 
                          id="skip_cart"
                          checked={formData.skip_cart}
                          onCheckedChange={(checked) => handleSwitchChange('skip_cart', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-lg border bg-card hover:bg-muted/10 transition-colors">
                        <div className="flex items-start gap-3">
                          <ShieldCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                          <div>
                            <Label htmlFor="auto_fill_customer_data" className="text-sm font-medium cursor-pointer">
                              {t('Auto-fill Customer Data')}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {t('Use saved customer information')}
                            </p>
                          </div>
                        </div>
                        <Switch 
                          id="auto_fill_customer_data"
                          checked={formData.auto_fill_customer_data}
                          onCheckedChange={(checked) => handleSwitchChange('auto_fill_customer_data', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-lg border bg-card hover:bg-muted/10 transition-colors">
                        <div className="flex items-start gap-3">
                          <Zap className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                          <div>
                            <Label htmlFor="guest_checkout_allowed" className="text-sm font-medium cursor-pointer">
                              {t('Guest Checkout Allowed')}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {t('Allow checkout without account')}
                            </p>
                          </div>
                        </div>
                        <Switch 
                          id="guest_checkout_allowed"
                          checked={formData.guest_checkout_allowed}
                          onCheckedChange={(checked) => handleSwitchChange('guest_checkout_allowed', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-lg border bg-card hover:bg-muted/10 transition-colors">
                        <div className="flex items-start gap-3">
                          <Smartphone className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                          <div>
                            <Label htmlFor="mobile_optimized" className="text-sm font-medium cursor-pointer">
                              {t('Mobile Optimized')}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {t('Optimize for mobile devices')}
                            </p>
                          </div>
                        </div>
                        <Switch 
                          id="mobile_optimized"
                          checked={formData.mobile_optimized}
                          onCheckedChange={(checked) => handleSwitchChange('mobile_optimized', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-lg border bg-card hover:bg-muted/10 transition-colors">
                        <div className="flex items-start gap-3">
                          <CreditCard className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                          <div>
                            <Label htmlFor="save_payment_methods" className="text-sm font-medium cursor-pointer">
                              {t('Save Payment Methods')}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {t('Allow customers to save payment info')}
                            </p>
                          </div>
                        </div>
                        <Switch 
                          id="save_payment_methods"
                          checked={formData.save_payment_methods}
                          onCheckedChange={(checked) => handleSwitchChange('save_payment_methods', checked)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Redirect URLs */}
                  <div className="space-y-3 pt-2">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-primary" />
                      {t('Redirect URLs')}
                    </Label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-1 mb-2">
                        <Label htmlFor="success_redirect_url">{t('Success Redirect URL')}</Label>
                        <Input 
                          id="success_redirect_url" 
                          name="success_redirect_url"
                          value={formData.success_redirect_url}
                          onChange={handleInputChange}
                          placeholder={t('https://example.com/thank-you')} 
                          className={combinedErrors.success_redirect_url ? 'border-red-500' : ''}
                        />
                        <InputError message={combinedErrors.success_redirect_url} />
                      </div>

                      <div className="grid gap-1 mb-2">
                        <Label htmlFor="cancel_redirect_url">{t('Cancel Redirect URL')}</Label>
                        <Input 
                          id="cancel_redirect_url" 
                          name="cancel_redirect_url"
                          value={formData.cancel_redirect_url}
                          onChange={handleInputChange}
                          placeholder={t('https://example.com/cart')} 
                          className={combinedErrors.cancel_redirect_url ? 'border-red-500' : ''}
                        />
                        <InputError message={combinedErrors.cancel_redirect_url} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-4">
            {currentStep !== 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(s => s - 1)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('Back')}
              </Button>
            ) : (
              <div />
            )}
            {currentStep < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={() => {
                  if (validateStep(currentStep)) setCurrentStep(s => s + 1);
                }}
              >
                {t('Next')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit}>
                <Save className="h-4 w-4 mr-2" />
                {t('Update')}
              </Button>
            )}
          </div>
        </form>
      </div>
    </PageTemplate>
  );
}