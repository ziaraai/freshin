import BadgeUI from '@/components/badge-ui';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';
import { PageTemplate } from '@/components/page-template';
import { PlanSubscriptionModal } from '@/components/plan-subscription-modal';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatSuperadminCurrency } from '@/utils/currency-helper';
import { checkPermissionWithAuth, hasPermission } from '@/utils/permissions';
import { useLayout } from '@/contexts/LayoutContext';
import { router, useForm, usePage } from '@inertiajs/react';
import {
    Banknote,
    BarChart2,
    Bot,
    Box,
    CheckCircle2,
    Clock,
    Coins,
    CreditCard,
    FileText,
    Globe,
    HardDrive,
    IndianRupee,
    Mail,
    Pencil,
    Plus,
    Sparkles,
    Store,
    Trash2,
    Users,
    Wallet,
    X,
    Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Plan {
    id: number;
    name: string;
    price: string | number;
    formatted_price?: string;
    duration: string;
    description: string;
    trial_days: number;
    features: string[];
    stats: {
        businesses?: number | string;
        users?: number | string;
        stores?: number | string;
        users_per_store?: number | string;
        products_per_store?: number | string;
        storage: string;
        templates: number | string;
    };
    status: boolean;
    recommended?: boolean;
    is_free?: boolean;
    paymentMethods?: any;
    is_default?: boolean;
    is_current?: boolean;
    is_trial_available?: boolean;
}

interface Props {
    plans: Plan[];
    billingCycle: 'monthly' | 'yearly';
    hasDefaultPlan?: boolean;
    isAdmin?: boolean;
    currentPlan?: any;
    userTrialUsed?: boolean;
    paymentMethods?: any[];
}

export default function Plans({
    plans: initialPlans,
    billingCycle: initialBillingCycle = 'monthly',
    hasDefaultPlan,
    isAdmin = false,
    currentPlan,
    userTrialUsed,
    paymentMethods = [],
}: Props) {
    const { t } = useTranslation();
    const { isRtl, effectivePosition, position } = useLayout();
    const isRtlMode = isRtl || effectivePosition === 'right' || position === 'right';
    const { auth, flash, globalSettings } = usePage().props as any;
    const [plans, setPlans] = useState<Plan[]>(initialPlans);
    // Use currentPlan's duration if available, otherwise use initialBillingCycle
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(currentPlan?.duration === 'yearly' ? 'yearly' : initialBillingCycle);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
    const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

    const { post, processing } = useForm();

    // Update plans when initialPlans changes
    useEffect(() => {
        setPlans(initialPlans);
    }, [initialPlans]);

    // Handle flash messages from controller
    useEffect(() => {
        if (flash?.success) {
            toast.success(t(flash.success));
        }
        if (flash?.error) {
            toast.error(t(flash.error));
        }
    }, [flash, t]);

    // Function to handle billing cycle change
    const handleBillingCycleChange = (value: 'monthly' | 'yearly') => {
        setBillingCycle(value);
        router.get(route('plans.index'), { billing_cycle: value }, { preserveState: true });
    };

    // Company plan actions
    const handlePlanRequest = (planId: number) => {
        if (!checkPermissionWithAuth('request-plans', auth)) {
            toast.error(t('You do not have permission to request plans'));
            return;
        }
        if (!globalSettings?.is_demo) {
            toast.loading(t('Submitting plan request...'));
        }
        router.post(
            route('plans.request'),
            {
                plan_id: planId,
                billing_cycle: billingCycle,
            },
            {
                onSuccess: () => {
                    toast.dismiss();
                },
                onError: (errors) => {
                    toast.dismiss();
                    if (typeof errors === 'string') {
                        toast.error(t(errors));
                    } else if (errors.error) {
                        toast.error(t(errors.error));
                    } else {
                        toast.error(t('Failed to submit plan request: {{errors}}', { errors: Object.values(errors).join(', ') }));
                    }
                },
            },
        );
    };

    const handleStartTrial = (planId: number) => {
        if (!checkPermissionWithAuth('trial-plans', auth)) {
            toast.error(t('You do not have permission to start trials'));
            return;
        }
        if (!globalSettings?.is_demo) {
            toast.loading(t('Starting trial...'));
        }
        router.post(
            route('plans.trial'),
            {
                plan_id: planId,
            },
            {
                onSuccess: () => {
                    toast.dismiss();
                },
                onError: (errors) => {
                    toast.dismiss();
                    if (errors.error) {
                        toast.error(t(errors.error));
                    } else if (typeof errors === 'string') {
                        toast.error(t(errors));
                    } else {
                        toast.error(t('Failed to start trial: {{errors}}', { errors: Object.values(errors).join(', ') }));
                    }
                },
            },
        );
    };

    const handleSubscribe = async (planId: number) => {
        if (!checkPermissionWithAuth('subscribe-plans', auth)) {
            toast.error(t('You do not have permission to subscribe to plans'));
            return;
        }
        const plan = plans.find((p) => p.id === planId);
        if (plan) {
            try {
                const response = await fetch(route('payment.methods'));
                if (!response.ok) {
                    toast.error(t('Failed to load payment methods'));
                    return;
                }
                const paymentData = await response.json();

                // Check for demo mode restriction for company users
                if (paymentData.is_demo && paymentData.user_type === 'company') {
                    toast.error('Payment subscriptions are disabled in demo mode. This feature is available in the full version.');
                    return;
                }

                setSelectedPlan({ ...plan, paymentMethods: paymentData });
                setIsSubscriptionModalOpen(true);
            } catch (error) {
                toast.error(t('Failed to load payment methods'));
            }
        }
    };

    const formatPaymentMethods = (paymentSettings: any) => {
        const methods = [];

        if (paymentSettings?.is_bank_enabled === true || paymentSettings?.is_bank_enabled === '1') {
            methods.push({
                id: 'bank',
                name: t('Bank Transfer'),
                icon: <Banknote className="h-5 w-5" />,
                enabled: true,
            });
        }

        if (paymentSettings?.is_stripe_enabled === true || paymentSettings?.is_stripe_enabled === '1') {
            methods.push({
                id: 'stripe',
                name: t('Stripe'),
                icon: <CreditCard className="h-5 w-5" />,
                enabled: true,
            });
        }

        if (paymentSettings?.is_paypal_enabled === true || paymentSettings?.is_paypal_enabled === '1') {
            methods.push({
                id: 'paypal',
                name: t('PayPal'),
                icon: <CreditCard className="h-5 w-5" />,
                enabled: true,
            });
        }

        if (paymentSettings?.is_razorpay_enabled === true || paymentSettings?.is_razorpay_enabled === '1') {
            methods.push({
                id: 'razorpay',
                name: t('Razorpay'),
                icon: <IndianRupee className="h-5 w-5" />,
                enabled: true,
            });
        }

        if (
            (paymentSettings?.is_mercadopago_enabled === true || paymentSettings?.is_mercadopago_enabled === '1') &&
            paymentSettings?.mercadopago_access_token
        ) {
            methods.push({
                id: 'mercadopago',
                name: t('MercadoPago'),
                icon: <Wallet className="h-5 w-5" />,
                enabled: true,
            });
        }

        if (paymentSettings?.is_paystack_enabled === true || paymentSettings?.is_paystack_enabled === '1') {
            methods.push({
                id: 'paystack',
                name: t('Paystack'),
                icon: <CreditCard className="h-5 w-5" />,
                enabled: true,
            });
        }

        if (paymentSettings?.is_flutterwave_enabled === true || paymentSettings?.is_flutterwave_enabled === '1') {
            methods.push({
                id: 'flutterwave',
                name: t('Flutterwave'),
                icon: <CreditCard className="h-5 w-5" />,
                enabled: true,
            });
        }

        if (paymentSettings?.is_paytabs_enabled === true || paymentSettings?.is_paytabs_enabled === '1') {
            methods.push({
                id: 'paytabs',
                name: t('PayTabs'),
                icon: <CreditCard className="h-5 w-5" />,
                enabled: true,
            });
        }

        if (paymentSettings?.is_skrill_enabled === true || paymentSettings?.is_skrill_enabled === '1') {
            methods.push({
                id: 'skrill',
                name: t('Skrill'),
                icon: <Wallet className="h-5 w-5" />,
                enabled: true,
            });
        }

        if (paymentSettings?.is_coingate_enabled === true || paymentSettings?.is_coingate_enabled === '1') {
            methods.push({
                id: 'coingate',
                name: t('CoinGate'),
                icon: <Coins className="h-5 w-5" />,
                enabled: true,
            });
        }

        if (paymentSettings?.is_payfast_enabled === true || paymentSettings?.is_payfast_enabled === '1') {
            methods.push({
                id: 'payfast',
                name: t('Payfast'),
                icon: <CreditCard className="h-5 w-5" />,
                enabled: true,
            });
        }

        if (paymentSettings?.is_tap_enabled === true || paymentSettings?.is_tap_enabled === '1') {
            methods.push({
                id: 'tap',
                name: t('Tap'),
                icon: <CreditCard className="h-5 w-5" />,
                enabled: true,
            });
        }

        if (paymentSettings?.is_xendit_enabled === true || paymentSettings?.is_xendit_enabled === '1') {
            methods.push({
                id: 'xendit',
                name: t('Xendit'),
                icon: <CreditCard className="h-5 w-5" />,
                enabled: true,
            });
        }

        if (paymentSettings?.is_paytr_enabled === true || paymentSettings?.is_paytr_enabled === '1') {
            methods.push({
                id: 'paytr',
                name: t('PayTR'),
                icon: <CreditCard className="h-5 w-5" />,
                enabled: true,
            });
        }

        if (paymentSettings?.is_mollie_enabled === true || paymentSettings?.is_mollie_enabled === '1') {
            methods.push({
                id: 'mollie',
                name: t('Mollie'),
                icon: <CreditCard className="h-5 w-5" />,
                enabled: true,
            });
        }

        if (paymentSettings?.is_toyyibpay_enabled === true || paymentSettings?.is_toyyibpay_enabled === '1') {
            methods.push({
                id: 'toyyibpay',
                name: t('toyyibPay'),
                icon: <CreditCard className="h-5 w-5" />,
                enabled: true,
            });
        }

        if (paymentSettings?.is_cashfree_enabled === true || paymentSettings?.is_cashfree_enabled === '1') {
            methods.push({
                id: 'cashfree',
                name: t('Cashfree'),
                icon: <IndianRupee className="h-5 w-5" />,
                enabled: true,
            });
        }

        if (paymentSettings?.is_khalti_enabled === true || paymentSettings?.is_khalti_enabled === '1') {
            methods.push({
                id: 'khalti',
                name: t('Khalti'),
                icon: <CreditCard className="h-5 w-5" />,
                enabled: true,
            });
        }

        if (paymentSettings?.is_iyzipay_enabled === true || paymentSettings?.is_iyzipay_enabled === '1') {
            methods.push({
                id: 'iyzipay',
                name: t('Iyzipay'),
                icon: <CreditCard className="h-5 w-5" />,
                enabled: true,
            });
        }

        if (paymentSettings?.is_benefit_enabled === true || paymentSettings?.is_benefit_enabled === '1') {
            methods.push({
                id: 'benefit',
                name: t('Benefit'),
                icon: <CreditCard className="h-5 w-5" />,
                enabled: true,
            });
        }

        if (paymentSettings?.is_ozow_enabled === true || paymentSettings?.is_ozow_enabled === '1') {
            methods.push({
                id: 'ozow',
                name: t('Ozow'),
                icon: <CreditCard className="h-5 w-5" />,
                enabled: true,
            });
        }

        if (paymentSettings?.is_easebuzz_enabled === true || paymentSettings?.is_easebuzz_enabled === '1') {
            methods.push({
                id: 'easebuzz',
                name: t('Easebuzz'),
                icon: <IndianRupee className="h-5 w-5" />,
                enabled: true,
            });
        }

        if (paymentSettings?.is_authorizenet_enabled === true || paymentSettings?.is_authorizenet_enabled === '1') {
            methods.push({
                id: 'authorizenet',
                name: t('AuthorizeNet'),
                icon: <CreditCard className="h-5 w-5" />,
                enabled: true,
            });
        }

        if (paymentSettings?.is_fedapay_enabled === true || paymentSettings?.is_fedapay_enabled === '1') {
            methods.push({
                id: 'fedapay',
                name: t('FedaPay'),
                icon: <CreditCard className="h-5 w-5" />,
                enabled: true,
            });
        }

        if (paymentSettings?.is_payhere_enabled === true || paymentSettings?.is_payhere_enabled === '1') {
            methods.push({
                id: 'payhere',
                name: t('PayHere'),
                icon: <CreditCard className="h-5 w-5" />,
                enabled: true,
            });
        }

        if (paymentSettings?.is_cinetpay_enabled === true || paymentSettings?.is_cinetpay_enabled === '1') {
            methods.push({
                id: 'cinetpay',
                name: t('CinetPay'),
                icon: <CreditCard className="h-5 w-5" />,
                enabled: true,
            });
        }

        if (paymentSettings?.is_paiement_enabled === true || paymentSettings?.is_paiement_enabled === '1') {
            methods.push({
                id: 'paiement',
                name: t('Paiement Pro'),
                icon: <CreditCard className="h-5 w-5" />,
                enabled: true,
            });
        }

        if (paymentSettings?.is_nepalste_enabled === true || paymentSettings?.is_nepalste_enabled === '1') {
            methods.push({
                id: 'nepalste',
                name: t('Nepalste'),
                icon: <CreditCard className="h-5 w-5" />,
                enabled: true,
            });
        }

        if (paymentSettings?.is_yookassa_enabled === true || paymentSettings?.is_yookassa_enabled === '1') {
            methods.push({
                id: 'yookassa',
                name: t('YooKassa'),
                icon: <CreditCard className="h-5 w-5" />,
                enabled: true,
            });
        }

        if (paymentSettings?.is_aamarpay_enabled === true || paymentSettings?.is_aamarpay_enabled === '1') {
            methods.push({
                id: 'aamarpay',
                name: t('Aamarpay'),
                icon: <CreditCard className="h-5 w-5" />,
                enabled: true,
            });
        }

        if (paymentSettings?.is_midtrans_enabled === true || paymentSettings?.is_midtrans_enabled === '1') {
            methods.push({
                id: 'midtrans',
                name: t('Midtrans'),
                icon: <CreditCard className="h-5 w-5" />,
                enabled: true,
            });
        }

        return methods;
    };

    // Check if plan is currently active for the DISPLAYED billing cycle (AccountGo logic)
    const isPlanCurrentForCycle = (plan: Plan) => {
        if (!plan.is_current || !currentPlan) return false;
        const userDuration = (currentPlan.duration || '').toLowerCase();
        const displayCycle = billingCycle.toLowerCase();
        // Lifetime or trial: show on any tab
        if (['trial', 'lifetime'].includes(userDuration)) return true;
        return userDuration === displayCycle;
    };

    const getActionButton = (plan: Plan) => {
        // If currently subscribed and on matching billing cycle tab — show expiry info (AccountGo style)
        if (isPlanCurrentForCycle(plan)) {
            const isTrial = auth.user?.is_trial == 1 || currentPlan?.is_trial == 1;
            const expireDate = isTrial
                ? auth.user?.trial_expire_date || currentPlan?.trial_expire_date
                : currentPlan?.expires_at || auth.user?.plan_expire_date;

            return (
                <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/40 p-2 text-center">
                    <p className="text-xs font-medium text-green-600 dark:text-green-400">
                        {expireDate
                            ? `${isTrial ? t('Trial Expires on') : t('Expires on')} ${window.appSettings?.formatDateTime ? window.appSettings.formatDateTime(expireDate, false) : new Date(expireDate).toLocaleDateString([], { dateStyle: 'medium' })}`
                            : t('Lifetime')}
                    </p>
                </div>
            );
        }

        if (plan.is_trial_available && !userTrialUsed) {
            return (
                <div className="space-y-2">
                    {hasPermission('trial-plans', auth) && (
                        <Button onClick={() => handleStartTrial(plan.id)} disabled={processing} variant="outline" className="w-full">
                            <Zap className="mr-2 h-4 w-4" />
                            {t(`Start ${plan.trial_days} Day Trial`)}
                        </Button>
                    )}
                    {hasPermission('subscribe-plans', auth) && (
                        <Button onClick={() => handleSubscribe(plan.id)} disabled={processing} className="w-full">
                            {t('Subscribe Now')}
                        </Button>
                    )}
                </div>
            );
        }

        return (
            <div className="space-y-2">
                {hasPermission('request-plans', auth) && (
                    <Button onClick={() => handlePlanRequest(plan.id)} disabled={processing} variant="outline" className="w-full">
                        <Clock className="mr-2 h-4 w-4" />
                        {t('Request Plan')}
                    </Button>
                )}
                {hasPermission('subscribe-plans', auth) && (
                    <Button onClick={() => handleSubscribe(plan.id)} disabled={processing} className="w-full">
                        {t('Subscribe Now')}
                    </Button>
                )}
            </div>
        );
    };

    // Function to get the appropriate icon for a feature
    const getFeatureIcon = (feature: string) => {
        switch (feature) {
            case 'Custom Domain':
                return <Globe className="h-4 w-4" />;
            case 'Subdomain':
                return <Globe className="h-4 w-4" />;
            case 'PWA':
                return <FileText className="h-4 w-4" />;
                return <FileText className="h-4 w-4" />;
            case 'AI Integration':
                return <Bot className="h-4 w-4" />;
            case 'Analytics':
                return <BarChart2 className="h-4 w-4" />;
            case 'Email Support':
                return <Mail className="h-4 w-4" />;
            case 'API Access':
                return <Box className="h-4 w-4" />;
            case 'Priority Support':
                return <Users className="h-4 w-4" />;
            case 'Storage':
                return <HardDrive className="h-4 w-4" />;
            default:
                return <CheckCircle2 className="h-4 w-4" />;
        }
    };

    // Function to check if a feature is included in the plan
    const isFeatureIncluded = (plan: Plan, feature: string) => {
        return plan.features.includes(feature);
    };

    // Function to toggle plan status
    const togglePlanStatus = (planId: number) => {
        const plan = plans.find((p) => p.id === planId);
        const newStatus = !plan?.status;
        if (!globalSettings?.is_demo) {
            toast.loading(`${newStatus ? t('Activating') : t('Deactivating')} plan...`);
        }

        router.post(
            route('plans.toggle-status', planId),
            {},
            {
                preserveState: true,
                onSuccess: () => {
                    if (!globalSettings?.is_demo) {
                        toast.dismiss();
                    }
                    // Update local state
                    setPlans(plans.map((p) => (p.id === planId ? { ...p, status: !p.status } : p)));
                },
                onError: (errors) => {
                    if (!globalSettings?.is_demo) {
                        toast.dismiss();
                    }
                    if (typeof errors === 'string') {
                        toast.error(t(errors));
                    } else if (errors.error) {
                        toast.error(t(errors.error));
                    } else {
                        toast.error(t('Failed to update plan status: {{errors}}', { errors: Object.values(errors).join(', ') }));
                    }
                },
            },
        );
    };

    // Function to handle delete
    const handleDelete = (plan: Plan) => {
        setPlanToDelete(plan);
        setIsDeleteModalOpen(true);
    };

    // Function to handle delete confirmation
    const handleDeleteConfirm = () => {
        if (planToDelete) {
            if (!globalSettings?.is_demo) {
                toast.loading(t('Deleting plan...'));
            }

            router.delete(route('plans.destroy', planToDelete.id), {
                onSuccess: () => {
                    setIsDeleteModalOpen(false);
                    setPlanToDelete(null);
                    toast.dismiss();
                },
                onError: (errors) => {
                    toast.dismiss();
                    if (typeof errors === 'string') {
                        toast.error(t(errors));
                    } else if (errors.error) {
                        toast.error(t(errors.error));
                    } else {
                        toast.error(t('Failed to delete plan: {{errors}}', { errors: Object.values(errors).join(', ') }));
                    }
                },
            });
        }
    };

    // Common features to display for all plans
    const commonFeatures = ['Custom Domain', 'Subdomain', 'PWA', 'AI Integration', 'Shipping Method'];

    // Define stat icons
    const statIcons = {
        stores: <Store className="h-4 w-4 sm:h-5 sm:w-5" />,
        users_per_store: <Users className="h-4 w-4 sm:h-5 sm:w-5" />,
        products_per_store: <Box className="h-4 w-4 sm:h-5 sm:w-5" />,
        storage: <HardDrive className="h-4 w-4 sm:h-5 sm:w-5" />,
        templates: <FileText className="h-4 w-4 sm:h-5 sm:w-5" />,
    };

    return (
        <PageTemplate
            title={t('Plans')}
            description={t('Manage subscription plans for your customers')}
            url="/plans"
            breadcrumbs={[{ title: t('Dashboard'), href: route('dashboard') }, { title: t('Plans') }]}
        >
            <div className="space-y-8">
                {/* Header with controls */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">{isAdmin ? t('Subscription Plans') : t('Choose Your Plan')}</h2>
                        <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                            {isAdmin
                                ? t('Create and manage subscription plans to offer different service tiers to your customers.')
                                : t('Select the perfect plan for your business needs')}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Tabs
                            value={billingCycle}
                            onValueChange={(v) => handleBillingCycleChange(v as 'monthly' | 'yearly')}
                            className="w-full sm:w-auto"
                        >
                            <TabsList className="grid w-full grid-cols-2 h-11 sm:h-12 sm:min-w-[280px] md:min-w-[300px] items-center justify-center rounded-xl bg-muted/90 p-1.5 text-muted-foreground shadow-sm">
                                <TabsTrigger value="monthly" className="h-8.5 sm:h-9 rounded-lg px-4 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">{t('Monthly')}</TabsTrigger>
                                <TabsTrigger value="yearly" className="flex h-8.5 sm:h-9 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                                    <span>{t('Yearly')}</span>
                                    <BadgeUI className="border-green-200 bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                                    >
                                        {t('Save 20%')}
                                    </BadgeUI>
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                        {isAdmin && hasPermission('create-plans', auth) && (
                            <Button className="w-full sm:w-auto shrink-0 whitespace-nowrap" onClick={() => router.get(route('plans.create'))}>
                                <Plus className="mr-2 h-4 w-4" />
                                {t('Add Plan')}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Plans grid */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 min-w-0">
                    {plans.map((plan) => (
                        <div key={plan.id} className={`group relative flex h-full flex-col min-w-0 ${plan.recommended ? 'z-10 xl:scale-[1.02]' : ''}`}>
                            {/* Card with decorative elements */}
                            <div
                                className={`absolute inset-0 rounded-2xl ${
                                    plan.recommended
                                        ? 'border-primary/30 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent dark:border-primary/40 dark:from-primary/20 dark:via-primary/10 dark:to-gray-900/40 dark:bg-gray-900/80'
                                        : 'border-gray-200/80 bg-gradient-to-br from-gray-100/80 via-gray-50/50 to-transparent dark:border-gray-800 dark:from-gray-900/90 dark:via-gray-900/60 dark:to-gray-950/80 dark:bg-gray-900/80'
                                } group-hover:shadow-primary/5 overflow-hidden border shadow-lg transition-all duration-300 group-hover:shadow-xl`}
                            >
                                {/* Decorative background elements */}
                                <div className="from-primary/10 absolute top-0 right-0 -mt-16 -mr-16 h-32 w-32 rounded-full bg-gradient-to-br to-transparent opacity-70 dark:opacity-30"></div>
                                <div className="from-primary/10 absolute bottom-0 left-0 -mb-12 -ml-12 h-24 w-24 rounded-full bg-gradient-to-tr to-transparent opacity-50 dark:opacity-20"></div>
                            </div>

                            {/* Recommended indicator */}
                            {plan.recommended && (
                                <div className="absolute -top-4 right-0 left-0 z-20 flex justify-center">
                                    <div className="bg-primary text-primary-foreground flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium shadow-lg">
                                        <Sparkles className="h-4 w-4" />
                                        {t('Recommended')}
                                    </div>
                                </div>
                            )}

                            {/* Status indicator - Admin only */}
                            {isAdmin && (
                                <div
                                    className={`absolute top-3 sm:top-4 z-10 flex flex-wrap gap-1.5 sm:gap-2 max-w-[65%] ${
                                        isRtlMode
                                            ? 'left-3 sm:left-4 right-auto justify-start'
                                            : 'right-3 sm:right-4 left-auto justify-end'
                                    } rtl:left-3 rtl:sm:left-4 rtl:right-auto rtl:justify-start ltr:right-3 ltr:sm:right-4 ltr:left-auto ltr:justify-end`}
                                >
                                    {plan.is_default && (
                                        <BadgeUI className="bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/15 dark:text-blue-400 dark:ring-blue-500/35 text-[10px] sm:text-xs">
                                            {t('Default')}
                                        </BadgeUI>
                                    )}
                                    <BadgeUI
                                        className={`text-[10px] sm:text-xs ${
                                            plan.status
                                                ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/15 dark:text-green-400 dark:ring-green-500/35'
                                                : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/15 dark:text-red-400 dark:ring-red-500/35'
                                        }`}
                                    >
                                        {plan.status ? t('Active') : t('Inactive')}
                                    </BadgeUI>
                                </div>
                            )}

                            {/* Active ribbon - AccountGo style diagonal banner, only on matching billing cycle tab */}
                            {!isAdmin && isPlanCurrentForCycle(plan) && (
                                <div
                                    className={`pointer-events-none absolute -top-px z-10 h-[100px] w-[100px] overflow-hidden ${
                                        isRtlMode
                                            ? '-left-px rounded-tl-2xl'
                                            : '-right-px rounded-tr-2xl'
                                    } rtl:-left-px rtl:rounded-tl-2xl rtl:rounded-tr-none ltr:-right-px ltr:rounded-tr-2xl ltr:rounded-tl-none`}
                                >
                                    <div
                                        className={`bg-primary/20 text-primary border-primary/35 absolute top-[20px] w-[130px] transform border py-1 text-center text-[14px] font-semibold tracking-wide uppercase shadow-sm backdrop-blur-sm ${
                                            isRtlMode
                                                ? '-left-[28px] -rotate-45'
                                                : '-right-[28px] rotate-45'
                                        } rtl:-left-[28px] rtl:-rotate-45 rtl:right-auto ltr:-right-[28px] ltr:rotate-45 ltr:left-auto`}
                                    >
                                        {t('Active')}
                                    </div>
                                </div>
                            )}

                            {/* Content container */}
                            <div className="relative z-10 flex h-full flex-col p-4 sm:p-5 lg:p-6 pt-6 sm:pt-7 lg:pt-8 min-w-0">
                                {/* Plan header */}
                                <div className="mb-6">
                                    <h3
                                        className={`mb-2 text-xl sm:text-2xl font-bold truncate ${
                                            isAdmin
                                                ? isRtlMode
                                                    ? 'pl-24 rtl:pl-24 ltr:pr-24'
                                                    : 'pr-24 ltr:pr-24 rtl:pl-24'
                                                : ''
                                        } ${plan.recommended ? 'text-primary' : 'text-gray-900 dark:text-white'} `}
                                        title={plan.name}
                                    >
                                        {plan.name}
                                    </h3>
                                    <div className="mb-3 flex items-baseline gap-1.5 flex-wrap">
                                        <span className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight shrink-0 ${plan.recommended ? 'text-primary' : 'text-gray-900 dark:text-white'} `}>
                                            {plan.formatted_price || formatSuperadminCurrency(plan.price)}
                                        </span>
                                        <span className="text-muted-foreground text-xs sm:text-sm shrink-0">/{t(plan.duration.toLowerCase())}</span>
                                    </div>
                                    <p className="text-muted-foreground mb-3 line-clamp-2 text-sm leading-relaxed">{plan.description}</p>
                                    {plan.trial_days > 0 && (
                                        <div className="text-primary flex items-center gap-1.5 text-sm">
                                            <Sparkles className="h-3.5 w-3.5" />
                                            {t(`${plan.trial_days} days free trial`)}
                                        </div>
                                    )}
                                </div>

                                {/* Divider with icon */}
                                <div className="relative my-4 flex items-center">
                                    <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
                                    <div className="bg-primary/10 text-primary dark:bg-primary/20 mx-3 rounded-full p-1.5">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
                                </div>

                                {/* Features */}
                                <div className="mb-6 flex-1">
                                    <h4 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">{t('Features')}</h4>
                                    <ul className="space-y-2.5">
                                        {commonFeatures.map((feature, index) => {
                                            const included = isFeatureIncluded(plan, feature);
                                            return (
                                                <li key={index} className="flex items-center gap-3">
                                                    {included ? (
                                                        <div className="bg-primary/10 text-primary dark:bg-primary/20 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full">
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                        </div>
                                                    ) : (
                                                        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                                                            <X className="h-3.5 w-3.5" />
                                                        </div>
                                                    )}
                                                    <span className={`text-sm ${included ? 'font-medium text-gray-900 dark:text-gray-200' : 'text-muted-foreground'}`}>
                                                        {t(feature)}
                                                    </span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>

                                {/* Usage limits */}
                                <div className="mb-6">
                                    <h4 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">{t('Usage Limits')}</h4>
                                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                        <div className="group-hover:border-primary/30 relative overflow-hidden rounded-xl border border-gray-200 bg-white p-2 sm:p-2.5 transition-colors sm:p-3 min-w-0 dark:border-gray-800 dark:bg-gray-800/60">
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-70 dark:from-blue-950/40 dark:to-transparent"></div>
                                            <div className="relative mb-1 flex items-center gap-1.5 sm:gap-2">
                                                <div className="shrink-0 rounded-full bg-blue-100 p-1 text-blue-600 sm:p-1.5 dark:bg-blue-900/40 dark:text-blue-400">{statIcons.stores}</div>
                                                <div className="truncate text-sm sm:text-base lg:text-lg xl:text-xl font-bold text-blue-700 dark:text-blue-400">{plan.stats.stores}</div>
                                            </div>
                                            <div
                                                className="relative truncate text-[10px] font-medium tracking-tight text-blue-600 uppercase sm:text-xs dark:text-blue-400/90"
                                                title={t('Stores')}
                                            >
                                                {t('Stores')}
                                            </div>
                                        </div>
                                        <div className="group-hover:border-primary/30 relative overflow-hidden rounded-xl border border-gray-200 bg-white p-2 sm:p-2.5 transition-colors sm:p-3 min-w-0 dark:border-gray-800 dark:bg-gray-800/60">
                                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-70 dark:from-emerald-950/40 dark:to-transparent"></div>
                                            <div className="relative mb-1 flex items-center gap-1.5 sm:gap-2">
                                                <div className="shrink-0 rounded-full bg-emerald-100 p-1 text-emerald-600 sm:p-1.5 dark:bg-emerald-900/40 dark:text-emerald-400">
                                                    {statIcons.users_per_store}
                                                </div>
                                                <div className="truncate text-sm sm:text-base lg:text-lg xl:text-xl font-bold text-emerald-700 dark:text-emerald-400">
                                                    {plan.stats.users_per_store}
                                                </div>
                                            </div>
                                            <div
                                                className="relative truncate text-[10px] font-medium tracking-tight text-emerald-600 uppercase sm:text-xs dark:text-emerald-400/90"
                                                title={t('Users/Store')}
                                            >
                                                {t('Users/Store')}
                                            </div>
                                        </div>
                                        <div className="group-hover:border-primary/30 relative overflow-hidden rounded-xl border border-gray-200 bg-white p-2 sm:p-2.5 transition-colors sm:p-3 min-w-0 dark:border-gray-800 dark:bg-gray-800/60">
                                            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-transparent opacity-70 dark:from-orange-950/40 dark:to-transparent"></div>
                                            <div className="relative mb-1 flex items-center gap-1.5 sm:gap-2">
                                                <div className="shrink-0 rounded-full bg-orange-100 p-1 text-orange-600 sm:p-1.5 dark:bg-orange-900/40 dark:text-orange-400">
                                                    {statIcons.products_per_store}
                                                </div>
                                                <div className="truncate text-sm sm:text-base lg:text-lg xl:text-xl font-bold text-orange-700 dark:text-orange-400">
                                                    {plan.stats.products_per_store}
                                                </div>
                                            </div>
                                            <div
                                                className="relative truncate text-[10px] font-medium tracking-tight text-orange-600 uppercase sm:text-xs dark:text-orange-400/90"
                                                title={t('Products/Store')}
                                            >
                                                {t('Products/Store')}
                                            </div>
                                        </div>
                                        <div className="group-hover:border-primary/30 relative overflow-hidden rounded-xl border border-gray-200 bg-white p-2 sm:p-2.5 transition-colors sm:p-3 min-w-0 dark:border-gray-800 dark:bg-gray-800/60">
                                            <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-transparent opacity-70 dark:from-amber-950/40 dark:to-transparent"></div>
                                            <div className="relative mb-1 flex items-center gap-1.5 sm:gap-2">
                                                <div className="shrink-0 rounded-full bg-amber-100 p-1 text-amber-600 sm:p-1.5 dark:bg-amber-900/40 dark:text-amber-400">
                                                    {statIcons.storage}
                                                </div>
                                                <div className="truncate text-sm sm:text-base lg:text-lg xl:text-xl font-bold text-amber-700 dark:text-amber-400">{plan.stats.storage}</div>
                                            </div>
                                            <div
                                                className="relative truncate text-[10px] font-medium tracking-tight text-amber-600 uppercase sm:text-xs dark:text-amber-400/90"
                                                title={t('Storage')}
                                            >
                                                {t('Storage')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-2 grid grid-cols-2 gap-2 sm:mt-3 sm:gap-3">
                                        <div className="group-hover:border-primary/30 relative overflow-hidden rounded-xl border border-gray-200 bg-white p-2 sm:p-2.5 transition-colors sm:p-3 min-w-0 dark:border-gray-800 dark:bg-gray-800/60">
                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent opacity-70 dark:from-purple-950/40 dark:to-transparent"></div>
                                            <div className="relative mb-1 flex items-center gap-1.5 sm:gap-2">
                                                <div className="shrink-0 rounded-full bg-purple-100 p-1 text-purple-600 sm:p-1.5 dark:bg-purple-900/40 dark:text-purple-400">
                                                    {statIcons.templates}
                                                </div>
                                                <div className="truncate text-sm sm:text-base lg:text-lg xl:text-xl font-bold text-purple-700 dark:text-purple-400">{plan.stats.templates}</div>
                                            </div>
                                            <div
                                                className="relative truncate text-[10px] font-medium tracking-tight text-purple-600 uppercase sm:text-xs dark:text-purple-400/90"
                                                title={t('Themes')}
                                            >
                                                {t('Themes')}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="mt-auto border-t border-gray-200 dark:border-gray-800 pt-4">
                                    {isAdmin ? (
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={plan.status}
                                                    onCheckedChange={() => togglePlanStatus(plan.id)}
                                                    className={plan.status ? 'data-[state=checked]:bg-primary' : ''}
                                                />
                                                <span className="text-muted-foreground text-sm">{plan.status ? t('Active') : t('Inactive')}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {hasPermission('edit-plans', auth) && (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-9 w-9 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 p-0"
                                                                    title={t('Edit')}
                                                                    onClick={() => router.get(route('plans.edit', plan.id))}
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>{t('Edit')}</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}

                                                {!plan.is_default && hasPermission('delete-plans', auth) && (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-9 w-9 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 p-0"
                                                                    title={t('Delete')}
                                                                    onClick={() => handleDelete(plan)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>{t('Delete')}</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        getActionButton(plan)
                                    )}
                                </div>

                            </div>
                        </div>
                    ))}
                </div>

                {/* Delete Modal - Admin only */}
                {isAdmin && (
                    <CrudDeleteModal
                        isOpen={isDeleteModalOpen}
                        onClose={() => setIsDeleteModalOpen(false)}
                        onConfirm={handleDeleteConfirm}
                        itemName={planToDelete?.name || ''}
                        entityName="plan"
                    />
                )}

                {/* Subscription Modal - Company only */}
                {!isAdmin && selectedPlan && (
                    <PlanSubscriptionModal
                        isOpen={isSubscriptionModalOpen}
                        onClose={() => {
                            setIsSubscriptionModalOpen(false);
                            setSelectedPlan(null);
                        }}
                        plan={selectedPlan}
                        billingCycle={billingCycle}
                        paymentMethods={formatPaymentMethods(selectedPlan.paymentMethods)}
                    />
                )}
            </div>
        </PageTemplate>
    );
}
