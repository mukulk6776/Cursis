import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StoreProvider } from "@/components/providers/StoreProvider";
import { getInitialData } from "@/app/actions";

export default async function HomePage() {
  const initialData = await getInitialData();

  return (
    <StoreProvider initialData={initialData}>
      <DashboardLayout />
    </StoreProvider>
  );
}
