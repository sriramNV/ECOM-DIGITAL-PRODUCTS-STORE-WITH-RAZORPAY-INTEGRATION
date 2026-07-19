import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign In — POD Store",
};

export default function LoginPage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-foreground mb-6">Sign In</h1>
      <LoginForm />
      <p className="text-sm text-foreground-muted mt-4 text-center">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-accent hover:underline">
          Sign up
        </Link>
      </p>
    </>
  );
}
