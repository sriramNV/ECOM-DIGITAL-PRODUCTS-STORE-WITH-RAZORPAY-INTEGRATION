"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

export function CtaSection() {
  const { data: session } = useSession();

  if (session) return null;

  return (
    <section className="border-t border-border py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mx-auto max-w-3xl px-4 text-center"
      >
        <h2 className="mb-4 text-3xl font-bold">Ready to start your collection?</h2>
        <p className="mb-8 text-muted-foreground">Create an account and get instant access to your purchases, anytime.</p>
        <Link href="/auth/register"><Button size="lg">Create Account</Button></Link>
      </motion.div>
    </section>
  );
}
