import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

// Reference lists used by forms and filters. Cached and shared across pages.
export function useMasters() {
  return useQuery({
    queryKey: ["masters"],
    queryFn: async () => {
      const [categories, suppliers, deliveries, products, customers] = await Promise.all([
        api("/api/categories"),
        api("/api/suppliers"),
        api("/api/delivery-companies"),
        api("/api/products?pageSize=100&status=active&sort=name&order=asc"),
        api("/api/customers?pageSize=100&sort=name&order=asc"),
      ]);

      return {
        categories: categories.categories,
        suppliers: suppliers.suppliers,
        deliveries: deliveries.deliveryCompanies,
        products: products.products,
        customers: customers.customers,
      };
    },
    staleTime: 60_000,
  });
}
