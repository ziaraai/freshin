import { useForm, router, usePage } from '@inertiajs/react';
import { Mail, Lock, Eye, EyeOff, Users, ShieldCheck, Building2, Copy, CreditCard, ExternalLink, Store, BarChart3, QrCode, Share2, Contact, Layers, Calendar } from 'lucide-react';
import { FormEventHandler, useState, useEffect } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import AuthLayout from '@/layouts/auth-layout';
import Recaptcha, { executeRecaptcha } from '@/components/recaptcha';
import { useBrand } from '@/contexts/BrandContext';
import { THEME_COLORS } from '@/hooks/use-appearance';
import { getStoreThemes } from '@/data/storeThemes';
import { toast } from '@/components/custom-toast';

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
    recaptcha_token?: string;
};

interface DemoStore {
    id: number;
    name: string;
    slug: string;
    theme: string;
}

interface PageProps {
    settings?: Record<string, unknown>;
    globalSettings?: Record<string, unknown>;
    is_demo?: boolean;
    [key: string]: unknown;
}

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    isDemo?: boolean;
    demoStores?: DemoStore[];
}

export default function Login({ status, canResetPassword, isDemo: propIsDemo, demoStores = [] }: LoginProps) {
    const { t } = useTranslation();
    const [recaptchaToken, setRecaptchaToken] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const { themeColor, customColor, titleText: contextTitleText } = useBrand();
    const primaryColor = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS];
    const { props } = usePage<PageProps>();
    const settings = (props.settings || props.globalSettings || {}) as Record<string, unknown>;
    const recaptchaEnabled = settings.recaptchaEnabled === 'true' || settings.recaptchaEnabled === true || settings.recaptchaEnabled === 1 || settings.recaptchaEnabled === '1';
    const isDemo = Boolean(propIsDemo || props.is_demo || (props.globalSettings as Record<string, unknown> | undefined)?.is_demo || (typeof window !== 'undefined' && (window as unknown as { isDemo?: boolean }).isDemo === true));
    const registrationEnabled = settings.registrationEnabled === 'true' || settings.registrationEnabled === true || settings.registrationEnabled === '1' || settings.registrationEnabled === 1;
    const titleText = (isDemo && ((props.globalSettings as any)?.titleText || (props.globalSettings as any)?.title_text)) ? ((props.globalSettings as any)?.titleText || (props.globalSettings as any)?.title_text) : contextTitleText;

    const { data, setData, post, processing, errors, reset, transform } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });

    useEffect(() => {
        // Set default credentials if in demo mode
        if (isDemo) {
            setData({
                email: 'company@example.com',
                password: 'password',
                remember: false
            });
        }
    }, [isDemo]);

    const handleCopyCredentials = (email: string, password = 'password') => {
        setData({
            ...data,
            email: email,
            password: password
        });

        if (navigator.clipboard) {
            navigator.clipboard.writeText(email);
        }
    };

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        setValidationErrors({});

        if (recaptchaEnabled) {
            try {
                const token = await executeRecaptcha();
                if (!token && !recaptchaToken) {
                    toast.error(t('Please complete the reCAPTCHA verification'));
                    return;
                }
                transform((currentData) => ({
                    ...currentData,
                    recaptcha_token: token || recaptchaToken,
                }));
                post(route('login'), {
                    onFinish: () => reset('password'),
                    preserveState: true,
                    preserveScroll: true,
                    onError: (errs) => {
                        setValidationErrors(errs as Record<string, string>);
                    }
                });
                return;
            } catch {
                toast.error(t('reCAPTCHA verification failed. Please try again.'));
                return;
            }
        }

        post(route('login'), {
            onFinish: () => reset('password'),
            preserveState: true,
            preserveScroll: true,
            onError: (errs) => {
                setValidationErrors(errs as Record<string, string>);
            }
        });
    };

    const openStoreInNewTab = (storeSlug: string, e: React.MouseEvent) => {
        // Prevent the default form submission
        e.preventDefault();
        e.stopPropagation();

        // Open store in new tab
        const url = route('store.home', storeSlug);
        window.open(url, '_blank');
    };

    const getThemeThumbnail = (themeId: string) => {
        const theme = getStoreThemes().find(t => t.id === themeId);
        return theme?.thumbnail || '';
    };

    // Get distinct themes from demo stores
    const distinctThemes = demoStores.reduce((acc: DemoStore[], store) => {
        if (!acc.find(s => s.theme === store.theme)) {
            acc.push(store);
        }
        return acc;
    }, []);

    // Right-side promotional section defined directly in login index file
    const loginRightSection = (
        <>
            <h2 className="text-xl lg:text-2xl xl:text-[40px] font-bold text-[#1E293B] dark:text-white mb-1 lg:mb-2 xl:mb-5 leading-tight">
                {t("Elevate Your Store")}<br />
                {t("Smarter with")} <span style={{ color: primaryColor }}>{t(titleText || 'WhatsStore')}</span>
            </h2>
            <p className="text-[#475569] dark:text-gray-300 text-xs lg:text-[13px] xl:text-lg mb-2 lg:mb-3.5 xl:mb-8 max-w-lg leading-normal xl:leading-relaxed">
                {t("Create, customize, and manage your WhatsApp store instantly – showcase products, receive orders, and grow your sales effortlessly.")}
            </p>

            {/* Cards wrapper */}
            <div className="space-y-2 lg:space-y-2.5 xl:space-y-4 max-w-[100%] lg:max-w-[95%] mx-auto">
                {/* Main Overview Card */}
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100/50 dark:border-gray-700 p-2.5 sm:p-3 lg:p-3.5 xl:p-6">
                    <div className="flex items-center mb-1.5 lg:mb-2 xl:mb-4">
                        <div className="w-6 h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 rounded-lg dark:bg-gray-800 flex items-center justify-center ltr:mr-2 rtl:ml-2 xl:ltr:mr-2.5 xl:rtl:ml-2.5" style={{ backgroundColor: `${primaryColor}15` }}>
                            <CreditCard className="w-3 h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4" style={{ color: primaryColor }} />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-xs lg:text-sm xl:text-lg">{t("Store Performance")}</h3>
                    </div>

                    {/* Workflow Steps Row */}
                    <div className="grid grid-cols-2 xl:grid-cols-4 items-center justify-between gap-1.5 lg:gap-2 xl:gap-3 mb-1.5 lg:mb-2 xl:mb-5">
                        {/* Step 1 */}
                        <div className="min-w-0 flex flex-col justify-between border border-gray-100 dark:border-gray-700 rounded-lg p-1.5 lg:p-2 xl:p-3 shadow-sm bg-white dark:bg-gray-800 min-h-[52px] lg:min-h-[58px] xl:min-h-[90px] h-auto">
                            <div className="flex items-center mb-0.5 xl:mb-1">
                                <Eye className="w-3 h-3 lg:w-3.5 lg:h-3.5 xl:w-4.5 xl:h-4.5" style={{ color: primaryColor }} />
                                <span className="text-[10px] lg:text-[11px] xl:text-[12px] font-bold text-gray-900 dark:text-white ltr:ml-1 rtl:mr-1 truncate line-clamp-1">{t("Store Views")}</span>
                            </div>
                            <div>
                                <div className="text-sm lg:text-base xl:text-xl font-bold mb-0.5 xl:mb-1" style={{ color: primaryColor }}>2,450</div>
                                <div className="h-1 xl:h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full w-full rounded-full" style={{ backgroundColor: primaryColor }}></div>
                                </div>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="min-w-0 flex flex-col justify-between border border-gray-100 dark:border-gray-700 rounded-lg p-1.5 lg:p-2 xl:p-3 shadow-sm bg-white dark:bg-gray-800 min-h-[52px] lg:min-h-[58px] xl:min-h-[90px] h-auto">
                            <div className="flex items-center mb-0.5 xl:mb-1">
                                <QrCode className="w-3 h-3 lg:w-3.5 lg:h-3.5 xl:w-4.5 xl:h-4.5" style={{ color: primaryColor }} />
                                <span className="text-[10px] lg:text-[11px] xl:text-[12px] font-bold text-gray-900 dark:text-white ltr:ml-1 rtl:mr-1 truncate line-clamp-1">{t("QR Scans")}</span>
                            </div>
                            <div>
                                <div className="text-sm lg:text-base xl:text-xl font-bold mb-0.5 xl:mb-1" style={{ color: primaryColor }}>1,280</div>
                                <div className="h-1 xl:h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full w-11/12 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                                </div>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="min-w-0 flex flex-col justify-between border border-gray-100 dark:border-gray-700 rounded-lg p-1.5 lg:p-2 xl:p-3 shadow-sm bg-white dark:bg-gray-800 min-h-[52px] lg:min-h-[58px] xl:min-h-[90px] h-auto">
                            <div className="flex items-center mb-0.5 xl:mb-1">
                                <Share2 className="w-3 h-3 lg:w-3.5 lg:h-3.5 xl:w-4.5 xl:h-4.5 flex-shrink-0" style={{ color: primaryColor }} />
                                <span className="text-[10px] lg:text-[11px] xl:text-[12px] font-bold text-gray-900 dark:text-white ltr:ml-1 rtl:mr-1 truncate line-clamp-1">{t("Store Shares")}</span>
                            </div>
                            <div>
                                <div className="text-sm lg:text-base xl:text-xl font-bold mb-0.5 xl:mb-1" style={{ color: primaryColor }}>840</div>
                                <div className="h-1 xl:h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full w-2/3 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                                </div>
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="min-w-0 flex flex-col justify-between border border-gray-100 dark:border-gray-700 rounded-lg p-1.5 lg:p-2 xl:p-3 shadow-sm bg-white dark:bg-gray-800 min-h-[52px] lg:min-h-[58px] xl:min-h-[90px] h-auto">
                            <div className="flex items-center mb-0.5 xl:mb-1">
                                <Contact className="w-3 h-3 lg:w-3.5 lg:h-3.5 xl:w-4.5 xl:h-4.5" style={{ color: primaryColor }} />
                                <span className="text-[10px] lg:text-[11px] xl:text-[12px] font-bold text-gray-900 dark:text-white ltr:ml-1 rtl:mr-1 truncate line-clamp-1">{t("Total Orders")}</span>
                            </div>
                            <div>
                                <div className="text-sm lg:text-base xl:text-xl font-bold mb-0.5 xl:mb-1" style={{ color: primaryColor }}>320</div>
                                <div className="h-1 xl:h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full w-full rounded-full" style={{ backgroundColor: primaryColor }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lower Stats Row */}
                    <div className="grid grid-cols-2 gap-2 lg:gap-2.5 xl:gap-4 mt-1.5 lg:mt-2.5 xl:mt-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg xl:rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] xl:shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-gray-200 dark:border-gray-700 p-2 lg:p-2.5 xl:p-4 flex items-center">
                            <div className="w-7 h-7 lg:w-8 lg:h-8 xl:w-12 xl:h-12 rounded-full dark:bg-gray-900 flex items-center justify-center ltr:mr-2 rtl:ml-2 xl:ltr:mr-4 xl:rtl:ml-4 flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                                <Store className="w-3.5 h-3.5 lg:w-4 lg:h-4 xl:w-6 xl:h-6" style={{ color: primaryColor }} />
                            </div>
                            <div className="min-w-0">
                                <div className="text-[10px] lg:text-[11px] xl:text-[13px] font-bold text-gray-900 dark:text-white mb-0.5 truncate">{t("Active Stores")}</div>
                                <div className="text-sm lg:text-base xl:text-3xl font-bold text-gray-400">40 <span className="text-[10px] xl:text-xs font-normal">{t("stores")}</span></div>
                                <div className="text-[9px] lg:text-[10px] xl:text-[12px] font-semibold mt-0.5 truncate" style={{ color: primaryColor }}>↑ 24.5% <span className="text-gray-400 font-normal">{t("this month")}</span></div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg xl:rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] xl:shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-gray-200 dark:border-gray-700 p-2 lg:p-2.5 xl:p-4 flex items-center justify-between">
                            <div className="min-w-0">
                                <div className="text-[10px] lg:text-[11px] xl:text-[13px] font-bold text-gray-900 dark:text-white mb-0.5 truncate">{t("Total Sales")}</div>
                                <div className="text-sm lg:text-base xl:text-3xl font-bold font-mono" style={{ color: primaryColor }}>$12,480</div>
                                <div className="text-[9px] lg:text-[10px] xl:text-[12px] font-semibold mt-0.5 flex items-center truncate" style={{ color: primaryColor }}>
                                    <svg className="w-2.5 h-2.5 xl:w-3 xl:h-3 ltr:mr-0.5 rtl:ml-0.5 xl:ltr:mr-1 xl:rtl:ml-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
                                    98.5% <span className="text-gray-400 ltr:ml-1 rtl:mr-1 font-normal">{t("growth rate")}</span>
                                </div>
                            </div>
                            <div className="h-6 w-12 lg:h-8 lg:w-16 xl:h-12 xl:w-24 flex-shrink-0">
                                <svg viewBox="0 0 100 40" className="w-full h-full fill-none overflow-visible" style={{ stroke: primaryColor }} strokeWidth="2.5" preserveAspectRatio="none">
                                    <path d="M0,35 L10,32 L20,38 L30,25 L40,28 L50,15 L60,20 L70,10 L80,12 L90,2 L100,0" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="100" cy="0" r="3" style={{ fill: primaryColor, stroke: 'none' }} />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feature Icons Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 lg:gap-2 xl:gap-4 mt-2 lg:mt-3 xl:mt-4 pt-1 xl:pt-2">
                    <div className="text-center">
                        <div className="w-7 h-7 lg:w-8 lg:h-8 xl:w-12 xl:h-12 mx-auto rounded-full flex items-center justify-center mb-1 xl:mb-3" style={{ backgroundColor: `${primaryColor}15` }}>
                            <QrCode className="w-3.5 h-3.5 lg:w-4 lg:h-4 xl:w-5 xl:h-5" style={{ color: primaryColor }} />
                        </div>
                        <div className="text-[10px] lg:text-[11px] xl:text-[12px] font-bold text-gray-900 dark:text-white mb-0.5 xl:mb-1">{t("Instant Sharing")}</div>
                        <div className="text-[9px] lg:text-[10px] xl:text-[11px] text-gray-500 dark:text-gray-400 leading-tight xl:leading-relaxed px-0.5">{t("Share catalog instantly via QR code or direct link.")}</div>
                    </div>
                    <div className="text-center">
                        <div className="w-7 h-7 lg:w-8 lg:h-8 xl:w-12 xl:h-12 mx-auto rounded-full flex items-center justify-center mb-1 xl:mb-3" style={{ backgroundColor: `${primaryColor}15` }}>
                            <Layers className="w-3.5 h-3.5 lg:w-4 lg:h-4 xl:w-5 xl:h-5" style={{ color: primaryColor }} />
                        </div>
                        <div className="text-[10px] lg:text-[11px] xl:text-[12px] font-bold text-gray-900 dark:text-white mb-0.5 xl:mb-1">{t("Custom Themes")}</div>
                        <div className="text-[9px] lg:text-[10px] xl:text-[11px] text-gray-500 dark:text-gray-400 leading-tight xl:leading-relaxed px-0.5">{t("Choose themes, custom colors, and personalized branding.")}</div>
                    </div>
                    <div className="text-center">
                        <div className="w-7 h-7 lg:w-8 lg:h-8 xl:w-12 xl:h-12 mx-auto rounded-full flex items-center justify-center mb-1 xl:mb-3" style={{ backgroundColor: `${primaryColor}15` }}>
                            <Calendar className="w-3.5 h-3.5 lg:w-4 lg:h-4 xl:w-5 xl:h-5" style={{ color: primaryColor }} />
                        </div>
                        <div className="text-[10px] lg:text-[11px] xl:text-[12px] font-bold text-gray-900 dark:text-white mb-0.5 xl:mb-1">{t("Orders & Shipping")}</div>
                        <div className="text-[9px] lg:text-[10px] xl:text-[11px] text-gray-500 dark:text-gray-400 leading-tight xl:leading-relaxed px-0.5">{t("Manage customer orders and dispatch smoothly.")}</div>
                    </div>
                    <div className="text-center">
                        <div className="w-7 h-7 lg:w-8 lg:h-8 xl:w-12 xl:h-12 mx-auto rounded-full flex items-center justify-center mb-1 xl:mb-3" style={{ backgroundColor: `${primaryColor}15` }}>
                            <BarChart3 className="w-3.5 h-3.5 lg:w-4 lg:h-4 xl:w-5 xl:h-5" style={{ color: primaryColor }} />
                        </div>
                        <div className="text-[10px] lg:text-[11px] xl:text-[12px] font-bold text-gray-900 dark:text-white mb-0.5 xl:mb-1">{t("Store Analytics")}</div>
                        <div className="text-[9px] lg:text-[10px] xl:text-[11px] text-gray-500 dark:text-gray-400 leading-tight xl:leading-relaxed px-0.5">{t("Track visitors, popular products, and business growth.")}</div>
                    </div>
                </div>
            </div>
        </>
    );

    return (
        <AuthLayout
            title={t("Welcome back!")}
            description={t("Sign in to continue to your account")}
            status={status}
            rightSideContent={loginRightSection}
        >
            <form className="space-y-3 sm:space-y-4" onSubmit={submit}>
                <div className="space-y-3 sm:space-y-4">
                    <div>
                        <Label htmlFor="email" required className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">{t("Email address")}</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3 rtl:pr-3 flex items-center pointer-events-none">
                                <Mail className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-gray-400" />
                            </div>
                            <Input
                                id="email"
                                type="email"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="company@example.com"
                                className="ltr:pl-10 rtl:pr-10 w-full border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg transition-all duration-200 text-sm text-gray-900 dark:text-white h-10 sm:h-11"
                            />
                        </div>
                        <InputError message={validationErrors.email || errors.email} />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                            <Label htmlFor="password" required className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("Password")}</Label>
                            {canResetPassword && (
                                <TextLink
                                    href={route('password.request')}
                                    className="text-sm no-underline hover:underline hover:underline-primary"
                                    style={{ color: primaryColor }}
                                    tabIndex={5}
                                >
                                    {t("Forgot password?")}
                                </TextLink>
                            )}
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3 rtl:pr-3 flex items-center pointer-events-none">
                                <Lock className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-gray-400" />
                            </div>
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                required
                                tabIndex={2}
                                autoComplete="current-password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="••••••••••••"
                                className="ltr:pl-10 rtl:pr-10 ltr:pr-10 rtl:pl-10 w-full border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg transition-all duration-200 text-sm text-gray-900 dark:text-white h-10 sm:h-11"
                            />
                            <div className="absolute inset-y-0 ltr:right-0 rtl:left-0 ltr:pr-3 rtl:pl-3 flex items-center">
                                <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none cursor-pointer">
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <InputError message={validationErrors.password || errors.password} />
                    </div>

                    <div className="flex items-center !mt-2 !mb-2.5">
                        <Checkbox
                            id="remember"
                            name="remember"
                            checked={data.remember}
                            onClick={() => setData('remember', !data.remember)}
                            tabIndex={3}
                            className="w-[14px] h-[14px] border border-gray-300 dark:border-gray-600 rounded"
                        />
                        <Label htmlFor="remember" className="ltr:ml-2 rtl:mr-2 text-sm text-gray-600 dark:text-gray-400 select-none cursor-pointer">{t("Remember me")}</Label>
                    </div>
                </div>

                {recaptchaEnabled && (
                    <Recaptcha
                        onVerify={(token) => {
                            setRecaptchaToken(token);
                            setData('recaptcha_token', token);
                        }}
                        onExpired={() => {
                            setRecaptchaToken('');
                            setData('recaptcha_token', '');
                        }}
                        onError={() => {
                            setRecaptchaToken('');
                            setData('recaptcha_token', '');
                        }}
                    />
                )}
                <InputError message={validationErrors.recaptcha_token || errors.recaptcha_token} />

                <button
                    type="submit"
                    disabled={processing}
                    tabIndex={4}
                    className="cursor-pointer w-full text-white py-2.5 text-sm font-medium tracking-wide transition-all duration-200 rounded-md shadow-md hover:shadow-lg transform hover:scale-[1.02] disabled:opacity-50"
                    style={{ backgroundColor: primaryColor }}
                >
                    {processing ? t("Signing in...") : t("Login")}
                </button>

                {registrationEnabled && (
                    <div className="text-center">
                        <p className="text-sm text-gray-500">
                            {t("Don't have an account?")}{' '}
                            <TextLink
                                href={route('register')}
                                className="font-medium hover:underline"
                                style={{ color: primaryColor }}
                                tabIndex={6}
                            >
                                {t("Sign up")}
                            </TextLink>
                        </p>
                    </div>
                )}

                {isDemo && (
                    <>
                        <div className="mt-3 sm:mt-4 border-t border-gray-100/60 dark:border-gray-700">
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
                                <div className="flex items-center mb-2 sm:mb-3">
                                    <Users className="w-4 h-4 ltr:mr-2 rtl:ml-2" style={{ color: primaryColor }} />
                                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{t('Demo Login Credentials')}</h3>
                                </div>

                                <div className="w-full overflow-hidden rounded-lg border border-gray-100 dark:border-gray-700">
                                    <table className="w-full text-xs sm:text-[13px] ltr:text-left rtl:text-right table-fixed">
                                        <thead style={{ backgroundColor: `${primaryColor}10` }}>
                                            <tr className="text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700">
                                                <th className="py-2 ltr:pl-3 rtl:pr-3 font-semibold w-[35%]">{t("Role")}</th>
                                                <th className="py-2 font-semibold w-[35%] truncate">{t("Email")}</th>
                                                <th className="py-2 font-semibold w-[20%]">{t("Password")}</th>
                                                <th className="py-2 ltr:pr-3 rtl:pl-3 w-[10%]"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100/80 dark:divide-gray-700">
                                            <tr
                                                className="cursor-pointer hover:bg-gray-50/60 dark:hover:bg-gray-700/40 transition-colors"
                                                onClick={() => handleCopyCredentials('superadmin@example.com')}
                                            >
                                                <td className="py-2 ltr:pl-3 rtl:pr-3">
                                                    <div className="flex items-center">
                                                        <div className="hidden sm:flex w-5 h-5 rounded-full bg-green-50 dark:bg-green-900/30 items-center justify-center ltr:mr-2 rtl:ml-2 flex-shrink-0">
                                                            <ShieldCheck className="w-3 h-3" style={{ color: primaryColor }} />
                                                        </div>
                                                        <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{t("Super Admin")}</span>
                                                    </div>
                                                </td>
                                                <td className="py-2 text-gray-600 dark:text-gray-300 truncate ltr:pr-2 rtl:pl-2" title="superadmin@example.com">superadmin@example.com</td>
                                                <td className="py-2 text-gray-600 dark:text-gray-300 truncate font-mono text-sm">password</td>
                                                <td className="py-2 ltr:pr-3 rtl:pl-3 ltr:text-right rtl:text-left">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCopyCredentials('superadmin@example.com');
                                                        }}
                                                        className="inline-flex items-center justify-center rounded p-1.5 transition-colors cursor-pointer hover:opacity-80"
                                                        style={{ backgroundColor: `${primaryColor}15` }}
                                                    >
                                                        <Copy className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                                                    </button>
                                                </td>
                                            </tr>
                                            <tr
                                                className="cursor-pointer hover:bg-gray-50/60 dark:hover:bg-gray-700/40 transition-colors"
                                                onClick={() => handleCopyCredentials('company@example.com')}
                                            >
                                                <td className="py-2 ltr:pl-3 rtl:pr-3">
                                                    <div className="flex items-center">
                                                        <div className="hidden sm:flex w-5 h-5 rounded-full bg-purple-50 dark:bg-purple-900/30 items-center justify-center ltr:mr-2 rtl:ml-2 flex-shrink-0">
                                                            <Building2 className="w-3 h-3" style={{ color: primaryColor }} />
                                                        </div>
                                                        <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{t("Shop Owner")}</span>
                                                    </div>
                                                </td>
                                                <td className="py-2 text-gray-600 dark:text-gray-300 truncate ltr:pr-2 rtl:pl-2" title="company@example.com">company@example.com</td>
                                                <td className="py-2 text-gray-600 dark:text-gray-300 truncate font-mono text-sm">password</td>
                                                <td className="py-2 ltr:pr-3 rtl:pl-3 ltr:text-right rtl:text-left">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCopyCredentials('company@example.com');
                                                        }}
                                                        className="inline-flex items-center justify-center rounded p-1.5 transition-colors cursor-pointer hover:opacity-80"
                                                        style={{ backgroundColor: `${primaryColor}15` }}
                                                    >
                                                        <Copy className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                                                    </button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {distinctThemes && distinctThemes.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/60">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-6 h-6 rounded-lg flex items-center justify-center">
                                                    <Store className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                                                </div>
                                                <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white tracking-tight">{t('Store Themes')}</h4>
                                            </div>
                                            {/* <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">
                                                {distinctThemes.length} {t('Demos')}
                                            </span> */}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {distinctThemes.map((store) => (
                                                <div key={store.id} className="relative group">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => openStoreInNewTab(store.slug, e)}
                                                        className="w-full flex items-center justify-between py-2.5 px-3.5 text-xs text-gray-700 dark:text-gray-200 bg-gray-50/80 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 ease-in-out rounded-xl border border-gray-200/80 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-500 font-medium cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.99]"
                                                    >
                                                        <span className="truncate capitalize text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white font-semibold transition-colors duration-200">
                                                            {store.theme.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                                        </span>
                                                        <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:scale-110 ltr:group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-all duration-200 flex-shrink-0 ltr:ml-1.5 rtl:mr-1.5" style={{ color: primaryColor }} />
                                                    </button>

                                                    {/* Floating Theme Preview on Hover */}
                                                    <div className="pointer-events-none absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 z-50 w-56 sm:w-60 p-2 bg-white dark:bg-gray-900 rounded-[1.25rem] shadow-2xl border border-slate-200/80 dark:border-gray-700/80 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out transform translate-y-1 group-hover:translate-y-0">
                                                        <div className="relative h-44 w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-100 dark:border-gray-800">
                                                            <img
                                                                src={getThemeThumbnail(store.theme)}
                                                                alt={store.theme}
                                                                className="absolute inset-0 h-full w-full object-cover object-top transition-all duration-[4000ms] group-hover:scale-[1.03] group-hover:object-bottom"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = `https://placehold.co/300x600?text=${encodeURIComponent(store.theme)}`;
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-white dark:bg-gray-900 border-r border-b border-slate-200/80 dark:border-gray-700/80"></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}



            </form>
        </AuthLayout>
    );
}