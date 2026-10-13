import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button, Card, Col, Row, Space, Spin, Typography } from "antd";
import { api } from "../../lib/api";
import ProductCard from "../../components/ProductCard";

export default function HomePage() {
  const categories = useQuery({
    queryKey: ["store", "categories"],
    queryFn: async () => (await api("/api/store/categories")).categories,
  });

  const featured = useQuery({
    queryKey: ["store", "featured"],
    queryFn: async () => (await api("/api/store/products?sort=rating&pageSize=8")).products,
  });

  return (
    <Space direction="vertical" size={32} style={{ width: "100%" }}>
      <Card style={{ background: "linear-gradient(120deg, #0f766e 0%, #14b8a6 100%)", border: "none" }}>
        <Space direction="vertical" size={12}>
          <Typography.Title level={2} style={{ color: "#fff", margin: 0 }}>
            Phones and accessories, delivered across Vietnam
          </Typography.Title>
          <Typography.Paragraph style={{ color: "#e6fffb", fontSize: 16, margin: 0 }}>
            Genuine models from Apple, Samsung, Xiaomi and OPPO, with cash-on-delivery and coupons.
          </Typography.Paragraph>
          <Link to="/shop">
            <Button size="large" type="default">
              Shop now
            </Button>
          </Link>
        </Space>
      </Card>

      <section>
        <Typography.Title level={4} className="section-title">
          Shop by category
        </Typography.Title>
        {categories.isLoading ? (
          <Spin />
        ) : (
          <Row gutter={[16, 16]}>
            {categories.data?.map((category) => (
              <Col key={category.id} xs={12} md={8} lg={6}>
                <Link to={`/shop?category=${category.slug}`}>
                  <Card hoverable size="small">
                    <Typography.Text strong>{category.name}</Typography.Text>
                    <br />
                    <Typography.Text type="secondary">
                      {category.productCount} {category.productCount === 1 ? "product" : "products"}
                    </Typography.Text>
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>
        )}
      </section>

      <section>
        <Typography.Title level={4} className="section-title">
          Top rated
        </Typography.Title>
        {featured.isLoading ? (
          <Spin />
        ) : (
          <Row gutter={[16, 16]}>
            {featured.data?.map((product) => (
              <Col key={product.id} xs={12} md={8} lg={6}>
                <ProductCard product={product} />
              </Col>
            ))}
          </Row>
        )}
      </section>
    </Space>
  );
}
