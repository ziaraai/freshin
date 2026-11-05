import React, { useState } from 'react';
import { Target, Heart, Award, Lightbulb, Star, Shield, Users, Zap } from 'lucide-react';
import { useScrollAnimation } from '../../../hooks/useScrollAnimation';
import { useTranslation } from 'react-i18next';
import { getImageUrl } from '@/utils/image-helper';

interface AboutUsProps {
  brandColor?: string;
  settings: any;
  sectionData: {
    title?: string;
    description?: string;
    story_title?: string;
    story_content?: string;
    image?: string;
    background_color?: string;
    layout?: string;
    image_position?: string;
    parallax?: boolean | string | number;
    stats?: Array<{
      value: string;
      label: string;
      color?: string;
    }>;
    values?: Array<{
      title: string;
      description: string;
      icon: string;
    }>;
    image_title?: string;
    image_subtitle?: string;
    image_icon?: string;
  };
}

// Icon mapping for dynamic icons
const iconMap: Record<string, React.ComponentType<any>> = {
  'target': Target,
  'heart': Heart,
  'award': Award,
  'lightbulb': Lightbulb,
  'star': Star,
  'shield': Shield,
  'users': Users,
  'zap': Zap
};

// Values Section Component with Tabs
function ValuesSection({ values, brandColor }: { values: any[], brandColor: string }) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Our Core Values</h3>
        <p className="text-gray-600 dark:text-gray-300">The principles that guide everything we do</p>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8">
        {values.map((value, index) => {
          const IconComponent = iconMap[value.icon] || Target;
          const isActive = activeTab === index;
          return (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${
                isActive
                  ? 'text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              style={{
                backgroundColor: isActive ? brandColor : undefined
              }}
            >
              <IconComponent className="w-4 h-4" />
              <span>{value.title}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="text-center max-w-2xl mx-auto min-h-[160px] flex items-center justify-center">
        {values.map((value, index) => {
          const IconComponent = iconMap[value.icon] || Target;
          if (activeTab !== index) return null;
          return (
            <div
              key={index}
              className="transition-all duration-300"
            >
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm" 
                style={{ backgroundColor: `${brandColor}15` }}
              >
                <IconComponent className="w-8 h-8" style={{ color: brandColor }} />
              </div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{value.title}</h4>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base">{value.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AboutUs({ settings, sectionData, brandColor = '#3b82f6' }: AboutUsProps) {
  const { ref, isVisible } = useScrollAnimation();
  const { t } = useTranslation();

  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [parallaxOffset, setParallaxOffset] = React.useState(0);

  const isParallax = Boolean(sectionData.parallax);

  React.useEffect(() => {
    const checkDark = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!isParallax) {
      setParallaxOffset(0);
      return;
    }

    let animationFrameId: number;

    const handleScroll = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        // Calculate when section is near or in the viewport
        if (rect.top < windowHeight && rect.bottom > 0) {
          // Progress from viewport entry to exit (-1 to 1)
          const progress = (rect.top - (windowHeight - rect.height) / 2) / windowHeight;
          const offset = Math.round(progress * 50);
          setParallaxOffset(offset);
        }
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(handleScroll);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isParallax]);

  const sectionImage = sectionData.image ? getImageUrl(sectionData.image) : null;
  const layout = sectionData.layout || 'image-right';
  const imagePosition = sectionData.image_position || 'right';
  const isImageLeft = layout === 'image-left' || imagePosition === 'left';
  const isCentered = layout === 'centered';
  const isBackground = imagePosition === 'background';

  const sectionBg = isDarkMode
    ? (sectionData.background_color && sectionData.background_color !== '#ffffff' && sectionData.background_color !== '#f9fafb'
        ? sectionData.background_color
        : undefined)
    : (sectionData.background_color || '#f9fafb');

  // Default data if none provided
  const defaultValues = [
    {
      icon: 'target',
      title: 'Our Mission',
      description: 'To democratize e-commerce by providing powerful, easy-to-use tools that enable anyone to build and manage successful online stores from a single dashboard.'
    },
    {
      icon: 'heart',
      title: 'Our Values',
      description: 'We believe in innovation, scalability, and empowering entrepreneurs to achieve e-commerce success through cutting-edge multi-store technology.'
    },
    {
      icon: 'award',
      title: 'Our Commitment',
      description: 'Delivering exceptional multi-store management experience with enterprise-grade security, 99.9% uptime, and 24/7 dedicated support.'
    },
    {
      icon: 'lightbulb',
      title: 'Our Vision',
      description: 'A world where every entrepreneur can easily create, manage, and scale multiple profitable online stores without technical barriers or limitations.'
    }
  ];

  const defaultStats = [
    { value: '5+ Years', label: 'Experience', color: 'green' },
    { value: '15K+', label: 'Happy Users', color: 'green' },
    { value: '75+', label: 'Countries', color: 'green' }
  ];

  const values = sectionData.values && sectionData.values.length > 0 
    ? sectionData.values 
    : defaultValues;

  const stats = sectionData.stats && sectionData.stats.length > 0 
    ? sectionData.stats 
    : defaultStats;

  const renderImageBlock = (wrapperClass: string = 'w-full') => (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 min-h-[300px] max-h-[420px] flex items-center justify-center shadow-sm overflow-hidden ${
        isParallax ? 'transition-transform duration-100 ease-out will-change-transform' : ''
      } ${wrapperClass}`}
      style={isParallax ? { transform: `translateY(${parallaxOffset}px)` } : undefined}
    >
      {sectionImage ? (
        <img 
          src={sectionImage} 
          alt={sectionData.story_title || 'About Us'} 
          className="w-full h-full max-h-[380px] object-contain rounded-lg" 
        />
      ) : (
        <div className="text-center py-8">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto mb-6 flex items-center justify-center shadow-inner">
            <span className="text-4xl">{sectionData.image_icon || '🚀'}</span>
          </div>
          <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {sectionData.image_title || t('Innovation Driven')}
          </h4>
          <p className="text-gray-600 dark:text-gray-300 max-w-sm mx-auto">
            {sectionData.image_subtitle || t('Building the future of e-commerce')}
          </p>
        </div>
      )}
    </div>
  );

  const renderStoryContent = () => (
    <div>
      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">
        {sectionData.story_title || 'Revolutionizing Multi-Store E-commerce Since 2020'}
      </h3>
      <div 
        className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed" 
        dangerouslySetInnerHTML={{
          __html: `<p class="mb-4">${(sectionData.story_content || 'Founded by e-commerce experts and technology innovators, WhatsStore was created to solve the complex challenges of managing multiple online stores. Our platform enables entrepreneurs to build, customize, and scale their store empire from a single powerful dashboard.').replace(/\n+/g, '</p><p class="mb-4">')}</p>`
        }} 
      />
      
      {stats.length > 0 && (
        <div className="flex flex-wrap items-center gap-6 sm:gap-8 pt-2">
          {stats.map((stat, index) => (
            <div key={index} className="text-center sm:text-left">
              <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <section 
      id="about" 
      className="py-12 sm:py-16 lg:py-20 bg-gray-50 dark:bg-gray-900 transition-colors relative overflow-hidden" 
      style={sectionBg ? { backgroundColor: sectionBg } : undefined} 
      ref={ref}
    >
      {/* Parallax Background Image */}
      {isBackground && sectionImage && (
        <div 
          className={`absolute inset-0 bg-cover bg-center z-0 ${isParallax ? 'bg-fixed' : ''}`}
          style={{ backgroundImage: `url(${sectionImage})` }}
        >
          <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90" />
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-8 sm:mb-12 lg:mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {sectionData.title || 'About Us'}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed font-medium">
            {sectionData.description || 'We are passionate about empowering entrepreneurs to build successful e-commerce businesses.'}
          </p>
        </div>

        {isCentered || isBackground ? (
          <div className="max-w-4xl mx-auto mb-8 sm:mb-12 lg:mb-16">
            <div className="text-center mb-8">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">
                {sectionData.story_title || 'Revolutionizing Multi-Store E-commerce Since 2020'}
              </h3>
              <div 
                className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed max-w-3xl mx-auto" 
                dangerouslySetInnerHTML={{
                  __html: `<p class="mb-4">${(sectionData.story_content || 'Founded by e-commerce experts and technology innovators, WhatsStore was created to solve the complex challenges of managing multiple online stores. Our platform enables entrepreneurs to build, customize, and scale their store empire from a single powerful dashboard.').replace(/\n+/g, '</p><p class="mb-4">')}</p>`
                }} 
              />
              {stats.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-8 mb-10">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {!isBackground && (
              <div className="flex justify-center">
                {renderImageBlock('max-w-2xl w-full')}
              </div>
            )}
          </div>
        ) : isImageLeft ? (
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center mb-8 sm:mb-12 lg:mb-16">
            <div className="order-2 lg:order-1 flex justify-center">
              {renderImageBlock('w-full')}
            </div>
            <div className="order-1 lg:order-2">
              {renderStoryContent()}
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center mb-8 sm:mb-12 lg:mb-16">
            <div className="order-1">
              {renderStoryContent()}
            </div>
            <div className="order-2 flex justify-center">
              {renderImageBlock('w-full')}
            </div>
          </div>
        )}

        {/* Values Section with Tabs */}
        <div className={`transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <ValuesSection values={values} brandColor={brandColor} />
        </div>
      </div>
    </section>
  );
}