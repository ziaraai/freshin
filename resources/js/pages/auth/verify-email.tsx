import { useForm, usePage } from '@inertiajs/react';
import { Mail, ShieldCheck, Link as LinkIcon, CreditCard, Users } from 'lucide-react';
import { FormEventHandler, useEffect, useRef } from 'react';

import TextLink from '@/components/text-link';
import { useTranslation } from 'react-i18next';
import AuthLayout from '@/layouts/auth-layout';
import { toast } from '@/components/custom-toast';
import { useBrand } from '@/contexts/BrandContext';
import { THEME_COLORS } from '@/hooks/use-appearance';

export default function VerifyEmail({ status }: { status?: string }) {
    const { t } = useTranslation();
    const { themeColor, customColor } = useBrand();
    const primaryColor = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS];
    const { post, processing } = useForm({});
    const { flash } = usePage().props as any;

    // Use refs to prevent the same flash value from triggering duplicate toasts
    // (React StrictMode double-invokes effects in development)
    const shownErrorRef = useRef<string | null>(null);
    const shownStatusRef = useRef<string | null>(null);

    // Show flash error toast (e.g. SMTP not configured)
    useEffect(() => {
        if (flash?.error && flash.error !== shownErrorRef.current) {
            shownErrorRef.current = flash.error;
            toast.error(flash.error);
        }
    }, [flash?.error]);

    // Show success toast when status is 'verification-link-sent'
    useEffect(() => {
        if (status === 'verification-link-sent' && status !== shownStatusRef.current) {
            shownStatusRef.current = status;
            toast.success(t('A new verification link has been sent to your email address.'));
        }
    }, [status]);

    // Submit — no onSuccess/onError callbacks; toasts are driven by page props above

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        // Reset refs so new responses can trigger toasts
        shownErrorRef.current = null;
        shownStatusRef.current = null;
        post(route('verification.send'), {
            onSuccess: () => {
                toast.success(t('A new verification link has been sent to your email address.'));
            },
            onError: () => {
                toast.error(t('Failed to send verification email. Please try again.'));
            }
        });
    };

    const verifyEmailRightSection = (
        <div className="w-full">
            <div className="text-center mb-4 lg:mb-6 xl:mb-10">
                <h2 className="text-2xl lg:text-3xl xl:text-[36px] font-bold text-gray-900 dark:text-white mb-2 lg:mb-3 xl:mb-4 leading-tight">
                    {t("Verify Your")} <span style={{ color: primaryColor }}>{t("Email Address")}</span>
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-xs lg:text-[13px] xl:text-[15px] max-w-md mx-auto leading-relaxed">
                    {t("Please verify your email address to secure your account and start managing your store.")}
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
                        <h4 className="font-bold text-gray-900 dark:text-white text-xs tracking-wide mb-1">{t("Quick Activation")}</h4>
                        <p className="text-xs lg:text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed ltr:pr-2 rtl:pl-2">{t("Click the verification link sent directly to your inbox.")}</p>
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
            title={t("Verify your email")}
            description={t("Please verify your email address by clicking on the link we just emailed to you.")}
            icon={<Mail className="h-7 w-7" style={{ color: primaryColor }} />}
            status={status === 'verification-link-sent' ? 
                t("A new verification link has been sent to the email address you provided during registration.") : 
                undefined}
            rightSideContent={verifyEmailRightSection}
        >
            <form onSubmit={submit} className="space-y-4 sm:space-y-5">
                <button
                    type="submit"
                    disabled={processing}
                    className="cursor-pointer w-full text-white py-2.5 text-sm font-medium tracking-wide transition-all duration-200 rounded-md shadow-md hover:shadow-lg transform hover:scale-[1.02] disabled:opacity-50"
                    style={{ backgroundColor: primaryColor }}
                >
                    {processing ? t("Sending...") : t("Resend verification email")}
                </button>

                <div className="text-center">
                    <TextLink 
                        href={route('logout')} 
                        method="post" 
                        as="button"
                        className="font-medium hover:underline transition-colors duration-200 text-sm cursor-pointer"
                        style={{ color: primaryColor }}
                    >
                        {t("Log out")}
                    </TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}