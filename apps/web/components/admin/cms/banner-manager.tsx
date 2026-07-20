"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

type Banner = {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  position: string;
  order: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
};

export function BannerManager() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Banner> | null>(null);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [position, setPosition] = useState("hero");
  const [order, setOrder] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);

  const { data: banners, isLoading } = useQuery({
    queryKey: ["cms-banners"],
    queryFn: () => fetch("/api/cms/banners").then((r) => r.json()),
  });

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch(editing?.id ? `/api/cms/banners?id=${editing.id}` : "/api/cms/banners", {
        method: editing?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to save banner");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-banners"] });
      closeDialog();
    },
  });

  function openNew() {
    setEditing(null);
    setTitle("");
    setImageUrl("");
    setLinkUrl("");
    setPosition("hero");
    setOrder(0);
    setStartDate("");
    setEndDate("");
    setIsActive(true);
    setDialogOpen(true);
  }

  function openEdit(banner: Banner) {
    setEditing(banner);
    setTitle(banner.title);
    setImageUrl(banner.imageUrl);
    setLinkUrl(banner.linkUrl ?? "");
    setPosition(banner.position);
    setOrder(banner.order);
    setStartDate(banner.startDate ?? "");
    setEndDate(banner.endDate ?? "");
    setIsActive(banner.isActive);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
  }

  function handleSave() {
    mutation.mutate({
      title,
      imageUrl,
      linkUrl: linkUrl || null,
      position,
      order: Number(order),
      startDate: startDate || null,
      endDate: endDate || null,
      isActive,
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-foreground">Banners</h1>
        <Button onClick={openNew}>+ New Banner</Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 bg-surface rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={[
            { header: "Title", accessorKey: "title" },
            { header: "Position", accessorKey: "position", cell: (v: unknown) => <Badge variant="secondary">{v as string}</Badge> },
            { header: "Active", accessorKey: "isActive", cell: (v: unknown) => v ? <Badge>Active</Badge> : <Badge variant="outline">Inactive</Badge> },
            { header: "Order", accessorKey: "order" },
            { header: "Start", accessorKey: "startDate", cell: (v: unknown) => v ? formatDate(v as string) : "-" },
            { header: "End", accessorKey: "endDate", cell: (v: unknown) => v ? formatDate(v as string) : "-" },
          ]}
          data={banners ?? []}
          onRowClick={(row: Banner) => {
            openEdit(row);
          }}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={(o: boolean) => { if (!o) closeDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit Banner" : "New Banner"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium block mb-1">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Image URL</label>
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Link URL</label>
              <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">Position</label>
                <select
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                >
                  <option value="hero">Hero</option>
                  <option value="sidebar">Sidebar</option>
                  <option value="bottom">Bottom</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Order</label>
                <Input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">Start Date</label>
                <Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">End Date</label>
                <Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-border"
              />
              Active
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave} disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
