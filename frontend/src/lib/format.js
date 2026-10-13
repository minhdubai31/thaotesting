import { en } from "../i18n/en";
import { vi } from "../i18n/vi";

// The active language is set by the I18nProvider, so dates and status labels follow the switch.
let activeTag = "vi-VN";
let activeDictionary = vi;

export function setActiveLocale(tag) {
  activeTag = tag;
  activeDictionary = tag.startsWith("en") ? en : vi;
}

export const vnd = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(
    Number(value || 0)
  );

export const dateText = (value) => (value ? new Date(value).toLocaleDateString(activeTag) : "—");
export const dateTimeText = (value) => (value ? new Date(value).toLocaleString(activeTag) : "—");

export const ORDER_STATUSES = ["pending", "paid", "shipped", "completed", "cancelled", "refunded"];

export const statusLabel = (status) => activeDictionary[`status.${status}`] || status;

export const STATUS_COLORS = {
  pending: "gold",
  paid: "blue",
  shipped: "geekblue",
  completed: "green",
  cancelled: "default",
  refunded: "red",
};

// Statuses an admin may move an order to from each state (mirrors the backend rules).
export const NEXT_STATUSES = {
  pending: ["paid", "cancelled"],
  paid: ["shipped", "cancelled", "refunded"],
  shipped: ["completed", "refunded"],
  completed: ["refunded"],
  cancelled: [],
  refunded: [],
};

export const STAFF_ROLES = ["admin", "manager", "staff"];
