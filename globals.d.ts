import type { ONCLICK } from 'stage1/fast';

declare global {
  interface HTMLElement {
    /** `stage1` synthetic click event handler. */
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    [ONCLICK]?(event: MouseEvent): false | void | Promise<void>;
  }
}
