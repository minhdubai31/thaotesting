import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { App, Button, Card, Popconfirm, Select, Space, Table, Tag, Typography } from "antd";
import { EditOutlined, PlusOutlined, StopOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { api, toQuery } from "../../lib/api";
import { vnd } from "../../lib/format";
import { useI18n } from "../../i18n";
import { useMasters } from "../../lib/useMasters";
import { useTableParams } from "../../lib/useTableParams";
import ProductImage from "../../components/ProductImage";
import SearchInput from "../../components/SearchInput";

export default function ProductsPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const table = useTableParams({ sort: "createdAt", order: "desc" });
  const { data: masters } = useMasters();

  // Deactivate hides a product from the storefront; activate puts it back.
  const setActive = useMutation({
    mutationFn: ({ id, active }) =>
      active
        ? api(`/api/products/${id}`, { method: "PATCH", body: { isActive: true } })
        : api(`/api/products/${id}`, { method: "DELETE" }),
    onSuccess: (_data, { active }) => {
      message.success(active ? t("products.activated") : t("products.deactivated"));
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["masters"] });
    },
    onError: (err) => message.error(err.message),
  });

  const query = { page: table.page, pageSize: table.pageSize, sort: table.sort, order: table.order, ...table.filters };
  const { data, isLoading } = useQuery({
    queryKey: ["admin-products", query],
    queryFn: () => api(`/api/products?${toQuery(query)}`),
    placeholderData: (previous) => previous,
  });

  const columns = [
    { title: "", key: "image", width: 72, render: (_, p) => <ProductImage src={p.imageUrl} height={48} /> },
    { title: "SKU", dataIndex: "sku", sorter: true },
    {
      title: t("products.name"),
      dataIndex: "name",
      sorter: true,
      render: (name, p) => <Link to={`/admin/products/${p.id}`}>{name}</Link>,
    },
    { title: t("products.category"), dataIndex: "category", render: (_, p) => p.categoryRef?.name || p.category },
    { title: t("products.price"), dataIndex: "price", sorter: true, align: "right", render: vnd },
    {
      title: t("products.stock"),
      dataIndex: "unitsInStock",
      sorter: true,
      align: "right",
      render: (value, p) => <Typography.Text type={value <= p.reorderLevel ? "danger" : undefined}>{value}</Typography.Text>,
    },
    {
      title: t("products.status"),
      dataIndex: "isActive",
      render: (active) => (active ? <Tag color="green">{t("common.active")}</Tag> : <Tag>{t("common.inactive")}</Tag>),
    },
    {
      title: t("products.actions"),
      key: "actions",
      width: 260,
      render: (_, p) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/admin/products/${p.id}`)}>
            {t("common.edit")}
          </Button>
          {p.isActive ? (
            <Popconfirm
              title={t("products.deactivateQuestion")}
              description={t("products.deactivateNote")}
              okText={t("common.deactivate")}
              okButtonProps={{ danger: true }}
              onConfirm={() => setActive.mutate({ id: p.id, active: false })}
            >
              <Button size="small" danger icon={<StopOutlined />} loading={setActive.isPending}>
                {t("common.deactivate")}
              </Button>
            </Popconfirm>
          ) : (
            <Button size="small" icon={<CheckCircleOutlined />} loading={setActive.isPending} onClick={() => setActive.mutate({ id: p.id, active: true })}>
              {t("common.activate")}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={t("products.title")}
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/admin/products/new")}>
          {t("products.new")}
        </Button>
      }
    >
      <Space wrap style={{ marginBottom: 16 }}>
        <SearchInput
          placeholder={t("products.searchPlaceholder")}
          value={table.filters.q}
          onSearch={(q) => table.setFilters({ ...table.filters, q })}
        />
        <Select
          allowClear
          placeholder={t("products.category")}
          style={{ width: 200 }}
          value={table.filters.categoryId || undefined}
          onChange={(value) => table.setFilters({ ...table.filters, categoryId: value || "" })}
          options={masters?.categories.map((c) => ({ value: c.id, label: c.name }))}
        />
        <Select
          style={{ width: 140 }}
          value={table.filters.status || "all"}
          onChange={(value) => table.setFilters({ ...table.filters, status: value })}
          options={[
            { value: "all", label: t("products.all") },
            { value: "active", label: t("common.active") },
            { value: "inactive", label: t("common.inactive") },
          ]}
        />
      </Space>
      <Table
        bordered
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.products}
        pagination={table.tablePagination(data?.meta?.total || 0)}
        onChange={table.onTableChange}
      />
    </Card>
  );
}
