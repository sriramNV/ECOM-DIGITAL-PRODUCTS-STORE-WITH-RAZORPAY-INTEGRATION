export function renderOrderConfirmation(order: {
  orderNumber: string;
  totalAmount: number;
  items: Array<{ title: string; quantity: number; totalPrice: number }>;
  shippingAddress: Record<string, string>;
}, userName: string): string {
  return `
    <!DOCTYPE html>
    <html><head><meta charset="utf-8"></head>
    <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1a1a2e;">Thank you, ${userName}!</h1>
      <p>Your order <strong>${order.orderNumber}</strong> has been confirmed.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <tr style="background:#f8f9fa;">
          <th style="padding:10px;text-align:left;">Item</th>
          <th style="padding:10px;text-align:center;">Qty</th>
          <th style="padding:10px;text-align:right;">Price</th>
        </tr>
        ${order.items.map((item) => `
          <tr>
            <td style="padding:10px;border-top:1px solid #eee;">${item.title}</td>
            <td style="padding:10px;border-top:1px solid #eee;text-align:center;">${item.quantity}</td>
            <td style="padding:10px;border-top:1px solid #eee;text-align:right;">₹${item.totalPrice}</td>
          </tr>
        `).join("")}
      </table>
      <p><strong>Total: ₹${order.totalAmount}</strong></p>
      <hr style="border:none;border-top:1px solid #eee;margin:30px 0;">
      <p style="color:#6b7280;font-size:14px;">We'll notify you when your order ships.</p>
    </body></html>
  `;
}
