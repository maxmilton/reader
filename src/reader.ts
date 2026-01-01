import "#css/index.xcss";

import { append, fragment, handleClick } from "stage1/fast";
import { Footer } from "#components/Footer.ts";
import { Reader } from "#components/Reader.ts";

const container = fragment();

append(Reader(), container);
append(Footer(), container);
append(container, document.body);

document.onclick = handleClick;
