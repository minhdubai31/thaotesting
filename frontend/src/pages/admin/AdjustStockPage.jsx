import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import { Button, Card, Form, Input, InputNumber, Select, Spin, App } from "antd";
import { api } from "../../lib/api";
import { useMasters } from "../../lib/useMasters";
import { useI18n } from "../../i18n";

export default function AdjustStockPage() {
  const { t } = useI18n();
  const { message } = App.useApp();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: masters, isLoading } = useMasters();

  const adjust = useMutation({
    mutationFn: (body) => api("/api/inventory/adjustments", { method: "POST", body }),
    onSuccess: () => {
      message.success(t("adjust.saved"));
      queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["masters"] });
      navigate("/admin/inventory");
    },
    onError: (err) => message.error(err.message),
  });

  if (isLoading || !masters) return <Spin />;

  return (
    <Card title={<PageTitle back="/admin/inventory">{t("inventory.adjustStock")}</PageTitle>} style={{ maxWidth: 560 }}>
      <Form
        layout="vertical"
        initialValues={{ productId: params.get("productId") || undefined, type: "in", quantity: 1 }}
        onFinish={(values) => adjust.mutate({ ...values, note: values.note || undefined })}
      >
        <Form.Item name="productId" label={t("orderForm.product")} rules={[{ required: true }]}>
          <Select
            showSearch
            optionFilterProp="label"
            options={masters.products.map((p) => ({ value: p.id, label: t("adjust.productOption", { name: p.name, count: p.unitsInStock }) }))}
          />
        </Form.Item>
        <Form.Item name="type" label={t("adjust.type")} rules={[{ required: true }]}>
          <Select
            options={[
              { value: "in", label: t("adjust.typeIn") },
              { value: "out", label: t("adjust.typeOut") },
              { value: "audit", label: t("adjust.typeAudit") },
            ]}
          />
        </Form.Item>
        <Form.Item name="quantity" label={t("common.quantity")} rules={[{ required: true }]}>
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="note" label={t("adjust.note")}>
          <Input />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={adjust.isPending}>
          {t("adjust.record")}
        </Button>
      </Form>
    </Card>
  );
}
