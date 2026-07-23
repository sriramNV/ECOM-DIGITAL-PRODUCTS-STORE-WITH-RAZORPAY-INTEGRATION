import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

export default async function AdminStatsPage() {
  const [totalRevenue, paidOrders, totalDownloads] = await Promise.all([
    prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: "PAID" } }),
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.download.count(),
  ]);

  const ordersByDay = await prisma.$queryRawUnsafe<Array<{ date: string; count: bigint; revenue: bigint }>>(
    `SELECT DATE("createdAt") as date, COUNT(*)::int as count, SUM("totalAmount")::int as revenue FROM "Order" GROUP BY DATE("createdAt") ORDER BY date DESC LIMIT 30`
  );

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Analytics</h1>
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border p-4"><p className="text-sm text-muted-foreground">Total Revenue</p><p className="text-2xl font-bold">{formatCurrency(Number(totalRevenue._sum.totalAmount) || 0)}</p></div>
        <div className="rounded-xl border border-border p-4"><p className="text-sm text-muted-foreground">Paid Orders</p><p className="text-2xl font-bold">{paidOrders}</p></div>
        <div className="rounded-xl border border-border p-4"><p className="text-sm text-muted-foreground">Downloads</p><p className="text-2xl font-bold">{totalDownloads}</p></div>
      </div>
      <h2 className="mb-4 text-xl font-semibold">Daily Orders (Last 30 Days)</h2>
      <div className="rounded-xl border border-border p-4">
        {ordersByDay.length === 0 ? (
          <p className="text-muted-foreground">No data yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead><tr className="text-muted-foreground"><th className="pb-2 font-medium">Date</th><th className="pb-2 font-medium">Orders</th><th className="pb-2 font-medium">Revenue</th></tr></thead>
            <tbody>
              {ordersByDay.map((row) => (
                <tr key={String(row.date)} className="border-t border-border">
                  <td className="py-2">{String(row.date)}</td>
                  <td className="py-2">{Number(row.count)}</td>
                  <td className="py-2">{formatCurrency(Number(row.revenue))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
