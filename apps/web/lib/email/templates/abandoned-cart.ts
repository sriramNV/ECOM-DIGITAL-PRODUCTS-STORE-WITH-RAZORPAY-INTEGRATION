export function renderAbandonedCart(data: { itemCount: number }): string {
  return `
    <!DOCTYPE html>
    <html><head><meta charset="utf-8"></head>
    <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1a1a2e;">You left something behind!</h1>
      <p>You have <strong>${data.itemCount}</strong> item${data.itemCount > 1 ? "s" : ""} in your cart waiting for you.</p>
      <p style="margin:20px 0;"><a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://podstore.com"}/cart" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">Return to Cart</a></p>
      <hr style="border:none;border-top:1px solid #eee;margin:30px 0;">
      <p style="color:#6b7280;font-size:14px;">Your cart will be saved for a limited time. Don't miss out!</p>
    </body></html>
  `;
}
