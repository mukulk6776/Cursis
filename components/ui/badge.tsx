import * as React from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant =
  | 'default'
  | 'solid'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'success'
  | 'warning';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function badgeVariants(variant: BadgeVariant = 'default', className?: string): string {
  return cn('ui-badge', `ui-badge--${variant}`, className);
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return <span ref={ref} className={badgeVariants(variant, className)} {...props} />;
  }
);

Badge.displayName = 'Badge';
