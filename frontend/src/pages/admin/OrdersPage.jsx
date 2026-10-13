import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { App, Button, Card, Input, Modal, Select, Space, Table, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { api, toQuery } from "../../lib/api";
import { NEXT_STATUSES, ORDER_STATUSES, dateText, statusLabel, vnd } from "../../lib/format";
import { useI18n } from "../../i18n";
import { useTableParams } from "../../lib/useTableParams";
import StatusTag from "../../components/StatusTag";
import SearchInput from "../../components/SearchInput";

export default function OrdersPage() {
  const { t } = useI18n();
  const { message, modal } = App.useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const table = useTableParams({ sort: "orderDate", order: "desc" });
  const [shipping, setShipping] = useState(null); // { order, status, tracking }

  const query = { page: table.page, pageSize: table.pageSize, sort: table.sort, order: table.order, ...table.filters };
  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", query],
    queryFn: () => api(`/api/orders?${toQuery(query)}`),
    placeholderData: keepPreviousData,
  });

  const changeStatus = useMutation({
    mutationFn: ({ id, status, trackingNumber }) =>
      api(`/api/orders/${id}/status`, { method: "PATCH", body: { status, trackingNumber: trackingNumber || undefined } }),
    onSuccess: () => {
      message.success(t("admin.orders.updated"));
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      setShipping(null);
    },
    onError: (err) => message.error(err.message),
  });

  // Shipping asks for a tracking number first; every other change needs confirmation.
  function handleStatusChange(order, status) {
    if (status === "shipped") {
      setShipping({ order, status, tracking: order.trackingNumber || "" });
      return;
    }

    const label = statusLabel(status);
    const danger = status === "cancelled" || status === "refunded";

    modal.confirm({
      title: t("admin.orders.changeTitle", { id: order.id.slice(0, 8), status: label }),
      content:
        status === "refunded"
          ? t("admin.orders.refundedNote")
          : status === "cancelled"
            ? t("admin.orders.cancelledNote")
            : t("admin.orders.statusNote", { from: statusLabel(order.status), to: label }),
      okText: t("admin.orders.confirmOk", { status: label.toLowerCase() }),
      okButtonProps: { danger },
      cancelText: t("admin.orders.keepCurrent"),
      onOk: () => changeStatus.mutateAsync({ id: order.id, status }).catch(() => {}),
    });
  }

  const columns = [
    { title: t("orders.order"), dataIndex: "id", render: (id) => <Typography.Text code>#{id.slice(0, 8)}</Typography.Text> },
    { title: t("orders.date"), dataIndex: "orderDate", sorter: true, render: dateText },
    { title: t("admin.orders.customer"), render: (_, o) => o.customer?.name || o.shipName || t("admin.orders.walkIn") },
    { title: t("orders.items"), render: (_, o) => (o.items || []).reduce((sum, item) => sum + item.quantity, 0), align: "center" },
    { title: t("orders.total"), dataIndex: "totalAmount", sorter: true, align: "right", render: vnd },
    {
      title: t("orders.status"),
      dataIndex: "status",
      width: 200,
      render: (status, order) => {
        const options = [status, ...(NEXT_STATUSES[status] || [])].map((s) => ({
          value: s,
          label: statusLabel(s),
          disabled: s !== status && !(NEXT_STATUSES[status] || []).includes(s),
        }));
        return (
          <Select
            size="small"
            value={status}
            style={{ width: 170 }}
            options={options}
            disabled={(NEXT_STATUSES[status] || []).length === 0 || changeStatus.isPending}
            onChange={(next) => handleStatusChange(order, next)}
          />
        );
      },
    },
  ];

  return (
    <Card
      title={t("admin.orders.title")}
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/admin/orders/new")}>
          {t("admin.orders.new")}
        </Button>
      }
    >
      <Space wrap style={{ marginBottom: 16 }}>
        <SearchInput
          placeholder={t("admin.orders.searchPlaceholder")}
          value={table.filters.q}
          onSearch={(q) => table.setFilters({ ...table.filters, q })}
          width={280}
        />
        <Select
          allowClear
          placeholder={t("admin.orders.allStatuses")}
          style={{ width: 180 }}
          value={table.filters.status || undefined}
          onChange={(value) => table.setFilters({ ...table.filters, status: value || "" })}
          options={ORDER_STATUSES.map((s) => ({ value: s, label: statusLabel(s) }))}
        />
      </Space>
      <Table
        bordered
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.orders}
        pagination={table.tablePagination(data?.meta?.total || 0)}
        onChange={table.onTableChange}
        expandable={{
          expandedRowRender: (order) => (
            <Space direction="vertical">
              {(order.items || []).map((item) => (
                <Typography.Text key={item.id}>
                  {item.product?.name} × {item.quantity} — {vnd(item.lineTotal)}
                </Typography.Text>
              ))}
              {order.trackingNumber && (
                <Typography.Text type="secondary">{t("admin.orders.tracking", { tracking: order.trackingNumber })}</Typography.Text>
              )}
            </Space>
          ),
        }}
      />

      <Modal
        title={t("admin.orders.shipTitle")}
        open={Boolean(shipping)}
        onCancel={() => setShipping(null)}
        onOk={() => changeStatus.mutate({ id: shipping.order.id, status: "shipped", trackingNumber: shipping.tracking })}
        okText={t("admin.orders.markShipped")}
        confirmLoading={changeStatus.isPending}
      >
        <Typography.Paragraph>{t("admin.orders.trackingHelp")}</Typography.Paragraph>
        <Input
          placeholder={t("admin.orders.trackingPlaceholder")}
          value={shipping?.tracking}
          onChange={(event) => setShipping((current) => ({ ...current, tracking: event.target.value }))}
        />
      </Modal>
    </Card>
  );
}
