import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

type Props = { searchParams: Promise<{ orderId?: string }> };

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { orderId } = await searchParams;

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-foreground mb-2">Order Confirmed!</h1>
      {orderId && <p className="text-sm text-foreground-muted mb-6">Order ID: {orderId}</p>}
      <p className="text-sm text-foreground-muted mb-8">
        Thank you for your purchase. You&apos;ll receive a confirmation email shortly.
      </p>
      <div className="flex gap-4 justify-center">
        <Link href="/account/orders"><Button variant="outline">View Orders</Button></Link>
        <Link href="/products"><Button>Continue Shopping</Button></Link>
      </div>
    </div>
  );
}
