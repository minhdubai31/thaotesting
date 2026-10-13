import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Spin } from "antd";
import StoreLayout from "./layouts/StoreLayout";
import AdminLayout from "./layouts/AdminLayout";
import { RequireAuth, RequireStaff } from "./components/RouteGuards";
import HomePage from "./pages/store/HomePage";
import ShopPage from "./pages/store/ShopPage";
import ProductPage from "./pages/store/ProductPage";
import CartPage from "./pages/store/CartPage";
import CheckoutPage from "./pages/store/CheckoutPage";
import MyOrdersPage from "./pages/store/MyOrdersPage";
import MyOrderPage from "./pages/store/MyOrderPage";
import LoginPage from "./pages/store/LoginPage";
import SignupPage from "./pages/store/SignupPage";
// The dashboard pulls in the charts library, so it loads on demand.
const DashboardPage = lazy(() => import("./pages/admin/DashboardPage"));
import ProductsPage from "./pages/admin/ProductsPage";
import ProductFormPage from "./pages/admin/ProductFormPage";
import OrdersPage from "./pages/admin/OrdersPage";
import OrderFormPage from "./pages/admin/OrderFormPage";
import CustomersPage from "./pages/admin/CustomersPage";
import CustomerFormPage from "./pages/admin/CustomerFormPage";
import InventoryPage from "./pages/admin/InventoryPage";
import AdjustStockPage from "./pages/admin/AdjustStockPage";
import CouponsPage from "./pages/admin/CouponsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<StoreLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/product/:slug" element={<ProductPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<MyOrdersPage />} />
          <Route path="/orders/:id" element={<MyOrderPage />} />
        </Route>
      </Route>

      <Route path="/admin" element={<RequireStaff />}>
        <Route element={<AdminLayout />}>
          <Route
            index
            element={
              <Suspense fallback={<Spin />}>
                <DashboardPage />
              </Suspense>
            }
          />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:id" element={<ProductFormPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/new" element={<OrderFormPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="customers/new" element={<CustomerFormPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="inventory/adjust" element={<AdjustStockPage />} />
          <Route path="coupons" element={<CouponsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
