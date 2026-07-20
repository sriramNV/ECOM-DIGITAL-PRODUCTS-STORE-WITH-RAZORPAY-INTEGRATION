type Props = { label: string; value: string | number; trend?: string };

export function StatCard({ label, value, trend }: Props) {
  return (
    <div className="rounded-xl border border-border bg-surface-raised p-5 transition-all duration-150 hover:shadow-sm">
      <p className="text-sm text-foreground-muted">{label}</p>
      <p className="text-2xl font-bold text-foreground mt-1.5">{value}</p>
      {trend && <p className="text-xs text-success mt-1.5">{trend}</p>}
    </div>
  );
}
