import * as React from 'react';

type Variant = 'plain' | 'elev' | 'glow';
type Padding = 'none' | 'sm' | 'md' | 'lg';

export type CardProps<T extends React.ElementType = 'div'> = {
  as?: T;
  variant?: Variant;
  padding?: Padding;
  className?: string;
  children?: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

export function Card<T extends React.ElementType = 'div'>({ as, variant = 'elev', padding = 'md', className, children, ...rest }: CardProps<T>) {
  const Comp = (as || 'div') as React.ElementType;

  return (
    <Comp data-ui="card" data-variant={variant} data-padding={padding} className={className} {...rest}>
      {children}
    </Comp>
  );
}
