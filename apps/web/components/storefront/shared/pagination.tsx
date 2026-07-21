"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  currentPage: number;
  totalPages: number;
};

export function Pagination({ currentPage, totalPages }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage <= 1}
        className="px-3 py-2 text-sm rounded-md border border-border disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {(() => {
        const maxVisible = 5;
        const half = Math.floor(maxVisible / 2);
        let start = Math.max(1, currentPage - half);
        let end = Math.min(totalPages, start + maxVisible - 1);
        if (end - start + 1 < maxVisible) {
          start = Math.max(1, end - maxVisible + 1);
        }
        return Array.from({ length: end - start + 1 }, (_, i) => {
          const page = start + i;
          return (
            <button
              key={page}
              onClick={() => goToPage(page)}
              aria-current={page === currentPage ? "page" : undefined}
              className={`px-3 py-2 text-sm rounded-md border ${
                page === currentPage
                  ? "bg-accent text-accent-foreground border-accent"
                  : "border-border text-foreground hover:bg-surface"
              }`}
            >
              {page}
            </button>
          );
        });
      })()}

      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="px-3 py-2 text-sm rounded-md border border-border disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
