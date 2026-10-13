import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import { Button, Card, Form, InputNumber, Select, Space, Spin, App } from "antd";
import { api } from "../../lib/api";
import { useMasters } from "../../lib/useMasters";
import { vnd } from "../../lib/format";

export default function OrderFormPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const { data: masters, isLoading } = useMasters();

  const create = useMutation({
    mutationFn: (body) => api("/api/orders", { method: "POST", body }),
    onSuccess: () => {
      message.success("Order created. Stock was reduced.");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["masters"] });
      navigate("/admin/orders");
    },
    onError: (err) => message.error(err.message),
  });

  if (isLoading || !masters) return <Spin />;

  function handleFinish(values) {
    const items = (values.items || []).filter((line) => line?.productId);
    if (!items.length) {
      message.error("Add at least one product.");
      return;
    }
    create.mutate({
      customerId: values.customerId || null,
      deliveryCompanyId: values.deliveryCompanyId || null,
      freight: values.freight || 0,
      items,
    });
  }

  return (
    <Card title={<PageTitle back="/admin/orders">New order</PageTitle>}>
      <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={{ freight: 30000, items: [{ quantity: 1 }] }} style={{ maxWidth: 720 }}>
        <Form.Item name="customerId" label="Customer">
          <Select allowClear placeholder="Walk-in" options={masters.customers.map((c) => ({ value: c.id, label: c.name }))} />
        </Form.Item>
        <Form.Item name="deliveryCompanyId" label="Delivery company">
          <Select allowClear placeholder="None" options={masters.deliveries.map((d) => ({ value: d.id, label: d.companyName }))} />
        </Form.Item>
        <Form.Item name="freight" label="Freight (VND)">
          <InputNumber min={0} step={1000} style={{ width: 240 }} />
        </Form.Item>

        <Form.List name="items">
          {(fields, { add, remove }) => (
            <Space direction="vertical" style={{ width: "100%" }}>
              {fields.map((field) => (
                <Space key={field.key} align="baseline" style={{ display: "flex" }}>
                  <Form.Item name={[field.name, "productId"]} label={field.name === 0 ? "Product" : undefined} style={{ width: 460, marginBottom: 8 }}>
                    <Select
                      showSearch
                      optionFilterProp="label"
                      placeholder="Choose product"
                      options={masters.products.map((p) => ({ value: p.id, label: `${p.name} — ${vnd(p.price)} (${p.unitsInStock} left)` }))}
                    />
                  </Form.Item>
                  <Form.Item name={[field.name, "quantity"]} label={field.name === 0 ? "Quantity" : undefined} style={{ marginBottom: 8 }}>
                    <InputNumber min={1} />
                  </Form.Item>
                  <Button danger onClick={() => remove(field.name)}>
                    Remove
                  </Button>
                </Space>
              ))}
              <Button onClick={() => add({ quantity: 1 })}>Add product</Button>
            </Space>
          )}
        </Form.List>

        <Space style={{ marginTop: 24 }}>
          <Button type="primary" htmlType="submit" loading={create.isPending}>
            Create order
          </Button>
          <Button onClick={() => navigate("/admin/orders")}>Cancel</Button>
        </Space>
      </Form>
    </Card>
  );
}
