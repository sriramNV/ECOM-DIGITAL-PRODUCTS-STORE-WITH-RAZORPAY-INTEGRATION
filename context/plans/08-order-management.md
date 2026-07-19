# Phase 4b — Order Management

## Objective

Build the admin order management interface — list all orders with filtering, view order details with full timeline, and perform actions (fulfill, cancel, refund, edit shipping). Every action is audit-logged.

---

## System Design

### Order List View

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Orders                              [Search] [Status ▼] [Date ▼] [Export] │
├─────────────────────────────────────────────────────────────────────────┤
│ ☐ │ Order # │ Customer │ Date │ Items │ Total │ Status │ Payment │ Actions │
│ ──┼─────────┼──────────┼──────┼───────┼───────┼────────┼─────────┼────────│
│ ☐ │ POD-1001│ John D.  │ 19 Jul │ 3    │ ₹1,896│ ● Paid │ Razorpay│ [⋮]   │
│ ☐ │ POD-1002│ Jane S.  │ 18 Jul │ 1    │ ₹699  │ ■ Ship │ Razorpay│ [⋮]   │
│ ☐ │ POD-1003│ Bob M.   │ 17 Jul │ 2    │ ₹1,200│ ▲ Proc │ Razorpay│ [⋮]   │
│ ☐ │ POD-1004│ Alice K. │ 16 Jul │ 5    │ ₹3,500│ ✕ Canc │ Razorpay│ [⋮]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                  Page 1 of 5  [1] [2] [3] [...] [5]     │
└─────────────────────────────────────────────────────────────────────────┘
```

### Order Detail View

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Order POD-1001                          [Mark Shipped] [Cancel] [Refund]│
├─────────────────────────────────────────────────────────────────────────┤
│ Customer Info         │ Order Items                       │ Timeline    │
│ ───────────────       │ ────────────                      │ ────────    │
│ Name: John Doe        │ Classic Tee - Black / M × 2       │ ✓ Paid      │
│ Email: john@x.com     │   ₹699 × 2 = ₹1,398               │  19 Jul 2pm │
│ Phone: +91 9876543210 │                                   │             │
│                       │ Mug - White × 1                   │ ◆ Printing  │
│ Shipping Address      │   ₹499 × 1 = ₹499                 │  19 Jul 3pm │
│ ───────────────       │                                   │             │
│ 123 Main St           │ ───────────────────────           │ □ Shipped   │
│ Mumbai, Maharashtra   │ Subtotal:    ₹1,897               │             │
│ 400001, India         │ Shipping:     ₹99                 │ □ Delivered │
│                       │ Total:       ₹1,996               │             │
│                       │                                   │             │
│ Payment               │ Printify Order: #POD-abc123       │             │
│ Razorpay ID: pay_XyZ  │ Tracking: USPS 1Z999AA1012345678 │             │
│ Status: Completed     │                                   │             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Architecture

### Data Table Component

The order list uses a shared `DataTable` component designed for reusability across all admin modules:

```tsx
// components/ui/data-table.tsx
type Column<T> = {
  key: string;
  header: string;
  cell: (item: T) => React.ReactNode;
  sortable?: boolean;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  onSort?: (key: string, direction: "asc" | "desc") => void;
  onRowClick?: (item: T) => void;
  selectable?: boolean;
  loading?: boolean;
  emptyState?: React.ReactNode;
};
```

### Order API Routes

```
GET  /api/admin/orders?page=1&limit=20&status=paid&search=john&sort=createdAt_desc
GET  /api/admin/orders/[id]
PUT  /api/admin/orders/[id]/status    → Update status (with validation)
POST /api/admin/orders/[id]/cancel    → Cancel + refund
POST /api/admin/orders/[id]/refund    → Refund via Razorpay
```

### Order Repository

```typescript
// lib/repositories/order-repo.ts
export const orderRepo = {
  list(filters: {
    page: number;
    limit: number;
    status?: OrderStatus;
    search?: string;
    sortBy?: string;
    sortDir?: "asc" | "desc";
  }) {
    // Paginated query with optional filters
  },

  getById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        payments: true,
        statusHistory: { orderBy: { createdAt: "desc" } },
        user: { select: { id: true, name: true, email: true, phone: true } },
        coupon: true,
      },
    });
  },

  updateStatus(id: string, status: OrderStatus, note?: string) {
    return prisma.$transaction([
      prisma.order.update({ where: { id }, data: { status } }),
      prisma.orderStatusHistory.create({
        data: { orderId: id, status, note },
      }),
    ]);
  },
};
```

### Order Actions

**Fulfill (Mark Shipped):**
```
Admin clicks "Mark Shipped"
    → Dialog asks for tracking number (optional)
    → PUT /api/admin/orders/[id]/status { status: SHIPPED }
    → Audit log entry created
    → Email sent to customer
