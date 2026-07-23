"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function DeleteAccountButton() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });
      if (res.ok) {
        toast.success("Account deleted");
        signOut({ callbackUrl: "/" });
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to delete account");
      }
    } catch {
      toast.error("Something went wrong");
    }
    setDeleting(false);
  }

  return (
    <div className="rounded-xl border border-red-500/30 p-6">
      <h3 className="text-lg font-semibold text-red-500">Delete Account</h3>
      <p className="mt-1 text-sm text-muted-foreground">Permanently delete your account and all associated data. This action cannot be undone.</p>
      {!showConfirm ? (
        <Button variant="outline" size="sm" className="mt-4 border-red-500/50 text-red-500 hover:bg-red-500/10" onClick={() => setShowConfirm(true)}>
          Delete Account
        </Button>
      ) : (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-red-500">Are you sure? All orders, downloads, and personal data will be permanently removed.</p>
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" disabled={deleting} onClick={handleDelete}>
              {deleting ? "Deleting..." : "Yes, Delete Everything"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function DownloadAllButton() {
  const [loading, setLoading] = useState(false);

  async function handleDownloadAll() {
    setLoading(true);
    try {
      const res = await fetch("/api/account/download-all");
      if (!res.ok) throw new Error();
      const data = await res.json();

      if (data.downloads.length === 0) {
        toast.error("No downloadable files found");
        return;
      }

      for (const dl of data.downloads) {
        window.open(dl.url, "_blank");
      }
      toast.success(`Opening ${data.downloads.length} download(s)`);
    } catch {
      toast.error("Failed to fetch downloads");
    }
    setLoading(false);
  }

  return (
    <Button size="sm" variant="outline" disabled={loading} onClick={handleDownloadAll}>
      {loading ? "Loading..." : "Download All Purchased Files"}
    </Button>
  );
}
