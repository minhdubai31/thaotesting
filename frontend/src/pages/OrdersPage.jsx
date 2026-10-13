import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, toQuery } from "../lib/api";
import { ORDER_STATUSES, dateText, vnd } from "../lib/format";
import { useListParams } from "../lib/useListParams";
import { useFlash } from "../components/Flash";
import Pager from "../components/Pager";

export default function OrdersPage() {
  const list = useListParams({ sort: "orderDate", order: "desc" });
  const queryClient = useQueryClient();
  const showFlash = useFlash();

  const query = { page: list.page, pageSize: list.pageSize, sort: list.sort, order: list.order, ...list.filters };

  const { data, isLoading, error } = useQuery({
    queryKey: ["orders", query],
    queryFn: () => api(`/api/orders?${toQuery(query)}`),
    placeholderData: keepPreviousData,
  });

  const changeStatus = useMutation({
    mutationFn: ({ id, status }) => api(`/api/orders/${id}/status`, { method: "PATCH", body: { status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      showFlash("Order status updated.");
    },
    onError: (err) => showFlash(err.message, "error"),
  });

  function applyFilters(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    list.setFilters({ q: form.get("q")?.trim(), status: form.get("status") });
  }

  return (
    <>
      <section className="card">
        <div className="row head">
          <h2>Orders</h2>
          <Link className="button primary" to="/orders/new">
            New order
          </Link>
        </div>
        <form className="row filters" onSubmit={applyFilters}>
          <label>
            Search
            <input type="search" name="q" defaultValue={list.filters.q || ""} placeholder="Customer, ship name, city" />
          </label>
          <label>
            Status
            <select name="status" defaultValue={list.filters.status || ""}>
              <option value="">All</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
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
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Delivery</th>
                <th className="num">Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="muted">
                    Loading…
                  </td>
                </tr>
              )}
              {data?.orders.map((o) => (
                <tr key={o.id}>
                  <td>{dateText(o.orderDate)}</td>
                  <td className="wrap">{o.customer?.name || o.shipName || "Walk-in"}</td>
                  <td className="wrap">
                    {(o.items || []).map((item) => (
                      <div key={item.id}>
                        {item.product?.name} × {item.quantity}
                      </div>
                    ))}
                  </td>
                  <td>{o.deliveryCompany?.companyName || "—"}</td>
                  <td className="num">{vnd(o.totalAmount)}</td>
                  <td>
                    <select
                      value={o.status}
                      disabled={changeStatus.isPending}
                      onChange={(e) => changeStatus.mutate({ id: o.id, status: e.target.value })}
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {data && data.orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted">
                    No orders match these filters.
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
