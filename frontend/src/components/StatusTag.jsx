import { Tag } from "antd";
import { STATUS_COLORS, statusLabel } from "../lib/format";
import { useI18n } from "../i18n";

export default function StatusTag({ status }) {
  useI18n();
  return <Tag color={STATUS_COLORS[status]}>{statusLabel(status)}</Tag>;
}
