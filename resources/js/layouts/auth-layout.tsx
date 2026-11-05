import { CreditCard, Users, Smartphone, QrCode } from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useBrand } from '@/contexts/BrandContext';
import { useAppearance, THEME_COLORS } from '@/hooks/use-appearance';
import { useFavicon } from '@/hooks/use-favicon';
import CookieConsentBanner from '@/components/CookieConsentBanner';
import { getImageUrl } from '@/utils/image-helper';
import { Head, usePage } from '@inertiajs/react';
import React from 'react';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    description?: string;
    icon?: ReactNode;
    status?: string;
    statusType?: 'success' | 'error';
    rightSideContent?: ReactNode;
}
function hexToAdjustedRgba(hex, opacity = 1, adjust = 0) {
    hex = hex.replace("#", "");
    let r = parseInt(hex.slice(0, 2), 16);
    let g = parseInt(hex.slice(2, 4), 16);
    let b = parseInt(hex.slice(4, 6), 16);
    const clamp = (v) => Math.max(-1, Math.min(1, v));
    const getF = (ch) =>
        typeof adjust === "number" ? clamp(adjust) : clamp(adjust[ch] ?? 0);
    const adj = (c, f) =>
        f < 0 ? Math.floor(c * (1 + f)) : Math.floor(c + (255 - c) * f);
    const rr = adj(r, getF("r"));
    const gg = adj(g, getF("g"));
    const bb = adj(b, getF("b"));
    return opacity === 1
        ? `#${rr.toString(16).padStart(2, "0")}${gg
            .toString(16)
            .padStart(2, "0")}${bb.toString(16).padStart(2, "0")}`.toUpperCase()
        : `rgba(${rr}, ${gg}, ${bb}, ${opacity})`;
}

