"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function CategoryManager({ categories: initial }: { categories: any[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState(initial);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [loading, setLoading] = useState(false);

  async function addCategory() {
    if (!newName || !newSlug) return;
    setLoading(true);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, slug: newSlug }),
    });
    if (res.ok) {
      const cat = await res.json();
      setCategories([...categories, cat]);
      setNewName("");
      setNewSlug("");
      toast.success("Category added");
      router.refresh();
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to add");
    }
    setLoading(false);
  }

  async function deleteCategory(id: string) {
    const res = await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setCategories(categories.filter((c: any) => c.id !== id));
      toast.success("Category deleted");
      router.refresh();
    } else {
      toast.error("Failed to delete");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Name</label>
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Category name" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Slug</label>
          <Input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="category-slug" />
        </div>
        <Button onClick={addCategory} disabled={loading || !newName || !newSlug}>Add</Button>
      </div>
      <div className="space-y-2">
        {categories.map((cat: any) => (
          <div key={cat.id} className="flex items-center justify-between rounded-lg border border-border p-3">
            <span>{cat.name} <span className="text-sm text-muted-foreground">({cat.slug})</span></span>
            <Button variant="ghost" size="sm" onClick={() => deleteCategory(cat.id)}>Delete</Button>
          </div>
        ))}
        {categories.length === 0 && <p className="text-sm text-muted-foreground">No categories yet.</p>}
      </div>
    </div>
  );
}
