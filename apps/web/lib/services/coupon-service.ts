import { couponRepo } from "@/lib/repositories/coupon-repo";

type CouponResult = {
  valid: boolean;
  discount: number;
  code: string;
  error?: string;
};

export const couponService = {
  async validateAndApply(code: string, subtotal: number, userId: string): Promise<CouponResult> {
    const coupon = await couponRepo.getByCode(code);

    if (!coupon || !coupon.isActive) {
      return { valid: false, discount: 0, code, error: "Invalid coupon code" };
    }

    const now = new Date();
    if (now < coupon.startDate || (coupon.endDate && now > coupon.endDate)) {
      return { valid: false, discount: 0, code, error: "Coupon has expired" };
    }

    if (subtotal < Number(coupon.minOrder)) {
      return { valid: false, discount: 0, code, error: `Minimum order of ₹${coupon.minOrder} required` };
    }

    if (coupon.usageLimit) {
      const usageCount = await couponRepo.getUsageCount(coupon.id);
      if (usageCount >= coupon.usageLimit) {
        return { valid: false, discount: 0, code, error: "Coupon usage limit reached" };
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
      discount = 0;
    }

    return { valid: true, discount, code: coupon.code };
  },
};
