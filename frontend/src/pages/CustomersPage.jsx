import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, toQuery } from "../lib/api";
import { useListParams } from "../lib/useListParams";
import Pager from "../components/Pager";

export default function CustomersPage() {
  const list = useListParams({ sort: "createdAt", order: "desc" });
  const query = { page: list.page, pageSize: list.pageSize, sort: list.sort, order: list.order, ...list.filters };

  const { data, isLoading, error } = useQuery({
    queryKey: ["customers", query],
    queryFn: () => api(`/api/customers?${toQuery(query)}`),
    placeholderData: keepPreviousData,
  });

  function applyFilters(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    list.setFilters({ q: form.get("q")?.trim() });
  }

  return (
    <>
      <section className="card">
        <div className="row head">
          <h2>Customers</h2>
          <Link className="button primary" to="/customers/new">
            New customer
          </Link>
        </div>
        <form className="row filters" onSubmit={applyFilters}>
          <label>
            Search
            <input type="search" name="q" defaultValue={list.filters.q || ""} placeholder="Name, phone, email" />
          </label>
          <button type="submit">Apply</button>
        </form>
      </section>

      <section className="card">
        {error && <div className="notice error">{error.message}</div>}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Address</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={4} className="muted">
                    Loading…
                  </td>
                </tr>
              )}
              {data?.customers.map((c) => (
                <tr key={c.id}>
                  <td className="wrap">{c.name}</td>
                  <td>{c.phone || "—"}</td>
                  <td>{c.email || "—"}</td>
                  <td className="wrap">{c.address || "—"}</td>
                </tr>
              ))}
              {data && data.customers.length === 0 && (
                <tr>
                  <td colSpan={4} className="muted">
                    No customers match this search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pager meta={data?.meta} onPage={list.setPage} onPageSize={list.setPageSize} />
      </section>
    </>
  );
}
