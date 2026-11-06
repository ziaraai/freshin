import React, { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import {
    ArrowLeft,
    Save,
    Facebook,
    Instagram,
    X,
    Youtube,
    Phone,
    Mail,
    Code,
    Palette,
    Globe,
    Image as ImageIcon,
    Layout,
    MapPin,
    Share2,
    MessageSquare,
    AlertTriangle,
    Eye,
    Settings,
    Server,
    CheckCircle2,
    XCircle,
    Info,
    Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import MediaPicker from '@/components/MediaPicker';
import { toast } from '@/components/custom-toast';
import BadgeUI from '@/components/badge-ui';
import { cn } from '@/lib/utils';
import OrderingScheduleSettingsPanel, { defaultOrderingSchedule } from '@/components/ordering-schedule-settings';

interface Props {
    store: any;
    settings: any;
    currencies: any[];
    timezones: Record<string, string>;
}

export default function StoreSettings({ store, settings, currencies, timezones }: Props) {
    const { t } = useTranslation();
    const [formData, setFormData] = useState(() => ({
        ...settings,
        ordering_schedule: { ...defaultOrderingSchedule, ...settings?.ordering_schedule },
    }));
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [activeTab, setActiveTab] = useState('general');

    const handleSave = () => {
        setValidationErrors({});
        toast.loading(t('Saving settings...'));
        router.put(
            route('stores.settings.update', store.id),
            {
                settings: formData,
            },
            {
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
                    if (typeof errors === 'string') {
                        toast.error(t(errors));
                    } else {
                        setValidationErrors(errors);
                        if (Object.keys(errors).some((key) => key.startsWith('settings.ordering_schedule'))) {
                            setActiveTab('ordering');
                        }
                        toast.error(t('Failed to save settings: {{errors}}', { errors: Object.values(errors).join(', ') }));
                    }
                },
            },
        );
    };

    const updateSetting = (key: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [key]: value }));
        setValidationErrors((previous) => Object.fromEntries(
            Object.entries(previous).filter(([field]) => field !== `settings.${key}` && !field.startsWith(`settings.${key}.`)),
        ));
    };

    const pageActions = [
        {
            label: t('Save Settings'),
            icon: <Save className="h-4 w-4" />,
            variant: 'default' as const,
            onClick: handleSave,
        },
    ];

    const isStoreActive = formData.store_status === true || formData.store_status === 'true';
    const isMaintenanceActive = formData.maintenance_mode === true || formData.maintenance_mode === 'true';

    const navItems = [
        {
            id: 'general',
            label: t('Status & Mode'),
            icon: <Globe className="h-4 w-4" />,
            description: t('Configure online visibility'),
        },
        {
            id: 'ordering',
            label: t('Ordering & Delivery'),
            icon: <Clock className="h-4 w-4" />,
            description: t('Opening hours & delivery days'),
        },
        {
            id: 'branding',
            label: t('Branding & Identity'),
            icon: <ImageIcon className="h-4 w-4" />,
            description: t('Manage store logo & favicon'),
        },
        {
            id: 'content',
            label: t('Storefront Content'),
            icon: <Layout className="h-4 w-4" />,
            description: t('Welcome banners & footer'),
        },
        {
            id: 'address',
            label: t('Address & Contact'),
            icon: <MapPin className="h-4 w-4" />,
            description: t('Physical location & support email'),
        },
        {
            id: 'social',
            label: t('Social Profiles'),
            icon: <Share2 className="h-4 w-4" />,
            description: t('Connect your social handles'),
        },
        {
            id: 'whatsapp',
            label: t('WhatsApp Support'),
            icon: <MessageSquare className="h-4 w-4" />,
            description: t('Floating WhatsApp widget'),
        },
        {
            id: 'custom_code',
            label: t('Custom Styles'),
            icon: <Code className="h-4 w-4" />,
            description: t('Inject custom CSS & JS code'),
        },
    ];

    return (
        <PageTemplate
            title={t('Store Settings')}
            url="/stores/settings"
            actions={pageActions}
            backUrl={route('stores.index')}
            breadcrumbs={[
                { title: t('Dashboard'), href: route('dashboard') },
                { title: t('Store Management'), href: route('stores.index') },
                { title: t('Store Settings') },
            ]}
            description={t('Manage your store settings, branding, content, and social profiles.')}
        >
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
                {/* Left Sidebar Navigation Card */}
                <div className="w-full lg:w-72 shrink-0 lg:sticky lg:top-6 self-start">
                    <Card className="border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-2xl bg-white dark:bg-zinc-950 p-2.5 sm:p-3">
                        <div className="flex lg:flex-col gap-1 sm:gap-1.5 overflow-x-auto lg:overflow-x-visible pb-2.5 lg:pb-0 scrollbar-none scroll-smooth">
                            {navItems.map((item) => {
                                const isActive = activeTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setActiveTab(item.id)}
                                        className={cn(
                                            'flex items-center gap-2.5 sm:gap-3 px-3 py-2 sm:px-4 sm:py-3 rounded-xl transition-all duration-200 whitespace-nowrap text-left rtl:text-right w-full border border-transparent',
                                            isActive
                                                ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary font-semibold shadow-sm shadow-primary/5'
                                                : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900/40 dark:hover:text-zinc-100',
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                'p-1.5 rounded-lg transition-colors shrink-0',
                                                isActive
                                                    ? 'bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary'
                                                    : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
                                            )}
                                        >
                                            {item.icon}
                                        </div>
                                        <div className="flex flex-col items-start leading-tight">
                                            <span className="text-sm font-semibold">{item.label}</span>
                                            <span
                                                className={cn(
                                                    'text-[10px] font-normal hidden lg:block mt-0.5',
                                                    isActive ? 'text-primary/70 dark:text-primary/85' : 'text-zinc-400 dark:text-zinc-500',
                                                )}
                                            >
                                                {item.description}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </Card>
                </div>

                {/* Right Tab Content Container */}
                <div className="flex-1 min-w-0 space-y-4 sm:space-y-6">
                    {/* Active Section Banner */}
                    <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-3.5 sm:p-4 dark:border-zinc-800/50 dark:bg-zinc-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                            <div className="p-2 rounded-xl bg-zinc-200/50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 shrink-0 mt-0.5 sm:mt-0">
                                {navItems.find((n) => n.id === activeTab)?.icon}
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                                    {navItems.find((n) => n.id === activeTab)?.label}
                                </h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed break-words">
                                    {t('Updating configurations for store:')}{' '}
                                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{store.name}</span>
                                </p>
                            </div>
                        </div>

                        {/* Status Badges */}
                        <div className="flex shrink-0 items-center gap-2">
                            <BadgeUI
                                className={cn(
                                    isStoreActive
                                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20'
                                        : 'bg-rose-50 text-rose-700 ring-rose-600/10 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20',
                                )}
                            >
                                {isStoreActive ? t('Active') : t('Inactive')}
                            </BadgeUI>
                            {isMaintenanceActive && (
                                <BadgeUI className="bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20">
                                    {t('Maintenance')}
                                </BadgeUI>
                            )}
                        </div>
                    </div>

                    {/* Section 1: General & Status */}
                    {activeTab === 'general' && (
                        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
                            <Card className="border border-zinc-200/80 dark:border-zinc-800 shadow-sm rounded-2xl overflow-hidden">
                                <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 p-4 sm:p-6">
                                    <CardTitle className="text-base font-bold">{t('Visibility & Mode')}</CardTitle>
                                    <CardDescription>
                                        {t('Control your store visibility online and manage maintenance state.')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="divide-y divide-zinc-100 dark:divide-zinc-800 p-0">
                                    {/* Store Status Switch */}
                                    <div className="flex items-center justify-between p-4 sm:p-6">
                                        <div className="space-y-1 pr-4 rtl:pr-0 rtl:pl-4">
                                            <Label className="text-sm font-bold text-zinc-900 dark:text-white">
                                                {t('Store Status')}
                                            </Label>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                {t('Turn off store status to make your store temporarily offline.')}
                                            </p>
                                        </div>
                                        <Switch
                                            checked={isStoreActive}
                                            onCheckedChange={(checked) => updateSetting('store_status', checked)}
                                        />
                                    </div>

                                    {/* Maintenance Mode Switch */}
                                    <div className="flex items-center justify-between p-4 sm:p-6">
                                        <div className="space-y-1 pr-4 rtl:pr-0 rtl:pl-4">
                                            <Label className="text-sm font-bold text-zinc-900 dark:text-white">
                                                {t('Maintenance Mode')}
                                            </Label>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                {t('Show a maintenance page to visitors while you make updates.')}
                                            </p>
                                        </div>
                                        <Switch
                                            checked={isMaintenanceActive}
                                            onCheckedChange={(checked) => updateSetting('maintenance_mode', checked)}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'ordering' && (
                        <OrderingScheduleSettingsPanel
                            value={formData.ordering_schedule}
                            onChange={(value) => updateSetting('ordering_schedule', value)}
                            errors={validationErrors}
                        />
                    )}

                    {/* Section 2: Branding */}
                    {activeTab === 'branding' && (
                        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
                            <Card className="border border-zinc-200/80 dark:border-zinc-800 shadow-sm rounded-2xl">
                                <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 p-4 sm:p-6">
                                    <CardTitle className="text-base font-bold">{t('Store Branding')}</CardTitle>
                                    <CardDescription>
                                        {t('Upload logo and favicon for custom store styling and visual identity.')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                                        {/* Logo picker */}
                                        <div className="p-3.5 sm:p-5 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-900/10 flex flex-col justify-between">
                                            <MediaPicker
                                                label={t('Store Logo')}
                                                value={formData.logo || ''}
                                                onChange={(value) => updateSetting('logo', value)}
                                                placeholder={t('Select store logo...')}
                                                showPreview={true}
                                            />
                                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2.5 sm:mt-4 leading-normal">
                                                {t('Recommended size: 250x150px. Supports PNG, JPG, or SVG.')}
                                            </p>
                                        </div>

                                        {/* Favicon picker */}
                                        <div className="p-3.5 sm:p-5 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-900/10 flex flex-col justify-between">
                                            <MediaPicker
                                                label={t('Store Favicon')}
                                                value={formData.favicon || ''}
                                                onChange={(value) => updateSetting('favicon', value)}
                                                placeholder={t('Select store favicon...')}
                                                showPreview={true}
                                            />
                                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2.5 sm:mt-4 leading-normal">
                                                {t('Recommended size: 32x32px. Supports ICO or PNG.')}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Section 3: Homepage Content */}
                    {activeTab === 'content' && (
                        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
                            <Card className="border border-zinc-200/80 dark:border-zinc-800 shadow-sm rounded-2xl">
                                <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 p-4 sm:p-6">
                                    <CardTitle className="text-base font-bold">{t('Homepage Content')}</CardTitle>
                                    <CardDescription>
                                        {t('Personalize storefront greeting messages, summary text, and footer declarations.')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-6 space-y-3.5 sm:space-y-5">
                                    {/* Welcome Message */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="welcome_message" className="text-sm font-semibold">
                                            {t('Welcome Message')}
                                        </Label>
                                        <Input
                                            id="welcome_message"
                                            value={formData.welcome_message || ''}
                                            onChange={(e) => updateSetting('welcome_message', e.target.value)}
                                            placeholder={t('Welcome to our store!')}
                                            className="rounded-xl border-zinc-200 focus-visible:ring-zinc-900 dark:border-zinc-800 dark:focus-visible:ring-zinc-100"
                                        />
                                    </div>

                                    {/* Store Description */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="store_description" className="text-sm font-semibold">
                                            {t('Store Description')}
                                        </Label>
                                        <Textarea
                                            id="store_description"
                                            value={formData.store_description || ''}
                                            onChange={(e) => updateSetting('store_description', e.target.value)}
                                            placeholder={t('Brief description of your store...')}
                                            rows={4}
                                            className="rounded-xl border-zinc-200 focus-visible:ring-zinc-900 dark:border-zinc-800 dark:focus-visible:ring-zinc-100"
                                        />
                                    </div>

                                    {/* Copyright Text */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="copyright_text" className="text-sm font-semibold">
                                            {t('Copyright Text')}
                                        </Label>
                                        <Input
                                            id="copyright_text"
                                            value={formData.copyright_text || ''}
                                            onChange={(e) => updateSetting('copyright_text', e.target.value)}
                                            placeholder={t('© 2026 Your Store Name. All rights reserved.')}
                                            className="rounded-xl border-zinc-200 focus-visible:ring-zinc-900 dark:border-zinc-800 dark:focus-visible:ring-zinc-100"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Section 4: Contact & Address */}
                    {activeTab === 'address' && (
                        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
                            <Card className="border border-zinc-200/80 dark:border-zinc-800 shadow-sm rounded-2xl">
                                <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 p-4 sm:p-6">
                                    <CardTitle className="text-base font-bold">{t('Contact Information & Address')}</CardTitle>
                                    <CardDescription>
                                        {t('Your physical store location details and primary support contact email.')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-6 space-y-3.5 sm:space-y-5">
                                    {/* Address */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="address" className="text-sm font-semibold">
                                            {t('Address')}
                                        </Label>
                                        <Input
                                            id="address"
                                            value={formData.address || ''}
                                            onChange={(e) => updateSetting('address', e.target.value)}
                                            placeholder={t('123 Main Street')}
                                            className="rounded-xl border-zinc-200 focus-visible:ring-zinc-900 dark:border-zinc-800 dark:focus-visible:ring-zinc-100"
                                        />
                                    </div>

                                    {/* City & State */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-5">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="city" className="text-sm font-semibold">
                                                {t('City')}
                                            </Label>
                                            <Input
                                                id="city"
                                                value={formData.city || ''}
                                                onChange={(e) => updateSetting('city', e.target.value)}
                                                placeholder={t('New York')}
                                                className="rounded-xl border-zinc-200 focus-visible:ring-zinc-900 dark:border-zinc-800 dark:focus-visible:ring-zinc-100"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="state" className="text-sm font-semibold">
                                                {t('State/Province')}
                                            </Label>
                                            <Input
                                                id="state"
                                                value={formData.state || ''}
                                                onChange={(e) => updateSetting('state', e.target.value)}
                                                placeholder={t('NY')}
                                                className="rounded-xl border-zinc-200 focus-visible:ring-zinc-900 dark:border-zinc-800 dark:focus-visible:ring-zinc-100"
                                            />
                                        </div>
                                    </div>

                                    {/* Country & Zip */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-5">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="country" className="text-sm font-semibold">
                                                {t('Country')}
                                            </Label>
                                            <Input
                                                id="country"
                                                value={formData.country || ''}
                                                onChange={(e) => updateSetting('country', e.target.value)}
                                                placeholder={t('United States')}
                                                className="rounded-xl border-zinc-200 focus-visible:ring-zinc-900 dark:border-zinc-800 dark:focus-visible:ring-zinc-100"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="postal_code" className="text-sm font-semibold">
                                                {t('Postal Code')}
                                            </Label>
                                            <Input
                                                id="postal_code"
                                                value={formData.postal_code || ''}
                                                onChange={(e) => updateSetting('postal_code', e.target.value)}
                                                placeholder={t('10001')}
                                                className="rounded-xl border-zinc-200 focus-visible:ring-zinc-900 dark:border-zinc-800 dark:focus-visible:ring-zinc-100"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Section 5: Social Profiles */}
                    {activeTab === 'social' && (
                        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
                            <Card className="border border-zinc-200/80 dark:border-zinc-800 shadow-sm rounded-2xl">
                                <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 p-4 sm:p-6">
                                    <CardTitle className="text-base font-bold">{t('Social Media Links')}</CardTitle>
                                    <CardDescription>
                                        {t('Input URLs to add direct social profile access buttons on the storefront.')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-6">
                                        {/* Facebook */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Facebook className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                <Label htmlFor="facebook_url" className="text-sm font-semibold">
                                                    {t('Facebook URL')}
                                                </Label>
                                            </div>
                                            <Input
                                                id="facebook_url"
                                                value={formData.facebook_url || ''}
                                                onChange={(e) => updateSetting('facebook_url', e.target.value)}
                                                placeholder="https://facebook.com/yourstore"
                                                className="rounded-xl border-zinc-200 focus-visible:ring-zinc-900 dark:border-zinc-800 dark:focus-visible:ring-zinc-100"
                                            />
                                        </div>

                                        {/* Instagram */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Instagram className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                                                <Label htmlFor="instagram_url" className="text-sm font-semibold">
                                                    {t('Instagram URL')}
                                                </Label>
                                            </div>
                                            <Input
                                                id="instagram_url"
                                                value={formData.instagram_url || ''}
                                                onChange={(e) => updateSetting('instagram_url', e.target.value)}
                                                placeholder="https://instagram.com/yourstore"
                                                className="rounded-xl border-zinc-200 focus-visible:ring-zinc-900 dark:border-zinc-800 dark:focus-visible:ring-zinc-100"
                                            />
                                        </div>

                                        {/* X / Twitter */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 mb-1">
                                                <svg
                                                    className="w-4 h-4 fill-zinc-900 dark:fill-zinc-100"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                                </svg>
                                                <Label htmlFor="twitter_url" className="text-sm font-semibold">
                                                    {t('Twitter URL')}
                                                </Label>
                                            </div>
                                            <Input
                                                id="twitter_url"
                                                value={formData.twitter_url || ''}
                                                onChange={(e) => updateSetting('twitter_url', e.target.value)}
                                                placeholder="https://x.com/yourstore"
                                                className="rounded-xl border-zinc-200 focus-visible:ring-zinc-900 dark:border-zinc-800 dark:focus-visible:ring-zinc-100"
                                            />
                                        </div>

                                        {/* YouTube */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Youtube className="h-4 w-4 text-red-600 dark:text-red-400" />
                                                <Label htmlFor="youtube_url" className="text-sm font-semibold">
                                                    {t('YouTube URL')}
                                                </Label>
                                            </div>
                                            <Input
                                                id="youtube_url"
                                                value={formData.youtube_url || ''}
                                                onChange={(e) => updateSetting('youtube_url', e.target.value)}
                                                placeholder="https://youtube.com/yourstore"
                                                className="rounded-xl border-zinc-200 focus-visible:ring-zinc-900 dark:border-zinc-800 dark:focus-visible:ring-zinc-100"
                                            />
                                        </div>

                                        {/* WhatsApp URL */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 mb-1">
                                                <svg className="w-4 h-4 fill-emerald-500" viewBox="0 0 24 24">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488" />
                                                </svg>
                                                <Label htmlFor="whatsapp_url" className="text-sm font-semibold">
                                                    {t('WhatsApp URL')}
                                                </Label>
                                            </div>
                                            <Input
                                                id="whatsapp_url"
                                                value={formData.whatsapp_url || ''}
                                                onChange={(e) => updateSetting('whatsapp_url', e.target.value)}
                                                placeholder="https://wa.me/1234567890"
                                                className="rounded-xl border-zinc-200 focus-visible:ring-zinc-900 dark:border-zinc-800 dark:focus-visible:ring-zinc-100"
                                            />
                                        </div>

                                        {/* Contact Email */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Mail className="h-4 w-4 text-zinc-500" />
                                                <Label htmlFor="email" className="text-sm font-semibold">
                                                    {t('Email Address')}
                                                </Label>
                                            </div>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={formData.email || ''}
                                                onChange={(e) => updateSetting('email', e.target.value)}
                                                placeholder="contact@yourstore.com"
                                                className="rounded-xl border-zinc-200 focus-visible:ring-zinc-900 dark:border-zinc-800 dark:focus-visible:ring-zinc-100"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Section 6: WhatsApp Widget */}
                    {activeTab === 'whatsapp' && (
                        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
                            <Card className="border border-zinc-200/80 dark:border-zinc-800 shadow-sm rounded-2xl">
                                <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 p-4 sm:p-6">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="space-y-1 pr-4 rtl:pr-0 rtl:pl-4">
                                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                                {t('WhatsApp Support Widget')}
                                            </CardTitle>
                                            <CardDescription>
                                                {t('Add a floating WhatsApp button to your store for customer support.')}
                                            </CardDescription>
                                        </div>
                                        <Switch
                                            checked={formData.whatsapp_widget_enabled === true || formData.whatsapp_widget_enabled === 'true'}
                                            onCheckedChange={(checked) => updateSetting('whatsapp_widget_enabled', checked)}
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-6">
                                    {!(formData.whatsapp_widget_enabled === true || formData.whatsapp_widget_enabled === 'true') ? (
                                        <div className="flex flex-col items-center justify-center py-8 sm:py-10 text-center text-zinc-400 dark:text-zinc-500">
                                            <MessageSquare className="h-10 w-10 mb-3 opacity-60" />
                                            <p className="text-sm font-semibold">{t('WhatsApp Widget is currently disabled.')}</p>
                                            <p className="text-xs max-w-xs mt-1">
                                                {t('Enable the widget via the switch above to display a live chat button for your customers.')}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 sm:space-y-5 animate-in slide-in-from-top-4 duration-300">
                                            {/* Phone number */}
                                            <div className="space-y-1.5">
                                                <Label htmlFor="whatsapp_widget_phone" className="text-sm font-semibold">
                                                    {t('WhatsApp Phone Number')}
                                                </Label>
                                                <Input
                                                    id="whatsapp_widget_phone"
                                                    value={formData.whatsapp_widget_phone || ''}
                                                    onChange={(e) => updateSetting('whatsapp_widget_phone', e.target.value)}
                                                    placeholder="+919876543210"
                                                    className="rounded-xl border-zinc-200 focus-visible:ring-zinc-900 dark:border-zinc-800 dark:focus-visible:ring-zinc-100"
                                                />
                                                <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                                                    {t('Enter phone number with country code (e.g., +919876543210, +1234567890).')}
                                                </p>
                                            </div>

                                            {/* Default Message */}
                                            <div className="space-y-1.5">
                                                <Label htmlFor="whatsapp_widget_message" className="text-sm font-semibold">
                                                    {t('Default Message')}
                                                </Label>
                                                <Textarea
                                                    id="whatsapp_widget_message"
                                                    value={formData.whatsapp_widget_message || ''}
                                                    onChange={(e) => updateSetting('whatsapp_widget_message', e.target.value)}
                                                    placeholder="Hello! I need help with..."
                                                    rows={3}
                                                    className="rounded-xl border-zinc-200 focus-visible:ring-zinc-900 dark:border-zinc-800 dark:focus-visible:ring-zinc-100"
                                                />
                                                <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                                                    {t('Pre-filled message when customers click the widget.')}
                                                </p>
                                            </div>

                                            {/* Widget Position */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-5">
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="whatsapp_widget_position" className="text-sm font-semibold">
                                                        {t('Widget Position')}
                                                    </Label>
                                                    <Select
                                                        value={formData.whatsapp_widget_position || 'right'}
                                                        onValueChange={(value) => updateSetting('whatsapp_widget_position', value)}
                                                    >
                                                        <SelectTrigger className="rounded-xl border-zinc-200 focus:ring-zinc-900 dark:border-zinc-800 dark:focus:ring-zinc-100">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="left">{t('Left')}</SelectItem>
                                                            <SelectItem value="right">{t('Right')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            {/* Display Options */}
                                            <div className="pt-3 sm:pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3 sm:space-y-4">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                                                    {t('Display Options')}
                                                </Label>
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <div className="space-y-0.5">
                                                        <Label className="text-sm font-semibold">{t('Show on Mobile')}</Label>
                                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                            {t('Display widget on mobile devices.')}
                                                        </p>
                                                    </div>
                                                    <Switch
                                                        checked={
                                                            formData.whatsapp_widget_show_on_mobile === true ||
                                                            formData.whatsapp_widget_show_on_mobile === 'true'
                                                        }
                                                        onCheckedChange={(checked) =>
                                                            updateSetting('whatsapp_widget_show_on_mobile', checked)
                                                        }
                                                    />
                                                </div>

                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <div className="space-y-0.5">
                                                        <Label className="text-sm font-semibold">{t('Show on Desktop')}</Label>
                                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                            {t('Display widget on desktop devices.')}
                                                        </p>
                                                    </div>
                                                    <Switch
                                                        checked={
                                                            formData.whatsapp_widget_show_on_desktop === true ||
                                                            formData.whatsapp_widget_show_on_desktop === 'true'
                                                        }
                                                        onCheckedChange={(checked) =>
                                                            updateSetting('whatsapp_widget_show_on_desktop', checked)
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Section 7: Custom Code */}
                    {activeTab === 'custom_code' && (
                        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
                            <Card className="border border-zinc-200/80 dark:border-zinc-800 shadow-sm rounded-2xl">
                                <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 p-4 sm:p-6">
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        {t('Custom CSS & JavaScript')}
                                    </CardTitle>
                                    <CardDescription>
                                        {t('Inject custom style definitions and logic hooks into your storefront theme.')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                                    {/* Security Notice */}
                                    <div className="bg-yellow-50/80 dark:bg-yellow-950/20 border border-yellow-200/60 dark:border-yellow-900/40 rounded-2xl p-3.5 sm:p-4 flex gap-3">
                                        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-bold text-yellow-800 dark:text-yellow-300">
                                                {t('Important Security Notice')}
                                            </h4>
                                            <p className="text-xs text-yellow-700 dark:text-yellow-400/90 leading-relaxed">
                                                {t(
                                                    'Only add trusted CSS and JavaScript code. Malicious code can compromise your store security and user data. Test thoroughly before applying to production.',
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Custom CSS */}
                                    <div className="space-y-2">
                                        <Label htmlFor="custom_css" className="text-sm font-semibold flex items-center gap-2">
                                            <Palette className="h-4 w-4 text-zinc-500" />
                                            {t('Custom CSS')}
                                        </Label>
                                        <p className="text-xs text-zinc-400 dark:text-zinc-500">
                                            {t('Add custom CSS styles to modify your store appearance. Maximum 50,000 characters.')}
                                        </p>
                                        <Textarea
                                            id="custom_css"
                                            value={formData.custom_css || ''}
                                            onChange={(e) => updateSetting('custom_css', e.target.value)}
                                            placeholder={t(
                                                '/* Add your custom CSS here */\n.custom-style {\n  color: #333;\n  font-size: 16px;\n}',
                                            )}
                                            rows={6}
                                            className="font-mono text-xs rounded-xl border-zinc-200 focus-visible:ring-zinc-900 dark:border-zinc-800 dark:focus-visible:ring-zinc-100 bg-zinc-50/30 dark:bg-zinc-900/20"
                                            maxLength={50000}
                                        />
                                        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 text-right rtl:text-left">
                                            {(formData.custom_css || '').length.toLocaleString()}/50,000 {t('characters')}
                                        </div>
                                    </div>

                                    {/* Custom JavaScript */}
                                    <div className="space-y-2">
                                        <Label htmlFor="custom_javascript" className="text-sm font-semibold flex items-center gap-2">
                                            <Code className="h-4 w-4 text-zinc-500" />
                                            {t('Custom JavaScript')}
                                        </Label>
                                        <p className="text-xs text-zinc-400 dark:text-zinc-500">
                                            {t(
                                                'Add custom JavaScript code to enhance your store functionality. Maximum 50,000 characters.',
                                            )}
                                        </p>
                                        <Textarea
                                            id="custom_javascript"
                                            value={formData.custom_javascript || ''}
                                            onChange={(e) => updateSetting('custom_javascript', e.target.value)}
                                            placeholder={t(
                                                '// Add your custom JavaScript here\nconsole.log("Store loaded");',
                                            )}
                                            rows={6}
                                            className="font-mono text-xs rounded-xl border-zinc-200 focus-visible:ring-zinc-900 dark:border-zinc-800 dark:focus-visible:ring-zinc-100 bg-zinc-50/30 dark:bg-zinc-900/20"
                                            maxLength={50000}
                                        />
                                        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 text-right rtl:text-left">
                                            {(formData.custom_javascript || '').length.toLocaleString()}/50,000 {t('characters')}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </PageTemplate>
    );
}
