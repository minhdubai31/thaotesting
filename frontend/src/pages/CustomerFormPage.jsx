import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useFlash } from "../components/Flash";

export default function CustomerFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showFlash = useFlash();
  const [error, setError] = useState("");

  const create = useMutation({
    mutationFn: (body) => api("/api/customers", { method: "POST", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["masters"] });
      showFlash("Customer saved.");
      navigate("/customers");
    },
    onError: (err) => setError(err.message),
  });

  function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    create.mutate({
      name: form.get("name"),
      phone: form.get("phone") || null,
      email: form.get("email") || null,
      address: form.get("address") || null,
    });
  }

  return (
    <section className="card">
      <div className="row head">
        <h2>New customer</h2>
        <Link to="/customers">Back to customers</Link>
      </div>

      {error && <div className="notice error">{error}</div>}

      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Name
          <input name="name" required />
        </label>
        <label>
          Phone
          <input name="phone" />
        </label>
        <label>
          Email
          <input name="email" type="email" />
        </label>
        <label>
          Address
          <input name="address" />
        </label>
        <div className="full actions">
          <button className="primary" type="submit" disabled={create.isPending}>
            Save customer
          </button>
        </div>
      </form>
    </section>
  );
}
