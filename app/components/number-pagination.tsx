import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";

export interface NumberPaginationProps {
  totalPages: number;
  page: number;
}

export function NumberPagination({ totalPages, page, ...props }: NumberPaginationProps) {
  return (
    <Pagination {...props}>
      <PaginationContent>
        <PaginationItem>{page > 1 && <PaginationPrevious href={`?page=${page - 1}`} />}</PaginationItem>

        {page > 2 && (
          <PaginationItem>
            <PaginationLink href='?page=1'>1</PaginationLink>
          </PaginationItem>
        )}

        {page > 3 && <PaginationEllipsis />}

        {Array.from({ length: 3 }, (_, i) => page - 1 + i)
          .filter(p => p > 0 && p <= totalPages)
          .map(p => (
            <PaginationItem key={p}>
              <PaginationLink href={`?page=${p}`} isActive={p === page}>
                {p}
              </PaginationLink>
            </PaginationItem>
          ))}

        {page < totalPages - 2 && <PaginationEllipsis />}

        {page < totalPages - 1 && (
          <PaginationItem>
            <PaginationLink href={`?page=${totalPages}`}>{totalPages}</PaginationLink>
          </PaginationItem>
        )}

        <PaginationItem>{page < totalPages && <PaginationNext href={`?page=${page + 1}`} />}</PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
