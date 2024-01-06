import './css/index.xcss';

import { append, createFragment, setupSyntheticEvent } from 'stage1';
import { Footer } from './components/Footer';
import { Reader } from './components/Reader';

declare global {
  interface HTMLElement {
    /** `stage1` synthetic click event handler. */
    __click?(event: MouseEvent): void | Promise<void>;
  }
}

const frag = createFragment();

append(Reader(), frag);
append(Footer(), frag);
append(frag, document.body);

setupSyntheticEvent('click');
