import React from 'react';
import { usePage, Head } from '@inertiajs/react';
import { getImageUrl } from '@/utils/image-helper';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import ScreenshotsSection from './components/ScreenshotsSection';
import WhyChooseUs from './components/WhyChooseUs';
import ThemesSection from './components/ThemesSection';
import AboutUs from './components/AboutUs';
import TeamSection from './components/TeamSection';
import TestimonialsSection from './components/TestimonialsSection';
import PlansSection from './components/PlansSection';
import FaqSection from './components/FaqSection';
import NewsletterSection from './components/NewsletterSection';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';
import ActiveCampaignsSection from './components/ActiveCampaignsSection';
import { useBrand } from '@/contexts/BrandContext';
import { THEME_COLORS } from '@/hooks/use-appearance';
import { useFavicon } from '@/hooks/use-favicon';
import { useTranslation } from 'react-i18next';
import { log } from 'node:console';
import { getCookie, isDemoMode } from '@/utils/cookies';

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

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company?: string;
  content: string;
  avatar?: string;
  rating: number;
}

interface Faq {
  id: number;
  question: string;
  answer: string;
}

interface LandingSettings {
  company_name: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  config_sections?: {
    sections: Array<{
      key: string;
      [key: string]: any;
    }>;
    theme?: {
      primary_color?: string;
      secondary_color?: string;
      accent_color?: string;
      logo_light?: string;
      logo_dark?: string;
      favicon?: string;
    };
    seo?: {
      meta_title?: string;
      meta_description?: string;
      meta_keywords?: string;
    };
    custom_css?: string;
    custom_js?: string;
    section_order?: string[];
    section_visibility?: {
      [key: string]: boolean;
    };
  };
}

interface CustomPage {
  id: number;
  title: string;
  slug: string;
}

interface FeaturedStore {
  id: number;
  name: string;
  description: string;
  slug: string;
  logo?: string;
}

interface PageProps {
  plans: Plan[];
  testimonials: Testimonial[];
  faqs: Faq[];
  customPages: CustomPage[];
  settings: LandingSettings;
  featuredStores: FeaturedStore[];
  superadminLogoDark?: string;
  superadminLogoLight?: string;
  flash?: {
    success?: string;
    error?: string;
  };
}

