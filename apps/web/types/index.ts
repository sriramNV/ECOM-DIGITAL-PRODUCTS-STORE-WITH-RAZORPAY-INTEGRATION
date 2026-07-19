export type Role = "ADMIN" | "CUSTOMER";

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PROCESSING"
  | "PRINTING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

export type { CartItem } from "./cart";

export type Address = {
  name: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone: string;
};
