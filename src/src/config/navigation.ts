import { CalendarDays, CheckSquare, LayoutDashboard, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Accueil", icon: LayoutDashboard },
  { to: "/calendrier", label: "Calendrier", icon: CalendarDays },
  { to: "/taches", label: "Tâches", icon: CheckSquare },
  { to: "/parametres", label: "Paramètres", icon: Settings },
];
