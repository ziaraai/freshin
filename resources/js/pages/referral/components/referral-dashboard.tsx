import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Copy, Check, Users, DollarSign, TrendingUp, Award, Clock, Mail, Calendar } from 'lucide-react';
import { toast } from '@/components/custom-toast';
import { Link } from '@inertiajs/react';
import UserInitials from '@/components/user-initials';
import { formatCurrency } from '@/utils/currency-helper';
import { getImageUrl } from '@/utils/image-helper';
import { useLayout } from '@/contexts/LayoutContext';

interface ReferralDashboardProps {
  userType: string;
  stats: any;
  referralLink?: string;
  recentReferredUsers?: any[];
  currencySymbol?: string;
}

export default function ReferralDashboard({ userType, stats, referralLink, recentReferredUsers, currencySymbol }: ReferralDashboardProps) {
  const { t } = useTranslation();
  const { position } = useLayout();
  const isRtl = position === 'right' || (typeof document !== 'undefined' && document.documentElement.dir === 'rtl');
  const [copied, setCopied] = useState(false);

  const copyReferralLink = async () => {
    if (referralLink) {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success(t('Referral link copied to clipboard'));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getMonthlyReferralsCount = () => {
    if (!stats.monthlyReferrals) return 0;
    if (typeof stats.monthlyReferrals === 'number') return stats.monthlyReferrals;
    if (typeof stats.monthlyReferrals === 'object') {
      return Object.values(stats.monthlyReferrals).reduce((a: any, b: any) => Number(a) + Number(b), 0);
    }
    return 0;
  };

  const getMonthlyPayoutsTotal = () => {
    if (!stats.monthlyPayouts) return formatCurrency(0);
    if (typeof stats.monthlyPayouts === 'number') return formatCurrency(stats.monthlyPayouts);
    if (typeof stats.monthlyPayouts === 'object') {
      const sum = Object.values(stats.monthlyPayouts).reduce((a: any, b: any) => Number(a) + Number(b), 0);
      return formatCurrency(sum);
    }
    return formatCurrency(0);
  };

  if (userType === 'superadmin') {
    return (
      <div className="space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {([
            { label: t('Total Referral Users'), value: stats.totalReferralUsers ?? 0, icon: Users, iconCls: 'text-blue-600 dark:text-blue-400', blobCls: 'bg-blue-50 dark:bg-blue-900/30', iconBgCls: 'bg-blue-100 dark:bg-blue-900/60' },
            { label: t('Pending Payouts'), value: stats.pendingPayouts ?? 0, icon: Clock, iconCls: 'text-amber-600 dark:text-amber-400', blobCls: 'bg-amber-50 dark:bg-amber-900/30', iconBgCls: 'bg-amber-100 dark:bg-amber-900/60' },
            { label: t('Total Commission Paid'), value: stats.formattedTotalCommissionPaid || formatCurrency(stats.totalCommissionPaid || 0), icon: DollarSign, iconCls: 'text-green-600 dark:text-green-400', blobCls: 'bg-green-50 dark:bg-green-900/30', iconBgCls: 'bg-green-100 dark:bg-green-900/60' },
            { label: t('Active Companies'), value: stats.topCompanies?.length || 0, icon: TrendingUp, iconCls: 'text-purple-600 dark:text-purple-400', blobCls: 'bg-purple-50 dark:bg-purple-900/30', iconBgCls: 'bg-purple-100 dark:bg-purple-900/60' },
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

        {/* Bottom Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <Award className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base font-semibold">{t('Top Referring Companies')}</CardTitle>
                  <CardDescription className="text-xs">{t('Companies with most referrals')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {stats.topCompanies && stats.topCompanies.length > 0 ? (
                <div className="space-y-2">
                  {stats.topCompanies.slice(0, 5).map((company: any) => (
                    <div key={company.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={company.avatar ?? getImageUrl('/storage/media/avatars/avatar.png')}
                            alt={company.name}
                            className="h-9 w-9 rounded-full object-cover shrink-0"
                            onError={(e) => {
                            (e.target as HTMLImageElement).src = getImageUrl('/storage/media/avatars/avatar.png');
                          }}
                          />
                        {/* <div className={company.avatar ? 'hidden' : ''}>
                          <UserInitials name={company.name} />
                        </div> */}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{company.name}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{company.email}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 justify-end">
                          <Users className="h-3.5 w-3.5" />
                          {company.referral_count}
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium font-mono">
                          {company.formatted_total_earned || formatCurrency(company.total_earned || 0)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Award className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium text-muted-foreground">{t('No companies yet')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base font-semibold">{t('Monthly Performance')}</CardTitle>
                  <CardDescription className="text-xs">{t('This year statistics')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-5 sm:pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">{t('Referral Signups')}</p>
                    <Users className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{getMonthlyReferralsCount()}</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3 shrink-0" />
                    {t('Total this year')}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">{t('Payouts Processed')}</p>
                    <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                  </div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 truncate font-mono">
                    {getMonthlyPayoutsTotal()}
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3 shrink-0" />
                    {t('Total this year')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {([
          { label: t('Total Referrals'), value: stats.totalReferrals ?? 0, icon: Users, iconCls: 'text-green-600 dark:text-green-400', blobCls: 'bg-green-50 dark:bg-green-900/30', iconBgCls: 'bg-green-100 dark:bg-green-900/60' },
          { label: t('Referred Users'), value: stats.referredUsersCount || 0, icon: Users, iconCls: 'text-blue-600 dark:text-blue-400', blobCls: 'bg-blue-50 dark:bg-blue-900/30', iconBgCls: 'bg-blue-100 dark:bg-blue-900/60' },
          { label: t('Total Earned'), value: stats.formattedTotalEarned || formatCurrency(stats.totalEarned || 0), icon: DollarSign, iconCls: 'text-amber-600 dark:text-amber-400', blobCls: 'bg-amber-50 dark:bg-amber-900/30', iconBgCls: 'bg-amber-100 dark:bg-amber-900/60' },
          { label: t('Available Balance'), value: stats.formattedAvailableBalance || formatCurrency(stats.availableBalance || 0), icon: Award, iconCls: 'text-purple-600 dark:text-purple-400', blobCls: 'bg-purple-50 dark:bg-purple-900/30', iconBgCls: 'bg-purple-100 dark:bg-purple-900/60' },
        ] as const).map(({ label, value, icon: Icon, iconCls, blobCls, iconBgCls }) => (
          <Card key={label} className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className={`absolute top-0 ${isRtl ? 'left-0 rounded-br-full' : 'right-0 rounded-bl-full'} w-20 h-20 ${blobCls}`} />
            <CardContent className="relative p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</p>
                  <p className="text-xl font-bold font-mono text-gray-900 dark:text-white">{value}</p>
                </div>
                <div className={`relative z-10 shrink-0 ${isRtl ? '-translate-x-1.5' : 'translate-x-1.5'} p-2.5 ${iconBgCls} rounded-xl mt-0.5`}>
                  <Icon className={`h-5 w-5 ${iconCls}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <Copy className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base font-semibold">{t('Your Referral Link')}</CardTitle>
                <CardDescription className="text-xs">{t('Share and earn commissions')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5 sm:pt-6">
            <div className="flex gap-2 min-w-0">
              <Input
                value={referralLink || ''}
                readOnly
                className="flex-1 min-w-0  text-sm"
              />
              <Button
                onClick={copyReferralLink}
                variant="outline"
                size="icon"
                className="shrink-0"
              >
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted/50 rounded-lg">
              {t('Share this link to earn commissions when users sign up and purchase plans')}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base font-semibold">{t('Recent Referred Users')}</CardTitle>
                <CardDescription className="text-xs">{t('Latest referrals')}</CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs cursor-pointer"
              onClick={() => {
                const el = document.getElementById('referred-users');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              {t('View All')}
            </Button>
          </CardHeader>
          <CardContent className="pt-5 sm:pt-6">
            {recentReferredUsers && recentReferredUsers.length > 0 ? (
              <div className="space-y-2">
                {recentReferredUsers.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getImageUrl('/storage/media/avatars/avatar.png');
                          }}
                        />
                      <div className={user.avatar ? 'hidden' : ''}>
                        <UserInitials name={user.name} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{user.name}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {user.plan ? (
                        <Badge variant="default" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 whitespace-nowrap">
                          {user.plan.name}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs whitespace-nowrap">
                          {t('No Plan')}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Users className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium text-muted-foreground mb-1">{t('No referred users yet')}</p>
                <p className="text-xs text-muted-foreground">{t('Share your link to get started')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}