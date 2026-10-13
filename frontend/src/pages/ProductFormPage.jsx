import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useMasters } from "../lib/useMasters";
import { useFlash } from "../components/Flash";
import ProductImage from "../components/ProductImage";

export default function ProductFormPage() {
  const { id } = useParams();
  const isNew = !id || id === "new";

  const { data: masters, isLoading: mastersLoading } = useMasters();
  const productQuery = useQuery({
    queryKey: ["product", id],
    queryFn: () => api(`/api/products/${id}`),
    enabled: !isNew,
  });

  if (mastersLoading || (!isNew && productQuery.isLoading)) return <p className="loading">Loading…</p>;
  if (productQuery.error) return <div className="notice error">{productQuery.error.message}</div>;

  const product = productQuery.data?.product;

  // The form is keyed by product id, so it starts with the loaded values.
  return <ProductForm key={product?.id || "new"} product={product} isNew={isNew} masters={masters} />;
}

function ProductForm({ product, isNew, masters }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showFlash = useFlash();
  const [imageUrl, setImageUrl] = useState(product?.imageUrl || "");
  const [error, setError] = useState("");

  const save = useMutation({
    mutationFn: (body) =>
      isNew ? api("/api/products", { method: "POST", body }) : api(`/api/products/${product.id}`, { method: "PATCH", body }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["masters"] });
      showFlash(isNew ? "Product created." : "Product saved.");
      navigate(`/products/${data.product.id}`, { replace: true });
    },
    onError: (err) => setError(err.message),
  });

  const deactivate = useMutation({
    mutationFn: () => api(`/api/products/${product.id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["masters"] });
      showFlash("Product deactivated.");
      navigate("/products");
    },
    onError: (err) => setError(err.message),
  });

  function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const categoryId = form.get("categoryId") || null;
    const categoryName = masters.categories.find((c) => c.id === categoryId)?.name || "phone";

    const body = {
      sku: form.get("sku"),
      name: form.get("name"),
      brand: form.get("brand"),
      model: form.get("model"),
      category: categoryName,
      categoryId,
      supplierId: form.get("supplierId") || null,
      price: Number(form.get("price")),
      reorderLevel: Number(form.get("reorderLevel")),
      description: form.get("description") || null,
      imageUrl: form.get("imageUrl") || null,
    };

    if (isNew) {
      body.quantity = Number(form.get("quantity"));
    } else {
      body.unitsInStock = Number(form.get("quantity"));
      body.isActive = form.get("isActive") === "on";
    }

    setError("");
    save.mutate(body);
  }

  return (
    <section className="card">
      <div className="row head">
        <h2>{isNew ? "New product" : product.name}</h2>
        <Link to="/products">Back to products</Link>
      </div>

      {error && <div className="notice error">{error}</div>}

      <div className="product-edit">
        <div className="product-preview">
          <ProductImage src={imageUrl} large />
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            SKU
            <input name="sku" defaultValue={product?.sku} required />
          </label>
          <label>
            Name
            <input name="name" defaultValue={product?.name} required />
          </label>
          <label>
            Brand
            <input name="brand" defaultValue={product?.brand} required />
          </label>
          <label>
            Model
            <input name="model" defaultValue={product?.model} required />
          </label>
          <label>
            Category
            <select name="categoryId" defaultValue={product?.categoryId || ""}>
              <option value="">No category</option>
              {masters.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Supplier
            <select name="supplierId" defaultValue={product?.supplierId || ""}>
              <option value="">No supplier</option>
              {masters.suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.companyName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Price (VND)
            <input name="price" type="number" min="0" step="1000" defaultValue={product?.price ?? ""} required />
          </label>
          <label>
            {isNew ? "Opening stock" : "Stock on hand"}
            <input name="quantity" type="number" min="0" defaultValue={product?.unitsInStock ?? 0} required />
          </label>
          <label>
            Reorder level
            <input name="reorderLevel" type="number" min="0" defaultValue={product?.reorderLevel ?? 5} required />
          </label>
          <label className="full">
            Image URL
            <input
              name="imageUrl"
              type="url"
              placeholder="https://…"
              defaultValue={product?.imageUrl || ""}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </label>
          <label className="full">
            Description
            <textarea name="description" rows={4} defaultValue={product?.description || ""} />
          </label>
          {!isNew && (
            <label className="check full">
              <input type="checkbox" name="isActive" defaultChecked={product.isActive} />
              Active
            </label>
          )}
          <div className="full actions">
            <button className="primary" type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : isNew ? "Create product" : "Save changes"}
            </button>
            {!isNew && product.isActive && (
              <button
                type="button"
                className="danger"
                disabled={deactivate.isPending}
                onClick={() => {
                  if (confirm("Deactivate this product? It will be hidden from sales.")) deactivate.mutate();
                }}
              >
                Deactivate
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
