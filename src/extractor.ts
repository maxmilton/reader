// oxlint-disable typescript/prefer-for-of

// Import source for better build optimization (especially const enum inlining).
import { type Node, parse, SyntaxKind, type Tag } from "@maxmilton/html-parser/src/index.ts";
import { create } from "stage1/fast";

const BLOCK_ELEMENTS = new Set([
  "address",
  "article",
  // "aside",
  "blockquote",
  // "canvas",
  "dd",
  "div",
  "dl",
  "fieldset",
  // "figcaption",
  // "figure",
  "footer",
  // "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hgroup",
  "hr",
  "li",
  "main",
  // "nav",
  // "noscript",
  "ol",
  "output",
  "p",
  "pre",
  "section",
  "table",
  "tfoot",
  "ul",
]);
const EXTRANEOUS_ELEMENTS = new Set([
  "!--",
  "aside",
  "button",
  "canvas",
  "embed",
  "figcaption",
  "figure",
  "form",
  "head",
  "iframe",
  "input",
  "nav",
  "noscript",
  "script",
  "style",
  "svg",
  "textarea",
]);
// FIXME: Needs more real-world testing as false positives are possible
//  ↳ Might need some kind of scoring logic to determine confidence
//  ↳ What if the user wants to read comments? Should the matching be different
//    if the input is the user selection?
const EXTRANEOUS_CLASSES =
  /comment|communit|contact|disqus|donat|extra|fundrais|meta|pager|pagination|popup|promo|related|remark|rss|share|shout|sidebar|sponsor|social|tags|tool|widget/iu;
const SKIP = true;

const textarea = create("textarea");

function decodeHTMLEntities(html: string) {
  // nosemgrep: insecure-document-method
  textarea.innerHTML = html;
  return textarea.value;
}

// oxlint-disable-next-line typescript/consistent-return
function attributeValue(node: Tag, name: string): string | undefined {
  for (let index = node.attributes.length - 1; index >= 0; index--) {
    const attr = node.attributes[index];
    if (attr.name.value === name) return attr.value?.value;
  }
}

function walk(
  nodes: Node[],
  parent: Tag | undefined,
  enter: (node: Node, parent: Tag | undefined) => undefined | typeof SKIP,
  leave?: (node: Node) => void,
) {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    if (enter(node, parent) === SKIP) continue;

    if (node.type === SyntaxKind.Tag) {
      const body = node.body;
      if (body?.length) walk(body, node, enter, leave);
    }

    leave?.(node);
  }
}

/**
 * Attempt to extract the main content of a given HTML document.
 *
 * @param html - HTML markup. This should come from the browser after the page
 * is rendered to guaranty the markup is well-formed and safe.
 * @returns The main content of the document.
 */
export function extractText(html: string): string {
  const ast = parse(html);

  const tagById: Record<string, Tag | undefined> = {};
  const articles: Tag[] = [];
  const mains: Tag[] = [];
  let body: Tag | undefined;

  // First pass; collect references
  walk(ast, undefined, (node) => {
    if (node.type === SyntaxKind.Tag) {
      switch (node.name) {
        case "article":
          articles.push(node);
          break;
        case "body":
          body = node;
          break;
        case "main":
          mains.push(node);
          break;
        default:
          break;
      }

      const attrId = attributeValue(node, "id");
      if (attrId) {
        tagById[attrId] = node;
      }
    }
  });

  // Choose the best root node:
  //  1. <article> element if there is only one
  //  2. Element with id = article
  //  3. Element with id = post
  //  4. Element with id = content
  //  5. Element with id = main
  //  6. <main> element if there is only one
  //  7. Element with id = app
  //  8. Element with id = root
  //  9. <body> element (always defined)
  const root =
    articles.length === 1
      ? articles[0]
      : (tagById["article"] ??
        tagById["post"] ??
        tagById["content"] ??
        tagById["main"] ??
        (mains.length === 1 ? mains[0] : (tagById["app"] ?? tagById["root"] ?? body!)));
  let text = "";

  // Second pass; clean up superfluous nodes and extract meaningful text
  walk(
    root.body!,
    root,
    // oxlint-disable-next-line typescript/consistent-return
    (node, parent) => {
      if (node.type === SyntaxKind.Tag) {
        if (
          EXTRANEOUS_ELEMENTS.has(node.name) ||
          (node.name === "footer" && parent?.name !== "blockquote") ||
          EXTRANEOUS_CLASSES.test(attributeValue(node, "class") ?? "")
        ) {
          return SKIP;
        }
      } else {
        // Add text with consecutive whitespace collapsed
        text += (
          node.value.indexOf("&") === -1 // oxlint-disable-line typescript/prefer-includes
            ? node.value
            : decodeHTMLEntities(node.value)
        ).replace(/\s+/gu, " ");
      }
    },
    (node) => {
      if (node.type === SyntaxKind.Tag && BLOCK_ELEMENTS.has(node.name)) {
        // Add double space (which is turned into a newline later)
        text += "  ";
      }
    },
  );

  // console.log(stringify(root, html));
  // console.log(root);

  return (
    text
      .trim()
      // ensure single consecutive \n padded with space
      .replace(/[\n ]{2,}/gu, " \n ")
      // fix missing space around em dashes
      .replace(/(\S)—(\S)/gu, "$1 — $2")
  );
}

// // Simple stringify AST to prettified HTML-like structure for debugging
// function stringify(node: Node, html: string, level = 1): string {
//   if (node.type === SyntaxKind.Text) return node.value.replace(/\s+/gu, " ");
//   if (node.name === "!--") return html.slice(node.start, node.end);
//
//   const attrs = node.attributes.map((attr) => html.slice(attr.start, attr.end)).join(" ");
//   const head = `<${node.rawName}${attrs ? ` ${attrs}` : ""}>`;
//
//   if (!node.body || node.body.length === 0) return head;
//
//   return (
//     // oxlint-disable-next-line prefer-template - template string breaks after minification
//     head +
//     "\n" +
//     "  ".repeat(level) +
//     node.body
//       .filter((n) => !(n.type === SyntaxKind.Text && n.value.trim() === ""))
//       .map((n) => stringify(n, html, level + 1))
//       .join("\n" + "  ".repeat(level)) +
//     "\n" +
//     "  ".repeat(level - 1) +
//     "</" +
//     node.rawName +
//     ">"
//   );
// }
