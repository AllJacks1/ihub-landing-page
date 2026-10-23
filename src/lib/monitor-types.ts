/**
 * Shared types for the Kitchen (IEat) and Bar (IDrink) monitors.
 *
 * These types are deliberately small and reuse the existing PosOrderItem
 * shape from order-actions.ts. Monitoring-specific fields (station-level
 * preparation status, elapsed-time buckets) are additional, not replacements.
 */

/** Stock status derived from quantity + min_stock (reorder_level). */
export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface StockItem {
  id: string;
  product_id: string;
  name: string;
  category: string;
  quantity: number;
  min_stock: number;
  is_active: boolean;
  updated_at: string;
}

/** Result of classifying a single order item for a monitor. */
export interface MonitorItem {
  /** Original order item id (stable identity across monitors). */
  itemId: string;
  /** Original order identity — the same order number/id is shown on both monitors for mixed orders. */
  orderId: string;
  orderNumber: string;
  orderTime: string;
  orderSource: string;
  location: string | null;
  departmentStatus: DepartmentStatus;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  /** Station/taxonomy classification for routing. Populated at order creation. */
  areaCode: string | null;
  /** Station/taxonomy label for display. */
  areaName: string | null;
  /** Station-level preparation status (independent from the other station). */
  preparationStatus: PreparationStatus;
  /** Station-level human-readable label. */
  preparationLabel: string;
  specialInstructions: string | null;
  /** How long ago the order was placed (seconds). Used for elapsed-time display. */
  elapsedSeconds: number;
  /** If true, the item is new/just received and not yet "Preparing". */
  isNew: boolean;
}

export type DepartmentStatus = "order_placed" | "preparing" | "serving" | "served";

export type PreparationStatus = "new" | "preparing" | "ready" | "completed" | "cancelled";

export interface MonitorCard {
  items: MonitorItem[];
  /** The original order identity shared by all items in the same order. */
  orderId: string;
  orderNumber: string;
  orderTime: string;
  /** Orders with both stations present are listed on both monitors but shown once. */
  canShowOnMonitor: boolean;
}

export interface MonitorOrdering {
  /** Whether the card is a brand-new/just-received order. */
  isNew: boolean;
  /** Elapsed time since the order was placed, ascending (most recent last). */
  elapsedSeconds: number;
  /** Stable slot for stable DOM ordering across refetches. */
  orderId: string;
}

export interface MonitorData {
  /** Orders eligible for this station. */
  orders: MonitorCard[];
  /** Low-stock items for this station (from pos_inventory). */
  stockItems: StockItem[];
  /** Out-of-stock items for this station (hard zero). */
  outOfStockItems: StockItem[];
  /** Combined (sorted) list used for display with stock coverage. */
  stockViewItems: StockItem[];
  /** Items that could not be routed to this station because of missing or invalid area assignment. */
  unassignedItems: MonitorItem[];
  /** Elapsed time buckets in seconds, shared by both monitors. */
  elapsedBuckets: number[];
}

export interface MonitorPrefs {
  /** Latest preparation-status update the client has acknowledged (for idempotent PUT). */
  lastStatusUpdate: Record<string, string>;
  /** Last time the full data snapshot was fetched (UTC ms). Used for reconcile. */
  lastSnapshotAt: number;
}

/** Identifies which station this monitor belongs to. */
export type Station = "kitchen" | "bar";

export interface MonitorRouteMeta {
  station: Station;
  /** URL path for this monitor. */
  path: string;
  /** Human label shown in the UI. */
  label: string;
  /** Icon, from lucide-react. */
  icon: string;
  /** Role required for status-updating actions. */
  updateRole: UserRole[];
}

export type UserRole = "cashier" | "management" | "partner" | "crew";

export const STATION_UPDATE_ROLES = {
  kitchen: [
    { role: "management" as UserRole, label: "Management" },
    { role: "partner" as UserRole, label: "Partner" },
  ],
  bar: [
    { role: "management" as UserRole, label: "Management" },
    { role: "crew" as UserRole, label: "Crew" },
  ],
} as const;
