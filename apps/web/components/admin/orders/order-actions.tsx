"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Props = {
  orderId: string;
  status: string;
};

export function OrderActions({ orderId, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleAction(action: string) {
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to update order");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update order");
    }
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      {status === "PAID" && (
        <Button size="sm" onClick={() => handleAction("submit_to_printify")} disabled={loading !== null}>
          Submit to Printify
        </Button>
      )}
      {["PAID", "PROCESSING", "PRINTING"].includes(status) && (
        <Button size="sm" variant="destructive" onClick={() => handleAction("cancel")} disabled={loading !== null}>
          Cancel
        </Button>
      )}
      {status === "SHIPPED" && (
        <Button size="sm" onClick={() => handleAction("mark_delivered")} disabled={loading !== null}>
          Mark Delivered
        </Button>
      )}
    </div>
  );
}
