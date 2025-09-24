import * as React from "react";

/** A minimal Slot primitive to forward props to child (like Radix Slot) */
export interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}
export const Slot = React.forwardRef<HTMLElement, SlotProps>(function Slot(
  { children, ...rest },
  ref
) {
  if (React.isValidElement(children)) {
    return React.cloneElement(children as any, { ref, ...rest });
  }
  return <span ref={ref as any} {...rest}>{children}</span>;
});