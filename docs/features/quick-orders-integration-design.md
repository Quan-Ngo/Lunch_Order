# Quick Orders Integration Design

## 1. Goal

Define how Quick Orders integrates into the current CAP (`db/`, `srv/`) and React (`app/lunch-ui`) architecture.

## 2. Existing App Integration Points

- Backend service root: `@path: '/odata/v4/lunch'` in `srv/service.cds`
- Frontend API client: `app/lunch-ui/src/services/api.ts`
- Existing manager route pattern: `ProtectedRoute` in `app/lunch-ui/src/App.tsx`
- Existing menu scanning action: `extractMenuFromImage(...)`

## 3. Proposed Data Model (db/schema.cds)

Add the following entities:

1. `QuickOrder`
- `ID : UUID`
- `name : String(120)`
- `orderName : String(160)`
- `createdBy : String(255)` (user email or user id)
- `orderDate : Date`
- `status : String enum { open; closed; completed; }`
- `shareBill : Boolean default false`
- `inviteAll : Boolean default false`
- `currency : String(3) default 'VND'`
- `additionalCost : Decimal(15,2) default 0`
- `foodSubtotal : Decimal(15,2) default 0`
- `totalPrice : Decimal(15,2) default 0`
- `createdAt/modifiedAt` (managed)

2. `QuickOrderFoodOption`
- `ID : UUID`
- `quickOrder : Association to QuickOrder`
- `name : String(160)`
- `price : Decimal(15,2)`

3. `QuickOrderChoice`
- `ID : UUID`
- `quickOrder : Association to QuickOrder`
- `staff : Association to Staff`
- `foodOption : Association to QuickOrderFoodOption`
- `priceSnapshot : Decimal(15,2)` (locks price at selection time)

4. `QuickOrderInvite`
- `ID : UUID`
- `quickOrder : Association to QuickOrder`
- `staff : Association to Staff`
- Unique constraint recommended on (`quickOrder`, `staff`)

5. Reuse existing `DailyOrderBill` (recommended)
- Extend existing `DailyOrderBill` with optional association:
  - `quickOrder : Association to QuickOrder;`
- Keep existing fields (`date`, `fileName`, `mediaType`, `content`) for backward compatibility.
- Usage split:
  - Daily flow continues using `date`.
  - Quick Orders flow uses `quickOrder`.

## 4. Service Layer Changes (srv/service.cds)

Expose new entities in `LunchService`:

- `entity QuickOrder as projection on lunch.QuickOrder`
- `entity QuickOrderFoodOption as projection on lunch.QuickOrderFoodOption`
- `entity QuickOrderChoice as projection on lunch.QuickOrderChoice`
- `entity QuickOrderInvite as projection on lunch.QuickOrderInvite`
- Reuse existing projection:
  - `entity DailyOrderBill as projection on lunch.DailyOrderBill`

Add actions/functions:

- `action createQuickOrderFromScan(orderPayload: LargeString, image: LargeString, mimeType: String) returns String`
- `action closeQuickOrder(orderId: UUID) returns String`
- `action completeQuickOrder(orderId: UUID) returns String`
- `function exportQuickOrderPdf(orderId: UUID) returns String`
- `action inviteAllToQuickOrder(orderId: UUID) returns String`

Authorization guidance:
- `Manager`: create/read own orders, update own open orders, close own open orders, complete own open or closed orders, export PDF
- `Employee`: create/read own orders, update own open orders, close own open orders, complete own open or closed orders, export PDF
- Both roles can participate in visible shared-bill orders.

## 5. Backend Behavior Rules

1. `closeQuickOrder`
- Allowed only when status is `open`.
- Reject if already `closed` or `completed`.

2. `completeQuickOrder`
- Allowed when status is `open` or `closed`.
- Reject if status is already `completed`.

3. Total recomputation
- Recompute `foodSubtotal` and `totalPrice` on:
  - choice create/update/delete
  - food option price update (for open orders)
- Formula: `totalPrice = foodSubtotal + additionalCost`

4. Invitation and visibility
- Invitable users must come from `Staff` table only.
- On create, creator is auto-added to `QuickOrderInvite`.
- If `inviteAll = true`, order is visible to all active employees.
- If `inviteAll = false`, only users listed in `QuickOrderInvite` can see the order in list/detail.
- List query for current user must filter by:
  - `inviteAll = true` OR
  - current user is creator OR
  - current user exists in `QuickOrderInvite`.

5. Share-bill access
- If `shareBill = false`, deny bill reads for non-creator users.
- If `shareBill = true`, allow participant users to view bill and participant summary.
- For Quick Orders, bill lookup should filter by `quickOrder_ID` (not by `date`).

## 6. Frontend Integration (React)

## 6.1 Routes

Add route in `app/lunch-ui/src/App.tsx`:

- `/quick-orders` -> `QuickOrdersPage`
- `/quick-orders/:id` -> `QuickOrderDetailPage`

Use existing `ProtectedRoute` pattern for role control.

## 6.2 New Pages/Components

Suggested files:

- `src/pages/QuickOrders.tsx` (list + create modal trigger)
- `src/pages/QuickOrderDetail.tsx` (detail screen)
- `src/components/fragments/CreateQuickOrderModal.tsx`
- `src/components/fragments/QuickOrderFoodTable.tsx`
- `src/components/fragments/QuickOrderStaffChoicesTable.tsx`

## 6.3 API Service Additions

Extend `app/lunch-ui/src/services/api.ts` with:

- `quickOrderService.getMine()`
- `quickOrderService.getById(id)`
- `quickOrderService.create(payload)`
- `quickOrderService.update(id, payload)`
- `quickOrderService.inviteStaff(orderId, staffIds)`
- `quickOrderService.removeInvite(orderId, staffId)`
- `quickOrderService.inviteAll(orderId)`
- `quickOrderService.updateAdditionalCost(id, amount)`
- `quickOrderService.close(id)`
- `quickOrderService.complete(id)`
- `quickOrderService.exportPdf(id)`
- `quickOrderService.scanMenu(imageFile)` (reuse `extractMenuFromImage`)

For bill image handling, reuse existing `billService` with quick-order-aware methods:
- `billService.uploadForQuickOrder(quickOrderId, file)`
- `billService.getByQuickOrder(quickOrderId)`
- `billService.getContentUrl(billId)`

## 6.4 Create Modal Flow

1. User enters manual food rows and order metadata.
2. User selects invited employees from `Staff` list or uses invite-all option.
3. Creator is auto-invited by backend.
4. Optional: click `Scan Menu`.
5. UI calls scan endpoint and receives `[name, price, description?]` entries.
6. User edits rows.
7. Confirm -> create order with `status='open'`.

## 7. PDF Export Design

Preferred backend-generated PDF:
- Client calls `exportQuickOrderPdf(orderId)`
- Backend returns media URL or base64 payload.
- PDF includes:
  - order name/date
  - participant list with selected food and price
  - additional costs
  - grand total and currency

## 8. Non-Functional Notes

- Keep decimal handling server-side for reliable totals.
- Validate currency as ISO 4217 code (3 chars).
- Log status transitions with actor and timestamp for auditability.
- Use optimistic UI updates only for non-critical edits; keep status transitions server-confirmed.

## 9. Suggested Delivery Sequence

1. Add CDS entities and migration.
2. Expose service projections and actions.
3. Implement backend business rules and total recomputation.
4. Implement frontend pages and modal flow.
5. Add PDF export.
6. Add share-bill access checks and tests.
7. Add invitation visibility checks and tests.
