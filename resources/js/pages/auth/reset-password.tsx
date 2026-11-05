import { useForm } from '@inertiajs/react';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, CreditCard, BarChart3, Users } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import AuthLayout from '@/layouts/auth-layout';
import { useBrand } from '@/contexts/BrandContext';
import { THEME_COLORS } from '@/hooks/use-appearance';

interface ResetPasswordProps {
    token: string;
    email: string;
}

type ResetPasswordForm = {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
};

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    const { t } = useTranslation();
    const { themeColor, customColor } = useBrand();
    const primaryColor = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS];
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
    const { data, setData, post, processing, errors, reset } = useForm<Required<ResetPasswordForm>>({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const resetPasswordRightSection = (
        <div className="w-full">
            <div className="text-center mb-4 lg:mb-6 xl:mb-10">
                <h2 className="text-2xl lg:text-3xl xl:text-[36px] font-bold text-gray-900 dark:text-white mb-2 lg:mb-3 xl:mb-4 leading-tight">
                    {t("A Fresh Start for")} <span style={{ color: primaryColor }}>{t("Secure Store Access")}</span>
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-xs lg:text-[13px] xl:text-[15px] max-w-md mx-auto leading-relaxed">
                    {t("Create a new password and get back to managing your online store with confidence.")}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 lg:gap-3 xl:gap-4 max-w-2xl mx-auto mb-4 lg:mb-6 xl:mb-10">
                {/* Card 1 */}
                <div className="bg-white dark:bg-gray-800 p-4 lg:p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-start gap-3 lg:gap-4">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                        <ShieldCheck className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1 mt-0.5 lg:mt-1">
                        <h4 className="font-bold text-gray-900 dark:text-white text-xs tracking-wide mb-1">{t("Protect Your Store")}</h4>
                        <p className="text-xs lg:text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed ltr:pr-2 rtl:pl-2">{t("Keep your customer details and store data secure.")}</p>
                    </div>
                </div>

                {/* Card 2 */}
                <div className="bg-white dark:bg-gray-800 p-4 lg:p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-start gap-3 lg:gap-4">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                        <CreditCard className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1 mt-0.5 lg:mt-1">
                        <h4 className="font-bold text-gray-900 dark:text-white text-xs tracking-wide mb-1">{t("Manage Products & Orders")}</h4>
                        <p className="text-xs lg:text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed ltr:pr-2 rtl:pl-2">{t("Update products, themes, and WhatsApp store links anytime.")}</p>
                    </div>
                </div>

                {/* Card 3 */}
                <div className="bg-white dark:bg-gray-800 p-4 lg:p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-start gap-3 lg:gap-4">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                        <BarChart3 className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1 mt-0.5 lg:mt-1">
                        <h4 className="font-bold text-gray-900 dark:text-white text-xs tracking-wide mb-1">{t("Track Your Sales")}</h4>
                        <p className="text-xs lg:text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed ltr:pr-2 rtl:pl-2">{t("Continue monitoring store orders and visitor clicks.")}</p>
                    </div>
                </div>

                {/* Card 4 */}
                <div className="bg-white dark:bg-gray-800 p-4 lg:p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-start gap-3 lg:gap-4">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                        <Users className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1 mt-0.5 lg:mt-1">
                        <h4 className="font-bold text-gray-900 dark:text-white text-xs tracking-wide mb-1">{t("Stay Connected")}</h4>
                        <p className="text-xs lg:text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed ltr:pr-2 rtl:pl-2">{t("Ensure seamless shopping experience for your buyers.")}</p>
                    </div>
                </div>
            </div>

            <div className="text-center">
                <div className="w-10 h-0.5 mx-auto mb-3 lg:mb-4 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                <span className="text-xs lg:text-[15px] text-gray-500 dark:text-gray-400">{t("One secure account. Everything your online store needs.")}</span>
            </div>
        </div>
    );

    return (
        <AuthLayout
            title={t("Reset your password")}
            description={t("Please enter your new password below")}
            icon={<Lock className="h-7 w-7" style={{ color: primaryColor }} />}
            rightSideContent={resetPasswordRightSection}
        >
            <form onSubmit={submit} className="space-y-4 sm:space-y-5">
                <div className="space-y-3 sm:space-y-4">
                    <div>
                        <Label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">{t("Email")}</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3 rtl:pr-3 flex items-center pointer-events-none">
                                <Mail className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-gray-400" />
                            </div>
                            <Input
                                id="email"
                                type="email"
                                readOnly
                                value={data.email}
                                className="ltr:pl-10 rtl:pr-10 w-full border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm text-gray-900 dark:text-white h-10 sm:h-11"
                            />
                        </div>
                        <InputError message={errors.email} />
                    </div>

                    <div>
                        <Label htmlFor="password" required className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">{t("New Password")}</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3 rtl:pr-3 flex items-center pointer-events-none">
                                <Lock className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-gray-400" />
                            </div>
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                required
                                autoFocus
                                tabIndex={1}
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
                        <Label htmlFor="password_confirmation" required className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">{t("Confirm Password")}</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3 rtl:pr-3 flex items-center pointer-events-none">
                                <Lock className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-gray-400" />
                            </div>
                            <Input
                                id="password_confirmation"
                                type={showConfirmPassword ? "text" : "password"}
                                required
                                tabIndex={2}
                                autoComplete="new-password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                placeholder="••••••••••••"
                                className="ltr:pl-10 rtl:pr-10 ltr:pr-10 rtl:pl-10 w-full border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg transition-all duration-200 text-sm text-gray-900 dark:text-white h-10 sm:h-11"
                            />
                            <div className="absolute inset-y-0 ltr:right-0 rtl:left-0 ltr:pr-3 rtl:pl-3 flex items-center">
                                <button type="button" tabIndex={-1} onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none cursor-pointer">
                                    {showConfirmPassword ? (
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

                <button
                    type="submit"
                    disabled={processing}
                    tabIndex={3}
                    className="cursor-pointer w-full text-white py-2.5 text-sm font-medium tracking-wide transition-all duration-200 rounded-md shadow-md hover:shadow-lg transform hover:scale-[1.02] disabled:opacity-50"
                    style={{ backgroundColor: primaryColor }}
                >
                    {processing ? t("Resetting...") : t("Reset Password")}
                </button>
            </form>
        </AuthLayout>
    );
}