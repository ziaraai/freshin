# Freshin – Handoff notes

Read this first if you are a new person or a new Claude account continuing the work.
Last updated: 2026-11-07. Branch: `claude/stoic-rubin-9hf3ci`.

## 1. What this project is
A small test platform for **Karim** (friend in London): a home-kitchen / catering shop selling dishes to employees.
Goal: Karim makes dishes, flyers and cards, and gets ~20 customers. If it works, the project may move to a bigger app
([Tiffingo on CodeCanyon](https://codecanyon.net/item/tiffingo-a-complete-app-for-subscription-based-orderstiffin-services-android-ios/47127013),
subscription tiffin orders, with Android/iOS apps).

- Base: a CodeCanyon "WhatsStore" Laravel + Inertia/React app, modified.
- Live URL: https://freshin.space (Plesk server on Contabo, vhost `freshin.space`).
- Stack: Laravel (PHP 8.3), MySQL, React/TypeScript (Vite), Plesk hosting.

## 2. Custom changes already made (before this session)
Commit `1f4fc16` "Add London ordering schedules and Stripe/COD checkout":
- **Ordering schedule** (`app/Services/OrderingSchedule.php`): open days, opening/closing time (London time),
  delivery days, booking window. Orders are refused outside opening hours. Enforced on the server.
- **Delivery date** saved on each order (`orders.delivery_date`, migration `2026_11_05_000001`), shown on invoices.
- Only **Stripe** and **COD** (cash on delivery) payment methods; all other gateways removed.
- Plesk web installer that generates the app key on the server.
- Admin UI for the schedule: `resources/js/components/ordering-schedule-settings.tsx` (store settings page).
- Checkout UI: `resources/js/components/OrderingSchedule.tsx`.
- Tests: `tests/Unit/OrderingSchedule*Test.php` (74 tests passed at that time).

## 3. What was done in this session

### 3.1 Install failure (DB access denied)
- Symptom: `/install/final` said "Installation incomplete"; `storage/logs/laravel.log` showed
  `SQLSTATE[HY000] [1045] Access denied for user ...@'localhost'`.
- Cause: MySQL rejected the user/password the wizard saved in `.env` (not a code bug). Common reasons: special
  characters (`#`, `$`, spaces, quotes) in the DB password written unquoted, wrong user, or user not assigned
  to the database in Plesk.
- Fix: set a simple letters+digits DB password in Plesk, put the correct `DB_*` values in `.env`
  (`DB_PASSWORD="..."` quoted), run `php artisan config:clear`, retry the installer on an empty database.
- Result: install succeeded; admin panel works (super admin "Freshinteam").

### 3.2 Broken images
- Symptom: avatar/logo broken; DevTools showed image URL `http://localhost/storage/media/avatars/avatar.png`.
- Cause: `get_file()` in `app/Helpers/helper.php` builds URLs from `config('app.url')` = `APP_URL`, which was
  `http://localhost` on the server (and config was cached).
- Also: `public/storage` symlink had to exist (it already did: `storage:link` reported "link already exists"),
  and `storage/app/public/media` is **gitignored**, so default images (avatar, logo, demo avatars) are not in the repo.
- Fix: in server `.env` set `APP_URL=https://freshin.space` (and `FRONTEND_URL=https://freshin.space`), delete
  `bootstrap/cache/config.php` or run `php artisan config:clear`. Upload own avatar/logo in the admin panel.
  Keep `storage/app/public/media` permissions at `755` (not `777`).
- Result: images load correctly.
- Cleanup to confirm: the temporary Plesk scheduled task `httpdocs/artisan storage:link` should be removed.

### 3.3 Delivery day picker (Tiffinly-style, but ONE day per order)
User wish: customer chooses **one** day; each weekday shows only its **next** date (choose Monday -> next Monday only);
today must be selectable.
- Backend already supported this: with `advance_days = 7`, each delivery weekday appears once (offsets 0..6, today included).
  `validateOrder` still refuses today if the shop is closed.
- Changes (commit "Show next-date delivery day chips..."):
  - `resources/js/components/OrderingSchedule.tsx`: dropdown replaced by day chips (radio group, accessible).
    Chip label `Today` when the date equals the server's London date, else the short weekday; plus day+month.
  - Default `advance_days` changed 28 -> 7 in `app/Services/OrderingSchedule.php` and
    `resources/js/components/ordering-schedule-settings.tsx` (new setups only).
- NOT done by default for the live site: the store's saved setting may still be 28. Set it to 7 in the admin panel.

### 3.4 Delivery day as its own checkout step + address only
User wish: the delivery day is a separate first step (Delivery day -> Information -> Review -> Payment), and the
customer fills in only the street address (service area is Greenwich only). Country/State/City/Postal code must be
hidden completely (not just optional) to keep checkout fast.
- `resources/js/contexts/CheckoutContext.tsx`: new step 0 = delivery day (exists only when the ordering schedule is
  on; exposed as `firstStep`). Continue on step 0 goes to Information; if the date becomes invalid later the
  customer is sent back to step 0. Back button goes down to `firstStep`.
- `resources/js/components/OrderingSchedule.tsx` (`CheckoutSchedule`): step 0 shows hours banner + day chips;
  later steps show a one-line "Delivery date: ... / Change" summary.
- All 7 themes `resources/js/themes/*/components/Checkout.tsx`: Country/State/City/Postal code inputs and their
  required checks removed; address placeholder "Street, building, floor, postcode"; Back button uses `firstStep`.
  `bakery-store` and `supermarket-store` (the live theme is supermarket, green) show the extra "Delivery day" bubble in its progress bar; other themes'
  progress bars still show 3 bubbles (none highlighted on step 0).
- `app/Http/Controllers/Store/OrderController.php`: city/state/postal/country are `nullable`; saved as
  `Greenwich` / `London` / `` / `United Kingdom` when not sent (DB columns are NOT NULL).
- Test added in `tests/Unit/OrderingScheduleHttpTest.php` (order with only a street address). Ordering tests: 70 pass.
- Full suite: 22 failures (dashboard/auth/profile tests) exist before and after these changes (unrelated, not fixed).

### 3.5 No same-day orders
User decision (2026-11-07): customers must NOT order for today; earliest delivery day is tomorrow.
- `app/Services/OrderingSchedule.php`: delivery dates now start at tomorrow (offset 1..advance_days inclusive),
  so with a window of 7 each weekday still appears once (tomorrow ... today+7). Server rejects today's date.
- Tests updated (booking window excludes today, "same day" rejected). Ordering tests: 71 pass.
- Frontend unchanged ("Today" label code stays but never shows).

### 3.6 Notifications and meal wording
- `resources/js/components/custom-toast.tsx` (global, admin + shop): notifications now appear bottom-centre (they used
  to cover the header cart button), success messages close after 2.5 s, and clicking a notification closes it.
- Supermarket theme (live): grocery wording replaced with meal wording (hero "Home-Cooked Meals Delivered in
  Greenwich", search "Search for dishes...", checkout "Complete your meal order", success "Your meal is booked for
  your delivery day", invoice "Thank you for your order!", "Your Cart", "Delivery Address", phone hint +44).
  SKU line removed from dish cards (still visible in the dish detail tab).
- Needs a new frontend build upload (no PHP change).

### 3.7 Media library (product gallery picker)
Problems: selected images were not highlighted ("3 selected" but no tick), so they could not be found to deselect;
the confirm button fell off the bottom of the window.
- Cause: selection stored relative paths (`/storage/...`) but the highlight compared with the absolute URL
  (`https://freshin.space/storage/...`), which only differ since APP_URL was fixed.
- `resources/js/components/MediaLibraryModal.tsx`: highlight uses the relative path; selected images show their
  order number; a "Selected:" strip (with x to remove) sits above the buttons; footer rows never shrink and the grid
  scrolls, so "Use N images" stays visible; responsive grid (3/4/6 columns).
- Opens with the product's current gallery pre-selected (`initialSelected` from `MediaPicker.tsx`), because confirming
  replaces the gallery. "Remove all images" appears when everything is deselected.

## 4. To make the new picker live on freshin.space
1. Admin panel -> store settings -> **Ordering hours & delivery days**: enable, tick delivery days,
   set **Delivery booking window (days)** = `7`, set opening/closing times.
2. The frontend must be rebuilt: `public/build` is gitignored, so Plesk does not get it from git.
   Build needs both `npm ci` and `composer install` (vite imports Ziggy from `vendor/tightenco/ziggy`).
   ```bash
   composer install --no-dev --optimize-autoloader   # (dev deps not needed for the build itself except ziggy)
   npm ci
   npm run build            # outputs public/build
   ```
   Upload `public/build` to `httpdocs/public/build` on the server (Plesk File Manager), then hard refresh (Ctrl+F5).
3. If code was changed (PHP), also upload changed PHP files or `git pull` on the server, then
   `php artisan config:clear`. For 3.4 the PHP file is `app/Http/Controllers/Store/OrderController.php`.

Status: build verified on 2026-11-07 (npm ci + composer install + vite build OK; ordering tests: 69 passed).

## 5. Useful Plesk facts
- Run artisan without SSH: Websites & Domains -> Scheduled Tasks -> Run a PHP script,
  path `httpdocs/artisan`, arguments e.g. `config:clear`, then **Run Now**, then remove the task.
- Logs: Websites & Domains -> Logs. App log: `httpdocs/storage/logs/laravel.log`.
- Never put real secrets (DB password, Stripe keys) in the repo or in this file.

## 6. Open items / next steps
- [ ] Upload the built `public/build` (zip made in the session; rebuild with the commands in section 4 if missing).
- [ ] Set booking window = 7 and delivery days in the admin panel; test an order end to end (COD, then Stripe test mode).
- [ ] Remove the leftover Plesk scheduled task (`storage:link`).
- [ ] Stripe: add Stripe keys (test mode first) in payment settings.
- [ ] Add Karim's dishes (names, photos, prices, descriptions), store name/logo, currency GBP, London timezone.
- [ ] Decide on pickup vs delivery wording (UI currently says "delivery date"). Ask the user; not yet answered.
- [ ] Optional later: per-day cook list for Karim (orders grouped by delivery date), cutoff the day before,
      per-day dish availability. Tiffingo-style multi-day subscriptions and Breakfast/Lunch/Dinner slots
      are deliberately NOT included (user wants one day per order).

## 7. How to continue with a new Claude account
- Repo: `ziaraai/freshin`, branch `claude/stoic-rubin-9hf3ci` (do not open a PR unless asked).
- Tell the new session: "Read docs/HANDOFF.md and continue from section 6."
- Run tests with `php vendor/bin/pest` (needs `composer install` first). Frontend check: `npx tsc --noEmit`.
