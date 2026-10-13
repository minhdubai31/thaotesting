import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, toQuery } from "../lib/api";
import { useListParams } from "../lib/useListParams";
import Pager from "../components/Pager";
import ProductImage from "../components/ProductImage";

export default function InventoryPage() {
  const list = useListParams({ sort: "updatedAt", order: "desc" });
  const query = { page: list.page, pageSize: list.pageSize, sort: list.sort, order: list.order, ...list.filters };

  const { data, isLoading, error } = useQuery({
    queryKey: ["inventory", query],
    queryFn: () => api(`/api/inventory?${toQuery(query)}`),
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
          <h2>Inventory</h2>
          <Link className="button primary" to="/inventory/adjust">
            Adjust stock
          </Link>
        </div>
        <form className="row filters" onSubmit={applyFilters}>
          <label>
            Search
            <input type="search" name="q" defaultValue={list.filters.q || ""} placeholder="Product name, SKU, brand" />
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
                <th>Product</th>
                <th>SKU</th>
                <th className="num">On hand</th>
                <th className="num">Reorder at</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7} className="muted">
                    Loading…
                  </td>
                </tr>
              )}
              {data?.inventory.map((item) => {
                const low = item.quantity <= (item.product?.reorderLevel ?? 0);
                return (
                  <tr key={item.id}>
                    <td>
                      <ProductImage src={item.product?.imageUrl} />
                    </td>
                    <td className="wrap">{item.product?.name}</td>
                    <td>{item.product?.sku}</td>
                    <td className={`num ${low ? "stock-low" : ""}`}>{item.quantity}</td>
                    <td className="num">{item.product?.reorderLevel ?? 0}</td>
                    <td>{low ? <span className="badge warn">Reorder</span> : <span className="badge ok">OK</span>}</td>
                    <td>
                      <Link to={`/inventory/adjust?productId=${item.productId}`}>Adjust</Link>
                    </td>
                  </tr>
                );
              })}
              {data && data.inventory.length === 0 && (
                <tr>
                  <td colSpan={7} className="muted">
                    No inventory records match this search.
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
