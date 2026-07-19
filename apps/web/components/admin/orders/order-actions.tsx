"use client";

import { useState } from "react";
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
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
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
