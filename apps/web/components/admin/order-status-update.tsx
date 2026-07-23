"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const STATUSES = ["PENDING", "PAID", "PROCESSING", "COMPLETED", "FAILED", "REFUNDED"];

export function OrderStatusUpdate({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  async function handleUpdate() {
    setLoading(true);
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success("Status updated");
      router.refresh();
    } else {
      toast.error("Failed to update status");
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-3">
      <select className="rounded-lg border border-border bg-background p-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <Button variant="outline" size="sm" onClick={handleUpdate} disabled={loading || status === currentStatus}>
        {loading ? "Updating..." : "Update"}
      </Button>
    </div>
  );
}
