import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App, Button, Card, Modal, Result, Select, Space, Table, Tag, Typography } from "antd";
import { EditOutlined } from "@ant-design/icons";
import { useAuth } from "../../auth/AuthContext";
import { api, toQuery } from "../../lib/api";
import { dateText } from "../../lib/format";
import { useTableParams } from "../../lib/useTableParams";
import SearchInput from "../../components/SearchInput";

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "staff", label: "Staff" },
  { value: "user", label: "User" },
];

const ROLE_COLORS = { admin: "red", manager: "purple", staff: "blue", user: "default" };

export default function UsersPage() {
  const { message } = App.useApp();
  const { user: me } = useAuth();
  const queryClient = useQueryClient();
  const table = useTableParams({ sort: "createdAt", order: "desc" });
  const [editing, setEditing] = useState(null);
  const [roles, setRoles] = useState([]);
  const isAdmin = Boolean(me?.roles?.includes("admin"));

  const query = { page: table.page, pageSize: table.pageSize, sort: table.sort, order: table.order, ...table.filters };
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", query],
    queryFn: () => api(`/api/users?${toQuery(query)}`),
    placeholderData: keepPreviousData,
    enabled: isAdmin,
  });

  const save = useMutation({
    mutationFn: ({ id, roles: nextRoles }) => api(`/api/users/${id}/roles`, { method: "PATCH", body: { roles: nextRoles } }),
    onSuccess: () => {
      message.success("Roles updated.");
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err) => message.error(err.message),
  });

  if (!isAdmin) {
    return <Result status="403" title="Admins only" subTitle="Only admins can manage user roles." />;
  }

  const removingOwnAdmin = Boolean(editing && editing.id === me.id && !roles.includes("admin"));

  function openEditor(user) {
    setEditing(user);
    setRoles(user.roles);
  }

  const columns = [
    { title: "Email", dataIndex: "email", sorter: true },
    { title: "Username", dataIndex: "username", render: (v) => v || "—" },
    {
      title: "Roles",
      dataIndex: "roles",
      render: (value) => value.map((role) => <Tag key={role} color={ROLE_COLORS[role]}>{role}</Tag>),
    },
    { title: "Joined", dataIndex: "createdAt", sorter: true, render: dateText },
    {
      title: "",
      key: "actions",
      width: 140,
      render: (_, user) => (
        <Button size="small" icon={<EditOutlined />} onClick={() => openEditor(user)}>
          Edit roles
        </Button>
      ),
    },
  ];

  return (
    <Card title="Users">
      <Space style={{ marginBottom: 16 }}>
        <SearchInput placeholder="Email or username" value={table.filters.q} onSearch={(q) => table.setFilters({ q })} width={300} />
      </Space>
      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.users}
        pagination={table.tablePagination(data?.meta?.total || 0)}
        onChange={table.onTableChange}
      />

      <Modal
        title={`Roles for ${editing?.email || ""}`}
        open={Boolean(editing)}
        onCancel={() => setEditing(null)}
        onOk={() => save.mutate({ id: editing.id, roles })}
        okText="Save roles"
        confirmLoading={save.isPending}
        okButtonProps={{ disabled: roles.length === 0 || removingOwnAdmin }}
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Select
            mode="multiple"
            style={{ width: "100%" }}
            value={roles}
            onChange={setRoles}
            options={ROLE_OPTIONS}
            placeholder="Choose at least one role"
          />
          {removingOwnAdmin && <Typography.Text type="warning">You cannot remove your own admin role.</Typography.Text>}
        </Space>
      </Modal>
    </Card>
  );
}