```

**Cancel:**
```
Admin clicks "Cancel"
    → Confirmation dialog (reason required)
    → POST /api/admin/orders/[id]/cancel
    → If payment already captured:
        → Initiate Razorpay refund
        → Update order status to REFUNDED
    → If payment not captured:
        → Void Razorpay order
        → Update order status to CANCELLED
    → Audit log entry created
    → Email sent to customer
```

**Refund:**
```
Admin clicks "Refund"
    → Dialog: amount, reason
    → POST /api/admin/orders/[id]/refund
    → Call Razorpay refund API
    → Update order status to REFUNDED
    → Create Refund record in DB
    → Audit log entry created
    → Email sent to customer
```

### Audit Logging

Every order action is logged:

```typescript
// lib/repositories/audit-repo.ts
model AuditLog {
  id        String   @id @default(cuid())
  userId    String
  action    String                     // "order.cancel", "order.refund", etc.
  entity    String                     // "order"
  entityId  String                     // the order ID
  metadata  Json?                      // { reason, amount, etc. }
  ip        String?
  createdAt DateTime @default(now())
}
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Table implementation | Reusable DataTable component | Consistent across all admin modules |
| Status transitions | Strict enum — only valid transitions allowed | Prevents invalid state changes |
| Cancel timing | Only if not yet shipped | After shipping, must go through Printify |
| Refund processing | Via Razorpay API | Automatic, no manual bank transfers |
| Audit logging | Every order action logged immutably | Compliance, debugging, accountability |
| Printify order link | Stored in DB, clickable in UI | Quick access to Printify dashboard |
| Email notifications | Triggered on status change | Automatic, no manual "notify customer" step |

---

## Steps

1. Update Prisma schema with `AuditLog` model (if not already)
2. Run `pnpm prisma:migrate dev --name add-audit-log`
3. Create `lib/repositories/audit-repo.ts`
4. Update `lib/repositories/order-repo.ts` with admin query methods
5. Create `app/api/admin/orders/route.ts` (list with filters)
6. Create `app/api/admin/orders/[id]/route.ts` (get detail)
7. Create `app/api/admin/orders/[id]/status/route.ts` (update status)
8. Create `app/api/admin/orders/[id]/cancel/route.ts`
9. Create `app/api/admin/orders/[id]/refund/route.ts`
10. Create `components/ui/data-table.tsx` (reusable table)
11. Create `components/admin/orders/order-table.tsx`
12. Create `components/admin/orders/order-detail.tsx`
13. Create `components/admin/orders/order-status-badge.tsx`
14. Create `components/admin/orders/order-actions.tsx` (status change, cancel, refund)
15. Create `app/admin/orders/page.tsx`
16. Create `app/admin/orders/[id]/page.tsx`
17. Verify: list orders, filter by status, view detail, cancel order, refund

---

## Files Created

| File | Content |
|------|---------|
| `prisma/schema.prisma` (updated) | AuditLog model |
| `lib/repositories/audit-repo.ts` | Audit log queries |
| `lib/repositories/order-repo.ts` (updated) | Admin order queries |
| `app/api/admin/orders/route.ts` | Order list API |
| `app/api/admin/orders/[id]/route.ts` | Order detail API |
| `app/api/admin/orders/[id]/status/route.ts` | Status update |
| `app/api/admin/orders/[id]/cancel/route.ts` | Cancel order |
| `app/api/admin/orders/[id]/refund/route.ts` | Refund order |
| `components/ui/data-table.tsx` | Reusable data table |
| `components/admin/orders/order-table.tsx` | Order list table |
| `components/admin/orders/order-detail.tsx` | Order detail view |
| `components/admin/orders/order-status-badge.tsx` | Status pill |
| `components/admin/orders/order-actions.tsx` | Action buttons/dialogs |
| `app/admin/orders/page.tsx` | Order list page |
| `app/admin/orders/[id]/page.tsx` | Order detail page |
