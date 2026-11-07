import { useStore } from '@/contexts/StoreContext';
import { useCheckoutContext } from '@/contexts/CheckoutContext';

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function OrderingStatusBanner() {
  const { orderingSchedule, orderingUnavailable, scheduleError, refreshOrderingSchedule } = useStore();
  if (!orderingSchedule?.enabled && !scheduleError) return null;

  return (
    <section aria-label="Ordering hours" className={`border-b px-4 py-3 text-sm ${orderingUnavailable ? 'bg-amber-50 text-amber-950' : 'bg-emerald-50 text-emerald-950'}`}>
      <div className="mx-auto max-w-6xl" role="status">
        <p className="font-semibold">{scheduleError || (orderingUnavailable && orderingSchedule?.is_open ? 'Checking ordering hours…' : orderingSchedule?.message)}</p>
        {orderingSchedule?.enabled && (
          <p className="mt-1 text-xs">
            Orders: {orderingSchedule.open_days.map(day => weekdays[day - 1]).join(', ')} · {orderingSchedule.opens_at}–{orderingSchedule.closes_at} · London time
          </p>
        )}
      </div>
      {scheduleError && <button type="button" className="mt-2 underline" onClick={() => { void refreshOrderingSchedule().catch(() => {}); }}>Check again</button>}
    </section>
  );
}

export function CheckoutSchedule() {
  const { orderingSchedule, scheduleError } = useStore();
  const { deliveryDate, deliveryDateError, setDeliveryDate } = useCheckoutContext();
  if (!orderingSchedule?.enabled && !scheduleError) return null;

  return (
    <div className="m-4 rounded-lg border border-stone-200 bg-white p-4 text-stone-900 sm:mx-6">
      <OrderingStatusBanner />
      {orderingSchedule?.enabled && (
        <div className="mt-4">
          <p id="delivery-date-label" className="mb-2 block text-sm font-semibold">Choose your delivery day *</p>
          <div role="radiogroup" aria-labelledby="delivery-date-label" aria-required="true" aria-invalid={!!deliveryDateError}
            aria-describedby="delivery-date-help delivery-date-error" className="flex flex-wrap gap-2">
            {orderingSchedule.delivery_dates.map(date => {
              const selected = deliveryDate === date.value;
              const parsed = new Date(`${date.value}T12:00:00Z`);
              const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' }).format(parsed);
              const dayMonth = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(parsed);
              return (
                <button key={date.value} type="button" role="radio" aria-checked={selected} onClick={() => setDeliveryDate(date.value)}
                  className={`min-w-[4.5rem] rounded-xl border px-3 py-2 text-center text-sm focus:outline-2 focus:outline-offset-2 focus:outline-stone-700 ${selected ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-300 bg-white text-stone-900'}`}>
                  <span className="block font-semibold">{date.value === orderingSchedule.server_now?.slice(0, 10) ? 'Today' : weekday}</span>
                  <span className="block text-xs">{dayMonth}</span>
                </button>
              );
            })}
          </div>
          <p id="delivery-date-help" className="mt-2 text-xs text-stone-600">One delivery day for all meals in this order. Each day shows its next date.</p>
          {orderingSchedule.delivery_dates.length === 0 && <p className="mt-2 text-sm">No delivery dates are currently available.</p>}
          <p id="delivery-date-error" role="alert" className="mt-2 text-sm text-red-700">{deliveryDateError}</p>
        </div>
      )}
    </div>
  );
}

export function DeliveryDate({ date }: { date?: string | null }) {
  if (!date) return null;
  const parsed = new Date(`${date.slice(0, 10)}T12:00:00Z`);
  const label = Number.isNaN(parsed.valueOf()) ? date : new Intl.DateTimeFormat('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  }).format(parsed);
  return <p className="my-3 text-sm font-semibold">Delivery date: <time dateTime={date.slice(0, 10)}>{label}</time></p>;
}
