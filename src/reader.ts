import './css/index.xcss';

import { append, fragment, handleClick, ONCLICK } from 'stage1/fast';
import { Footer } from './components/Footer.ts';
import { Reader } from './components/Reader.ts';

declare global {
  interface HTMLElement {
    /** `stage1` synthetic click event handler. */
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    [ONCLICK]?(event: MouseEvent): false | void | Promise<void>;
  }
}

const container = fragment();

append(Reader(), container);
append(Footer(), container);
append(container, document.body);

document.onclick = handleClick;
