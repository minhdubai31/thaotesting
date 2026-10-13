import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import { Button, Card, Form, Input, InputNumber, Select, Spin, App } from "antd";
import { api } from "../../lib/api";
import { useMasters } from "../../lib/useMasters";

export default function AdjustStockPage() {
  const { message } = App.useApp();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: masters, isLoading } = useMasters();

  const adjust = useMutation({
    mutationFn: (body) => api("/api/inventory/adjustments", { method: "POST", body }),
    onSuccess: () => {
      message.success("Stock updated.");
      queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["masters"] });
      navigate("/admin/inventory");
    },
    onError: (err) => message.error(err.message),
  });

  if (isLoading || !masters) return <Spin />;

  return (
    <Card title={<PageTitle back="/admin/inventory">Adjust stock</PageTitle>} style={{ maxWidth: 560 }}>
      <Form
        layout="vertical"
        initialValues={{ productId: params.get("productId") || undefined, type: "in", quantity: 1 }}
        onFinish={(values) => adjust.mutate({ ...values, note: values.note || undefined })}
      >
        <Form.Item name="productId" label="Product" rules={[{ required: true }]}>
          <Select
            showSearch
            optionFilterProp="label"
            options={masters.products.map((p) => ({ value: p.id, label: `${p.name} (${p.unitsInStock} on hand)` }))}
          />
        </Form.Item>
        <Form.Item name="type" label="Type" rules={[{ required: true }]}>
          <Select
            options={[
              { value: "in", label: "In (received)" },
              { value: "out", label: "Out (removed)" },
              { value: "audit", label: "Audit (set count)" },
            ]}
          />
        </Form.Item>
        <Form.Item name="quantity" label="Quantity" rules={[{ required: true }]}>
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="note" label="Note">
          <Input />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={adjust.isPending}>
          Record
        </Button>
      </Form>
    </Card>
  );
}
