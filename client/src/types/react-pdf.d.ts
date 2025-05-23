declare module 'react-pdf' {
  import { ComponentType, ReactElement } from 'react';

  export interface DocumentProps {
    file: string | { url: string } | ArrayBuffer;
    onLoadSuccess?: (pdf: { numPages: number }) => void;
    loading?: ReactElement;
    children?: React.ReactNode;
  }

  export interface PageProps {
    pageNumber: number;
    className?: string;
    loading?: ReactElement;
  }

  export const Document: ComponentType<DocumentProps>;
  export const Page: ComponentType<PageProps>;
} 