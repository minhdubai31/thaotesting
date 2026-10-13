import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, DatePicker, Form, Input, InputNumber, Modal, Select, Space, Switch, Table, Tag, App } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { api, toQuery } from "../../lib/api";
import { vnd } from "../../lib/format";
import { useTableParams } from "../../lib/useTableParams";

export default function CouponsPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const table = useTableParams({ sort: "createdAt", order: "desc" });
  const [editing, setEditing] = useState(null); // null = closed, {} = new, coupon = edit
  const [form] = Form.useForm();
  const query = { page: table.page, pageSize: table.pageSize, ...table.filters };

  const { data, isLoading } = useQuery({
    queryKey: ["admin-coupons", query],
    queryFn: () => api(`/api/coupons?${toQuery(query)}`),
    placeholderData: keepPreviousData,
  });

  const save = useMutation({
    mutationFn: (body) =>
      editing?.id ? api(`/api/coupons/${editing.id}`, { method: "PATCH", body }) : api("/api/coupons", { method: "POST", body }),
    onSuccess: () => {
      message.success("Coupon saved.");
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
    onError: (err) => message.error(err.message),
  });

  const toggle = useMutation({
    mutationFn: ({ id, active }) => api(`/api/coupons/${id}`, { method: "PATCH", body: { active } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-coupons"] }),
    onError: (err) => message.error(err.message),
  });

  function openForm(coupon) {
    setEditing(coupon || {});
    form.setFieldsValue(
      coupon
        ? { ...coupon, value: Number(coupon.value), minSubtotal: Number(coupon.minSubtotal), endsAt: coupon.endsAt ? dayjs(coupon.endsAt) : null }
        : { type: "percent", active: true, minSubtotal: 0 }
    );
  }

  function handleFinish(values) {
    save.mutate({ ...values, endsAt: values.endsAt ? values.endsAt.toISOString() : null });
  }

  const columns = [
    { title: "Code", dataIndex: "code", render: (code) => <Tag color="geekblue">{code}</Tag> },
    { title: "Discount", render: (_, c) => (c.type === "percent" ? `${Number(c.value)}%` : vnd(c.value)) },
    { title: "Min order", dataIndex: "minSubtotal", align: "right", render: (v) => (Number(v) ? vnd(v) : "—") },
    { title: "Used", render: (_, c) => `${c.usedCount}${c.usageLimit ? ` / ${c.usageLimit}` : ""}` },
    { title: "Expires", dataIndex: "endsAt", render: (v) => (v ? dayjs(v).format("DD/MM/YYYY") : "Never") },
    {
      title: "Active",
      dataIndex: "active",
      render: (active, c) => <Switch checked={active} onChange={(value) => toggle.mutate({ id: c.id, active: value })} />,
    },
    { title: "", key: "edit", render: (_, c) => <Button type="link" onClick={() => openForm(c)}>Edit</Button> },
  ];

  return (
    <Card
      title="Coupons"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openForm(null)}>
          New coupon
        </Button>
      }
    >
      <Space style={{ marginBottom: 16 }}>
        <Input.Search placeholder="Search code" allowClear defaultValue={table.filters.q} key={table.filters.q || "q"} onSearch={(v) => table.setFilters({ q: v.trim() })} style={{ width: 240 }} />
      </Space>
      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.coupons}
        pagination={table.tablePagination(data?.meta?.total || 0)}
        onChange={table.onTableChange}
      />

      <Modal
        title={editing?.id ? `Edit ${editing.code}` : "New coupon"}
        open={editing !== null}
        onCancel={() => setEditing(null)}
        onOk={() => form.submit()}
        confirmLoading={save.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item name="code" label="Code" rules={[{ required: true }]} extra="Letters, numbers, - or _">
            <Input disabled={Boolean(editing?.id)} style={{ textTransform: "uppercase" }} />
          </Form.Item>
          <Space size="middle" style={{ display: "flex" }} align="start">
            <Form.Item name="type" label="Type" rules={[{ required: true }]} style={{ width: 160 }}>
              <Select options={[{ value: "percent", label: "Percent" }, { value: "fixed", label: "Fixed amount" }]} />
            </Form.Item>
            <Form.Item name="value" label="Value" rules={[{ required: true }]} style={{ width: 200 }}>
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
          </Space>
          <Form.Item name="minSubtotal" label="Minimum order (VND)">
            <InputNumber min={0} step={100000} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="usageLimit" label="Usage limit (blank = unlimited)">
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="endsAt" label="Expires on">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="active" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
