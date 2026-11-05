import React, { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { ArrowLeft, ArrowRight, Check, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import { getStoreThemes } from '@/data/storeThemes';
import MediaPicker from '@/components/MediaPicker';
import InputError from '@/components/input-error';
import { toast } from '@/components/custom-toast';

interface PlanPermissions {
  enable_custdomain: boolean;
  enable_custsubdomain: boolean;
  pwa_business: boolean;
}

interface CreateStoreProps {
  availableThemes: string[] | null;
  planPermissions: PlanPermissions;
  serverIp: string;
}

export default function CreateStore({ availableThemes, planPermissions, serverIp }: CreateStoreProps) {
  const { errors } = usePage().props as any;
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    email: '',
    theme: 'gadgets',
    enable_custom_domain: false,
    enable_custom_subdomain: false,
    custom_domain: '',
    custom_subdomain: '',
    // PWA fields
    enable_pwa: false,
    pwa_name: '',
    pwa_short_name: '',
    pwa_description: '',
    pwa_theme_color: '#3B82F6',
    pwa_background_color: '#ffffff',
    pwa_display: 'standalone',
    pwa_orientation: 'portrait',
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const combinedErrors = { ...errors, ...localErrors };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    if (localErrors[id]) {
      setLocalErrors(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleSwitchChange = (field: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked,
      // If enabling one, disable the other
      ...(field === 'enable_custom_domain' && checked ? { enable_custom_subdomain: false } : {}),
      ...(field === 'enable_custom_subdomain' && checked ? { enable_custom_domain: false } : {}),
    }));
    setLocalErrors(prev => {
      const next = { ...prev };
      if (field === 'enable_custom_domain' || field === 'enable_custom_subdomain') {
        delete next.custom_domain;
        delete next.custom_subdomain;
      }
      if (field === 'enable_pwa') {
        delete next.pwa_name;
        delete next.pwa_short_name;
      }
      return next;
    });
  };

  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!formData.name) e.name = t('Store name is required');
      if (!formData.email) e.email = t('Store email is required');
      if (formData.enable_custom_domain && !formData.custom_domain) {
        e.custom_domain = t('Custom domain is required');
      }
      if (formData.enable_custom_subdomain && !formData.custom_subdomain) {
        e.custom_subdomain = t('Custom subdomain is required');
      }
    }
    if (s === 2 && planPermissions?.pwa_business && formData.enable_pwa) {
      if (!formData.pwa_name) e.pwa_name = t('App name is required');
      if (!formData.pwa_short_name) e.pwa_short_name = t('Short name is required');
    }
    setLocalErrors(e);
    return Object.keys(e).length === 0;
  };

  const STEP_FIELDS: Record<number, string[]> = {
    0: ['name', 'email', 'custom_domain', 'custom_subdomain'],
    1: ['theme'],
    2: ['pwa_name', 'pwa_short_name'],
  };

  const stepHasError = (i: number) => {
    const fields = STEP_FIELDS[i] || [];
    return fields.some(f => combinedErrors[f]);
  };

  const STEPS = [
    { key: 'info', label: t('Store Information') },
    { key: 'theme', label: t('Store Theme') },
    ...(planPermissions?.pwa_business ? [{ key: 'pwa', label: t('PWA Settings') }] : [])
  ];

  const handleSubmit = () => {
    if (!validateStep(currentStep)) return;
    toast.loading(t('Creating store...'));
    router.post(route('stores.store'), formData, {
      onSuccess: (page) => {
        toast.dismiss();
        if (page.props.flash.success) {
          toast.success(t(page.props.flash.success));
        } else if (page.props.flash.error) {
          toast.error(t(page.props.flash.error));
        }
      },
      onError: (errors) => {
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
      onClick: () => router.get(route('stores.index'))
    }
  ];

  return (
    <PageTemplate
      title={t('Create Store')}
      url="/stores/create"
      actions={pageActions}
      breadcrumbs={[
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Store Management'), href: route('stores.index') },
        { title: t('Create Store') }
      ]}
      description={t('Create a new store with theme selection.')}
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
                <div className="flex items-center gap-2 shrink-0">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                    hasErr ? 'bg-red-50 border-red-500 text-red-600' :
                    done   ? 'bg-primary border-primary text-white' :
                    active ? 'border-primary text-primary bg-white dark:bg-gray-900' :
                             'border-gray-300 dark:border-gray-600 text-gray-400 bg-white dark:bg-gray-900'
                  }`}>
                    {done && !hasErr ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className={`text-sm font-medium hidden sm:block ${
                    hasErr ? 'text-red-600' :
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
          {/* Step 0: Store Information */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('Store Information')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="grid gap-1 mb-4">
                      <Label htmlFor="name" required>{t('Store Name')}</Label>
                      <Input
                        id="name"
                        placeholder={t('Enter store name')}
                        value={formData.name}
                        onChange={handleChange}
                        className={combinedErrors.name ? 'border-red-500' : ''}
                        aria-invalid={!!combinedErrors.name}
                      />
                      <InputError message={combinedErrors.name} />
                    </div>
                    <div className="grid gap-1 mb-4">
                      <Label htmlFor="slug">{t('Store Slug')}</Label>
                      <Input id="slug" placeholder={t('store-slug')} disabled />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">{t('Description')}</Label>
                    <Textarea id="description" placeholder={t('Store description')} value={formData.description} onChange={handleChange} />
                  </div>
                  <div className="grid gap-1 mb-4">
                    <Label htmlFor="email" required>{t('Store Email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t('store@example.com')}
                      value={formData.email}
                      onChange={handleChange}
                      className={combinedErrors.email ? 'border-red-500' : ''}
                      aria-invalid={!!combinedErrors.email}
                    />
                    <InputError message={combinedErrors.email} />
                  </div>
                </CardContent>
              </Card>

              {/* Domain Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('Domain Configuration')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Custom Domain */}
                  {planPermissions?.enable_custdomain && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <Label htmlFor="enable_custom_domain">{t('Enable Custom Domain')}</Label>
                          <p className="text-sm text-muted-foreground">
                            {t('Use your own domain (e.g., example.com)')}
                          </p>
                        </div>
                        <Switch
                          id="enable_custom_domain"
                          checked={formData.enable_custom_domain}
                          onCheckedChange={(checked) => handleSwitchChange('enable_custom_domain', checked)}
                        />
                      </div>
                      {formData.enable_custom_domain && (
                        <div className="grid gap-1 mb-4">
                          <Label htmlFor="custom_domain" required>{t('Custom Domain')}</Label>
                          <Input
                            id="custom_domain"
                            placeholder={t('example.com')}
                            value={formData.custom_domain}
                            onChange={handleChange}
                            className={combinedErrors.custom_domain ? 'border-red-500' : ''}
                            aria-invalid={!!combinedErrors.custom_domain}
                            required
                          />
                          <InputError message={combinedErrors.custom_domain} />
                          <div className="mt-2 p-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md sm:p-3">
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                              <strong>{t('Your Server IP Is:')} {serverIp}</strong>
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              {t('Point your domain A record to this IP address')}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Custom Subdomain */}
                  {planPermissions?.enable_custsubdomain && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <Label htmlFor="enable_custom_subdomain">{t('Enable Custom Subdomain')}</Label>
                          <p className="text-sm text-muted-foreground">
                            {t('Use a subdomain (e.g., mystore.yourdomain.com)')}
                          </p>
                        </div>
                        <Switch
                          id="enable_custom_subdomain"
                          checked={formData.enable_custom_subdomain}
                          onCheckedChange={(checked) => handleSwitchChange('enable_custom_subdomain', checked)}
                        />
                      </div>
                      {formData.enable_custom_subdomain && (
                        <div className="grid gap-1 mb-4">
                          <Label htmlFor="custom_subdomain" required>{t('Subdomain')}</Label>
                          <Input
                            id="custom_subdomain"
                            placeholder={t('mystore')}
                            value={formData.custom_subdomain}
                            onChange={handleChange}
                            className={combinedErrors.custom_subdomain ? 'border-red-500' : ''}
                            aria-invalid={!!combinedErrors.custom_subdomain}
                            required
                          />
                          <InputError message={combinedErrors.custom_subdomain} />
                          <div className="mt-2 p-2.5 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md sm:p-3">
                            <p className="text-sm text-green-800 dark:text-green-300">
                              <strong>{t('Your Sub Domain IP Is:')} {serverIp}</strong>
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                              {t('Will create: {{subdomain}}.yourdomain.com', { subdomain: formData.custom_subdomain || 'mystore' })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!planPermissions?.enable_custdomain && !planPermissions?.enable_custsubdomain && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        {t('Domain features are not available in your current plan. Your store will be accessible via slug-based URL.')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 1: Store Theme */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('Store Theme')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('Choose a theme that best fits your store type and brand.')}
                </p>

                {availableThemes !== null && (
                  <div className="mb-4 p-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md sm:p-3">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      <strong>{t('Plan Limitation')}:</strong> {t('Your current plan allows access to {{count}} theme(s).', { count: availableThemes.length })}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getStoreThemes().filter(theme =>
                    availableThemes === null || availableThemes.includes(theme.id)
                  ).map((theme) => (
                    <div
                      key={theme.id}
                      className={`cursor-pointer rounded-lg border-2 p-1 transition-all duration-200 ${formData.theme === theme.id ? 'border-primary' : 'border-gray-200 hover:border-gray-300 dark:border-zinc-800 dark:hover:border-zinc-700'
                        }`}
                      onClick={() => setFormData(prev => ({ ...prev, theme: theme.id }))}
                    >
                      <div className="relative aspect-video overflow-hidden rounded-md theme-preview-container">
                        <img
                          src={theme.thumbnail}
                          alt={theme.name}
                          className="h-full w-full object-cover theme-preview-image"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://placehold.co/300x180?text=${encodeURIComponent(theme.name)}`;
                          }}
                        />
                        {formData.theme === theme.id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                            <div className="rounded-full bg-primary p-1">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <h3 className="font-medium text-sm">{theme.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {theme.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: PWA Settings */}
          {currentStep === 2 && planPermissions?.pwa_business && (
            <Card>
              <CardHeader>
                <CardTitle>{t('PWA Settings')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <Label htmlFor="enable_pwa">{t('Enable PWA')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('Make your store installable as a mobile app')}
                    </p>
                  </div>
                  <Switch
                    id="enable_pwa"
                    checked={formData.enable_pwa}
                    onCheckedChange={(checked) => handleSwitchChange('enable_pwa', checked)}
                  />
                </div>

                {formData.enable_pwa && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="pwa_name" required>{t('App Name')}</Label>
                        <Input
                          id="pwa_name"
                          placeholder={t('My Store App')}
                          value={formData.pwa_name}
                          onChange={handleChange}
                          className={combinedErrors.pwa_name ? 'border-red-500' : ''}
                          aria-invalid={!!combinedErrors.pwa_name}
                        />
                        <InputError message={combinedErrors.pwa_name} />
                      </div>
                      <div>
                        <Label htmlFor="pwa_short_name" required>{t('Short Name')}</Label>
                        <Input
                          id="pwa_short_name"
                          placeholder={t('MyStore')}
                          maxLength={12}
                          value={formData.pwa_short_name}
                          onChange={handleChange}
                          className={combinedErrors.pwa_short_name ? 'border-red-500' : ''}
                          aria-invalid={!!combinedErrors.pwa_short_name}
                        />
                        <InputError message={combinedErrors.pwa_short_name} />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="pwa_description">{t('App Description')}</Label>
                      <Textarea
                        id="pwa_description"
                        placeholder={t('Description for your mobile app')}
                        value={formData.pwa_description}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="pwa_theme_color">{t('Theme Color')}</Label>
                        <Input
                          id="pwa_theme_color"
                          type="color"
                          value={formData.pwa_theme_color}
                          onChange={handleChange}
                          className="h-10 p-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="pwa_background_color">{t('Background Color')}</Label>
                        <Input
                          id="pwa_background_color"
                          type="color"
                          value={formData.pwa_background_color}
                          onChange={handleChange}
                          className="h-10 p-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="pwa_display">{t('Display Mode')}</Label>
                        <select
                          id="pwa_display"
                          value={formData.pwa_display}
                          onChange={handleChange}
                          className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-800"
                        >
                          <option value="standalone">{t('Standalone')}</option>
                          <option value="fullscreen">{t('Fullscreen')}</option>
                          <option value="minimal-ui">{t('Minimal UI')}</option>
                          <option value="browser">{t('Browser')}</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="pwa_orientation">{t('Orientation')}</Label>
                        <select
                          id="pwa_orientation"
                          value={formData.pwa_orientation}
                          onChange={handleChange}
                          className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-800"
                        >
                          <option value="portrait">{t('Portrait')}</option>
                          <option value="landscape">{t('Landscape')}</option>
                          <option value="any">{t('Any')}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
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
              <div></div>
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
                {t('Save Store')}
              </Button>
            )}
          </div>
        </form>
      </div>
    </PageTemplate>
  );
}