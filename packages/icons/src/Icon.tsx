import * as React from 'react';

export type IconProps = {
  size?: number | 'sm' | 'md' | 'lg';
  title?: string;
} & React.SVGProps<SVGSVGElement>;

const sizeMap = {
  sm: 16,
  md: 20,
  lg: 24,
} as const;

export const Icon = React.forwardRef<SVGSVGElement, IconProps>(({ size = 'md', title, children, ...props }, ref) => {
  const finalSize = typeof size === 'number' ? size : sizeMap[size] ?? 20;
  return (
    <svg
      ref={ref}
      width={finalSize}
      height={finalSize}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}>
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
});

Icon.displayName = 'Icon';
