import './css/index.xcss';

import { append, fragment, setupSyntheticEvent } from 'stage1';
import { Footer } from './components/Footer.ts';
import { Reader } from './components/Reader.ts';

declare global {
  interface HTMLElement {
    /** `stage1` synthetic click event handler. */
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    __click?(event: MouseEvent): void | false | Promise<void>;
  }
}

const container = fragment();

append(Reader(), container);
append(Footer(), container);
append(container, document.body);

setupSyntheticEvent('click');
