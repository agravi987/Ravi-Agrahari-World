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
        "rounded-2xl border border-card-border/80 bg-card/85 backdrop-blur-md shadow-card transition-colors",
        hover &&
          "transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:bg-card/95 hover:shadow-card-hover",
        className
      )}
      {...rest}
    />
  );
}
