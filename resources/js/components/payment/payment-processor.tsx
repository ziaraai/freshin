import { toast } from '@/components/custom-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Tag } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StripePaymentForm } from './stripe-payment-form';

interface PaymentMethod {
    id: string;
    name: string;
    icon: React.ReactNode;
    enabled: boolean;
}

interface PaymentProcessorProps {
    plan: {
        id: number;
        name: string;
        price: string | number;
        formatted_price?: string;
        duration: string;
        paymentMethods?: any;
    };
    billingCycle: 'monthly' | 'yearly';
    paymentMethods: PaymentMethod[];
    onSuccess: () => void;
    onCancel: () => void;
}

export function PaymentProcessor({ plan, billingCycle, paymentMethods, onSuccess, onCancel }: PaymentProcessorProps) {
    const { t } = useTranslation();
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('stripe');
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [couponLoading, setCouponLoading] = useState(false);
    const [showPaymentForm, setShowPaymentForm] = useState(false);

    const originalPrice =
        billingCycle === 'yearly' && (plan as any).yearly_price
            ? Number((plan as any).yearly_price)
            : billingCycle === 'monthly' && (plan as any).monthly_price
              ? Number((plan as any).monthly_price)
              : Number(plan.price);
    const discountAmount = appliedCoupon
        ? appliedCoupon.type === 'percentage'
            ? (originalPrice * Number(appliedCoupon.value)) / 100
            : Number(appliedCoupon.value)
        : 0;
    const finalPrice = Math.max(0, originalPrice - discountAmount);

    // Helper function to format currency consistently
    const formatPrice = (amount: number) => {
        if (plan.formatted_price) {
            // Extract currency symbol and format from formatted_price
            const formattedOriginal = plan.formatted_price;
            const symbol = formattedOriginal.replace(/[\d.,\s]/g, '');
            const isSymbolBefore = formattedOriginal.indexOf(symbol) < formattedOriginal.search(/\d/);
            return isSymbolBefore ? `${symbol}${amount.toFixed(2)}` : `${amount.toFixed(2)}${symbol}`;
        }
        return `$${amount.toFixed(2)}`; // Fallback
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            toast.error(t('Please enter a coupon code'));
            return;
        }

        setCouponLoading(true);
        try {
            const response = await fetch(route('coupons.validate'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    coupon_code: couponCode,
                    plan_id: plan.id,
                    amount: originalPrice,
                }),
            });

            const data = await response.json();

            if (response.ok && data.valid) {
                setAppliedCoupon(data.coupon);
                toast.success(t('Coupon applied successfully'));
            } else {
                toast.error(data.message || t('Invalid coupon code'));
                setAppliedCoupon(null);
            }
        } catch (error) {
            toast.error(t('Failed to validate coupon'));
            setAppliedCoupon(null);
        } finally {
            setCouponLoading(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
    };

    const handlePayNow = () => {
        if (!enabledPaymentMethods.some((method) => method.id === 'stripe')) {
            toast.error(t('Stripe payments are not available'));
            return;
        }
        setShowPaymentForm(true);
    };

    const handlePaymentCancel = () => {
        setShowPaymentForm(false);
        setSelectedPaymentMethod('stripe');
    };

    const enabledPaymentMethods = paymentMethods.filter((method) => method.id === 'stripe' && method.enabled);

    const renderPaymentForm = () => {
        const commonProps = {
            planId: plan.id,
            couponCode,
            billingCycle,
            finalPrice,
            onSuccess,
            onCancel: handlePaymentCancel,
        };

        if (!enabledPaymentMethods.some((method) => method.id === 'stripe')) return null;
        return <StripePaymentForm {...commonProps} stripeKey={plan.paymentMethods?.stripe_key || ''} />;
    };

    if (showPaymentForm) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-medium">{t('Complete Payment')}</h3>
                    <Button variant="outline" size="sm" onClick={handlePaymentCancel}>
                        {t('Back')}
                    </Button>
                </div>
                {renderPaymentForm()}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Plan Summary */}
            <Card>
                <CardContent className="!p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium">{plan.name}</h3>
                            <p className="text-muted-foreground text-sm">
                                {t(billingCycle)} {t('subscription')}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="font-mono text-lg font-bold">{plan.formatted_price || plan.price}</div>
                            <div className="text-muted-foreground text-sm">/{t(plan.duration.toLowerCase())}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Payment Methods */}
            <div className="space-y-3">
                <Label>{t('Select Payment Method')}</Label>
                {enabledPaymentMethods.length === 0 ? (
                    <p className="text-muted-foreground text-sm">{t('No payment methods available')}</p>
                ) : (
                    <div className="space-y-2">
                        {enabledPaymentMethods.map((method, index) => (
                            <Card
                                key={`${method.id}-${index}`}
                                className={`cursor-pointer transition-colors ${
                                    selectedPaymentMethod === method.id ? 'border-primary bg-primary/5' : 'hover:border-gray-300'
                                }`}
                                onClick={() => setSelectedPaymentMethod(method.id)}
                            >
                                <CardContent className="!p-3">
                                    <div className="flex items-center gap-3">
                                        <div className="text-primary">{method.icon}</div>
                                        <span className="font-medium">{method.name}</span>
                                        {selectedPaymentMethod === method.id && (
                                            <Badge variant="secondary" className="ml-auto">
                                                {t('Selected')}
                                            </Badge>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Coupon Code */}
            <div className="space-y-3">
                <Label htmlFor="coupon">
                    {t('Coupon Code')} ({t('Optional')})
                </Label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Input
                            id="coupon"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            placeholder={t('Enter coupon code')}
                            className="pr-10"
                            disabled={!!appliedCoupon}
                        />
                        <Tag className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform" />
                    </div>
                    {!appliedCoupon ? (
                        <Button type="button" variant="outline" onClick={handleApplyCoupon} disabled={!couponCode.trim() || couponLoading}>
                            {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('Apply')}
                        </Button>
                    ) : (
                        <Button type="button" variant="outline" onClick={handleRemoveCoupon}>
                            {t('Remove')}
                        </Button>
                    )}
                </div>

                {appliedCoupon && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-green-700">
                                {t('Coupon Applied')}: {appliedCoupon.code}
                            </span>
                            <span className="font-mono text-green-600">
                                -{appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}%` : `$${appliedCoupon.value}`}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Price Summary */}
            <Card>
                <CardContent className="!p-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>{t('Subtotal')}</span>
                            <span className="font-mono">{formatPrice(originalPrice)}</span>
                        </div>
                        {appliedCoupon && (
                            <div className="flex justify-between text-sm text-green-600">
                                <span>{t('Discount')}</span>
                                <span className="font-mono">-{formatPrice(discountAmount)}</span>
                            </div>
                        )}
                        <div className="border-t pt-2">
                            <div className="flex justify-between font-medium">
                                <span>{t('Total')}</span>
                                <span className="font-mono">{formatPrice(finalPrice)}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
                <Button variant="outline" onClick={onCancel} className="flex-1">
                    {t('Cancel')}
                </Button>
                <Button onClick={handlePayNow} disabled={enabledPaymentMethods.length === 0} className="flex-1">
                    {t('Pay')} <span className="ml-1 font-mono">{formatPrice(finalPrice)}</span>
                </Button>
            </div>
        </div>
    );
}
