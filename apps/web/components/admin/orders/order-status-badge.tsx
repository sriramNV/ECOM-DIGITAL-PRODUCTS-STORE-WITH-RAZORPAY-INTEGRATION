type Props = { status: string };

const statusStyles: Record<string, string> = {
  PAID: "bg-success-background text-success",
  PROCESSING: "bg-warning-background text-warning",
  PRINTING: "bg-info-background text-info",
  SHIPPED: "bg-success-background text-success",
  DELIVERED: "bg-success-background text-success",
  CANCELLED: "bg-error-background text-error",
  REFUNDED: "bg-error-background text-error",
  PENDING_PAYMENT: "bg-surface text-foreground-muted",
};

export function OrderStatusBadge({ status }: Props) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status] ?? "bg-surface text-foreground-muted"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
