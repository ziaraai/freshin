export const PAYMENT_METHODS = {
    STRIPE: 'stripe',
    COD: 'cod',
} as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
    stripe: 'Stripe',
    cod: 'Cash on Delivery',
};

export const PAYMENT_METHOD_HELP_URLS = {
    stripe: 'https://dashboard.stripe.com/apikeys',
} as const;

export interface PaymentConfig {
    enabled: boolean;
    key?: string;
}

export interface PaymentFormData {
    planId: number;
    planPrice: number;
    couponCode?: string;
    billingCycle: 'monthly' | 'yearly';
}

export function formatPaymentAmount(amount: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(amount);
}

export function getPaymentMethodIcon(method: PaymentMethod): string {
    return method === 'cod' ? 'banknote' : 'credit-card';
}
