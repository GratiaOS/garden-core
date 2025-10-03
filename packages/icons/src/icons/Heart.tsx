import * as React from 'react';
import { Icon, IconProps } from '../Icon';

export function Heart(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8z" />
    </Icon>
  );
}
