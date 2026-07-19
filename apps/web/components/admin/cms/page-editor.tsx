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
import { BlockPalette } from "./block-palette";
import { formatDate } from "@/lib/utils";

type Block = {
  type: string;
  content: Record<string, unknown>;
};

type Page = {
  id: string;
  title: string;
  slug: string;
  content: Block[];
  seoTitle?: string;
  seoDesc?: string;
  isPublished: boolean;
  updatedAt: string;
};

const defaultContent: Record<string, Record<string, unknown>> = {
  hero: { heading: "", subtitle: "", ctaText: "", ctaLink: "" },
  text: { content: "" },
  "product-grid": { collectionSlug: "" },
  "cta-banner": { text: "", buttonText: "", buttonLink: "" },
  newsletter: {},
};

export function PageEditor() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Partial<Page> | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [activeTab, setActiveTab] = useState<"edit" | "blocks">("edit");

  const { data: pages, isLoading } = useQuery({
    queryKey: ["cms-pages"],
    queryFn: () => fetch("/api/cms/pages").then((r) => r.json()),
  });

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch(editingPage?.id ? `/api/cms/pages/${editingPage.id}` : "/api/cms/pages", {
        method: editingPage?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to save page");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] });
      closeDialog();
    },
  });

  function openNew() {
    setEditingPage(null);
    setTitle("");
    setSlug("");
    setSeoTitle("");
    setSeoDesc("");
    setIsPublished(false);
    setBlocks([]);
    setActiveTab("edit");
    setDialogOpen(true);
  }

  function openEdit(page: Page) {
    setEditingPage(page);
    setTitle(page.title);
    setSlug(page.slug);
    setSeoTitle(page.seoTitle ?? "");
    setSeoDesc(page.seoDesc ?? "");
    setIsPublished(page.isPublished);
    setBlocks(page.content ?? []);
    setActiveTab("edit");
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingPage(null);
  }

  function handleSave() {
    mutation.mutate({
      title,
      slug,
      seoTitle: seoTitle || null,
      seoDesc: seoDesc || null,
      isPublished,
      content: blocks,
    });
  }

  function handleAddBlock(type: string) {
    setBlocks([...blocks, { type, content: { ...(defaultContent[type] ?? {}) } }]);
  }

  function handleDeleteBlock(index: number) {
    setBlocks(blocks.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-foreground">Pages</h1>
        <Button onClick={openNew}>+ New Page</Button>
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
            { header: "Slug", accessorKey: "slug" },
            { header: "Status", accessorKey: "isPublished", cell: (v: boolean) => v ? "Published" : "Draft" },
            { header: "Updated", accessorKey: "updatedAt", cell: (v: string) => formatDate(v) },
          ]}
          data={pages ?? []}
          onRowClick={(row: Page) => {
            openEdit(row);
          }}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={(o: boolean) => { if (!o) closeDialog(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPage?.id ? "Edit Page" : "New Page"}</DialogTitle>
          </DialogHeader>

          <div className="flex gap-1 border-b border-border">
            {(["edit", "blocks"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm -mb-px border-b-2 capitalize ${
                  activeTab === tab
                    ? "border-foreground text-foreground"
                    : "border-transparent text-foreground-muted"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "edit" ? (
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium block mb-1">Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Slug</label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">SEO Title</label>
                <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">SEO Description</label>
                <textarea
                  className="h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring"
                  value={seoDesc}
                  onChange={(e) => setSeoDesc(e.target.value)}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="rounded border-border"
                />
                Published
              </label>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <BlockPalette onAddBlock={handleAddBlock} />
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {blocks.length === 0 ? (
                  <p className="text-sm text-foreground-muted py-4 text-center">
                    No blocks yet. Add one from the palette above.
                  </p>
                ) : (
                  blocks.map((block, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 border border-border rounded-lg bg-surface"
                    >
                      <div>
                        <span className="text-sm font-medium capitalize">{block.type}</span>
                        <p className="text-xs text-foreground-muted truncate max-w-60">
                          {JSON.stringify(block.content)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteBlock(i)}
                        className="text-xs text-destructive hover:text-destructive/80"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
