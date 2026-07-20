import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SignOutButton } from "./sign-out-button";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-foreground mb-8">My Account</h1>

      <div className="space-y-6">
        <section className="rounded-lg border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Profile</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-foreground-muted">Name</dt>
              <dd className="text-foreground">{session.user.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-sm text-foreground-muted">Email</dt>
              <dd className="text-foreground">{session.user.email}</dd>
            </div>
            <div>
              <dt className="text-sm text-foreground-muted">Role</dt>
              <dd className="text-foreground">{session.user.role}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-lg border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Orders</h2>
          <p className="text-sm text-foreground-muted">No orders yet.</p>
        </section>

        <div className="flex justify-end">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
