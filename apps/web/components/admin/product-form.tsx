"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Props {
  product?: any;
  categories: any[];
  isNew: boolean;
}

export function ProductForm({ product, categories, isNew }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: product?.title || "",
    slug: product?.slug || "",
    description: product?.description || "",
    price: product?.price?.toString() || "",
    salePrice: product?.salePrice?.toString() || "",
    categoryId: product?.categoryId || "",
    isActive: product?.isActive ?? true,
  });
  const [images, setImages] = useState<{ url: string; alt: string }[]>(
    product?.images?.map((img: any) => ({ url: img.url, alt: img.alt || "" })) || [{ url: "", alt: "" }]
  );

  function updateImage(index: number, field: "url" | "alt", value: string) {
    setImages((prev) => prev.map((img, i) => (i === index ? { ...img, [field]: value } : img)));
  }

  function addImage() {
    setImages((prev) => [...prev, { url: "", alt: "" }]);
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const body = {
      ...form,
      price: parseFloat(form.price),
      salePrice: form.salePrice ? parseFloat(form.salePrice) : null,
      imageUrls: images.filter((img) => img.url.trim()),
    };

    const res = await fetch(isNew ? "/api/admin/products" : `/api/admin/products/${product.slug}`, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      toast.success(isNew ? "Product created" : "Product updated");
      router.push("/admin/products");
      router.refresh();
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to save product");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div><label className="mb-1 block text-sm font-medium">Title</label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
      <div><label className="mb-1 block text-sm font-medium">Slug</label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required /></div>
      <div><label className="mb-1 block text-sm font-medium">Description</label><textarea className="w-full rounded-lg border border-border bg-background p-3 text-sm" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="mb-1 block text-sm font-medium">Price (₹)</label><Input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></div>
        <div><label className="mb-1 block text-sm font-medium">Sale Price (optional)</label><Input type="number" step="0.01" min="0" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} /></div>
      </div>
      <div><label className="mb-1 block text-sm font-medium">Category</label>
        <select className="w-full rounded-lg border border-border bg-background p-3 text-sm" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
          <option value="">None</option>
          {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
        Active
      </label>
      <div className="rounded-xl border border-border p-4">
        <h3 className="mb-4 font-medium">Product Images</h3>
        <div className="space-y-3">
          {images.map((img, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <Input placeholder="Image URL" value={img.url} onChange={(e) => updateImage(i, "url", e.target.value)} />
                <Input placeholder="Alt text (optional)" value={img.alt} onChange={(e) => updateImage(i, "alt", e.target.value)} />
              </div>
              {images.length > 1 && (
                <Button type="button" variant="outline" size="sm" onClick={() => removeImage(i)} className="mt-0">Remove</Button>
              )}
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addImage} className="mt-3">Add Image</Button>
      </div>
      {!isNew && product && (
        <div className="rounded-xl border border-border p-4">
          <h3 className="mb-4 font-medium">File Upload</h3>
          <FileUpload slug={product.slug} />
        </div>
      )}
      <Button type="submit" disabled={loading}>{loading ? "Saving..." : isNew ? "Create Product" : "Update Product"}</Button>
    </form>
  );
}

function FileUpload({ slug }: { slug: string }) {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/admin/products/${slug}/upload`, { method: "POST", body: formData });
      if (res.ok) {
        toast.success("File uploaded");
      } else {
        const err = await res.json();
        toast.error(err.error || "Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    }
    setUploading(false);
  }

  return (
    <div className="flex items-center gap-3">
      <input type="file" accept=".zip" className="text-sm" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <Button type="button" variant="outline" size="sm" disabled={!file || uploading} onClick={handleUpload}>
        {uploading ? "Uploading..." : "Upload"}
      </Button>
    </div>
  );
}
