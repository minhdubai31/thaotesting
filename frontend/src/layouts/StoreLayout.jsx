import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Badge, Button, Dropdown, Input, Layout, Menu, Space, Typography } from "antd";
import { HomeOutlined, SearchOutlined, ShoppingCartOutlined, UserOutlined, AppstoreOutlined, LogoutOutlined, DashboardOutlined, FileTextOutlined } from "@ant-design/icons";
import { useAuth } from "../auth/AuthContext";
import { useCart } from "../lib/useCart";
import { LanguageSwitch, useI18n } from "../i18n";

const { Header, Content, Footer } = Layout;

export default function StoreLayout() {
  const { t } = useI18n();
  const { isAuthenticated, isStaff, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const cart = useCart(isAuthenticated);
  const [search, setSearch] = useState("");

  const selected = location.pathname.startsWith("/orders") ? ["orders"] : location.pathname.startsWith("/shop") ? ["shop"] : ["home"];

  const menuItems = [
    { key: "home", icon: <HomeOutlined />, label: <Link to="/">{t("nav.home")}</Link> },
    { key: "shop", icon: <AppstoreOutlined />, label: <Link to="/shop">{t("nav.shop")}</Link> },
    ...(isAuthenticated ? [{ key: "orders", icon: <FileTextOutlined />, label: <Link to="/orders">{t("nav.myOrders")}</Link> }] : []),
  ];

  const accountItems = isAuthenticated
    ? [
        { key: "name", label: user?.username || user?.email, disabled: true },
        { type: "divider" },
        ...(isStaff ? [{ key: "admin", icon: <DashboardOutlined />, label: <Link to="/admin">{t("nav.adminDashboard")}</Link> }] : []),
        { key: "orders", icon: <FileTextOutlined />, label: <Link to="/orders">{t("nav.myOrders")}</Link> },
        { key: "logout", icon: <LogoutOutlined />, label: t("nav.logout"), danger: true },
      ]
    : [
        { key: "login", icon: <UserOutlined />, label: <Link to="/login">{t("nav.signIn")}</Link> },
        { key: "signup", label: <Link to="/signup">{t("nav.signUp")}</Link> },
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
        <Link to="/" className="brand brand-row">
          <span className="logo">T</span>
          Thao Store
        </Link>
        <Menu mode="horizontal" selectedKeys={selected} items={menuItems} className="store-menu" disabledOverflow />
        <Input
          prefix={<SearchOutlined style={{ color: "rgba(0, 0, 0, 0.45)" }} />}
          placeholder={t("store.searchPlaceholder")}
          allowClear
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onPressEnter={() => handleSearch(search)}
          className="store-search"
        />
        <Space size="middle">
          <LanguageSwitch />
          <Link to={isAuthenticated ? "/cart" : "/login"} aria-label={t("nav.cart")}>
            <Badge count={cart.data?.itemCount || 0} size="small" showZero={false}>
              <ShoppingCartOutlined className="cart-icon" />
            </Badge>
          </Link>
          <Dropdown menu={{ items: accountItems, onClick: handleAccountClick }} trigger={["click"]}>
            <Button icon={<UserOutlined />}>{isAuthenticated ? user?.username || t("nav.account") : t("nav.signIn")}</Button>
          </Dropdown>
        </Space>
      </Header>

      <Content className="store-content">
        <Outlet />
      </Content>

      <Footer className="store-footer">
        <Typography.Text type="secondary">{t("store.footer")}</Typography.Text>
      </Footer>
    </Layout>
  );
}
