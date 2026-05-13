import Link from "next/link";
import { cn } from "@/lib/utils";

export function ProductsPagination({
  page,
  totalPages,
  queryString,
}: {
  page: number;
  totalPages: number;
  queryString: string;
}) {
  if (totalPages <= 1) return null;

  const baseQs = queryString ? `${queryString}&` : "";

  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      <Link
        href={`/products?${baseQs}page=${Math.max(1, page - 1)}`}
        className={cn(
          "inline-flex items-center justify-center rounded-md border px-3 py-1 text-sm",
          page === 1 ? "pointer-events-none opacity-50" : "hover:bg-muted",
        )}
        aria-disabled={page === 1}
      >
        Previous
      </Link>
      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <Link
            key={p}
            href={`/products?${baseQs}page=${p}`}
            className={cn(
              "h-8 w-8 rounded text-sm font-sans transition-colors flex items-center justify-center",
              page === p ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {p}
          </Link>
        ))}
      </div>
      <Link
        href={`/products?${baseQs}page=${Math.min(totalPages, page + 1)}`}
        className={cn(
          "inline-flex items-center justify-center rounded-md border px-3 py-1 text-sm",
          page === totalPages ? "pointer-events-none opacity-50" : "hover:bg-muted",
        )}
      >
        Next
      </Link>
    </div>
  );
}
