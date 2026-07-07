import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "success";
export type ButtonSize = "sm" | "md";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-[#0f1c3a] text-white hover:bg-[#16264d]",
  secondary: "border border-slate-300 text-slate-700 hover:bg-slate-50",
  danger: "text-red-600 hover:bg-red-50",
  ghost: "text-slate-600 hover:bg-slate-100",
  success: "border border-emerald-200 text-emerald-700 hover:bg-emerald-50",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
};

const ICON_SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
};

function buttonClassName(variant: ButtonVariant, size: ButtonSize, className: string) {
  return `inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]} ${className}`;
}

interface CommonProps {
  icon?: LucideIcon;
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

export function Button({
  icon: Icon,
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: CommonProps & ComponentPropsWithoutRef<"button">) {
  return (
    <button className={buttonClassName(variant, size, className)} {...props}>
      {Icon && <Icon className={ICON_SIZE_CLASSES[size]} strokeWidth={1.75} />}
      {children}
    </button>
  );
}

export function ButtonLink({
  icon: Icon,
  variant = "primary",
  size = "md",
  className = "",
  href,
  children,
}: CommonProps & { href: string; className?: string }) {
  return (
    <Link href={href} className={buttonClassName(variant, size, className)}>
      {Icon && <Icon className={ICON_SIZE_CLASSES[size]} strokeWidth={1.75} />}
      {children}
    </Link>
  );
}
