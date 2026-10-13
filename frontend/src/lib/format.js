export const vnd = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(
    Number(value || 0)
  );

export const dateText = (value) => (value ? new Date(value).toLocaleDateString("vi-VN") : "—");

export const ORDER_STATUSES = ["pending", "completed", "cancelled"];
export const PAGE_SIZES = [10, 20, 50];
