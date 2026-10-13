import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import { Button, Card, Form, Input, App } from "antd";
import { api } from "../../lib/api";
import { useI18n } from "../../i18n";

export default function CustomerFormPage() {
  const { t } = useI18n();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (body) => api("/api/customers", { method: "POST", body }),
    onSuccess: () => {
      message.success(t("customerForm.saved"));
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      queryClient.invalidateQueries({ queryKey: ["masters"] });
      navigate("/admin/customers");
    },
    onError: (err) => message.error(err.message),
  });

  return (
    <Card title={<PageTitle back="/admin/customers">{t("customers.new")}</PageTitle>} style={{ maxWidth: 560 }}>
      <Form layout="vertical" onFinish={(values) => create.mutate(values)}>
        <Form.Item name="name" label={t("common.name")} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="phone" label={t("common.phone")}>
          <Input />
        </Form.Item>
        <Form.Item name="email" label={t("common.email")} rules={[{ type: "email" }]}>
          <Input />
        </Form.Item>
        <Form.Item name="address" label={t("common.address")}>
          <Input />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={create.isPending}>
          {t("customerForm.save")}
        </Button>
      </Form>
    </Card>
  );
}
