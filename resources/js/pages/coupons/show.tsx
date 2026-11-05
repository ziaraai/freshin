import { PageTemplate } from '@/components/page-template';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { ArrowLeft, Calendar, DollarSign, Users, TrendingUp } from 'lucide-react';
import { usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import UserInitials from '@/components/user-initials';
import { formatCurrency } from '@/utils/currency-helper';
import { getImageUrl } from '@/utils/image-helper';
import BadgeUI from '@/components/badge-ui';
import RandomBadgeUI from '@/components/random-badge-ui';

interface CouponUsage {
  id: number;
  user_name: string;
  user_email: string;
  user_avatars?: string | null;
  order_id: string;
  amount: number;
  discount_amount: number;
  used_at: string;
}

interface CouponData {
  id: number;
  name: string;
  code: string;
  type: string;
  discount_amount: number;
  minimum_spend?: number;
  maximum_spend?: number;
  use_limit_per_coupon?: number;
  use_limit_per_user?: number;
  used_count: number;
  expiry_date?: string;
  status: boolean;
  created_at: string;
  creator?: {
    name: string;
    email: string;
  };
}

export default function CouponDetailsPage() {
  const { t } = useTranslation();
  const { coupon, usage_history } = usePage().props as { coupon: CouponData; usage_history: any };

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Coupons'), href: route('coupons.index') },
    { title: coupon.name }
  ];

  const displayCurrency = (value: number | string) => {
    try {
      return formatCurrency(value);
    } catch {
      return (window as any).appSettings?.formatCurrency?.(value) || `$${parseFloat(String(value) || '0').toFixed(2)}`;
    }
  };

  const formatDisplayDate = (value?: string) => {
    if (!value) return '-';
    if (window.appSettings?.formatDateTime) {
      return window.appSettings.formatDateTime(value, false);
    }
    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return value;
    }
  };

  const usageColumns = [
    {
      key: 'user_name',
      label: t('User'),
      sortable: true,
      render: (_: any, row: CouponUsage) => (
        <div className="flex items-center gap-3">
          {row.user_avatars ? (
            <img
              src={getImageUrl(row.user_avatars)}
              alt={row.user_name}
              className="h-9 w-9 rounded-full object-cover border border-gray-200 dark:border-gray-700"
              onError={(e) => {
                (e.target as HTMLImageElement).src = getImageUrl('/storage/media/avatars/avatar.png');
              }}
            />
          ) : (
            <UserInitials name={row.user_name} />
          )}
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900 dark:text-gray-100">{row.user_name}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{row.user_email}</span>
          </div>
        </div>
      )
    },
    { key: 'order_id', label: t('Order ID'), sortable: true },
    {
      key: 'amount',
      label: t('Order Amount'),
      render: (value: number) => <span className="font-mono">{displayCurrency(value)}</span>
    },
    {
      key: 'discount_amount',
      label: t('Discount Applied'),
      render: (value: number) => <span className="font-mono">{displayCurrency(value)}</span>
    },
    {
      key: 'used_at',
      label: t('Used At'),
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden text-ellipsis text-gray-500 dark:text-gray-400">
          {value && <Calendar className="h-4 w-4" />}
          <span>{formatDisplayDate(value)}</span>
        </div>
      )
    }
  ];

  const formatDiscount = (type: string, amount: number) => {
    return type === 'percentage'
      ? `${amount}%`
      : <span className="font-mono">{displayCurrency(amount)}</span>;
  };

  const getStatusBadge = (status: boolean) => {
    return status ? (
      <BadgeUI className="bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/15 dark:text-green-400 dark:ring-green-500/35">{t('Active')}</BadgeUI>
    ) : (
      <BadgeUI className="bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/15 dark:text-red-400 dark:ring-red-500/35">{t('Inactive')}</BadgeUI>
    );
  };

  const getTypeBadge = (type: string) => {
    const className = type === 'percentage'
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400'
      : 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400';
    const label = type === 'percentage' ? t('Percentage') : t('Flat Amount');
    return <RandomBadgeUI name={label} className="capitalize" />;
  };

  return (
    <PageTemplate
      title={coupon.name}
      breadcrumbs={breadcrumbs}
      description={t("Coupon Details & Usage History")}
      actions={[
        {
          label: t('Back'),
          icon: <ArrowLeft className="h-4 w-4" />,
          variant: 'outline',
          onClick: () => router.get(route('coupons.index'))
        }
      ]}
    >
      <div className="space-y-6">
        {/* Status Badge */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('Coupon Details & Usage History')}</h2>
          {getStatusBadge(coupon.status)}
        </div>

        {/* Coupon Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card className="overflow-hidden dark:bg-gray-900 dark:border-gray-800">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 sm:mb-2 truncate">{t('Discount Value')}</p>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">{formatDiscount(coupon.type, coupon.discount_amount)}</h3>
                </div>
                <div className="shrink-0 rounded-full bg-blue-50 dark:bg-blue-950/50 p-2.5 sm:p-3">
                  <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden dark:bg-gray-900 dark:border-gray-800">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 sm:mb-2 truncate">{t('Times Used')}</p>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                    {coupon.used_count}{coupon.use_limit_per_coupon ? ` / ${coupon.use_limit_per_coupon}` : ''}
                  </h3>
                </div>
                <div className="shrink-0 rounded-full bg-green-50 dark:bg-green-950/50 p-2.5 sm:p-3">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden dark:bg-gray-900 dark:border-gray-800">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 sm:mb-2 truncate">{t('User Limit')}</p>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">{coupon.use_limit_per_user || t('Unlimited')}</h3>
                </div>
                <div className="shrink-0 rounded-full bg-purple-50 dark:bg-purple-950/50 p-2.5 sm:p-3">
                  <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden dark:bg-gray-900 dark:border-gray-800">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 sm:mb-2 truncate">{t('Expires')}</p>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                    {coupon.expiry_date ? formatDisplayDate(coupon.expiry_date) : t('Never')}
                  </h3>
                </div>
                <div className="shrink-0 rounded-full bg-orange-50 dark:bg-orange-950/50 p-2.5 sm:p-3">
                  <DollarSign className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coupon Details */}
        <Card className="overflow-hidden dark:bg-gray-900 dark:border-gray-800">
          <CardContent className="p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">{t('Coupon Information')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('Coupon Code')}</label>
                <p className="mt-1 text-base font-mono bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded break-all">{coupon.code}</p>
              </div>
              {coupon.minimum_spend ? (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('Minimum Spend')}</label>
                  <p className="mt-1 text-base text-gray-900 dark:text-gray-100 font-mono">{displayCurrency(coupon.minimum_spend)}</p>
                </div>
              ) : null}
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('Type')}</label>
                <div className="mt-1">{getTypeBadge(coupon.type)}</div>
              </div>
              {coupon.maximum_spend ? (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('Maximum Spend')}</label>
                  <p className="mt-1 text-base text-gray-900 dark:text-gray-100 font-mono">{displayCurrency(coupon.maximum_spend)}</p>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Usage History */}
        <Card className="overflow-hidden dark:bg-gray-900 dark:border-gray-800">
          <CardContent className="p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('Usage History')}</h2>
            <div className="border rounded-lg overflow-x-auto dark:border-gray-700">
              <Table className="text-left rtl:text-right">
                <TableHeader>
                  <TableRow>
                    {usageColumns.map((column) => (
                      <TableHead key={column.key} className="text-sm font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap text-left rtl:text-right">{column.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usage_history?.data && usage_history.data.length > 0 ? (
                    usage_history.data.map((item: any, index: number) => (
                      <TableRow key={index}>
                        {usageColumns.map((column) => (
                          <TableCell key={column.key} className="text-sm font-medium text-gray-900 dark:text-gray-100 text-left rtl:text-right whitespace-nowrap">
                            {column.render ? column.render(item[column.key], item) : item[column.key]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={usageColumns.length} className="text-center py-8 text-base text-gray-500 dark:text-gray-400">
                        {t('No usage history found')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {usage_history?.last_page > 1 && (
              <div className="mt-4">
                <Pagination
                  from={usage_history.from || 0}
                  to={usage_history.to || 0}
                  total={usage_history.total || 0}
                  currentPage={usage_history.current_page}
                  lastPage={usage_history.last_page}
                  entityName={t('records')}
                  onPageChange={(url) => {
                    if (!url) return;
                    router.get(url, {}, { preserveState: true, preserveScroll: true });
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTemplate>
  );
}

