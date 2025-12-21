import * as React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`h-10 w-full rounded-md border bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[color:var(--muted)] border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
