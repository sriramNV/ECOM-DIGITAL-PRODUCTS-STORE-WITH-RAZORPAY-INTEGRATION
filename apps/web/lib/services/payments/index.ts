import { prisma } from "@/lib/db";
import { generateOrderNumber } from "@/lib/utils";
import { createHmac } from "crypto";

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
if (!RAZORPAY_KEY_SECRET) throw new Error("RAZORPAY_KEY_SECRET is not configured");

function createHmacSig(body: string) {
  return createHmac("sha256", RAZORPAY_KEY_SECRET).update(body).digest("hex");
}

export async function createRazorpayOrder(userId: string, couponCode?: string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: { product: true },
      },
    },
  });

  if (!cart?.items.length) {
    throw new Error("Cart is empty");
  }

  let subtotal = 0;
  for (const item of cart.items) {
    const price = item.product.salePrice || item.product.price;
    subtotal += Number(price) * item.quantity;
  }

  const razorpayRes = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(
        `${process.env.RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`
      ).toString("base64")}`,
    },
    body: JSON.stringify({
      amount: Math.round(subtotal * 100),
      currency: "INR",
      receipt: `cart_${cart.id}_${Date.now()}`,
      notes: { userId, cartId: cart.id },
    }),
  });

  if (!razorpayRes.ok) {
    throw new Error("Failed to create Razorpay order");
  }

  const razorpayOrder = await razorpayRes.json();

  return {
    razorpayOrderId: razorpayOrder.id,
    amount: subtotal,
    amountInPaise: Math.round(subtotal * 100),
  };
}

export async function verifyPayment(payload: {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}) {
  const body = `${payload.razorpay_order_id}|${payload.razorpay_payment_id}`;
  const expectedSignature = createHmacSig(body);
  return expectedSignature === payload.razorpay_signature;
}

export async function createOrderFromCart(userId: string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true } } },
  });

  if (!cart?.items.length) throw new Error("Cart is empty");

  const subtotal = cart.items.reduce(
    (sum, item) => sum + Number(item.product.salePrice || item.product.price) * item.quantity,
    0
  );

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId,
      status: "PAID",
      subtotalAmount: subtotal,
      totalAmount: subtotal,
      items: {
        create: cart.items.map((item) => ({
          productId: item.productId,
          title: item.product.title,
          quantity: item.quantity,
          unitPrice: item.product.salePrice || item.product.price,
          totalPrice: Number(item.product.salePrice || item.product.price) * item.quantity,
        })),
      },
      statusHistory: {
        create: [
          { status: "PENDING_PAYMENT" },
          { status: "PAID" },
        ],
      },
    },
  });

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  return order;
}

export async function createOrderFromPayment(
  userId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  amount: number
) {
  return prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });

    if (!cart?.items.length) throw new Error("Cart is empty");

    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.product.salePrice || item.product.price) * item.quantity,
      0
    );

    const order = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId,
        status: "PAID",
        subtotalAmount: subtotal,
        totalAmount: amount,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            title: item.product.title,
            quantity: item.quantity,
            unitPrice: item.product.salePrice || item.product.price,
            totalPrice: Number(item.product.salePrice || item.product.price) * item.quantity,
          })),
        },
        payments: {
          create: {
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            amount,
            status: "COMPLETED",
          },
        },
        statusHistory: {
          create: [
            { status: "PENDING_PAYMENT" },
            { status: "PAID" },
          ],
        },
      },
    });

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return order;
  });
}
