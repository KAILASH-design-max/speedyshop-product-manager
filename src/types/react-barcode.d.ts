declare module 'react-barcode' {
  import React from 'react';

  interface BarcodeProps {
    value: string;
    renderer?: 'svg' | 'canvas' | 'img';
    format?: string;
    width?: number;
    height?: number;
    displayValue?: boolean;
    fontOptions?: string;
    font?: string;
    textAlign?: string;
    textPosition?: string;
    textMargin?: number;
    fontSize?: number;
    background?: string;
    lineColor?: string;
    margin?: number;
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;
  }

  const Barcode: React.FC<BarcodeProps>;
  export default Barcode;
}
