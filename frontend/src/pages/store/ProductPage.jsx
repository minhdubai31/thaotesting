import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Breadcrumb, Button, Col, Divider, Empty, Form, Input, InputNumber, List, Rate, Row, Space, Spin, Tag, Typography, App } from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { api } from "../../lib/api";
import { dateText, vnd } from "../../lib/format";
import { useAuth } from "../../auth/AuthContext";
import { useCartActions } from "../../lib/useCart";
import { useI18n } from "../../i18n";
import ProductCard from "../../components/ProductCard";
import ProductImage from "../../components/ProductImage";

export default function ProductPage() {
  const { t } = useI18n();
  const { message } = App.useApp();
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addItem } = useCartActions();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["store", "product", slug],
    queryFn: () => api(`/api/store/products/${slug}`),
  });

  const review = useMutation({
    mutationFn: (values) => api(`/api/store/products/${slug}/reviews`, { method: "POST", body: values }),
    onSuccess: () => {
      message.success(t("product.thanks"));
      queryClient.invalidateQueries({ queryKey: ["store", "product", slug] });
    },
    onError: (err) => message.error(err.message),
  });

  if (isLoading) return <Spin size="large" />;
  if (error || !data) return <Empty description={t("product.notFound")} />;

  const { product, related } = data;
  const images = [product.imageUrl, ...(product.gallery || [])].filter(Boolean);
  const shown = activeImage || images[0] || null;

  function handleAdd() {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/product/${slug}` } });
      return;
    }
    addItem.mutate({ productId: product.id, quantity });
  }

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <Breadcrumb
        items={[
          { title: <Link to="/">{t("nav.home")}</Link> },
          { title: <Link to="/shop">{t("nav.shop")}</Link> },
          ...(product.category ? [{ title: <Link to={`/shop?category=${product.category.slug}`}>{product.category.name}</Link> }] : []),
          { title: product.name },
        ]}
      />

      <Row gutter={[32, 24]}>
        <Col xs={24} md={11}>
          <div className="page-card" style={{ padding: 16 }}>
            <ProductImage src={shown} alt={product.name} height={380} preview />
          </div>
          {images.length > 1 && (
            <Space style={{ marginTop: 12 }} wrap>
              {images.map((src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActiveImage(src)}
                  style={{ border: src === shown ? "2px solid #1677ff" : "1px solid #d9d9d9", borderRadius: 8, padding: 4, background: "#fff", cursor: "pointer" }}
                >
                  <img src={src} alt="" style={{ width: 64, height: 64, objectFit: "contain" }} />
                </button>
              ))}
            </Space>
          )}
        </Col>

        <Col xs={24} md={13}>
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            <Typography.Text type="secondary">{product.brand}</Typography.Text>
            <Typography.Title level={3} style={{ margin: 0 }}>
              {product.name}
            </Typography.Title>
            <Space>
              <Rate disabled allowHalf value={Number(product.ratingAverage)} />
              <Typography.Text type="secondary">
                {t("product.ratingSummary", { average: Number(product.ratingAverage).toFixed(1), count: product.reviewCount })}
              </Typography.Text>
            </Space>
            <Typography.Title level={2} style={{ margin: "8px 0" }}>
              {vnd(product.price)}
            </Typography.Title>
            {product.inStock ? <Tag color="green">{t("product.inStock")}</Tag> : <Tag color="red">{t("product.outOfStock")}</Tag>}
            <Typography.Paragraph>{product.description}</Typography.Paragraph>

            <Space align="center">
              <InputNumber min={1} max={99} value={quantity} onChange={(value) => setQuantity(value || 1)} disabled={!product.inStock} />
              <Button
                type="primary"
                size="large"
                icon={<ShoppingCartOutlined />}
                disabled={!product.inStock}
                loading={addItem.isPending}
                onClick={handleAdd}
              >
                {t("product.addToCart")}
              </Button>
            </Space>

            <Typography.Text type="secondary">{t("product.freeShipping")}</Typography.Text>
          </Space>
        </Col>
      </Row>

      <Divider />

      <Row gutter={[32, 24]}>
        <Col xs={24} md={14}>
          <Typography.Title level={4}>{t("product.reviews")}</Typography.Title>
          {product.reviews.length ? (
            <List
              itemLayout="vertical"
              dataSource={product.reviews}
              renderItem={(item) => (
                <List.Item key={item.id}>
                  <Space direction="vertical" size={2}>
                    <Space>
                      <Rate disabled value={item.rating} style={{ fontSize: 14 }} />
                      <Typography.Text strong>{item.title}</Typography.Text>
                    </Space>
                    <Typography.Text>{item.body}</Typography.Text>
                    <Typography.Text type="secondary">
                      {item.author} · {dateText(item.createdAt)}
                    </Typography.Text>
                  </Space>
                </List.Item>
              )}
            />
          ) : (
            <Typography.Text type="secondary">{t("product.noReviews")}</Typography.Text>
          )}
        </Col>

        <Col xs={24} md={10}>
          <Typography.Title level={4}>{t("product.writeReview")}</Typography.Title>
          <Typography.Paragraph type="secondary">{t("product.reviewNote")}</Typography.Paragraph>
          {isAuthenticated ? (
            <Form layout="vertical" onFinish={(values) => review.mutate(values)}>
              <Form.Item name="rating" label={t("product.ratingLabel")} rules={[{ required: true, message: t("product.ratingRequired") }]}>
                <Rate />
              </Form.Item>
              <Form.Item name="title" label={t("product.titleLabel")}>
                <Input maxLength={80} />
              </Form.Item>
              <Form.Item name="body" label={t("product.reviewLabel")}>
                <Input.TextArea rows={4} maxLength={1000} />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={review.isPending}>
                {t("product.submitReview")}
              </Button>
            </Form>
          ) : (
            <Button onClick={() => navigate("/login", { state: { from: `/product/${slug}` } })}>{t("product.signInToReview")}</Button>
          )}
        </Col>
      </Row>

      {related.length > 0 && (
        <>
          <Typography.Title level={4}>{t("product.alsoLike")}</Typography.Title>
          <Row gutter={[16, 16]}>
            {related.map((item) => (
              <Col key={item.id} xs={12} md={6}>
                <ProductCard product={item} />
              </Col>
            ))}
          </Row>
        </>
      )}
    </Space>
  );
}