export default function AuthLayout({
    children,
    title,
    description,
    icon,
    status,
    statusType = 'success',
    rightSideContent,
}: AuthLayoutProps) {
    useFavicon();
    const { t, i18n } = useTranslation();
    const [mounted, setMounted] = useState(false);
    const { logoLight, logoDark, themeColor, customColor, footerText: contextFooterText, titleText: contextTitleText } = useBrand();
    const { appearance } = useAppearance();

    const currentLogo = appearance === 'dark' ? logoLight : logoDark;
    const primaryColor = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS];

    const pageProps = usePage().props as any;
    const globalSettings = pageProps?.globalSettings;
    const userLanguage = pageProps?.userLanguage;

    const isDemo = globalSettings?.is_demo || false;
    const titleText = (isDemo && (globalSettings?.titleText || globalSettings?.title_text)) ? (globalSettings?.titleText || globalSettings?.title_text) : contextTitleText;
    const footerText = (isDemo && (globalSettings?.footerText || globalSettings?.footer_text)) ? (globalSettings?.footerText || globalSettings?.footer_text) : contextFooterText;

    useEffect(() => {
        setMounted(true);

        // Set default language from global settings
        if (userLanguage && i18n.language !== userLanguage) {
            i18n.changeLanguage(userLanguage);
        }
    }, [userLanguage]);

    const { url } = usePage();
    const isLoginPage = url.includes('login') || url === '/' || url === '';
    const isRegisterPage = url.includes('register');
    const isForgotPasswordPage = url.includes('forgot-password') || url.includes('password/reset');
    const isResetPasswordPage = url.includes('reset-password');
    const isVerifyEmailPage = url.includes('verify-email');
    const isConfirmPasswordPage = url.includes('confirm-password');
    const isCenteredHeader = isForgotPasswordPage || isResetPasswordPage || isVerifyEmailPage || isConfirmPasswordPage;

    // RTL Support for auth pages
    // useEffect(() => {
    //     const globalSettings = (window as any).page?.props?.globalSettings;
    //     const isDemo = globalSettings?.is_demo || false;
    //     let storedPosition = 'left';

    //     if (isDemo) {
    //         // In demo mode, use cookies
    //         const getCookie = (name: string): string | null => {
    //             if (typeof document === 'undefined') return null;
    //             const value = `; ${document.cookie}`;
    //             const parts = value.split(`; ${name}=`);
    //             if (parts.length === 2) {
    //                 const cookieValue = parts.pop()?.split(';').shift();
    //                 return cookieValue ? decodeURIComponent(cookieValue) : null;
    //             }
    //             return null;
    //         };
    //         const stored = getCookie('layoutPosition');
    //         if (stored === 'left' || stored === 'right') {
    //             storedPosition = stored;
    //         }
    //     } else {
    //         // In normal mode, get from database via globalSettings
    //         const stored = globalSettings?.layoutDirection;
    //         if (stored === 'left' || stored === 'right') {
    //             storedPosition = stored;
    //         }
    //     }

    //     const dir = storedPosition === 'right' ? 'rtl' : 'ltr';
    //     document.documentElement.dir = dir;
    //     document.documentElement.setAttribute('dir', dir);

    //     // Check if it was actually set
    //     setTimeout(() => {
    //         const actualDir = document.documentElement.getAttribute('dir');
    //         if (actualDir !== dir) {
    //             document.documentElement.dir = dir;
    //             document.documentElement.setAttribute('dir', dir);
    //         }
    //     }, 1);
    // }, []);

    // RTL Support for auth pages - Apply immediately and persist
    const applyRTLDirection = React.useCallback(() => {
        const isDemo = globalSettings?.is_demo || false;
        const currentLang = i18n.language || userLanguage || globalSettings?.defaultLanguage || 'en';
        const isRTLLanguage = ['ar', 'he'].includes(currentLang);
        let dir = 'ltr';

        const getCookie = (name: string): string | null => {
            if (typeof document === 'undefined') return null;
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) {
                const cookieValue = parts.pop()?.split(';').shift();
                return cookieValue ? decodeURIComponent(cookieValue) : null;
            }
            return null;
        };

        // Check RTL setting from cookies/globalSettings
        const layoutDirection = isDemo ? getCookie('layoutPosition') : globalSettings?.layoutDirection;
        const isRTLSetting = layoutDirection === 'right';

        // Apply RTL if: 1) Language is ar/he OR 2) RTL setting is enabled
        if (isRTLLanguage || isRTLSetting) {
            dir = 'rtl';
        }

        // Apply direction immediately
        document.documentElement.dir = dir;
        document.documentElement.setAttribute('dir', dir);
        document.body.dir = dir;

        return dir;
    }, [i18n.language, userLanguage, globalSettings?.defaultLanguage, globalSettings?.is_demo, globalSettings?.layoutDirection]);

    // Apply RTL on mount and when dependencies change
    React.useLayoutEffect(() => {
        const direction = applyRTLDirection();

        const handleLanguageChanged = () => {
            applyRTLDirection();
        };

        window.addEventListener('languageChanged', handleLanguageChanged);

        // Ensure direction persists after any DOM changes
        const observer = new MutationObserver(() => {
            if (document.documentElement.dir !== direction) {
                document.documentElement.dir = direction;
                document.documentElement.setAttribute('dir', direction);
            }
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['dir']
        });

        // return () => observer.disconnect();
        return () => {
            window.removeEventListener('languageChanged', handleLanguageChanged);
            observer.disconnect();
            // Reset to LTR when leaving auth layout            
            document.documentElement.dir = 'ltr';
            document.documentElement.setAttribute('dir', 'ltr');
            document.body.dir = 'ltr';
        };
    }, [applyRTLDirection]);

    return (
        <div className="min-h-screen [@media(min-width:769px)]:h-screen overflow-hidden flex flex-col [@media(min-width:769px)]:flex-row w-full bg-white dark:bg-gray-900 ltr:text-left rtl:text-right font-sans">
            <Head title={title} />

            {/* Left Side (Form) */}
            <div className="w-full [@media(min-width:769px)]:w-[50%] xl:w-[45%] flex flex-col justify-between min-h-screen [@media(min-width:769px)]:min-h-0 [@media(min-width:769px)]:h-full p-4 sm:p-6 lg:p-8 xl:p-8 relative overflow-y-auto scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {/* Language Switcher for Mobile / Tablet (< 769px) */}
                <div className="absolute top-4 end-4 sm:top-6 sm:end-6 ltr:right-4 rtl:left-4 sm:ltr:right-6 sm:rtl:left-6 z-20 bg-white dark:bg-gray-800 rounded-md shadow-sm [@media(min-width:769px)]:hidden">
                    <LanguageSwitcher />
                </div>

                {/* Header - Logo */}
                <div className="flex justify-center">
                    <div className="inline-block">
                        {currentLogo ? (
                            <img src={getImageUrl(currentLogo)} alt="Logo" className="h-30 sm:h-30 w-auto max-w-[250px] object-contain" />
                        ) : (
                            <div className="flex items-center justify-center gap-2">
                                <CreditCard className="h-9 w-9 sm:h-11 sm:w-11" style={{ color: primaryColor }} />
                                <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{titleText || 'WhatsStore'}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Form Content */}
                <div className="flex-1 flex flex-col justify-center w-full max-w-lg mx-auto py-2 xl:py-4 ltr:text-left rtl:text-right">
                    <div className={`flex flex-col ${isCenteredHeader ? 'items-center text-center' : 'items-start ltr:text-left rtl:text-right'}`}>
                        {icon && (
                            <div className={`mb-3 flex items-center justify-center rounded-full ${isCenteredHeader ? 'h-14 w-14' : 'h-11 w-11'}`} style={{ backgroundColor: `${primaryColor}20` }}>
                                {icon}
                            </div>
                        )}
                        <h1 className="text-[28px] font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
                        <div className={`w-8 h-1 mb-3 ${isCenteredHeader ? 'mx-auto' : ''}`} style={{ backgroundColor: primaryColor }}></div>
                        {description && (
                            <p className="text-gray-500 dark:text-gray-400 mb-6 sm:mb-8 truncate line-clamp-2">{description}</p>
                        )}
                    </div>

                    {status && (
                        <div className={`mb-5 text-sm font-medium ${statusType === 'success' ? 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800/40' : 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800/40'} p-3 rounded-lg border`}>
                            {status}
                        </div>
                    )}

                    {children}
                </div>

                {/* Footer - Copyright Info */}
                <div className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm text-center">
                    {footerText || `© ${new Date().getFullYear()} ${globalSettings?.company_name || 'WhatsStore SaaS'}. ${t("All rights reserved.")}`}
                </div>
            </div>

            {/* Right Side (Graphics/Promotional) */}
            <div className="hidden [@media(min-width:769px)]:flex w-full [@media(min-width:769px)]:w-[50%] xl:w-[55%] bg-slate-50 dark:bg-gray-950 items-center justify-center p-4 lg:p-6 xl:p-12 relative overflow-hidden">
                {/* Language Switcher for Desktop */}
                <div className="absolute top-4 end-4 ltr:right-4 rtl:left-4 lg:top-6 lg:end-6 lg:ltr:right-6 lg:rtl:left-6 xl:top-10 xl:end-10 xl:ltr:right-10 xl:rtl:left-10 z-20 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
                    <LanguageSwitcher />
                </div>

                {/* Promotional Content */}
                <div className="w-full max-w-[800px] z-10 my-auto py-1 lg:py-2 xl:py-4">
                    {rightSideContent}
                </div>

                {/* Decorative Background Elements */}
                <div className="absolute top-0 ltr:right-0 rtl:left-0 ltr:-mt-20 rtl:-mt-20 ltr:-mr-20 rtl:-ml-20 w-[600px] h-[600px] rounded-full mix-blend-multiply opacity-10 blur-3xl pointer-events-none" style={{ backgroundColor: primaryColor }}></div>

                <div className="absolute top-12 ltr:right-24 rtl:left-24 opacity-20 pointer-events-none">
                    <svg width="80" height="80" fill="none" viewBox="0 0 80 80">
                        <pattern id="dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                            <circle cx="2" cy="2" r="2" fill="currentColor" style={{ color: primaryColor }} />
                        </pattern>
                        <rect x="0" y="0" width="80" height="80" fill="url(#dots)" />
                    </svg>
                </div>

                <div className="absolute bottom-0 ltr:left-0 rtl:right-0 ltr:-mb-20 rtl:-mb-20 ltr:-ml-20 rtl:-mr-20 w-[400px] h-[400px] rounded-full mix-blend-multiply opacity-[0.05] blur-3xl pointer-events-none" style={{ backgroundColor: primaryColor }}></div>
                <div className="absolute bottom-0 ltr:right-0 rtl:left-0 ltr:-mb-20 rtl:-mb-20 ltr:-mr-20 rtl:-ml-20 w-[400px] h-[400px] rounded-full mix-blend-multiply opacity-[0.05] blur-3xl pointer-events-none" style={{ backgroundColor: primaryColor }}></div>

                <div className="absolute bottom-12 ltr:left-24 rtl:right-24 opacity-20 pointer-events-none">
                    <svg width="48" height="48" fill="none" viewBox="0 0 48 48">
                        <pattern id="dots-bl" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                            <circle cx="2" cy="2" r="2" fill="currentColor" style={{ color: primaryColor }} />
                        </pattern>
                        <rect x="0" y="0" width="48" height="48" fill="url(#dots-bl)" />
                    </svg>
                </div>

                <div className="absolute bottom-12 ltr:right-24 rtl:left-24 opacity-20 pointer-events-none">
                    <svg width="48" height="48" fill="none" viewBox="0 0 48 48">
                        <pattern id="dots-br" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                            <circle cx="2" cy="2" r="2" fill="currentColor" style={{ color: primaryColor }} />
                        </pattern>
                        <rect x="0" y="0" width="48" height="48" fill="url(#dots-br)" />
                    </svg>
                </div>
            </div>
            <CookieConsentBanner />
        </div>

    );
}