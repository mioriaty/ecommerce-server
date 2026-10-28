export interface PaginationInput {
  page: number;
  limit: number;
}

export function toSkipTake({ page, limit }: PaginationInput) {
  return {
    skip: (page - 1) * limit,
    take: limit
  };
}

export function toPaginatedResult<T>({
  data,
  totalItems,
  page,
  limit
}: PaginationInput & { data: T[]; totalItems: number }) {
  return {
    data,
    totalItems,
    page,
    limit,
    totalPages: Math.ceil(totalItems / limit)
  };
}
