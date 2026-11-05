import React from 'react';
import { QrCode, Smartphone, Share2, BarChart3, Globe, Shield, Star, Zap, Users, Lock, Wifi, Heart } from 'lucide-react';
import { useScrollAnimation } from '../../../hooks/useScrollAnimation';
import { useTranslation } from 'react-i18next';
import { getImageUrl } from '@/utils/image-helper';

interface Feature {
  title: string;
  description: string;
  icon: string;
}

interface FeaturesSectionProps {
  brandColor?: string;
  settings: any;
  sectionData: {
    title?: string;
    description?: string;
    image?: string;
    background_color?: string;
    columns?: number;
    layout?: string;
    show_icons?: boolean;
    features_list?: Feature[];
  };
}

// Icon mapping for dynamic icons
const iconMap: Record<string, React.ComponentType<any>> = {
  'qr-code': QrCode,
  'smartphone': Smartphone,
  'share': Share2,
  'bar-chart': BarChart3,
  'globe': Globe,
  'shield': Shield,
  'star': Star,
  'zap': Zap,
  'users': Users,
  'lock': Lock,
  'wifi': Wifi,
  'heart': Heart
};

export default function FeaturesSection({ settings, sectionData, brandColor = '#3b82f6' }: FeaturesSectionProps) {
  const { ref, isVisible } = useScrollAnimation();
  const { t } = useTranslation();

  const [isDarkMode, setIsDarkMode] = React.useState(false);

  React.useEffect(() => {
    const checkDark = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const sectionImage = getImageUrl(sectionData.image);
  const layout = sectionData.layout || 'grid';
  const columns = sectionData.columns || 3;
  const showIcons = sectionData.show_icons !== false;

  const sectionBg = isDarkMode
    ? (sectionData.background_color && sectionData.background_color !== '#ffffff' && sectionData.background_color !== '#f9fafb'
        ? sectionData.background_color
        : undefined)
    : (sectionData.background_color || '#f9fafb');

  // Default features if none provided
  const defaultFeatures = [
    {
      icon: 'globe',
      title: 'Multi-Store Management',
      description: 'Create and manage multiple online stores from a single dashboard. Perfect for entrepreneurs and agencies.'
    },
    {
      icon: 'smartphone',
      title: 'Mobile Responsive',
      description: 'All stores are fully responsive and optimized for mobile devices. Your customers can shop anywhere.'
    },
    {
      icon: 'zap',
      title: 'Lightning Fast',
      description: 'Built for speed with modern technology. Fast loading times improve customer experience and SEO.'
    },
    {
      icon: 'bar-chart',
      title: 'Analytics & Reports',
      description: 'Comprehensive analytics to track sales, customers, and performance. Make data-driven decisions.'
    },
    {
      icon: 'shield',
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with SSL certificates and secure payment processing. Your data is safe.'
    },
    {
      icon: 'users',
      title: 'Customer Management',
      description: 'Built-in CRM to manage customers, orders, and communications. Build lasting relationships.'
    }
  ];

  const features = sectionData.features_list && sectionData.features_list.length > 0 
    ? sectionData.features_list 
    : defaultFeatures;

  const renderLayout = () => {
    switch (layout) {
      case 'list':
        return (
          <div className={`grid ${columns === 1 ? 'grid-cols-1 max-w-3xl mx-auto' : 'grid-cols-1 lg:grid-cols-2'} gap-6 sm:gap-8 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {features.map((feature, index) => {
              const IconComponent = iconMap[feature.icon] || QrCode;
              return (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 p-6 sm:p-7 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all duration-200 flex items-start gap-5"
                  role="article"
                  aria-labelledby={`feature-${index}-title`}
                >
                  {showIcons && (
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: 'var(--accent-color, #065f46)20' }}
                      role="img"
                      aria-label={`${feature.title} icon`}
                    >
                      <IconComponent
                        className="w-6 h-6"
                        style={{ color: 'var(--accent-color, #065f46)' }}
                        aria-hidden="true"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2" id={`feature-${index}-title`}>
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        );

      case 'cards':
        return (
          <div className={`grid grid-cols-1 ${columns >= 2 ? 'sm:grid-cols-2' : ''} ${columns >= 3 ? 'lg:grid-cols-3' : ''} ${columns >= 4 ? 'xl:grid-cols-4' : ''} gap-6 sm:gap-8 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {features.map((feature, index) => {
              const IconComponent = iconMap[feature.icon] || QrCode;
              return (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                  role="article"
                  aria-labelledby={`feature-${index}-title`}
                >
                  <div>
                    {showIcons && (
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-sm"
                        style={{ backgroundColor: 'var(--accent-color, #065f46)20' }}
                        role="img"
                        aria-label={`${feature.title} icon`}
                      >
                        <IconComponent
                          className="w-7 h-7"
                          style={{ color: 'var(--accent-color, #065f46)' }}
                          aria-hidden="true"
                        />
                      </div>
                    )}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3" id={`feature-${index}-title`}>
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        );

      case 'alternating':
        return (
          <div className={`space-y-6 sm:space-y-8 max-w-4xl mx-auto transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {features.map((feature, index) => {
              const IconComponent = iconMap[feature.icon] || QrCode;
              const isEven = index % 2 === 0;
              return (
                <div
                  key={index}
                  className={`bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg transition-all duration-200 flex flex-col sm:flex-row ${
                    isEven ? 'sm:flex-row' : 'sm:flex-row-reverse'
                  } items-center gap-6`}
                  role="article"
                  aria-labelledby={`feature-${index}-title`}
                >
                  {showIcons && (
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                      style={{ backgroundColor: 'var(--accent-color, #065f46)20' }}
                      role="img"
                      aria-label={`${feature.title} icon`}
                    >
                      <IconComponent
                        className="w-8 h-8"
                        style={{ color: 'var(--accent-color, #065f46)' }}
                        aria-hidden="true"
                      />
                    </div>
                  )}
                  <div className={`flex-1 ${isEven ? 'text-center sm:text-left' : 'text-center sm:text-right'}`}>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2" id={`feature-${index}-title`}>
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        );

      case 'grid':
      default:
        return (
          <div className={`grid grid-cols-1 ${columns >= 2 ? 'sm:grid-cols-2' : ''} ${columns >= 3 ? 'lg:grid-cols-3' : ''} ${columns >= 4 ? 'xl:grid-cols-4' : ''} gap-6 sm:gap-8 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {features.map((feature, index) => {
              const IconComponent = iconMap[feature.icon] || QrCode;
              return (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 p-8 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg transition-all duration-200"
                  role="article"
                  aria-labelledby={`feature-${index}-title`}
                >
                  {showIcons && (
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center mb-6" 
                      style={{ backgroundColor: 'var(--accent-color, #065f46)20' }} 
                      role="img" 
                      aria-label={`${feature.title} icon`}
                    >
                      <IconComponent 
                        className="w-6 h-6" 
                        style={{ color: 'var(--accent-color, #065f46)' }} 
                        aria-hidden="true" 
                      />
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4" id={`feature-${index}-title`}>
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        );
    }
  };

  return (
    <section
      id="features"
      className="py-12 sm:py-16 lg:py-20 bg-gray-50 dark:bg-gray-900 transition-colors"
      style={sectionBg ? { backgroundColor: sectionBg } : undefined}
      ref={ref}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-8 sm:mb-12 lg:mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {sectionData.title || 'Powerful Features for Your Online Store'}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed font-medium">
            {sectionData.description || 'Everything you need to create, customize, and manage your online stores. Built for entrepreneurs who value efficiency and growth.'}
          </p>
        </div>

        {sectionImage && (
          <div className="mb-8 sm:mb-12 text-center">
            <img src={sectionImage} alt="Features" className="max-w-full h-auto rounded-xl shadow-lg mx-auto" />
          </div>
        )}
        
        {renderLayout()}
      </div>
    </section>
  );
}