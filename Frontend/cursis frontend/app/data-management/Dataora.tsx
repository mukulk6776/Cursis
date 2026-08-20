import type { Metadata } from "next";
import { DataManagementPage } from "@/components/marketing/DataManagementPage";

export const metadata: Metadata = {
  title: "Data Management | Cursis",
  description: "Bring your products, sales, customers, payments, inventory and expenses into one connected system.",
};

export default function DataManagement() {
  return <DataManagementPage />;
}
