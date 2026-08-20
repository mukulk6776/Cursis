"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";
import type { DashboardMetric } from "@/components/dashboard/types";

type AnimatedMetricValueProps = {
  data: DashboardMetric;
};

export function AnimatedMetricValue({ data }: AnimatedMetricValueProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      previousValue.current = data.value;
      return;
    }

    const controls = animate(previousValue.current, data.value, {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (value) => {
        setDisplayValue(value);
        previousValue.current = value;
      },
    });

    return () => controls.stop();
  }, [data.value, shouldReduceMotion]);

  const formattedValue = new Intl.NumberFormat(undefined, data.format === "currency"
    ? { style: "currency", currency: data.currencyCode ?? "USD", maximumFractionDigits: 0 }
    : { maximumFractionDigits: 0 },
  ).format(Math.round(shouldReduceMotion ? data.value : displayValue));

  return <>{formattedValue}</>;
}
