import { useSearchParams } from "react-router-dom";

// Reads paging, sorting and filter values from the URL, so a page can be reloaded or shared.
// `defaults` gives the sort field and direction when the URL does not set them.
export function useListParams(defaults = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const values = {
    page: Number(searchParams.get("page")) || 1,
    pageSize: Number(searchParams.get("pageSize")) || 10,
    sort: searchParams.get("sort") || defaults.sort || "",
    order: searchParams.get("order") || defaults.order || "",
  };

  // Every other URL param (q, status, categoryId...) is a filter.
  const filters = Object.fromEntries(searchParams.entries());
  for (const key of ["page", "pageSize", "sort", "order"]) delete filters[key];

  function update(changes) {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value === undefined || value === null || value === "") next.delete(key);
      else next.set(key, String(value));
    }
    setSearchParams(next);
  }

  return {
    ...values,
    filters,
    setPage: (page) => update({ page }),
    setPageSize: (pageSize) => update({ pageSize, page: 1 }),
    // Applies new filters and returns to page 1.
    setFilters: (newFilters) => update({ ...newFilters, page: 1 }),
  };
}
