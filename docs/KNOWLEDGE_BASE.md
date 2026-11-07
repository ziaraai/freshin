# Freshin – Knowledge Base

*A plain-language guide to what Freshin is, who it is for, how it works, and where it is going.*
*Last updated: 7 November 2026. For technical details see `docs/HANDOFF.md`.*

---

## 1. Freshin in one sentence

**Freshin is a small online ordering service that lets office employees in Greenwich, London, order a fresh,
home-cooked dish for a chosen day, so it arrives at their desk – and lets the cook prepare only what was ordered.**

- Website: **https://freshin.space**
- Cook and owner of the kitchen: **Karim**
- Area served during the test: **Greenwich, London** only

---

## 2. The problem we are solving

**For employees**
- Lunch at work is often expensive, repetitive, or not very healthy (sandwich chains, fast food, vending machines).
- Many people do not have time to cook the night before or to go out at lunchtime.
- They would like a real, home-style meal, at a fair price, without leaving their desk.

**For the cook (Karim)**
- Cooking "just in case" means waste: food that is not sold is lost money.
- Taking orders by phone, WhatsApp or paper is messy and easy to get wrong.
- He needs to know *in advance* how many dishes to cook, for which day, and where to deliver them.

**Freshin answers both:** customers book a dish for a specific day; Karim sees exactly what to cook, for whom, and when.

---

## 3. Who it is for

| Who | What they want | What Freshin gives them |
|---|---|---|
| **Office employees** (main customers) | A good meal at the desk, simple ordering | Order online in under a minute, pick the delivery day, pay by card or cash |
| **Small teams / managers** | Lunch for a meeting or a team day | One order, one delivery day, several dishes |
| **Employers / office managers** (later) | A perk for staff, no admin work | A regular meal service for the office (see roadmap) |
| **Karim** (the cook) | Know what to cook, no waste, get paid | A list of orders per day, online payment, a professional shop |

---

## 4. How it works for the customer

1. **Open the shop** at freshin.space (from a flyer, a business card, a QR code or a WhatsApp link).
2. **Choose dishes** from the menu and add them to the cart.
3. **Step 1 – Delivery day:** pick **one** day for the whole order.
   - Each weekday is shown once, with its next date (choose "Mon" → it is the coming Monday).
   - **Same-day orders are not possible:** the earliest day is tomorrow, so the food is always cooked fresh for you.
   - Only the days Karim cooks are shown.
4. **Step 2 – Information:** name, email, phone and **delivery address** (street, building, floor, postcode).
   No country/city fields – the service is Greenwich only, so we keep it fast.
5. **Step 3 – Review** the order.
6. **Step 4 – Payment:** **card (Stripe)** or **cash on delivery**.
7. The customer gets an **order confirmation** and an **invoice link** showing the delivery day.

**Ordering hours:** orders are accepted only during opening hours (for example 09:00–17:00, London time). Outside
those hours the shop shows when ordering opens again.

---

## 5. How it works for Karim (the cook)

**Before opening**
- Add the **menu**: dish name, photo, price, short description, ingredients and allergens.
- Set the **ordering hours** (when people can order) and the **delivery days** (the days he cooks).
- Set the **booking window** to **7 days** (customers see one week ahead, each day once).
- Turn on the **payment methods**: Stripe (card) and/or cash on delivery.

**Every day**
- Check the **orders** in the admin panel – each order shows its **delivery date**.
- Count the dishes needed for the next delivery day and **cook only what was ordered**.
- Pack, label and deliver to the addresses on the orders.
- For cash orders, collect payment on delivery.

**The key rule of the business:** *orders come first, cooking second.* No guessing, no waste.

---

## 6. Why this model works

- **Zero waste by design:** every dish cooked is already sold.
- **Cash flow:** card payments arrive before the food is cooked.
- **Fresh food:** cooking happens for a known day, never days in advance.
- **Simple logistics:** one area (Greenwich), one delivery round per day, offices close together.
- **Low cost to start:** a website, a kitchen, packaging and flyers – no shop rent, no staff at the beginning.

---

## 7. The test phase (now)

**Goal:** prove that people in Greenwich offices will order and re-order.

| Item | Target |
|---|---|
| First customers | **at least 20** |
| Marketing | flyers, business cards, QR code to freshin.space, word of mouth, WhatsApp |
| Where | office buildings and business areas in Greenwich |
| Menu | a short menu (a few dishes) that Karim can cook well and repeat |
| Duration | a few weeks, long enough to see repeat orders |

