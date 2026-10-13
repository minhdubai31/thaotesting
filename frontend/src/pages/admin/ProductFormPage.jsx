import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, Col, Form, Input, InputNumber, Row, Select, Space, Spin, Switch, Popconfirm, Image, App } from "antd";
import { api } from "../../lib/api";
import { useMasters } from "../../lib/useMasters";
import ProductImage from "../../components/ProductImage";

export default function ProductFormPage() {
  const { message } = App.useApp();
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const imageUrl = Form.useWatch("imageUrl", form);

  const { data: masters } = useMasters();
  const product = useQuery({
    queryKey: ["admin-product", id],
    enabled: !isNew,
    queryFn: async () => (await api(`/api/products/${id}`)).product,
  });

  const save = useMutation({
    mutationFn: (body) =>
      isNew ? api("/api/products", { method: "POST", body }) : api(`/api/products/${id}`, { method: "PATCH", body }),
    onSuccess: (data) => {
      message.success(isNew ? "Product created." : "Product saved.");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["masters"] });
      navigate(`/admin/products/${data.product.id}`, { replace: true });
    },
    onError: (err) => message.error(err.message),
  });

  const deactivate = useMutation({
    mutationFn: () => api(`/api/products/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      message.success("Product deactivated.");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      navigate("/admin/products");
    },
    onError: (err) => message.error(err.message),
  });

  if (!isNew && (product.isLoading || !product.data)) return <Spin />;

  const initial = isNew
    ? { price: 0, quantity: 0, reorderLevel: 5, isActive: true }
    : {
        ...product.data,
        price: Number(product.data.price),
        quantity: product.data.unitsInStock,
        categoryId: product.data.categoryId || undefined,
        supplierId: product.data.supplierId || undefined,
      };

  function handleFinish(values) {
    const category = masters?.categories.find((c) => c.id === values.categoryId);
    const body = {
      sku: values.sku,
      name: values.name,
      brand: values.brand,
      model: values.model,
      category: category?.name || "phone",
      categoryId: values.categoryId || null,
      supplierId: values.supplierId || null,
      price: values.price,
      reorderLevel: values.reorderLevel,
      description: values.description || null,
      imageUrl: values.imageUrl || null,
    };

    if (isNew) body.quantity = values.quantity;
    else {
      body.unitsInStock = values.quantity;
      body.isActive = values.isActive;
    }

    save.mutate(body);
  }

  return (
    <Card title={isNew ? "New product" : product.data.name}>
      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <ProductImage src={imageUrl} height={260} preview />
        </Col>
        <Col xs={24} md={16}>
          <Form form={form} layout="vertical" initialValues={initial} onFinish={handleFinish} key={product.data?.id || "new"}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="sku" label="SKU" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="brand" label="Brand" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="model" label="Model" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="categoryId" label="Category">
                  <Select allowClear options={masters?.categories.map((c) => ({ value: c.id, label: c.name }))} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="supplierId" label="Supplier">
                  <Select allowClear options={masters?.suppliers.map((s) => ({ value: s.id, label: s.companyName }))} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="price" label="Price (VND)" rules={[{ required: true }]}>
                  <InputNumber min={0} step={1000} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="quantity" label={isNew ? "Opening stock" : "Stock on hand"} rules={[{ required: true }]}>
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="reorderLevel" label="Reorder level" rules={[{ required: true }]}>
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item name="imageUrl" label="Image URL">
                  <Input placeholder="https://…" />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item name="description" label="Description">
                  <Input.TextArea rows={4} />
                </Form.Item>
              </Col>
              {!isNew && (
                <Col xs={24}>
                  <Form.Item name="isActive" label="Active on the storefront" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
              )}
            </Row>
            <Space>
              <Button type="primary" htmlType="submit" loading={save.isPending}>
                {isNew ? "Create product" : "Save changes"}
              </Button>
              <Button onClick={() => navigate("/admin/products")}>Back</Button>
              {!isNew && product.data?.isActive && (
                <Popconfirm title="Deactivate this product?" onConfirm={() => deactivate.mutate()}>
                  <Button danger loading={deactivate.isPending}>
                    Deactivate
                  </Button>
                </Popconfirm>
              )}
            </Space>
          </Form>
        </Col>
      </Row>
    </Card>
  );
}
