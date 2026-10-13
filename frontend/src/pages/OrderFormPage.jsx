import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useMasters } from "../lib/useMasters";
import { useFlash } from "../components/Flash";

const LINE_COUNT = 3;

export default function OrderFormPage() {
  const { data: masters, isLoading } = useMasters();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showFlash = useFlash();
  const [error, setError] = useState("");

  const create = useMutation({
    mutationFn: (body) => api("/api/orders", { method: "POST", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["masters"] });
      showFlash("Order created. Stock was reduced.");
      navigate("/orders");
    },
    onError: (err) => setError(err.message),
  });

  function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const items = Array.from({ length: LINE_COUNT }, (_, i) => ({
      productId: form.get(`productId${i}`),
      quantity: Number(form.get(`quantity${i}`)),
    })).filter((line) => line.productId);

    if (items.length === 0) {
      setError("Choose at least one product.");
      return;
    }

    setError("");
    create.mutate({
      customerId: form.get("customerId") || null,
      deliveryCompanyId: form.get("deliveryCompanyId") || null,
      freight: Number(form.get("freight") || 0),
      items,
    });
  }

  if (isLoading) return <p className="loading">Loading…</p>;

  return (
    <section className="card">
      <div className="row head">
        <h2>New order</h2>
        <Link to="/orders">Back to orders</Link>
      </div>

      {error && <div className="notice error">{error}</div>}

      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Customer
          <select name="customerId" defaultValue="">
            <option value="">Walk-in</option>
            {masters.customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Delivery
          <select name="deliveryCompanyId" defaultValue="">
            <option value="">None</option>
            {masters.deliveries.map((d) => (
              <option key={d.id} value={d.id}>
                {d.companyName}
              </option>
            ))}
          </select>
        </label>
        <label>
          Freight (VND)
          <input name="freight" type="number" min="0" step="1000" defaultValue={30000} />
        </label>

        <div className="full lines">
          {Array.from({ length: LINE_COUNT }, (_, i) => (
            <div className="order-line" key={i}>
              <label>
                Product {i + 1}
                <select name={`productId${i}`} defaultValue="">
                  <option value="">— none —</option>
                  {masters.products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.unitsInStock} in stock
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Quantity
                <input name={`quantity${i}`} type="number" min="1" defaultValue={1} />
              </label>
            </div>
          ))}
        </div>

        <p className="muted full">Fill at least one product line. Stock is reduced when the order is created.</p>
        <div className="full actions">
          <button className="primary" type="submit" disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create order"}
          </button>
        </div>
      </form>
    </section>
  );
}
