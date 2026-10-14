export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

// Stock status is derived from quantity and min_stock — it is
// never stored, so it cannot drift from the real quantity.
export function getStockStatus(item: {
  quantity: number;
  min_stock: number;
}): StockStatus {
  if (item.quantity <= 0) return "out_of_stock";
  if (item.min_stock > 0 && item.quantity <= item.min_stock) return "low_stock";
  return "in_stock";
}
