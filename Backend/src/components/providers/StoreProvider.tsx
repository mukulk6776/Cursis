"use client";

import React from "react";
import { usePlatformStore } from "@/lib/store";

export function StoreProvider({
  initialData,
  children,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData: any;
  children: React.ReactNode;
}) {
  React.useState(() => {
    usePlatformStore.getState().initializeStore(initialData);
    return true;
  });

  return <>{children}</>;
}
