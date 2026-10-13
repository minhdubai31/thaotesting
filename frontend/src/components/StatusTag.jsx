import { Tag } from "antd";
import { STATUS_COLORS, STATUS_LABELS } from "../lib/format";

export default function StatusTag({ status }) {
  return <Tag color={STATUS_COLORS[status]}>{STATUS_LABELS[status] || status}</Tag>;
}
