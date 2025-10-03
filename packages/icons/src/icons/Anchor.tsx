import * as React from 'react';
import { Icon, IconProps } from '../Icon';

export function Anchor(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v13m0 0c-3 0-7-3-7-7H3m9 7c3 0 7-3 7-7h2" />
    </Icon>
  );
}
