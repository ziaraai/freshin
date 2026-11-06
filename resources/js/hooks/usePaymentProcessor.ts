import { toast } from '@/components/custom-toast';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PaymentData {
    planId: number;
    billingCycle: string;
    couponCode?: string;
    payment_method_id: string;
    cardholder_name: string;
}

interface UsePaymentProcessorOptions {
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

/** SaaS subscriptions are paid through Stripe; cash on delivery is for store orders. */
export function usePaymentProcessor(options: UsePaymentProcessorOptions = {}) {
    const { t } = useTranslation();
    const [processing, setProcessing] = useState(false);

    const validatePaymentData = (paymentMethod: string, data: PaymentData): boolean => {
        if (paymentMethod !== 'stripe') {
            toast.error(t('Invalid payment method'));
            return false;
        }
        if (!data.payment_method_id || !data.cardholder_name.trim()) {
            toast.error(t('Please fill in all required fields'));
            return false;
        }
        return true;
    };

    const formatPaymentData = (_paymentMethod: string, data: PaymentData) => ({
        plan_id: data.planId,
        billing_cycle: data.billingCycle,
        coupon_code: data.couponCode || '',
        payment_method_id: data.payment_method_id,
        cardholder_name: data.cardholder_name,
    });

    const processPayment = async (paymentMethod: string, data: PaymentData) => {
        if (processing || !validatePaymentData(paymentMethod, data)) return;
        setProcessing(true);
        router.post(route('stripe.payment'), formatPaymentData(paymentMethod, data), {
            onSuccess: (page) => {
                const flash = page.props.flash as { success?: string; error?: string } | undefined;
                if (flash?.error) {
                    toast.error(flash.error);
                    options.onError?.(flash.error);
                    return;
                }
                toast.success(flash?.success || t('Payment successful'));
                options.onSuccess?.();
            },
            onError: (errors) => {
                const message = errors?.message || errors?.error || Object.values(errors)[0] || t('Payment failed');
                toast.error(message);
                options.onError?.(message);
            },
            onFinish: () => setProcessing(false),
        });
    };

    return { processing, processPayment, validatePaymentData, formatPaymentData };
}
