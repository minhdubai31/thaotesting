import { Link, useNavigate } from "react-router-dom";
import { Button, Card, Rate, Space, Tag, Typography } from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { useAuth } from "../auth/AuthContext";
import { useCartActions } from "../lib/useCart";
import { vnd } from "../lib/format";
import ProductImage from "./ProductImage";

export default function ProductCard({ product }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { addItem } = useCartActions();

  function handleAdd() {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/shop" } });
      return;
    }
    addItem.mutate({ productId: product.id, quantity: 1 });
  }

  return (
    <Card
      hoverable
      className="product-card"
      cover={
        <Link to={`/product/${product.slug}`}>
          <ProductImage src={product.imageUrl} alt={product.name} />
        </Link>
      }
      actions={[
        <Button
          key="add"
          type="text"
          icon={<ShoppingCartOutlined />}
          disabled={!product.inStock || addItem.isPending}
          loading={addItem.isPending}
          onClick={handleAdd}
        >
          {product.inStock ? "Add to cart" : "Out of stock"}
        </Button>,
      ]}
    >
      <Space direction="vertical" size={4} style={{ width: "100%" }}>
        <Typography.Text type="secondary">{product.brand}</Typography.Text>
        <Link to={`/product/${product.slug}`}>
          <Typography.Text strong ellipsis={{ tooltip: product.name }}>
            {product.name}
          </Typography.Text>
        </Link>
        <Typography.Text strong style={{ fontSize: 16 }}>
          {vnd(product.price)}
        </Typography.Text>
        <Space size={6}>
          <Rate disabled allowHalf value={Number(product.ratingAverage)} style={{ fontSize: 12 }} />
          <Typography.Text type="secondary">({product.reviewCount})</Typography.Text>
        </Space>
        {product.category && <Tag>{product.category.name}</Tag>}
      </Space>
    </Card>
  );
}
