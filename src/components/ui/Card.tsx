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
        "rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-[#161338]/85 via-[#121534]/80 to-[#0e162e]/85 backdrop-blur-xl shadow-lg shadow-black/40 transition-all",
        hover &&
          "duration-300 hover:-translate-y-1 hover:border-indigo-400/40 hover:from-[#1c1846]/90 hover:via-[#161b40]/85 hover:to-[#121b3a]/90 hover:shadow-xl hover:shadow-black/50",
        className
      )}
      {...rest}
    />
  );
}
