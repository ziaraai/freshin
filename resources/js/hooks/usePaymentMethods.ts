import { useEffect, useState } from 'react';

interface PaymentMethodConfig {
    enabled: boolean;
    key?: string;
}

type PaymentMethods = Partial<Record<'stripe' | 'cod', PaymentMethodConfig>>;

export function usePaymentMethods() {
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethods>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPaymentMethods = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(route('payment.enabled-methods'), { headers: { Accept: 'application/json' } });
            if (!response.ok) throw new Error('Failed to fetch payment methods');
            const data = await response.json();
            const supported: PaymentMethods = {};
            if (data.stripe) supported.stripe = { enabled: data.stripe.enabled === true, key: data.stripe.key };
            if (data.cod) supported.cod = { enabled: data.cod.enabled === true };
            setPaymentMethods(supported);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to fetch payment methods');
            setPaymentMethods({});
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPaymentMethods();
    }, []);

    const getEnabledMethods = () =>
        Object.entries(paymentMethods)
            .filter(([, config]) => config.enabled)
            .map(([method, config]) => ({ method, config }));
    const getMethodConfig = (method: string) => (method === 'stripe' || method === 'cod' ? paymentMethods[method] || null : null);
    const isMethodEnabled = (method: string) => getMethodConfig(method)?.enabled || false;

    return { paymentMethods, loading, error, refetch: fetchPaymentMethods, getEnabledMethods, isMethodEnabled, getMethodConfig };
}
