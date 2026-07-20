"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Settings = {
  appName: string;
  currency: string;
  supportEmail: string;
  itemsPerPage: string;
};

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Settings | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => fetch("/api/admin/settings").then((r) => r.json()) as Promise<Settings>,
  });

  const mutation = useMutation({
    mutationFn: (body: Settings) =>
      fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    },
  });

  if (isLoading || !settings) {
    return <p className="text-foreground-muted py-8 text-center">Loading…</p>;
  }

  const current = form ?? settings;

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">App Name</label>
          <Input
            value={current.appName}
            onChange={(e) => setForm({ ...current, appName: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Currency</label>
          <Input
            value={current.currency}
            onChange={(e) => setForm({ ...current, currency: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Support Email</label>
          <Input
            value={current.supportEmail}
            onChange={(e) => setForm({ ...current, supportEmail: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Items Per Page</label>
          <Input
            value={current.itemsPerPage}
            onChange={(e) => setForm({ ...current, itemsPerPage: e.target.value })}
          />
        </div>

        <Button
          onClick={() => mutation.mutate(current)}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Saving…" : "Save Settings"}
        </Button>

        {mutation.isSuccess && (
          <p className="text-green-600 text-sm">Settings saved. Restart required for full effect.</p>
        )}
        {mutation.isError && (
          <p className="text-red-600 text-sm">Failed to save settings.</p>
        )}
      </div>
    </div>
  );
}
