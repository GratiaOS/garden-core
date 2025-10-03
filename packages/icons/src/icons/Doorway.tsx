import * as React from 'react';
import { Icon, IconProps } from '../Icon';

export function Doorway(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="8" y="3" width="8" height="18" rx="1" />
      <path d="M12 15v.01" />
    </Icon>
  );
}
