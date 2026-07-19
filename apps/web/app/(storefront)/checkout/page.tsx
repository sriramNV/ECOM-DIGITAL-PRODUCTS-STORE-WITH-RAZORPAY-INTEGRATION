import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/storefront/checkout/checkout-form";

export const metadata = { title: "Checkout — POD Store" };

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?redirect=/checkout");

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-8">Checkout</h1>
      <CheckoutForm />
    </div>
  );
}
