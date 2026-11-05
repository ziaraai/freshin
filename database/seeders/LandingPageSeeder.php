<?php

namespace Database\Seeders;

use App\Models\LandingPageSetting;
use App\Models\LandingPageCustomPage;
use Illuminate\Database\Seeder;

class LandingPageSeeder extends Seeder
{
    public function run(): void
    {
        // Check if landing page settings already exist
        if (LandingPageSetting::exists()) {
            $this->command->info('Landing page settings already exist. Skipping seeder to preserve existing data.');
            return;
        }

        LandingPageSetting::updateOrCreate(
            ['id' => 1],
            [
                'company_name' => 'WhatsStore',
                'contact_email' => 'support@whatsstore.com',
                'contact_phone' => '+1 (555) 123-4567',
                'contact_address' => 'San Francisco, CA',
                'config_sections' => $this->getConfigSections()
            ]
        );
    }

    private function getConfigSections(): array
    {
        return [
            'sections' => [
                [
                    'key' => 'header',
                    'transparent' => false,
                    'background_color' => '#ffffff',
                    'logo_position' => 'left',
                    'menu_style' => 'horizontal',
                    'show_cta' => true,
                    'cta_text' => 'Start Free Trial',
                    'cta_link' => '/register',
                    'sticky' => true,
                    'shadow' => true,
                    'navigation_items' => [
                        ['name' => 'Features', 'href' => '#features'],
                        ['name' => 'Pricing', 'href' => '#pricing'],
                        ['name' => 'About', 'href' => '#about'],
                        ['name' => 'Contact', 'href' => '#contact']
                    ]
                ],
                [
                    'key' => 'hero',
                    'title' => 'Build & Manage Multiple WhatsApp Stores',
                    'subtitle' => 'Complete SaaS platform for creating unlimited WhatsApp-integrated e-commerce stores with multiple themes, payment gateways, and advanced management tools.',
                    'description' => 'Join thousands of entrepreneurs who use our multi-store SaaS platform to build successful WhatsApp-powered online businesses. Start your free trial today.',
                    'announcement_text' => '🚀 New: WhatsApp Business API Integration Now Available',
                    'cta_text' => 'Start Free Trial',
                    'cta_link' => '/register',
                    'primary_button_text' => 'Start Free Trial',
                    'secondary_cta_text' => 'View Live Demo',
                    'secondary_cta_link' => '/store/demo-store',
                    'secondary_button_text' => 'View Live Demo',
                    'background_color' => '#f8fafc',
                    'background_image' => '/storage/placeholder/hero-whatsapp-ecommerce.svg',
                    'overlay' => true,
                    'overlay_opacity' => 0.7,
                    'animation' => 'fade-in',
                    'video_url' => null,
                    'show_stats' => true,
                    'stats' => [
                        ['label' => 'Active Stores', 'value' => '15,000+'],
                        ['label' => 'Happy Merchants', 'value' => '5,500+'],
                        ['label' => 'Store Themes', 'value' => '10+'],
                    ],
                    'hero_cards' => [
                        [
                            'title' => 'WhatsApp Integration',
                            'description' => 'Direct WhatsApp ordering and customer support',
                            'icon' => 'message-circle',
                            'color' => '#25d366'
                        ],
                        [
                            'title' => 'Quick Setup',
                            'description' => 'Launch your store in under 5 minutes',
                            'icon' => 'rocket',
                            'color' => '#3b82f6'
                        ],
                        [
                            'title' => 'Multi-Store',
                            'description' => 'Manage unlimited stores from one dashboard',
                            'icon' => 'store',
                            'color' => '#8b5cf6'
                        ]
                    ],
                    'image' => '/storage/placeholder/whatsapp-dashboard-preview.svg',
                    'image_position' => 'right'
                ],
                [
                    'key' => 'about',
                    'title' => 'About WhatsStore',
                    'subtitle' => 'Empowering entrepreneurs worldwide with WhatsApp e-commerce solutions',
                    'description' => 'WhatsStore is the leading multi-store SaaS platform that enables entrepreneurs to create, manage, and scale unlimited WhatsApp-integrated online stores. Our mission is to democratize e-commerce by providing powerful tools that make it easy for anyone to start and grow their online business.',
                    'background_color' => '#ffffff',
                    'content' => [
                        [
                            'title' => 'Our Story',
                            'text' => 'Founded in 2020, WhatsStore was born from the vision of making e-commerce accessible to everyone. We recognized the power of WhatsApp as a communication tool and saw the opportunity to transform it into a complete e-commerce platform.',
                            'icon' => 'history'
                        ],
                        [
                            'title' => 'Our Mission',
                            'text' => 'To empower entrepreneurs worldwide by providing the most intuitive and powerful WhatsApp-integrated e-commerce platform that enables anyone to build and scale successful online businesses.',
                            'icon' => 'target'
                        ],
                        [
                            'title' => 'Our Vision',
                            'text' => 'A world where every entrepreneur has access to enterprise-level e-commerce tools, regardless of their technical expertise or budget constraints.',
                            'icon' => 'eye'
                        ]
                    ],
                    'achievements' => [
                        ['number' => '15,000+', 'label' => 'Active Stores'],
                        ['number' => '5,500+', 'label' => 'Happy Merchants'],
                        ['number' => '100+', 'label' => 'Countries Served'],
                        ['number' => '99.9%', 'label' => 'Uptime Guarantee']
                    ]
                ],
                [
                    'key' => 'features',
                    'title' => 'Complete WhatsApp E-commerce Platform',
                    'subtitle' => 'Everything you need to build and manage unlimited WhatsApp-integrated online stores',
                    'description' => 'From store creation to WhatsApp integration, our SaaS platform provides all the tools you need to run a successful multi-store business.',
                    'background_color' => '#f8fafc',
                    'layout' => 'grid',
                    'columns' => 3,
                    'show_icons' => true,
                    'icon_style' => 'modern',
                    'features' => [
                        [
                            'icon' => 'message-circle',
                            'title' => 'WhatsApp Business Integration',
                            'description' => 'Direct WhatsApp ordering, customer support, and automated notifications for seamless customer communication.',
                            'color' => '#25d366',
                            'link' => '/features/whatsapp'
                        ],
                        [
                            'icon' => 'store',
                            'title' => 'Unlimited Store Creation',
                            'description' => 'Create and manage unlimited online stores from a single SaaS dashboard with complete control.',
                            'color' => '#3b82f6',
                            'link' => '/features/multi-store'
                        ],
                        [
                            'icon' => 'palette',
                            'title' => 'Multiple Store Themes',
                            'description' => 'Choose from 10+ professional themes: Fashion, Electronics, Beauty, Jewelry, and more.',
                            'color' => '#10b77f',
                            'link' => '/features/themes'
                        ],
                        [
                            'icon' => 'credit-card',
                            'title' => '30+ Payment Gateways',
                            'description' => 'Stripe, PayPal, Razorpay, Flutterwave, and 26+ more payment gateways integrated.',
                            'color' => '#f59e0b',
                            'link' => '/features/payments'
                        ],
                        [
                            'icon' => 'package',
                            'title' => 'Product & Inventory Management',
                            'description' => 'Manage products, categories, variants, and inventory across all your stores efficiently.',
                            'color' => '#8b5cf6',
                            'link' => '/features/inventory'
                        ],
                        [
                            'icon' => 'users',
                            'title' => 'Customer Management',
                            'description' => 'Manage customers, orders, and WhatsApp conversations from one centralized dashboard.',
                            'color' => '#ef4444',
                            'link' => '/features/customers'
                        ],
                        [
                            'icon' => 'chart-bar',
                            'title' => 'Analytics & Reports',
                            'description' => 'Comprehensive analytics and reporting tools to track sales, customers, and store performance.',
                            'color' => '#06b6d4',
                            'link' => '/features/analytics'
                        ],
                        [
                            'icon' => 'shield-check',
                            'title' => 'Security & Compliance',
                            'description' => 'Enterprise-grade security with SSL certificates, data encryption, and GDPR compliance.',
                            'color' => '#84cc16',
                            'link' => '/features/security'
                        ],
                        [
                            'icon' => 'mobile',
                            'title' => 'Mobile Responsive',
                            'description' => 'All stores are fully mobile-responsive and optimized for mobile shopping experience.',
                            'color' => '#f97316',
                            'link' => '/features/mobile'
                        ]
                    ]
                ],
                [
                    'key' => 'testimonials',
                    'title' => 'What Our Customers Say',
                    'subtitle' => 'Join thousands of successful entrepreneurs who trust WhatsStore',
                    'description' => 'See how WhatsStore has helped businesses grow their online presence and increase sales through WhatsApp integration.',
                    'background_color' => '#ffffff',
                    'testimonials' => [
                        [
                            'name' => 'Sarah Johnson',
                            'role' => 'Fashion Store Owner',
                            'company' => 'Trendy Boutique',
                            'image' => '/storage/placeholder/testimonial-1.jpg',
                            'rating' => 5,
                            'text' => 'WhatsStore transformed my business! I went from struggling with a basic website to managing 3 successful stores with direct WhatsApp ordering. Sales increased by 300% in just 6 months.'
                        ],
                        [
                            'name' => 'Michael Chen',
                            'role' => 'Electronics Retailer',
                            'company' => 'Tech Hub Store',
                            'image' => '/storage/placeholder/testimonial-2.jpg',
                            'rating' => 5,
                            'text' => 'The WhatsApp integration is game-changing. Customers love ordering directly through WhatsApp, and I can manage everything from one dashboard. Best investment I\'ve made for my business.'
                        ],
                        [
                            'name' => 'Priya Patel',
                            'role' => 'Beauty Products Entrepreneur',
                            'company' => 'Glow Beauty',
                            'image' => '/storage/placeholder/testimonial-3.jpg',
                            'rating' => 5,
                            'text' => 'Started with zero technical knowledge. WhatsStore made it so easy to create professional stores. Now I run 5 beauty stores across different niches. The support team is amazing!'
                        ]
                    ]
                ],
                [
                    'key' => 'plans',
                    'title' => 'Choose Your Plan',
                    'subtitle' => 'Transparent pricing that grows with your business',
                    'description' => 'Start free and upgrade as you grow. No hidden fees, no transaction charges.',
                    'background_color' => '#f8fafc',
                    'billing_toggle' => true,
                    'highlight_popular' => true,
                    'show_features' => true,
                    'money_back_guarantee' => '30-day money back guarantee',
                    'guarantee_text' => 'Try risk-free with our 30-day money back guarantee',
                    'annual_discount' => 'Save 20% with annual billing',
                    'contact_sales_text' => 'Need a custom enterprise plan?',
                    'contact_sales_link' => '/contact-sales',
                    'plans_note' => 'All plans include WhatsApp integration, SSL certificates, and 24/7 support'
                ],
                [
                    'key' => 'faq',
                    'title' => 'Frequently Asked Questions',
                    'subtitle' => 'Everything you need to know about WhatsStore',
                    'description' => 'Can\'t find the answer you\'re looking for? Reach out to our customer support team.',
                    'background_color' => '#ffffff',
                    'faqs' => [
                        [
                            'question' => 'How does WhatsApp integration work?',
                            'answer' => 'Our platform integrates with WhatsApp Business API to enable direct ordering through WhatsApp. Customers can browse your store and place orders via WhatsApp messages, making the shopping experience seamless and familiar.'
                        ],
                        [
                            'question' => 'Can I create multiple stores with one account?',
                            'answer' => 'Yes! WhatsStore is designed as a multi-store SaaS platform. Depending on your plan, you can create and manage multiple stores from a single dashboard, each with its own theme, products, and WhatsApp integration.'
                        ],
                        [
                            'question' => 'What payment gateways are supported?',
                            'answer' => 'We support 30+ payment gateways including Stripe, PayPal, Razorpay, Flutterwave, Square, and many more. You can enable multiple payment methods for each store to give your customers flexibility.'
                        ],
                        [
                            'question' => 'Is there a free trial available?',
                            'answer' => 'Yes! We offer a 14-day free trial with full access to all features. No credit card required to start. You can create stores, test WhatsApp integration, and explore all features before deciding to upgrade.'
                        ],
                        [
                            'question' => 'Do I need technical knowledge to use WhatsStore?',
                            'answer' => 'Not at all! WhatsStore is designed for entrepreneurs without technical backgrounds. Our intuitive interface, drag-and-drop store builder, and comprehensive tutorials make it easy for anyone to create professional stores.'
                        ],
                        [
                            'question' => 'What kind of support do you provide?',
                            'answer' => 'We provide 24/7 customer support through live chat, email, and WhatsApp. Our team includes e-commerce experts who can help with store setup, WhatsApp integration, marketing strategies, and technical issues.'
                        ]
                    ]
                ],
                [
                    'key' => 'contact',
                    'title' => 'Get in Touch',
                    'subtitle' => 'Ready to start your WhatsApp e-commerce journey?',
                    'description' => 'Our team of e-commerce experts is here to help you succeed. Get in touch and let\'s build something amazing together.',
                    'background_color' => '#ffffff',
                    'show_form' => true,
                    'show_info' => true,
                    'contact_info_title' => 'Contact Information',
                    'contact_info_description' => 'Reach out to us through any of these channels. We\'re here to help you build your dream WhatsApp e-commerce business.',
                    'form_fields' => ['name', 'email', 'subject', 'message'],
                    'form_title' => 'Send us a message',
                    'form_subtitle' => 'We\'ll get back to you within 4 hours',
                    'contact_methods' => [
                        ['type' => 'email', 'value' => 'support@whatsstore.com', 'label' => 'Email Support', 'description' => 'Get help via email'],
                        ['type' => 'phone', 'value' => '+1 (555) 123-4567', 'label' => 'Phone Support', 'description' => 'Speak with our team'],
                        ['type' => 'chat', 'value' => 'Live Chat', 'label' => 'Live Chat', 'description' => 'Chat with us instantly']
                    ],
                    'response_time' => '4 hours',
                    'support_hours' => '24/7',
                    'office_locations' => [
                        [
                            'city' => 'San Francisco',
                            'address' => '123 E-commerce Street, Suite 100, San Francisco, CA 94105',
                            'phone' => '+1 (555) 123-4567',
                            'hours' => 'Mon-Fri: 9AM-6PM PST'
                        ]
                    ]
                ],
                [
                    'key' => 'footer',
                    'background_color' => '#1f2937',
                    'text_color' => '#ffffff',
                    'show_social' => true,
                    'show_newsletter' => true,
                    'show_logo' => true,
                    'logo_position' => 'top',
                    'description' => 'WhatsStore is the leading WhatsApp-integrated multi-store e-commerce SaaS platform that empowers entrepreneurs to create, manage, and scale unlimited online stores with direct WhatsApp ordering capabilities.',
                    'newsletter_title' => 'Stay Connected with WhatsStore',
                    'newsletter_subtitle' => 'Get exclusive e-commerce insights, WhatsApp integration tips, and platform updates delivered to your inbox',
                    'links' => [
                        'product' => [
                            ['name' => 'Features', 'href' => '#features'],
                            ['name' => 'WhatsApp Integration', 'href' => '#features'],
                            ['name' => 'Store Themes', 'href' => '#features'],
                            ['name' => 'Pricing Plans', 'href' => '#pricing']
                        ],
                        'company' => [
                            ['name' => 'About Us', 'href' => '#about'],
                            ['name' => 'Contact Us', 'href' => '#contact'],
                            ['name' => 'Blog', 'href' => '/blog'],
                            ['name' => 'Careers', 'href' => '/careers']
                        ],
                        'support' => [
                            ['name' => 'Help Center', 'href' => '/help'],
                            ['name' => 'Documentation', 'href' => '/docs'],
                            ['name' => 'API Reference', 'href' => '/api'],
                            ['name' => 'Status Page', 'href' => '/status']
                        ],
                        'legal' => [
                            ['name' => 'Privacy Policy', 'href' => '/privacy'],
                            ['name' => 'Terms of Service', 'href' => '/terms'],
                            ['name' => 'Refund Policy', 'href' => '/refund'],
                            ['name' => 'Cookie Policy', 'href' => '/cookies']
                        ]
                    ],
                    'section_titles' => [
                        'product' => 'Platform',
                        'company' => 'Company',
                        'support' => 'Resources',
                        'legal' => 'Legal & Security'
                    ],
                    'social_links' => [
                        ['name' => 'Twitter', 'icon' => 'Twitter', 'href' => 'https://x.com/whatsstore'],
                        ['name' => 'LinkedIn', 'icon' => 'Linkedin', 'href' => 'https://www.linkedin.com/company/whatsstore'],
                        ['name' => 'Facebook', 'icon' => 'Facebook', 'href' => 'https://www.facebook.com/whatsstore'],
                        ['name' => 'Instagram', 'icon' => 'Instagram', 'href' => 'https://www.instagram.com/whatsstore']
                    ],
                    'copyright' => '© 2024 WhatsStore. All rights reserved.',
                    'bottom_text' => 'Built for entrepreneurs, by entrepreneurs. Trusted by 15,000+ merchants with WhatsApp integration. SOC 2 Type II compliant with 99.9% uptime guarantee.',
                    'trust_badges' => [
                        ['name' => 'SSL Secured', 'icon' => 'shield-check'],
                        ['name' => 'GDPR Compliant', 'icon' => 'check-circle'],
                        ['name' => '99.9% Uptime', 'icon' => 'server']
                    ]
                ]
            ],
            'colors' => [
                'primary' => '#25d366',
                'secondary' => '#128c7e',
                'accent' => '#075e54',
                'background' => '#ffffff',
                'text' => '#1f2937'
            ],
            'seo' => [
                'meta_title' => 'WhatsStore - WhatsApp E-commerce Platform | Launch Your Online Store',
                'meta_description' => 'Create and manage multiple WhatsApp-integrated online stores with WhatsStore. 30+ payment gateways, beautiful themes, direct WhatsApp ordering. Start your free trial today.',
                'meta_keywords' => 'whatsapp ecommerce, online store builder, multi-store management, whatsapp business, sell online, ecommerce website, store builder, saas platform',
                'og_title' => 'WhatsStore - Build Multiple WhatsApp E-commerce Stores',
                'og_description' => 'The complete SaaS platform for creating unlimited WhatsApp-integrated online stores. Join 15,000+ successful merchants.',
                'og_image' => '/storage/placeholder/whatsstore-og-image.jpg'
            ],
            'section_order' => [
                'header', 'hero', 'about', 'features', 'testimonials', 'plans', 'faq', 'contact', 'footer'
            ],
            'section_visibility' => [
                'header' => true,
                'hero' => true,
                'about' => true,
                'features' => true,
                'testimonials' => true,
                'plans' => true,
                'faq' => true,
                'contact' => true,
                'footer' => true
            ]
        ];
    }

}