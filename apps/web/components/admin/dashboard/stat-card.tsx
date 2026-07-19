type Props = { label: string; value: string | number; trend?: string };

export function StatCard({ label, value, trend }: Props) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-sm text-foreground-muted">{label}</p>
      <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
      {trend && <p className="text-xs text-success mt-1">{trend}</p>}
    </div>
  );
}
