import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Card, Table, Typography } from "antd";
import { api } from "../../lib/api";
import { dateText, vnd } from "../../lib/format";
import { useI18n } from "../../i18n";
import StatusTag from "../../components/StatusTag";
import { useTableParams } from "../../lib/useTableParams";

export default function MyOrdersPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const table = useTableParams({ pageSize: 10 });

  const { data, isLoading } = useQuery({
    queryKey: ["my-orders", table.page, table.pageSize],
    queryFn: () => api(`/api/my/orders?page=${table.page}&pageSize=${table.pageSize}`),
    placeholderData: (previous) => previous,
  });

  const columns = [
    { title: t("orders.order"), dataIndex: "id", render: (id) => <Link to={`/orders/${id}`}>#{id.slice(0, 8)}</Link> },
    { title: t("orders.date"), dataIndex: "orderDate", render: dateText },
    { title: t("orders.items"), dataIndex: "items", render: (items) => items.reduce((sum, item) => sum + item.quantity, 0) },
    { title: t("orders.total"), dataIndex: "total", align: "right", render: vnd },
    { title: t("orders.status"), dataIndex: "status", render: (status) => <StatusTag status={status} /> },
  ];

  return (
    <Card title={<Typography.Title level={4} style={{ margin: 0 }}>{t("nav.myOrders")}</Typography.Title>}>
      <Table
        bordered
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.orders}
        pagination={table.tablePagination(data?.meta?.total || 0)}
        onChange={table.onTableChange}
        onRow={(record) => ({ onClick: () => navigate(`/orders/${record.id}`), style: { cursor: "pointer" } })}
      />
    </Card>
  );
}
