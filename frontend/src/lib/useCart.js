import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";

export function useCart(enabled) {
  return useQuery({
    queryKey: ["cart"],
    enabled,
    queryFn: async () => (await api("/api/cart")).cart,
  });
}

export function useCartActions() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["cart"] });

  const addItem = useMutation({
    mutationFn: ({ productId, quantity = 1 }) =>
      api("/api/cart/items", { method: "POST", body: { productId, quantity } }),
    onSuccess: refresh,
  });

  const updateItem = useMutation({
    mutationFn: ({ productId, quantity }) =>
      api(`/api/cart/items/${productId}`, { method: "PATCH", body: { quantity } }),
    onSuccess: refresh,
  });

  const removeItem = useMutation({
    mutationFn: (productId) => api(`/api/cart/items/${productId}`, { method: "DELETE" }),
    onSuccess: refresh,
  });

  return { addItem, updateItem, removeItem };
}
