# Phase 4d — Customer CRM

## Objective

Build the customer relationship management interface — view all customers, their order history, contact details, and add internal notes for tracking customer interactions.

---

## System Design

### Customer List View

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Customers                           [Search name/email...] [Export CSV] │
├─────────────────────────────────────────────────────────────────────────┤
│  Name          │ Email              │ Orders │ Spent    │ Last Order    │
│ ──────────────┼────────────────────┼────────┼──────────┼───────────────│
│  John Doe     │ john@example.com   │ 5      │ ₹8,495   │ 19 Jul 2026   │
│  Jane Smith   │ jane@example.com   │ 2      │ ₹1,398   │ 15 Jul 2026   │
│  Bob Johnson  │ bob@example.com    │ 1      │ ₹699     │ 10 Jul 2026   │
│  Alice Kumar  │ alice@example.com  │ 8      │ ₹12,490  │ 05 Jul 2026   │
├─────────────────────────────────────────────────────────────────────────┤
│                                          Page 1 of 3  [1] [2] [3]       │
└─────────────────────────────────────────────────────────────────────────┘
```

### Customer Detail View

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Alice Kumar                                                             │
├─────────────────────────────────────────────────────────────────────────┤
│  Contact Info          │ Order History                   │ Notes        │
│  ────────────          │ ──────────────                   │ ─────        │
│  Email: alice@x.com    │ POD-1008  19 Jul   ₹2,499 ● Deli │ VIP customer │
│  Phone: +91 9876543210 │ POD-1005  12 Jul   ₹1,299 ● Ship │ prefers DTG  │
│  Member since: 01/2026 │ POD-1002  28 Jun   ₹899   ● Proc │             │
│                        │ POD-0997  15 Jun   ₹3,499 ● Deli │             │
│  Total Orders: 8       │ POD-0992  01 Jun   ₹799   ● Deli │             │
│  Lifetime Value: ₹12,490│                                     │             │
│  Avg Order Value: ₹1,561│ [View All Orders →]                  │             │
│                        │                                     │             │
│  Addresses             │                                     │             │
│  ──────────            │                                     │             │
│  #1: 123 Main St       │                                     │             │
│      Mumbai, 400001    │                                     │             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Architecture

### API Routes

```
GET  /api/admin/customers                  → List customers (search, pagination, sort)
GET  /api/admin/customers/[id]             → Customer detail with orders
GET  /api/admin/customers/[id]/orders      → Customer order history
POST /api/admin/customers/[id]/notes       → Add internal note
```

### Repository

```typescript
// lib/repositories/customer-repo.ts
export const customerRepo = {
  list(filters: {
    page: number;
    limit: number;
    search?: string;        // name or email
    sortBy?: string;        // "orders", "spent", "lastOrder"
    sortDir?: "asc" | "desc";
  }) {
    return prisma.user.findMany({
      where: {
        role: "CUSTOMER",
        OR: filters.search
          ? [
              { name: { contains: filters.search, mode: "insensitive" } },
              { email: { contains: filters.search, mode: "insensitive" } },
            ]
          : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        _count: { select: { orders: true } },
        orders: {
          select: { totalAmount: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: buildOrderBy(filters.sortBy, filters.sortDir),
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    });
  },

  getById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        orders: {
          include: {
            items: true,
            payments: true,
          },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { orders: true } },
      },
    });
  },

  addNote(customerId: string, note: string, adminId: string) {
    return prisma.customerNote.create({
      data: {
        customerId,
        note,
        addedBy: adminId,
      },
    });
  },
};
```

### Prisma Models

```prisma
// Add to existing User model
model CustomerNote {
  id         String   @id @default(cuid())
  customerId String
  note       String   @db.Text
  addedBy    String
  createdAt  DateTime @default(now())

  customer User @relation("CustomerNotes", fields: [customerId], references: [id], onDelete: Cascade)
  author   User @relation("NoteAuthor", fields: [addedBy], references: [id])
}
```

### Customer Stats

Computed from order data:

```typescript
type CustomerStats = {
  totalOrders: number;
  lifetimeValue: number;      // sum of all order totals
  avgOrderValue: number;      // lifetimeValue / totalOrders
  lastOrderDate: Date | null;
  ordersByStatus: Record<OrderStatus, number>;
};
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Customer source | Created at registration, enriched by orders | No separate customer import needed |
| Customer identification | email (unique on User) | Primary key for linking orders to customers |
| Guest checkout | Allowed, but no CRM profile | Guest orders linked to email only, not user account |
| Notes | Internal only (not visible to customer) | Admin-only CRM tool |
| CSV export | Future consideration (not MVP) | Add when needed |
| Segmentation | By order count, spend, recency | Basic segments: VIP (>5 orders), Active, At-risk |

---

## Steps

1. Update Prisma schema with `CustomerNote` model
2. Run `pnpm prisma:migrate dev --name add-customer-notes`
3. Create `lib/repositories/customer-repo.ts`
4. Create `app/api/admin/customers/route.ts` (list)
5. Create `app/api/admin/customers/[id]/route.ts` (detail)
6. Create `app/api/admin/customers/[id]/orders/route.ts` (order history)
7. Create `app/api/admin/customers/[id]/notes/route.ts` (add note)
8. Create `components/admin/crm/customer-table.tsx`
9. Create `components/admin/crm/customer-detail.tsx` (profile + orders + stats)
10. Create `components/admin/crm/customer-notes.tsx` (view + add notes)
11. Create `app/admin/customers/page.tsx`
12. Create `app/admin/customers/[id]/page.tsx`
13. Verify: view customer list, search, view detail with orders, add note

---

## Files Created

| File | Content |
|------|---------|
| `prisma/schema.prisma` (updated) | CustomerNote model |
| `lib/repositories/customer-repo.ts` | Customer queries |
| `app/api/admin/customers/route.ts` | Customer list API |
| `app/api/admin/customers/[id]/route.ts` | Customer detail API |
| `app/api/admin/customers/[id]/orders/route.ts` | Order history API |
| `app/api/admin/customers/[id]/notes/route.ts` | Notes API |
| `components/admin/crm/customer-table.tsx` | Customer list table |
| `components/admin/crm/customer-detail.tsx` | Customer detail view |
| `components/admin/crm/customer-notes.tsx` | Notes widget |
| `app/admin/customers/page.tsx` | Customer list page |
| `app/admin/customers/[id]/page.tsx` | Customer detail page |
