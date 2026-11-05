import React, { useState } from 'react';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { Link, usePage } from '@inertiajs/react';
import { useScrollAnimation } from '../../../hooks/useScrollAnimation';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/utils/currency-helper';
import { getCookie, isDemoMode } from '@/utils/cookies';

// Simple encryption function for plan ID
const encryptPlanId = (planId: number): string => {
  const key = 'Store2025';
  const str = planId.toString();
  let encrypted = '';
  for (let i = 0; i < str.length; i++) {
    encrypted += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(encrypted);
};

interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  yearly_price?: number;
  duration: string;
  features?: string[];
  is_popular?: boolean;
  is_plan_enable: string;
}

interface PlansSectionProps {
  brandColor?: string;
  plans: Plan[];
  settings?: any;
  sectionData?: {
    title?: string;
    subtitle?: string;
    faq_text?: string;
  };
}

function PlansSection({ plans, settings, sectionData, brandColor = '#3b82f6' }: PlansSectionProps) {
  const { t } = useTranslation();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const { ref, isVisible } = useScrollAnimation();

  // Filter enabled plans based on billing cycle and duration
  const enabledPlans = plans.filter(plan => {
    if (plan.is_plan_enable !== 'on') return false;

    // Support both billing cycles
    return plan.duration === 'both' || plan.duration === 'monthly' || plan.duration === 'yearly';
  });

  // Default plans if none provided
  const defaultPlans = [
    {
      id: 1,
      name: 'Free',
      description: 'Basic plan for small businesses just getting started.',
      price: 0,
      yearly_price: 0,
      duration: 'both',
      features: [
        'Custom Domain',
        'Subdomain',
        'PWA',
        'Shipping Method'
      ],
      stats: {
        businesses: 1,
        users: 2,
        products_per_store: 50,
        storage: '1 GB',
        templates: 3
      },
      is_popular: false,
      is_plan_enable: 'on'
    },
    {
      id: 2,
      name: 'Pro',
      description: 'Ideal for growing businesses with multiple stores and advanced needs.',
      price: 49.99,
      yearly_price: 479.90,
      duration: 'both',
      features: [
        'Custom Domain',
        'Subdomain',
        'PWA',
        'AI Integration',
        'Shipping Method'
      ],
      stats: {
        businesses: 30,
        users: 70,
        products_per_store: 2500,
        storage: '50 GB',
        templates: 6
      },
      is_popular: true,
      is_plan_enable: 'on'
    },
    {
      id: 3,
      name: 'Enterprise',
      description: 'Complete solution for large businesses with unlimited resources and premium support.',
      price: 99.99,
      yearly_price: 959.90,
      duration: 'both',
      features: [
        'Custom Domain',
        'Subdomain',
        'PWA',
        'AI Integration',
        'Shipping Method'
      ],
      stats: {
        businesses: 100,
        users: 200,
        products_per_store: 5000,
        storage: '500 GB',
        templates: 7
      },
      is_popular: false,
      is_plan_enable: 'on'
    }
  ];

  const displayPlans = enabledPlans.length > 0 ? enabledPlans : defaultPlans;



  const getPrice = React.useCallback((plan: Plan) => {
    if (billingCycle === 'yearly' && plan.yearly_price !== undefined) {
      return plan.yearly_price;
    }
    return plan.price;
  }, [billingCycle]);

  let themeMode = 'light';
  if (isDemoMode()) {
    const themeSettings = getCookie('themeSettings');
    if (themeSettings) {
      try {
        const parsed = JSON.parse(themeSettings);
        themeMode = parsed.appearance || 'light';
      } catch {
        themeMode = 'light';
      }
    }
  } else {
    const { props } = usePage();
    themeMode = (props as any).globalSettings?.themeMode || 'light';
  }

  const isDark = themeMode === 'dark';


  return (
    <section id="pricing" className="py-12 sm:py-16 lg:py-20 bg-white dark:bg-gray-900" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-8 sm:mb-12 lg:mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {sectionData?.title || t('Choose Your Plan')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed font-medium">
            {sectionData?.subtitle || t('Start with our free plan and upgrade as you grow. All plans include our core features with no setup fees or hidden costs.')}
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span
              onClick={() => setBillingCycle('monthly')}
              className={`text-sm cursor-pointer select-none ${billingCycle === 'monthly' ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-500 dark:text-gray-400'}`}
            >
              {t('Monthly')}
            </span>
            <button
              type="button"
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors cursor-pointer focus:outline-none ${
                billingCycle === 'yearly' ? '' : 'bg-gray-200 dark:bg-gray-700'
              }`}
              style={billingCycle === 'yearly' ? { backgroundColor: brandColor } : undefined}
              aria-label={t('Toggle billing cycle')}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out ${
                  billingCycle === 'yearly'
                    ? 'translate-x-5 rtl:-translate-x-5'
                    : 'translate-x-0 rtl:translate-x-0'
                }`}
              />
            </button>
            <span
              onClick={() => setBillingCycle('yearly')}
              className={`text-sm cursor-pointer select-none ${billingCycle === 'yearly' ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-500 dark:text-gray-400'}`}
            >
              {t('Yearly')}
            </span>
          </div>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {displayPlans.map((plan) => (
            <div
              key={plan.id}
              className={`group relative h-full flex flex-col ${plan.is_popular
                ? 'z-10 scale-[1.02]'
                : ''
                }`}
            >
              {/* Card with decorative elements */}
              <div
                className={`absolute inset-0 rounded-2xl border shadow-lg transition-all duration-300 group-hover:shadow-xl overflow-hidden ${!plan.is_popular ? 'bg-gradient-to-br from-gray-50/80 to-gray-50/50 dark:from-gray-800/80 dark:to-gray-800/50 border-gray-200/80 dark:border-gray-700' : 'bg-white dark:bg-gray-800'
                  }`}
                style={plan.is_popular ? {
                  background: `linear-gradient(to bottom right, ${brandColor}20, ${brandColor}10, transparent)`,
                  borderColor: `${brandColor}30`
                } : {}}
              >
                {/* Decorative background elements */}
                <div
                  className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 opacity-70"
                  style={{ background: `linear-gradient(to bottom right, ${brandColor}10, transparent)` }}
                ></div>
                <div
                  className="absolute bottom-0 left-0 w-24 h-24 rounded-full -ml-12 -mb-12 opacity-50"
                  style={{ background: `linear-gradient(to top right, ${brandColor}10, transparent)` }}
                ></div>
              </div>

              {/* Recommended indicator */}
              {plan.is_popular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center z-20">
                  <div
                    className="text-white px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 text-sm font-medium"
                    style={{ backgroundColor: brandColor }}
                  >
                    <Check className="h-4 w-4" />
                    {t("Recommended")}
                  </div>
                </div>
              )}

              {/* Content container */}
              <div className="relative z-10 flex flex-col h-full p-6 pt-8">
                {/* Plan header */}
                <div className="mb-6">
                  <h3
                    className={`text-2xl font-bold mb-2 ${!plan.is_popular ? 'dark:text-white' : ''}`}
                    style={{ color: plan.is_popular ? brandColor : undefined }}
                  >
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1.5 mb-3">
                    <span
                      className={`text-3xl font-extrabold font-mono ${!plan.is_popular ? 'dark:text-white' : ''}`}
                      style={{ color: plan.is_popular ? brandColor : undefined }}
                    >
                      {getPrice(plan) === 0 ? formatCurrency(0) : formatCurrency(getPrice(plan))}
                    </span>
                    <span className="text-muted-foreground text-sm dark:text-gray-400">
                      /{billingCycle === 'yearly' ? 'year' : 'month'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground dark:text-gray-300 leading-relaxed line-clamp-2 mb-3">
                    {plan.description}
                  </p>

                </div>

                {/* Divider with icon */}
                <div className="relative flex items-center my-4">
                  <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                  <div
                    className="mx-3 p-1.5 rounded-full"
                    style={{ backgroundColor: `${brandColor}10`, color: brandColor }}
                  >
                    <Check className="h-4 w-4" />
                  </div>
                  <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                </div>

                {/* Usage limits */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground dark:text-gray-400 mb-3">
                    {t("Usage Limits")}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                      <div className="text-base sm:text-lg font-bold truncate" style={{ color: brandColor }}>{plan.stats?.businesses || 'N/A'}</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground dark:text-gray-300 truncate">{t("Stores")}</div>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                      <div className="text-base sm:text-lg font-bold truncate" style={{ color: brandColor }}>{plan.stats?.users || 'N/A'}</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground dark:text-gray-300 truncate">{t("Users/Store")}</div>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                      <div className="text-base sm:text-lg font-bold truncate" style={{ color: brandColor }}>{plan.stats?.products_per_store || 'N/A'}</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground dark:text-gray-300 truncate">{t("Products/Store")}</div>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                      <div className="text-base sm:text-lg font-bold truncate" style={{ color: brandColor }}>{plan.stats?.storage || 'N/A'}</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground dark:text-gray-300 truncate">{t("Storage")}</div>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                      <div className="text-base sm:text-lg font-bold truncate" style={{ color: brandColor }}>{plan.stats?.templates || '3'}</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground dark:text-gray-300 truncate">{t("Themes")}</div>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="mb-6 flex-1">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground dark:text-gray-400 mb-3">
                    {t("Features")}
                  </h4>
                  <ul className="space-y-2.5">
                    {(plan.features || []).map((feature, index) => {
                      // Handle template sections with count display
                      const displayFeature = feature.startsWith('Template Sections') ? feature : feature;
                      return (
                        <li key={index} className="flex items-center gap-3">
                          <div
                            className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${brandColor}10`, color: brandColor }}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-sm font-medium dark:text-gray-200">
                            {displayFeature}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Actions */}
                <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    href={route('register', { plan: encryptPlanId(plan.id) })}
                    className="block w-full text-center py-3 px-6 rounded-lg font-semibold transition-colors hover:opacity-90"
                    style={{
                      backgroundColor: plan.is_popular ? brandColor : (isDark ? '#374151' : '#f3f4f6'),
                      color: plan.is_popular ? 'white' : (isDark ? '#f9fafb' : '#111827')
                    }}
                  >
                    {Number(getPrice(plan)) === 0 ? t('Start Free') : t('Get Started')}
                    <ArrowRight className="w-4 h-4 inline-block ml-2 text-white" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Link */}
        {sectionData?.faq_text && (
          <div className="text-center mt-8 sm:mt-12">
            <p className="text-gray-600 dark:text-gray-400">
              {sectionData.faq_text}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default PlansSection;