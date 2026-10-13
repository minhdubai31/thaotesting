import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <>
      <header className="topbar">
        <h1>
          <NavLink to="/products">Cellphone Store Admin</NavLink>
        </h1>
        <nav className="tabs">
          <NavLink to="/products">Products</NavLink>
          <NavLink to="/orders">Orders</NavLink>
          <NavLink to="/customers">Customers</NavLink>
          <NavLink to="/inventory">Inventory</NavLink>
        </nav>
        <div className="account muted">
          {user?.username || user?.email}
          <span className="muted">({(user?.roles || []).join(", ")})</span>
          <button type="button" onClick={handleLogout}>Log out</button>
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}
