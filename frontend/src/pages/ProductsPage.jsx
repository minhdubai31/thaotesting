import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, toQuery } from "../lib/api";
import { vnd } from "../lib/format";
import { useListParams } from "../lib/useListParams";
import { useMasters } from "../lib/useMasters";
import Pager from "../components/Pager";
import ProductImage from "../components/ProductImage";

export default function ProductsPage() {
  const list = useListParams({ sort: "createdAt", order: "desc" });
  const { data: masters } = useMasters();
  const [search, setSearch] = useState(list.filters.q || "");

  const query = { page: list.page, pageSize: list.pageSize, sort: list.sort, order: list.order, ...list.filters };

  const { data, isLoading, error } = useQuery({
    queryKey: ["products", query],
    queryFn: () => api(`/api/products?${toQuery(query)}`),
    placeholderData: keepPreviousData,
  });

  function applyFilters(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    list.setFilters({
      q: form.get("q")?.trim(),
      categoryId: form.get("categoryId"),
      status: form.get("status"),
      sort: form.get("sort"),
      order: form.get("order"),
    });
  }

  return (
    <>
      <section className="card">
        <div className="row head">
          <h2>Products</h2>
          <Link className="button primary" to="/products/new">
            New product
          </Link>
        </div>
        <form className="row filters" onSubmit={applyFilters}>
          <label>
            Search
            <input type="search" name="q" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, SKU, brand, model" />
          </label>
          <label>
            Category
            <select name="categoryId" defaultValue={list.filters.categoryId || ""}>
              <option value="">All</option>
              {masters?.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select name="status" defaultValue={list.filters.status || "all"}>
              {["all", "active", "inactive"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label>
            Sort by
            <select name="sort" defaultValue={list.sort || "createdAt"}>
              {["createdAt", "name", "price", "unitsInStock", "sku"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label>
            Order
            <select name="order" defaultValue={list.order || "desc"}>
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
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
                <th>Image</th>
                <th>SKU</th>
                <th>Name</th>
                <th>Category</th>
                <th className="num">Price</th>
                <th className="num">Stock</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={8} className="muted">
                    Loading…
                  </td>
                </tr>
              )}
              {data?.products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <ProductImage src={p.imageUrl} />
                  </td>
                  <td>{p.sku}</td>
                  <td className="wrap">
                    <Link to={`/products/${p.id}`}>{p.name}</Link>
                  </td>
                  <td>{p.categoryRef?.name || p.category}</td>
                  <td className="num">{vnd(p.price)}</td>
                  <td className={`num ${p.unitsInStock <= p.reorderLevel ? "stock-low" : ""}`}>{p.unitsInStock}</td>
                  <td>{p.isActive ? <span className="badge ok">Active</span> : <span className="badge">Inactive</span>}</td>
                  <td>
                    <Link to={`/products/${p.id}`}>Edit</Link>
                  </td>
                </tr>
              ))}
              {data && data.products.length === 0 && (
                <tr>
                  <td colSpan={8} className="muted">
                    No products match these filters.
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
