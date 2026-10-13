import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { Alert, Button, Card, Col, Divider, Empty, Form, Input, Radio, Row, Space, Typography, App } from "antd";
import { api } from "../../lib/api";
import { useCart } from "../../lib/useCart";
import { vnd } from "../../lib/format";

export default function CheckoutPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const cart = useCart(true);
  const [addressId, setAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [couponCode, setCouponCode] = useState("");
  const [addingAddress, setAddingAddress] = useState(false);
  const [addressForm] = Form.useForm();

  const addresses = useQuery({
    queryKey: ["addresses"],
    queryFn: async () => (await api("/api/addresses")).addresses,
  });

  const saveAddress = useMutation({
    mutationFn: (values) => api("/api/addresses", { method: "POST", body: { ...values, isDefault: addresses.data?.length === 0 } }),
    onSuccess: (data) => {
      setAddressId(data.address.id);
      setAddingAddress(false);
      addressForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
    onError: (err) => message.error(err.message),
  });

  const placeOrder = useMutation({
    mutationFn: () => api("/api/checkout", { method: "POST", body: { addressId, paymentMethod, couponCode: couponCode || undefined } }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      message.success("Order placed.");
      navigate(`/orders/${data.order.id}`);
    },
    onError: (err) => message.error(err.message),
  });

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

  const chosen = addresses.data?.find((a) => a.id === (addressId || addresses.data?.find((x) => x.isDefault)?.id));
  const selectedId = chosen?.id;

  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={15}>
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Card title="Delivery address">
            {addresses.data?.length ? (
              <Radio.Group value={selectedId} onChange={(event) => setAddressId(event.target.value)} style={{ width: "100%" }}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  {addresses.data.map((address) => (
                    <Radio key={address.id} value={address.id} style={{ border: "1px solid #f0f0f0", borderRadius: 8, padding: 12, width: "100%" }}>
                      <Typography.Text strong>{address.fullName}</Typography.Text> · {address.phone}
                      <br />
                      <Typography.Text type="secondary">
                        {address.line1}, {address.city}
                      </Typography.Text>
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            ) : (
              <Typography.Text type="secondary">No saved addresses yet. Add one below.</Typography.Text>
            )}

            {addingAddress ? (
              <Form form={addressForm} layout="vertical" style={{ marginTop: 16 }} onFinish={(values) => saveAddress.mutate(values)}>
                <Row gutter={12}>
                  <Col xs={24} md={12}>
                    <Form.Item name="fullName" label="Full name" rules={[{ required: true }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item name="line1" label="Street address" rules={[{ required: true }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="city" label="City" rules={[{ required: true }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="region" label="Province / region">
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>
                <Space>
                  <Button type="primary" htmlType="submit" loading={saveAddress.isPending}>
                    Save address
                  </Button>
                  <Button onClick={() => setAddingAddress(false)}>Cancel</Button>
                </Space>
              </Form>
            ) : (
              <Button style={{ marginTop: 12 }} onClick={() => setAddingAddress(true)}>
                Add new address
              </Button>
            )}
          </Card>

          <Card title="Payment">
            <Radio.Group value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
              <Space direction="vertical">
                <Radio value="cod">Cash on delivery</Radio>
                <Radio value="card">Card (demo: marked as paid instantly)</Radio>
              </Space>
            </Radio.Group>
          </Card>

          <Card title="Coupon">
            <Space.Compact style={{ width: "100%", maxWidth: 420 }}>
              <Input placeholder="Enter coupon code" value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} />
            </Space.Compact>
            <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
              The discount is applied when you place the order.
            </Typography.Paragraph>
          </Card>
        </Space>
      </Col>

      <Col xs={24} lg={9}>
        <Card title="Order summary">
          {cart.data.items.map((item) => (
            <Row key={item.productId} justify="space-between" style={{ marginBottom: 8 }}>
              <Typography.Text>
                {item.name} × {item.quantity}
              </Typography.Text>
              <Typography.Text>{vnd(item.lineTotal)}</Typography.Text>
            </Row>
          ))}
          <Divider />
          <Row justify="space-between">
            <Typography.Text>Subtotal</Typography.Text>
            <Typography.Text>{vnd(cart.data.subtotal)}</Typography.Text>
          </Row>
          <Row justify="space-between">
            <Typography.Text>Shipping</Typography.Text>
            <Typography.Text>{cart.data.shipping === 0 ? "Free" : vnd(cart.data.shipping)}</Typography.Text>
          </Row>
          <Divider />
          <Row justify="space-between" style={{ marginBottom: 16 }}>
            <Typography.Title level={5} style={{ margin: 0 }}>
              Total
            </Typography.Title>
            <Typography.Title level={5} style={{ margin: 0 }}>
              {vnd(cart.data.total)}
            </Typography.Title>
          </Row>
          {!selectedId && <Alert type="info" showIcon message="Choose or add a delivery address to continue." style={{ marginBottom: 12 }} />}
          <Button type="primary" size="large" block disabled={!selectedId || cart.data.items.length === 0} loading={placeOrder.isPending} onClick={() => placeOrder.mutate()}>
            Place order
          </Button>
        </Card>
      </Col>
    </Row>
  );
}
