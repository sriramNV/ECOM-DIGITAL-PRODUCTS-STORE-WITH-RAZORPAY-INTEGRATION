import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Sign Up — POD Store",
};

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-foreground mb-6">Create Account</h1>
      <RegisterForm />
      <p className="text-sm text-foreground-muted mt-4 text-center">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
