import * as React from "react";

export type ButtonTone = "default" | "accent" | "danger" | "subtle";
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;   // use with <Slot>
  tone?: ButtonTone;   // semantic intent
}

/**
 * Headless Button:
 * - no classes; only data attributes for styling hooks
 * - tone as semantic hint
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ asChild, tone = "default", children, ...rest }, ref) {
    const common = {
      ref,
      "data-ui": "button",
      "data-tone": tone,
      ...rest,
    } as const;

    if (asChild) {
      // consumer wraps with their element and styles using data attributes
      return React.createElement("span", common as any, children);
    }
    return React.createElement("button", common as any, children);
  }
);