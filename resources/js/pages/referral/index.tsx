import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type NavItem } from '@/types';
import { useEffect, useRef, useState } from 'react';
import { BarChart3, DollarSign, Users, Settings as SettingsIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePage, router } from '@inertiajs/react';
import ReferralDashboard from './components/referral-dashboard';
import ReferredUsersSection from './components/referred-users-section';
import PayoutRequests from './components/payout-requests';
import ReferralSettings from './components/referral-settings';
import { hasPermission } from '@/utils/permissions';

import { ScrollArea } from '@/components/ui/scroll-area';
import { useLayout } from '@/contexts/LayoutContext';

export default function Referral() {
  const { t } = useTranslation();
  const { props } = usePage();
  const { position } = useLayout();
  const { userType, settings, stats, payoutRequests, referralLink, formattedSettings, globalSettings } = props as any;
  const [activeSection, setActiveSection] = useState('dashboard');

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Referral Program') },
  ];

  const canManagePayout = hasPermission('manage-payout-referral') || userType === 'superadmin' || userType === 'company';

  const sidebarNavItems: NavItem[] = [
    {
      title: t('Dashboard'),
      href: '#dashboard',
      icon: <BarChart3 className="h-4 w-4 mr-2" />,
    },
    {
      title: t('Referred Users'),
      href: '#referred-users',
      icon: <Users className="h-4 w-4 mr-2" />,
    },
    ...(canManagePayout ? [{
      title: t('Payout Requests'),
      href: '#payout-requests',
      icon: <DollarSign className="h-4 w-4 mr-2" />,
    }] : []),
    ...(userType === 'superadmin' ? [{
      title: t('Settings'),
      href: '#settings',
      icon: <SettingsIcon className="h-4 w-4 mr-2" />,
    }] : []),
  ];

  const dashboardRef = useRef<HTMLDivElement>(null);
  const referredUsersRef = useRef<HTMLDivElement>(null);
  const payoutRequestsRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;

      const dashboardPosition = dashboardRef.current?.offsetTop || 0;
      const referredUsersPosition = referredUsersRef.current?.offsetTop || 0;
      const payoutRequestsPosition = payoutRequestsRef.current?.offsetTop || 0;
      const settingsPosition = settingsRef.current?.offsetTop || 0;

      if (userType === 'superadmin' && settingsPosition > 0 && scrollPosition >= settingsPosition) {
        setActiveSection('settings');
      } else if (payoutRequestsPosition > 0 && scrollPosition >= payoutRequestsPosition) {
        setActiveSection('payout-requests');
      } else if (referredUsersPosition > 0 && scrollPosition >= referredUsersPosition) {
        setActiveSection('referred-users');
      } else {
        setActiveSection('dashboard');
      }
    };

    window.addEventListener('scroll', handleScroll);

    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const element = document.getElementById(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        setActiveSection(hash);
      }
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [userType]);

  const handleNavClick = (href: string) => {
    if (href.startsWith('#')) {
      const id = href.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        setActiveSection(id);
      }
    } else {
      router.visit(href);
    }
  };

  return (
    <PageTemplate
      title={t('Referral Program')}
      url="/referral"
      description={t('Manage your referral program.')}
      breadcrumbs={breadcrumbs}
    >
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="xl:w-64 flex-shrink-0">
          <div className="sticky top-20">
            <ScrollArea dir={position === 'right' ? 'rtl' : 'ltr'}>
              <div className="pr-4 space-y-1 bg-white dark:bg-gray-900 p-3 rounded-lg border shadow justify-center flex flex-col gap-2">
                {sidebarNavItems.map((item) => (
                  <Button
                    key={item.href}
                    variant="ghost"
                    className={cn('w-full justify-start text-sm', {
                      'bg-muted font-semibold': activeSection === item.href.replace('#', ''),
                    })}
                    onClick={() => handleNavClick(item.href)}
                  >
                    {item.icon}
                    {item.title}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Content sections */}
        <div className="flex-1 min-w-0">
          <section id="dashboard" ref={dashboardRef} className="mb-8">
            <h2 className="text-xl font-semibold mb-4">{t('Dashboard')}</h2>
            <ReferralDashboard
              userType={userType}
              stats={stats}
              referralLink={referralLink}
              recentReferredUsers={props.recentReferredUsers}
            />
          </section>

          <section id="referred-users" ref={referredUsersRef} className="mb-8">
            <h2 className="text-xl font-semibold mb-4">{t('Referred Users')}</h2>
            <ReferredUsersSection
              referredUsers={props.referredUsers}
              userType={userType}
            />
          </section>

          {canManagePayout && (
            <section id="payout-requests" ref={payoutRequestsRef} className="mb-8">
              <h2 className="text-xl font-semibold mb-4">{t('Payout Requests')}</h2>
              <PayoutRequests
                userType={userType}
                payoutRequests={payoutRequests}
                settings={settings}
                stats={stats}
                formattedSettings={formattedSettings}
              />
            </section>
          )}

          {userType === 'superadmin' && (
            <section id="settings" ref={settingsRef} className="mb-8">
              <h2 className="text-xl font-semibold mb-4">{t('Settings')}</h2>
              <ReferralSettings settings={settings} globalSettings={globalSettings} />
            </section>
          )}
        </div>
      </div>
    </PageTemplate>
  );
}