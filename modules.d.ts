declare module 'bun' {
  interface Env {
    readonly APP_RELEASE: string;
  }
}

declare module '*.css' {
  const content: string;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.xcss' {
  const content: string;
  export default content;
}
