import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Col, Empty, Pagination, Row, Select, Space, Spin, InputNumber, Button, Typography } from "antd";
import { api, toQuery } from "../../lib/api";
import { useI18n } from "../../i18n";
import ProductCard from "../../components/ProductCard";
import SearchInput from "../../components/SearchInput";

export default function ShopPage() {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page")) || 1;
  const pageSize = 12;
  const filters = {
    q: params.get("q") || "",
    category: params.get("category") || "",
    brand: params.get("brand") || "",
    sort: params.get("sort") || "newest",
    minPrice: params.get("minPrice") || "",
    maxPrice: params.get("maxPrice") || "",
  };

  const sortOptions = [
    { value: "newest", label: t("shop.sortNewest") },
    { value: "price_asc", label: t("shop.sortPriceAsc") },
    { value: "price_desc", label: t("shop.sortPriceDesc") },
    { value: "rating", label: t("shop.sortRating") },
    { value: "name", label: t("shop.sortName") },
  ];

  function update(changes) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries({ ...changes, page: changes.page ?? 1 })) {
      if (value === "" || value === undefined || value === null) next.delete(key);
      else next.set(key, String(value));
    }
    setParams(next);
  }

  const categories = useQuery({
    queryKey: ["store", "categories"],
    queryFn: async () => (await api("/api/store/categories")).categories,
  });

  const brands = useQuery({
    queryKey: ["store", "brands"],
    queryFn: async () => (await api("/api/store/brands")).brands,
  });

  const products = useQuery({
    queryKey: ["store", "products", filters, page],
    queryFn: () => api(`/api/store/products?${toQuery({ ...filters, page, pageSize })}`),
    placeholderData: (previous) => previous,
  });

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        {filters.category
          ? categories.data?.find((c) => c.slug === filters.category)?.name || t("nav.shop")
          : filters.q
            ? t("shop.results", { q: filters.q })
            : t("shop.allProducts")}
      </Typography.Title>

      <Row gutter={[12, 12]} align="middle">
        <Col xs={24} md={8}>
          <SearchInput placeholder={t("shop.searchPlaceholder")} value={filters.q} onSearch={(q) => update({ q })} width="100%" />
        </Col>
        <Col xs={12} md={4}>
          <Select
            style={{ width: "100%" }}
            allowClear
            placeholder={t("shop.category")}
            value={filters.category || undefined}
            onChange={(value) => update({ category: value || "" })}
            options={categories.data?.map((c) => ({ value: c.slug, label: c.name }))}
          />
        </Col>
        <Col xs={12} md={4}>
          <Select
            style={{ width: "100%" }}
            allowClear
            placeholder={t("shop.brand")}
            value={filters.brand || undefined}
            onChange={(value) => update({ brand: value || "" })}
            options={brands.data?.map((b) => ({ value: b, label: b }))}
          />
        </Col>
        <Col xs={12} md={4}>
          <Select
            style={{ width: "100%" }}
            value={filters.sort}
            onChange={(value) => update({ sort: value })}
            options={sortOptions}
          />
        </Col>
      </Row>

      <Space wrap>
        <InputNumber
          placeholder={t("shop.minPrice")}
          min={0}
          step={100000}
          defaultValue={filters.minPrice ? Number(filters.minPrice) : undefined}
          onChange={(value) => update({ minPrice: value ?? "" })}
          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
        />
        <InputNumber
          placeholder={t("shop.maxPrice")}
          min={0}
          step={100000}
          defaultValue={filters.maxPrice ? Number(filters.maxPrice) : undefined}
          onChange={(value) => update({ maxPrice: value ?? "" })}
          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
        />
        <Button onClick={() => setParams(new URLSearchParams())}>{t("shop.clearFilters")}</Button>
      </Space>

      {products.isLoading ? (
        <Spin />
      ) : products.data?.products.length ? (
        <>
          <Row gutter={[16, 16]}>
            {products.data.products.map((product) => (
              <Col key={product.id} xs={12} md={8} lg={6}>
                <ProductCard product={product} />
              </Col>
            ))}
          </Row>
          <Pagination
            style={{ textAlign: "center", marginTop: 16 }}
            current={page}
            pageSize={pageSize}
            total={products.data.meta.total}
            showSizeChanger={false}
            onChange={(next) => update({ page: next })}
          />
        </>
      ) : (
        <Empty description={t("shop.empty")} />
      )}
    </Space>
  );
}
