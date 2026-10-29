import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, InputHTMLAttributes, forwardRef } from "react";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",
    secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200",
    ghost: "text-slate-600 hover:bg-slate-100",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  return <button className={cn(base, variants[variant], className)} {...props} />;
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100",
          className
        )}
        {...props}
      />
    );
  }
);

export function Label({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("mb-1 block text-sm font-medium text-slate-700", className)}>
      {children}
    </label>
  );
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-5 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  color = "slate",
}: {
  children: React.ReactNode;
  color?: "slate" | "blue" | "green" | "yellow" | "red";
}) {
  const colors = {
    slate: "bg-slate-100 text-slate-700",
    blue: "bg-brand-100 text-brand-700",
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-800",
    red: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        colors[color]
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{titulo}</h1>
        {descripcion && <p className="mt-1 text-sm text-slate-500">{descripcion}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function EmptyState({
  titulo,
  descripcion,
}: {
  titulo: string;
  descripcion?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <p className="text-sm font-medium text-slate-700">{titulo}</p>
      {descripcion && <p className="mt-1 text-sm text-slate-500">{descripcion}</p>}
    </div>
  );
}
