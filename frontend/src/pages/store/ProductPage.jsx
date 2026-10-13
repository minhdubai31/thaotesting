import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Breadcrumb, Button, Col, Divider, Empty, Form, Input, InputNumber, List, Rate, Row, Space, Spin, Tag, Typography, App } from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { api } from "../../lib/api";
import { vnd } from "../../lib/format";
import { useAuth } from "../../auth/AuthContext";
import { useCartActions } from "../../lib/useCart";
import ProductCard from "../../components/ProductCard";
import ProductImage from "../../components/ProductImage";

export default function ProductPage() {
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
      message.success("Thanks for your review.");
      queryClient.invalidateQueries({ queryKey: ["store", "product", slug] });
    },
    onError: (err) => message.error(err.message),
  });

  if (isLoading) return <Spin size="large" />;
  if (error || !data) return <Empty description="Product not found." />;

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
          { title: <Link to="/">Home</Link> },
          { title: <Link to="/shop">Shop</Link> },
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
                {Number(product.ratingAverage).toFixed(1)} · {product.reviewCount} reviews
              </Typography.Text>
            </Space>
            <Typography.Title level={2} style={{ margin: "8px 0" }}>
              {vnd(product.price)}
            </Typography.Title>
            {product.inStock ? <Tag color="green">In stock</Tag> : <Tag color="red">Out of stock</Tag>}
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
                Add to cart
              </Button>
            </Space>

            <Typography.Text type="secondary">Free shipping on orders from 500,000 VND. Cash on delivery available.</Typography.Text>
          </Space>
        </Col>
      </Row>

      <Divider />

      <Row gutter={[32, 24]}>
        <Col xs={24} md={14}>
          <Typography.Title level={4}>Reviews</Typography.Title>
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
                      {item.author} · {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                    </Typography.Text>
                  </Space>
                </List.Item>
              )}
            />
          ) : (
            <Typography.Text type="secondary">No reviews yet.</Typography.Text>
          )}
        </Col>

        <Col xs={24} md={10}>
          <Typography.Title level={4}>Write a review</Typography.Title>
          <Typography.Paragraph type="secondary">Available after you receive this product.</Typography.Paragraph>
          {isAuthenticated ? (
            <Form layout="vertical" onFinish={(values) => review.mutate(values)}>
              <Form.Item name="rating" label="Rating" rules={[{ required: true, message: "Choose a rating" }]}>
                <Rate />
              </Form.Item>
              <Form.Item name="title" label="Title">
                <Input maxLength={80} />
              </Form.Item>
              <Form.Item name="body" label="Review">
                <Input.TextArea rows={4} maxLength={1000} />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={review.isPending}>
                Submit review
              </Button>
            </Form>
          ) : (
            <Button onClick={() => navigate("/login", { state: { from: `/product/${slug}` } })}>Sign in to review</Button>
          )}
        </Col>
      </Row>

      {related.length > 0 && (
        <>
          <Typography.Title level={4}>You may also like</Typography.Title>
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
