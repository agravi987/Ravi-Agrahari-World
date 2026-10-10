/**
 * Card.tsx — UI primitive (plan S2/§4)
 * White surface, consistent radius + shadow scale, optional
 * hover lift with accent border. `hover={false}` disables lift
 * (used where cards sit inside interactive parents, e.g. galaxy).
 */
import { clsx } from "clsx";
import type { ComponentPropsWithoutRef } from "react";

interface CardProps extends ComponentPropsWithoutRef<"div"> {
  hover?: boolean;
}

export default function Card({ hover = true, className, ...rest }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-indigo-400/30 bg-gradient-to-br from-indigo-900/40 via-purple-900/30 to-blue-900/40 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(79,70,229,0.22)] transition-all",
        hover &&
          "duration-300 hover:-translate-y-1 hover:border-cyan-300/60 hover:from-indigo-800/55 hover:via-purple-800/45 hover:to-cyan-800/50 hover:shadow-[0_12px_40px_rgba(34,211,238,0.32)]",
        className
      )}
      {...rest}
    />
  );
}
