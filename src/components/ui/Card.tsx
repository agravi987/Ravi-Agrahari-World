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
        "rounded-2xl border border-indigo-400/20 bg-gradient-to-b from-slate-900/90 via-[#11192e]/85 to-slate-950/90 backdrop-blur-md shadow-card transition-all",
        hover &&
          "duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:from-slate-900/95 hover:via-[#15203b]/95 hover:to-slate-950/95 hover:shadow-[0_8px_30px_rgba(99,102,241,0.2)]",
        className
      )}
      {...rest}
    />
  );
}
