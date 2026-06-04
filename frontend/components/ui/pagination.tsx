'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalItems === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{start}</span>
        {' – '}
        <span className="font-medium text-foreground">{end}</span>
        {' of '}
        <span className="font-medium text-foreground">{totalItems}</span>
      </p>
      <div className="flex flex-wrap items-center justify-center gap-1 sm:justify-end">
        <Button variant="outline" size="icon-sm" disabled={page <= 1} onClick={() => onPageChange(1)}>
          <ChevronsLeft className="size-4" />
        </Button>
        <Button variant="outline" size="icon-sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <span className="px-3 text-sm font-medium tabular-nums">
          Page {page} of {totalPages}
        </span>
        <Button variant="outline" size="icon-sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          <ChevronRight className="size-4" />
        </Button>
        <Button variant="outline" size="icon-sm" disabled={page >= totalPages} onClick={() => onPageChange(totalPages)}>
          <ChevronsRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function usePagination<T>(items: T[], pageSize = 10) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return {
    page: safePage,
    setPage,
    totalPages,
    paginatedItems,
    totalItems: items.length,
    pageSize,
  };
}
