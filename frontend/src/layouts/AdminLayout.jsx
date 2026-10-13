import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Avatar, Button, Dropdown, Layout, Menu, Space, Typography } from "antd";
import {
  ApiOutlined,
  AppstoreOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  InboxOutlined,
  LogoutOutlined,
  ShopOutlined,
  TagsOutlined,
  TeamOutlined,
  UserOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import { useAuth } from "../auth/AuthContext";
import { LanguageSwitch, useI18n } from "../i18n";

const { Header, Sider, Content } = Layout;

const navItems = [
  { key: "/admin", icon: <DashboardOutlined />, labelKey: "nav.dashboard" },
  { key: "/admin/products", icon: <AppstoreOutlined />, labelKey: "nav.products" },
  { key: "/admin/orders", icon: <ShopOutlined />, labelKey: "nav.orders" },
  { key: "/admin/customers", icon: <TeamOutlined />, labelKey: "nav.customers" },
  { key: "/admin/inventory", icon: <DatabaseOutlined />, labelKey: "nav.inventory" },
  { key: "/admin/coupons", icon: <TagsOutlined />, labelKey: "nav.coupons" },
  { key: "/admin/users", icon: <UserSwitchOutlined />, labelKey: "nav.users", adminOnly: true },
];

function activeKey(pathname) {
  const match = navItems
    .map((item) => item.key)
    .filter((key) => pathname === key || pathname.startsWith(`${key}/`))
    .sort((a, b) => b.length - a.length);
  return match[0] || "/admin";
}

export default function AdminLayout() {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const isAdmin = Boolean(user?.roles?.includes("admin"));
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const items = navItems
    .filter((item) => isAdmin || !item.adminOnly)
    .map(({ key, icon, labelKey }) => ({ key, icon, label: <Link to={key}>{t(labelKey)}</Link> }));

  const menu = [
    { key: "store", icon: <InboxOutlined />, label: <Link to="/">{t("nav.backToStore")}</Link> },
    { key: "api-docs", icon: <ApiOutlined />, label: t("nav.apiDocs") },
    { type: "divider" },
    { key: "logout", icon: <LogoutOutlined />, label: t("nav.logout"), danger: true },
  ];

  function handleMenu({ key }) {
    if (key === "api-docs") {
      window.open("/api-docs/", "_blank", "noopener");
    }
    if (key === "logout") {
      logout();
      navigate("/login");
    }
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark" width={220} className="admin-sider">
        <div className="admin-brand brand-row">
          <span className="logo">T</span>
          {!collapsed && <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>Thao Store</span>}
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[activeKey(location.pathname)]} items={items} />
      </Sider>
      <Layout>
        <Header className="admin-header">
          <Typography.Title level={5} style={{ margin: 0 }}>
            {t("admin.storeManagement")}
          </Typography.Title>
          <Space>
            <LanguageSwitch />
            <Dropdown menu={{ items: menu, onClick: handleMenu }} trigger={["click"]}>
              <Button type="text">
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} />
                  {user?.username || user?.email}
                </Space>
              </Button>
            </Dropdown>
          </Space>
        </Header>
        <Content className="admin-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
