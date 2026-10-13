import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { useMasters } from "../lib/useMasters";
import { useFlash } from "../components/Flash";

export default function AdjustStockPage() {
  const { data: masters, isLoading } = useMasters();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showFlash = useFlash();
  const [error, setError] = useState("");

  const adjust = useMutation({
    mutationFn: (body) => api("/api/inventory/adjustments", { method: "POST", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["masters"] });
      showFlash("Stock updated.");
      navigate("/inventory");
    },
    onError: (err) => setError(err.message),
  });

  function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    adjust.mutate({
      productId: form.get("productId"),
      type: form.get("type"),
      quantity: Number(form.get("quantity")),
      note: form.get("note") || undefined,
    });
  }

  if (isLoading) return <p className="loading">Loading…</p>;

  return (
    <section className="card">
      <div className="row head">
        <h2>Adjust stock</h2>
        <Link to="/inventory">Back to inventory</Link>
      </div>

      {error && <div className="notice error">{error}</div>}

      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="full">
          Product
          <select name="productId" required defaultValue={searchParams.get("productId") || ""}>
            <option value="" disabled>
              Choose a product
            </option>
            {masters.products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.unitsInStock} in stock
              </option>
            ))}
          </select>
        </label>
        <label>
          Type
          <select name="type" defaultValue="in">
            <option value="in">In (received)</option>
            <option value="out">Out (removed)</option>
            <option value="audit">Audit (set count)</option>
          </select>
        </label>
        <label>
          Quantity
          <input name="quantity" type="number" min="0" defaultValue={1} required />
        </label>
        <label className="full">
          Note
          <input name="note" />
        </label>
        <div className="full actions">
          <button className="primary" type="submit" disabled={adjust.isPending}>
            Record
          </button>
        </div>
      </form>
    </section>
  );
}
