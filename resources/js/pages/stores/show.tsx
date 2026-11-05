import React from 'react';
import { PageTemplate } from '@/components/page-template';
import { ArrowLeft, Edit, Settings, Building2, Globe, Users, BarChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { router } from '@inertiajs/react';
import { formatCurrency } from '@/utils/currency-helper';

export default function StoreView({ store }) {
  const { t } = useTranslation();


  const pageActions = [
    {
      label: t('Edit'),
      icon: <Edit className="h-4 w-4" />,
      variant: 'outline' as const,
      onClick: () => router.visit(route('stores.edit', store.id))
    },
    {
      label: t('Settings'),
      icon: <Settings className="h-4 w-4" />,
      variant: 'default' as const,
      onClick: () => router.visit(route('stores.settings', store.id))
    }
  ];

  return (
    <PageTemplate 
      title={store.name}
      url={`/stores/${store.id}`}
      actions={pageActions}
      backUrl={route('stores.index')}
      breadcrumbs={[
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Store Management'), href: route('stores.index') },
        { title: t('Store Details') }
      ]}
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Store Overview */}
        <Card>
          <CardHeader>
            <CardTitle>{t('Store Overview')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <div className="h-12 w-12 shrink-0 bg-primary/10 rounded-lg flex items-center justify-center sm:h-16 sm:w-16">
                  <Building2 className="h-6 w-6 text-primary sm:h-8 sm:w-8" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-xl font-bold sm:text-2xl">{store.name}</h2>
                    <Badge variant={store.config_status ? 'default' : 'secondary'}>
                      {store.config_status ? t('Active') : t('Inactive')}
                    </Badge>
                  </div>
                  <p className="truncate text-muted-foreground">{store.domain || t('No domain set')}</p>
                </div>
              </div>
              <div className="mt-2 lg:mt-0 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <p>
                  <span className="font-medium text-muted-foreground">{t('Theme')}:</span> {store.theme}
                </p>
                <p>
                  <span className="font-medium text-muted-foreground">{t('Created')}:</span> {new Date(store.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Store Stats */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('Total Products')}</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold sm:text-2xl">{store.products_count || 0}</div>
              <p className="text-xs text-muted-foreground">{t('+12 from last week')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('Total Orders')}</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold sm:text-2xl">{store.orders_count || 0}</div>
              <p className="text-xs text-muted-foreground">{t('+8% this month')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('Total Customers')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold sm:text-2xl">{store.customers_count || 0}</div>
              <p className="text-xs text-muted-foreground">{t('+15% from last month')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('Revenue')}</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold sm:text-2xl font-mono">{formatCurrency(store.revenue || 0)}</div>
              <p className="text-xs text-muted-foreground">{t('+20% from last month')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Store Description */}
        {store.description && (
          <Card>
            <CardHeader>
              <CardTitle>{t('Description')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{store.description}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageTemplate>
  );
}