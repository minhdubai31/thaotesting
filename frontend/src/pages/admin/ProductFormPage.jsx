import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import { Button, Card, Col, Form, Input, InputNumber, Row, Select, Space, Spin, Switch, Popconfirm, Upload, App } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { api } from "../../lib/api";
import { imageFileToDataUrl } from "../../lib/image";
import { useMasters } from "../../lib/useMasters";
import { useI18n } from "../../i18n";
import ProductImage from "../../components/ProductImage";

export default function ProductFormPage() {
  const { t } = useI18n();
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
      message.success(isNew ? t("productForm.created") : t("productForm.saved"));
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["masters"] });
      navigate(`/admin/products/${data.product.id}`, { replace: true });
    },
    onError: (err) => message.error(err.message),
  });

  const deactivate = useMutation({
    mutationFn: () => api(`/api/products/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      message.success(t("products.deactivated"));
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

  // Keeps the photo in the form only; it is saved with the product, not uploaded anywhere else.
  async function handleImageUpload(file) {
    try {
      form.setFieldValue("imageUrl", await imageFileToDataUrl(file));
    } catch (err) {
      message.error(err.message);
    }
    return false;
  }

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
    <Card title={<PageTitle back="/admin/products">{isNew ? t("products.new") : product.data.name}</PageTitle>}>
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
                <Form.Item name="name" label={t("products.name")} rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="brand" label={t("productForm.brand")} rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="model" label={t("productForm.model")} rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="categoryId" label={t("products.category")}>
                  <Select allowClear options={masters?.categories.map((c) => ({ value: c.id, label: c.name }))} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="supplierId" label={t("productForm.supplier")}>
                  <Select allowClear options={masters?.suppliers.map((s) => ({ value: s.id, label: s.companyName }))} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="price" label={t("productForm.priceVnd")} rules={[{ required: true }]}>
                  <InputNumber min={0} step={1000} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="quantity" label={isNew ? t("productForm.openingStock") : t("productForm.stockOnHand")} rules={[{ required: true }]}>
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="reorderLevel" label={t("productForm.reorderLevel")} rules={[{ required: true }]}>
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item name="imageUrl" hidden>
                  <Input />
                </Form.Item>
                <Form.Item label={t("productForm.image")} extra={t("productForm.imageHelp")}>
                  <Space>
                    <Upload accept="image/jpeg,image/png,image/webp" showUploadList={false} beforeUpload={handleImageUpload}>
                      <Button icon={<UploadOutlined />}>{imageUrl ? t("productForm.replaceImage") : t("productForm.uploadImage")}</Button>
                    </Upload>
                    {imageUrl && (
                      <Button danger onClick={() => form.setFieldValue("imageUrl", "")}>
                        {t("common.remove")}
                      </Button>
                    )}
                  </Space>
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item name="description" label={t("productForm.description")}>
                  <Input.TextArea rows={4} />
                </Form.Item>
              </Col>
              {!isNew && (
                <Col xs={24}>
                  <Form.Item name="isActive" label={t("productForm.activeOnStore")} valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
              )}
            </Row>
            <Space>
              <Button type="primary" htmlType="submit" loading={save.isPending}>
                {isNew ? t("productForm.createProduct") : t("productForm.saveChanges")}
              </Button>
              <Button onClick={() => navigate("/admin/products")}>{t("common.back")}</Button>
              {!isNew && product.data?.isActive && (
                <Popconfirm title={t("products.deactivateQuestion")} onConfirm={() => deactivate.mutate()}>
                  <Button danger loading={deactivate.isPending}>
                    {t("common.deactivate")}
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
