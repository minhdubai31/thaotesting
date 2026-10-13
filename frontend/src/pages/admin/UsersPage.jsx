import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App, Button, Card, Modal, Result, Select, Space, Table, Tag, Typography } from "antd";
import { EditOutlined } from "@ant-design/icons";
import { useAuth } from "../../auth/AuthContext";
import { api, toQuery } from "../../lib/api";
import { dateText } from "../../lib/format";
import { useI18n } from "../../i18n";
import { useTableParams } from "../../lib/useTableParams";
import SearchInput from "../../components/SearchInput";

const ROLES = ["admin", "manager", "staff", "user"];
const ROLE_COLORS = { admin: "red", manager: "purple", staff: "blue", user: "default" };

export default function UsersPage() {
  const { t } = useI18n();
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
      message.success(t("users.saved"));
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err) => message.error(err.message),
  });

  if (!isAdmin) {
    return <Result status="403" title={t("users.adminsOnly")} subTitle={t("users.adminsOnlyText")} />;
  }

  const removingOwnAdmin = Boolean(editing && editing.id === me.id && !roles.includes("admin"));

  function openEditor(user) {
    setEditing(user);
    setRoles(user.roles);
  }

  const columns = [
    { title: t("common.email"), dataIndex: "email", sorter: true },
    { title: t("common.username"), dataIndex: "username", render: (v) => v || "—" },
    {
      title: t("users.roles"),
      dataIndex: "roles",
      render: (value) => value.map((role) => <Tag key={role} color={ROLE_COLORS[role]}>{t(`users.role.${role}`)}</Tag>),
    },
    { title: t("users.joined"), dataIndex: "createdAt", sorter: true, render: dateText },
    {
      title: "",
      key: "actions",
      width: 140,
      render: (_, user) => (
        <Button size="small" icon={<EditOutlined />} onClick={() => openEditor(user)}>
          {t("users.editRoles")}
        </Button>
      ),
    },
  ];

  return (
    <Card title={t("users.title")}>
      <Space style={{ marginBottom: 16 }}>
        <SearchInput placeholder={t("users.searchPlaceholder")} value={table.filters.q} onSearch={(q) => table.setFilters({ q })} width={300} />
      </Space>
      <Table
        bordered
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.users}
        pagination={table.tablePagination(data?.meta?.total || 0)}
        onChange={table.onTableChange}
      />

      <Modal
        title={t("users.rolesFor", { email: editing?.email || "" })}
        open={Boolean(editing)}
        onCancel={() => setEditing(null)}
        onOk={() => save.mutate({ id: editing.id, roles })}
        okText={t("users.saveRoles")}
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
            options={ROLES.map((role) => ({ value: role, label: t(`users.role.${role}`) }))}
            placeholder={t("users.chooseRole")}
          />
          {removingOwnAdmin && <Typography.Text type="warning">{t("users.ownAdmin")}</Typography.Text>}
        </Space>
      </Modal>
    </Card>
  );
}
