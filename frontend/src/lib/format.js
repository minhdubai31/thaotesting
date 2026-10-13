export const vnd = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(
    Number(value || 0)
  );

export const dateText = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "—");
export const dateTimeText = (value) => (value ? new Date(value).toLocaleString("vi-VN") : "—");

export const ORDER_STATUSES = ["pending", "paid", "shipped", "completed", "cancelled", "refunded"];

export const STATUS_LABELS = {
  pending: "Pending",
  paid: "Paid",
  shipped: "Shipped",
  completed: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

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
