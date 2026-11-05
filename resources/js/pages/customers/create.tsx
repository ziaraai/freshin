import React, { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Save,
  User,
  MapPin,
  Sliders,
  Mail,
  Phone,
  CheckCircle2,
  Truck,
  Bell
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import MediaPicker from '@/components/MediaPicker';
import { LocationDropdowns } from '@/components/LocationDropdowns';
import InputError from '@/components/input-error';
import { hasPermission } from '@/utils/permissions';
import { toast } from '@/components/custom-toast';

export default function CreateCustomer() {
  const { t } = useTranslation();
  const { errors = {} } = usePage().props as any;

  const [currentStep, setCurrentStep] = useState(0);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const combinedErrors = { ...errors, ...localErrors };

  const [avatar, setAvatar] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    notes: '',
    is_active: true,
    preferred_language: 'en',
    customer_group: 'regular',
    email_marketing: true,
    sms_notifications: false,
    order_updates: true,
    billing_address: {
      address: '',
      city: '',
      state: '',
      postal_code: '',
      country: ''
    },
    shipping_address: {
      address: '',
      city: '',
      state: '',
      postal_code: '',
      country: ''
    },
    same_as_billing: false
  });

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

  const handleAddressChange = (type: 'billing_address' | 'shipping_address', field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    if (name === 'same_as_billing' && checked) {
      setFormData(prev => ({
        ...prev,
        same_as_billing: checked,
        shipping_address: { ...prev.billing_address }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressSelectChange = (type: 'billing_address' | 'shipping_address', field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
  };

  // Step Validation
  const validateStep = (stepIndex: number): boolean => {
    const errs: Record<string, string> = {};
    if (stepIndex === 0) {
      if (!formData.first_name.trim()) errs.first_name = t('First name is required');
      if (!formData.last_name.trim()) errs.last_name = t('Last name is required');
      if (!formData.email.trim()) {
        errs.email = t('Email address is required');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errs.email = t('Please enter a valid email address');
      }
    }
    setLocalErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const STEP_FIELDS: Record<number, string[]> = {
    0: ['first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'gender'],
    1: ['billing_address', 'shipping_address'],
    2: ['is_active', 'customer_group', 'preferred_language'],
  };

  const stepHasError = (i: number) => {
    const fields = STEP_FIELDS[i] || [];
    return fields.some(f => combinedErrors[f]);
  };

  const STEPS = [
    { key: 'info', label: t('Customer Information'), icon: User },
    { key: 'address', label: t('Address Details'), icon: MapPin },
    { key: 'preferences', label: t('Account & Preferences'), icon: Sliders },
  ];

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateStep(0)) {
      setCurrentStep(0);
      return;
    }

    const submitData = {
      ...formData,
      avatar
    };

    router.post(route('customers.store'), submitData, {
      onSuccess: (page: any) => {
        if (page?.props?.flash?.success) {
          toast.success(t(page.props.flash.success));
        } else if (page?.props?.flash?.error) {
          toast.error(t(page.props.flash.error));
        }
      },
      onError: (errors: any) => {
        const errorMessage = (errors && Object.values(errors).join(', ')) || t('Failed to create customer');
        toast.error(errorMessage);
      }
    });
  };

  const pageActions = [
    {
      label: t('Back'),
      icon: <ArrowLeft className="h-4 w-4" />,
      variant: 'outline' as const,
      onClick: () => router.visit(route('customers.index'))
    }
  ];

  return (
    <PageTemplate
      title={t('Create Customer')}
      url="/customers/create"
      actions={pageActions}
      breadcrumbs={[
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Customer Management'), href: route('customers.index') },
        { title: t('Create Customer') }
      ]}
      description={t('Add a new customer profile, setup address details, and manage communication preferences.')}
    >
      <div className="space-y-6">
        {/* Step Indicator Header */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center w-full">
            {STEPS.map((s, i) => {
              const done = i < currentStep;
              const active = i === currentStep;
              const hasErr = stepHasError(i);

              return (
                <div key={s.key} className="flex items-center flex-1 last:flex-none">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(i)}
                    className="flex items-center gap-2.5 shrink-0 cursor-pointer group text-left rtl:text-right focus:outline-hidden"
                  >
                    <div className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all ${hasErr ? 'bg-red-50 border-red-500 text-red-600 dark:bg-red-950/40' :
                        done ? 'bg-primary border-primary text-white group-hover:opacity-90' :
                          active ? 'border-primary text-primary bg-white dark:bg-zinc-900 ring-2 ring-primary/20' :
                            'border-zinc-300 dark:border-zinc-700 text-zinc-400 bg-white dark:bg-zinc-900 group-hover:border-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'
                      }`}>
                      {done && !hasErr ? <Check className="h-4 w-4" /> : i + 1}
                    </div>
                    <span className={`text-xs sm:text-sm font-medium hidden sm:block transition-colors ${hasErr ? 'text-red-600 dark:text-red-400' :
                        active ? 'text-primary font-semibold' :
                          done ? 'text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white' :
                            'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'
                      }`}>
                      {s.label}
                    </span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-3 sm:mx-4 transition-colors ${done && !hasErr ? 'bg-primary' : 'bg-zinc-200 dark:bg-zinc-800'
                      }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP CONTENT FORMS */}
        <form noValidate onSubmit={(e) => e.preventDefault()} className="space-y-6">
          {/* STEP 0: CUSTOMER INFORMATION */}
          {currentStep === 0 && (
            <Card className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
              <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  {t('Customer Information')}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {t('Personal profile and direct contact details')}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 space-y-5">
                {/* Profile Picture Upload */}
                <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 p-4">
                  <MediaPicker
                    label={t('Profile Picture')}
                    value={avatar}
                    onChange={setAvatar}
                    placeholder={t('Select profile avatar...')}
                    shape="circle"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('Upload customer photo or avatar for easier identification.')}
                  </p>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="first_name" required>{t('First Name')}</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      placeholder={t('e.g. John')}
                      aria-invalid={!!combinedErrors.first_name}
                      className={`rounded-lg ${combinedErrors.first_name ? 'border-red-500' : ''}`}
                    />
                    <InputError message={combinedErrors.first_name} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="last_name" required>{t('Last Name')}</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      placeholder={t('e.g. Doe')}
                      aria-invalid={!!combinedErrors.last_name}
                      className={`rounded-lg ${combinedErrors.last_name ? 'border-red-500' : ''}`}
                    />
                    <InputError message={combinedErrors.last_name} />
                  </div>
                </div>

                {/* Email and Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" required>{t('Email Address')}</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder={t('customer@example.com')}
                        aria-invalid={!!combinedErrors.email}
                        className={`rounded-lg pl-9 rtl:pl-3 rtl:pr-9 ${combinedErrors.email ? 'border-red-500' : ''}`}
                      />
                      <Mail className="h-4 w-4 text-muted-foreground absolute left-3 rtl:left-auto rtl:right-3 top-3 pointer-events-none" />
                    </div>
                    <InputError message={combinedErrors.email} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">{t('Phone Number')}</Label>
                    <div className="relative">
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder={t('+1 (555) 123-4567')}
                        aria-invalid={!!combinedErrors.phone}
                        className="rounded-lg pl-9 rtl:pl-3 rtl:pr-9"
                        // dir="ltr"
                      />
                      <Phone className="h-4 w-4 text-muted-foreground absolute left-3 rtl:left-auto rtl:right-3 top-3 pointer-events-none" />
                    </div>
                    <InputError message={combinedErrors.phone} />
                  </div>
                </div>

                {/* DOB and Gender */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="date_of_birth">{t('Date of Birth')}</Label>
                    <Input
                      id="date_of_birth"
                      name="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      aria-invalid={!!combinedErrors.date_of_birth}
                      className="rounded-lg"
                    />
                    <InputError message={combinedErrors.date_of_birth} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="gender">{t('Gender')}</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => handleSelectChange('gender', value)}
                    >
                      <SelectTrigger aria-invalid={!!combinedErrors.gender} className="rounded-lg">
                        <SelectValue placeholder={t('Select gender')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">{t('Male')}</SelectItem>
                        <SelectItem value="female">{t('Female')}</SelectItem>
                        <SelectItem value="other">{t('Other')}</SelectItem>
                        <SelectItem value="prefer_not_to_say">{t('Prefer not to say')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <InputError message={combinedErrors.gender} />
                  </div>
                </div>

                {/* Customer Notes */}
                <div className="space-y-1.5">
                  <Label htmlFor="notes">{t('Customer Notes')}</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder={t('Add internal notes, special customer requirements, or remarks...')}
                    aria-invalid={!!combinedErrors.notes}
                    rows={3}
                    className="rounded-lg resize-y"
                  />
                  <InputError message={combinedErrors.notes} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 1: ADDRESS DETAILS */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Billing Address Card */}
              <Card className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
                <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    {t('Billing Address')}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {t('Primary invoice and billing destination')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 sm:p-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="billing_address">{t('Street Address')}</Label>
                    <Input
                      id="billing_address"
                      value={formData.billing_address.address}
                      onChange={(e) => handleAddressChange('billing_address', 'address', e.target.value)}
                      placeholder={t('123 Main Street, Suite 400')}
                      className="rounded-lg"
                    />
                  </div>

                  {/* Dynamic Country, State, City Dropdowns */}
                  <LocationDropdowns
                    countryValue={formData.billing_address.country}
                    stateValue={formData.billing_address.state}
                    cityValue={formData.billing_address.city}
                    onCountryChange={(value) => handleAddressSelectChange('billing_address', 'country', value)}
                    onStateChange={(value) => handleAddressSelectChange('billing_address', 'state', value)}
                    onCityChange={(value) => handleAddressSelectChange('billing_address', 'city', value)}
                  />

                  <div className="space-y-1.5">
                    <Label htmlFor="billing_postal">{t('Postal Code')}</Label>
                    <Input
                      id="billing_postal"
                      value={formData.billing_address.postal_code}
                      onChange={(e) => handleAddressChange('billing_address', 'postal_code', e.target.value)}
                      placeholder={t('10001')}
                      className="rounded-lg"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address Card */}
              <Card className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
                <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                        <Truck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        {t('Shipping Address')}
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        {t('Destination address for physical order fulfillment')}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2.5 bg-zinc-50 dark:bg-zinc-800/80 px-3.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700">
                      <Switch
                        id="same_as_billing_toggle"
                        checked={formData.same_as_billing}
                        onCheckedChange={(checked) => handleSwitchChange('same_as_billing', checked)}
                      />
                      <Label htmlFor="same_as_billing_toggle" className="text-xs font-semibold cursor-pointer">
                        {t('Same as billing')}
                      </Label>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5 sm:p-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="shipping_address">{t('Street Address')}</Label>
                    <Input
                      id="shipping_address"
                      value={formData.shipping_address.address}
                      onChange={(e) => handleAddressChange('shipping_address', 'address', e.target.value)}
                      disabled={formData.same_as_billing}
                      placeholder={t('123 Main Street, Suite 400')}
                      className="rounded-lg"
                    />
                  </div>

                  {/* Dynamic Country, State, City Dropdowns */}
                  <LocationDropdowns
                    countryValue={formData.shipping_address.country}
                    stateValue={formData.shipping_address.state}
                    cityValue={formData.shipping_address.city}
                    onCountryChange={(value) => handleAddressSelectChange('shipping_address', 'country', value)}
                    onStateChange={(value) => handleAddressSelectChange('shipping_address', 'state', value)}
                    onCityChange={(value) => handleAddressSelectChange('shipping_address', 'city', value)}
                    disabled={formData.same_as_billing}
                  />

                  <div className="space-y-1.5">
                    <Label htmlFor="shipping_postal">{t('Postal Code')}</Label>
                    <Input
                      id="shipping_postal"
                      value={formData.shipping_address.postal_code}
                      onChange={(e) => handleAddressChange('shipping_address', 'postal_code', e.target.value)}
                      disabled={formData.same_as_billing}
                      placeholder={t('10001')}
                      className="rounded-lg"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* STEP 2: ACCOUNT & PREFERENCES */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Account Status & Tier Card */}
              <Card className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
                <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    {t('Account & Tier Settings')}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {t('Manage account active status and customer tier classification')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 sm:p-6 space-y-5">
                  {/* Active Switch */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                    <div className="space-y-0.5">
                      <Label htmlFor="is_active_toggle" className="text-sm font-semibold cursor-pointer">
                        {t('Active Account')}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {formData.is_active ? t('Account is enabled and can place orders') : t('Account is suspended')}
                      </p>
                    </div>
                    <Switch
                      id="is_active_toggle"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => handleSwitchChange('is_active', checked)}
                    />
                  </div>

                  {/* Customer Group & Preferred Language */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-1.5">
                      <Label htmlFor="customer_group">{t('Customer Group')}</Label>
                      <Select
                        value={formData.customer_group}
                        onValueChange={(value) => handleSelectChange('customer_group', value)}
                      >
                        <SelectTrigger className="rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="regular">{t('Regular Customer')}</SelectItem>
                          <SelectItem value="vip">{t('VIP Customer')}</SelectItem>
                          <SelectItem value="wholesale">{t('Wholesale Customer')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {t('Assigns customer tier for custom pricing, deals, and volume rates.')}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="preferred_language">{t('Preferred Language')}</Label>
                      <Select
                        value={formData.preferred_language}
                        onValueChange={(value) => handleSelectChange('preferred_language', value)}
                      >
                        <SelectTrigger className="rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">{t('English')}</SelectItem>
                          <SelectItem value="es">{t('Spanish')}</SelectItem>
                          <SelectItem value="fr">{t('French')}</SelectItem>
                          <SelectItem value="de">{t('German')}</SelectItem>
                          <SelectItem value="it">{t('Italian')}</SelectItem>
                          <SelectItem value="ar">{t('Arabic')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {t('Notifications and invoices will use this language.')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Communication Preferences Card */}
              <Card className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
                <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                    <Bell className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    {t('Marketing & Notifications')}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {t('Customer communication subscriptions and preferences')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 sm:p-6 space-y-3.5">
                  {/* Email Marketing Switch */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                    <div className="space-y-0.5">
                      <Label htmlFor="email_marketing" className="text-sm font-semibold cursor-pointer">
                        {t('Email Marketing')}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t('Receive newsletters, promotions, and store announcements')}
                      </p>
                    </div>
                    <Switch
                      id="email_marketing"
                      checked={formData.email_marketing}
                      onCheckedChange={(checked) => handleSwitchChange('email_marketing', checked)}
                    />
                  </div>

                  {/* SMS Notifications Switch */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                    <div className="space-y-0.5">
                      <Label htmlFor="sms_notifications" className="text-sm font-semibold cursor-pointer">
                        {t('SMS Notifications')}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t('Receive instant SMS order alerts and shipping delivery updates')}
                      </p>
                    </div>
                    <Switch
                      id="sms_notifications"
                      checked={formData.sms_notifications}
                      onCheckedChange={(checked) => handleSwitchChange('sms_notifications', checked)}
                    />
                  </div>

                  {/* Order Updates Switch */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                    <div className="space-y-0.5">
                      <Label htmlFor="order_updates" className="text-sm font-semibold cursor-pointer">
                        {t('Order Updates')}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t('Receive email updates on order fulfillment and delivery status')}
                      </p>
                    </div>
                    <Switch
                      id="order_updates"
                      checked={formData.order_updates}
                      onCheckedChange={(checked) => handleSwitchChange('order_updates', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Bottom Step Navigation Buttons */}
          <div className="flex justify-between items-center pt-4">
            {currentStep !== 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(s => s - 1)}
                className="rounded-lg"
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
                className="rounded-lg shadow-sm"
              >
                {t('Next')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              hasPermission('create-customers') && (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  className="rounded-lg shadow-sm"
                >
                  <Save className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                  {t('Save Customer')}
                </Button>
              )
            )}
          </div>
        </form>
      </div>
    </PageTemplate>
  );
}