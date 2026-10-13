import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Badge, Button, Dropdown, Input, Layout, Menu, Space, Typography } from "antd";
import { HomeOutlined, ShoppingCartOutlined, UserOutlined, AppstoreOutlined, LogoutOutlined, DashboardOutlined, FileTextOutlined } from "@ant-design/icons";
import { useAuth } from "../auth/AuthContext";
import { useCart } from "../lib/useCart";

const { Header, Content, Footer } = Layout;

export default function StoreLayout() {
  const { isAuthenticated, isStaff, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const cart = useCart(isAuthenticated);
  const [search, setSearch] = useState("");

  const selected = location.pathname.startsWith("/orders") ? ["orders"] : location.pathname.startsWith("/shop") ? ["shop"] : ["home"];

  const menuItems = [
    { key: "home", icon: <HomeOutlined />, label: <Link to="/">Home</Link> },
    { key: "shop", icon: <AppstoreOutlined />, label: <Link to="/shop">Shop</Link> },
    ...(isAuthenticated ? [{ key: "orders", icon: <FileTextOutlined />, label: <Link to="/orders">My orders</Link> }] : []),
  ];

  const accountItems = isAuthenticated
    ? [
        { key: "name", label: user?.username || user?.email, disabled: true },
        { type: "divider" },
        ...(isStaff ? [{ key: "admin", icon: <DashboardOutlined />, label: <Link to="/admin">Admin dashboard</Link> }] : []),
        { key: "orders", icon: <FileTextOutlined />, label: <Link to="/orders">My orders</Link> },
        { key: "logout", icon: <LogoutOutlined />, label: "Log out", danger: true },
      ]
    : [
        { key: "login", icon: <UserOutlined />, label: <Link to="/login">Sign in</Link> },
        { key: "signup", label: <Link to="/signup">Create account</Link> },
      ];

  function handleAccountClick({ key }) {
    if (key === "logout") {
      logout();
      navigate("/");
    }
  }

  function handleSearch(value) {
    const q = value.trim();
    navigate(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header className="store-header">
        <Link to="/" className="brand">
          Cellphone Store
        </Link>
        <Menu mode="horizontal" selectedKeys={selected} items={menuItems} className="store-menu" disabledOverflow />
        <Input.Search
          placeholder="Search phones, tablets, accessories"
          allowClear
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onSearch={handleSearch}
          className="store-search"
        />
        <Space size="middle">
          <Link to={isAuthenticated ? "/cart" : "/login"} aria-label="Cart">
            <Badge count={cart.data?.itemCount || 0} size="small" showZero={false}>
              <ShoppingCartOutlined className="cart-icon" />
            </Badge>
          </Link>
          <Dropdown menu={{ items: accountItems, onClick: handleAccountClick }} trigger={["click"]}>
            <Button icon={<UserOutlined />}>{isAuthenticated ? user?.username || "Account" : "Sign in"}</Button>
          </Dropdown>
        </Space>
      </Header>

      <Content className="store-content">
        <Outlet />
      </Content>

      <Footer className="store-footer">
        <Typography.Text type="secondary">
          Cellphone Store · Demo storefront. Prices are sample data.
        </Typography.Text>
      </Footer>
    </Layout>
  );
}
