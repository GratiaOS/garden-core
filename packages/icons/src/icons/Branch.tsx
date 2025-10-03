import * as React from 'react';
import { Icon, IconProps } from '../Icon';

export function Branch(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3v6m0 0c-3 0-5 2-5 5s2 5 5 5 5-2 5-5" />
      <circle cx="12" cy="14" r="1" />
    </Icon>
  );
}
