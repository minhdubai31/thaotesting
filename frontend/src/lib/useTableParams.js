import { useSearchParams } from "react-router-dom";

// Keeps paging, sorting and filters in the URL so a list can be reloaded or shared.
// Works with antd Table: pass `pagination` and `onChange` from the returned values.
export function useTableParams(defaults = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || defaults.pageSize || 10;
  const sort = searchParams.get("sort") || defaults.sort || "";
  const order = searchParams.get("order") || defaults.order || "";

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
    page,
    pageSize,
    sort,
    order,
    filters,
    // Applies filters and returns to the first page.
    setFilters: (values) => update({ ...values, page: 1 }),
    // antd Table onChange: paging plus sorting.
    onTableChange: (pagination, _filters, sorter) => {
      const sortField = Array.isArray(sorter) ? undefined : sorter?.field;
      const sortOrder = Array.isArray(sorter) ? undefined : sorter?.order;
      update({
        page: pagination.current,
        pageSize: pagination.pageSize,
        sort: sortField || undefined,
        order: sortOrder ? (sortOrder === "ascend" ? "asc" : "desc") : undefined,
      });
    },
    tablePagination: (total) => ({
      current: page,
      pageSize,
      total,
      showSizeChanger: true,
      pageSizeOptions: [10, 20, 50],
      showTotal: (count) => `${count} items`,
    }),
  };
}
