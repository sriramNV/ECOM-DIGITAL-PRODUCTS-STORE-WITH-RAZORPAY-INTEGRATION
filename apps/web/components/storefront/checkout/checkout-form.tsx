"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { RazorpayButton } from "./razorpay-button";
import { useCartStore } from "@/stores/cart-store";

export function CheckoutForm() {
  const setItems = useCartStore((s) => s.setItems);
  const items = useCartStore((s) => s.items);

  useEffect(() => {
    const stored = localStorage.getItem("pod-guest-cart");
    if (stored && items.length === 0) {
      try {
        const guestItems = JSON.parse(stored);
        if (Array.isArray(guestItems) && guestItems.length > 0) {
          setItems(guestItems);
        }
      } catch { /* ignore */ }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [address, setAddress] = useState({
    fullName: "",
    email: "",
    phone: "",
    addressLine1: "",
    city: "",
    state: "",
    pincode: "",
    country: "IN",
  });

  const isComplete = address.fullName && address.email && address.phone && address.addressLine1 && address.city && address.state && address.pincode;

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-surface-raised border border-border rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-3 pb-1">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-accent text-accent-foreground text-xs font-semibold">1</span>
            <h2 className="text-base font-semibold text-foreground">Shipping Address</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <Input placeholder="John Doe" value={address.fullName} onChange={update("fullName")} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input type="email" placeholder="john@example.com" value={address.email} onChange={update("email")} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Phone</label>
              <Input type="tel" placeholder="9876543210" value={address.phone} onChange={update("phone")} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-foreground">Address</label>
              <Input placeholder="123 Main St" value={address.addressLine1} onChange={update("addressLine1")} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">City</label>
              <Input placeholder="Mumbai" value={address.city} onChange={update("city")} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">State</label>
              <Input placeholder="Maharashtra" value={address.state} onChange={update("state")} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Pincode</label>
              <Input placeholder="400001" value={address.pincode} onChange={update("pincode")} />
            </div>
          </div>
        </div>
      </div>
      <div className="lg:col-span-2">
        <div className="bg-surface-raised border border-border rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-3 pb-1">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-accent text-accent-foreground text-xs font-semibold">2</span>
            <h2 className="text-base font-semibold text-foreground">Payment</h2>
          </div>
          <RazorpayButton shippingAddress={address as unknown as Record<string, unknown>} disabled={!isComplete} />
        </div>
      </div>
    </div>
  );
}
