<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LandingPageSetting extends Model
{
    protected $fillable = [
        'company_name', 'contact_email', 'contact_phone', 'contact_address', 'config_sections',
    ];

    protected $attributes = [
        'company_name' => 'WhatsStore',
        'contact_email' => 'support@whatsstore.com',
        'contact_phone' => '+1 (555) 123-4567',
        'contact_address' => '123 Business Ave, Suite 100, San Francisco, CA 94105',
    ];

    protected $casts = [
        'config_sections' => 'array',
    ];

    public static function getSettings()
    {
        $settings = self::first();

        if (! $settings) {
            // Import default sections from the template file structure
            $defaultConfig = [
                'sections' => [
                    [
                        'key' => 'header',
                        'transparent' => false,
                        'background_color' => '#ffffff',
                        'text_color' => '#1f2937',
                        'button_style' => 'gradient',
                    ],
                    [
                        'key' => 'hero',
                        'title' => 'Launch Your Online Store in Minutes',
                        'subtitle' => 'Create and manage multiple online stores with our powerful e-commerce platform.',
                        'announcement_text' => '🚀 New: Advanced Analytics Dashboard',
                        'primary_button_text' => 'Start Free Trial',
                        'secondary_button_text' => 'Login',
                        'image' => '/images/hero-dashboard.svg',
                        'background_color' => '#f8fafc',
                        'text_color' => '#1f2937',
                        'layout' => 'image-right',
                        'height' => 600,
                        'stats' => [
                            ['value' => '10K+', 'label' => 'Active Users'],
                            ['value' => '50+', 'label' => 'Countries'],
                            ['value' => '99%', 'label' => 'Satisfaction'],
                        ],
                    ],
                    [
                        'key' => 'features',
                        'title' => 'Everything You Need to Build Your Online Empire',
                        'description' => 'Comprehensive multi-store management platform with powerful features designed for modern e-commerce entrepreneurs.',
                        'background_color' => '#ffffff',
                        'layout' => 'grid',
                        'columns' => 3,
                        'image' => '',
                        'show_icons' => true,
                        'features_list' => [
                            ['title' => 'Multi-Store Management', 'description' => 'Create and manage unlimited online stores from one centralized dashboard with ease.', 'icon' => 'store'],
                            ['title' => '7+ Professional Themes', 'description' => 'Choose from beautifully designed themes for different business categories and industries.', 'icon' => 'palette'],
                            ['title' => '30+ Payment Gateways', 'description' => 'Accept payments globally with Stripe, PayPal, Razorpay, and 30+ other payment methods.', 'icon' => 'credit-card'],
                            ['title' => 'Advanced Analytics', 'description' => 'Track sales, customers, inventory, and performance with detailed reports and insights.', 'icon' => 'bar-chart'],
                            ['title' => 'Customer Management', 'description' => 'Manage customer profiles, orders, and communication across all your stores.', 'icon' => 'users'],
                            ['title' => 'Inventory Management', 'description' => 'Track stock levels, manage products, and automate inventory across multiple stores.', 'icon' => 'package'],
                            ['title' => 'Mobile Responsive', 'description' => 'All stores are fully optimized for mobile devices and tablets for better customer experience.', 'icon' => 'smartphone'],
                            ['title' => 'Secure & Reliable', 'description' => 'Enterprise-grade security with SSL certificates, data encryption, and regular backups.', 'icon' => 'shield'],
                            ['title' => '24/7 Support', 'description' => 'Get help when you need it with our dedicated support team available around the clock.', 'icon' => 'headphones'],
                        ],
                    ],
                    [
                        'key' => 'screenshots',
                        'title' => 'See WhatsStore in Action',
                        'subtitle' => 'Explore our powerful multi-store management platform and see how easy it is to build your online empire.',
                        'screenshots_list' => [
                            [
                                'src' => '/storage/placeholder/landing-page/dashboard.png',
                                'alt' => 'WhatsStore Dashboard Overview',
                                'title' => 'Dashboard Overview',
                                'description' => 'Comprehensive dashboard showing all your stores, sales analytics, and key performance metrics in one place.',
                            ],
                            [
                                'src' => '/storage/placeholder/landing-page/stores.png',
                                'alt' => 'Store Builder Interface',
                                'title' => 'Store Builder',
                                'description' => 'Intuitive drag-and-drop store builder with professional themes and customization options.',
                            ],
                            [
                                'src' => '/storage/placeholder/landing-page/products.png',
                                'alt' => 'Product Management System',
                                'title' => 'Product Management',
                                'description' => 'Easily add, edit, and organize products across multiple stores with bulk operations and inventory tracking.',
                            ],
                            [
                                'src' => '/storage/placeholder/landing-page/orders.png',
                                'alt' => 'Order Management Dashboard',
                                'title' => 'Order Management',
                                'description' => 'Track and manage orders from all your stores in one centralized order management system.',
                            ],
                            [
                                'src' => '/storage/placeholder/landing-page/analytics.png',
                                'alt' => 'Analytics and Reports',
                                'title' => 'Analytics & Reports',
                                'description' => 'Detailed analytics and reports showing sales trends, customer behavior, and store performance insights.',
                            ],
                            [
                                'src' => '/storage/placeholder/landing-page/themes.png',
                                'alt' => 'Theme Selections',
                                'title' => 'Theme Selections',
                                'description' => 'Choose from 7+ professional themes for each store',
                            ],
                        ],
                    ],
                    [
                        'key' => 'why_choose_us',
                        'title' => 'Why Choose WhatsStore?',
                        'subtitle' => 'The complete multi-store e-commerce solution designed for ambitious entrepreneurs and growing businesses.',
                        'reasons' => [
                            ['title' => 'Multi-Store Architecture', 'description' => 'Manage unlimited stores from one account with centralized dashboard, inventory, and customer management.', 'icon' => 'stores'],
                            ['title' => 'Professional Themes', 'description' => 'Choose from 7+ industry-specific themes designed to maximize conversions and user experience.', 'icon' => 'palette'],
                            ['title' => 'Advanced Analytics', 'description' => 'Get detailed insights into sales, customers, and performance across all your stores in real-time.', 'icon' => 'chart'],
                        ],
                        'stats_title' => 'Trusted by Businesses Worldwide',
                        'stats_subtitle' => 'Join thousands of successful entrepreneurs',
                        'stats' => [
                            ['value' => '15K+', 'label' => 'Active Users', 'color' => 'green'],
                            ['value' => '99.9%', 'label' => 'Uptime', 'color' => 'green'],
                            ['value' => '24/7', 'label' => 'Support', 'color' => 'green'],
                        ],
                        'cta_title' => 'Ready to Build Your Store Empire?',
                        'cta_subtitle' => 'Join thousands of successful entrepreneurs using WhatsStore',
                    ],
                    [
                        'key' => 'themes',
                        'title' => 'Choose Your Perfect Store Theme',
                        'subtitle' => 'Select from our collection of professionally designed themes, each crafted for specific business categories to maximize your success.',
                        'selected_themes' => ['fashion', 'home-decor', 'bakery', 'supermarket', 'car-accessories', 'toy'],
                        'cta_title' => 'Ready to Launch Your Store Empire?',
                        'cta_description' => 'Pick your favorite theme and start building your first store in minutes. Switch themes anytime as your business grows and evolves.',
                        'primary_button_text' => 'Start Building Now',
                        'secondary_button_text' => 'Explore All Themes',
                    ],
                    [
                        'key' => 'about',
                        'title' => 'About WhatsStore',
                        'description' => 'We are passionate about empowering entrepreneurs to build and scale successful multi-store e-commerce businesses with cutting-edge technology.',
                        'story_title' => 'Revolutionizing Multi-Store E-commerce Since 2020',
                        'story_content' => 'Founded by e-commerce experts and technology innovators, WhatsStore was created to solve the complex challenges of managing multiple online stores. Our platform enables entrepreneurs to build, customize, and scale their store empire from a single powerful dashboard.',
                        'image' => '/images/about-whatsstore.svg',
                        'background_color' => '#f9fafb',
                        'layout' => 'image-right',
                        'stats' => [
                            ['value' => '5+ Years', 'label' => 'Experience', 'color' => 'green'],
                            ['value' => '15K+', 'label' => 'Happy Users', 'color' => 'green'],
                            ['value' => '75+', 'label' => 'Countries', 'color' => 'green'],
                        ],
                        'values' => [
                            ['icon' => 'target', 'title' => 'Our Mission', 'description' => 'To democratize e-commerce by providing powerful, easy-to-use tools that enable anyone to build and manage successful online stores from a single dashboard.'],
                            ['icon' => 'heart', 'title' => 'Our Values', 'description' => 'We believe in innovation, scalability, and empowering entrepreneurs to achieve e-commerce success through cutting-edge multi-store technology.'],
                            ['icon' => 'award', 'title' => 'Our Commitment', 'description' => 'Delivering exceptional multi-store management experience with enterprise-grade security, 99.9% uptime, and 24/7 dedicated support.'],
                            ['icon' => 'lightbulb', 'title' => 'Our Vision', 'description' => 'A world where every entrepreneur can easily create, manage, and scale multiple profitable online stores without technical barriers or limitations.'],
                        ],
                    ],
                    [
                        'key' => 'team',
                        'title' => 'Meet Our WhatsStore Team',
                        'subtitle' => 'Passionate experts dedicated to revolutionizing multi-store e-commerce management.',
                        'cta_title' => 'Join Our Growing Team',
                        'cta_description' => 'Help us build the future of multi-store e-commerce platforms.',
                        'cta_button_text' => 'View Career Opportunities',
                        'members' => [
                            ['name' => 'Alex Rodriguez', 'role' => 'CEO & Founder', 'bio' => 'E-commerce visionary with 12+ years building scalable SaaS platforms. Former CTO at leading retail tech companies.', 'image' => '', 'linkedin' => '#', 'email' => 'alex@whatsstore.com', 'twitter' => '#'],
                            ['name' => 'Sarah Chen', 'role' => 'CTO & Co-Founder', 'bio' => 'Full-stack architect specializing in multi-tenant SaaS solutions. Expert in cloud infrastructure and scalable systems.', 'image' => '', 'linkedin' => '#', 'email' => 'sarah@whatsstore.com', 'github' => '#'],
                            ['name' => 'Michael Thompson', 'role' => 'Head of Product', 'bio' => 'Product strategist with deep e-commerce expertise. Led product teams at major online marketplace platforms.', 'image' => '', 'linkedin' => '#', 'email' => 'michael@whatsstore.com', 'twitter' => '#'],
                            ['name' => 'Emily Davis', 'role' => 'VP of Engineering', 'bio' => 'Engineering leader passionate about building robust, scalable multi-store management solutions.', 'image' => '', 'linkedin' => '#', 'email' => 'emily@whatsstore.com', 'github' => '#'],
                        ],
                    ],
                    [
                        'key' => 'testimonials',
                        'title' => 'What Our Store Owners Say',
                        'subtitle' => 'Real success stories from WhatsStore merchants worldwide.',
                        'trust_title' => 'Trusted by E-commerce Entrepreneurs',
                        'trust_stats' => [
                            ['value' => '4.9/5', 'label' => 'Customer Rating', 'color' => 'green'],
                            ['value' => '15K+', 'label' => 'Active Stores', 'color' => 'green'],
                            ['value' => '99.9%', 'label' => 'Uptime', 'color' => 'green'],
                            ['value' => '24/7', 'label' => 'Support', 'color' => 'green'],
                        ],
                        'testimonials' => [
                            ['name' => 'Maria Rodriguez', 'role' => 'Fashion Store Owner', 'company' => 'Bella Boutique', 'rating' => 5, 'content' => 'WhatsStore transformed my business! I now manage 4 fashion stores effortlessly from one dashboard. Sales increased 300% in 6 months.', 'image' => '', 'location' => 'Miami, FL'],
                            ['name' => 'James Chen', 'role' => 'Electronics Retailer', 'company' => 'TechHub Pro', 'rating' => 5, 'content' => 'The multi-store analytics are incredible. I can track performance across all 7 of my electronics stores in real-time. Game changer!', 'image' => '', 'location' => 'San Francisco, CA'],
                            ['name' => 'Sophie Williams', 'role' => 'Home Decor Entrepreneur', 'company' => 'Cozy Living Co', 'rating' => 5, 'content' => 'Started with 1 store, now running 5 successful home decor shops. WhatsStore made scaling so simple and profitable.', 'image' => '', 'location' => 'Austin, TX'],
                        ],
                    ],
                    [
                        'key' => 'active_campaigns',
                        'title' => 'Featured Business Promotions',
                        'subtitle' => 'Explore businesses we\'re currently promoting and discover amazing services',
                        'background_color' => '#f8fafc',
                        'show_view_all' => true,
                        'max_display' => 6,
                    ],
                    [
                        'key' => 'plans',
                        'title' => 'Choose Your Plan',
                        'subtitle' => 'Start with our free plan and upgrade as you grow.',
                        'faq_text' => 'Have questions about our plans? Contact our sales team',
                    ],
                    [
                        'key' => 'faq',
                        'title' => 'Frequently Asked Questions',
                        'subtitle' => 'Got questions? We\'ve got answers.',
                        'cta_text' => 'Still have questions?',
                        'button_text' => 'Contact Support',
                        'faqs' => [
                            ['question' => 'How does WhatsStore multi-store management work?', 'answer' => 'WhatsStore allows you to create and manage unlimited online stores from a single dashboard. Each store can have different themes, products, and settings while sharing centralized inventory and customer management.'],
                            ['question' => 'Can I use different themes for each store?', 'answer' => 'Yes! WhatsStore offers 7+ professional themes. You can assign different themes to each store - fashion theme for clothing stores, electronics theme for gadget stores, etc. Switch themes anytime without losing data.'],
                            ['question' => 'What payment gateways are supported?', 'answer' => 'WhatsStore supports 30+ payment gateways including Stripe, PayPal, Razorpay, Square, and many regional providers. You can enable different payment methods for different stores based on your target markets.'],
                            ['question' => 'How does inventory management work across multiple stores?', 'answer' => 'Our centralized inventory system lets you manage stock across all stores. Set different stock levels per store, enable auto-sync, or manage inventory independently. Get low-stock alerts and automated reorder notifications.'],
                        ],
                    ],
                    [
                        'key' => 'newsletter',
                        'title' => 'Stay Updated with WhatsStore',
                        'subtitle' => 'Get exclusive multi-store e-commerce insights, platform updates, and growth strategies.',
                        'privacy_text' => 'No spam, unsubscribe at any time. Your privacy is protected.',
                        'benefits' => [
                            ['icon' => '📧', 'title' => 'Weekly Insights', 'description' => 'Multi-store management tips and best practices'],
                            ['icon' => '🚀', 'title' => 'Feature Updates', 'description' => 'First access to new WhatsStore features'],
                            ['icon' => '📊', 'title' => 'Growth Strategies', 'description' => 'Proven tactics to scale your store empire'],
                        ],
                    ],
                    [
                        'key' => 'contact',
                        'title' => 'Get in Touch with WhatsStore',
                        'subtitle' => 'Ready to build your multi-store empire? Have questions? We\'re here to help you succeed.',
                        'form_title' => 'Send us a Message',
                        'info_title' => 'Contact Information',
                        'info_description' => 'Our team is ready to help you launch and scale your multi-store business.',
                        'contact_title' => 'Contact Information',
                        'contact_description' => 'Our team is ready to help you launch and scale your multi-store business.',
                        'section_title' => 'Contact Information',
                        'section_description' => 'Our team is ready to help you launch and scale your multi-store business.',
                        'layout' => 'split',
                        'background_color' => '#f9fafb',
                        'email' => 'support@whatsstore.com',
                        'phone' => '+1 (555) 123-4567',
                        'address' => '123 Business Ave, Suite 100, San Francisco, CA 94105',
                        'response_time' => 'We typically respond within 2 hours during business hours',
                        'business_hours' => 'Monday - Friday: 9:00 AM - 6:00 PM PST',
                        'support_email' => 'support@whatsstore.com',
                        'sales_email' => 'sales@whatsstore.com',
                        'office_hours' => '9:00 AM - 6:00 PM PST',
                        'timezone' => 'Pacific Standard Time',
                        'contact_faqs' => [
                            ['question' => 'How can I contact WhatsStore support?', 'answer' => 'You can reach us via email at support@whatsstore.com, phone at +1 (555) 123-4567, or use our live chat feature available 24/7 on our website.'],
                            ['question' => 'What are your business hours?', 'answer' => 'Our support team is available Monday through Friday, 9:00 AM to 6:00 PM PST. We typically respond to emails within 2 hours during business hours.'],
                            ['question' => 'Do you offer phone support?', 'answer' => 'Yes! Call us at +1 (555) 123-4567 during business hours for immediate assistance with your WhatsStore account and technical questions.'],
                            ['question' => 'Where is WhatsStore located?', 'answer' => 'Our headquarters is located at 123 Business Ave, Suite 100, San Francisco, CA 94105. You can visit us during business hours or schedule an appointment.'],
                        ],
                    ],
                    [
                        'key' => 'footer',
                        'description' => 'Empowering entrepreneurs with powerful multi-store e-commerce solutions.',
                        'newsletter_title' => 'Stay Updated',
                        'newsletter_subtitle' => 'Join our newsletter for updates',
                        'links' => [
                            'product' => [
                                ['name' => 'Features', 'href' => '/#features'],
                                ['name' => 'Pricing', 'href' => '/#pricing'],
                                ['name' => 'Store Themes', 'href' => '/#themes'],
                                ['name' => 'Documentation', 'href' => '/docs'],
                                ['name' => 'API', 'href' => '/api-docs'],
                            ],
                            'company' => [
                                ['name' => 'About Us', 'href' => '/#about'],
                                ['name' => 'Contact', 'href' => '/#contact'],
                                ['name' => 'Careers', 'href' => '/careers'],
                                ['name' => 'Press Kit', 'href' => '/press'],
                                ['name' => 'Partners', 'href' => '/partners'],
                            ],
                            'support' => [
                                ['name' => 'Help Center', 'href' => '/help'],
                                ['name' => 'Community', 'href' => '/community'],
                                ['name' => 'Support Tickets', 'href' => '/support'],
                                ['name' => 'System Status', 'href' => '/status'],
                                ['name' => 'Updates', 'href' => '/updates'],
                            ],
                            'legal' => [
                                ['name' => 'Privacy Policy', 'href' => '/privacy-policy'],
                                ['name' => 'Terms of Service', 'href' => '/terms-of-service'],
                                ['name' => 'Cookie Policy', 'href' => '/cookie-policy'],
                                ['name' => 'GDPR Compliance', 'href' => '/gdpr'],
                                ['name' => 'Refund Policy', 'href' => '/refund-policy'],
                            ],
                        ],
                        'social_links' => [
                            ['name' => 'Facebook', 'icon' => 'Facebook', 'href' => 'https://facebook.com/whatsstore'],
                            ['name' => 'Twitter', 'icon' => 'Twitter', 'href' => 'https://twitter.com/whatsstore'],
                            ['name' => 'LinkedIn', 'icon' => 'LinkedIn', 'href' => 'https://linkedin.com/company/whatsstore'],
                            ['name' => 'Instagram', 'icon' => 'Instagram', 'href' => 'https://instagram.com/whatsstore'],
                            ['name' => 'YouTube', 'icon' => 'YouTube', 'href' => 'https://youtube.com/whatsstore'],
                        ],
                        'section_titles' => [
                            'product' => 'Product',
                            'company' => 'Company',
                            'support' => 'Support',
                            'legal' => 'Legal',
                        ],
                    ],
                ],
                'theme' => [
                    'primary_color' => '#10b77f',
                    'secondary_color' => '#ffffff',
                    'accent_color' => '#f7f7f7',
                    'logo_light' => '',
                    'logo_dark' => '',
                    'favicon' => '',
                ],
                'seo' => [
                    'meta_title' => 'WhatsStore - Multi-Store Management Platform',
                    'meta_description' => 'Create and manage multiple online stores with WhatsStore. Powerful e-commerce platform with beautiful themes and advanced features.',
                    'meta_keywords' => 'multi-store platform, online store management, e-commerce solution, store builder, WhatsStore',
                ],
                'custom_css' => '',
                'custom_js' => '',
                'section_order' => ['header', 'hero', 'features', 'screenshots', 'themes', 'why_choose_us', 'about', 'team', 'testimonials', 'active_campaigns', 'plans', 'faq', 'newsletter', 'contact', 'footer'],
                'section_visibility' => [
                    'header' => true,
                    'hero' => true,
                    'features' => true,
                    'screenshots' => true,
                    'why_choose_us' => true,
                    'themes' => true,
                    'about' => true,
                    'team' => true,
                    'testimonials' => true,
                    'active_campaigns' => true,
                    'plans' => true,
                    'faq' => true,
                    'newsletter' => true,
                    'contact' => true,
                    'footer' => true,
                ],
            ];

            $settings = self::create([
                'config_sections' => $defaultConfig,
            ]);
        }

        return $settings;
    }
}
