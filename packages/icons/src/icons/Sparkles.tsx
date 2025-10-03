import * as React from 'react';
import { Icon, IconProps } from '../Icon';

export function Sparkles(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3v4m0 10v4m9-9h-4M7 12H3m13.657 5.657-2.829-2.829M8.172 8.172 5.343 5.343m0 13.314 2.829-2.829m8.486-8.486 2.829-2.829" />
    </Icon>
  );
}
