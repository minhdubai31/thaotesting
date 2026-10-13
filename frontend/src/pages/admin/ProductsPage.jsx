import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Button, Card, Input, Select, Space, Table, Tag, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { api, toQuery } from "../../lib/api";
import { vnd } from "../../lib/format";
import { useMasters } from "../../lib/useMasters";
import { useTableParams } from "../../lib/useTableParams";
import ProductImage from "../../components/ProductImage";

export default function ProductsPage() {
  const navigate = useNavigate();
  const table = useTableParams({ sort: "createdAt", order: "desc" });
  const { data: masters } = useMasters();

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
      title: "Name",
      dataIndex: "name",
      sorter: true,
      render: (name, p) => <Link to={`/admin/products/${p.id}`}>{name}</Link>,
    },
    { title: "Category", dataIndex: "category", render: (_, p) => p.categoryRef?.name || p.category },
    { title: "Price", dataIndex: "price", sorter: true, align: "right", render: vnd },
    {
      title: "Stock",
      dataIndex: "unitsInStock",
      sorter: true,
      align: "right",
      render: (value, p) => <Typography.Text type={value <= p.reorderLevel ? "danger" : undefined}>{value}</Typography.Text>,
    },
    { title: "Status", dataIndex: "isActive", render: (active) => (active ? <Tag color="green">Active</Tag> : <Tag>Inactive</Tag>) },
  ];

  return (
    <Card
      title="Products"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/admin/products/new")}>
          New product
        </Button>
      }
    >
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Name, SKU, brand"
          allowClear
          defaultValue={table.filters.q}
          key={table.filters.q || "q"}
          onSearch={(value) => table.setFilters({ ...table.filters, q: value.trim() })}
          style={{ width: 260 }}
        />
        <Select
          allowClear
          placeholder="Category"
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
            { value: "all", label: "All" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
        />
      </Space>
      <Table
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
