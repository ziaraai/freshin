# Ordering hours and delivery dates

In **Stores → Settings → Ordering & Delivery**, enable the ordering schedule,
choose the days on which you accept orders, and set the daily opening and closing
times. Choose delivery weekdays separately and set the booking window (1–90
calendar days, including today). Use **Save Settings** to apply the changes.

The schedule starts disabled so existing stores keep their current behaviour.
The initial form suggests Monday–Friday, 09:00–17:00 and a 28-day booking window;
these are editable examples, not activated business hours.

When enabled:

- Times use **Europe/London**, including the automatic GMT/BST changes.
- Orders are accepted at the opening time and stop at the closing time. The same
  hours apply on each selected ordering day; overnight hours are not supported.
- Customers may browse and prepare a basket when closed, but cannot place an
  order, even for a future delivery date.
- Checkout requires **one delivery date for the whole order**, selected from the
  configured delivery weekdays. Today is available if it is a delivery day and
  ordering is open. This is a date choice, not a delivery time slot or recurring
  meal subscription.
- The server rechecks the schedule and delivery date before creating the order,
  changing stock, or starting payment. A tab left open past closing cannot bypass
  the restriction.
- The delivery date appears in the order details, invoices and WhatsApp order
  message, including existing message templates that omit `{delivery_date}`.

## Applying the code

After installing the locked dependencies, run the additive database migration
and build the frontend in the repository directory:

```sh
php artisan migrate
npm run build
```

The migration adds a nullable `orders.delivery_date` column; existing orders
remain undated. Do not use `migrate:fresh` on an existing store database.

Focused checks:

```sh
php artisan test tests/Unit/OrderingScheduleTest.php tests/Unit/OrderingScheduleHttpTest.php
```

The HTTP checks use an isolated SQLite in-memory database. They exercise settings
validation and ownership, rejected orders without stock/cart changes, successful
date persistence and WhatsApp message content. They do not send WhatsApp messages
or call a payment provider.

The schedule can be checked through the read-only
`GET /store/{storeSlug}/ordering-status` endpoint (or `/ordering-status` on a
custom store domain). It returns the current server time, open/closed status and
available delivery dates with caching disabled.

## Stripe and cash on delivery

In **Settings → Payment Settings**, enable **Cash on Delivery** for the selected
store. COD orders stay `pending`/unpaid until you record collection in the order
administration. Enable **Stripe** separately and save the matching publishable
and secret keys. An empty secret field keeps the saved secret. Use test keys
first; the automated tests replace the Stripe HTTP client and never charge a
card. Configure the store currency as **GBP** in the currency settings.

Customer checkout accepts only enabled, configured Stripe or enabled COD.
An initial Stripe Checkout failure rolls back order creation, stock deductions,
coupon usage and cart deletion. Other gateways cannot be selected or invoked;
old order/payment records and receipt fields are retained for historical access.
SaaS plan purchases use the superadmin's Stripe configuration, with no COD.
The WhatsApp contact widget is configured separately in store settings.

Public payment endpoints return presentation fields and publishable keys only.
Saved secrets are masked in the payment settings form, and storefront settings
are filtered to presentation fields before serialization.
