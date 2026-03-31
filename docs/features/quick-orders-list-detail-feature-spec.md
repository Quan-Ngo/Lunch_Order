# Quick Orders List and Detail Feature Spec

## 1. Purpose

Provide a Quick Orders experience where Managers and Employees can:
- View a list of existing Quick Orders.
- Open an order to view detailed information.
- View uploaded bill image only when share-bill is enabled.

## 2. Roles

- `Manager`
- `Employee`

Both roles can access the same list and detail screens for this feature scope.

## 3. Screens

## 3.1 Quick Orders List Screen

Display list of Quick Orders that have been created.

Each row shows:
- Order name
- Date
- Status (`open`, `closed`, `complete`)

Behavior:
- Only invited users can see an order in this list.
- Creator is automatically invited to their own order.
- Creator can choose "invite all" during creation so any employee can see the order.
- Clicking a row opens the selected order detail page.

## 3.2 Quick Order Detail Screen

Display:
- Order name
- Food options available for selection + each option price
- Order creator
- Bill image (only if an image exists and the order is `shareBill = true`)
- Price of selections
- Order status (`open`, `closed`, `complete`)

Creation requirement impacting visibility:
- Invitable employees are restricted to users from the `Staff` table.

## 4. Share-Bill Visibility Rule

- If `shareBill = true` and a bill image is uploaded: show bill image in detail.
- If `shareBill = false`: do not show bill image to other users.
- If no image is uploaded: show no bill preview.

## 5. Acceptance Criteria

1. Creator can select invited employees when creating a Quick Order.
2. Invitable employees are limited to records in `Staff`.
3. Creator is auto-invited to newly created order.
4. Creator can use invite-all option to make order visible to all employees.
5. List screen shows only orders current user is invited to.
6. List screen displays order name, date, and status for each visible Quick Order.
7. Clicking an order opens detail for the selected order.
8. Detail screen displays order name, options with prices, creator, selection price, and status.
9. Bill image is shown only when both conditions are true: bill exists and `shareBill = true`.
10. Status is displayed using values: `open`, `closed`, `complete`.
