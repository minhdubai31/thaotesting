import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Button, Card, Space, Table, Tag } from "antd";
import { api, toQuery } from "../../lib/api";
import { useI18n } from "../../i18n";
import { useTableParams } from "../../lib/useTableParams";
import ProductImage from "../../components/ProductImage";
import SearchInput from "../../components/SearchInput";

export default function InventoryPage() {
  const { t } = useI18n();
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
    { title: t("inventory.product"), render: (_, item) => item.product?.name },
    { title: "SKU", render: (_, item) => item.product?.sku },
    { title: t("inventory.onHand"), dataIndex: "quantity", sorter: true, align: "right" },
    { title: t("inventory.reorderAt"), render: (_, item) => item.product?.reorderLevel ?? 0, align: "right" },
    {
      title: t("inventory.status"),
      render: (_, item) =>
        item.quantity <= (item.product?.reorderLevel ?? 0) ? (
          <Tag color="orange">{t("inventory.reorder")}</Tag>
        ) : (
          <Tag color="green">{t("common.ok")}</Tag>
        ),
    },
    {
      title: "",
      key: "adjust",
      render: (_, item) => <Link to={`/admin/inventory/adjust?productId=${item.productId}`}>{t("common.adjust")}</Link>,
    },
  ];

  return (
    <Card
      title={t("inventory.title")}
      extra={
        <Button type="primary" onClick={() => navigate("/admin/inventory/adjust")}>
          {t("inventory.adjustStock")}
        </Button>
      }
    >
      <Space style={{ marginBottom: 16 }}>
        <SearchInput placeholder={t("inventory.searchPlaceholder")} value={table.filters.q} onSearch={(q) => table.setFilters({ q })} width={300} />
      </Space>
      <Table
        bordered
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
