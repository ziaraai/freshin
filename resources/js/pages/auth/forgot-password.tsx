import { useForm, usePage } from '@inertiajs/react';
import { Mail, ShieldCheck, Link as LinkIcon, CreditCard, Users } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import AuthLayout from '@/layouts/auth-layout';
import Recaptcha, { executeRecaptcha } from '@/components/recaptcha';
import { useBrand } from '@/contexts/BrandContext';
import { THEME_COLORS } from '@/hooks/use-appearance';
import { toast } from '@/components/custom-toast';

interface PageProps {
    settings?: Record<string, unknown>;
    globalSettings?: Record<string, unknown>;
    [key: string]: unknown;
}

export default function ForgotPassword({ status }: { status?: string }) {
    const { t } = useTranslation();
    const [recaptchaToken, setRecaptchaToken] = useState<string>('');
    const { themeColor, customColor } = useBrand();
    const { props } = usePage<PageProps>();
    const settings = (props.settings || {}) as Record<string, unknown>;
    const globalSettings = (props.globalSettings || {}) as Record<string, unknown>;
    const recaptchaEnabled = settings.recaptchaEnabled === 'true' || settings.recaptchaEnabled === true || settings.recaptchaEnabled === 1 || settings.recaptchaEnabled === '1' || globalSettings.recaptchaEnabled === 'true' || globalSettings.recaptchaEnabled === true || globalSettings.recaptchaEnabled === 1 || globalSettings.recaptchaEnabled === '1';
    const primaryColor = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS];
    const { data, setData, post, processing, errors, transform } = useForm<{ email: string; recaptcha_token?: string }>({
        email: '',
        recaptcha_token: '',
    });

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        
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
                post(route('password.email'));
                return;
            } catch {
                toast.error(t('reCAPTCHA verification failed. Please try again.'));
                return;
            }
        }
        
        post(route('password.email'));
    };

    const forgotPasswordRightSection = (
        <div className="w-full">
            <div className="text-center mb-4 lg:mb-6 xl:mb-10">
                <h2 className="text-2xl lg:text-3xl xl:text-[36px] font-bold text-gray-900 dark:text-white mb-2 lg:mb-3 xl:mb-4 leading-tight">
                    {t("Get Back to")} <span style={{ color: primaryColor }}>{t("Your Online Store")}</span>
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-xs lg:text-[13px] xl:text-[15px] max-w-md mx-auto leading-relaxed">
                    {t("Forgot your password? Recover your account securely and get back to growing your business.")}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 lg:gap-3 xl:gap-4 max-w-2xl mx-auto mb-4 lg:mb-6 xl:mb-10">
                {/* Card 1 */}
                <div className="bg-white dark:bg-gray-800 p-4 lg:p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-start gap-3 lg:gap-4">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                        <ShieldCheck className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1 mt-0.5 lg:mt-1">
                        <h4 className="font-bold text-gray-900 dark:text-white text-xs tracking-wide mb-1">{t("Verify Your Account")}</h4>
                        <p className="text-xs lg:text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed ltr:pr-2 rtl:pl-2">{t("Confirm your email details securely.")}</p>
                    </div>
                </div>

                {/* Card 2 */}
                <div className="bg-white dark:bg-gray-800 p-4 lg:p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-start gap-3 lg:gap-4">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                        <LinkIcon className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1 mt-0.5 lg:mt-1">
                        <h4 className="font-bold text-gray-900 dark:text-white text-xs tracking-wide mb-1">{t("Recover Access")}</h4>
                        <p className="text-xs lg:text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed ltr:pr-2 rtl:pl-2">{t("Receive a password reset link directly to your inbox.")}</p>
                    </div>
                </div>

                {/* Card 3 */}
                <div className="bg-white dark:bg-gray-800 p-4 lg:p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-start gap-3 lg:gap-4">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                        <CreditCard className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1 mt-0.5 lg:mt-1">
                        <h4 className="font-bold text-gray-900 dark:text-white text-xs tracking-wide mb-1">{t("Keep Stores Active")}</h4>
                        <p className="text-xs lg:text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed ltr:pr-2 rtl:pl-2">{t("Ensure your online stores and catalog links remain live.")}</p>
                    </div>
                </div>

                {/* Card 4 */}
                <div className="bg-white dark:bg-gray-800 p-4 lg:p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-start gap-3 lg:gap-4">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                        <Users className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1 mt-0.5 lg:mt-1">
                        <h4 className="font-bold text-gray-900 dark:text-white text-xs tracking-wide mb-1">{t("Stay Connected")}</h4>
                        <p className="text-xs lg:text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed ltr:pr-2 rtl:pl-2">{t("Reconnect with customers, leads, and orders seamlessly.")}</p>
                    </div>
                </div>
            </div>

            <div className="text-center">
                <div className="w-10 h-0.5 mx-auto mb-3 lg:mb-4 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                <span className="text-xs lg:text-[15px] text-gray-500 dark:text-gray-400">{t("Your store workspace is only a step away.")}</span>
            </div>
        </div>
    );

    return (
        <AuthLayout
            title={t("Forgot your password?")}
            description={t("Enter your email to receive a password reset link")}
            icon={<Mail className="h-7 w-7" style={{ color: primaryColor }} />}
            status={status}
            rightSideContent={forgotPasswordRightSection}
        >
            <form className="space-y-4 sm:space-y-5" onSubmit={submit}>
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
                    <InputError message={errors.email} />
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
                <InputError message={errors.recaptcha_token} />

                <button
                    type="submit"
                    disabled={processing}
                    tabIndex={2}
                    className="cursor-pointer w-full text-white py-2.5 text-sm font-medium tracking-wide transition-all duration-200 rounded-md shadow-md hover:shadow-lg transform hover:scale-[1.02] disabled:opacity-50"
                    style={{ backgroundColor: primaryColor }}
                >
                    {processing ? t("Sending...") : t("Send Reset Link")}
                </button>

                <div className="text-center">
                    <p className="text-sm text-gray-500">
                        {t("Remember your password?")}{' '}
                        <TextLink 
                            href={route('login')} 
                            className="font-medium hover:underline" 
                            style={{ color: primaryColor }}
                            tabIndex={3}
                        >
                            {t("Back to login")}
                        </TextLink>
                    </p>
                </div>
            </form>
        </AuthLayout>
    );
}