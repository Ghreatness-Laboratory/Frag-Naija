"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Newspaper, Radio, Zap, ShoppingBag, HelpCircle } from "lucide-react";

const sideItems = [
  { icon: User,        label: "ACTIVE",  href: "/athletes",        active: true  },
  { icon: Newspaper,   label: "NEWS",    href: "/highlights",      active: false },
  { icon: Radio,       label: "LIVE",    href: "/tournaments",     active: false },
  { icon: Zap,         label: "WAGER",   href: "/wager",           active: false },
  { icon: ShoppingBag, label: "SHOP",    href: "#",                active: false },
  { icon: HelpCircle,  label: "HELP",    href: "#",                active: false },
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside className="fixed left-0 top-14 bottom-0 z-30 w-12 lg:w-14 bg-fn-dark border-r border-fn-gborder flex flex-col items-center py-3 gap-1">
      {sideItems.map(({ icon: Icon, label, href }) => {
        const isActive =
          href !== "#" &&
          (path === href || (href !== "/" && path.startsWith(href)));
        return (
          <Link
            key={label}
            href={href}
            title={label}
            className={`group relative w-9 h-9 flex flex-col items-center justify-center rounded-sm transition-all ${
              isActive
                ? "bg-fn-green/15 text-fn-green border border-fn-gborder"
                : "text-fn-muted hover:text-fn-text hover:bg-white/5"
            }`}
          >
            <Icon size={15} strokeWidth={isActive ? 2.5 : 1.5} />
            <span className="text-[6px] tracking-widest mt-0.5 leading-none">{label}</span>

            {/* Tooltip on hover — desktop only */}
            <span className="hidden lg:block absolute left-full ml-2 px-2 py-1 bg-fn-card border border-fn-gborder text-[9px] text-fn-text tracking-widest uppercase whitespace-nowrap rounded-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {label}
            </span>

            {/* Active indicator */}
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-fn-green rounded-r-full" />
            )}
          </Link>
        );
      })}

      {/* Version tag */}
      <div className="mt-auto mb-1">
        <span className="text-[7px] text-fn-muted tracking-widest rotate-90 block" style={{ writingMode: "vertical-rl" }}>
          V2.4
        </span>
      </div>
    </aside>
  );
}
