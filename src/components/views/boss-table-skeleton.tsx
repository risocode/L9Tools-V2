
"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export function BossTableSkeletonBody() {
  return Array.from({ length: 10 }).map((_, index) => (
    <TableRow key={index} className="hover:bg-muted/50">
      <TableCell className="align-middle">
        <div className="flex items-center gap-3">
          <Skeleton className="h-14 w-14 rounded-md" />
          <div>
            <Skeleton className="h-5 w-20 mb-2" />
            <Skeleton className="h-6 w-28" />
          </div>
        </div>
      </TableCell>
      <TableCell className="align-middle hidden md:table-cell">
        <Skeleton className="h-5 w-36" />
      </TableCell>
      <TableCell className="align-middle">
        <div className="flex flex-col items-center">
          <Skeleton className="h-6 w-40 mb-1" />
          <Skeleton className="h-4 w-24" />
        </div>
      </TableCell>
      <TableCell className="align-middle">
        <div className="flex justify-center gap-1 md:gap-2">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-md" />
        </div>
      </TableCell>
    </TableRow>
  ));
}
