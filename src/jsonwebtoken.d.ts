declare module 'jsonwebtoken';

declare module 'next/headers' {
  export function cookies(): any | Promise<any>;
}

declare module '@payload-config' {
  const config: any;
  export default config;
}
