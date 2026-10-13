import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import { Button, Card, Form, Input, App } from "antd";
import { api } from "../../lib/api";

export default function CustomerFormPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (body) => api("/api/customers", { method: "POST", body }),
    onSuccess: () => {
      message.success("Customer saved.");
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      queryClient.invalidateQueries({ queryKey: ["masters"] });
      navigate("/admin/customers");
    },
    onError: (err) => message.error(err.message),
  });

  return (
    <Card title={<PageTitle back="/admin/customers">New customer</PageTitle>} style={{ maxWidth: 560 }}>
      <Form layout="vertical" onFinish={(values) => create.mutate(values)}>
        <Form.Item name="name" label="Name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="phone" label="Phone">
          <Input />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={[{ type: "email" }]}>
          <Input />
        </Form.Item>
        <Form.Item name="address" label="Address">
          <Input />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={create.isPending}>
          Save customer
        </Button>
      </Form>
    </Card>
  );
}
