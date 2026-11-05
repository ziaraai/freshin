export const defaultLandingPageSections = {
  sections: [
    {
      key: 'header',
      transparent: false,
      background_color: '#ffffff',
      text_color: '#1f2937',
      button_style: 'gradient'
    },
    {
      key: 'hero',
      title: 'Launch Your Online Store in Minutes',
      subtitle: 'Create and manage multiple online stores with our powerful e-commerce platform.',
      announcement_text: '🚀 New: Advanced Analytics Dashboard',
      primary_button_text: 'Start Free Trial',
      secondary_button_text: 'Login',
      image: '/images/hero-dashboard.png',
      background_color: '#f8fafc',
      text_color: '#1f2937',
      layout: 'image-right',
      height: 600,
      image_position: 'right',
      overlay: false,
      overlay_color: 'rgba(0,0,0,0.5)',
      button_primary_color: '#10b77f',
      button_secondary_color: '#6b7280',
      button_text_color: '#ffffff',
      stats: [
        { value: '10K+', label: 'Active Users' },
        { value: '50+', label: 'Countries' },
        { value: '99%', label: 'Satisfaction' }
      ],

    },
    {
      key: 'features',
      title: 'Everything You Need to Sell Online',
      description: 'Powerful e-commerce features designed for modern businesses.',
      background_color: '#ffffff',
      layout: 'grid',
      columns: 3,
      image: '',
      show_icons: true,
      features_list: [
        {
          title: 'Multi-Store Management',
          description: 'Create and manage unlimited online stores from one dashboard.',
          icon: 'store'
        },
        {
          title: '30+ Payment Gateways',
          description: 'Accept payments via Stripe, PayPal, Razorpay, and more.',
          icon: 'credit-card'
        },
        {
          title: 'Advanced Analytics',
          description: 'Track sales, customers, and performance with detailed reports.',
          icon: 'bar-chart'
        }
      ]
    },
    {
      key: 'screenshots',
      title: 'See WhatsStore in Action',
      subtitle: 'Explore our intuitive dashboard and powerful store management features.',
      screenshots_list: [
        {
          src: '/screenshots/hero.png',
          alt: 'WhatsStore Dashboard Overview',
          title: 'Dashboard Overview',
          description: 'Comprehensive dashboard with all your stores and analytics'
        },
        {
          src: '/screenshots/store-builder.png',
          alt: 'Store Builder Interface',
          title: 'Store Builder',
          description: 'Intuitive interface for creating and managing online stores'
        }
      ]
    },
    {
      key: 'why_choose_us',
      title: 'Why Choose WhatsStore?',
      subtitle: 'The complete e-commerce solution for modern businesses.',
      reasons: [
        { title: 'Multi-Store Architecture', description: 'Manage unlimited stores from one account with centralized dashboard.', icon: 'stores' },
        { title: 'No Transaction Fees', description: 'Keep 100% of your profits with transparent pricing.', icon: 'money' }
      ],
      stats: [
        { value: '10K+', label: 'Active Users', color: 'blue' },
        { value: '99%', label: 'Satisfaction', color: 'green' }
      ]
    },
    {
      key: 'themes',
      title: 'Choose Your Store Theme',
      subtitle: 'Select from our professionally designed themes to match your business style',
      selected_themes: ['gadgets', 'fashion', 'bakery'],
      cta_title: 'Ready to Start Your Store?',
      cta_description: 'Choose your favorite theme and start building your online store today. You can always change themes later from your dashboard.',
      primary_button_text: 'Get Started Free',
      secondary_button_text: 'View All Features'
    },
    {
      key: 'about',
      title: 'About WhatsStore',
      description: 'We are passionate about empowering entrepreneurs to build successful e-commerce businesses.',
      story_title: 'Revolutionizing Multi-Store E-commerce Since 2019',
      story_content: 'Founded by e-commerce experts and technology innovators, WhatsStore was created to solve the challenges of managing multiple online stores.',
      image: '',
      background_color: '#f9fafb',
      layout: 'image-right',
      stats: [
        { value: '4+ Years', label: 'Experience', color: 'blue' },
        { value: '10K+', label: 'Happy Users', color: 'green' },
        { value: '50+', label: 'Countries', color: 'purple' }
      ]
    },
    {
      key: 'team',
      title: 'Meet Our Team',
      subtitle: 'We\'re a diverse team of innovators and problem-solvers.',
      cta_title: 'Want to Join Our Team?',
      cta_description: 'We\'re always looking for talented individuals.',
      cta_button_text: 'View Open Positions',
      members: [
        { name: 'Sarah Johnson', role: 'CEO & Founder', bio: 'Former tech executive with 15+ years experience.', image: '', linkedin: '#', email: 'sarah@whatsstore.com' }
      ]
    },
    {
      key: 'testimonials',
      title: 'What Our Clients Say',
      subtitle: 'Don\'t just take our word for it.',
      trust_title: 'Trusted by Professionals Worldwide',
      trust_stats: [
        { value: '4.9/5', label: 'Average Rating', color: 'blue' },
        { value: '10K+', label: 'Happy Users', color: 'green' }
      ],
      testimonials: [
        { name: 'Alex Thompson', role: 'Sales Director', company: 'TechCorp Inc.', content: 'WhatsStore has revolutionized how I manage my online stores.', rating: 5 }
      ]
    },
    {
      key: 'active_campaigns',
      title: 'Featured Business Promotions',
      subtitle: 'Explore businesses we\'re currently promoting and discover amazing services',
      background_color: '#f8fafc',
      show_view_all: true,
      max_display: 6
    },
    {
      key: 'plans',
      title: 'Choose Your Plan',
      subtitle: 'Start with our free plan and upgrade as you grow.',
      faq_text: 'Have questions about our plans? Contact our sales team'
    },
    {
      key: 'faq',
      title: 'Frequently Asked Questions',
      subtitle: 'Got questions? We\'ve got answers.',
      cta_text: 'Still have questions?',
      button_text: 'Contact Support',
      faqs: [
        { question: 'How does WhatsStore work?', answer: 'WhatsStore allows you to create and manage multiple online stores from a single dashboard with powerful e-commerce features.' }
      ]
    },
    {
      key: 'newsletter',
      title: 'Stay Updated with WhatsStore',
      subtitle: 'Get the latest updates, e-commerce tips, and feature announcements.',
      privacy_text: 'No spam, unsubscribe at any time.',
      benefits: [
        { icon: '📧', title: 'Weekly Updates', description: 'Latest features and improvements' }
      ]
    },
    {
      key: 'contact',
      title: 'Get in Touch',
      subtitle: 'Have questions about WhatsStore? We\'d love to hear from you.',
      form_title: 'Send us a Message',
      info_title: 'Contact Information',
      info_description: 'We\'re here to help and answer any question you might have.',
      layout: 'split',
      background_color: '#f9fafb'
    },
    {
      key: 'footer',
      description: 'Empowering entrepreneurs with powerful multi-store e-commerce solutions.',
      newsletter_title: 'Stay Updated with WhatsStore',
      newsletter_subtitle: 'Join our newsletter for e-commerce tips and updates',
      links: {
        product: [
          { name: 'Features', href: '#features' },
          { name: 'Themes', href: '#themes' },
          { name: 'Pricing', href: '#pricing' },
          { name: 'Analytics', href: '#analytics' }
        ],
        company: [
          { name: 'About Us', href: '#about' },
          { name: 'Our Team', href: '#team' },
          { name: 'Contact', href: '#contact' },
          { name: 'Careers', href: '#careers' }
        ],
        support: [
          { name: 'Help Center', href: '#help' },
          { name: 'Documentation', href: '#docs' },
          { name: 'FAQ', href: '#faq' },
          { name: 'Contact Support', href: '#support' }
        ],
        legal: [
          { name: 'Privacy Policy', href: '#privacy' },
          { name: 'Terms of Service', href: '#terms' },
          { name: 'Cookie Policy', href: '#cookies' },
          { name: 'GDPR', href: '#gdpr' }
        ]
      },
      social_links: [
        { name: 'Facebook', icon: 'Facebook', href: '#' },
        { name: 'Twitter', icon: 'Twitter', href: '#' },
        { name: 'LinkedIn', icon: 'Linkedin', href: '#' },
        { name: 'Instagram', icon: 'Instagram', href: '#' }
      ],
      section_titles: {
        product: 'Product',
        company: 'Company',
        support: 'Support',
        legal: 'Legal'
      }
    }
  ],
  colors: {
    primary: '#10b77f',
    secondary: '#059669',
    accent: '#065f46'
  },
  theme: {
    primary_color: '#10b77f',
    secondary_color: '#ffffff',
    accent_color: '#f7f7f7',
    logo_light: '',
    logo_dark: '',
    favicon: ''
  },
  seo: {
    meta_title: 'WhatsStore - Multi-Store Management Platform',
    meta_description: 'Create and manage multiple online stores with WhatsStore. Powerful e-commerce platform with beautiful themes and advanced features.',
    meta_keywords: 'multi-store platform, online store management, e-commerce solution, store builder, WhatsStore'
  },
  custom_css: '',
  custom_js: '',
  section_order: ['header', 'hero', 'features', 'screenshots', 'themes', 'why_choose_us', 'about', 'team', 'testimonials', 'active_campaigns', 'plans', 'faq', 'newsletter', 'contact', 'footer'],
  section_visibility: {
    header: true,
    hero: true,
    features: true,
    screenshots: true,
    why_choose_us: true,
    themes: true,
    about: true,
    team: true,
    testimonials: true,
    active_campaigns: true,
    plans: true,
    faq: true,
    newsletter: true,
    contact: true,
    footer: true
  }
};