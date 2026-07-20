"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VariantManager, type Variant } from "@/components/admin/products/variant-manager";

type Props = {
  slug?: string;
};

export function ProductForm({ slug }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = !!slug;

  const { data: product } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetch(`/api/products/${slug}`).then((r) => r.json()),
    enabled: isEdit,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => fetch("/api/categories").then((r) => r.json()),
  });

  const [title, setTitle] = useState(product?.title ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [basePrice, setBasePrice] = useState(product?.basePrice?.toString() ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [imageUrls, setImageUrls] = useState<string[]>(
    product?.images?.map((i: { url: string }) => i.url) ?? [""]
  );
  const [variants, setVariants] = useState<Variant[]>(product?.variants ?? []);

  useEffect(() => {
    if (product) {
      setTitle(product.title ?? "");
      setDescription(product.description ?? "");
      setBasePrice(product.basePrice?.toString() ?? "");
      setCategoryId(product.categoryId ?? "");
      setImageUrls(product?.images?.map((i: { url: string }) => i.url) ?? [""]);
      setVariants(product?.variants ?? []);
    }
  }, [product]);

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch(isEdit ? `/api/products/${slug}` : "/api/products", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to save product");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      router.push("/admin/products");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate({
      title,
      description,
      basePrice: Number(basePrice),
      categoryId: categoryId || null,
      images: imageUrls.filter(Boolean).map((url) => ({ url })),
      variants,
    });
  }

  function addImageUrl() {
    setImageUrls([...imageUrls, ""]);
  }

  function updateImageUrl(index: number, url: string) {
    setImageUrls(imageUrls.map((u, i) => (i === index ? url : u)));
  }

  function removeImageUrl(index: number) {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          {isEdit ? "Edit Product" : "New Product"}
        </h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-1">Description</label>
          <textarea
            className="h-24 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Base Price</label>
            <Input
              type="number"
              step="0.01"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Category</label>
            <select
              className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">No category</option>
              {(categories ?? []).map((cat: { id: string; name: string }) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-foreground">Images</label>
            <Button type="button" variant="outline" size="sm" onClick={addImageUrl}>
              + Add Image
            </Button>
          </div>
          <div className="space-y-2">
            {imageUrls.map((url, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  placeholder="Image URL"
                  value={url}
                  onChange={(e) => updateImageUrl(i, e.target.value)}
                  className="flex-1"
                />
                {imageUrls.length > 1 && (
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeImageUrl(i)}>
                    ✕
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-4">
          <VariantManager variants={variants} onChange={setVariants} />
        </div>
      </div>
    </form>
  );
}
