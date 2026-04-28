import {
  BookOpen,
  Building2,
  Crown,
  Eye,
  Gem,
  Globe,
  Handshake,
  LayoutGrid,
  Medal,
  Mic2,
  Monitor,
  Network,
  Ruler,
  Satellite,
  ScanLine,
  ShieldCheck,
  ShoppingCart,
  Target,
  Trophy,
  Truck,
  Users,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";
import type { IconKey } from "@/lib/content";

const ICONS: Record<IconKey, LucideIcon> = {
  "book-open": BookOpen,
  "building-2": Building2,
  crown: Crown,
  eye: Eye,
  gem: Gem,
  globe: Globe,
  handshake: Handshake,
  "layout-grid": LayoutGrid,
  medal: Medal,
  "mic-2": Mic2,
  monitor: Monitor,
  network: Network,
  ruler: Ruler,
  satellite: Satellite,
  "scan-line": ScanLine,
  "shield-check": ShieldCheck,
  "shopping-cart": ShoppingCart,
  target: Target,
  trophy: Trophy,
  truck: Truck,
  users: Users,
};

export default function Icon({ name, ...props }: { name: IconKey } & LucideProps) {
  const Component = ICONS[name];
  return <Component {...props} />;
}
