export type DashboardDataState = "loading" | "empty" | "error" | "ready";

export type DashboardMetric = {
  value: number;
  format?: "number" | "currency";
  currencyCode?: string;
  detail?: string;
};

export type DashboardStats = {
  sales: DashboardMetric;
  orders: DashboardMetric;
  customers: DashboardMetric;
  profit: DashboardMetric;
};

export type SalesData = {
  periodLabel: string;
};

export type Order = {
  id: string;
  customerName: string;
  status: string;
  amount: string;
  dateLabel: string;
};

export type OrdersOverviewData = {
  summary: string;
};

export type InventoryItem = {
  id: string;
  name: string;
  stockStatus: "low" | "out";
};

export type Product = {
  id: string;
  name: string;
  summary: string;
};

export type Customer = {
  id: string;
  name: string;
  summary: string;
};

export type Activity = {
  id: string;
  message: string;
  timeLabel: string;
};
