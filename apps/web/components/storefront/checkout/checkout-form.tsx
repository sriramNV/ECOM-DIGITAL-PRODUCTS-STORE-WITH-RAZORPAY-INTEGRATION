"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { RazorpayButton } from "./razorpay-button";

export function CheckoutForm() {
  const [address, setAddress] = useState({
    name: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
  });

  const isComplete = address.name && address.email && address.phone && address.street && address.city && address.state && address.pincode;

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-surface rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Shipping Address</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-2">
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <Input placeholder="John Doe" value={address.name} onChange={update("name")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input type="email" placeholder="john@example.com" value={address.email} onChange={update("email")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Phone</label>
              <Input type="tel" placeholder="9876543210" value={address.phone} onChange={update("phone")} />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <label className="text-sm font-medium text-foreground">Street Address</label>
              <Input placeholder="123 Main St" value={address.street} onChange={update("street")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">City</label>
              <Input placeholder="Mumbai" value={address.city} onChange={update("city")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">State</label>
              <Input placeholder="Maharashtra" value={address.state} onChange={update("state")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Pincode</label>
              <Input placeholder="400001" value={address.pincode} onChange={update("pincode")} />
            </div>
          </div>
        </div>
      </div>
      <div className="lg:col-span-2">
        <div className="bg-surface rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Payment</h2>
          <RazorpayButton shippingAddress={address as unknown as Record<string, unknown>} disabled={!isComplete} />
        </div>
      </div>
    </div>
  );
}
