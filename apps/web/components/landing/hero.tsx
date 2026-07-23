"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";

export function Hero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(rgba(0,240,255,0.07)_1px,transparent_1px)] bg-[length:30px_30px]" />
      <motion.div className="absolute left-20 top-20 h-32 w-32 rounded-xl border border-primary/20"
        animate={{ rotate: 360, y: [0, -20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }} />
      <motion.div className="absolute right-20 bottom-20 h-24 w-24 rounded-full border border-accent/20"
        animate={{ y: [0, -30, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />

      <motion.div style={{ y, opacity }} className="relative z-10 max-w-4xl px-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-6 text-5xl font-bold tracking-tight md:text-7xl"
        >
          Premium{" "}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Digital Products
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground"
        >
          E-books, templates, software, and more — download your purchases anytime.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex justify-center gap-4"
        >
          <Link href="/products"><Button size="lg" className="animate-glow-pulse">Browse Products</Button></Link>
          <Link href="/auth/register"><Button variant="outline" size="lg">Get Started</Button></Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
