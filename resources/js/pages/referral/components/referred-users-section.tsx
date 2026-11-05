import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { useTranslation } from 'react-i18next';
import { router } from '@inertiajs/react';
import { Users, Calendar, DollarSign, CheckCircle2 } from 'lucide-react';
import UserInitials from '@/components/user-initials';
import { formatCurrency } from '@/utils/currency-helper';
import { getImageUrl } from '@/utils/image-helper';
import BadgeUI from '@/components/badge-ui';
import { useLayout } from '@/contexts/LayoutContext';

interface ReferredUser {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  created_at: string;
  plan?: {
    id: number;
    name: string;
    price: number;
    yearly_price?: number;
  };
  plan_orders?: Array<{
    id: number;
    billing_cycle: string;
    final_price: number;
    formatted_final_price?: string;
  }>;
  referrals?: Array<{
    id: number;
    amount: number;
    formatted_amount?: string;
    commission_percentage: number;
    created_at: string;
  }>;
}

interface ReferredUsersSectionProps {
  referredUsers?: {
    data: ReferredUser[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: any[];
  };
  userType: string;
  currencySymbol?: string;
}

export default function ReferredUsersSection({
  referredUsers: initialReferredUsers,
  userType,
  currencySymbol,
}: ReferredUsersSectionProps) {
  const { t } = useTranslation();
  const { position } = useLayout();
  const isRtl = position === 'right' || (typeof document !== 'undefined' && document.documentElement.dir === 'rtl');
  const referredUsers = initialReferredUsers || {
    data: [],
    total: 0,
    from: 0,
    to: 0,
    links: [],
    current_page: 1,
    last_page: 1,
  };

  const getTotalCommission = (user: ReferredUser) => {
    return user.referrals?.reduce((total, referral) => total + (Number(referral.amount) || 0), 0) || 0;
  };

  const getTotalCommissionAll = () => {
    return referredUsers.data.reduce((total, user) => total + getTotalCommission(user), 0) || 0;
  };

  const getPlanDisplayInfo = (user: ReferredUser) => {
    if (!user.plan) return null;

    const latestOrder = user.plan_orders?.[0];

    if (latestOrder) {
      const isYearly = latestOrder.billing_cycle === 'yearly';
      return {
        name: user.plan.name,
        price: latestOrder.formatted_final_price || formatCurrency(latestOrder.final_price),
        cycle: isYearly ? 'year' : 'month',
      };
    }

    return {
      name: user.plan.name,
      price: formatCurrency(user.plan.price),
      cycle: 'month',
    };
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {([
          { label: t('Total Referred Users'), value: referredUsers.total, icon: Users, iconCls: 'text-green-600 dark:text-green-400', blobCls: 'bg-green-50 dark:bg-green-900/30', iconBgCls: 'bg-green-100 dark:bg-green-900/60' },
          { label: t('Users with Plans'), value: referredUsers.data.filter((user) => user.plan).length, icon: CheckCircle2, iconCls: 'text-blue-600 dark:text-blue-400', blobCls: 'bg-blue-50 dark:bg-blue-900/30', iconBgCls: 'bg-blue-100 dark:bg-blue-900/60' },
          { label: t('Total Commission Earned'), value: formatCurrency(getTotalCommissionAll()), icon: DollarSign, iconCls: 'text-amber-600 dark:text-amber-400', blobCls: 'bg-amber-50 dark:bg-amber-900/30', iconBgCls: 'bg-amber-100 dark:bg-amber-900/60' },
        ] as const).map(({ label, value, icon: Icon, iconCls, blobCls, iconBgCls }) => (
          <Card key={label} className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className={`absolute top-0 ${isRtl ? 'left-0 rounded-br-full' : 'right-0 rounded-bl-full'} w-20 h-20 ${blobCls}`} />
            <CardContent className="relative p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</p>
                  <p className="text-xl font-mono font-bold text-gray-900 dark:text-white">{value}</p>
                </div>
                <div className={`relative z-10 shrink-0 ${isRtl ? '-translate-x-1.5' : 'translate-x-1.5'} p-2.5 ${iconBgCls} rounded-xl mt-0.5`}>
                  <Icon className={`h-5 w-5 ${iconCls}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">{t('Referred Users List')}</CardTitle>
        </CardHeader>
        <CardContent>
          {referredUsers.data.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-base font-semibold text-muted-foreground mb-2">{t('No referred users yet')}</p>
              <p className="text-sm text-muted-foreground">
                {userType === 'superadmin'
                  ? t('No users have registered using referral codes yet.')
                  : t('Share your referral link to start earning commissions.')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {referredUsers.data.map((user) => (
                <div key={user.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="h-12 w-12 rounded-full object-cover flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getImageUrl('/storage/media/avatars/avatar.png');
                          }}
                        />
                      ) : (
                        <img
                          src={getImageUrl('/storage/media/avatars/avatar.png')}
                          alt={user.name}
                          className="h-12 w-12 rounded-full object-cover flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getImageUrl('/storage/media/avatars/avatar.png');
                          }}
                        />
                      )}
                        
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{user.name}</p>
                        <p className="text-sm text-muted-foreground truncate mb-1">{user.email}</p>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-xs text-muted-foreground">
                            {t('Registered')}{' '}
                            {window.appSettings?.formatDateTime?.(user.created_at, false) ||
                              new Date(user.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6 shrink-0 sm:flex-col sm:items-end sm:gap-2">
                      <div className="text-left sm:text-right">
                        {(() => {
                          const planInfo = getPlanDisplayInfo(user);
                          return planInfo ? (
                            <div>
                              <BadgeUI className="bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/15 dark:text-blue-400 dark:ring-blue-500/35 mb-1.5">
                                {planInfo.name}
                              </BadgeUI>
                              <p className="text-sm text-muted-foreground">
                                <span className="font-mono">{planInfo.price}</span>/{t(planInfo.cycle)}
                              </p>
                            </div>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                              {t('No Plan')}
                            </span>
                          );
                        })()}
                      </div>

                      {getTotalCommission(user) > 0 && (
                        <div className="text-left sm:text-right">
                          <p className="text-sm font-semibold text-green-600 font-mono">
                            +{formatCurrency(getTotalCommission(user))}
                          </p>
                          <p className="text-xs text-muted-foreground">{t('Commission')}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {user.referrals && user.referrals.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-semibold mb-2">{t('Commission History')}</p>
                      <div className="space-y-2">
                        {user.referrals.map((referral) => (
                          <div key={referral.id} className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              {referral.commission_percentage}% {t('commission')}
                            </span>
                            <span className="text-sm font-semibold text-green-600 font-mono">
                              +{referral.formatted_amount || formatCurrency(referral.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {referredUsers.last_page > 1 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden border">
          <Pagination
            from={referredUsers.from}
            to={referredUsers.to}
            total={referredUsers.total}
            links={referredUsers.links}
            currentPage={referredUsers.current_page}
            lastPage={referredUsers.last_page}
            entityName={t('users')}
            hidePerPage
            onPageChange={(url) => {
              router.visit(url, {
                preserveState: true,
                preserveScroll: true,
                only: ['referredUsers'],
              });
            }}
          />
        </div>
      )}
    </div>
  );
}
