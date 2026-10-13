import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Button, Card, Input, Space, Table, Tag } from "antd";
import { api, toQuery } from "../../lib/api";
import { useTableParams } from "../../lib/useTableParams";
import ProductImage from "../../components/ProductImage";

export default function InventoryPage() {
  const navigate = useNavigate();
  const table = useTableParams({ sort: "updatedAt", order: "desc" });
  const query = { page: table.page, pageSize: table.pageSize, sort: table.sort, order: table.order, ...table.filters };

  const { data, isLoading } = useQuery({
    queryKey: ["admin-inventory", query],
    queryFn: () => api(`/api/inventory?${toQuery(query)}`),
    placeholderData: keepPreviousData,
  });

  const columns = [
    { title: "", key: "image", width: 72, render: (_, item) => <ProductImage src={item.product?.imageUrl} height={48} /> },
    { title: "Product", render: (_, item) => item.product?.name },
    { title: "SKU", render: (_, item) => item.product?.sku },
    { title: "On hand", dataIndex: "quantity", sorter: true, align: "right" },
    { title: "Reorder at", render: (_, item) => item.product?.reorderLevel ?? 0, align: "right" },
    {
      title: "Status",
      render: (_, item) =>
        item.quantity <= (item.product?.reorderLevel ?? 0) ? <Tag color="orange">Reorder</Tag> : <Tag color="green">OK</Tag>,
    },
    {
      title: "",
      key: "adjust",
      render: (_, item) => <Link to={`/admin/inventory/adjust?productId=${item.productId}`}>Adjust</Link>,
    },
  ];

  return (
    <Card
      title="Inventory"
      extra={
        <Button type="primary" onClick={() => navigate("/admin/inventory/adjust")}>
          Adjust stock
        </Button>
      }
    >
      <Space style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Product name, SKU, brand"
          allowClear
          defaultValue={table.filters.q}
          key={table.filters.q || "q"}
          onSearch={(value) => table.setFilters({ q: value.trim() })}
          style={{ width: 300 }}
        />
      </Space>
      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.inventory}
        pagination={table.tablePagination(data?.meta?.total || 0)}
        onChange={table.onTableChange}
      />
    </Card>
  );
}
