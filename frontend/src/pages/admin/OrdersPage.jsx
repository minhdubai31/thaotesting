import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button, Card, Input, Modal, Select, Space, Table, Typography, App } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { api, toQuery } from "../../lib/api";
import { NEXT_STATUSES, ORDER_STATUSES, STATUS_LABELS, dateText, vnd } from "../../lib/format";
import { useTableParams } from "../../lib/useTableParams";
import StatusTag from "../../components/StatusTag";

export default function OrdersPage() {
  const { message } = App.useApp();
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
      message.success("Order updated.");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      setShipping(null);
    },
    onError: (err) => message.error(err.message),
  });

  function handleStatusChange(order, status) {
    if (status === "shipped") {
      setShipping({ order, status, tracking: order.trackingNumber || "" });
      return;
    }
    changeStatus.mutate({ id: order.id, status });
  }

  const columns = [
    { title: "Order", dataIndex: "id", render: (id) => <Typography.Text code>#{id.slice(0, 8)}</Typography.Text> },
    { title: "Date", dataIndex: "orderDate", sorter: true, render: dateText },
    { title: "Customer", render: (_, o) => o.customer?.name || o.shipName || "Walk-in" },
    { title: "Items", render: (_, o) => (o.items || []).reduce((sum, item) => sum + item.quantity, 0), align: "center" },
    { title: "Total", dataIndex: "totalAmount", sorter: true, align: "right", render: vnd },
    {
      title: "Status",
      dataIndex: "status",
      width: 200,
      render: (status, order) => {
        const options = [status, ...(NEXT_STATUSES[status] || [])].map((s) => ({
          value: s,
          label: STATUS_LABELS[s] || s,
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
      title="Orders"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/admin/orders/new")}>
          New order
        </Button>
      }
    >
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Customer, ship name, city"
          allowClear
          defaultValue={table.filters.q}
          key={table.filters.q || "q"}
          onSearch={(value) => table.setFilters({ ...table.filters, q: value.trim() })}
          style={{ width: 280 }}
        />
        <Select
          allowClear
          placeholder="All statuses"
          style={{ width: 180 }}
          value={table.filters.status || undefined}
          onChange={(value) => table.setFilters({ ...table.filters, status: value || "" })}
          options={ORDER_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
        />
      </Space>
      <Table
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
              {order.trackingNumber && <Typography.Text type="secondary">Tracking: {order.trackingNumber}</Typography.Text>}
            </Space>
          ),
        }}
      />

      <Modal
        title="Ship order"
        open={Boolean(shipping)}
        onCancel={() => setShipping(null)}
        onOk={() => changeStatus.mutate({ id: shipping.order.id, status: "shipped", trackingNumber: shipping.tracking })}
        okText="Mark as shipped"
        confirmLoading={changeStatus.isPending}
      >
        <Typography.Paragraph>Add the carrier tracking number (optional).</Typography.Paragraph>
        <Input
          placeholder="Tracking number"
          value={shipping?.tracking}
          onChange={(event) => setShipping((current) => ({ ...current, tracking: event.target.value }))}
        />
      </Modal>
    </Card>
  );
}
