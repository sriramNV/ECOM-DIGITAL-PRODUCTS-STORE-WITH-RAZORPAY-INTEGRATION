import {
  LayoutDashboard, ShoppingBag, Tags, Users, FileText, Percent,
  BarChart3, ClipboardList, Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { label: "Products", href: "/admin/products", icon: Tags },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Content", href: "/admin/cms", icon: FileText },
  { label: "Promotions", href: "/admin/promotions", icon: Percent },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Logs", href: "/admin/logs", icon: ClipboardList },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];
