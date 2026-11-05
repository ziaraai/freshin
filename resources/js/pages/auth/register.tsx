import { useForm, usePage } from '@inertiajs/react';
import { Mail, Lock, User, Eye, EyeOff, CreditCard, QrCode, Calendar, BarChart3 } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

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
import { toast } from '@/components/custom-toast';

type RegisterForm = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    terms: boolean;
    recaptcha_token?: string;
    plan_id?: string;
    referral_code?: string;
};

interface PageProps {
    settings?: Record<string, unknown>;
    globalSettings?: Record<string, unknown>;
    [key: string]: unknown;
}

export default function Register({ referralCode, planId }: { referralCode?: string; planId?: string }) {
    const { t } = useTranslation();
    const [recaptchaToken, setRecaptchaToken] = useState<string>('');
    const [showTermsError, setShowTermsError] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState<boolean>(false);
    const { themeColor, customColor } = useBrand();
    const { props } = usePage<PageProps>();
    const settings = (props.settings || {}) as Record<string, unknown>;
    const globalSettings = (props.globalSettings || {}) as Record<string, unknown>;
    const recaptchaEnabled = settings.recaptchaEnabled === 'true' || settings.recaptchaEnabled === true || settings.recaptchaEnabled === 1 || settings.recaptchaEnabled === '1' || globalSettings.recaptchaEnabled === 'true' || globalSettings.recaptchaEnabled === true || globalSettings.recaptchaEnabled === 1 || globalSettings.recaptchaEnabled === '1';
    const termsConditionsUrl = (settings.termsConditionsUrl || globalSettings.termsConditionsUrl) as string | undefined;
    const primaryColor = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS];
    
    const { data, setData, post, processing, errors, reset, transform } = useForm<RegisterForm>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        terms: false,
        plan_id: planId,
        referral_code: referralCode,
        recaptcha_token: '',
    });

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        
        if (!data.terms) {
            setShowTermsError(true);
            return;
        }
        
        setShowTermsError(false);
        
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
                post(route('register'), {
                    onFinish: () => reset('password', 'password_confirmation'),
                });
                return;
            } catch {
                toast.error(t('reCAPTCHA verification failed. Please try again.'));
                return;
            }
        }
        
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const registerRightSection = (
        <div className="w-full">
            <div className="text-center mb-4 lg:mb-6 xl:mb-10">
                <h2 className="text-2xl lg:text-3xl xl:text-[38px] font-bold text-gray-900 dark:text-white mb-2 lg:mb-3 xl:mb-4 leading-tight">
                    {t("Elevate Your Business")}<br />
                    {t("in")} <span style={{ color: primaryColor }}>{t("One Place")}</span>
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-xs lg:text-[13px] xl:text-[15px] max-w-md mx-auto leading-relaxed">
                    {t("Create your online store, share products effortlessly, and manage orders seamlessly with ease.")}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 lg:gap-3 xl:gap-4 max-w-2xl mx-auto mb-4 lg:mb-6">
                {/* Card 1 */}
                <div className="bg-white dark:bg-gray-800 p-4 lg:p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-start gap-3 lg:gap-4">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                        <CreditCard className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1 mt-0.5 lg:mt-1">
                        <h4 className="font-bold text-gray-900 dark:text-white text-xs lg:text-sm mb-1">{t("Smart Online Store")}</h4>
                        <p className="text-xs lg:text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed ltr:pr-2 rtl:pl-2">{t("Design interactive online catalog tailored to your brand identity.")}</p>
                    </div>
                </div>

                {/* Card 2 */}
                <div className="bg-white dark:bg-gray-800 p-4 lg:p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-start gap-3 lg:gap-4">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                        <QrCode className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1 mt-0.5 lg:mt-1">
                        <h4 className="font-bold text-gray-900 dark:text-white text-xs lg:text-sm mb-1">{t("Instant WhatsApp Ordering")}</h4>
                        <p className="text-xs lg:text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed ltr:pr-2 rtl:pl-2">{t("Share your catalog instantly with a tap, scan, or direct link.")}</p>
                    </div>
                </div>

                {/* Card 3 */}
                <div className="bg-white dark:bg-gray-800 p-4 lg:p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-start gap-3 lg:gap-4">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                        <Calendar className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1 mt-0.5 lg:mt-1">
                        <h4 className="font-bold text-gray-900 dark:text-white text-xs lg:text-sm mb-1">{t("Orders & Inventory")}</h4>
                        <p className="text-xs lg:text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed ltr:pr-2 rtl:pl-2">{t("Capture qualified orders and manage products directly from your dashboard.")}</p>
                    </div>
                </div>

                {/* Card 4 */}
                <div className="bg-white dark:bg-gray-800 p-4 lg:p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-start gap-3 lg:gap-4">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                        <BarChart3 className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1 mt-0.5 lg:mt-1">
                        <h4 className="font-bold text-gray-900 dark:text-white text-xs lg:text-sm mb-1">{t("Real-time Analytics")}</h4>
                        <p className="text-xs lg:text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed ltr:pr-2 rtl:pl-2">{t("Monitor sales, visitors, and track your business performance.")}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <AuthLayout
            title={t("Create your account")}
            description={t("Enter your details below to get started")}
            rightSideContent={registerRightSection}
        >
            <form className="space-y-4 sm:space-y-5" onSubmit={submit}>
                <div className="space-y-3 sm:space-y-4">
                    <div>
                        <Label htmlFor="name" required className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">{t("Full name")}</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3 rtl:pr-3 flex items-center pointer-events-none">
                                <User className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-gray-400" />
                            </div>
                            <Input
                                id="name"
                                type="text"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder={t("Enter your full name")}
                                className="ltr:pl-10 rtl:pr-10 w-full border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg transition-all duration-200 text-sm text-gray-900 dark:text-white h-10 sm:h-11"
                            />
                        </div>
                        <InputError message={errors.name} />
                    </div>

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
                                tabIndex={2}
                                autoComplete="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="company@example.com"
                                className="ltr:pl-10 rtl:pr-10 w-full border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg transition-all duration-200 text-sm text-gray-900 dark:text-white h-10 sm:h-11"
                            />
                        </div>
                        <InputError message={errors.email} />
                    </div>

                    <div>
                        <Label htmlFor="password" required className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">{t("Password")}</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3 rtl:pr-3 flex items-center pointer-events-none">
                                <Lock className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-gray-400" />
                            </div>
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                required
                                tabIndex={3}
                                autoComplete="new-password"
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
                        <InputError message={errors.password} />
                    </div>

                    <div>
                        <Label htmlFor="password_confirmation" required className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">{t("Confirm password")}</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3 rtl:pr-3 flex items-center pointer-events-none">
                                <Lock className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-gray-400" />
                            </div>
                            <Input
                                id="password_confirmation"
                                type={showPasswordConfirmation ? "text" : "password"}
                                required
                                tabIndex={4}
                                autoComplete="new-password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                placeholder="••••••••••••"
                                className="ltr:pl-10 rtl:pr-10 ltr:pr-10 rtl:pl-10 w-full border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg transition-all duration-200 text-sm text-gray-900 dark:text-white h-10 sm:h-11"
                            />
                            <div className="absolute inset-y-0 ltr:right-0 rtl:left-0 ltr:pr-3 rtl:pl-3 flex items-center">
                                <button type="button" tabIndex={-1} onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none cursor-pointer">
                                    {showPasswordConfirmation ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <InputError message={errors.password_confirmation} />
                    </div>
                </div>

                <div className="flex items-center !mt-3 !mb-3">
                    <Checkbox
                        id="terms"
                        name="terms"
                        checked={data.terms}
                        onClick={() => {
                            setData('terms', !data.terms);
                            if (!data.terms) setShowTermsError(false);
                        }}
                        tabIndex={5}
                        className="w-[14px] h-[14px] border border-gray-300 dark:border-gray-600 rounded"
                    />
                    <Label htmlFor="terms" required className="ltr:ml-2 rtl:mr-2 text-sm text-gray-600 dark:text-gray-400">
                        {t("I agree to the")}{' '}
                        <a 
                            href={termsConditionsUrl || route('home')} 
                            target={termsConditionsUrl ? "_blank" : "_self"} 
                            rel={termsConditionsUrl ? "noopener noreferrer" : undefined} 
                            style={{ color: primaryColor }} 
                            className="hover:underline"
                        >
                            {t("Terms and Conditions")}
                        </a>
                    </Label>
                </div>
                <InputError message={errors.terms || (showTermsError ? t('You must agree to the Terms and Conditions to continue') : '')} />

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
                <InputError message={errors.recaptcha_token} />

                <button
                    type="submit"
                    disabled={processing}
                    tabIndex={6}
                    className="cursor-pointer w-full text-white py-2.5 text-sm font-medium tracking-wide transition-all duration-200 rounded-md shadow-md hover:shadow-lg transform hover:scale-[1.02] disabled:opacity-50"
                    style={{ backgroundColor: primaryColor }}
                >
                    {processing ? t("Creating account...") : t("Create Account")}
                </button>

                <div className="text-center">
                    <p className="text-sm text-gray-500">
                        {t("Already have an account?")}{' '}
                        <TextLink 
                            href={route('login')} 
                            className="font-medium hover:underline" 
                            style={{ color: primaryColor }}
                            tabIndex={7}
                        >
                            {t("Sign in")}
                        </TextLink>
                    </p>
                </div>
            </form>
        </AuthLayout>
    );
}