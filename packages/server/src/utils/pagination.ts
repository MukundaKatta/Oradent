export function parsePagination(query: { page?: string; limit?: string }, defaults = { page: 1, limit: 20, maxLimit: 100 }) {
  const page = Math.max(1, parseInt(query.page || '') || defaults.page);
  const limit = Math.min(defaults.maxLimit, Math.max(1, parseInt(query.limit || '') || defaults.limit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function paginationMeta(total: number, page: number, limit: number) {
  return { page, limit, total, pages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 };
}
