import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from 'react-i18next';
import { useForm } from '@inertiajs/react';
import { toast } from '@/components/custom-toast';
import InputError from '@/components/input-error';

interface ReferralSettingsProps {
  settings: any;
  currencySymbol?: string;
  globalSettings?: any;
}

export default function ReferralSettings({ settings, currencySymbol, globalSettings }: ReferralSettingsProps) {
  const { t } = useTranslation();
  const { data, setData, post, processing, errors } = useForm({
    is_enabled: settings?.is_enabled ?? false,
    commission_percentage: settings?.commission_percentage ?? 0,
    threshold_amount: settings?.threshold_amount ?? 0,
    guidelines: settings?.guidelines || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!globalSettings?.is_demo) {
      toast.loading(t('Updating referral settings...'));
    }

    post(route('referral.settings.update'), {
      onSuccess: (page: any) => {
        if (!globalSettings?.is_demo) {
          toast.dismiss();
        }
        if (page?.props?.flash?.success) {
          toast.success(t(page.props.flash.success));
        } else if (page?.props?.flash?.error) {
          toast.error(t(page.props.flash.error));
        } else {
          toast.success(t('Referral settings updated successfully'));
        }
      },
      onError: (errs) => {
        if (!globalSettings?.is_demo) {
          toast.dismiss();
        }
        if (typeof errs === 'string') {
          toast.error(t(errs));
        } else {
          toast.error(t('Failed to update referral settings'));
        }
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{t('Referral Program Settings')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="is_enabled"
              checked={data.is_enabled}
              onCheckedChange={(checked) => setData('is_enabled', checked)}
            />
            <Label htmlFor="is_enabled" className="cursor-pointer">{t('Enable Referral Program')}</Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="commission_percentage">{t('Commission Percentage (%)')}</Label>
              <Input
                id="commission_percentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={data.commission_percentage}
                onChange={(e) => setData('commission_percentage', e.target.value)}
                className="mt-1"
                placeholder={t('enter commission percentage')}
              />
              <InputError message={errors.commission_percentage} />
            </div>

            <div>
              <Label htmlFor="threshold_amount">{t('Minimum Threshold Amount')}</Label>
              <Input
                id="threshold_amount"
                type="number"
                step="0.01"
                min="0"
                value={data.threshold_amount}
                onChange={(e) => setData('threshold_amount', e.target.value)}
                className="mt-1"
                placeholder={t('e.g. 50.00')}
              />
              <InputError message={errors.threshold_amount} />
            </div>
          </div>

          <div>
            <Label htmlFor="guidelines">{t('Referral Guidelines')}</Label>
            <Textarea
              id="guidelines"
              value={data.guidelines}
              onChange={(e) => setData('guidelines', e.target.value)}
              placeholder={t('Enter referral program guidelines and terms...')}
              rows={6}
              className="mt-1"
            />
            <InputError message={errors.guidelines} />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={processing}>
              {processing ? t('Saving...') : t('Save Settings')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}