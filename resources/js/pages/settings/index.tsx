import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type NavItem } from '@/types';
import { useEffect, useRef, useState } from 'react';
import { Settings as SettingsIcon, Building, DollarSign, Users, RefreshCw, Palette, BookOpen, Award, FileText, Mail, Bell, Link2, CreditCard, Calendar, HardDrive, Shield, Bot, Cookie, Search, Webhook, Wallet, MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import SystemSettings from './components/system-settings';
import { usePage } from '@inertiajs/react';

import CurrencySettings from './components/currency-settings';

import BrandSettings from './components/brand-settings';
import EmailSettings from './components/email-settings';
import PaymentSettings from './components/payment-settings';
import StorageSettings from './components/storage-settings';
import RecaptchaSettings from './components/recaptcha-settings';
import ChatGptSettings from './components/chatgpt-settings';
import CookieSettings from './components/cookie-settings';
import SeoSettings from './components/seo-settings';
import CacheSettings from './components/cache-settings';
import EmailNotificationSettings from './components/email-notification-settings';
import TwilioSettings from './components/twilio-settings';
import WebhookSettings from './components/webhook-settings';


import { useTranslation } from 'react-i18next';
import { hasPermission } from '@/utils/permissions';
import { useLayout } from '@/contexts/LayoutContext';

export default function Settings() {
  const { t } = useTranslation();
  const { systemSettings = {}, cacheSize = '0.00', timezones = {}, dateFormats = {}, timeFormats = {}, paymentSettings = {}, webhooks = [], availableModules = {}, templates = [], auth = {} } = usePage().props as any;
  const [activeSection, setActiveSection] = useState('system-settings');

  // Define all possible sidebar navigation items
  const allSidebarNavItems: (NavItem & { permission?: string })[] = [
    {
      title: t('System Settings'),
      href: '#system-settings',
      icon: <SettingsIcon className="h-4 w-4 mr-2" />,
      permission: 'manage-settings'
    },
    {
      title: t('Brand Settings'),
      href: '#brand-settings',
      icon: <Palette className="h-4 w-4 mr-2" />,
      permission: 'manage-settings'
    },
    {
      title: t('Currency Settings'),
      href: '#currency-settings',
      icon: <DollarSign className="h-4 w-4 mr-2" />,
      permission: 'manage-settings'
    },
    {
      title: t('Email Settings'),
      href: '#email-settings',
      icon: <Mail className="h-4 w-4 mr-2" />,
      permission: 'manage-settings'
    },
    {
      title: t('Email Notification Settings'),
      href: '#email-notification-settings',
      icon: <Bell className="h-4 w-4 mr-2" />,
      permission: 'manage-settings'
    },
    {
      title: t('Payment Settings'),
      href: '#payment-settings',
      icon: <CreditCard className="h-4 w-4 mr-2" />,
      permission: 'manage-settings'
    },
    {
      title: t('Twilio Settings'),
      href: '#twilio-settings',
      icon: <MessageSquare className="h-4 w-4 mr-2" />,
      permission: 'manage-settings'
    },
    {
      title: t('Storage Settings'),
      href: '#storage-settings',
      icon: <HardDrive className="h-4 w-4 mr-2" />,
      permission: 'manage-storage-settings'
    },
    {
      title: t('ReCaptcha Settings'),
      href: '#recaptcha-settings',
      icon: <Shield className="h-4 w-4 mr-2" />,
      permission: 'manage-recaptcha-settings'
    },
    {
      title: t('Chat GPT Settings'),
      href: '#chatgpt-settings',
      icon: <Bot className="h-4 w-4 mr-2" />,
      permission: 'manage-chatgpt-settings'
    },
    {
      title: t('Cookie Settings'),
      href: '#cookie-settings',
      icon: <Cookie className="h-4 w-4 mr-2" />,
      permission: 'manage-cookie-settings'
    },
    {
      title: t('SEO Settings'),
      href: '#seo-settings',
      icon: <Search className="h-4 w-4 mr-2" />,
      permission: 'manage-seo-settings'
    },
    {
      title: t('Cache Settings'),
      href: '#cache-settings',
      icon: <HardDrive className="h-4 w-4 mr-2" />,
      permission: 'manage-cache-settings'
    },
    {
      title: t('Webhook Settings'),
      href: '#webhook-settings',
      icon: <Webhook className="h-4 w-4 mr-2" />,
      permission: 'manage-settings'
    },

  ];

  // Filter sidebar items based on user permissions
  const sidebarNavItems = allSidebarNavItems.filter(item => {
    // Special case: Email Notification Settings only for company users
    if (item.href === '#email-notification-settings') {
      return auth.user?.type === 'company';
    }

    // Special case: Twilio Settings - exclude superadmin
    if (item.href === '#twilio-settings') {
      return auth.permissions?.includes('manage-settings') && auth.user?.type !== 'superadmin';
    }

    // Special case: Webhook Settings - exclude superadmin
    if (item.href === '#webhook-settings') {
      return auth.permissions?.includes('manage-settings') && auth.user?.type !== 'superadmin';
    }

    // If no permission is required or user has the permission
    if (!item.permission || (auth.permissions && auth.permissions.includes(item.permission))) {
      return true;
    }
    // For company users, only show specific settings
    if (auth.user && auth.user.type === 'company') {
      // Only allow settings permission
      return ['manage-settings', 'manage-webhook-settings'].includes(item.permission);
    }
    return false;
  });

  // Refs for each section
  const systemSettingsRef = useRef<HTMLDivElement>(null);
  const brandSettingsRef = useRef<HTMLDivElement>(null);

  const currencySettingsRef = useRef<HTMLDivElement>(null);
  const emailSettingsRef = useRef<HTMLDivElement>(null);
  const emailNotificationSettingsRef = useRef<HTMLDivElement>(null);
  const paymentSettingsRef = useRef<HTMLDivElement>(null);
  const twilioSettingsRef = useRef<HTMLDivElement>(null);
  const storageSettingsRef = useRef<HTMLDivElement>(null);
  const recaptchaSettingsRef = useRef<HTMLDivElement>(null);
  const chatgptSettingsRef = useRef<HTMLDivElement>(null);
  const cookieSettingsRef = useRef<HTMLDivElement>(null);
  const seoSettingsRef = useRef<HTMLDivElement>(null);
  const cacheSettingsRef = useRef<HTMLDivElement>(null);
  const webhookSettingsRef = useRef<HTMLDivElement>(null);



  // Smart scroll functionality
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100; // Add offset for better UX

      // Get positions of each section
      const systemSettingsPosition = systemSettingsRef.current?.offsetTop || 0;
      const brandSettingsPosition = brandSettingsRef.current?.offsetTop || 0;

      const currencySettingsPosition = currencySettingsRef.current?.offsetTop || 0;
      const emailSettingsPosition = emailSettingsRef.current?.offsetTop || 0;
      const emailNotificationSettingsPosition = emailNotificationSettingsRef.current?.offsetTop || 0;
      const paymentSettingsPosition = paymentSettingsRef.current?.offsetTop || 0;
      const twilioSettingsPosition = twilioSettingsRef.current?.offsetTop || 0;
      const storageSettingsPosition = storageSettingsRef.current?.offsetTop || 0;
      const recaptchaSettingsPosition = recaptchaSettingsRef.current?.offsetTop || 0;
      const chatgptSettingsPosition = chatgptSettingsRef.current?.offsetTop || 0;
      const cookieSettingsPosition = cookieSettingsRef.current?.offsetTop || 0;
      const seoSettingsPosition = seoSettingsRef.current?.offsetTop || 0;
      const cacheSettingsPosition = cacheSettingsRef.current?.offsetTop || 0;
      const webhookSettingsPosition = webhookSettingsRef.current?.offsetTop || 0;


      // Determine active section based on scroll position
      if (scrollPosition >= webhookSettingsPosition && webhookSettingsPosition > 0) {
        setActiveSection('webhook-settings');
      } else if (scrollPosition >= cacheSettingsPosition && cacheSettingsPosition > 0) {
        setActiveSection('cache-settings');
      } else if (scrollPosition >= seoSettingsPosition && seoSettingsPosition > 0) {
        setActiveSection('seo-settings');
      } else if (scrollPosition >= cookieSettingsPosition && cookieSettingsPosition > 0) {
        setActiveSection('cookie-settings');
      } else if (scrollPosition >= chatgptSettingsPosition && chatgptSettingsPosition > 0) {
        setActiveSection('chatgpt-settings');
      } else if (scrollPosition >= recaptchaSettingsPosition && recaptchaSettingsPosition > 0) {
        setActiveSection('recaptcha-settings');
      } else if (scrollPosition >= storageSettingsPosition && storageSettingsPosition > 0) {
        setActiveSection('storage-settings');
      } else if (scrollPosition >= twilioSettingsPosition && twilioSettingsPosition > 0) {
        setActiveSection('twilio-settings');
      } else if (scrollPosition >= paymentSettingsPosition && paymentSettingsPosition > 0) {
        setActiveSection('payment-settings');
      } else if (scrollPosition >= emailNotificationSettingsPosition && emailNotificationSettingsPosition > 0) {
        setActiveSection('email-notification-settings');
      } else if (scrollPosition >= emailSettingsPosition && emailSettingsPosition > 0) {
        setActiveSection('email-settings');
      } else if (scrollPosition >= currencySettingsPosition && currencySettingsPosition > 0) {
        setActiveSection('currency-settings');

      } else if (scrollPosition >= brandSettingsPosition && brandSettingsPosition > 0) {
        setActiveSection('brand-settings');
      } else {
        setActiveSection('system-settings');
      }
    };

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);

    // Initial check for hash in URL
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const element = document.getElementById(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        setActiveSection(hash);
      }
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Handle navigation click
  const handleNavClick = (href: string) => {
    const id = href.replace('#', '');
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  const { position } = useLayout();

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Settings') }
  ];

  return (
    <PageTemplate
      title={t('Settings')}
      url="/settings"
      breadcrumbs={breadcrumbs}
      description={t("Manage system settings")}
    >
      <style>{`
        main {
          max-width: 100vw;
          overflow-x: clip !important;
        }
        body {
          overflow-x: clip !important;
        }
      `}</style>
      <div className="space-y-6 w-full min-w-0">
        <div className={`flex flex-col xl:flex-row gap-6 xl:gap-8 w-full min-w-0 items-start`} dir={position === 'right' ? 'rtl' : 'ltr'}>
          {/* Desktop Sidebar Navigation */}
          <div className="hidden xl:block w-full xl:w-70 flex-shrink-0 sticky xl:top-20 z-30">
            <ScrollArea className="h-56 sm:h-64 xl:h-[calc(100vh-5rem)]" dir={position === 'right' ? 'rtl' : 'ltr'}>
              <div className={`flex flex-col gap-2 rounded-lg border bg-card text-card-foreground shadow-sm p-3 ${position === 'right' ? 'pl-4' : 'pr-4'}`}>
                {sidebarNavItems.map((item) => (
                  <Button
                    key={item.href}
                    variant="ghost"
                    className={cn('w-full justify-start text-xs sm:text-sm', {
                      'bg-muted font-medium': activeSection === item.href.replace('#', ''),
                    })}
                    onClick={() => handleNavClick(item.href)}
                  >
                    {item.icon}
                    <span className="truncate">{item.title}</span>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Main Content */}
          <div className="flex-1 w-full min-w-0 relative z-0">
            {/* Mobile Sticky Sidebar Navigation */}
            <div className="xl:hidden sticky top-0 z-50 pt-1 pb-4 bg-slate-50 dark:bg-gray-950 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-2">
                <div className="max-h-[240px] overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]">
                  <div className="space-y-1">
                    {sidebarNavItems.map((item) => (
                      <button
                        key={item.href}
                        onClick={() => handleNavClick(item.href)}
                        className={cn(
                          'inline-flex items-center gap-2 rounded-md text-sm font-medium transition-[color,box-shadow] cursor-pointer disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] w-full justify-start min-h-9 h-auto px-3 py-2 hover:bg-accent hover:text-accent-foreground',
                          activeSection === item.href.replace('#', '') &&
                          'bg-muted text-foreground'
                        )}
                      >
                        <span className="shrink-0">
                          {item.icon}
                        </span>

                        <span className="flex-1 ltr:text-left rtl:text-right leading-tight">
                          {item.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          {/* System Settings Section */}
          {(auth.permissions?.includes('manage-settings') || auth.user?.type === 'superadmin') && (
            <section id="system-settings" ref={systemSettingsRef} className="mb-6 sm:mb-8">
              <SystemSettings
                settings={systemSettings}
                timezones={timezones}
                dateFormats={dateFormats}
                timeFormats={timeFormats}
              />
            </section>
          )}

          {/* Brand Settings Section */}
          {(auth.permissions?.includes('manage-settings') || auth.user?.type === 'superadmin') && (
            <section id="brand-settings" ref={brandSettingsRef} className="mb-6 sm:mb-8">
              <BrandSettings settings={systemSettings} />
            </section>
          )}

          {/* Currency Settings Section */}
          {(auth.permissions?.includes('manage-settings') || auth.user?.type === 'superadmin') && (
            <section id="currency-settings" ref={currencySettingsRef} className="mb-6 sm:mb-8">
              <CurrencySettings />
            </section>
          )}

          {/* Email Settings Section */}
          {(auth.permissions?.includes('manage-settings') || auth.user?.type === 'superadmin') && (
            <section id="email-settings" ref={emailSettingsRef} className="mb-6 sm:mb-8">
              <EmailSettings />
            </section>
          )}

          {/* Email Notification Settings Section */}
          {auth.user?.type === 'company' && (
            <section id="email-notification-settings" ref={emailNotificationSettingsRef} className="mb-6 sm:mb-8">
              <EmailNotificationSettings />
            </section>
          )}

          {/* Payment Settings Section */}
          {(auth.permissions?.includes('manage-settings') || auth.user?.type === 'superadmin') && (
            <section id="payment-settings" ref={paymentSettingsRef} className="mb-6 sm:mb-8">
              <PaymentSettings settings={paymentSettings} />
            </section>
          )}

          {/* Twilio Settings Section */}
          {auth.permissions?.includes('manage-settings') && auth.user?.type !== 'superadmin' && (
            <section id="twilio-settings" ref={twilioSettingsRef} className="mb-6 sm:mb-8">
              <TwilioSettings systemSettings={systemSettings} templates={templates} />
            </section>
          )}

          {/* Storage Settings Section */}
          {auth.user?.type === 'superadmin' && (
            <section id="storage-settings" ref={storageSettingsRef} className="mb-6 sm:mb-8">
              <StorageSettings settings={systemSettings} />
            </section>
          )}

          {/* ReCaptcha Settings Section */}
          {(auth.permissions?.includes('manage-recaptcha-settings') || auth.user?.type === 'superadmin') && (
            <section id="recaptcha-settings" ref={recaptchaSettingsRef} className="mb-6 sm:mb-8">
              <RecaptchaSettings settings={systemSettings} />
            </section>
          )}

          {/* Chat GPT Settings Section */}
          {(auth.permissions?.includes('manage-chatgpt-settings') || auth.user?.type === 'superadmin') && (
            <section id="chatgpt-settings" ref={chatgptSettingsRef} className="mb-6 sm:mb-8">
              <ChatGptSettings settings={systemSettings} />
            </section>
          )}

          {/* Cookie Settings Section */}
          {(auth.permissions?.includes('manage-cookie-settings') || auth.user?.type === 'superadmin') && (
            <section id="cookie-settings" ref={cookieSettingsRef} className="mb-6 sm:mb-8">
              <CookieSettings settings={systemSettings} />
            </section>
          )}

          {/* SEO Settings Section */}
          {(auth.permissions?.includes('manage-seo-settings') || auth.user?.type === 'superadmin') && (
            <section id="seo-settings" ref={seoSettingsRef} className="mb-6 sm:mb-8">
              <SeoSettings settings={systemSettings} />
            </section>
          )}

          {/* Cache Settings Section */}
          {(auth.permissions?.includes('manage-cache-settings') || auth.user?.type === 'superadmin') && (
            <section id="cache-settings" ref={cacheSettingsRef} className="mb-6 sm:mb-8">
              <CacheSettings cacheSize={cacheSize} />
            </section>
          )}

          {/* Webhook Settings Section */}
          {auth.permissions?.includes('manage-settings') && auth.user?.type !== 'superadmin' && (
            <section id="webhook-settings" ref={webhookSettingsRef} className="mb-6 sm:mb-8">
              <WebhookSettings webhooks={webhooks} availableModules={availableModules} />
            </section>
          )}
        </div>
      </div>
    </div>
  </PageTemplate>
);
}