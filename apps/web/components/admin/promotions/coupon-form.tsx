"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function CouponForm({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [type, setType] = useState("percentage");
  const [value, setValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch("/api/promotions/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to create coupon");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      onClose();
      setCode("");
      setType("percentage");
      setValue("");
      setMinOrder("");
      setMaxDiscount("");
      setUsageLimit("");
      setStartDate("");
      setEndDate("");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (endDate && new Date(endDate) < new Date(startDate)) {
      alert("End date must be on or after the start date.");
      return;
    }
    mutation.mutate({
      code,
      type,
      value: Number(value),
      minOrder: minOrder ? Number(minOrder) : 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
      usageLimit: usageLimit ? Number(usageLimit) : undefined,
      startDate,
      endDate: endDate || undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Coupon</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Code</label>
            <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Type</label>
            <select
              className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
              <option value="free_shipping">Free Shipping</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Value</label>
            <Input type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Min Order</label>
              <Input type="number" step="0.01" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Max Discount</label>
              <Input type="number" step="0.01" value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Usage Limit</label>
            <Input type="number" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Start Date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">End Date</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
