import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (isAuthenticated) return <Navigate to="/products" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await login(form.get("identifier"), form.get("password"));
      navigate(location.state?.from || "/products", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card auth">
      <h2>Sign in</h2>
      {error && <div className="notice error">{error}</div>}
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Username or email
          <input name="identifier" required autoComplete="username" />
        </label>
        <label>
          Password
          <input type="password" name="password" required autoComplete="current-password" />
        </label>
        <button className="primary" type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="switch">
        No account yet? <Link to="/signup">Sign up</Link>
      </p>
    </section>
  );
}

export function SignupPage() {
  const { signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (isAuthenticated) return <Navigate to="/products" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await signup({
        email: form.get("email"),
        username: form.get("username") || undefined,
        password: form.get("password"),
      });
      navigate("/products", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card auth">
      <h2>Create an account</h2>
      {error && <div className="notice error">{error}</div>}
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input type="email" name="email" required autoComplete="email" />
        </label>
        <label>
          Username (optional)
          <input name="username" minLength={3} maxLength={30} pattern="[A-Za-z0-9_]+" autoComplete="username" />
        </label>
        <label>
          Password (at least 8 characters)
          <input type="password" name="password" required minLength={8} autoComplete="new-password" />
        </label>
        <button className="primary" type="submit" disabled={busy}>
          {busy ? "Creating…" : "Sign up"}
        </button>
      </form>
      <p className="switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </section>
  );
}
