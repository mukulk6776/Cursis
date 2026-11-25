'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TabsContextValue {
  value: string;
  onValueChange: (val: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (val: string) => void;
}

export function Tabs({
  value,
  defaultValue = '',
  onValueChange,
  className,
  children,
  ...props
}: TabsProps) {
  const [internal, setInternal] = React.useState(defaultValue);
  const activeValue = value !== undefined ? value : internal;

  const handleChange = React.useCallback(
    (next: string) => {
      if (value === undefined) setInternal(next);
      onValueChange?.(next);
    },
    [value, onValueChange]
  );

  return (
    <TabsContext.Provider value={{ value: activeValue, onValueChange: handleChange }}>
      <div className={cn(className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} role="tablist" className={cn('ui-tabs-list', className)} {...props} />
  )
);
TabsList.displayName = 'TabsList';

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, onClick, ...props }, ref) => {
    const ctx = React.useContext(TabsContext);
    const active = ctx?.value === value;
    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={active}
        data-state={active ? 'active' : 'inactive'}
        className={cn('ui-tabs-trigger', className)}
        onClick={(e) => {
          ctx?.onValueChange(value);
          onClick?.(e);
        }}
        {...props}
      />
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, ...props }, ref) => {
    const ctx = React.useContext(TabsContext);
    if (ctx?.value !== value) return null;
    return <div ref={ref} role="tabpanel" className={cn(className)} {...props} />;
  }
);
TabsContent.displayName = 'TabsContent';
