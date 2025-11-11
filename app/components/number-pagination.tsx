import { useLocation, useNavigate, useSearchParams } from "@remix-run/react";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "~/components/ui/pagination";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";

export interface NumberPaginationProps {
	totalPages: number;
	page: number;
	pageSize: number;
	defaultPageSize: number;
}

export function NumberPagination({
	totalPages,
	page,
	pageSize,
	defaultPageSize,
	...props
}: NumberPaginationProps) {
	const navigate = useNavigate();
	const location = useLocation();
	const [searchParams] = useSearchParams();

	const getUpdatedUrl = (newPage: number, newPageSize?: number) => {
		if (!newPageSize) {
			newPageSize = pageSize;
		}
		const updatedParams = new URLSearchParams(searchParams);
		updatedParams.set("page", newPage.toString());
		if (newPageSize && newPageSize !== defaultPageSize) {
			updatedParams.set("pageSize", newPageSize.toString());
		} else {
			updatedParams.delete("pageSize");
		}
		return `${location.pathname}?${updatedParams.toString()}`;
	};

	return (
		<div className="flex items-center justify-between">
			<Pagination {...props} className="flex-grow">
				<PaginationContent>
					<PaginationItem>
						{page > 1 && <PaginationPrevious href={getUpdatedUrl(page - 1)} />}
					</PaginationItem>

					{page > 2 && (
						<PaginationItem>
							<PaginationLink href={getUpdatedUrl(1)}>1</PaginationLink>
						</PaginationItem>
					)}

					{page > 3 && <PaginationEllipsis />}

					{Array.from({ length: 3 }, (_, i) => page - 1 + i)
						.filter((p) => p > 0 && p <= totalPages)
						.map((p) => (
							<PaginationItem key={p}>
								<PaginationLink href={getUpdatedUrl(p)} isActive={p === page}>
									{p}
								</PaginationLink>
							</PaginationItem>
						))}

					{page < totalPages - 2 && <PaginationEllipsis />}

					{page < totalPages - 1 && (
						<PaginationItem>
							<PaginationLink href={getUpdatedUrl(totalPages)}>{totalPages}</PaginationLink>
						</PaginationItem>
					)}

					<PaginationItem>
						{page < totalPages && <PaginationNext href={getUpdatedUrl(page + 1)} />}
					</PaginationItem>
				</PaginationContent>
			</Pagination>
			<div className="ml-4">
				<Select
					value={pageSize.toString()}
					onValueChange={(value) => {
						const newPageSize = Number(value);
						if (newPageSize !== pageSize) {
							const newPage = Math.min(page, Math.ceil(totalPages / newPageSize));
							navigate(getUpdatedUrl(newPage, newPageSize));
						}
					}}
				>
					<SelectTrigger className="w-[100px]">
						<SelectValue placeholder="Records/Page" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="10">10/Page</SelectItem>
						<SelectItem value="20">20/Page</SelectItem>
						<SelectItem value="30">30/Page</SelectItem>
						<SelectItem value="50">50/Page</SelectItem>
						<SelectItem value="100">100/Page</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
