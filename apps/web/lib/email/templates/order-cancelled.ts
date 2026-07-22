import { h } from "./html-escape";

export function renderOrderCancelled(data: { orderNumber: string; reason: string }): string {
  return `
    <!DOCTYPE html>
    <html><head><meta charset="utf-8"></head>
    <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1a1a2e;">Order Cancelled</h1>
      <p>Your order <strong>${h(data.orderNumber)}</strong> has been cancelled.</p>
      <p style="color:#6b7280;">Reason: ${h(data.reason)}</p>
      <hr style="border:none;border-top:1px solid #eee;margin:30px 0;">
      <p style="color:#6b7280;font-size:14px;">If you have any questions, please contact our support team.</p>
    </body></html>
  `;
}
