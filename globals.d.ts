import type { ONCLICK } from "stage1/fast";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly APP_RELEASE: string;
      CI?: string; // GitHub Actions
    }
  }

  interface HTMLElement {
    /** `stage1` synthetic click event handler. */
    // oxlint-disable-next-line typescript/no-invalid-void-type
    [ONCLICK]?: (event: Event) => false | void | Promise<void>;
  }
}
