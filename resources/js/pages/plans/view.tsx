import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Calendar, FileText, CreditCard, User, Tag, Download } from 'lucide-react';
import { useLayout } from '@/contexts/LayoutContext';
import { formatCurrency } from '@/utils/currency-helper';
import { getImageUrl } from '@/utils/image-helper';

interface ViewProps {
    record: any;
}

export default function View({ record }: ViewProps) {
    const { t } = useTranslation();
    const { isRtl, effectivePosition, position } = useLayout();
    const isRtlMode = isRtl || effectivePosition === 'right' || position === 'right';

    if (!record) return null;

    const fmt = (v: any, formatted?: string) => {
        if (formatted) return formatted;
        if (typeof (window as any).appSettings?.formatCurrency === 'function') {
            return (window as any).appSettings.formatCurrency(parseFloat(v));
        }
        if (v !== undefined && v !== null && !isNaN(Number(v))) {
            return formatCurrency(v);
        }
        return v || '-';
    };

    const statusColors: Record<string, string> = {
        pending: 'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400 ring-yellow-600/20',
        approved: 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 ring-green-600/20',
        rejected: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 ring-red-600/20',
        cancelled: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 ring-orange-600/20',
    };

    const receiptUrl = record.receipt ? getImageUrl('/storage/' + record.receipt) : null;

    const formatDate = (dateStr: any) => {
        if (!dateStr) return '-';
        if (typeof window.appSettings?.formatDateTime === 'function') {
            return window.appSettings.formatDateTime(dateStr, false);
        }
        try {
            return new Date(dateStr).toLocaleDateString([], { dateStyle: 'long' });
        } catch {
            return dateStr;
        }
    };

    return (
        <DialogContent
            dir={isRtlMode ? 'rtl' : 'ltr'}
            className="w-[calc(100%-2rem)] sm:max-w-lg md:max-w-xl max-h-[90vh] p-0 rounded-lg overflow-hidden flex flex-col"
            onOpenAutoFocus={(e) => e.preventDefault()}
        >
            <DialogHeader className="px-6 py-4 border-b shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg shrink-0">
                        <ShoppingCart className="h-5 w-5 text-primary" />
                    </div>
                    <DialogTitle className="text-lg font-semibold text-foreground truncate">{t('Plan Order Details')}</DialogTitle>
                </div>
            </DialogHeader>

            <div className="max-h-[calc(90vh-4.5rem)] overflow-y-auto px-6 py-5 space-y-4" dir={isRtlMode ? 'rtl' : 'ltr'}>
                    {/* Row 1: Order Number & Order Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="min-w-0">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                <ShoppingCart className="h-3.5 w-3.5 shrink-0" />
                                {t('Order Number')}
                            </label>
                            <p className="text-sm font-medium text-foreground break-words">{record.order_number || '-'}</p>
                        </div>
                        <div className="min-w-0">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                <Calendar className="h-3.5 w-3.5 shrink-0" />
                                {t('Order Date')}
                            </label>
                            <p className="text-sm font-medium text-foreground">
                                {formatDate(record.ordered_at)}
                            </p>
                        </div>
                    </div>

                    {/* Row 2: Status & Payment Method */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="min-w-0">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                <FileText className="h-3.5 w-3.5 shrink-0" />
                                {t('Status')}
                            </label>
                            <div>
                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset capitalize ${statusColors[record.status] || 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 ring-gray-600/20'}`}>
                                    {t(record.status)}
                                </span>
                            </div>
                        </div>
                        <div className="min-w-0">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                <CreditCard className="h-3.5 w-3.5 shrink-0" />
                                {t('Payment Method')}
                            </label>
                            <p className="text-sm font-medium text-foreground capitalize">{record.payment_method || '-'}</p>
                        </div>
                    </div>

                    {/* Row 3: User & Plan */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="min-w-0">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                <User className="h-3.5 w-3.5 shrink-0" />
                                {t('User')}
                            </label>
                            <p className="text-sm font-medium text-foreground break-words">{record.user?.name || '-'}</p>
                            {record.user?.email && (
                                <p className="text-xs text-muted-foreground break-all">{record.user.email}</p>
                            )}
                        </div>
                        <div className="min-w-0">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                <Tag className="h-3.5 w-3.5 shrink-0" />
                                {t('Plan')}
                            </label>
                            <div>
                                <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-950/40 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-400 ring-1 ring-inset ring-blue-600/20">
                                    {record.plan?.name || '-'}
                                </span>
                            </div>
                            {record.billing_cycle && (
                                <p className="text-xs text-muted-foreground mt-1 capitalize">{record.billing_cycle}</p>
                            )}
                        </div>
                    </div>

                    {/* Row 4: Original Price & Discount */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="min-w-0">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                <CreditCard className="h-3.5 w-3.5 shrink-0" />
                                {t('Original Price')}
                            </label>
                            <p className="text-sm font-medium text-foreground font-mono">{fmt(record.original_price, record.formatted_original_price)}</p>
                        </div>
                        <div className="min-w-0">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                <Tag className="h-3.5 w-3.5 shrink-0" />
                                {t('Discount')}
                            </label>
                            <p className="text-sm font-medium text-foreground font-mono">
                                {record.discount_amount > 0 ? `${fmt(record.discount_amount, record.formatted_discount_amount)}` : '-'}
                            </p>
                        </div>
                    </div>

                    {/* Row 5: Final Price & Coupon Code / Payment Receipt */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="min-w-0">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                <CreditCard className="h-3.5 w-3.5 shrink-0" />
                                {t('Final Price')}
                            </label>
                            <p className="text-sm font-medium text-foreground font-mono">{fmt(record.final_price, record.formatted_final_price)}</p>
                        </div>
                        {record.coupon_code ? (
                            <div className="min-w-0">
                                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                    <Tag className="h-3.5 w-3.5 shrink-0" />
                                    {t('Coupon Code')}
                                </label>
                                <p className="text-sm font-medium text-foreground">{record.coupon_code}</p>
                            </div>
                        ) : receiptUrl ? (
                            <div className="min-w-0">
                                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                    <Download className="h-3.5 w-3.5 shrink-0" />
                                    {t('Payment Receipt')}
                                </label>
                                <div className="mt-1">
                                    <a href={receiptUrl} target="_blank" rel="noopener noreferrer" download>
                                        <Button variant="default" size="sm">
                                            {t('Download Receipt')}
                                        </Button>
                                    </a>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* Row 6: Receipt (if coupon code also exists) */}
                    {record.coupon_code && receiptUrl && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="min-w-0">
                                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                    <Download className="h-3.5 w-3.5 shrink-0" />
                                    {t('Payment Receipt')}
                                </label>
                                <div className="mt-1">
                                    <a href={receiptUrl} target="_blank" rel="noopener noreferrer" download>
                                        <Button variant="outline" size="sm">
                                            {t('Download Receipt')}
                                        </Button>
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notes if present */}
                    {record.notes && (
                        <div className="space-y-1 pt-2 border-t">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                <FileText className="h-3.5 w-3.5 shrink-0" />
                                {t('Notes / Reason')}
                            </label>
                            <p className="text-sm text-foreground bg-gray-50 dark:bg-gray-800 p-2.5 rounded-md italic">
                                {record.notes}
                            </p>
                        </div>
                    )}
                </div>
        </DialogContent>
    );
}

