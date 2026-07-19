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
import { formatDate, slugify } from "@/lib/utils";

type Collection = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  createdAt: string;
};

export function CollectionManager() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Collection> | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");

  const { data: collections, isLoading } = useQuery({
    queryKey: ["cms-collections"],
    queryFn: () => fetch("/api/cms/collections").then((r) => r.json()),
  });

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch(editing?.id ? `/api/cms/collections?id=${editing.id}` : "/api/cms/collections", {
        method: editing?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to save collection");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-collections"] });
      closeDialog();
    },
  });

  function openNew() {
    setEditing(null);
    setName("");
    setSlug("");
    setDescription("");
    setImage("");
    setDialogOpen(true);
  }

  function openEdit(collection: Collection) {
    setEditing(collection);
    setName(collection.name);
    setSlug(collection.slug);
    setDescription(collection.description ?? "");
    setImage(collection.image ?? "");
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
  }

  function handleNameChange(val: string) {
    setName(val);
    if (!editing?.id) setSlug(slugify(val));
  }

  function handleSave() {
    mutation.mutate({ name, slug, description: description || null, image: image || null });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-foreground">Collections</h1>
        <Button onClick={openNew}>+ New Collection</Button>
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
            { header: "Name", accessorKey: "name" },
            { header: "Slug", accessorKey: "slug" },
            { header: "Status", accessorKey: "isActive", cell: (v: boolean) => v ? <Badge>Active</Badge> : <Badge variant="outline">Inactive</Badge> },
            { header: "Created", accessorKey: "createdAt", cell: (v: string) => formatDate(v) },
          ]}
          data={collections ?? []}
          onRowClick={(row: Collection) => {
            openEdit(row);
          }}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={(o: boolean) => { if (!o) closeDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit Collection" : "New Collection"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium block mb-1">Name</label>
              <Input value={name} onChange={(e) => handleNameChange(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Slug</label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Description</label>
              <textarea
                className="h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Image URL</label>
              <Input value={image} onChange={(e) => setImage(e.target.value)} />
            </div>
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
