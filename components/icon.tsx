import type { ComponentProps } from "react";
import SummitIcon, {
  type SummitIconName,
} from "@/app/(marketing)/_components/_primitives/SummitIcon";
import type { IconKey } from "@/lib/content";

/* Content declares its icons by key and the summit set draws every
   one of them, so the keys map straight through. Kept as an explicit
   record rather than a cast, so adding an IconKey fails the build
   until a glyph has actually been drawn for it. */
const ICONS: Record<IconKey, SummitIconName> = {
  "book-open": "book-open",
  "building-2": "building-2",
  crown: "crown",
  eye: "eye",
  gem: "gem",
  globe: "globe",
  handshake: "handshake",
  "layout-grid": "layout-grid",
  medal: "medal",
  "mic-2": "mic-2",
  monitor: "monitor",
  network: "network",
  ruler: "ruler",
  satellite: "satellite",
  "scan-line": "scan-line",
  "shield-check": "shield-check",
  "shopping-cart": "shopping-cart",
  target: "target",
  trophy: "trophy",
  truck: "truck",
  users: "users",
};

type IconProps = { name: IconKey } & Omit<ComponentProps<typeof SummitIcon>, "name">;

export default function Icon({ name, ...props }: IconProps) {
  return <SummitIcon name={ICONS[name]} {...props} />;
}
