import type { ReactNode } from "react";

type IconProps = { size?: number; className?: string };

function Svg({ size = 20, className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

export const WatchIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="6" y="6" width="12" height="12" rx="3" />
    <path d="M9 6V3h6v3M9 18v3h6v-3M12 10v2.2l1.4 1.3" />
  </Svg>
);

export const EarbudsIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7.5 4A3.5 3.5 0 0 0 4 7.5v1A3.5 3.5 0 0 0 7.5 12H8v7a1.5 1.5 0 0 0 3 0V7.5A3.5 3.5 0 0 0 7.5 4Z" />
    <path d="M16.5 4A3.5 3.5 0 0 1 20 7.5v1a3.5 3.5 0 0 1-3.5 3.5H16v7a1.5 1.5 0 0 1-3 0V7.5A3.5 3.5 0 0 1 16.5 4Z" />
  </Svg>
);

export const PlugIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 2.5v4.5M15 2.5v4.5M6 7h12v4a6 6 0 0 1-12 0V7ZM12 17v4.5" />
  </Svg>
);

export const BagIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5.5 7.5h13l-1 13h-11l-1-13Z" />
    <path d="M9 7.5a3 3 0 0 1 6 0" />
  </Svg>
);

export const SearchIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4-4" />
  </Svg>
);

export const CartIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 4h2.2l2.3 10.6a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 1.9-1.5L20.8 8H6.1" />
    <circle cx="10" cy="20" r="1.3" />
    <circle cx="17.4" cy="20" r="1.3" />
  </Svg>
);

export const MenuIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);

export const CloseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const SparkleIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.5 13.8 10.2 20.5 12l-6.7 1.8L12 20.5l-1.8-6.7L3.5 12l6.7-1.8L12 3.5Z" />
  </Svg>
);

export const TruckIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 6.5h11v9.5H3zM14 9.5h3.8l3.2 3.3V16h-7" />
    <circle cx="7" cy="18" r="1.7" />
    <circle cx="17" cy="18" r="1.7" />
  </Svg>
);

export const CashIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.4" />
    <path d="M6.5 9.5v5M17.5 9.5v5" />
  </Svg>
);

export const PhoneIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 4h3.6l1.8 4.6-2.3 1.4a11 11 0 0 0 5.9 5.9l1.4-2.3 4.6 1.8V19a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
  </Svg>
);

export const DeviceIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
    <path d="M10.5 18.5h3" />
  </Svg>
);

export const TagIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 12.2V4h8.2l8.8 8.8-8.2 8.2-8.8-8.8Z" />
    <circle cx="8" cy="8.5" r="1.3" />
  </Svg>
);

export const ChevronLeftIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m15 5-7 7 7 7" />
  </Svg>
);

export const ChevronRightIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m9 5 7 7-7 7" />
  </Svg>
);
