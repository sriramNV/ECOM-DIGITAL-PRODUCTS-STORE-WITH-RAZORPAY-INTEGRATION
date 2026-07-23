"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download } from "lucide-react";

export function DownloadButton({ orderId, itemId }: { orderId: string; itemId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/download/${itemId}`);
      if (!res.ok) {
        const err = await res.json();
        if (res.status === 429) {
          toast.error("Download limit reached. Try again later.");
        } else {
          toast.error(err.error || "Download failed");
        }
        setLoading(false);
        return;
      }

      const data = await res.json();
      const a = document.createElement("a");
      a.href = data.url;
      a.download = data.fileName || "download.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (data.remaining !== undefined) {
        toast.success(`Downloading... ${data.remaining} downloads remaining this hour`);
      }
    } catch {
      toast.error("Download failed");
    }
    setLoading(false);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDownload} disabled={loading}>
      <Download className="mr-2 h-4 w-4" />
      {loading ? "Preparing..." : "Download"}
    </Button>
  );
}
