export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md bg-surface-raised border border-border rounded-lg p-8 shadow-md">
        {children}
      </div>
    </div>
  );
}
