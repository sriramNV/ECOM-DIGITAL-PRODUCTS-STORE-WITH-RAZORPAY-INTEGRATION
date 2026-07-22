"use client";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8">
      <h2 className="text-xl font-semibold">Admin error</h2>
      <p className="text-muted-foreground">Something went wrong in the admin panel. Please try again.</p>
      <button onClick={() => reset()} className="px-4 py-2 bg-accent text-accent-foreground rounded-lg">Try again</button>
    </div>
  );
}
