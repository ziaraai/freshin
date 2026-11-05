import React, { useState } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Mail, Phone, MapPin, CheckCircle } from 'lucide-react';
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram, FaYoutube, FaTiktok, FaPinterest, FaSnapchat, FaWhatsapp, FaTelegram, FaDiscord, FaReddit, FaTwitch, FaGithub, FaDribbble, FaBehance } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useBrand } from '@/contexts/BrandContext';

interface FooterProps {
  brandColor?: string;
  settings: {
    company_name: string;
    contact_email: string;
    contact_phone: string;
    contact_address: string;
  };
  sectionData?: {
    description?: string;
    newsletter_title?: string;
    newsletter_subtitle?: string;
    links?: any;
    social_links?: Array<{
      name: string;
      icon: string;
      href: string;
    }>;
    section_titles?: {
      product: string;
      company: string;
      support: string;
      legal: string;
    };
  };
  superadminLogoLight?: string;
}

export default function Footer({ settings, sectionData = {}, brandColor = '#3b82f6', superadminLogoLight }: FooterProps) {
  const { t } = useTranslation();
  const { footerText } = useBrand();
  const currentYear = new Date().getFullYear();
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const { data, setData, post, processing, errors, reset } = useForm({
    email: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('landing-page.subscribe'), {
      preserveScroll: true,
      onSuccess: () => {
        setIsSubmitted(true);
        reset();
        setTimeout(() => setIsSubmitted(false), 3000);
      }
    });
  };

  const footerLinks = sectionData.links || {
    product: [
      { name: 'Features', href: '#features' },
      { name: 'Pricing', href: '#pricing' },
      { name: 'Templates', href: '#' },
      { name: 'Integrations', href: '#' }
    ],
    company: [
      { name: 'About Us', href: '#about' },
      { name: 'Careers', href: '#' },
      { name: 'Press', href: '#' },
      { name: 'Contact', href: '#contact' }
    ],
    support: [
      { name: 'Help Center', href: '#' },
      { name: 'Documentation', href: '#' },
      { name: 'API Reference', href: '#' },
      { name: 'Status', href: '#' }
    ],
    legal: [
      { name: 'Privacy Policy', href: '#' },
      { name: 'Terms of Service', href: '#' },
      { name: 'Cookie Policy', href: '#' },
      { name: 'GDPR', href: '#' }
    ]
  };

  const iconMap: Record<string, any> = {
    Facebook: FaFacebook,
    Twitter: FaTwitter,
    LinkedIn: FaLinkedin,
    Instagram: FaInstagram,
    YouTube: FaYoutube,
    Tiktok: FaTiktok,
    Pinterest: FaPinterest,
    Snapchat: FaSnapchat,
    WhatsApp: FaWhatsapp,
    Telegram: FaTelegram,
    Discord: FaDiscord,
    Reddit: FaReddit,
    Twitch: FaTwitch,
    Github: FaGithub,
    Dribbble: FaDribbble,
    Behance: FaBehance
  };
  
  const socialLinks = sectionData.social_links || [
    { name: 'Facebook', icon: 'Facebook', href: '#' },
    { name: 'Twitter', icon: 'Twitter', href: '#' },
    { name: 'LinkedIn', icon: 'Linkedin', href: '#' },
    { name: 'Instagram', icon: 'Instagram', href: '#' }
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 sm:py-16">
          <div className="grid lg:grid-cols-6 gap-8 sm:gap-12">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <Link href={route("home")} className="mb-6 block transition-colors">
                {(() => {
                  const logoUrl = superadminLogoLight || window.appSettings?.logo;
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
                    <span className="text-2xl font-bold text-white hover:text-gray-300 transition-colors">
                      {settings.company_name}
                    </span>
                  );
                })()} 
              </Link>
              <p className="text-gray-400 mb-8 leading-relaxed">
                {sectionData.description || t('Empowering entrepreneurs to build and manage successful online stores. Create, customize, and scale your e-commerce business effortlessly.')}
              </p>
              
              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400 text-sm">{settings.contact_email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400 text-sm">{settings.contact_phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400 text-sm">{settings.contact_address}</span>
                </div>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">{sectionData.section_titles?.product || 'Product'}</h3>
              <ul className="space-y-3">
                {(footerLinks.product || []).map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">{sectionData.section_titles?.company || 'Company'}</h3>
              <ul className="space-y-3">
                {(footerLinks.company || []).map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">{sectionData.section_titles?.support || 'Support'}</h3>
              <ul className="space-y-3">
                {(footerLinks.support || []).map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">{sectionData.section_titles?.legal || t('Legal')}</h3>
              <ul className="space-y-3">
                {(footerLinks.legal || []).map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        {(sectionData.newsletter_title || sectionData.newsletter_subtitle) && (
          <div className="border-t border-gray-800 py-8 sm:py-12">
            <div className="text-center max-w-2xl mx-auto">
              <h3 className="text-xl font-bold text-white mb-4">
                {sectionData.newsletter_title || t('Stay Updated with Our Latest Features')}
              </h3>
              <p className="text-gray-400 mb-6">
                {sectionData.newsletter_subtitle || t('Join our newsletter for product updates and networking tips')}
              </p>
              {isSubmitted && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 max-w-md mx-auto">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>{t("Thank you for subscribing!")}</span>
                  </div>
                </div>
              )}
              <form onSubmit={handleSubmit} className="max-w-md mx-auto">
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    placeholder={t('Enter your email')}
                    className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-gray-600 focus:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                    disabled={processing}
                  />
                  <button 
                    type="submit"
                    disabled={processing}
                    className="text-white px-6 py-3 rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[120px]" 
                    style={{ backgroundColor: 'var(--secondary-color, #059669)' }}
                  >
                    {processing && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {processing ? t('Subscribing...') : t('Subscribe')}
                  </button>
                </div>
                {errors.email && (
                  <p className="text-red-400 text-sm mt-2">{errors.email}</p>
                )}
              </form>
            </div>
          </div>
        )}

        {/* Bottom Footer */}
        <div className="border-t border-gray-800 py-4 sm:py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4">
            {/* Copyright */}
            <div className="text-gray-400 text-sm">
              {footerText || `© ${currentYear} ${settings.company_name}. ${t("All rights reserved.")}`}
            </div>

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-gray-400 text-sm">{t('Follow us:')}</span>
                <div className="flex gap-3">
                  {socialLinks.map((social) => {
                    const IconComponent = iconMap[social.icon] || FaFacebook;
                    return (
                      <a
                        key={social.name}
                        href={social.href}
                        className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
                        aria-label={social.name}
                      >
                        <IconComponent className="w-4 h-4 text-gray-400" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}