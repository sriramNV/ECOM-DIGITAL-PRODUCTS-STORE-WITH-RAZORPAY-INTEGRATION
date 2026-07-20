"use client";

import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Column<T> = {
  header: string;
  accessorKey: keyof T | string;
  cell?: (value: unknown, row: T) => React.ReactNode;
};

type Props<T> = {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => string | void;
};

export function DataTable<T extends Record<string, unknown>>({ columns, data, onRowClick }: Props<T>) {
  const router = useRouter();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={String(col.accessorKey)}>{col.header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length} className="text-center text-foreground-muted py-8">
              No results found.
            </TableCell>
          </TableRow>
        ) : (
          data.map((row, i) => (
            <TableRow
              key={i}
              className={onRowClick ? "cursor-pointer" : ""}
              onClick={() => {
                if (onRowClick) {
                  const href = onRowClick(row);
                  if (href) router.push(href);
                }
              }}
            >
              {columns.map((col) => (
                <TableCell key={String(col.accessorKey)}>
                  {col.cell
                    ? col.cell(row[col.accessorKey as keyof T], row)
                    : (row[col.accessorKey as keyof T] as React.ReactNode) ?? "-"}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
