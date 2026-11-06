import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from 'react-i18next';

export interface OrderingScheduleSettings {
    enabled: boolean;
    timezone: string;
    open_days: number[];
    opens_at: string;
    closes_at: string;
    delivery_days: number[];
    advance_days: number;
}

export const defaultOrderingSchedule: OrderingScheduleSettings = {
    enabled: false,
    timezone: 'Europe/London',
    open_days: [1, 2, 3, 4, 5],
    opens_at: '09:00',
    closes_at: '17:00',
    delivery_days: [1, 2, 3, 4, 5],
    advance_days: 28,
};

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface Props {
    value: OrderingScheduleSettings;
    onChange: (value: OrderingScheduleSettings) => void;
    errors: Record<string, string>;
}

export default function OrderingScheduleSettingsPanel({ value, onChange, errors }: Props) {
    const { t } = useTranslation();
    const update = (changes: Partial<OrderingScheduleSettings>) => onChange({ ...value, ...changes });
    const fieldError = (field: string) => {
        const prefix = `settings.ordering_schedule${field ? `.${field}` : ''}`;
        return errors[prefix] || Object.entries(errors).find(([key]) => key.startsWith(`${prefix}.`))?.[1];
    };
    const errorMessage = (field: string) =>
        fieldError(field) ? (
            <p id={`schedule-${field || 'form'}-error`} role="alert" className="text-sm text-red-600 dark:text-red-400">
                {fieldError(field)}
            </p>
        ) : null;
    const dayPicker = (field: 'open_days' | 'delivery_days', label: string) => (
        <fieldset className="space-y-3" aria-describedby={fieldError(field) ? `schedule-${field}-error` : undefined}>
            <legend className="text-sm font-semibold">{t(label)}</legend>
            <div className="flex flex-wrap gap-2">
                {weekdays.map((day, index) => (
                    <label
                        key={day}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700"
                    >
                        <input
                            type="checkbox"
                            className="accent-primary h-4 w-4"
                            checked={value[field].includes(index + 1)}
                            onChange={(event) =>
                                update({
                                    [field]: event.target.checked
                                        ? [...value[field], index + 1].sort((a, b) => a - b)
                                        : value[field].filter((dayNumber) => dayNumber !== index + 1),
                                })
                            }
                        />
                        {t(day)}
                    </label>
                ))}
            </div>
            {errorMessage(field)}
        </fieldset>
    );

    return (
        <Card className="rounded-2xl border border-zinc-200/80 shadow-sm dark:border-zinc-800">
            <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 p-4 sm:p-6 dark:border-zinc-800/80 dark:bg-zinc-900/30">
                <CardTitle className="text-base font-bold">{t('Ordering hours & delivery days')}</CardTitle>
                <CardDescription>{t('Choose when customers can order and which delivery dates they can select.')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-4 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <Label htmlFor="ordering-schedule-enabled" className="font-semibold">
                            {t('Enable ordering schedule')}
                        </Label>
                        <p className="text-muted-foreground text-sm">
                            {t('Turn this on and save settings to apply these hours and require a delivery date at checkout.')}
                        </p>
                    </div>
                    <Switch id="ordering-schedule-enabled" checked={value.enabled} onCheckedChange={(enabled) => update({ enabled })} />
                </div>
                {errorMessage('enabled')}
                {errors['settings.ordering_schedule'] && errorMessage('')}
                <div className="bg-primary/5 rounded-xl p-4 text-sm leading-relaxed">
                    <p>{t('All times use London time (Europe/London), with GMT and British Summer Time applied automatically.')}</p>
                    <p className="mt-2">
                        {t(
                            'Outside ordering hours, customers can browse your menu but cannot place any orders, including orders for future delivery.',
                        )}
                    </p>
                </div>
                {errorMessage('timezone')}
                <fieldset className="space-y-6">
                    <legend className="sr-only">{t('Ordering schedule')}</legend>
                    {dayPicker('open_days', 'Accept orders on')}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="ordering-opens-at">{t('Opening time')}</Label>
                            <Input
                                id="ordering-opens-at"
                                type="time"
                                value={value.opens_at}
                                onChange={(event) => update({ opens_at: event.target.value })}
                                aria-invalid={!!fieldError('opens_at')}
                                aria-describedby={fieldError('opens_at') ? 'schedule-opens_at-error' : undefined}
                            />
                            {errorMessage('opens_at')}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ordering-closes-at">{t('Closing time')}</Label>
                            <Input
                                id="ordering-closes-at"
                                type="time"
                                value={value.closes_at}
                                onChange={(event) => update({ closes_at: event.target.value })}
                                aria-invalid={!!fieldError('closes_at')}
                                aria-describedby={fieldError('closes_at') ? 'schedule-closes_at-error' : undefined}
                            />
                            {errorMessage('closes_at')}
                        </div>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        {t(
                            'These hours apply to every selected ordering day. Closing time must be later than opening time on the same day; overnight hours are not supported.',
                        )}
                    </p>
                    {dayPicker('delivery_days', 'Deliver meals on')}
                    <div className="space-y-2">
                        <Label htmlFor="ordering-advance-days">{t('Delivery booking window (days)')}</Label>
                        <Input
                            id="ordering-advance-days"
                            type="number"
                            min={1}
                            max={90}
                            step={1}
                            value={value.advance_days}
                            className="max-w-40"
                            onChange={(event) => update({ advance_days: Number(event.target.value) })}
                            aria-invalid={!!fieldError('advance_days')}
                            aria-describedby={`schedule-booking-help${fieldError('advance_days') ? ' schedule-advance_days-error' : ''}`}
                        />
                        <p id="schedule-booking-help" className="text-muted-foreground text-sm">
                            {t('From 1 to 90 calendar days, including today. Customers choose one available delivery date for the whole order.')}
                        </p>
                        {errorMessage('advance_days')}
                    </div>
                </fieldset>
                {!value.enabled && (
                    <p className="text-muted-foreground text-sm">
                        {t('The schedule is off. Orders are accepted at any time and no delivery date is required.')}
                    </p>
                )}
                <p className="text-sm font-medium">{t('Use Save Settings above to apply your changes.')}</p>
            </CardContent>
        </Card>
    );
}
