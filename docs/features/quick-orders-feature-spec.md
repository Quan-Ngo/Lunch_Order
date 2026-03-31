# Quick Orders Feature Spec

## 1. Purpose

Add a **Quick Orders** module where Managers and Employees can create and manage reusable order sessions with food options, participant choices, and final cost tracking.

This feature extends the current Lunch Order app with a separate order flow that is not tied to `DailyMenu` publication.

## 2. Roles

- `Manager`
  - Can create quick orders.
  - Can view quick orders created by self.
  - Can close and complete quick orders.
  - Can export participant choices to PDF.
  - Can participate in visible quick orders (when share-bill is enabled).
- `Employee`
  - Can create quick orders.
  - Can view quick orders created by self.
  - Can close and complete quick orders.
  - Can export participant choices to PDF.
  - Can participate in visible quick orders (when share-bill is enabled).

## 3. Main Screens

## 3.1 Quick Order List Screen

Shows quick orders created by current user.

Columns:
- Order name
- Date
- Total price
- Status (`open`, `closed`, `completed`)

Behavior:
- Clicking an order opens its detail page.
- "Create New Quick Order" button opens a creation modal.

## 3.2 Quick Order Detail Screen

Displays:
- Restaurant name
- Share-bill status (`enabled` or `disabled`)
- Order status (`open`, `closed`, `completed`)
- Food options list
- Staff choices with selected food and price
- Additional costs (service fee, shipping, etc.)
- Currency
- Total price (food subtotal + additional costs)

Actions:
- Export PDF of staff choices
- Close order
- Complete order

## 3.3 Create Quick Order Modal

Inputs:
- Order name
- Restaurant name
- Share-bill checkbox
- Currency selector
- Food rows: `food name`, `price`
- Scan Menu button

Behavior:
- Scan Menu populates food rows from extracted menu items.
- User can edit scanned rows before confirm.
- Confirm creates a new `open` order.

## 4. Status Lifecycle

- `open`
  - Order is editable.
  - Food options and participant choices can change.
- `closed`
  - New participant choices are blocked.
  - Export PDF remains available.
- `completed`
  - Order is finalized and read-only.
  - Cost and choices are locked.

Allowed transitions:
- `open -> closed`
- `closed -> completed`
- `open -> completed`

Disallowed transitions:
- `closed` -> any other state.

## 5. Share Bill Rules

- If `shareBill = true`:
  - Other users can view the uploaded bill and participant summary for that order.
- If `shareBill = false`:
  - Bill visibility is restricted to order creator.

## 6. Cost Calculation

`Total Price = Sum(staff selected food prices) + Sum(additional costs)`

Notes:
- Currency is selected per order and applied consistently across totals and PDF.

## 7. Acceptance Criteria

1. User can create a quick order with manual food entries.
2. User can scan menu and edit extracted items before confirming.
3. New quick order appears in list with status `open`.
4. Clicking list row opens detail with all required sections.
5. Additional costs update total in real time.
6. User can export staff choices PDF from detail page.
7. User can close order only when status is `open`.
8. Share-bill toggle controls bill visibility to other users.
9. List screen always shows: name, date, total, status.

