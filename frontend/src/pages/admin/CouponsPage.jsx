import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, DatePicker, Form, Input, InputNumber, Modal, Select, Space, Switch, Table, Tag, App } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { api, toQuery } from "../../lib/api";
import { vnd } from "../../lib/format";
import { useI18n } from "../../i18n";
import { useTableParams } from "../../lib/useTableParams";
import SearchInput from "../../components/SearchInput";

export default function CouponsPage() {
  const { t } = useI18n();
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
      message.success(t("coupons.saved"));
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
    { title: t("coupons.code"), dataIndex: "code", render: (code) => <Tag color="geekblue">{code}</Tag> },
    { title: t("coupons.discount"), render: (_, c) => (c.type === "percent" ? `${Number(c.value)}%` : vnd(c.value)) },
    { title: t("coupons.minOrder"), dataIndex: "minSubtotal", align: "right", render: (v) => (Number(v) ? vnd(v) : "—") },
    { title: t("coupons.used"), render: (_, c) => `${c.usedCount}${c.usageLimit ? ` / ${c.usageLimit}` : ""}` },
    { title: t("coupons.expires"), dataIndex: "endsAt", render: (v) => (v ? dayjs(v).format("DD/MM/YYYY") : t("coupons.never")) },
    {
      title: t("coupons.active"),
      dataIndex: "active",
      render: (active, c) => <Switch checked={active} onChange={(value) => toggle.mutate({ id: c.id, active: value })} />,
    },
    { title: "", key: "edit", render: (_, c) => <Button type="link" onClick={() => openForm(c)}>{t("common.edit")}</Button> },
  ];

  return (
    <Card
      title={t("coupons.title")}
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openForm(null)}>
          {t("coupons.new")}
        </Button>
      }
    >
      <Space style={{ marginBottom: 16 }}>
        <SearchInput placeholder={t("coupons.searchPlaceholder")} value={table.filters.q} onSearch={(q) => table.setFilters({ q })} width={240} />
      </Space>
      <Table
        bordered
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.coupons}
        pagination={table.tablePagination(data?.meta?.total || 0)}
        onChange={table.onTableChange}
      />

      <Modal
        title={editing?.id ? t("coupons.editTitle", { code: editing.code }) : t("coupons.new")}
        open={editing !== null}
        onCancel={() => setEditing(null)}
        onOk={() => form.submit()}
        confirmLoading={save.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item name="code" label={t("coupons.code")} rules={[{ required: true }]} extra={t("coupons.codeHelp")}>
            <Input disabled={Boolean(editing?.id)} style={{ textTransform: "uppercase" }} />
          </Form.Item>
          <Space size="middle" style={{ display: "flex" }} align="start">
            <Form.Item name="type" label={t("coupons.type")} rules={[{ required: true }]} style={{ width: 160 }}>
              <Select options={[{ value: "percent", label: t("coupons.percent") }, { value: "fixed", label: t("coupons.fixed") }]} />
            </Form.Item>
            <Form.Item name="value" label={t("coupons.value")} rules={[{ required: true }]} style={{ width: 200 }}>
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
          </Space>
          <Form.Item name="minSubtotal" label={t("coupons.minimum")}>
            <InputNumber min={0} step={100000} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="usageLimit" label={t("coupons.usageLimit")}>
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="endsAt" label={t("coupons.expiresOn")}>
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="active" label={t("coupons.active")} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
