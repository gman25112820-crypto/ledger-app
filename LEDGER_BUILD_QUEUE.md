# Ledger Build Queue

## Current Product Direction

Ledger is a family-focused finance decision app, not a basic budget tracker.

Core promise:

> Help a household know what money is protected, what is due soon, what can safely be spent, and what needs attention before it becomes a problem.

---

## Build 1 — Subscription Guard

Purpose:
Track subscriptions, auto-renewals, free trials, insurance renewals, and cancel-by dates.

Fields needed:
- Name
- Amount
- Renewal date
- Cancel-by date
- Frequency: monthly / yearly / weekly / trial
- Category
- Status: active / review / cancelling / cancelled
- Auto-renew: yes/no

Outputs:
- Upcoming renewals
- Due before payday
- Monthly subscription total
- Annual renewal risk
- Penny reminder messages

Example Penny message:
"Fab reminder — Disney+ renews in 4 days. Decide now whether to keep it or cancel before it sneaks through."

---

## Build 2 — Household Bills + Due Dates

Purpose:
Improve bills from simple amounts into real household commitments.

Fields needed:
- Bill name
- Amount
- Due date
- Repeat frequency
- Paid/unpaid
- Priority
- Category

Categories:
- Rent / mortgage
- Council tax
- Energy
- Water
- Phone / internet
- Subscriptions
- School clubs
- Pet insurance
- Home insurance
- Car insurance
- Contents insurance
- Debt payments

Outputs:
- Bills due soon
- Paid/unpaid status
- Due before payday
- Bill pressure level

---

## Build 3 — Family Savings Pots

Purpose:
Plan money before it disappears into general spending.

Pots:
- School clubs
- Birthdays
- Christmas
- Holiday fund
- Pets
- Vet bills
- Pet emergency fund
- Home insurance
- Car insurance
- School uniform
- Car maintenance
- Home repairs
- Emergency buffer
- Family days out

Fields needed:
- Pot name
- Saved amount
- Target amount
- Due date
- Monthly contribution needed
- Status: behind / okay / protected

---

## Build 4 — Protected Money Engine

Purpose:
Create Ledger's strongest unique feature.

Calculation:
Income
minus unpaid bills
minus subscriptions due before payday
minus household pots
minus family pots
minus debt payments
equals true safe-to-spend.

Outputs:
- Protected money
- Unsafe to touch
- Flexible safe-to-spend
- Pressure level
- Next best action

---

## Build 5 — Shopping List With Budget Impact

Purpose:
Make shopping part of the money plan.

Fields:
- Item
- Estimated cost
- Essential / optional / treat
- Bought yes/no

Outputs:
- Total estimated shop
- Essentials total
- Treats total
- Remaining food budget
- Penny shopping advice

---

## Build 6 — Bills Calendar

Purpose:
Show due dates visually.

Views:
- Due this week
- Due before payday
- Paid this month
- Overdue
- Annual renewals coming soon

---

## Build 7 — Automated Penny Reminders

Purpose:
In-app automated guidance.

Reminder examples:
- Subscription renews soon
- Free trial ending
- Bill due before payday
- Pot behind target
- Safe-to-spend dropped
- Shopping list near budget limit

---

## Build 8 — Data Model Cleanup

Purpose:
Prepare for Supabase/cloud sync.

Target structure:
- profile
- income
- bills[]
- subscriptions[]
- pots[]
- shoppingList[]
- kids[]
- goals[]
- reminders[]
- settings

---

## Build 9 — PWA Install Mode

Purpose:
Make Ledger feel like a real phone app.

Needed:
- manifest.json
- app icon
- install prompt
- mobile splash behaviour
- theme colour
- offline local mode

---

## Build 10 — Supabase Accounts + Cloud Sync

Purpose:
Move from demo to real product foundation.

Needed:
- Login/signup
- User profile
- Cloud database
- Row-level security
- Family sharing later
- Delete/export user data
- Password reset
