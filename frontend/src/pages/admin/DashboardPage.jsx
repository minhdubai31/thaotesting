import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card, Col, List, Row, Spin, Statistic, Table, Tag, Typography } from "antd";
import { Line, Pie } from "@ant-design/charts";
import { ArrowUpOutlined, DollarOutlined, ShoppingOutlined, TeamOutlined, WarningOutlined } from "@ant-design/icons";
import { api } from "../../lib/api";
import { STATUS_LABELS, vnd } from "../../lib/format";

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => (await api("/api/analytics/summary"))
  });

  if (isLoading || !data) return <Spin size="large" />;

  const { totals, ordersByStatus, revenueByDay, topProducts, lowStock } = data;
  const statusData = Object.entries(ordersByStatus).map(([status, count]) => ({
    status: STATUS_LABELS[status] || status,
    count,
  }));
  const revenueSeries = revenueByDay.map((row) => ({
    date: row.date.slice(5),
    revenue: Math.round(row.amount),
  }));

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Revenue (paid orders)" value={totals.revenue} formatter={(v) => vnd(v)} prefix={<DollarOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Paid orders" value={totals.paidOrders} prefix={<ShoppingOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Average order value" value={totals.averageOrderValue} formatter={(v) => vnd(v)} prefix={<ArrowUpOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Customers" value={totals.customers} prefix={<TeamOutlined />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="Revenue, last 14 days">
            <Line data={revenueSeries} xField="date" yField="revenue" height={260} smooth point={{ size: 3 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Orders by status">
            <Pie data={statusData} angleField="count" colorField="status" height={260} innerRadius={0.6} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Top products by revenue">
            <Table
              bordered
              size="small"
              pagination={false}
              rowKey="productId"
              dataSource={topProducts}
              columns={[
                { title: "Product", dataIndex: "name" },
                { title: "Sold", dataIndex: "quantity", align: "right" },
                { title: "Revenue", dataIndex: "revenue", align: "right", render: vnd },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <span>
                <WarningOutlined style={{ color: "#fa8c16", marginRight: 8 }} />
                Low stock
              </span>
            }
            extra={<Link to="/admin/inventory">Manage inventory</Link>}
          >
            {lowStock.length ? (
              <List
                size="small"
                dataSource={lowStock}
                renderItem={(item) => (
                  <List.Item extra={<Tag color="orange">{item.unitsInStock} left</Tag>}>
                    <Typography.Text>{item.name}</Typography.Text>
                  </List.Item>
                )}
              />
            ) : (
              <Typography.Text type="secondary">Nothing is low on stock.</Typography.Text>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
