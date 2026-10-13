import { useNavigate } from "react-router-dom";
import { Button, Space } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useI18n } from "../i18n";

// Card title with a back arrow that returns to the list page.
export default function PageTitle({ back, children }) {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <Space size={12}>
      <Button type="text" shape="circle" icon={<ArrowLeftOutlined />} aria-label={t("common.back")} onClick={() => navigate(back)} />
      <span>{children}</span>
    </Space>
  );
}
