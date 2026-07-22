import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <h2 className="text-xl font-semibold">Page not found</h2>
      <p className="text-muted-foreground">The page you are looking for does not exist.</p>
      <Link href="/" className="px-4 py-2 bg-accent text-accent-foreground rounded-lg">Go home</Link>
    </div>
  );
}
