declare module 'jsonwebtoken';

declare module 'next/headers' {
  export function cookies(): Promise<any> | any;
}
