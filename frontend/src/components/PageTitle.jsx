import { useNavigate } from "react-router-dom";
import { Button, Space } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";

// Card title with a back arrow that returns to the list page.
export default function PageTitle({ back, children }) {
  const navigate = useNavigate();

  return (
    <Space size={12}>
      <Button type="text" shape="circle" icon={<ArrowLeftOutlined />} aria-label="Back" onClick={() => navigate(back)} />
      <span>{children}</span>
    </Space>
  );
}
