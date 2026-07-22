import { prisma } from "@/lib/prisma";
import { calculateShipping } from "./pricing-service";
import { logger } from "@/lib/logger";

type CouponResult = {
  valid: boolean;
  discount: number;
  code: string;
  error?: string;
};

type CouponOnTxResult = {
  valid: boolean;
  discount: number;
  couponId?: string;
  code?: string;
  error?: string;
};

async function validateOnTx(tx: any, code: string, subtotal: number, userId: string): Promise<CouponOnTxResult> {
  const coupon = await tx.coupon.findUnique({ where: { code: code.toUpperCase() } });

  if (!coupon || !coupon.isActive) {
    return { valid: false, discount: 0, error: "Invalid coupon code" };
  }

  const now = new Date();
  if (now < coupon.startDate || (coupon.endDate && now > coupon.endDate)) {
    return { valid: false, discount: 0, error: "Coupon has expired" };
  }

  if (subtotal < Number(coupon.minOrder)) {
    return { valid: false, discount: 0, error: `Minimum order of ₹${coupon.minOrder} required` };
  }

  if (coupon.usageLimit) {
    const usageCount = await tx.order.count({ where: { couponId: coupon.id } });
    if (usageCount >= coupon.usageLimit) {
      return { valid: false, discount: 0, error: "Coupon usage limit reached" };
    }
  }

  if (coupon.perUserLimit) {
    const userUsageCount = await tx.order.count({ where: { couponId: coupon.id, userId } });
    if (userUsageCount >= coupon.perUserLimit) {
      return { valid: false, discount: 0, error: "Coupon per-user limit reached" };
    }
  }

  let discount = 0;
  if (coupon.type === "percentage") {
    discount = Math.round((subtotal * Number(coupon.value)) / 100);
    if (coupon.maxDiscount) {
      discount = Math.min(discount, Number(coupon.maxDiscount));
    }
  } else if (coupon.type === "fixed") {
    discount = Number(coupon.value);
  } else if (coupon.type === "free_shipping") {
    discount = calculateShipping(subtotal);
  } else {
    logger.warn({ type: coupon.type }, "Unknown coupon type applied");
    return { valid: false, discount: 0, error: "Invalid coupon type" };
  }

  return { valid: true, discount, couponId: coupon.id, code: coupon.code };
}

export const couponService = {
  async validateAndApply(code: string, subtotal: number, userId: string): Promise<CouponResult> {
    return prisma.$transaction(async (tx) => {
      const result = await validateOnTx(tx, code, subtotal, userId);
      return { valid: result.valid, discount: result.discount, code: result.code ?? code, error: result.error };
    });
  },

  async validateAndApplyOnTx(tx: any, code: string, subtotal: number, userId: string): Promise<CouponOnTxResult> {
    return validateOnTx(tx, code, subtotal, userId);
  },
};