export default function LandingPage() {
  const pageProps = usePage<PageProps>();
  const { plans, testimonials, faqs, customPages = [], settings, featuredStores = [], flash, superadminLogoDark, superadminLogoLight } = pageProps?.props;
  const { i18n } = useTranslation();
  const globalSettings = (pageProps.props as any).globalSettings;

  // Get brand colors - prioritize config_sections theme over brand context
  useFavicon();
  const { themeColor, customColor } = useBrand();
  const configPrimaryColor = settings.config_sections?.colors?.primary;
  const configColors = settings.config_sections?.colors;
  const primaryColor = configPrimaryColor || (themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS]);
  const secondaryColor = configColors?.secondary || '#059669';
  const accentColor = configColors?.accent || '#065f46';
  // const userLanguage = globalSettings?.defaultLanguage || 'en';
  const userLanguage = (usePage().props as any).userLanguage;
  const { auth, superadminSettings } = page.props;

  // Initialize i18n with default language
  React.useEffect(() => {
    if (userLanguage && i18n.language !== userLanguage) {
      i18n.changeLanguage(userLanguage);
    }
  }, [userLanguage, i18n]);

  // RTL Support for landing page - Apply immediately and persist
  const applyRTLDirection = React.useCallback(() => {
    const isDemo = globalSettings?.is_demo || false;
    const currentLang = userLanguage || globalSettings?.defaultLanguage || 'en';;
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
  }, [userLanguage, globalSettings?.defaultLanguage, globalSettings?.is_demo, globalSettings?.layoutDirection]);

  // Apply RTL on mount and when dependencies change
  React.useLayoutEffect(() => {
    const direction = applyRTLDirection();

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

    return () => observer.disconnect();
  }, [applyRTLDirection]);

  // Apply theme mode (dark/light) to landing page
  React.useEffect(() => {
    let themeMode = 'light'; // default

    if (isDemoMode()) {
      // In demo mode, get theme from cookies
      try {
        const themeSettings = getCookie('themeSettings');
        if (themeSettings) {
          const parsed = JSON.parse(themeSettings);
          themeMode = parsed.appearance || 'light';
        }
      } catch (error) {
        // Use default
      }
    } else {
      // In live mode, get theme from database
      themeMode = globalSettings?.themeMode || 'light';
    }

    // Apply theme mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = themeMode === 'dark' || (themeMode === 'system' && prefersDark);

    document.documentElement.classList.toggle('dark', isDark);
    document.body.classList.toggle('dark', isDark);
  }, [globalSettings?.themeMode]);

  // SEO Meta tags
  React.useEffect(() => {
    const seo = settings.config_sections?.seo;

    if (seo?.meta_title) {
      document.title = seo.meta_title;
    }
    if (seo?.meta_description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', seo.meta_description);
    }
  }, [settings.config_sections?.seo]);

  // Use Superadmin Settings from the 'settings' table for SEO as requested
  const pageTitle = superadminSettings?.metaTitle || superadminSettings?.titleText || 'WhatsStore - Build Your Online Store';
  const metaDescription = superadminSettings?.metaDescription || 'Create beautiful, professional online stores with WhatsStore. Everything you need to start selling online.';
  const metaKeywords = superadminSettings?.metaKeywords || '';
  const metaImage = superadminSettings?.metaImage ? getImageUrl(superadminSettings.metaImage) : '';

  // Custom CSS
  React.useEffect(() => {
    const customCss = settings.config_sections?.custom_css;
    if (customCss) {
      const styleId = 'landing-custom-css';
      let styleElement = document.getElementById(styleId);
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
      styleElement.textContent = customCss;
    }
  }, [settings.config_sections?.custom_css]);

  // Custom JS
  React.useEffect(() => {
    const customJs = settings.config_sections?.custom_js;
    if (customJs) {
      const scriptId = 'landing-custom-js';
      let scriptElement = document.getElementById(scriptId);
      if (scriptElement) {
        scriptElement.remove();
      }
      scriptElement = document.createElement('script');
      scriptElement.id = scriptId;
      scriptElement.textContent = customJs;
      document.body.appendChild(scriptElement);
    }
  }, [settings.config_sections?.custom_js]);

  // RTL Support for landing page
  // React.useEffect(() => {
  //   const isDemo = globalSettings?.is_demo || false;
  //   let storedPosition = 'left';

  //   if (isDemo) {
  //     // In demo mode, use cookies
  //     const getCookie = (name: string): string | null => {
  //       if (typeof document === 'undefined') return null;
  //       const value = `; ${document.cookie}`;
  //       const parts = value.split(`; ${name}=`);
  //       if (parts.length === 2) {
  //         const cookieValue = parts.pop()?.split(';').shift();
  //         return cookieValue ? decodeURIComponent(cookieValue) : null;
  //       }
  //       return null;
  //     };
  //     const stored = getCookie('layoutPosition');
  //     if (stored === 'left' || stored === 'right') {
  //       storedPosition = stored;
  //     }
  //   } else {
  //     // In normal mode, get from database via globalSettings
  //     const stored = globalSettings?.layoutDirection;

  //     if (stored === 'left' || stored === 'right') {
  //       storedPosition = stored;
  //     }
  //   }

  //   const dir = storedPosition === 'right' ? 'rtl' : 'ltr';    
  //   document.documentElement.dir = dir;
  //   document.documentElement.setAttribute('dir', dir);

  //   // Check if it was actually set
  //   setTimeout(() => {
  //     const actualDir = document.documentElement.getAttribute('dir');
  //     if (actualDir !== dir) {
  //       document.documentElement.dir = dir;
  //       document.documentElement.setAttribute('dir', dir);
  //     }
  //   }, 1);

  // }, []);

  // Get section data helper
  const getSectionData = (key: string) => {
    return settings.config_sections?.sections?.find(section => section.key === key) || {};
  };

  // Get section visibility
  const isSectionVisible = (key: string) => {
    return settings.config_sections?.section_visibility?.[key] !== false;
  };

  // Get section order or use default
  const sectionOrder = settings.config_sections?.section_order || [
    'header', 'hero', 'features', 'screenshots', 'themes', 'why_choose_us', 'about',
    'team', 'testimonials', 'featured_stores', 'plans', 'faq', 'newsletter', 'contact', 'footer'
  ];

  // Component mapping
  const sectionComponents = {
    header: () => isSectionVisible('header') && (
      <Header
        settings={settings}
        sectionData={getSectionData('header')}
        customPages={customPages}
        brandColor={primaryColor}
        user={auth?.user}
        superadminLogoDark={superadminLogoDark}
        superadminLogoLight={superadminLogoLight}
      />
    ),
    hero: () => isSectionVisible('hero') && (
      <HeroSection
        settings={settings}
        sectionData={getSectionData('hero')}
        brandColor={primaryColor}
      />
    ),
    features: () => isSectionVisible('features') && (
      <FeaturesSection
        settings={settings}
        sectionData={getSectionData('features')}
        brandColor={primaryColor}
      />
    ),
    screenshots: () => isSectionVisible('screenshots') && (
      <ScreenshotsSection
        settings={settings}
        sectionData={getSectionData('screenshots')}
        brandColor={primaryColor}
      />
    ),
    themes: () => isSectionVisible('themes') && (
      <ThemesSection
        settings={settings}
        sectionData={getSectionData('themes')}
        brandColor={primaryColor}
      />
    ),
    why_choose_us: () => isSectionVisible('why_choose_us') && (
      <WhyChooseUs
        settings={settings}
        sectionData={getSectionData('why_choose_us')}
        brandColor={primaryColor}
      />
    ),

    about: () => isSectionVisible('about') && (
      <AboutUs
        settings={settings}
        sectionData={getSectionData('about')}
        brandColor={primaryColor}
      />
    ),
    team: () => isSectionVisible('team') && (
      <TeamSection
        settings={settings}
        sectionData={getSectionData('team')}
        brandColor={primaryColor}
      />
    ),
    testimonials: () => isSectionVisible('testimonials') && (
      <TestimonialsSection
        testimonials={testimonials}
        settings={settings}
        sectionData={getSectionData('testimonials')}
        brandColor={primaryColor}
      />
    ),
    featured_stores: () => isSectionVisible('featured_stores') && featuredStores.length > 0 && (
      <div className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ color: primaryColor }}>
            Featured Stores
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredStores.map((store) => (
              <div key={store.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                {store.logo && (
                  <img src={store.logo} alt={store.name} className="w-16 h-16 object-cover rounded-lg mb-4" />
                )}
                <h3 className="text-xl font-semibold mb-2">{store.name}</h3>
                <p className="text-gray-600 mb-4">{store.description}</p>
                <a
                  href={`/store/${store.slug}`}
                  className="inline-block px-4 py-2 rounded-lg text-white transition-colors"
                  style={{ backgroundColor: primaryColor }}
                >
                  Visit Store
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    plans: () => isSectionVisible('plans') && (
      <PlansSection
        plans={plans}
        settings={settings}
        sectionData={getSectionData('plans')}
        brandColor={primaryColor}
      />
    ),
    faq: () => isSectionVisible('faq') && (
      <FaqSection
        faqs={faqs}
        settings={settings}
        sectionData={getSectionData('faq')}
        brandColor={primaryColor}
      />
    ),
    newsletter: () => isSectionVisible('newsletter') && (
      <NewsletterSection
        flash={flash}
        settings={settings}
        sectionData={getSectionData('newsletter')}
        brandColor={primaryColor}
      />
    ),
    contact: () => isSectionVisible('contact') && (
      <ContactSection
        flash={flash}
        settings={settings}
        sectionData={getSectionData('contact')}
        brandColor={primaryColor}
      />
    ),
    footer: () => isSectionVisible('footer') && (
      <Footer
        settings={settings}
        sectionData={getSectionData('footer')}
        brandColor={primaryColor}
        superadminLogoLight={superadminLogoLight}
      />
    )
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDescription} />
        {metaKeywords && <meta name="keywords" content={metaKeywords} />}
        {metaImage && <meta property="og:image" content={metaImage} />}
        {metaImage && <meta name="twitter:image" content={metaImage} />}
      </Head>
      <div
        className="min-h-screen bg-white"
        data-landing-page="true"
        style={{
          scrollBehavior: 'smooth',
          '--brand-color': primaryColor,
          '--primary-color': primaryColor,
          '--secondary-color': secondaryColor,
          '--accent-color': accentColor
        } as React.CSSProperties}
      >
        {sectionOrder.map((sectionKey) => {
          const Component = sectionComponents[sectionKey as keyof typeof sectionComponents];
          return Component ? <React.Fragment key={sectionKey}>{Component()}</React.Fragment> : null;
        })}
      </div>
    </>
  );
}