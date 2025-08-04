declare module "bun" {
  interface Env {
    readonly APP_RELEASE: string;
  }
}

declare module "*.xcss" {
  const content: string;
  export default content;
}
