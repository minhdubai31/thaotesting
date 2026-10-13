import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button, Card, Space, Table } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { api, toQuery } from "../../lib/api";
import { useI18n } from "../../i18n";
import { useTableParams } from "../../lib/useTableParams";
import SearchInput from "../../components/SearchInput";

export default function CustomersPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const table = useTableParams({ sort: "createdAt", order: "desc" });
  const query = { page: table.page, pageSize: table.pageSize, sort: table.sort, order: table.order, ...table.filters };

  const { data, isLoading } = useQuery({
    queryKey: ["admin-customers", query],
    queryFn: () => api(`/api/customers?${toQuery(query)}`),
    placeholderData: keepPreviousData,
  });

  const columns = [
    { title: t("common.name"), dataIndex: "name", sorter: true },
    { title: t("common.phone"), dataIndex: "phone", render: (v) => v || "—" },
    { title: t("common.email"), dataIndex: "email", render: (v) => v || "—" },
    { title: t("common.address"), dataIndex: "address", render: (v) => v || "—" },
  ];

  return (
    <Card
      title={t("customers.title")}
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/admin/customers/new")}>
          {t("customers.new")}
        </Button>
      }
    >
      <Space style={{ marginBottom: 16 }}>
        <SearchInput placeholder={t("customers.searchPlaceholder")} value={table.filters.q} onSearch={(q) => table.setFilters({ q })} width={300} />
      </Space>
      <Table
        bordered
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.customers}
        pagination={table.tablePagination(data?.meta?.total || 0)}
        onChange={table.onTableChange}
      />
    </Card>
  );
}
