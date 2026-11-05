import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useBrand } from '@/contexts/BrandContext';

interface CustomPage {
  id: number;
  title: string;
  slug: string;
}

interface HeaderProps {
  brandColor?: string;
  settings: {
    company_name: string;
    config_sections?: any;
    [key: string]: any;
  };
  sectionData?: {
    transparent?: boolean | string | number;
    background_color?: string;
    text_color?: string;
    button_style?: 'gradient' | 'solid' | 'outline' | string;
    [key: string]: any;
  };
  customPages?: CustomPage[];
  user?: any;
  superadminLogoDark?: string;
  superadminLogoLight?: string;
}

export default function Header({ settings, sectionData, customPages = [], brandColor = '#3b82f6', user, superadminLogoDark, superadminLogoLight }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems = customPages.map(page => ({
    name: page.title,
    href: route('custom-page.show', page.slug)
  }));
  const { t } = useTranslation();

  const isTransparent = sectionData?.transparent === true || sectionData?.transparent === 'true' || sectionData?.transparent === 1 || sectionData?.transparent === '1';
  const backgroundColor = sectionData?.background_color || '#ffffff';
  const textColor = sectionData?.text_color;
  const buttonStyle = sectionData?.button_style || 'gradient';
  const secondaryColor = settings?.config_sections?.colors?.secondary || '#059669';

  const getHeaderClasses = () => {
    if (isTransparent) {
      return isScrolled 
        ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-lg border-b border-gray-200/50 dark:border-gray-800/50'
        : 'bg-transparent';
    }
    return isScrolled 
      ? 'shadow-lg border-b border-gray-200/50 dark:border-gray-800/50'
      : '';
  };

  const getHeaderStyle = () => {
    if (isTransparent) {
      return isScrolled ? { backgroundColor } : {};
    }
    return { backgroundColor };
  };

  const getButtonBaseStyle = (): React.CSSProperties => {
    switch (buttonStyle) {
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: brandColor,
          borderColor: brandColor,
          borderWidth: '1.5px',
          borderStyle: 'solid',
        };
      case 'solid':
        return {
          backgroundColor: brandColor,
          color: '#ffffff',
          borderColor: brandColor,
          borderWidth: '1px',
          borderStyle: 'solid',
        };
      case 'gradient':
      default:
        return {
          background: `linear-gradient(135deg, ${brandColor}, ${secondaryColor})`,
          color: '#ffffff',
          borderColor: 'transparent',
          borderWidth: '1px',
          borderStyle: 'solid',
        };
    }
  };

  const handleButtonMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (buttonStyle === 'outline') {
      e.currentTarget.style.backgroundColor = brandColor;
      e.currentTarget.style.color = '#ffffff';
      e.currentTarget.style.borderColor = brandColor;
    } else if (buttonStyle === 'solid') {
      e.currentTarget.style.backgroundColor = 'white';
      e.currentTarget.style.color = brandColor;
      e.currentTarget.style.borderColor = brandColor;
    } else {
      e.currentTarget.style.opacity = '0.9';
      e.currentTarget.style.transform = 'translateY(-1px)';
    }
  };

  const handleButtonMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (buttonStyle === 'outline') {
      e.currentTarget.style.backgroundColor = 'transparent';
      e.currentTarget.style.color = brandColor;
      e.currentTarget.style.borderColor = brandColor;
    } else if (buttonStyle === 'solid') {
      e.currentTarget.style.backgroundColor = brandColor;
      e.currentTarget.style.color = '#ffffff';
      e.currentTarget.style.borderColor = brandColor;
    } else {
      e.currentTarget.style.opacity = '1';
      e.currentTarget.style.transform = 'translateY(0)';
    }
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${getHeaderClasses()}`}
      style={getHeaderStyle()}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link 
              href={route("home")} 
              className="flex items-center transition-colors"
            >
              {(() => {
                // Always use superadmin dark logo for navbar
                const logoUrl = superadminLogoDark || window.appSettings?.logo;
                const displayUrl = logoUrl ? (
                  logoUrl.startsWith('http') ? logoUrl : 
                  logoUrl.startsWith('/storage/') ? `${window.appSettings?.baseUrl || window.location.origin}${logoUrl}` :
                  logoUrl.startsWith('/') ? `${window.appSettings?.baseUrl || window.location.origin}${logoUrl}` : logoUrl
                ) : '';
                
                return displayUrl ? (
                  <img
                    src={displayUrl}
                    alt={settings.company_name}
                    className="h-8 w-auto xl:max-w-[180px] sm:max-w-[130px] max-w-[100px] object-scale-down transition-all duration-200"
                  />
                ) : (
                  <span 
                    className="text-2xl font-bold transition-colors"
                    style={{ color: textColor || '#111827' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = brandColor}
                    onMouseLeave={(e) => e.currentTarget.style.color = textColor || '#111827'}
                  >
                    {settings.company_name}
                  </span>
                );
              })()} 
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 rtl:space-x-reverse overflow-x-auto py-2 mx-4 min-w-0" role="navigation" aria-label="Main navigation">

            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium transition-colors relative group whitespace-nowrap shrink-0"
                style={{ 
                  color: textColor || '#4b5563',
                  '--hover-color': brandColor 
                } as React.CSSProperties}
                onMouseEnter={(e) => e.currentTarget.style.color = brandColor}
                onMouseLeave={(e) => e.currentTarget.style.color = textColor || '#4b5563'}
              >
                {item.name}
                <span 
                  className="absolute -bottom-1 left-0 rtl:left-auto rtl:right-0 w-0 h-0.5 transition-all group-hover:w-full" 
                  style={{ backgroundColor: brandColor }}
                  aria-hidden="true"
                ></span>
              </Link>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4 shrink-0">
            {user ? (
              <Link
                href={route('dashboard')}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow"
                style={getButtonBaseStyle()}
                onMouseEnter={handleButtonMouseEnter}
                onMouseLeave={handleButtonMouseLeave}
              >
                {t("Dashboard")}
              </Link>
            ) : (
              <>
                <Link
                  href={route('login')}
                  className="text-sm font-medium transition-colors"
                  style={{ color: textColor || '#4b5563' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = brandColor}
                  onMouseLeave={(e) => e.currentTarget.style.color = textColor || '#4b5563'}
                >
                  {t("Login")}
                </Link>
                <Link
                  href={route('register')}
                  className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow"
                  style={getButtonBaseStyle()}
                  onMouseEnter={handleButtonMouseEnter}
                  onMouseLeave={handleButtonMouseLeave}
                >
                  {t("Get Started")}
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              style={{ color: textColor || '#4b5563' }}
              aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-800" id="mobile-menu">
            <div 
              className="px-4 py-6 space-y-4 shadow-xl"
              style={{ backgroundColor: backgroundColor || '#ffffff' }}
            >
              <div className="max-h-60 overflow-y-auto space-y-4 pr-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="block text-base font-medium transition-colors"
                    style={{ color: textColor || '#4b5563' }}
                    onClick={() => setIsMenuOpen(false)}
                    onMouseEnter={(e) => e.currentTarget.style.color = brandColor}
                    onMouseLeave={(e) => e.currentTarget.style.color = textColor || '#4b5563'}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="pt-4 space-y-3 border-t border-gray-200 dark:border-gray-800">
                {user ? (
                  <Link
                    href={route('dashboard')}
                    className="block w-full text-center py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm"
                    style={getButtonBaseStyle()}
                    onMouseEnter={handleButtonMouseEnter}
                    onMouseLeave={handleButtonMouseLeave}
                  >
                    {t("Dashboard")}
                  </Link>
                ) : (
                  <>
                    <Link
                      href={route('login')}
                      className="block w-full text-center py-2.5 text-sm font-medium transition-colors"
                      style={{ color: textColor || '#4b5563' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = brandColor}
                      onMouseLeave={(e) => e.currentTarget.style.color = textColor || '#4b5563'}
                    >
                      {t("Login")}
                    </Link>
                    <Link
                      href={route('register')}
                      className="block w-full text-center py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm"
                      style={getButtonBaseStyle()}
                      onMouseEnter={handleButtonMouseEnter}
                      onMouseLeave={handleButtonMouseLeave}
                    >
                      {t("Get Started")}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}