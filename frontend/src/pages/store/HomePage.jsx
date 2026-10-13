import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button, Card, Col, Row, Space, Spin, Typography } from "antd";
import { api } from "../../lib/api";
import { useI18n } from "../../i18n";
import ProductCard from "../../components/ProductCard";

export default function HomePage() {
  const { t } = useI18n();
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
      <Card style={{ background: "#fff", border: "1px solid #f0f0f0" }}>
        <Space direction="vertical" size={12}>
          <Typography.Title level={2} style={{ margin: 0 }}>
            {t("home.heroTitle")}
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ fontSize: 16, margin: 0 }}>
            {t("home.heroText")}
          </Typography.Paragraph>
          <Link to="/shop">
            <Button size="large" type="default">
              {t("home.shopNow")}
            </Button>
          </Link>
        </Space>
      </Card>

      <section>
        <Typography.Title level={4} className="section-title">
          {t("home.byCategory")}
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
                      {t(category.productCount === 1 ? "count.one" : "count.other", { count: category.productCount })}
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
          {t("home.topRated")}
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
