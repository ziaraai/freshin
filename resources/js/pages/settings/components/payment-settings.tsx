import { toast } from '@/components/custom-toast';
import { PaymentInputField } from '@/components/payment/payment-input-field';
import { PaymentMethodCard } from '@/components/payment/payment-method-card';
import { SettingsSection } from '@/components/settings-section';
import { Button } from '@/components/ui/button';
import { useForm, usePage } from '@inertiajs/react';
import { Banknote, CreditCard, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { route } from 'ziggy-js';

type PaymentSettingsForm = {
    is_stripe_enabled: boolean;
    stripe_key: string;
    stripe_secret: string;
    is_cod_enabled: boolean;
};

interface PaymentSettingsProps {
    settings?: Partial<Record<keyof PaymentSettingsForm, string | boolean | number>>;
}

const isEnabled = (value: string | boolean | number | undefined) => value === true || value === '1' || value === 1 || value === 'true';

export default function PaymentSettings({ settings = {} }: PaymentSettingsProps) {
    const { t } = useTranslation();
    const { auth } = usePage().props as { auth?: { user?: { type?: string; created_by?: number } } };
    const isStore = auth?.user?.type === 'company' || (auth?.user?.type !== 'superadmin' && !!auth?.user?.created_by);
    const secretSaved = settings.stripe_secret === '********';
    const { data, setData, post, transform, processing, errors } = useForm<PaymentSettingsForm>({
        is_stripe_enabled: isEnabled(settings.is_stripe_enabled),
        stripe_key: typeof settings.stripe_key === 'string' ? settings.stripe_key : '',
        stripe_secret: '',
        is_cod_enabled: isEnabled(settings.is_cod_enabled),
    });

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        transform((values) =>
            isStore
                ? values
                : {
                      is_stripe_enabled: values.is_stripe_enabled,
                      stripe_key: values.stripe_key,
                      stripe_secret: values.stripe_secret,
                  },
        );
        post(route('payment.settings'), {
            preserveScroll: true,
            onSuccess: (page) => {
                const flash = page.props.flash as { success?: string; error?: string } | undefined;
                if (flash?.error) {
                    toast.error(t(flash.error));
                } else {
                    setData('stripe_secret', '');
                    toast.success(t(flash?.success || 'Payment settings updated successfully.'));
                }
            },
            onError: () => toast.error(t('Failed to update payment settings')),
        });
    };

    return (
        <SettingsSection
            title={t('Payment Settings')}
            description={isStore ? t('Accept card payments with Stripe or cash on delivery.') : t('Configure Stripe for subscription payments.')}
            action={
                <Button type="submit" form="payment-settings-form" size="sm" disabled={processing}>
                    <Save className="mr-2 h-4 w-4" />
                    {processing ? t('Saving...') : t('Save Changes')}
                </Button>
            }
        >
            <form id="payment-settings-form" onSubmit={handleSubmit} className="space-y-6">
                <PaymentMethodCard
                    title={t('Stripe')}
                    icon={<CreditCard className="h-5 w-5" />}
                    enabled={data.is_stripe_enabled}
                    onToggle={(enabled) => setData('is_stripe_enabled', enabled)}
                    helpUrl="https://dashboard.stripe.com/apikeys"
                    helpText={t('Get your Stripe API keys from your')}
                >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <PaymentInputField
                            id="stripe_key"
                            label={t('Publishable Key')}
                            value={data.stripe_key}
                            onChange={(value) => setData('stripe_key', value)}
                            placeholder="pk_test_..."
                            error={errors.stripe_key}
                        />
                        <PaymentInputField
                            id="stripe_secret"
                            label={t('Secret Key')}
                            value={data.stripe_secret}
                            onChange={(value) => setData('stripe_secret', value)}
                            placeholder={secretSaved ? t('Saved — leave blank to keep') : 'sk_test_...'}
                            isSecret
                            error={errors.stripe_secret}
                        />
                    </div>
                    <p className="text-muted-foreground text-sm">
                        {t(
                            'Use matching test keys to test payments, or matching live keys to accept real payments. Leave the secret key blank to keep the saved key.',
                        )}
                    </p>
                </PaymentMethodCard>
                {errors.is_stripe_enabled && (
                    <p role="alert" className="text-destructive text-sm">
                        {errors.is_stripe_enabled}
                    </p>
                )}
                {isStore && (
                    <PaymentMethodCard
                        title={t('Cash on Delivery')}
                        icon={<Banknote className="h-5 w-5" />}
                        enabled={data.is_cod_enabled}
                        onToggle={(enabled) => setData('is_cod_enabled', enabled)}
                    >
                        <p className="text-muted-foreground text-sm">
                            {t('Customers pay when their meals are delivered. These orders remain unpaid until payment is collected.')}
                        </p>
                    </PaymentMethodCard>
                )}
                {errors.is_cod_enabled && (
                    <p role="alert" className="text-destructive text-sm">
                        {errors.is_cod_enabled}
                    </p>
                )}
            </form>
        </SettingsSection>
    );
}
