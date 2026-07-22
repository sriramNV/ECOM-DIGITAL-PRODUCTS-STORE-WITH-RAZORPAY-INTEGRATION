import { h } from "./html-escape";

export function renderOrderShipped(data: {
  orderNumber: string;
  tracking: { carrier: string; trackingNumber: string; trackingUrl: string | null };
}): string {
  return `
    <!DOCTYPE html>
    <html><head><meta charset="utf-8"></head>
    <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1a1a2e;">Your Order Has Shipped!</h1>
      <p>Order <strong>${h(data.orderNumber)}</strong> is on its way.</p>
      <div style="background:#f8f9fa;padding:20px;border-radius:8px;margin:20px 0;">
        <p style="margin:0 0 8px;"><strong>Carrier:</strong> ${h(data.tracking.carrier)}</p>
        <p style="margin:0 0 8px;"><strong>Tracking:</strong> ${h(data.tracking.trackingNumber)}</p>
        ${data.tracking.trackingUrl ? `<p style="margin:0;"><a href="${h(data.tracking.trackingUrl)}" style="color:#2563eb;">Track your order</a></p>` : ""}
      </div>
      <hr style="border:none;border-top:1px solid #eee;margin:30px 0;">
      <p style="color:#6b7280;font-size:14px;">Thank you for shopping with us!</p>
    </body></html>
  `;
}
