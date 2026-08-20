import type { LucideIcon } from "lucide-react";
import { SidebarItem } from "@/components/navigation/SidebarItem";

export type SidebarNavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type SidebarSectionProps = {
  label: string;
  items: SidebarNavigationItem[];
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
};

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarSection({ label, items, pathname, collapsed, onNavigate }: SidebarSectionProps) {
  return (
    <section className={collapsed ? "border-t border-slate-200 pt-3" : "space-y-1"}>
      <h2 className={collapsed ? "sr-only" : "px-3 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400"}>
        {label}
      </h2>
      <div className="space-y-1">
        {items.map((item) => (
          <SidebarItem
            key={item.href}
            {...item}
            active={isActivePath(pathname, item.href)}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </section>
  );
}
