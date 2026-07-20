"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type NewsletterBlockProps = {
  content?: Record<string, unknown>;
};

export function NewsletterBlock({ content: _content }: NewsletterBlockProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) setStatus("success");
      else setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="py-12 md:py-16 bg-surface">
      <div className="max-w-xl mx-auto px-4 md:px-6 lg:px-8 text-center">
        <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
          Stay Updated
        </h2>
        <p className="text-foreground-muted mt-2">
          Subscribe to get notified about new products and exclusive offers.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 flex gap-3 max-w-md mx-auto">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1"
          />
          <Button type="submit">Subscribe</Button>
        </form>
      </div>
    </section>
  );
}
