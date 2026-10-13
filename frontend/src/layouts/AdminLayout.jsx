import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Avatar, Button, Dropdown, Layout, Menu, Space, Typography } from "antd";
import {
  AppstoreOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  InboxOutlined,
  LogoutOutlined,
  ShopOutlined,
  TagsOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useAuth } from "../auth/AuthContext";

const { Header, Sider, Content } = Layout;

const navItems = [
  { key: "/admin", icon: <DashboardOutlined />, label: <Link to="/admin">Dashboard</Link> },
  { key: "/admin/products", icon: <AppstoreOutlined />, label: <Link to="/admin/products">Products</Link> },
  { key: "/admin/orders", icon: <ShopOutlined />, label: <Link to="/admin/orders">Orders</Link> },
  { key: "/admin/customers", icon: <TeamOutlined />, label: <Link to="/admin/customers">Customers</Link> },
  { key: "/admin/inventory", icon: <DatabaseOutlined />, label: <Link to="/admin/inventory">Inventory</Link> },
  { key: "/admin/coupons", icon: <TagsOutlined />, label: <Link to="/admin/coupons">Coupons</Link> },
];

function activeKey(pathname) {
  const match = navItems
    .map((item) => item.key)
    .filter((key) => pathname === key || pathname.startsWith(`${key}/`))
    .sort((a, b) => b.length - a.length);
  return match[0] || "/admin";
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const menu = [
    { key: "store", icon: <InboxOutlined />, label: <Link to="/">Back to store</Link> },
    { type: "divider" },
    { key: "logout", icon: <LogoutOutlined />, label: "Log out", danger: true },
  ];

  function handleMenu({ key }) {
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
        <Menu theme="dark" mode="inline" selectedKeys={[activeKey(location.pathname)]} items={navItems} />
      </Sider>
      <Layout>
        <Header className="admin-header">
          <Typography.Title level={5} style={{ margin: 0 }}>
            Store management
          </Typography.Title>
          <Dropdown menu={{ items: menu, onClick: handleMenu }} trigger={["click"]}>
            <Button type="text">
              <Space>
                <Avatar size="small" icon={<UserOutlined />} />
                {user?.username || user?.email}
              </Space>
            </Button>
          </Dropdown>
        </Header>
        <Content className="admin-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
