declare module 'react-window' {
  import { ComponentType, CSSProperties } from 'react';

  export interface ListChildComponentProps {
    data: any;
    index: number;
    isScrolling: boolean;
    key: React.Key;
    style: CSSProperties;
  }

  export interface ListProps {
    children: ComponentType<ListChildComponentProps>;
    height: number;
    itemCount: number;
    itemData?: any;
    itemSize: number | ((args: { index: number; size: number }) => number);
    width: number | string;
    className?: string;
    layout?: 'horizontal' | 'vertical';
  }

  export class FixedSizeList extends React.Component<ListProps> {}

  export const FixedSizeGrid: React.ComponentType<any>;
  export const VariableSizeList: React.ComponentType<any>;
  export const VariableSizeGrid: React.ComponentType<any>;
  export const areEqual: any;
  export default FixedSizeList;
}
