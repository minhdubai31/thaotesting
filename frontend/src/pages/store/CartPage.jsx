import { Link, useNavigate } from "react-router-dom";
import { Button, Card, Col, Empty, InputNumber, Row, Space, Table, Typography, App } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useCart, useCartActions } from "../../lib/useCart";
import { vnd } from "../../lib/format";
import ProductImage from "../../components/ProductImage";

export default function CartPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const cart = useCart(true);
  const { updateItem, removeItem } = useCartActions();

  if (!cart.data) return null;

  if (cart.data.items.length === 0) {
    return (
      <Empty description="Your cart is empty.">
        <Link to="/shop">
          <Button type="primary">Continue shopping</Button>
        </Link>
      </Empty>
    );
  }

  const columns = [
    {
      title: "Product",
      dataIndex: "name",
      render: (_, item) => (
        <Space>
          <div style={{ width: 56 }}><ProductImage src={item.imageUrl} height={56} /></div>
          <Link to={`/product/${item.slug}`}>{item.name}</Link>
        </Space>
      ),
    },
    { title: "Price", dataIndex: "unitPrice", align: "right", render: (value) => vnd(value) },
    {
      title: "Quantity",
      dataIndex: "quantity",
      align: "center",
      render: (value, item) => (
        <InputNumber
          min={1}
          max={Math.max(1, item.available)}
          value={value}
          onChange={(next) => {
            if (next && next !== value) {
              updateItem.mutate(
                { productId: item.productId, quantity: next },
                { onError: (err) => message.error(err.message) }
              );
            }
          }}
        />
      ),
    },
    { title: "Total", dataIndex: "lineTotal", align: "right", render: (value) => <Typography.Text strong>{vnd(value)}</Typography.Text> },
    {
      title: "",
      key: "remove",
      render: (_, item) => (
        <Button danger type="text" icon={<DeleteOutlined />} onClick={() => removeItem.mutate(item.productId)} aria-label="Remove" />
      ),
    },
  ];

  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={16}>
        <Card title={`Shopping cart (${cart.data.itemCount} items)`}>
          <Table bordered rowKey="productId" columns={columns} dataSource={cart.data.items} pagination={false} />
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card title="Summary">
          <Space direction="vertical" style={{ width: "100%" }} size={8}>
            <Row justify="space-between">
              <Typography.Text>Subtotal</Typography.Text>
              <Typography.Text>{vnd(cart.data.subtotal)}</Typography.Text>
            </Row>
            <Row justify="space-between">
              <Typography.Text>Shipping</Typography.Text>
              <Typography.Text>{cart.data.shipping === 0 ? "Free" : vnd(cart.data.shipping)}</Typography.Text>
            </Row>
            <Row justify="space-between">
              <Typography.Title level={5} style={{ margin: 0 }}>
                Total
              </Typography.Title>
              <Typography.Title level={5} style={{ margin: 0 }}>
                {vnd(cart.data.total)}
              </Typography.Title>
            </Row>
            <Button type="primary" size="large" block onClick={() => navigate("/checkout")}>
              Checkout
            </Button>
          </Space>
        </Card>
      </Col>
    </Row>
  );
}