**What we watch during the test**
- How many people order, and how many **order again** (the most important number).
- Which dishes sell best, and on which days.
- Average order value and delivery cost per order.
- Feedback: taste, portion size, price, delivery time, packaging.
- How much time Karim spends per order (cooking + delivery).

**Ideas to get the first 20 customers**
- A flyer with a QR code and a **first-order discount** (coupons are available in the shop).
- Free tasting samples at the entrance of an office building at lunchtime.
- Ask the first customers to bring a colleague ("order for two").
- A weekly menu posted on WhatsApp with the shop link.

---

## 8. Before selling food: practical checklist (UK)

*This is general guidance, not legal advice – check with Royal Borough of Greenwich council.*

- **Register as a food business** with the local council (free) – it should be done **at least 28 days before
  starting to trade**. A home kitchen can be registered.
- Expect a **food hygiene inspection** and a hygiene rating.
- A **food hygiene certificate** (Level 2 Food Safety and Hygiene) for the cook is strongly recommended.
- **Allergens:** customers must be able to know which of the **14 major allergens** each dish contains – before
  they order (write them in the dish description) and when the food is delivered (label on the box).
- Safe **transport**: keep hot food hot / cold food cold, use proper food containers.
- Simple **records**: what was cooked, when, temperatures, suppliers.
- **Insurance** (public / product liability) is recommended once real customers are served.

---

## 9. The brand

- **Name:** Freshin – *fresh, home-cooked meals, delivered in.*
- **Promise:** a real home-cooked dish at your desk, booked for the day you want.
- **Tone:** warm, simple, honest – home cooking, not fast food.
- **Customer-facing wording** in the shop already speaks about *meals* and *dishes*, delivery days, and Greenwich.

---

## 10. The future: from test to a full meal service (Tiffingo)

If the test works (customers re-order and the numbers make sense), the plan is to move to a bigger, ready-made
platform: **Tiffingo** – a complete app for subscription-based meal ("tiffin") services, with **Android and iOS apps**.

**What the current Freshin test does (kept simple on purpose)**
- One delivery day per order.
- Card or cash payment.
- One area (Greenwich), one shop, website only.

**What Tiffingo adds for the next stage**

| Feature | Why it matters for an office meal service |
|---|---|
| **Meal subscriptions** (e.g. 5, 10, 20 or 30 days) | Regular income; customers do not need to re-order every day |
| **Choose several delivery days** (e.g. Mon–Fri) | "Lunch every working day" plans for employees |
| **Meal slots** (breakfast, lunch, dinner) | More moments to sell, separate delivery times |
| **Mobile apps** for customers | Easier re-ordering, push notifications for new menus |
| **Delivery app / driver tracking** | When there is more than one delivery person |
| **Pause / skip days** | Customers on holiday do not cancel, they pause |
| **Multiple kitchens / areas** | Grow beyond Greenwich, or add other cooks |

**Possible business directions after the test**
1. **Employee lunch subscriptions** – individuals subscribe to a weekly or monthly lunch plan.
2. **Corporate catering** – a company pays for staff lunches (a perk), one invoice per month.
3. **Meeting & event catering** – platters and group orders for meetings, training days, office events.
4. **More cooks** – other home cooks join, each with their own dishes, under the Freshin name.

**Roadmap (simple view)**

| Phase | What | When |
|---|---|---|
| **1. Test** | Freshin on freshin.space, 20+ customers, one cook, Greenwich | Now |
| **2. Learn & adjust** | Fix the menu, prices, delivery days and cutoff time from real feedback | After the first weeks |
| **3. Grow** | Move to Tiffingo: subscriptions, apps, office plans, corporate catering | When repeat orders prove demand |

---

## 11. Frequently asked questions

**Can a customer order for today?**
No. The earliest delivery day is tomorrow, so Karim always has time to cook fresh.

**Can a customer choose several days in one order?**
Not in the test version – one day per order. Several days and subscriptions come with Tiffingo.

**How do customers pay?**
By card online (Stripe) or cash on delivery.

**Where do you deliver?**
Greenwich, London, during the test.

**What if someone orders outside opening hours?**
The shop shows "Ordering is closed" and the next opening time; orders are refused until then.

**Who can change the menu, days and hours?**
Karim (or the admin) from the admin panel – no developer needed.

---

## 12. Key people and places

| | |
|---|---|
| Cook / owner | Karim |
| Project setup & website | the Freshin project team |
| Website | https://freshin.space |
| Admin panel | https://freshin.space (log in as admin) |
| Hosting | Plesk server (Contabo) |
| Code | GitHub `ziaraai/freshin`, branch `claude/stoic-rubin-9hf3ci` |
| Technical notes | `docs/HANDOFF.md` |
