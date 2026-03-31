# Quick Orders List and Detail Integration Design

## 1. Goal

Integrate a Quick Orders list/detail feature into the current CAP backend and React frontend with share-bill bill image visibility logic.

## 2. Integration Points in Current App

- OData base path: `srv/service.cds` (`/odata/v4/lunch`)
- Frontend API layer: `app/lunch-ui/src/services/api.ts`
- Route registration: `app/lunch-ui/src/App.tsx`
- Role-based route guard: `ProtectedRoute`

## 3. Data Model (CAP)

Use or add these entities:

1. `QuickOrder`
- `ID : UUID`
- `orderName : String(160)`
- `orderDate : Date`
- `status : String enum { open; closed; complete; }`
- `shareBill : Boolean`
- `inviteAll : Boolean default false`
- `createdBy : String(255)`

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
- `priceSnapshot : Decimal(15,2)`

4. `QuickOrderInvite`
- `ID : UUID`
- `quickOrder : Association to QuickOrder`
- `staff : Association to Staff`

5. Reuse existing `DailyOrderBill`
- Extend `DailyOrderBill` with optional association:
  - `quickOrder : Association to QuickOrder;`
- Keep current structure for daily-order compatibility.

## 4. Service Exposure (srv/service.cds)

Expose:
- `entity QuickOrder as projection on lunch.QuickOrder`
- `entity QuickOrderFoodOption as projection on lunch.QuickOrderFoodOption`
- `entity QuickOrderChoice as projection on lunch.QuickOrderChoice`
- `entity QuickOrderInvite as projection on lunch.QuickOrderInvite`
- Reuse existing:
  - `entity DailyOrderBill as projection on lunch.DailyOrderBill`

Recommended query behavior:
- List endpoint returns `orderName`, `orderDate`, `status` and filters by invitation visibility.
- Detail endpoint expands options, creator, and choices for price display.

## 5. Backend Rules

1. Share-bill bill visibility
- When `shareBill = true`, return bill image metadata/content to authorized viewers.
- When `shareBill = false`, restrict bill image visibility to creator only.
- For Quick Orders, resolve bill by `quickOrder_ID`.

2. Invitation and visibility
- Invitable employees must come from `Staff` table.
- Creator is automatically invited to created order.
- If `inviteAll = true`, all employees can see order in list.
- If `inviteAll = false`, only creator and invited staff can see order.

3. Detail data contract
- Include:
  - order name
  - option names and prices
  - creator
  - selections with price
  - status
  - bill image reference if visible

## 6. Frontend Integration (React)

## 6.1 Routes

Add:
- `/quick-orders` -> list page
- `/quick-orders/:id` -> detail page

Both routes should use `ProtectedRoute` with access for Manager and Employee roles.

## 6.2 Suggested Files

- `src/pages/QuickOrders.tsx`
- `src/pages/QuickOrderDetail.tsx`
- `src/components/fragments/QuickOrderListTable.tsx`
- `src/components/fragments/QuickOrderOptionsTable.tsx`
- `src/components/fragments/QuickOrderBillPreview.tsx`

## 6.3 API Service Methods

Add `quickOrderService` methods in `src/services/api.ts`:
- `getAll()` for list data
- `getById(id)` for detail data
- `create(payloadWithInvitedStaff)` for creation with invite list
- `inviteAll(orderId)`
- `inviteStaff(orderId, staffIds)`

Reuse `billService` for bill image:
- `getByQuickOrder(quickOrderId)`
- `getContentUrl(billId)` for image rendering

## 7. UI Display Rules

1. List page
- Always show: order name, date, status.
- Show only orders current user can access by invitation rules.

2. Detail page
- Always show: order name, options + prices, creator, selection price, status.
- Show bill image component only when backend indicates bill is visible.

## 8. Delivery Sequence

1. Finalize CDS entities/projections.
2. Implement list/detail queries and share-bill bill-visibility checks.
3. Implement invitation filtering and create-time invited-staff persistence.
4. Add frontend routes/pages and API methods.
5. Validate role access, invitation visibility, and conditional bill image rendering.
