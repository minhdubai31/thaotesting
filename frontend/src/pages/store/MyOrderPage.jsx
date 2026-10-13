import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Button, Card, Col, Descriptions, Empty, Row, Space, Steps, Table, Typography, Popconfirm, App } from "antd";
import { api } from "../../lib/api";
import { dateTimeText, vnd } from "../../lib/format";
import StatusTag from "../../components/StatusTag";
import ProductImage from "../../components/ProductImage";

const progress = { pending: 0, paid: 1, shipped: 2, completed: 3 };

export default function MyOrderPage() {
  const { message } = App.useApp();
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["my-order", id],
    queryFn: async () => (await api(`/api/my/orders/${id}`)).order,
  });

  const cancel = useMutation({
    mutationFn: () => api(`/api/my/orders/${id}/cancel`, { method: "POST" }),
    onSuccess: () => {
      message.success("Order cancelled.");
      queryClient.invalidateQueries({ queryKey: ["my-order", id] });
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
    },
    onError: (err) => message.error(err.message),
  });

  if (isLoading) return null;
  if (error || !data) return <Empty description="Order not found." />;

  const order = data;
  const step = progress[order.status];
  const cancelled = order.status === "cancelled" || order.status === "refunded";

  const columns = [
    {
      title: "Product",
      dataIndex: "name",
      render: (_, item) => (
        <Space>
          <div style={{ width: 48 }}>
            <ProductImage src={item.imageUrl} height={48} />
          </div>
          <Link to={`/product/${item.slug}`}>{item.name}</Link>
        </Space>
      ),
    },
    { title: "Price", dataIndex: "unitPrice", align: "right", render: vnd },
    { title: "Qty", dataIndex: "quantity", align: "center" },
    { title: "Total", dataIndex: "lineTotal", align: "right", render: vnd },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Row justify="space-between" align="middle">
        <Col>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Order #{order.id.slice(0, 8)} <StatusTag status={order.status} />
          </Typography.Title>
        </Col>
        <Col>
          {order.status === "pending" && (
            <Popconfirm title="Cancel this order?" okText="Cancel order" onConfirm={() => cancel.mutate()}>
              <Button danger loading={cancel.isPending}>
                Cancel order
              </Button>
            </Popconfirm>
          )}
        </Col>
      </Row>

      {!cancelled && (
        <Card>
          <Steps
            current={step}
            items={[
              { title: "Placed" },
              { title: "Paid" },
              { title: "Shipped" },
              { title: "Delivered" },
            ]}
          />
        </Card>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Delivery">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Recipient">{order.shipName}</Descriptions.Item>
              <Descriptions.Item label="Address">
                {[order.shipAddress, order.shipCity].filter(Boolean).join(", ")}
              </Descriptions.Item>
              <Descriptions.Item label="Tracking">{order.trackingNumber || "Not shipped yet"}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Payment">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Method">{order.paymentMethod === "card" ? "Card" : "Cash on delivery"}</Descriptions.Item>
              <Descriptions.Item label="Payment">{order.paymentStatus}</Descriptions.Item>
              <Descriptions.Item label="Placed">{dateTimeText(order.orderDate)}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Card title="Items">
        <Table rowKey="productId" columns={columns} dataSource={order.items} pagination={false} />
        <Descriptions column={1} size="small" style={{ marginTop: 16, maxWidth: 360, marginLeft: "auto" }}>
          <Descriptions.Item label="Subtotal">{vnd(order.subtotal)}</Descriptions.Item>
          {order.discountAmount > 0 && (
            <Descriptions.Item label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`}>
              -{vnd(order.discountAmount)}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Shipping">{order.shipping === 0 ? "Free" : vnd(order.shipping)}</Descriptions.Item>
          <Descriptions.Item label={<strong>Total</strong>}>
            <strong>{vnd(order.total)}</strong>
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </Space>
  );
}
