import { z } from "zod";
import { NextResponse } from "next/server";

export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): { data?: T; error?: NextResponse } {
  const result = schema.safeParse(body);
  if (!result.success) {
    return { error: NextResponse.json({ error: "Validation failed", details: result.error.errors }, { status: 400 }) };
  }
  return { data: result.data };
}

export const cartAddSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    variantId: z.string().min(1),
    quantity: z.number().int().min(1).max(99),
  })),
});

export const cartMergeSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    variantId: z.string().min(1),
    quantity: z.number().int().min(1).max(99),
  })),
});

export const couponCreateSchema = z.object({
  code: z.string().min(3).max(20).transform(s => s.toUpperCase()),
  type: z.enum(["percentage", "fixed", "free_shipping"]),
  value: z.number().min(0),
  minOrder: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).optional(),
  usageLimit: z.number().int().min(1).optional(),
  perUserLimit: z.number().int().min(1).optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
});

export const cmsPageSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  content: z.any().optional(),
  seoTitle: z.string().nullable().optional(),
  seoDesc: z.string().nullable().optional(),
  isPublished: z.boolean().optional(),
});

export const adminOrderActionSchema = z.object({
  action: z.enum(["submit_to_printify", "cancel", "mark_delivered"]),
});

export const adminSettingsSchema = z.object({
  appName: z.string().min(1).max(100).optional(),
  currency: z.string().min(1).max(10).optional(),
  supportEmail: z.string().email().optional(),
  itemsPerPage: z.string().optional(),
});

export const shippingAddressSchema = z.object({
  fullName: z.string().min(1).max(100),
  phone: z.string().regex(/^\d{10}$/, "Phone must be 10 digits"),
  addressLine1: z.string().min(1).max(200),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
  country: z.string().min(1).max(100),
  couponCode: z.string().optional(),
});

export const auditLogQuerySchema = z.object({
  action: z.string().optional(),
  entity: z.string().optional(),
  entityId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const revenueQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

export const customerQuerySchema = z.object({
  search: z.string().optional(),
});

export const orderQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().optional(),
  search: z.string().optional(),
});
