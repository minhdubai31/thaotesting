import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Button, Card, Col, Descriptions, Empty, Row, Space, Steps, Table, Typography, Popconfirm, App } from "antd";
import { api } from "../../lib/api";
import { dateTimeText, vnd } from "../../lib/format";
import { useI18n } from "../../i18n";
import StatusTag from "../../components/StatusTag";
import ProductImage from "../../components/ProductImage";

const progress = { pending: 0, paid: 1, shipped: 2, completed: 3 };

export default function MyOrderPage() {
  const { t } = useI18n();
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
      message.success(t("order.cancelled"));
      queryClient.invalidateQueries({ queryKey: ["my-order", id] });
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
    },
    onError: (err) => message.error(err.message),
  });

  if (isLoading) return null;
  if (error || !data) return <Empty description={t("order.notFound")} />;

  const order = data;
  const step = progress[order.status];
  const cancelled = order.status === "cancelled" || order.status === "refunded";

  const columns = [
    {
      title: t("order.product"),
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
    { title: t("order.price"), dataIndex: "unitPrice", align: "right", render: vnd },
    { title: t("order.qty"), dataIndex: "quantity", align: "center" },
    { title: t("order.lineTotal"), dataIndex: "lineTotal", align: "right", render: vnd },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Row justify="space-between" align="middle">
        <Col>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {t("order.title", { id: order.id.slice(0, 8) })} <StatusTag status={order.status} />
          </Typography.Title>
        </Col>
        <Col>
          {order.status === "pending" && (
            <Popconfirm title={t("order.cancelConfirm")} okText={t("order.cancelButton")} onConfirm={() => cancel.mutate()}>
              <Button danger loading={cancel.isPending}>
                {t("order.cancelButton")}
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
              { title: t("order.step.placed") },
              { title: t("order.step.paid") },
              { title: t("order.step.shipped") },
              { title: t("order.step.delivered") },
            ]}
          />
        </Card>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title={t("order.delivery")}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label={t("order.recipient")}>{order.shipName}</Descriptions.Item>
              <Descriptions.Item label={t("order.address")}>
                {[order.shipAddress, order.shipCity].filter(Boolean).join(", ")}
              </Descriptions.Item>
              <Descriptions.Item label={t("order.tracking")}>{order.trackingNumber || t("order.notShipped")}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title={t("checkout.payment")}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label={t("order.method")}>{order.paymentMethod === "card" ? t("order.card") : t("checkout.cod")}</Descriptions.Item>
              <Descriptions.Item label={t("order.paymentStatus")}>{order.paymentStatus}</Descriptions.Item>
              <Descriptions.Item label={t("order.placed")}>{dateTimeText(order.orderDate)}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Card title={t("order.items")}>
        <Table bordered rowKey="productId" columns={columns} dataSource={order.items} pagination={false} />
        <Descriptions column={1} size="small" style={{ marginTop: 16, maxWidth: 360, marginLeft: "auto" }}>
          <Descriptions.Item label={t("cart.subtotal")}>{vnd(order.subtotal)}</Descriptions.Item>
          {order.discountAmount > 0 && (
            <Descriptions.Item label={`${t("order.discount")}${order.couponCode ? ` (${order.couponCode})` : ""}`}>
              -{vnd(order.discountAmount)}
            </Descriptions.Item>
          )}
          <Descriptions.Item label={t("cart.shipping")}>{order.shipping === 0 ? t("cart.free") : vnd(order.shipping)}</Descriptions.Item>
          <Descriptions.Item label={<strong>{t("cart.totalLabel")}</strong>}>
            <strong>{vnd(order.total)}</strong>
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </Space>
  );
}
