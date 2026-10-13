import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { Alert, Button, Card, Col, Divider, Empty, Form, Input, Radio, Row, Space, Typography, App } from "antd";
import { api } from "../../lib/api";
import { useCart } from "../../lib/useCart";
import { vnd } from "../../lib/format";
import { useI18n } from "../../i18n";

export default function CheckoutPage() {
  const { t } = useI18n();
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
      message.success(t("checkout.orderPlaced"));
      navigate(`/orders/${data.order.id}`);
    },
    onError: (err) => message.error(err.message),
  });

  if (!cart.data) return null;

  if (cart.data.items.length === 0) {
    return (
      <Empty description={t("cart.empty")}>
        <Link to="/shop">
          <Button type="primary">{t("cart.continue")}</Button>
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
          <Card title={t("checkout.address")}>
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
              <Typography.Text type="secondary">{t("checkout.noAddress")}</Typography.Text>
            )}

            {addingAddress ? (
              <Form form={addressForm} layout="vertical" style={{ marginTop: 16 }} onFinish={(values) => saveAddress.mutate(values)}>
                <Row gutter={12}>
                  <Col xs={24} md={12}>
                    <Form.Item name="fullName" label={t("checkout.fullName")} rules={[{ required: true }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="phone" label={t("checkout.phone")} rules={[{ required: true }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item name="line1" label={t("checkout.street")} rules={[{ required: true }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="city" label={t("checkout.city")} rules={[{ required: true }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="region" label={t("checkout.region")}>
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>
                <Space>
                  <Button type="primary" htmlType="submit" loading={saveAddress.isPending}>
                    {t("checkout.saveAddress")}
                  </Button>
                  <Button onClick={() => setAddingAddress(false)}>{t("common.cancel")}</Button>
                </Space>
              </Form>
            ) : (
              <Button style={{ marginTop: 12 }} onClick={() => setAddingAddress(true)}>
                {t("checkout.addAddress")}
              </Button>
            )}
          </Card>

          <Card title={t("checkout.payment")}>
            <Radio.Group value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
              <Space direction="vertical">
                <Radio value="cod">{t("checkout.cod")}</Radio>
                <Radio value="card">{t("checkout.card")}</Radio>
              </Space>
            </Radio.Group>
          </Card>

          <Card title={t("checkout.coupon")}>
            <Space.Compact style={{ width: "100%", maxWidth: 420 }}>
              <Input placeholder={t("checkout.couponPlaceholder")} value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} />
            </Space.Compact>
            <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
              {t("checkout.couponNote")}
            </Typography.Paragraph>
          </Card>
        </Space>
      </Col>

      <Col xs={24} lg={9}>
        <Card title={t("checkout.summary")}>
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
            <Typography.Text>{t("cart.subtotal")}</Typography.Text>
            <Typography.Text>{vnd(cart.data.subtotal)}</Typography.Text>
          </Row>
          <Row justify="space-between">
            <Typography.Text>{t("cart.shipping")}</Typography.Text>
            <Typography.Text>{cart.data.shipping === 0 ? t("cart.free") : vnd(cart.data.shipping)}</Typography.Text>
          </Row>
          <Divider />
          <Row justify="space-between" style={{ marginBottom: 16 }}>
            <Typography.Title level={5} style={{ margin: 0 }}>
              {t("cart.totalLabel")}
            </Typography.Title>
            <Typography.Title level={5} style={{ margin: 0 }}>
              {vnd(cart.data.total)}
            </Typography.Title>
          </Row>
          {!selectedId && <Alert type="info" showIcon message={t("checkout.chooseAddress")} style={{ marginBottom: 12 }} />}
          <Button type="primary" size="large" block disabled={!selectedId || cart.data.items.length === 0} loading={placeOrder.isPending} onClick={() => placeOrder.mutate()}>
            {t("checkout.placeOrder")}
          </Button>
        </Card>
      </Col>
    </Row>
  );
}
