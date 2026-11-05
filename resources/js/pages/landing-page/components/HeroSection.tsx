import React from 'react';
import { Link } from '@inertiajs/react';
import { ArrowRight, Play } from 'lucide-react';
import { getImageUrl } from '@/utils/image-helper';

interface HeroSectionProps {
  brandColor?: string;
  settings: any;
  sectionData: {
    title?: string;
    subtitle?: string;
    announcement_text?: string;
    primary_button_text?: string;
    secondary_button_text?: string;
    stats?: Array<{ value: string; label: string }>;
    image?: string;
    background_color?: string;
    text_color?: string;
    layout?: string;
    height?: number | string;
    overlay?: boolean | string | number;
    overlay_color?: string;
    image_position?: string;
  };
}

export default function HeroSection({ settings, sectionData = {}, brandColor = '#3b82f6' }: HeroSectionProps) {
  // Get colors from settings
  const configColors = settings?.config_sections?.colors;
  const secondaryColor = configColors?.secondary || '#059669';

  const data = sectionData || {};
  const backgroundColor = data.background_color;
  const textColor = data.text_color;
  const layout = data.layout || 'image-right';
  const imagePosition = data.image_position || 'right';
  const sectionHeight = data.height;
  const hasOverlay = Boolean(data.overlay);
  const overlayColor = data.overlay_color || 'rgba(0, 0, 0, 0.5)';
  const heroImageUrl = getImageUrl(data.image || '/images/hero-dashboard.svg');

  const heightStyle = sectionHeight
    ? (typeof sectionHeight === 'number' ? `${sectionHeight}px` : `${sectionHeight}`.endsWith('px') ? sectionHeight : `${sectionHeight}px`)
    : undefined;

  const isBackground = imagePosition === 'background';
  const isCentered = !isBackground && (layout === 'centered' || imagePosition === 'center');
  const isFullWidth = !isBackground && !isCentered && layout === 'full-width';
  const isImageLeft = !isBackground && !isCentered && !isFullWidth && (layout === 'image-left' || imagePosition === 'left');

  const renderContent = (center: boolean) => (
    <>
      {data.announcement_text && (
        <div
          className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${
            !textColor ? 'bg-gray-100 text-gray-700' : 'bg-white/10 backdrop-blur-sm'
          }`}
          style={textColor ? { color: textColor, borderColor: `${textColor}40` } : undefined}
        >
          {data.announcement_text}
        </div>
      )}

      <h1
        className={`text-4xl md:text-5xl lg:text-6xl font-bold leading-tight ${!textColor ? 'text-gray-900' : ''}`}
        style={textColor ? { color: textColor } : undefined}
        role="banner"
        aria-label="Main heading"
      >
        {data.title || 'Launch Your Online Store in Minutes'}
      </h1>

      <p
        className={`text-lg md:text-xl leading-relaxed font-medium ${center ? 'max-w-3xl mx-auto' : 'max-w-2xl'} ${
          !textColor ? 'text-gray-600' : ''
        }`}
        style={textColor ? { color: textColor, opacity: 0.9 } : undefined}
      >
        {data.subtitle || 'Create, customize, and manage multiple online stores with our powerful e-commerce platform.'}
      </p>

      <div className={`flex flex-col sm:flex-row gap-3 sm:gap-4 ${center ? 'justify-center' : 'justify-center lg:justify-start'}`}>
        <Link
          href={route('register')}
          className="px-8 py-4 rounded-lg transition-all font-semibold text-base flex items-center justify-center gap-2 border"
          style={{ backgroundColor: brandColor, color: 'white', borderColor: brandColor }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.color = brandColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = brandColor;
            e.currentTarget.style.color = 'white';
          }}
          aria-label="Start free trial - Register for WhatsStore"
        >
          {data.primary_button_text || 'Start Free Trial'}
          <ArrowRight size={18} />
        </Link>
        <Link
          href={route('login')}
          className="border px-8 py-4 rounded-lg transition-colors font-semibold text-base flex items-center justify-center gap-2 hover:bg-white/10"
          style={{ borderColor: brandColor, color: brandColor }}
          aria-label="Login to existing WhatsStore account"
        >
          <Play size={18} />
          {data.secondary_button_text || 'Login'}
        </Link>
      </div>

      {data.stats && data.stats.length > 0 && (
        <div className={`grid grid-cols-3 gap-4 sm:gap-6 lg:gap-8 pt-8 sm:pt-12 ${center ? 'max-w-2xl mx-auto' : ''}`}>
          {data.stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div
                className={`text-3xl md:text-4xl font-bold ${!textColor ? 'text-gray-900' : ''}`}
                style={textColor ? { color: textColor } : undefined}
              >
                {stat.value}
              </div>
              <div
                className={`font-medium text-sm ${!textColor ? 'text-gray-600' : ''}`}
                style={textColor ? { color: textColor, opacity: 0.8 } : undefined}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  const renderImage = (wrapperClassName: string = 'max-w-lg mx-auto') => (
    <div className="relative w-full">
      {/* Floating elements */}
      <div className="absolute -top-8 -right-8 w-20 h-20 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full opacity-60 animate-pulse pointer-events-none"></div>
      <div
        className="absolute -bottom-8 -left-8 w-16 h-16 bg-gradient-to-br from-green-200 to-blue-200 rounded-full opacity-50 animate-pulse pointer-events-none"
        style={{ animationDelay: '1s' }}
      ></div>

      <div className="relative transform hover:scale-105 transition-transform duration-300">
        <div className={`bg-white rounded-3xl shadow-2xl p-4 sm:p-6 ${wrapperClassName} border border-gray-100 backdrop-blur-sm`}>
          <img
            src={heroImageUrl}
            alt="WhatsStore Dashboard Preview"
            className="w-full h-auto rounded-2xl"
            onError={(e) => {
              e.currentTarget.src = getImageUrl('/images/hero-dashboard.svg');
            }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <section
      id="hero"
      className={`relative pt-16 flex items-center overflow-hidden ${
        !heightStyle ? 'min-h-screen' : ''
      } ${
        !backgroundColor ? 'bg-gradient-to-br from-gray-50 to-white' : ''
      }`}
      style={{
        backgroundColor: backgroundColor || undefined,
        minHeight: heightStyle || undefined,
      }}
    >
      {/* Background image if imagePosition is 'background' */}
      {isBackground && heroImageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{ backgroundImage: `url(${heroImageUrl})` }}
        />
      )}

      {/* Background decoration (hide when background image is present) */}
      {!isBackground && (
        <>
          <div className="absolute inset-0 bg-grid-gray-100 bg-[size:20px_20px] opacity-50 pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-green-100 to-blue-100 rounded-full blur-3xl opacity-30 translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
        </>
      )}

      {/* Background overlay */}
      {hasOverlay && (
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{ backgroundColor: overlayColor }}
        />
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 w-full">
        {isCentered ? (
          <div>
            <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
              {renderContent(true)}
            </div>
            {!isBackground && (
              <div className="mt-10 sm:mt-14 max-w-4xl mx-auto flex justify-center">
                {renderImage('max-w-3xl w-full')}
              </div>
            )}
          </div>
        ) : isFullWidth ? (
          <div>
            <div className="max-w-5xl mx-auto text-center space-y-6 sm:space-y-8">
              {renderContent(true)}
            </div>
            {!isBackground && (
              <div className="mt-10 sm:mt-14 max-w-5xl mx-auto flex justify-center">
                {renderImage('max-w-5xl w-full')}
              </div>
            )}
          </div>
        ) : isImageLeft ? (
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            {!isBackground && (
              <div className="order-2 lg:order-1 relative lg:flex lg:justify-center">
                {renderImage('max-w-lg mx-auto w-full')}
              </div>
            )}
            <div className="order-1 lg:order-2 text-center lg:text-left space-y-6 sm:space-y-8">
              {renderContent(false)}
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            <div className="order-1 text-center lg:text-left space-y-6 sm:space-y-8">
              {renderContent(false)}
            </div>
            {!isBackground && (
              <div className="order-2 relative lg:flex lg:justify-center">
                {renderImage('max-w-lg mx-auto w-full')}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
