import { PageTemplate } from '@/components/page-template';
import { useTranslation } from 'react-i18next';
import { usePage } from '@inertiajs/react';
import ReferredUsersSection from './components/referred-users-section';

export default function ReferredUsers() {
  const { t } = useTranslation();
  const page = usePage<any>();
  const pageProps = page.props?.props || page.props || {};
  const referredUsers = pageProps.referredUsers;
  const userType = pageProps.userType || 'company';

  return (
    <PageTemplate
      title={t('Referred Users')}
      url="/referral/referred-users"
      breadcrumbs={[
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Referral Program'), href: route('referral.index') },
        { title: t('Referred Users') },
      ]}
      backUrl={route('referral.index')}
    >
      <ReferredUsersSection
        referredUsers={referredUsers}
        userType={userType}
      />
    </PageTemplate>
  );
}
